// Playwright calls these fixture lifecycle methods, then the actual public
// application facade directly. There is no application-owned RPC or retry map.
import { connectApplicationWorker, openBrowserDevice, serveApplicationWorkerHost } from '@chronolog/peer-session/browser';
import { connectWorkerApplicationWebRtc } from '@chronolog/peer-session/webrtc';

let worker, application, hostBridge, name;
let resolveApplication;
export const applicationReady = new Promise(resolve => { resolveApplication = resolve; });
const links = new Map();
const notices = [], statuses = [], connectionFailures = [], startup = [];
const ready = candidate => new Promise((resolve, reject) => {
  const timer = setTimeout(() => finish(Error('FIXTURE_WORKER_START_TIMEOUT')), 30_000);
  const receive = event => {
    if (event.data?.type === 'fixture-stage' && startup.length < 64) startup.push(event.data.stage);
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
    hostBridge = serveApplicationWorkerHost(worker, {
      application: () => request('/control/application'),
      definition: () => request('/control/definition'),
      configureApplication: configuration => request('/control/configuration', configuration),
      selectGeneration: transition => request('/control/generations', transition),
    });
    try { await ready(worker); application = await connectApplicationWorker(worker); }
    catch (error) { hostBridge.close(); worker.terminate(); throw error; }
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
  async connect({ id, peerId, role }) {
    const base = `/signaling/${id}`;
    const signaling = {
      messages: { async *[Symbol.asyncIterator]() { const description = await request(`${base}/next`); if (description) yield description; } },
      send: description => request(`${base}/send`, description),
      close: () => request(`${base}/close`, {}),
    };
    const states = [], candidates = [];
    let link;
    try {
      link = await connectWorkerApplicationWebRtc(worker, { role, signaling, expectedPeerId: peerId, timeoutMs: 30_000,
        createPeerConnection(configuration) {
          const peer = new RTCPeerConnection(configuration);
          for (const name of ['icegatheringstatechange', 'iceconnectionstatechange', 'connectionstatechange']) peer.addEventListener(name, () => {
            if (states.length < 64) states.push({ event: name, gathering: peer.iceGatheringState, ice: peer.iceConnectionState, connection: peer.connectionState });
          });
          peer.addEventListener('icecandidate', event => {
            if (event.candidate && candidates.length < 32) candidates.push({ type: event.candidate.type, protocol: event.candidate.protocol });
          });
          peer.addEventListener('icecandidateerror', event => {
            if (states.length < 64) states.push({ event: 'icecandidateerror', code: event.errorCode, message: event.errorText });
          });
          return peer;
        } });
    } catch (error) {
      connectionFailures.push({ id, role, message: error.message, states, candidates });
      throw error;
    }
    links.set(id, link);
    return { peerId: link.peerId, stats: link.stats, route: await link.rtc.getRoute(), signaling: link.rtc.signaling };
  },
  async inspect(id) {
    const link = links.get(id);
    await link.synchronize();
    return { peerId: link.peerId, stats: link.stats, route: await link.rtc.getRoute(), closed: link.signal.aborted };
  },
  async disconnect(id) { const link = links.get(id); if (link) { await link.close(); links.delete(id); } },
  async close() {
    await Promise.all([...links.values()].map(link => link.close())); links.clear();
    await application.close(); hostBridge.close(); worker.terminate();
  },
  crash() { worker.terminate(); hostBridge.close(); },
  observations: () => ({ notices, statuses, connectionFailures, startup, secureContext: isSecureContext, storage: !!navigator.storage?.getDirectory,
    locks: !!navigator.locks, isolated: crossOriginIsolated, userAgent: navigator.userAgent }),
};

async function request(path, body) {
  const response = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw Error(result.error ?? `HTTP_${response.status}`);
  return result;
}
