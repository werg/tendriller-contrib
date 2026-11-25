// Forced direct refusal with actual independent reliable/live WebSocket lanes.
// Reopening is an explicit qualification fault, not production lifecycle policy.
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { openFixtureConnection } from './operation-set-websocket-transport.mjs';
import { connectFramedSessions } from './operation-set-participation.mjs';
import { createHostedFixture } from './operation-set-host-client.mjs';
import { runOperationSetScenario } from './operation-set-scenario.mjs';
const host = createHostedFixture(process.env.OPERATION_SET_HOST_BRIDGE), records = [];
let cut = false, reopened = false;
const connectSessions = async (a, b) => {
  const channel = `qualification:${randomUUID()}`, bytes = { sentBytes: 0, receivedBytes: 0 };
  const raw = await Promise.all([[a,b], [b,a]].map(([local,remote]) => openFixtureConnection({
    relayBase: process.env.OPERATION_SET_HOST_BRIDGE, channel, localIdentity: local.identity.publicKey,
    peerIdentity: remote.identity.publicKey, signal: local.signal })));
  const directAttempts = raw.reduce((sum,connection) => sum + connection.qualificationDirectAttempts,0);
  const wrapped = raw.map(connection => ({ signal: connection.signal, live: connection.live,
    send: async (frame, options) => { bytes.sentBytes += frame.length; return connection.send(frame, options); },
    frames: async function* (signal) { for await (const frame of connection.frames(signal)) { bytes.receivedBytes += frame.length; yield frame; } },
    close: () => connection.close() }));
  const link = await connectFramedSessions(a,b,wrapped);
  if (cut) reopened = true;
  records.push({ peers: [a.identity.publicKey,b.identity.publicKey], directAttempts, bytes, raw });
  return { ...link, live: true, inspect: () => ({ ...bytes }), async close() {
    if (!cut) { await host.cutRelays(); cut = true; }
    await link.close();
  } };
};
try { await runOperationSetScenario({ path: process.argv[2], connectSessions, createHost: host.createHost }); }
finally {
  const report = JSON.parse(await readFile(process.argv[2], 'utf8'));
  report.relay = { implementation: 'native-websocket', hostRuntime: 'workerd', networkBoundary: 'loopback-websocket-to-bounded-test-bridge-to-workerd-websocket',
    forcedDirectFailure: records.every(value => value.directAttempts === 2), independentLanes: ['reliable','live'], security: 'shared-authenticated-peer-channel', controlOutageScope: 'control-http-only',
    connections: records.map(value => ({ peers: value.peers, directAttempts: value.directAttempts, authenticated: true,
      reliable: value.bytes, closed: value.raw.every(connection => connection.signal.aborted) })),
    reconnect: { owner: 'explicit-qualification-topology', physicalLinksCut: cut, reconnected: reopened }, traffic: await host.relayTraffic() };
  await writeFile(process.argv[2], `${JSON.stringify(report,null,2)}\n`);
}
