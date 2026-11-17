// Browser negotiation uses the public synchronous Worker handoff, not custom framing.
import { connectWorkerApplicationWebRtc } from '@chronolog/peer-session/webrtc';
import { openBrowserDevice, connectApplicationWorker } from '@chronolog/peer-session/browser';

let worker, connection, application, resolveApplication;
export const applicationReady = new Promise(resolve => { resolveApplication = resolve; });
const timeoutMs = 30_000;
const rpc = (target, action, args = {}) => new Promise((resolve, reject) => {
  const channel = new MessageChannel();
  const timer = setTimeout(() => { channel.port1.close(); reject(Error('BROWSER_FIXTURE_TIMEOUT')); }, timeoutMs);
  channel.port1.onmessage = event => {
    clearTimeout(timer); channel.port1.close();
    event.data.error ? reject(Error(event.data.error)) : resolve(event.data.value);
  };
  target.postMessage({ type: 'peer-browser-scenario', action, args, port: channel.port2 }, [channel.port2]);
});
const spawn = () => new Worker('./peer-generation-browser-worker.mjs', { type: 'module' });
window.peerFixture = {
  async openDevice(args) { worker = spawn(); return rpc(worker, 'openDevice', args); },
  async call(action, args = {}) {
    if (action === 'open') {
      const result = await rpc(worker, action, args);
      application = await connectApplicationWorker(worker, { timeoutMs });
      resolveApplication(application);
      return result;
    }
    switch (action) {
      case 'query': return application.query('conversation', {});
      case 'operation': return application.operations.get(args.id);
      case 'inspectOperation': return application.operations.inspect(args.id);
      case 'retry': await application.retry(args.id); return application.operations.get(args.id);
      case 'point': return application.recoveryPoint();
      case 'adopt': return application.adopt(args);
      case 'signal': return application.signals.send('typing', { typing: true }, { ttlMs: 2500 });
      case 'readContent': {
        let bytes = 0;
        for await (const chunk of application.content.read(args.reference, { offset: args.offset ?? 0, length: args.length ?? args.reference.bytes - (args.offset ?? 0) })) {
          for (let index = 0; index < chunk.length; index++) {
            if (chunk[index] !== ((args.offset ?? 0) + bytes + index) % 251) throw Error('CONTENT_BYTES_CHANGED');
          }
          bytes += chunk.length;
        }
        return { bytes };
      }
      case 'retained': return application.content.retained(args.reference);
      case 'retain': return application.content.retain(args.reference);
      default: throw Error(`Unknown browser fixture action ${action}`);
    }
  },
  async secondOwner(args) {
    const other = spawn();
    try { await rpc(other, 'openDevice', args); throw Error('SECOND_OWNER_WAS_ALLOWED'); }
    catch (error) { return String(error); }
    finally { other.terminate(); }
  },
  async unsupported() {
    const other = spawn();
    try { await rpc(other, 'unsupported'); throw Error('UNSUPPORTED_STORAGE_WAS_ALLOWED'); }
    catch (error) { return String(error); }
    finally { other.terminate(); }
  },
  async pageOwner() {
    try { await openBrowserDevice({ name: 'page-owner', create: true }); throw Error('PAGE_OWNER_WAS_ALLOWED'); }
    catch (error) { return String(error); }
  },
  async connect({ id, peerId }) {
    let retired = false;
    const request = async (action, body) => {
      const result = await fetch(`/signaling/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      if (!result.ok) throw Error(`TEST_SIGNALING_${result.status}`);
      return result.json();
    };
    const signaling = { async send(description) { await request('send', description); },
      messages: (async function* () { const result = await request('next'); if (result !== null) yield result; })(),
      async close() { if (retired) return; retired = true; await request('close'); } };
    connection = await connectWorkerApplicationWebRtc(worker, { role: 'answerer', expectedPeerId: peerId, signaling, timeoutMs });
    return { peerId: connection.peerId, stats: connection.stats, route: await connection.rtc.getRoute(), signalingClosed: retired };
  },
  async synchronize() { await connection.synchronize(); return { stats: connection.stats, route: await connection.rtc.getRoute() }; },
  async disconnect() { await connection?.close(); connection = undefined; return { closed: true }; },
  async close() { await connection?.close(); connection = undefined; await application?.close();
    if (worker) { await rpc(worker, 'close'); worker.terminate(); worker = undefined; } },
};
