// Playwright uses a bounded fixture-only port to open and cut transport links.
// Ordinary application work goes through the public facade; the Worker owns
// peer authentication, signaling, history, and the only operation journal.
import { connectApplicationWorker } from '@chronolog/peer-session/browser';
import { serveFixtureConnections } from './peer-generation-browser-transport.mjs';

let worker, application, name, rtcService, fixtureLifetime;
let pendingFaults = 0;
let resolveApplication;
export const applicationReady = new Promise(resolve => { resolveApplication = resolve; });
const notices = [], statuses = [];
const ready = candidate => new Promise((resolve, reject) => {
  const timer = setTimeout(() => finish(Error('FIXTURE_WORKER_START_TIMEOUT')), 30_000);
  const receive = event => {
    if (event.data?.type === 'fixture-ready') finish();
    if (event.data?.type === 'fixture-error') finish(Error(event.data.error));
  };
  const error = event => finish(Error(event.message || 'FIXTURE_WORKER_START_FAILED'));
  function finish(failure) {
    clearTimeout(timer); candidate.removeEventListener('message', receive); candidate.removeEventListener('error', error);
    if (failure) reject(failure); else resolve();
  }
  candidate.addEventListener('message', receive); candidate.addEventListener('error', error);
});
const create = (deviceName, provision, unsupported = false) => new Worker(`/worker.mjs?${new URLSearchParams({
  name: deviceName, create: String(provision), unsupported: String(unsupported),
})}`, { type: 'module' });

globalThis.fixture = {
  async open({ deviceName, provision = false }) {
    name = deviceName; worker = create(name, provision);
    fixtureLifetime = new AbortController();
    rtcService = serveFixtureConnections(worker, { signal: fixtureLifetime.signal });
    try { await ready(worker); application = await connectApplicationWorker(worker); }
    catch (error) { fixtureLifetime.abort(error); await rtcService?.close(); worker.terminate(); throw error; }
    globalThis.application = application;
    application.onRecovery(notice => notices.push(notice));
    application.onStatus(status => statuses.push(status));
    return { deviceId: application.deviceId, storageId: application.storageId, status: application.status,
      capabilities: application.capabilities, description: application.describe(), observation: await transportFault('observe', {}) };
  },
  // The harness first observes a live participant, then reveals the actual data UI.
  // Both use this exact facade and the same owning Worker.
  showApplication() { resolveApplication(application); },
  secondOwner: () => checkDataOwner(false),
  async windowStorage() {
    // This explicit misuse check is the only page import of the Worker surface.
    const { openBrowserDevice } = await import('@chronolog/peer-session/worker');
    try { await openBrowserDevice({ name, create: true }); return 'unexpected-success'; }
    catch (error) { return error.message; }
  },
  unsupportedStorage: () => checkDataOwner(true),
  connect: input => transportFault('connect', input),
  inspect: id => transportFault('inspect', { id }),
  synchronize: id => transportFault('synchronize', { id }),
  disconnect: id => transportFault('disconnect', { id }),
  async close() {
    try {
      const before = await transportFault('observe', {});
      await application.close();
      const locks = await navigator.locks.query();
      return { before, heldLocks: locks.held.filter(lock => lock.name === `chronolog:${name}`).map(lock => lock.name) };
    }
    finally {
      fixtureLifetime.abort(Error('FIXTURE_CLOSED'));
      await rtcService?.close(); worker.terminate();
    }
  },
  async crash() {
    worker.terminate();
    fixtureLifetime.abort(Error('FIXTURE_WORKER_TERMINATED'));
    await rtcService?.close();
  },
  observations: async () => ({ notices, statuses, secureContext: isSecureContext, storage: !!navigator.storage?.getDirectory,
    locks: !!navigator.locks, userAgent: navigator.userAgent, observation: await transportFault('observe', {}) }),
};

async function checkDataOwner(unsupported) {
  const contender = create(name, false, unsupported), lifetime = new AbortController();
  let client;
  try {
    await ready(contender); client = await connectApplicationWorker(contender);
    const before = await requestFixture(contender, lifetime.signal, 'observe', {});
    let error;
    try { await client.query('conversation', {}); }
    catch (failure) { error = failure.message; }
    if (!error) throw Error('FIXTURE_CONFLICTING_DATA_OWNER_WAS_ALLOWED');
    return { protocolOpened: true, deviceId: client.deviceId, storageId: client.storageId, before, error,
      after: await requestFixture(contender, lifetime.signal, 'observe', {}) };
  } finally {
    try { await client?.close(); }
    finally { lifetime.abort(Error('FIXTURE_CHECK_COMPLETE')); contender.terminate(); }
  }
}

// One request owns one port. These controls inject test faults only; they never
// submit, retry, persist, or authenticate application work on the page.
function transportFault(method, input) {
  return requestFixture(worker, fixtureLifetime.signal, method, input);
}
function requestFixture(owner, signal, method, input) {
  signal.throwIfAborted();
  if (pendingFaults >= 8) throw Error('FIXTURE_TRANSPORT_REQUEST_LIMIT');
  const channel = new MessageChannel();
  pendingFaults++;
  return new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => finish(Error('FIXTURE_TRANSPORT_REQUEST_TIMEOUT')), 60_000);
    const abort = () => finish(signal.reason);
    const failure = event => finish(Error(event.message || 'FIXTURE_WORKER_FAILED'));
    function finish(error, value) {
      if (done) return; done = true; pendingFaults--; clearTimeout(timer);
      signal.removeEventListener('abort', abort); owner.removeEventListener('error', failure);
      channel.port1.close(); channel.port2.close();
      if (error) reject(error); else resolve(value);
    }
    channel.port1.onmessage = event => {
      if (event.data?.ok === true) finish(null, event.data.value);
      else finish(Error(event.data?.error ?? 'FIXTURE_TRANSPORT_RESPONSE_INVALID'));
    };
    channel.port1.onmessageerror = () => finish(Error('FIXTURE_TRANSPORT_RESPONSE_INVALID'));
    signal.addEventListener('abort', abort, { once: true }); owner.addEventListener('error', failure, { once: true });
    try { owner.postMessage({ type: 'fixture-transport', method, input, port: channel.port2 }, [channel.port2]); }
    catch (error) { finish(error); }
  });
}
