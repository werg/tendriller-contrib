// This test driver controls a real exclusive Worker. It owns no retry journal.
import { openBrowserDevice, openBrowserApplication } from '@chronolog/peer-session/browser';
import { signTransitionRequest } from '@chronolog/peer-session';
import { installApplicationWorkerTransport } from '@chronolog/peer-session/webrtc';
import { conversation } from './peer-generation-definition.mjs';

let device, session, transport;
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
      return { deviceId: session.deviceId, status: session.status, capabilities: session.capabilities };
    case 'query': return session.query('conversation', {});
    case 'post': {
      const operation = await session.command('postMessage', { messageId: args.id, text: args.text }, { operationId: args.id });
      return operation.applied({ signal: AbortSignal.timeout(15_000) });
    }
    case 'operation': return session.operations.get(args.id);
    case 'retry': await session.retry(args.id); return session.operations.get(args.id);
    case 'point': return session.recoveryPoint();
    case 'signTransition': return signTransitionRequest(args, device.identity);
    case 'adopt': return session.adopt(args);
    case 'reapply': {
      const operation = await session.reapply(args.originalId, 'postMessage', { messageId: args.id, text: args.text },
        { operationId: args.id, basedOn: (await session.query('conversation', {})).revision });
      return operation.applied({ signal: AbortSignal.timeout(15_000) });
    }
    case 'signal': return session.signals.send('typing', { typing: true }, { ttlMs: 2500 });
    case 'readContent': {
      let bytes = 0;
      for await (const chunk of session.content.read(args.reference, { offset: args.offset ?? 0, length: args.length ?? args.reference.bytes })) {
        for (let index = 0; index < chunk.length; index++) {
          if (chunk[index] !== ((args.offset ?? 0) + bytes + index) % 251) throw Error('CONTENT_BYTES_CHANGED');
        }
        bytes += chunk.length;
      }
      return { bytes };
    }
    case 'retained': return session.content.retained(args.reference);
    case 'retain': return session.content.retain(args.reference);
    case 'close':
      await transport?.close(); await session?.close(); if (!session) await device?.close();
      return { closed: true };
    default: throw Error(`Unknown browser fixture action ${action}`);
  }
}
