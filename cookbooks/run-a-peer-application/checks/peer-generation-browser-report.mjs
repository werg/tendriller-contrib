// Validates measured browser/native observations. It never supplies evidence.
import assert from 'node:assert/strict';

export function validatePeerBrowserReport(report) {
  const hex = (value, length) => assert.match(value ?? '', new RegExp(`^[a-f0-9]{${length}}$`, 'u'));
  assert.equal(report?.format, 'peer-generation-consumer/v1');
  assert.equal(report.profile, 'peer-generation-v1');
  assert.equal(report.mode, 'runtime');
  assert.equal(report.topology, 'independent-browser-native-rtc');
  assert.equal(report.passed, true);
  hex(report.executionManifestDigest, 64);
  hex(report.source?.commit, 40); hex(report.source?.tree, 40);
  assert.equal(typeof report.source.dirty, 'boolean');
  assert.equal(report.artifacts?.length, 1);
  const artifact = report.artifacts[0];
  assert.equal(artifact.name, '@chronolog/peer-session');
  hex(artifact.sha256, 64); hex(artifact.sourceCommit, 40); hex(artifact.sourceTree, 40);
  assert.equal(typeof artifact.sourceDirty, 'boolean');
  assert.deepEqual(report.publicBoundary?.imports, ['@chronolog/peer-session', '@chronolog/peer-session/browser',
    '@chronolog/peer-session/native', '@chronolog/peer-session/webrtc', '@chronolog/peer-session/webrtc-native']);
  assert.equal(report.publicBoundary.siblingSourceImports, 0);
  assert.equal(report.publicBoundary.applicationRetryQueues, 0);
  assert.equal(report.browser?.owner, 'DedicatedWorker'); assert.equal(report.browser.storage, 'OPFS');
  assert.ok(report.browser.version); assert.equal(report.browser.tabs, 2);
  assert.deepEqual(report.browser.runtimeErrors, []);
  for (const field of ['secondTabRefused', 'unsupportedStorageRefused', 'pageOwnershipRefused']) assert.equal(report.ownership?.[field], true, field);
  assert.equal(report.ownership.unsupportedFault, 'Worker navigator.storage.getDirectory removed by the test');
  const host = report.hostOutage;
  assert.equal(host?.boundary, 'loopback-static-page-and-sdp');
  assert.equal(host.blockedProbeStatus, 503);
  assert.ok(Number.isSafeInteger(host.requests?.before) && host.requests.before > 0);
  assert.equal(host.requests.after, host.requests.before);
  assert.equal(host.applicationBodyBytes, 0); assert.equal(host.commandsApplied, 2);
  assert.equal(host.liveSignalsObserved, 1); assert.equal(host.signalingClosed, true);
  assert.ok(Number.isSafeInteger(host.reliableBytes?.before) && host.reliableBytes.before > 0);
  assert.ok(host.reliableBytes.after > host.reliableBytes.before);
  const reopen = report.reopen;
  hex(reopen?.identityBefore, 64); assert.equal(reopen.identityAfter, reopen.identityBefore);
  assert.ok(reopen.storageBefore); assert.equal(reopen.storageAfter, reopen.storageBefore);
  assert.equal(reopen.operationBefore?.status, 'applied');
  assert.deepEqual(reopen.operationAfter, reopen.operationBefore);
  const recovery = report.recovery;
  hex(recovery?.previousGeneration, 64); hex(recovery.selectedGeneration, 64);
  assert.notEqual(recovery.selectedGeneration, recovery.previousGeneration);
  assert.ok(Number.isSafeInteger(recovery.adoptedPosition) && recovery.adoptedPosition > 0 && recovery.previousHead > recovery.adoptedPosition);
  hex(recovery.recoveredDigest, 64); assert.equal(recovery.nativeDigest, recovery.recoveredDigest);
  for (const field of ['coherentReset', 'inheritedIdentityPreserved', 'returningTailExcluded', 'retryRefused']) assert.equal(recovery[field], true, field);
  assert.ok(recovery.abandonedOperationId); assert.ok(recovery.reappliedOperationId);
  assert.notEqual(recovery.reappliedOperationId, recovery.abandonedOperationId);
  hex(recovery.abandonedAttemptId, 64); hex(recovery.reappliedAttemptId, 64);
  assert.notEqual(recovery.reappliedAttemptId, recovery.abandonedAttemptId);
  assert.equal(recovery.reapplyOf, recovery.abandonedAttemptId);
  const content = report.content;
  assert.ok(Number.isSafeInteger(content?.bytes) && content.bytes > 65_536);
  assert.equal(content.interruptedAfter, 65_536);
  for (const field of ['partialRetentionRefused', 'partialSurvivedRestart', 'unavailableRemainderRefused', 'completeAfterReconnect']) assert.equal(content[field], true, field);
  assert.equal(content.retainedBy, reopen.identityAfter); hex(content.retentionSignature, 128);
  assert.equal(report.rtc?.implementation, 'Chromium and werift'); assert.equal(report.rtc.nativeVersion, '0.27.0');
  assert.equal(report.rtc.signalingBoundary, 'one-off-loopback-http-test-mailbox');
  assert.equal(report.rtc.byteBoundary, 'authenticated-reliable-application-frames');
  assert.equal(report.rtc.candidateSource, 'native-explicit-loopback/browser-discovered');
  assert.equal(report.rtc.connections?.length, 2);
  for (const connection of report.rtc.connections) {
    assert.equal(connection.authenticated, true); assert.equal(connection.closed, true);
    hex(connection.nativePeer, 64); hex(connection.browserPeer, 64);
    assert.notEqual(connection.nativePeer, connection.browserPeer);
    assert.equal(connection.signaling?.closed, true); assert.equal(connection.signaling.sentMessages, 2);
    assert.ok(connection.signaling.sentBytes > 0);
    assert.ok(connection.native?.sentBytes > 0 && connection.native.receivedBytes > 0);
    assert.equal(connection.routes?.length, 2);
    for (const route of connection.routes) {
      assert.ok(['direct', 'relay', 'unknown'].includes(route.route));
      if (route.route === 'direct') assert.ok(['host', 'srflx', 'prflx'].includes(route.localCandidateType) && ['host', 'srflx', 'prflx'].includes(route.remoteCandidateType));
      if (route.route === 'relay') assert.ok(route.localCandidateType === 'relay' || route.remoteCandidateType === 'relay');
    }
  }
  hex(report.runtime?.dependencies?.lockSha256, 64);
  assert.ok(report.runtime.dependencies.packages?.length > 0);
  assert.ok(report.runtime.dependencies.packages.every(value => value.path && value.version && value.integrity));
  return { format: 'peer-generation-browser-summary/v1', source: report.source, artifacts: report.artifacts,
    executionManifestDigest: report.executionManifestDigest, browser: report.browser, ownership: report.ownership,
    hostOutage: report.hostOutage, reopen: report.reopen, recovery: report.recovery, content: report.content, rtc: report.rtc,
    limitations: ['Local Chromium OPFS and native RTC; mobile browsers, suspension, quota exhaustion and deployed networks were not exercised.',
      'The page/SDP host is a loopback test server, not Tendriller HTTP or deployed enrollment.',
      'Encrypted content interrupted at a verified chunk boundary; no provider cost or recovery-age bound is inferred.'] };
}
