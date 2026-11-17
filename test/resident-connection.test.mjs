import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { setImmediate as turn } from 'node:timers/promises';
import test from 'node:test';

// Exercise the actual public composition against controlled transport ports.
// The real supervisor/framing and browser/native runtime gates live in Chronolog.
const ports = Symbol.for('tendriller.contrib.resident-test-ports');
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@chronolog/transport-webrtc') return { url: 'resident-test:transport', shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === 'resident-test:transport') return { format: 'module', shortCircuit: true, source: `
      const ports = () => globalThis[Symbol.for('tendriller.contrib.resident-test-ports')];
      export const supervisePeerSession = options => options;
      export const createHttpWebRtcSignaling = options => ports().signaling(options);
      export const negotiateWebRtc = options => ports().negotiate(options);
    ` };
    return next(url, context);
  },
});
const { connectResidentWorker } = await import('../cookbooks/run-a-peer-application/snippets/connect-resident-worker.mjs');
hooks.deregister();

function fixture() {
  const rtc = new AbortController(), worker = new AbortController(), channel = { reliable: {}, live: {} };
  const observed = { signalingClosed: 0, rtcClosed: 0, workerClosed: 0, transferred: false };
  const attachment = { signal: worker.signal, async close() { observed.workerClosed++; worker.abort(); } };
  globalThis[ports] = {
    signaling: () => ({ stats: { requests: 1, requestBytes: 100, responseBytes: 100, closed: true },
      close() { observed.signalingClosed++; } }),
    async negotiate(options) {
      options.onDataChannels(channel);
      assert.equal(observed.transferred, true, 'The Worker port must transfer before the callback returns');
      return { signal: rtc.signal, signaling: { sentMessages: 1, receivedMessages: 1 }, async close() { observed.rtcClosed++; rtc.abort(); } };
    },
  };
  return { rtc, worker, channel, observed, attachment,
    connect(attach, timeoutMs = 1000) {
      return connectResidentWorker({ endpoint: 'https://resident.example/introduce', timeoutMs,
        retry: { initialDelayMs: 10, maxDelayMs: 20, maxAttempts: 2 }, attach(value, signal) {
          assert.equal(value, channel); observed.transferred = true; return attach(signal);
        } });
    } };
}

test('Worker authentication owns readiness and Worker termination ends a still-connected RTC session', async () => {
  const value = fixture();
  let acknowledge;
  const connection = value.connect(() => new Promise(resolve => { acknowledge = resolve; }));
  assert.equal(connection.readiness, 'authenticated');
  let ready = false;
  const opened = connection.connect(new AbortController().signal).then(session => { ready = true; return session; });
  await turn();
  assert.equal(ready, false, 'ICE completion is not authenticated Worker readiness');
  acknowledge(value.attachment);
  const session = await opened;
  value.worker.abort(new Error('Authenticated peer link ended'));
  assert.equal(session.signal.aborted, true);
  assert.equal(value.rtc.signal.aborted, false, 'The Worker lifetime is observed independently of ICE');
  await Promise.all([session.close(), session.close()]);
  assert.equal(value.observed.workerClosed, 1);
  assert.equal(value.observed.rtcClosed, 1);
});

test('a cancelled Worker handoff retires its RTC session and any late attachment', async () => {
  const value = fixture(), lifetime = new AbortController();
  let acknowledge;
  const connection = value.connect(() => new Promise(resolve => { acknowledge = resolve; }));
  const opened = connection.connect(lifetime.signal);
  await turn();
  lifetime.abort(new Error('Worker replaced'));
  await assert.rejects(opened, /Worker replaced/);
  assert.equal(value.observed.rtcClosed, 1);
  assert.equal(value.observed.signalingClosed, 1);
  acknowledge(value.attachment);
  await turn();
  assert.equal(value.observed.workerClosed, 1, 'A late reply cannot leak or revive its retired attachment');
});

test('a missing Worker acknowledgement has a bounded lifetime and releases negotiation resources', async () => {
  const value = fixture();
  const connection = value.connect(() => new Promise(() => {}), 10);
  await assert.rejects(connection.connect(new AbortController().signal), /RESIDENT_ATTACHMENT_TIMEOUT/);
  assert.equal(value.observed.rtcClosed, 1);
  assert.equal(value.observed.signalingClosed, 1);
});

test('a failed or unscoped authentication acknowledgement cannot become a supervised connection', async () => {
  for (const attach of [() => Promise.reject(new Error('Reader revoked')), () => Promise.resolve(undefined)]) {
    const value = fixture();
    await assert.rejects(value.connect(attach).connect(new AbortController().signal));
    assert.equal(value.observed.rtcClosed, 1);
    assert.equal(value.observed.signalingClosed, 1);
  }
});

test('negotiation failure after an already acknowledged Worker handoff fences and disposes that attachment once', async () => {
  const value = fixture();
  let attemptSignal;
  globalThis[ports].negotiate = async options => {
    options.onDataChannels(value.channel);
    await turn();
    throw new Error('ICE negotiation failed after handoff');
  };
  const connection = value.connect(signal => { attemptSignal = signal; return Promise.resolve(value.attachment); });
  await assert.rejects(connection.connect(new AbortController().signal), /ICE negotiation failed/);
  assert.equal(attemptSignal.aborted, true);
  assert.equal(value.observed.workerClosed, 1);
  assert.equal(value.observed.signalingClosed, 1);
});
