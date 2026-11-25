import { connectApplicationOwner } from '@chronolog/peer-session/browser';
import { serveFixtureConnections } from './operation-set-browser-transport.mjs';
import { observeBrowserResources } from './operation-set-browser-resources.mjs';
const parameters = new URL(location.href).searchParams;
let worker, application, service;
const resources = observeBrowserResources(), statuses = [];
let resolveReady, rejectReady;
export const applicationReady = new Promise((resolve,reject) => { resolveReady = resolve; rejectReady = reject; });
applicationReady.catch(() => {});
async function transport(method, input = {}) {
  if (!worker) throw Error('FIXTURE_WORKER_UNAVAILABLE');
  const channel = new MessageChannel();
  return new Promise((resolve,reject) => {
    const timer = setTimeout(() => { channel.port1.close(); reject(Error('FIXTURE_PORT_TIMEOUT')); }, 30_000);
    channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); event.data.error ? reject(Error(event.data.error)) : resolve(event.data.value); };
    worker.postMessage({ type: 'fixture-transport', method, input, port: channel.port2 }, [channel.port2]);
  });
}
async function open({ name, applicationId, create = false, unsupported = false, sql = false }) {
  worker = new Worker(`/worker.mjs?${new URLSearchParams({ name, applicationId, create: String(create), unsupported: String(unsupported), sql: String(sql) })}`, { type: 'module' });
  service = serveFixtureConnections(worker, {});
  const ready = await new Promise((resolve,reject) => {
    const timer = setTimeout(() => reject(Error('FIXTURE_WORKER_START_TIMEOUT')),30_000);
    worker.addEventListener('error', event => { clearTimeout(timer); reject(Error(event.message)); }, { once: true });
    worker.addEventListener('message', function receive(event) {
      if (!['fixture-ready','fixture-error'].includes(event.data?.type)) return;
      clearTimeout(timer); worker.removeEventListener('message',receive);
      event.data.type === 'fixture-error' ? reject(Error(event.data.error)) : resolve(event.data);
    });
  });
  application = await connectApplicationOwner(worker, { applicationId: ready.applicationId }); globalThis.application = application;
  application.onStatus(value => statuses.push(value)); resolveReady(application);
  return { identity: application.identity.publicKey, status: application.status, observation: await transport('observe') };
}
globalThis.fixture = {
  open, transport, observations: () => ({ page: structuredClone(resources), statuses: structuredClone(statuses) }),
  async command({ operationId, text, time }) { const operation = await application.command('postMessage', { messageId: operationId, text },
    { operationId, ...(time === undefined ? {} : { authorTimestampMs: BigInt(time) }) });
    return { id: operation.id, stored: operation.stored, outcome: await operation.materialized(), inspection: await operation.inspect() }; },
  async snapshot() { const view = await application.readView(); try { return { applicationId: view.applicationId, revision: view.revision, events: (await view.readEvents({ limit: 1000 })).events }; } finally { await view.release(); } },
  async close() { await application?.close(); await service?.close(); worker?.terminate(); },
  async crash() { await service?.close(); worker.terminate(); },
};
if (parameters.has('applicationId')) void open({ name: parameters.get('name'), applicationId: parameters.get('applicationId'), create: parameters.get('create') === 'true', sql: parameters.get('sql') === 'true' }).catch(rejectReady);
