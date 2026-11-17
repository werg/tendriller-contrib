// Playwright uses a bounded fixture-only port to open and cut transport links.
// Ordinary application work goes through the public facade; the Worker owns
// peer authentication, signaling, history, and the only operation journal.
import { connectApplicationWorker, openBrowserDevice } from '@chronolog/peer-session/browser';
import { serveWorkerWebRtcConnections } from '@chronolog/peer-session/webrtc';

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
const create = (deviceName, provision) => new Worker(`/worker.mjs?${new URLSearchParams({ name: deviceName, create: String(provision) })}`, { type: 'module' });

globalThis.fixture = {
  async open({ deviceName, provision = false }) {
    name = deviceName; worker = create(name, provision);
    fixtureLifetime = new AbortController();
    rtcService = serveWorkerWebRtcConnections(worker, { signal: fixtureLifetime.signal });
    try { await ready(worker); application = await connectApplicationWorker(worker); }
    catch (error) { fixtureLifetime.abort(error); await rtcService.close(); worker.terminate(); throw error; }
    globalThis.application = application;
    resolveApplication(application);
    application.onRecovery(notice => notices.push(notice));
    application.onStatus(status => statuses.push(status));
    return { deviceId: application.deviceId, storageId: application.storageId, status: application.status,
      capabilities: application.capabilities, description: application.describe() };
  },
  async secondOwner() {
    const contender = create(name, false);
    try { await ready(contender); throw Error('FIXTURE_SECOND_OWNER_WAS_ALLOWED'); }
    catch (error) { return error.message; }
    finally { contender.terminate(); }
  },
  async windowStorage() {
    try { await openBrowserDevice({ name, create: true }); return 'unexpected-success'; }
    catch (error) { return error.message; }
  },
  async unsupportedStorage() {
    const contender = new Worker(`/worker.mjs?${new URLSearchParams({ name: `${name}-unsupported`, create: 'true', unsupported: 'true' })}`, { type: 'module' });
    try { await ready(contender); return 'unexpected-success'; }
    catch (error) { return error.message; }
    finally { contender.terminate(); }
  },
  connect: input => transportFault('connect', input),
  inspect: id => transportFault('inspect', { id }),
  disconnect: id => transportFault('disconnect', { id }),
  async close() {
    try { await application.close(); }
    finally {
      fixtureLifetime.abort(Error('FIXTURE_CLOSED'));
      await rtcService.close(); worker.terminate();
    }
  },
  async crash() {
    worker.terminate();
    fixtureLifetime.abort(Error('FIXTURE_WORKER_TERMINATED'));
    await rtcService.close();
  },
  observations: () => ({ notices, statuses, secureContext: isSecureContext, storage: !!navigator.storage?.getDirectory,
    locks: !!navigator.locks, userAgent: navigator.userAgent }),
};

// One request owns one port. These controls inject test faults only; they never
// submit, retry, persist, or authenticate application work on the page.
function transportFault(method, input) {
  fixtureLifetime.signal.throwIfAborted();
  if (pendingFaults >= 8) throw Error('FIXTURE_TRANSPORT_REQUEST_LIMIT');
  const channel = new MessageChannel(), owner = worker, signal = fixtureLifetime.signal;
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
