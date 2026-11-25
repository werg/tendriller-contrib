// Actual native RTC, explicit test topology, no second discovery lifecycle.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { openWebRtcConnection } from '@chronolog/peer-session/webrtc';
import { createNativePeerConnection } from '@chronolog/peer-session/webrtc-native';
import { runOperationSetScenario } from './operation-set-scenario.mjs';
import { connectFramedSessions, signalingPair } from './operation-set-participation.mjs';
const native = { iceInterfaceAddresses: { udp4: '127.0.0.1' }, iceAdditionalHostAddresses: ['127.0.0.1'], iceUseIpv4: false, iceUseIpv6: false, iceUseTcp: false };
const connections = [], host = process.env.OPERATION_SET_HOST_BRIDGE ? (await import('./operation-set-host-client.mjs')).createHostedFixture(process.env.OPERATION_SET_HOST_BRIDGE) : null;
const connectSessions = async (a, b) => {
  const pair = host ? await host.signalingPair(a, b) : signalingPair();
  const raw = await Promise.all([
    openWebRtcConnection({ role: pair.roles?.[0] ?? 'offerer', signaling: pair.a, createPeerConnection: config => createNativePeerConnection(config, native) }),
    openWebRtcConnection({ role: pair.roles?.[1] ?? 'answerer', signaling: pair.b, createPeerConnection: config => createNativePeerConnection(config, native) }),
  ]);
  const bytes = { sentBytes: 0, receivedBytes: 0 };
  const wrapped = raw.map(connection => ({ ...connection, signal: connection.signal, live: connection.live,
    send: async (frame, options) => { bytes.sentBytes += frame.length; return connection.send(frame, options); },
    frames: async function* (signal) { for await (const frame of connection.frames(signal)) { bytes.receivedBytes += frame.length; yield frame; } },
    close: () => connection.close() }));
  const links = await connectFramedSessions(a, b, wrapped);
  const record = { peers: [a.identity.publicKey, b.identity.publicKey], authenticated: true,
    routes: await Promise.all(raw.map(connection => connection.session.getRoute())), bytes, signaling: pair.snapshot,
    closed: () => raw.every(connection => connection.signal.aborted) };
  assert.equal(pair.snapshot().closed, true); connections.push(record);
  return { ...links, live: true, inspect: () => ({ ...bytes, signaling: pair.snapshot() }) };
};
try { await runOperationSetScenario({ path: process.argv[2], connectSessions, ...(host ? { createHost: host.createHost } : {}) }); }
finally {
  const report = JSON.parse(await readFile(process.argv[2], 'utf8'));
  report.rtc = { implementation: 'werift', version: '0.27.0', candidateSource: 'explicit-loopback-only',
    signalingBoundary: host ? 'tendriller-workerd-rendezvous' : 'one-off-in-process-sdp-mailbox',
    connections: connections.map(record => ({ peers: record.peers, authenticated: record.authenticated,
      routes: record.routes, reliable: record.bytes, signaling: record.signaling(), closed: record.closed() })) };
  await writeFile(process.argv[2], `${JSON.stringify(report, null, 2)}\n`);
}
