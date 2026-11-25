// Fresh-device key transfer is explicit and authenticated. Cached reopening
// happens before HTTP, transport discovery, or any optional finalizer.
import { openBrowserDevice, createApplicationSession, createApplicationOwner } from '@chronolog/peer-session/worker';
import { encodeRecord, decodeRecord, bytesToHex, hexToBytes, signEnrollmentRequest } from '@chronolog/authority';
import { openFixtureConnection, inspectFixtureConnection } from './operation-set-browser-transport.mjs';
import { conversation } from './operation-set-definition.mjs';
import { observeBrowserResources } from './operation-set-browser-resources.mjs';
const parameters = new URL(self.location.href).searchParams, resources = observeBrowserResources();
let session, device;
const request = async (path, body) => {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const value = await response.json(); if (!response.ok) throw Error(value.error?.message ?? `HTTP_${response.status}`); return value;
};
try {
  if (parameters.get('unsupported') === 'true') Object.defineProperty(navigator, 'storage', { configurable: true, value: {} });
  device = await openBrowserDevice({ name: parameters.get('name'), ...(parameters.get('create') === 'true' ? { create: true } : {}) });
  const sql = parameters.get('sql') === 'true';
  const execution = sql ? { createMaterializer: (await import('./operation-set-browser-sql.mjs')).browserSqlMaterializer(parameters.get('name')) } : {};
  try { session = await createApplicationSession({ ...execution, device, applicationId: parameters.get('applicationId'), definition: conversation }); }
  catch (failure) {
    if (!String(failure.message).includes('AUTHORITY_CACHE_MISSING')) throw failure;
    // A failed createApplicationSession closes the device; reopen the exact retained identity.
    device = await openBrowserDevice({ name: parameters.get('name') });
    const bootstrap = await request('/fixture/bootstrap', { publicKey: device.identity.publicKey, applicationId: parameters.get('applicationId'), sql });
    let bundle = decodeRecord(hexToBytes(bootstrap.record));
    if (bootstrap.challenge) {
      const epoch = bundle.memberships.at(-1).payload;
      const proof = await signEnrollmentRequest({ applicationId: parameters.get('applicationId'), publicKey: device.identity.publicKey,
        challenge: bootstrap.challenge, epoch: epoch.epoch, epochKeyDigest: epoch.epochKeyDigest }, device.identity);
      bundle = decodeRecord(hexToBytes((await request('/fixture/enroll', { record: bytesToHex(encodeRecord(proof)) })).record));
    }
    session = await createApplicationSession({ ...execution, device, authority: bundle, definition: conversation });
    const provisioning = await session.provisioning.createProvisioningRequest();
    const transfer = await request('/fixture/provision', { record: bytesToHex(encodeRecord(provisioning)) });
    await session.provisioning.importProvisioning(decodeRecord(hexToBytes(transfer.record)));
  }
  const links = new Map();
  const close = async id => { const entry = links.get(id); if (!entry) return; links.delete(id); await entry.link?.close(); await entry.connection?.close(); };
  const invoke = async (method, input) => {
    if (method === 'observe') return { resources: structuredClone(resources), identity: session.identity.publicKey, storageId: device.storageId, status: session.status };
    if (method === 'shutdown') { await Promise.all([...links.keys()].map(close)); await session.close(); return null; }
    if (method === 'disconnect') { await close(input.id); return null; }
    if (method === 'synchronize') { await links.get(input.id).link.synchronize(); return null; }
    if (method === 'inspect') { const entry = links.get(input.id); return { route: await inspectFixtureConnection(entry.connection), bytes: entry.bytes, authenticated: !!entry.link, closed: entry.link.signal.aborted }; }
    if (method !== 'connect' || links.size >= 8 || links.has(input.id)) throw Error('FIXTURE_LINK_OPTIONS_INVALID');
    const bytes = { sentBytes: 0, receivedBytes: 0 }, entry = { bytes }; links.set(input.id, entry);
    const base = `/signaling/${input.id}`;
    const signaling = { messages: { async *[Symbol.asyncIterator]() { const value = await request(`${base}/next`, {}); if (value) yield value; } },
      send: description => request(`${base}/send`, description), close: () => request(`${base}/close`, {}) };
    try {
      entry.connection = await openFixtureConnection({ role: input.role, signaling, signal: session.signal, timeoutMs: 30_000,
        localIdentity: session.identity.publicKey, peerIdentity: input.peerId, relayBase: input.relayBase, channel: input.channel });
      const raw = entry.connection;
      entry.link = await session.connectPeer({ peerIdentity: input.peerId, connection: { signal: raw.signal, live: raw.live,
        send: async (frame, options) => { bytes.sentBytes += frame.length; return raw.send(frame, options); },
        frames: async function* (signal) { for await (const frame of raw.frames(signal)) { bytes.receivedBytes += frame.length; yield frame; } }, close: () => raw.close() } });
      return { identity: entry.link.peerIdentity };
    } catch (failure) { await close(input.id); throw failure; }
  };
  self.addEventListener('message', event => {
    if (event.data?.type !== 'fixture-transport' || !(event.data.port instanceof MessagePort)) return;
    const { port, method, input } = event.data;
    void invoke(method, input).then(value => port.postMessage({ value }), failure => port.postMessage({ error: failure.message })).finally(() => port.close());
  });
  const owner = createApplicationOwner(session, { lastClient: 'shutdown' }); owner.attach(self);
  self.postMessage({ type: 'fixture-ready', applicationId: session.applicationId });
} catch (failure) { await session?.close().catch(() => {}); await device?.close().catch(() => {}); self.postMessage({ type: 'fixture-error', error: failure.message }); }
