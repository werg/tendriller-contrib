// Only fixture provisioning crosses HTTP. The maintained session owns every
// application command, signer, operation journal, read view, and RTC channel.
import { openBrowserApplication, openBrowserDevice, serveApplicationWorker } from '@chronolog/peer-session/browser';
import { openFixtureConnection, inspectFixtureConnection } from './peer-generation-browser-transport.mjs';
import { conversation } from './peer-generation-definition.mjs';

const parameters = new URL(self.location.href).searchParams;
let device;
try {
  if (parameters.get('unsupported') === 'true') Object.defineProperty(navigator, 'storage', { configurable: true, value: {} });
  device = await openBrowserDevice({ name: parameters.get('name'), ...(parameters.get('create') === 'true' ? { create: true } : {}) });
  const bootstrap = await request('/fixture/bootstrap', { deviceId: device.identity.publicKey, storageId: device.storageId });
  // A fresh granted browser receives no plaintext epoch key from the page or
  // fixture host. Its maintained peer connection enrolls wrapped keys from A.
  const session = await openBrowserApplication({ device, authority: bootstrap.authority, definition: conversation });
  const host = session.connectControlParticipant({
    exchange: (envelope, { signal }) => request('/participant', envelope, signal),
  });
  serveTransportFaults(session);
  serveApplicationWorker(session, self, { host });
  self.postMessage({ type: 'fixture-ready' });
} catch (error) {
  await device?.close().catch(() => undefined);
  self.postMessage({ type: 'fixture-error', error: error instanceof Error ? error.message : String(error) });
}

// Explicit cuts and reopenings exercise persistence and loss. This is a test
// transport switchboard, not a second application facade or connection policy.
// Normal discovery/recovery is independently qualified through participate().
function serveTransportFaults(session) {
  const links = new Map();
  const close = async id => {
    const entry = links.get(id);
    if (!entry) return;
    links.delete(id); entry.controller.abort(Error('FIXTURE_LINK_CLOSED'));
    try { await entry.link?.close(); }
    finally { await entry.connection?.close(); }
  };
  const inspect = async id => {
    const entry = links.get(id);
    if (!entry?.link) throw Error('FIXTURE_LINK_UNAVAILABLE');
    await entry.link.synchronize();
    return { peerId: entry.link.peerId, stats: entry.link.stats,
      route: await inspectFixtureConnection(entry.connection), closed: entry.link.signal.aborted };
  };
  const invoke = async (method, input) => {
    session.signal.throwIfAborted();
    if (!input || typeof input.id !== 'string' || !/^\d+$/u.test(input.id)) throw Error('FIXTURE_LINK_ID_INVALID');
    if (method === 'disconnect') { await close(input.id); return null; }
    if (method === 'inspect') return inspect(input.id);
    if (method !== 'connect' || !['offerer', 'answerer'].includes(input.role) || !/^[a-f0-9]{64}$/u.test(input.peerId)) {
      throw Error('FIXTURE_LINK_OPTIONS_INVALID');
    }
    if (links.has(input.id) || links.size >= 8) throw Error('FIXTURE_LINK_LIMIT');
    const entry = { controller: new AbortController() };
    const signal = AbortSignal.any([session.signal, entry.controller.signal]), base = `/signaling/${input.id}`;
    links.set(input.id, entry);
    const signaling = {
      messages: { async *[Symbol.asyncIterator]() { const description = await request(`${base}/next`, undefined, signal); if (description) yield description; } },
      send: description => request(`${base}/send`, description, signal),
      // Retiring the introduction has its own bounded lifetime after cancellation.
      close: () => request(`${base}/close`, {}, AbortSignal.timeout(5000)),
    };
    try {
      entry.connection = await openFixtureConnection({ role: input.role, signaling, signal, timeoutMs: 30_000,
        localIdentity: session.deviceId, peerIdentity: input.peerId, relayBase: input.relayBase, channel: input.channel });
      entry.link = await session.connectPeer({ connection: entry.connection, peerIdentity: input.peerId, signal, handshakeTimeoutMs: 30_000 });
      return await inspect(input.id);
    } catch (error) { await close(input.id); throw error; }
  };
  const receive = event => {
    const input = event.data;
    if (input?.type !== 'fixture-transport' || !(input.port instanceof MessagePort)) return;
    const port = input.port;
    void invoke(input.method, input.input).then(value => { port.postMessage({ ok: true, value }); }, error => {
      port.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }).finally(() => port.close()).catch(() => undefined);
  };
  self.addEventListener('message', receive);
  session.signal.addEventListener('abort', () => {
    self.removeEventListener('message', receive);
    void Promise.allSettled([...links.keys()].map(close));
  }, { once: true });
}

async function request(path, body, signal) {
  const response = await fetch(path, { signal,
    ...(body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) throw Object.assign(Error(result.error?.message ?? `HTTP_${response.status}`), {
    code: result.error?.code ?? 'invalid_host_error', status: response.status,
  });
  return result;
}
