// This test driver controls a real exclusive Worker. It owns no retry journal.
import { openBrowserDevice, openBrowserApplication, serveApplicationWorker } from '@chronolog/peer-session/browser';
import { installApplicationWorkerTransport } from '@chronolog/peer-session/webrtc';
import { conversation } from './peer-generation-definition.mjs';

let device, session, transport, owner;
self.addEventListener('message', event => {
  if (event.data?.type !== 'peer-browser-scenario') return;
  const { action, args, port } = event.data;
  void handle(action, args).then(value => port.postMessage({ value }), error => port.postMessage({ error: String(error) }))
    .finally(() => port.close());
});

async function handle(action, args) {
  switch (action) {
    case 'openDevice':
      device = await openBrowserDevice(args);
      return { deviceId: device.identity.publicKey, storageId: device.storageId };
    case 'unsupported':
      Object.defineProperty(navigator, 'storage', { configurable: true, value: {} });
      return openBrowserDevice({ name: 'unavailable-storage', create: true });
    case 'open':
      session = await openBrowserApplication({ device, authority: args.authority,
        epochKeys: new Map([[0, new Uint8Array(args.epochKey)]]), definition: conversation });
      transport = installApplicationWorkerTransport(session, self);
      owner = serveApplicationWorker(session, self);
      return { deviceId: session.deviceId, status: session.status, capabilities: session.capabilities };
    case 'close':
      await transport?.close(); await owner?.close(); if (!session) await device?.close();
      return { closed: true };
    default: throw Error(`Unknown browser fixture action ${action}`);
  }
}
