import assert from 'node:assert/strict';

/** Share the measured relay boundary across native and browser qualification. */
export function validateRelayTraffic(network, { implementation, minimumSockets }) {
  assert.equal(network?.implementation, implementation);
  assert.equal(network.hostRuntime, 'workerd');
  assert.equal(network.networkBoundary, 'loopback-websocket-to-bounded-test-bridge-to-workerd-websocket');
  assert.deepEqual(network.independentLanes, ['reliable', 'live']);
  assert.equal(network.security, 'shared-authenticated-peer-channel');
  assert.equal(network.controlOutageScope, 'control-http-only', 'Relay operation cannot claim a complete host outage');
  assert.equal(network.traffic?.boundary, 'actual-workerd-websocket-relay');
  const sockets = network.traffic.sockets;
  assert.ok(sockets?.length >= minimumSockets, 'Exercise actual independent relay sockets');
  for (const socket of sockets) {
    assert.ok(['reliable', 'live'].includes(socket.lane)); assert.equal(socket.closed, true);
    assert.deepEqual(socket.plaintextMatches, [], 'A declared private payload reached the relay in cleartext');
    for (const field of ['sentBytes', 'receivedBytes', 'sentBinaryFrames', 'receivedBinaryFrames', 'maxQueuedBytes']) {
      assert.ok(Number.isSafeInteger(socket[field]) && socket[field] >= 0, `Missing relay ${field}`);
    }
    assert.ok(socket.maxQueuedBytes <= 2_200_000);
  }
  for (const lane of ['reliable', 'live']) {
    assert.ok(sockets.some(socket => socket.lane === lane && socket.sentBinaryFrames > 0 && socket.receivedBinaryFrames > 0),
      `No actual ${lane} frames crossed the relay`);
  }
  assert.ok(network.traffic.host.relayUpgrades >= minimumSockets && network.traffic.host.relaySentBytes > 0 && network.traffic.host.relayReceivedBytes > 0,
    'Relay cost must include observed host byte traffic');
}
