import assert from 'node:assert/strict';
import { validateRelayTraffic } from './peer-generation-relay-report.mjs';

/** Validate the observations this gate actually runs; never infer deployment. */
export function validateBrowserPeerReport(report) {
  assert.equal(report.format, 'peer-generation-browser/v1');
  assert.equal(report.profile, 'peer-generation-v1'); assert.equal(report.mode, 'runtime');
  assert.ok(['browser-worker-opfs-native-rtc', 'browser-worker-opfs-websocket'].includes(report.topology));
  const relay = report.topology === 'browser-worker-opfs-websocket'; assert.equal(report.passed, true);
  assert.match(report.executionManifestDigest, /^[a-f0-9]{64}$/u);
  assert.match(report.source.commit, /^[a-f0-9]{40}$/u); assert.match(report.source.tree, /^[a-f0-9]{40}$/u);
  assert.equal(typeof report.source.dirty, 'boolean');
  assert.equal(report.artifacts.length, 1);
  const artifact = report.artifacts[0];
  assert.equal(artifact.name, '@chronolog/peer-session'); assert.match(artifact.sha256, /^[a-f0-9]{64}$/u);
  assert.match(artifact.sourceCommit, /^[a-f0-9]{40}$/u); assert.match(artifact.sourceTree, /^[a-f0-9]{40}$/u);
  assert.equal(typeof artifact.sourceDirty, 'boolean');
  assert.deepEqual(report.publicBoundary.imports, ['@chronolog/peer-session', '@chronolog/peer-session/browser',
    '@chronolog/peer-session/native', '@chronolog/peer-session/worker',
    ...(relay ? ['@chronolog/peer-session/websocket', '@tendriller/core/peers'] : ['@chronolog/peer-session/webrtc', '@chronolog/peer-session/webrtc-native'])].sort());
  assert.deepEqual(report.publicBoundary.testTools, ['esbuild', 'playwright']);
  for (const field of ['siblingSourceImports', 'applicationRpcMaps', 'applicationRetryQueues']) assert.equal(report.publicBoundary[field], 0);
  assert.equal(report.publicBoundary.residentRequired, false);
  assert.ok(report.fixtures.length >= 4);
  for (const fixture of report.fixtures) assert.match(fixture.sha256, /^[a-f0-9]{64}$/u);
  assert.ok(report.browserAssets.length >= 2);
  for (const asset of report.browserAssets) assert.match(asset.sha256, /^[a-f0-9]{64}$/u);
  assert.ok(report.browserBundleInputs.length > 3);
  for (const input of report.browserBundleInputs) assert.ok(input.startsWith('node_modules/@chronolog/peer-session/') || relay && input.startsWith('node_modules/@tendriller/core/') ||
    ['peer-generation-browser-page.mjs', 'peer-generation-browser-worker.mjs', 'peer-generation-definition.mjs',
      'app.mjs', 'typing.mjs', 'recovery-choice.mjs', 'deployment/bootstrap.mjs', 'peer-generation-browser-transport.mjs'].includes(input));
  assert.match(report.runtime.dependencies.lockSha256, /^[a-f0-9]{64}$/u);
  for (const [name, version] of Object.entries({ ...(relay ? {} : { werift: '0.27.0' }), playwright: '1.65.0', esbuild: '0.28.2' })) {
    assert.ok(report.runtime.dependencies.packages.some(item => item.path === `node_modules/${name}` && item.version === version && item.integrity));
  }
  const browser = report.browser;
  assert.equal(browser.implementation, 'chromium'); assert.equal(typeof browser.version, 'string');
  assert.equal(browser.transportOwner, 'dedicated-worker'); assert.equal(browser.storage, 'opfs-with-exclusive-web-lock');
  assert.equal(browser.signalingBoundary, relay ? 'workerd-relay-pairing' : 'loopback-fixture-http');
  assert.equal(browser.controlBoundary, 'chronolog-participant-over-loopback-http');
  assert.equal(browser.nativeCandidateSource, relay ? 'not-used' : 'explicit-loopback-only');
  assert.equal(browser.interfaceEnumeration, relay ? 'not-used' : 'disabled-by-native-options');
  assert.deepEqual(browser.pageErrors, []);
  for (const field of ['secureContext', 'storage', 'locks']) assert.equal(browser.observations[field], true);
  const ui = report.ui;
  assert.deepEqual(ui.pages, ['board.html', 'compact.html']); assert.equal(ui.domain, 'events');
  assert.equal(ui.sessionFacade, 'connectApplicationWorker'); assert.equal(ui.sentThroughForms, 3);
  for (const field of ['reapplicationConfirmed', 'recoveryNoticeVisible', 'originalReviewPreserved']) assert.equal(ui[field], true);
  assert.ok(typeof ui.draftBeforeRestart === 'string' && ui.draftBeforeRestart.length > 0);
  assert.equal(ui.draftAfterRestart, ui.draftBeforeRestart); assert.equal(ui.draftAfterRecovery, ui.draftBeforeRestart);
  const ownership = report.ownership;
  for (const field of ['workerOnly', 'secondOwnerRefused', 'secondTabRefused', 'unsupportedStorageRefused', 'freshDeviceAwaitedKeys']) assert.equal(ownership[field], true);
  assert.equal(ownership.unsupportedFault, 'Worker navigator.storage.getDirectory removed by the fixture');
  assert.equal(ownership.pagePrivateKeys, 0);
  assert.equal(ownership.controlParticipant?.owner, 'application-session');
  assert.equal(ownership.controlParticipant.attachRequests, 0);
  assert.match(ownership.initialDeviceId, /^[a-f0-9]{64}$/u); assert.match(ownership.initialStorageId, /^[a-f0-9-]{36}$/u);
  for (const field of ['sameDeviceId', 'sameStorageId', 'sameView', 'storedKeysReused']) assert.equal(ownership.gracefulReopen[field], true);
  for (const field of ['sameDeviceId', 'sameStorageId', 'sameView', 'durableOperation']) assert.equal(ownership.abruptWorkerReopen[field], true);
  for (const field of ['cancelledWaitPreservedAttempt', 'resumedExactAttempt', 'enrolledFromPeer']) assert.equal(report.operations[field], true);
  assert.notEqual(report.operations.receiptPeer, ownership.initialDeviceId);
  const outage = report.hostOutage;
  assert.equal(outage.blocked, true); assert.equal(outage.blockedProbeRejected, true); assert.ok(outage.commandsApplied >= 2);
  for (const field of ['controlRequests', 'controlBodyBytes', 'signalingRequests', 'signalingBodyBytes']) {
    assert.ok(Number.isSafeInteger(outage.before[field]) && outage.before[field] >= 0);
    assert.equal(outage.after[field], outage.before[field]);
  }
  assert.ok(outage.transport.after.reliable.sentBytes > outage.transport.before.reliable.sentBytes);
  assert.ok(outage.transport.after.reliable.receivedBytes > outage.transport.before.reliable.receivedBytes);
  assert.deepEqual(outage.transport.after.signaling, outage.transport.before.signaling);
  assert.ok(outage.liveSignalsObserved >= 1); assert.equal(outage.disposablePathsDidNotAppend, true); assert.equal(outage.coherentReadView, true);
  assert.ok(outage.content.bytes >= 32_768); assert.match(outage.content.sha256, /^[a-f0-9]{64}$/u); assert.equal(outage.content.retainedByBrowser, true);
  const content = report.contentRecovery;
  assert.ok(content.bytes > content.interruptedAfter && content.interruptedAfter >= 65_536);
  for (const field of ['partialRetentionRefused', 'partialSurvivedRestart', 'unavailableRemainderRefused', 'completeAfterReconnect']) assert.equal(content[field], true);
  assert.equal(content.retainedBy, ownership.initialDeviceId); assert.match(content.retentionSignature, /^[a-f0-9]{128}$/u);
  const recovery = report.recovery;
  assert.equal(recovery.originatorClosed, true); assert.equal(recovery.originatorStoreUnavailable, true);
  assert.ok(Number.isSafeInteger(recovery.adoptedPrefix.sequence) && recovery.adoptedPrefix.sequence < recovery.priorHead.sequence);
  assert.ok(['abandoned', 'needsReapply'].includes(recovery.originalAttempt.status));
  assert.equal(recovery.reapplied.outcome, 'accepted');
  assert.notEqual(recovery.reapplied.attemptId, recovery.originalAttempt.attemptId);
  assert.notEqual(recovery.reapplied.operationId, recovery.originalAttempt.operationId);
  assert.equal(recovery.reapplyOf, recovery.originalAttempt.attemptId); assert.equal(recovery.currentGuardsChecked, true);
  assert.equal(recovery.capturedViewPreserved, true);
  assert.equal(recovery.staleCursorError, 'RecoveredViewError');
  assert.ok(recovery.noticesPersisted > 0); assert.equal(recovery.transitionJournalEntries, 1);
  assert.equal(report.freshPeer.joinedAfterOriginatorLoss, true); assert.equal(report.freshPeer.enrolledFromBrowser, true);
  assert.equal(report.freshPeer.generation, recovery.selectedGeneration);
  assert.match(report.freshPeer.browserViewSha256, /^[a-f0-9]{64}$/u);
  assert.equal(report.freshPeer.nativeViewSha256, report.freshPeer.browserViewSha256);
  assert.ok(report.connections.length >= 4);
  for (const connection of report.connections) {
    assert.equal(connection.authenticated, true); assert.equal(connection.nativeClosed, true);
    assert.equal(connection.peers.length, 2); assert.notEqual(connection.peers[0], connection.peers[1]);
    assert.equal(connection.signaling.descriptions, relay ? 0 : 2); assert.equal(connection.signaling.closed, true);
    assert.equal(connection.routes.length, 2);
    for (const route of connection.routes) assert.ok(relay ? route.route === 'websocket-relay' : route.route === 'direct' && route.localCandidateType && route.remoteCandidateType);
  }
  if (relay) {
    validateRelayTraffic(report.relay, { implementation: 'browser-and-native-websocket', minimumSockets: report.connections.length * 4 });
    assert.equal(report.host?.runtime, 'workerd');
    assert.equal(report.host.identity, 'synthetic authenticated test accounts');
    assert.deepEqual(report.host.publicImports, ['@tendriller/core/peers', '@tendriller/engine/testing']);
    assert.equal(browser.transportComposition.page, 'no-transport-owner');
    assert.equal(browser.transportComposition.worker, 'openWebSocketConnection');
  }
  return { format: 'peer-generation-browser-summary/v1', passed: true,
    qualification: !report.source.dirty && !artifact.sourceDirty ? 'clean-source-pair' : 'development-preview',
    source: report.source, artifacts: report.artifacts, ui, ...(relay ? { relay: report.relay, host: report.host } : {}), browser: { version: browser.version, transportOwner: browser.transportOwner, storage: browser.storage },
    hostRequestsDuringCommands: outage.after.controlRequests - outage.before.controlRequests,
    signalingRequestsDuringCommands: outage.after.signalingRequests - outage.before.signalingRequests,
    recovery: { previousHead: recovery.priorHead.sequence, adoptedPrefix: recovery.adoptedPrefix.sequence,
      abandonedOperationId: recovery.originalAttempt.operationId, reappliedOperationId: recovery.reapplied.operationId },
    identityReopened: { graceful: true, abruptWorker: true },
    limitations: [
      ...(relay ? ['Control HTTP is blocked independently of relay availability; WebSocket ciphertext consumes observed host bandwidth.'] : []),
      relay ? 'Local Chromium/native WebSocket and Workerd only; no deployed WSS, Internet, home/mobile/restrictive network or provider billing qualification.' : 'Local Chromium and native UDP loopback only; no deployed Internet, home/mobile/restrictive network or provider billing qualification.',
      'Control and signaling use a measured portable registry HTTP fixture; actual Tendriller workerd HTTP is qualified by the separate hosted gate.',
      'Abrupt Worker loss occurs after an observed durable apply; quota exhaustion, storage eviction, and interrupted-write crash injection are not covered.',
      'The browser gate uses the event execution runtime; SQL engine behavior requires its separate public-artifact gate.',
    ] };
}
