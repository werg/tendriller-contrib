import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validatePeerBrowserReport } from './peer-generation-browser-report.mjs';

// Deliberately synthetic records exercise validation, never browser qualification.
const h = digit => digit.repeat(64);
function synthetic() {
  const operation = { status: 'applied', operationId: 'original', attemptId: h('1'), outcome: 'accepted' };
  return { format: 'peer-generation-consumer/v1', profile: 'peer-generation-v1', mode: 'runtime',
    topology: 'independent-browser-native-rtc', passed: true, executionManifestDigest: h('1'),
    source: { commit: '1'.repeat(40), tree: '2'.repeat(40), dirty: true },
    artifacts: [{ name: '@chronolog/peer-session', sha256: h('1'), sourceCommit: '1'.repeat(40), sourceTree: '2'.repeat(40), sourceDirty: true }],
    publicBoundary: { imports: ['@chronolog/peer-session', '@chronolog/peer-session/browser', '@chronolog/peer-session/native',
      '@chronolog/peer-session/webrtc', '@chronolog/peer-session/webrtc-native'], siblingSourceImports: 0, applicationRetryQueues: 0 },
    browser: { version: 'synthetic', owner: 'DedicatedWorker', storage: 'OPFS', tabs: 2, runtimeErrors: [] },
    ui: { pages: ['board.html', 'compact.html'], domain: 'events', sessionFacade: 'connectApplicationWorker',
      sentThroughForms: 3, reapplicationConfirmed: true, recoveryNoticeVisible: true, originalReviewPreserved: true,
      draftBeforeRestart: 'Synthetic draft', draftAfterRestart: 'Synthetic draft', draftAfterRecovery: 'Synthetic draft' },
    ownership: { secondTabRefused: true, unsupportedStorageRefused: true, pageOwnershipRefused: true,
      unsupportedFault: 'Worker navigator.storage.getDirectory removed by the test' },
    hostOutage: { boundary: 'loopback-static-page-and-sdp', blockedProbeStatus: 503, requests: { before: 4, after: 4 },
      applicationBodyBytes: 0, commandsApplied: 2, liveSignalsObserved: 1, signalingClosed: true, reliableBytes: { before: 100, after: 300 } },
    reopen: { identityBefore: h('1'), identityAfter: h('1'), storageBefore: 'worker', storageAfter: 'worker',
      operationBefore: operation, operationAfter: structuredClone(operation) },
    recovery: { previousGeneration: h('1'), selectedGeneration: h('2'), previousHead: 3, adoptedPosition: 1,
      recoveredDigest: h('3'), nativeDigest: h('3'), coherentReset: true, inheritedIdentityPreserved: true,
      returningTailExcluded: true, retryRefused: true, abandonedOperationId: 'old', reappliedOperationId: 'new',
      abandonedAttemptId: h('4'), reappliedAttemptId: h('5'), reapplyOf: h('4') },
    content: { bytes: 131095, interruptedAfter: 65536, partialRetentionRefused: true, partialSurvivedRestart: true,
      unavailableRemainderRefused: true, completeAfterReconnect: true, retainedBy: h('1'), retentionSignature: '1'.repeat(128) },
    rtc: { implementation: 'Chromium and werift', nativeVersion: '0.27.0', signalingBoundary: 'one-off-loopback-http-test-mailbox',
      byteBoundary: 'authenticated-reliable-application-frames', candidateSource: 'native-explicit-loopback/browser-discovered',
      connections: [1, 2].map(() => ({ authenticated: true, closed: true, nativePeer: h('1'), browserPeer: h('2'),
        signaling: { closed: true, sentMessages: 2, sentBytes: 1000 }, native: { sentBytes: 1000, receivedBytes: 1000 },
        routes: [{ route: 'unknown' }, { route: 'unknown' }] })) },
    runtime: { dependencies: { lockSha256: h('1'), packages: [{ path: 'node_modules/playwright', version: 'synthetic', integrity: 'synthetic' }] } } };
}

test('browser evidence preserves measured boundaries and source dirtiness without inventing deployed support', () => {
  const summary = validatePeerBrowserReport(synthetic());
  assert.equal(summary.source.dirty, true);
  assert.equal(summary.artifacts[0].sourceDirty, true);
  assert.equal(summary.rtc.connections[0].routes[0].route, 'unknown');
  assert.ok(summary.limitations.some(value => value.includes('Tendriller')));
});

test('browser qualification rejects missing execution, broken recovery, false retention, and moving host counters', () => {
  for (const mutate of [
    report => { report.passed = false; }, report => { report.mode = 'build-only'; },
    report => { report.browser.owner = 'page'; }, report => { report.ownership.secondTabRefused = false; },
    report => { report.ui.draftAfterRecovery = ''; }, report => { report.ui.originalReviewPreserved = false; },
    report => { report.ui.reapplicationConfirmed = false; }, report => { report.ui.sessionFacade = 'fixture-rpc'; },
    report => { report.hostOutage.requests.after++; }, report => { report.hostOutage.applicationBodyBytes = 1; },
    report => { report.hostOutage.reliableBytes.after = report.hostOutage.reliableBytes.before; },
    report => { report.reopen.identityAfter = h('2'); }, report => { report.recovery.nativeDigest = h('9'); },
    report => { report.recovery.reapplyOf = h('6'); }, report => { report.content.partialRetentionRefused = false; },
    report => { report.rtc.connections[0].authenticated = false; }, report => { report.rtc.connections[0].signaling.closed = false; },
    report => { report.rtc.connections[0].routes[0] = { route: 'direct' }; },
    report => { delete report.runtime.dependencies; },
  ]) {
    const report = synthetic(); mutate(report); assert.throws(() => validatePeerBrowserReport(report));
  }
});
