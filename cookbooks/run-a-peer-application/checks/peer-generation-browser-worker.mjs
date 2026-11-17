// Only fixture provisioning crosses HTTP. The maintained session owns every
// application command, signer, operation journal, read view, and RTC channel.
import { openBrowserApplication, openBrowserDevice, serveApplicationWorker } from '@chronolog/peer-session/browser';
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
  serveApplicationWorker(session, self, { host: {
    application: () => request('/control/application'),
    selectGeneration: requestValue => request('/control/generations', requestValue),
  } });
  self.postMessage({ type: 'fixture-ready' });
} catch (error) {
  await device?.close().catch(() => undefined);
  self.postMessage({ type: 'fixture-error', error: error instanceof Error ? error.message : String(error) });
}

async function request(path, body) {
  const response = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw Error(result.error ?? `HTTP_${response.status}`);
  return result;
}
