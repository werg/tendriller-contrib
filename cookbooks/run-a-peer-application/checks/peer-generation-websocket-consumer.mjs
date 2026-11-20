// Only transport selection differs: this gate runs the shared public scenario
// through the actual hosted relay after every direct introduction is refused.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFile, writeFile } from 'node:fs/promises';
import * as participantProtocol from '@chronolog/peer-session';
import { openWebSocketConnection } from '@chronolog/peer-session/websocket';
import { createPeerIntroductions, createPeerRelay } from './peer-generation-host-introductions.mjs';
import { runPeerGenerationScenario } from './peer-generation-scenario.mjs';
import { createHostedFixture } from './peer-generation-host-client.mjs';
import { qualifyParticipation, waitParticipation } from './peer-generation-participation.mjs';

const host = createHostedFixture(process.env.PEER_GENERATION_HOST_BRIDGE, participantProtocol);
const connections = [], rawConnections = [], openedListeners = new Set();
let directAttempts = 0, ownedReconnect;
const openDirectConnection = async () => { directAttempts++; throw Error('QUALIFICATION_DIRECT_UNAVAILABLE'); };
const openRelayConnection = async ({ relay, signal }) => {
  const connection = await openWebSocketConnection(relay, { ready: relay.ready, signal });
  rawConnections.push(connection);
  for (const notify of openedListeners) notify();
  return connection;
};
const ports = session => host.createParticipationPorts(session,
  { openDirectConnection, openRelayConnection, createPeerIntroductions, createPeerRelay });
const connectSessions = async (a, b) => {
  const channel = `qualification:${randomUUID()}`, started = performance.now();
  const signal = AbortSignal.any([a.signal, b.signal]);
  const attemptsBefore = directAttempts;
  const opened = await Promise.allSettled([[a, b], [b, a]].map(async ([local, remote]) => {
    const connection = await ports(local).transport.open({ peer: { identity: remote.deviceId,
      route: { kind: 'rendezvous', channel } } }, { signal });
    try {
      const link = await local.connectPeer({ connection, peerIdentity: remote.deviceId, signal });
      await link.synchronize();
      return { link, connection };
    } catch (error) { await connection.close(); throw error; }
  }));
  if (opened.some(value => value.status === 'rejected')) {
    await Promise.allSettled(opened.filter(value => value.status === 'fulfilled').map(value => value.value.link.close()));
    throw opened.find(value => value.status === 'rejected').reason;
  }
  const [left, right] = opened.map(value => value.value);
  assert.equal(left.link.peerId, b.deviceId); assert.equal(right.link.peerId, a.deviceId);
  const observed = { peers: [a.deviceId, b.deviceId], authenticated: true, route: 'websocket-relay',
    directAttempts: directAttempts - attemptsBefore, connectedInMs: performance.now() - started };
  assert.equal(observed.directAttempts, 2, 'Both endpoints must attempt direct delivery before relay');
  const inspect = () => ({ reliable: { sentBytes: left.link.stats.sentBytes + right.link.stats.sentBytes,
    receivedBytes: left.link.stats.receivedBytes + right.link.stats.receivedBytes } });
  connections.push({ observed, inspect, closed: () => left.link.signal.aborted && right.link.signal.aborted });
  return { inspect,
    synchronize: () => Promise.all([left.link.synchronize(), right.link.synchronize()]),
    close: () => Promise.all([left.link.close(), right.link.close()]) };
};

try {
  await runPeerGenerationScenario({ path: process.argv[2], connectSessions, createControl: host.createControl,
    qualifyParticipation: options => qualifyParticipation({ ...options, ports, copyPrefix: connectSessions, graceMs: 3000,
      async qualifyTransport({ coordinator, follower, primary, secondary }) {
        const generation = follower.status.generation, before = rawConnections.length;
        const signal = AbortSignal.timeout(15_000);
        const previous = rawConnections.filter(connection => !connection.signal.aborted);
        assert.ok(previous.length >= 2, 'The fault needs both live relay endpoints');
        const closed = Promise.all(previous.map(connection => connection.signal.aborted
          ? Promise.resolve() : once(connection.signal, 'abort', { signal })));
        void closed.catch(() => {});
        const opened = new Promise((resolve, reject) => {
          const cleanup = () => { openedListeners.delete(notify); signal.removeEventListener('abort', abort); };
          const notify = () => { if (rawConnections.length > before) { cleanup(); resolve(); } };
          const abort = () => { cleanup(); reject(signal.reason); };
          openedListeners.add(notify); signal.addEventListener('abort', abort, { once: true });
        });
        void opened.catch(() => {});
        await host.cutRelays(); await closed; await opened;
        // Status publication may coalesce a short disconnected interval. The
        // old physical endpoints must close; a coherent read then verifies the
        // authenticated replacement route without adding another domain write.
        await follower.query('conversation', {}, { signal });
        await Promise.all([
          waitParticipation(primary, value => value.phase === 'coordinating' && value.connectedPeers.includes(follower.deviceId), signal),
          waitParticipation(secondary, value => value.phase === 'following' && value.connectedPeers.includes(coordinator.deviceId), signal),
        ]);
        assert.ok(rawConnections.length >= before + 2, 'Both physical relay endpoints must reopen');
        assert.equal(follower.status.generation, generation, 'A transient relay loss must reconnect within grace');
        ownedReconnect = { owner: 'application-session', physicalLinksCut: true, reconnected: true, coherentRead: true,
          sameGeneration: true, identity: follower.deviceId, beforeConnections: before, afterConnections: rawConnections.length };
      },
      inspectTransport: async () => { await host.drainIntroductions();
        return { boundary: 'tendriller-sdk-introductions', traffic: await options.host.traffic() }; },
    }),
  });
} finally {
  await Promise.allSettled(rawConnections.map(connection => connection.close()));
  await host.drainIntroductions();
  const report = JSON.parse(await readFile(process.argv[2], 'utf8'));
  let traffic;
  const deadline = performance.now() + 10_000;
  do {
    traffic = await host.relayTraffic();
    if (traffic.sockets.every(socket => socket.closed)) break;
    await new Promise(resolve => setTimeout(resolve, 20));
  } while (performance.now() < deadline);
  report.relay = { implementation: 'native-websocket', hostRuntime: 'workerd',
    networkBoundary: 'loopback-websocket-to-bounded-test-bridge-to-workerd-websocket',
    forcedDirectFailure: true, directAttempts, independentLanes: ['reliable', 'live'],
    security: 'shared-authenticated-peer-channel', controlOutageScope: 'control-http-only',
    connections: connections.map(value => ({ ...value.observed, ...value.inspect(), closed: value.closed() })),
    ownedReconnect, traffic };
  await writeFile(process.argv[2], `${JSON.stringify(report, null, 2)}\n`);
}
