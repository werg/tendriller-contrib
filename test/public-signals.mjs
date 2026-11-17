// Runs in the temporary consumer that installed the built public SDK tarball.
// The in-process port qualifies binding composition, not network delivery.
import assert from 'node:assert/strict';
import { createSignalBinding, SignalError } from '@tendriller/core/signals';

const binding = createSignalBinding();
assert.equal(binding.available, false);
await assert.rejects(binding.send('typing', { typing: true }),
  error => error instanceof SignalError && error.code === 'signal_unavailable');
assert.throws(() => binding.subscribe(),
  error => error instanceof SignalError && error.code === 'signal_unavailable');

const value = { scope: 'public-artifact-binding', authorId: 'fixture-author', sessionId: 'fixture-session',
  sequence: 1, topic: 'typing', payload: { typing: true }, issuedAtMs: 1000, expiresAtMs: 3500 };
const controller = new AbortController();
const sendOptions = { ttlMs: 2500, signal: controller.signal };
const subscribeOptions = { topics: ['typing'], mode: 'latest', signal: controller.signal };
const service = {
  async send(topic, payload, options) {
    assert.equal(topic, value.topic);
    assert.deepEqual(payload, value.payload);
    assert.equal(options, sendOptions);
    return value;
  },
  async *subscribe(options) {
    assert.equal(options, subscribeOptions);
    yield value;
  },
};
const ready = binding.ready();
binding.install(service);
assert.equal(binding.available, true);
assert.equal(await ready, service);
assert.equal(await binding.send('typing', { typing: true }, sendOptions), value);
const iterator = binding.subscribe(subscribeOptions)[Symbol.asyncIterator]();
assert.deepEqual(await iterator.next(), { done: false, value });
assert.deepEqual(await iterator.next(), { done: true, value: undefined });
assert.throws(() => binding.install(service),
  error => error instanceof SignalError && error.code === 'signals_already_installed');
controller.abort();
process.stdout.write(JSON.stringify({ status: 'passed',
  scenarios: ['unconfigured signals fail immediately', 'explicit independent installation',
    'send and subscription delegate to the installed live port', 'second installation is rejected'],
  limits: ['SDK binding composition only; no network delivery, Chronolog authorization or RTC connectivity claim.'],
}) + '\n');
