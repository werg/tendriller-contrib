// Native RTC qualification uses the maintained public transport composition.
// This one-off SDP mailbox is test infrastructure; it carries no application data.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import * as participantProtocol from '@chronolog/peer-session';
import { connectNativeApplicationWebRtc, createNativePeerConnection } from '@chronolog/peer-session/webrtc-native';
import { openWebRtcConnection } from '@chronolog/peer-session/webrtc';
import { runPeerGenerationScenario } from './peer-generation-scenario.mjs';
import { createHostedFixture } from './peer-generation-host-client.mjs';
import { createParticipationFixture, qualifyParticipation, signalingPair } from './peer-generation-participation.mjs';

const native = { iceInterfaceAddresses: { udp4: '127.0.0.1' }, iceAdditionalHostAddresses: ['127.0.0.1'],
  iceUseIpv4: false, iceUseIpv6: false, iceUseTcp: false };
const openConnection = options => openWebRtcConnection({ ...options,
  createPeerConnection: configuration => createNativePeerConnection(configuration, native) });
const network = createParticipationFixture({ openConnection });
const connections = [];
const host = process.env.PEER_GENERATION_HOST_BRIDGE ? createHostedFixture(process.env.PEER_GENERATION_HOST_BRIDGE,
  participantProtocol) : null;
const connectSessions = async (a, b) => {
  const introduction = host ? await host.signalingPair(a, b) : signalingPair();
  const started = performance.now();
  const endpoints = await Promise.allSettled([
    connectNativeApplicationWebRtc(a, { role: introduction.roles[0], signaling: introduction.a, peerIdentity: b.deviceId, native }),
    connectNativeApplicationWebRtc(b, { role: introduction.roles[1], signaling: introduction.b, peerIdentity: a.deviceId, native }),
  ]);
  if (endpoints.some(value => value.status === 'rejected')) {
    await Promise.allSettled(endpoints.filter(value => value.status === 'fulfilled').map(value => value.value.close()));
    throw endpoints.find(value => value.status === 'rejected').reason;
  }
  const [left, right] = endpoints.map(value => value.value);
  assert.equal(left.peerId, b.deviceId);
  assert.equal(right.peerId, a.deviceId);
  assert.deepEqual(introduction.types, ['offer', 'answer']);
  assert.equal(introduction.closed(), true, 'Signaling must retire before ordinary application work');
  const observed = {
    peers: [a.deviceId, b.deviceId], authenticated: true,
    connectedInMs: performance.now() - started,
    routes: await Promise.all([left.rtc.getRoute(), right.rtc.getRoute()]),
    signaling: introduction.snapshot(),
  };
  const inspect = () => ({
    reliable: { sentBytes: left.stats.sentBytes + right.stats.sentBytes,
      receivedBytes: left.stats.receivedBytes + right.stats.receivedBytes },
    signaling: introduction.snapshot(),
  });
  const link = {
    inspect,
    async synchronize() { await Promise.all([left.synchronize(), right.synchronize()]); },
    async close() { await Promise.all([left.close(), right.close()]); },
  };
  connections.push({ observed, inspect, closed: () => left.signal.aborted && right.signal.aborted });
  return link;
};

const introductions = host ? await import('./peer-generation-host-introductions.mjs') : null;
try {
  await runPeerGenerationScenario({ path: process.argv[2], connectSessions,
    qualifyParticipation: options => qualifyParticipation({ ...options,
      ports: host ? session => host.createParticipationPorts(session, { openDirectConnection: openConnection, createPeerIntroductions: introductions.createPeerIntroductions, createPeerRelay: introductions.createPeerRelay,
        openRelayConnection: async () => { throw Error('QUALIFICATION_EXPECTED_DIRECT_ROUTE'); } }) : network.ports,
      copyPrefix: connectSessions, inspectTransport: host ? async () => { await host.drainIntroductions();
        return { boundary: 'tendriller-sdk-introductions', traffic: await options.host.traffic() }; } : network.inspect }),
    ...(host ? { createControl: host.createControl } : {}) });
} finally {
  const report = JSON.parse(await readFile(process.argv[2], 'utf8'));
  report.rtc = { implementation: 'werift', version: '0.27.0',
    candidateSource: 'explicit-loopback-only', interfaceEnumeration: 'disabled-by-native-options',
    signalingBoundary: host ? 'tendriller-workerd-rendezvous' : 'one-off-in-process-sdp-mailbox',
    byteBoundary: 'authenticated-reliable-application-frames',
    connections: connections.map(value => ({ ...value.observed, ...value.inspect(), closed: value.closed() })) };
  await writeFile(process.argv[2], `${JSON.stringify(report, null, 2)}\n`);
}
