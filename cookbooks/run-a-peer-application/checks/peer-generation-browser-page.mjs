// Browser negotiation uses the public synchronous Worker handoff, not custom framing.
import { connectWorkerApplicationWebRtc } from '@chronolog/peer-session/webrtc';
import { openBrowserDevice } from '@chronolog/peer-session/browser';

let worker, connection;
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
  call: (action, args) => rpc(worker, action, args),
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
      async *messages() { const result = await request('next'); if (result !== null) yield result; },
      async close() { if (retired) return; retired = true; await request('close'); } };
    connection = await connectWorkerApplicationWebRtc(worker, { role: 'answerer', expectedPeerId: peerId, signaling, timeoutMs });
    return { peerId: connection.peerId, stats: connection.stats, route: await connection.rtc.getRoute(), signalingClosed: retired };
  },
  async synchronize() { await connection.synchronize(); return { stats: connection.stats, route: await connection.rtc.getRoute() }; },
  async disconnect() { await connection?.close(); connection = undefined; return { closed: true }; },
  async close() { await connection?.close(); connection = undefined; if (worker) { await rpc(worker, 'close'); worker.terminate(); worker = undefined; } },
};
