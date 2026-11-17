// Only fixture provisioning crosses HTTP. The maintained session owns every
// application command, signer, operation journal, read view, and RTC channel.
import { connectApplicationWorkerHost, openBrowserDevice, serveApplicationWorker } from '@chronolog/peer-session/browser';
import { openApplication } from './peer-generation-browser-runtime.mjs';

const parameters = new URL(self.location.href).searchParams;
let device, host;
const stage = value => self.postMessage({ type: 'fixture-stage', stage: value });
try {
  stage('opening owned browser device');
  if (parameters.get('unsupported') === 'true') Object.defineProperty(navigator, 'storage', { configurable: true, value: {} });
  device = await openBrowserDevice({ name: parameters.get('name'), ...(parameters.get('create') === 'true' ? { create: true } : {}) });
  stage('requesting fixture authority');
  const bootstrap = await request('/fixture/bootstrap', { deviceId: device.identity.publicKey, storageId: device.storageId });
  stage('opening public application runtime');
  // A fresh granted browser receives no plaintext epoch key from the page or
  // fixture host. Its maintained peer connection enrolls wrapped keys from A.
  host = await connectApplicationWorkerHost(self);
  const session = await openApplication({ device, applicationId: bootstrap.authority.descriptor.payload.applicationId, host });
  stage('serving public Worker session');
  serveApplicationWorker(session, self, { host });
  session.signal.addEventListener('abort', () => { void host.close().catch(() => undefined); }, { once: true });
  self.postMessage({ type: 'fixture-ready' });
} catch (error) {
  await device?.close().catch(() => undefined);
  await host?.close().catch(() => undefined);
  self.postMessage({ type: 'fixture-error', error: error instanceof Error ? error.message : String(error) });
}

async function request(path, body) {
  const response = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw Error(result.error ?? `HTTP_${response.status}`);
  return result;
}
