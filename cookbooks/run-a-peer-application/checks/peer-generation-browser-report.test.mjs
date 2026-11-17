import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateBrowserPeerReport } from './peer-generation-browser-report.mjs';

// Synthetic evidence checks the validator. It does not qualify any runtime.
function fixture() {
  const digest = 'a'.repeat(64), id = 'b'.repeat(64), other = 'c'.repeat(64);
  const traffic = { controlRequests: 2, controlBodyBytes: 42, signalingRequests: 3, signalingBodyBytes: 1000 };
  const signaling = { descriptions: 2, bytes: 1000, closed: true };
  return {
    format: 'peer-generation-browser/v1', profile: 'peer-generation-v1', mode: 'runtime',
    topology: 'browser-worker-opfs-native-rtc', domain: 'conversation', passed: true, executionManifestDigest: digest,
    source: { commit: 'a'.repeat(40), tree: 'b'.repeat(40), dirty: true },
    artifacts: [{ name: '@chronolog/peer-session', version: '0.0.0-fixture', sha256: digest,
      sourceCommit: 'c'.repeat(40), sourceTree: 'd'.repeat(40), sourceDirty: false }],
    fixtures: Array.from({ length: 4 }, (_, index) => ({ path: `fixture-${index}.mjs`, sha256: digest })),
    browserAssets: [{ file: 'page.mjs', sha256: digest }, { file: 'worker.mjs', sha256: digest }],
    browserBundleInputs: ['peer-generation-browser-page.mjs', 'peer-generation-browser-worker.mjs',
      'peer-generation-definition.mjs', 'node_modules/@chronolog/peer-session/browser.mjs'],
    publicBoundary: { imports: ['@chronolog/peer-session', '@chronolog/peer-session/browser', '@chronolog/peer-session/native',
      '@chronolog/peer-session/webrtc', '@chronolog/peer-session/webrtc-native'], testTools: ['esbuild', 'playwright'],
      siblingSourceImports: 0, applicationRpcMaps: 0, applicationRetryQueues: 0, residentRequired: false },
    runtime: { dependencies: { lockSha256: digest, packages: Object.entries({ werift: '0.27.0', playwright: '1.65.0', esbuild: '0.28.2' })
      .map(([name, version]) => ({ path: `node_modules/${name}`, version, integrity: 'sha512-synthetic' })) } },
    browser: { implementation: 'chromium', version: '156.0.0', transportOwner: 'dedicated-worker', storage: 'opfs-with-exclusive-web-lock',
      signalingBoundary: 'loopback-fixture-http', controlBoundary: 'portable-registry-over-loopback-http',
      nativeCandidateSource: 'explicit-loopback-only', interfaceEnumeration: 'disabled-by-native-options', pageErrors: [],
      observations: { secureContext: true, storage: true, locks: true } },
    ui: { pages: ['board.html', 'compact.html'], domain: 'events', sessionFacade: 'connectApplicationWorker', sentThroughForms: 3,
      reapplicationConfirmed: true, recoveryNoticeVisible: true, originalReviewPreserved: true,
      draftBeforeRestart: 'An unsent draft', draftAfterRestart: 'An unsent draft', draftAfterRecovery: 'An unsent draft' },
    ownership: { workerOnly: true, secondOwnerRefused: true, secondTabRefused: true, unsupportedStorageRefused: true,
      unsupportedFault: 'Worker navigator.storage.getDirectory removed by the fixture', freshDeviceAwaitedKeys: true, pagePrivateKeys: 0,
      initialDeviceId: id, initialStorageId: '00000000-0000-0000-0000-000000000000',
      gracefulReopen: { sameDeviceId: true, sameStorageId: true, sameView: true, storedKeysReused: true },
      abruptWorkerReopen: { sameDeviceId: true, sameStorageId: true, sameView: true, durableOperation: true } },
    operations: { cancelledWaitPreservedAttempt: true, resumedExactAttempt: true, enrolledFromPeer: true, receiptPeer: other },
    hostOutage: { blocked: true, blockedProbeRejected: true, commandsApplied: 2, before: traffic, after: structuredClone(traffic),
      transport: { before: { reliable: { sentBytes: 100, receivedBytes: 100 }, signaling },
        after: { reliable: { sentBytes: 500, receivedBytes: 500 }, signaling } },
      liveSignalsObserved: 1, disposablePathsDidNotAppend: true, coherentReadView: true,
      content: { bytes: 32_768, sha256: digest, retainedByBrowser: true } },
    recovery: { originatorClosed: true, originatorStoreUnavailable: true, priorHead: { sequence: 6 }, adoptedPrefix: { sequence: 4 },
      selectedGeneration: id, originalAttempt: { status: 'needsReapply', operationId: 'old-op', attemptId: 'old-attempt' },
      reapplied: { outcome: 'accepted', operationId: 'new-op', attemptId: 'new-attempt' }, reapplyOf: 'old-attempt',
      currentGuardsChecked: true, staleCursorError: 'RecoveredViewError', heldViewPreserved: true, noticesPersisted: 1, transitionJournalEntries: 1 },
    freshPeer: { joinedAfterOriginatorLoss: true, enrolledFromBrowser: true, generation: id, browserViewSha256: digest, nativeViewSha256: digest },
    contentRecovery: { bytes: 131_095, interruptedAfter: 65_536, partialRetentionRefused: true, partialSurvivedRestart: true,
      unavailableRemainderRefused: true, completeAfterReconnect: true, retainedBy: id, retentionSignature: 'a'.repeat(128) },
    connections: Array.from({ length: 4 }, () => ({ authenticated: true, nativeClosed: true, peers: [id, other], signaling,
      routes: Array.from({ length: 2 }, () => ({ route: 'direct', localCandidateType: 'host', remoteCandidateType: 'host' })) })),
  };
}
const rejects = mutate => { const report = fixture(); mutate(report); assert.throws(() => validateBrowserPeerReport(report)); };

test('browser evidence retains preview provenance and exact local-only limits', () => {
  const result = validateBrowserPeerReport(fixture());
  assert.equal(result.qualification, 'development-preview');
  assert.equal(result.hostRequestsDuringCommands, 0);
  assert.ok(result.limitations.some(value => value.includes('quota exhaustion')));
  assert.ok(result.limitations.some(value => value.includes('separate hosted gate')));
});
test('a page proxy simulation or bundled source checkout cannot qualify the Worker runtime', () => {
  rejects(report => { report.publicBoundary.applicationRpcMaps = 1; });
  rejects(report => { report.publicBoundary.applicationRetryQueues = 1; });
  rejects(report => { report.browser.transportOwner = 'page'; });
  rejects(report => { report.browserBundleInputs.push('../chronolog/packages/peer-session/src/session.ts'); });
  rejects(report => { report.ownership.secondOwnerRefused = false; });
  rejects(report => { report.ui.sessionFacade = 'fixture-rpc'; });
  rejects(report => { report.ui.reapplicationConfirmed = false; });
  rejects(report => { report.ui.draftAfterRecovery = ''; });
});
test('the browser host-outage claim requires measured traffic and actual peer work', () => {
  rejects(report => { report.hostOutage.after.signalingRequests++; });
  rejects(report => { delete report.hostOutage.before.controlBodyBytes; });
  rejects(report => { report.hostOutage.transport.after.reliable.sentBytes = 100; });
  rejects(report => { report.browser.controlBoundary = 'deployed-tendriller'; });
  rejects(report => { report.connections[0].authenticated = false; });
});
test('browser recovery needs lost originator storage, key enrollment, linked reapply, and same-view fresh replay', () => {
  rejects(report => { report.recovery.originatorStoreUnavailable = false; });
  rejects(report => { report.recovery.adoptedPrefix.sequence = 6; });
  rejects(report => { report.recovery.reapplyOf = 'another-attempt'; });
  rejects(report => { report.recovery.reapplied.operationId = 'old-op'; });
  rejects(report => { report.recovery.heldViewPreserved = false; });
  rejects(report => { report.recovery.staleCursorError = undefined; });
  rejects(report => { report.freshPeer.nativeViewSha256 = 'f'.repeat(64); });
  rejects(report => { report.freshPeer.enrolledFromBrowser = false; });
});
test('reopening must retain the browser identity, durable key enrollment, and the applied operation', () => {
  rejects(report => { report.ownership.gracefulReopen.sameDeviceId = false; });
  rejects(report => { report.ownership.gracefulReopen.storedKeysReused = false; });
  rejects(report => { report.ownership.abruptWorkerReopen.durableOperation = false; });
  rejects(report => { report.contentRecovery.partialRetentionRefused = false; });
  rejects(report => { report.contentRecovery.partialSurvivedRestart = false; });
});

test('task UI qualification requires both exact engines, guarded forms, and shared work after originator loss', () => {
  const report = fixture(), digest = 'a'.repeat(64);
  report.domain = 'tasks'; report.ui.domain = 'tasks'; report.browser.observations.isolated = true;
  report.publicBoundary.imports.push('@chronolog/peer-session/sql-native', '@chronolog/peer-session/sql-browser'); report.publicBoundary.imports.sort();
  report.browserAssets.push({ file: 'browser-engine/sqlite3.wasm', sha256: digest });
  report.sql = { native: { implementation: '@dolthub/doltlite@0.11.29', patchSha256: digest, manifest: { synthetic: true } },
    browser: { manifest: { nativeManifest: { synthetic: true }, wasmSha256: digest } } };
  report.tasks = { definitionId: 'shared-peer-task-board', signedSchemaDigest: digest,
    board: { created: true, claimed: true, finished: true }, compact: { claimed: true, finished: true },
    competingClaim: 'rejected', unauthorizedFinish: 'rejected', commandsWithHostBlocked: 3,
    unsharedOriginatorClaim: 'excluded-claim', unsharedClaimExcluded: true,
    sharedTaskCompletedAfterCreatorClosed: true, sqlAndEventsSelectedTogether: true };
  assert.equal(validateBrowserPeerReport(report).tasks.definitionId, 'shared-peer-task-board');
  for (const mutate of [
    value => { value.browser.observations.isolated = false; },
    value => { value.sql.browser.manifest.wasmSha256 = 'b'.repeat(64); },
    value => { value.sql.browser.manifest.nativeManifest = { synthetic: 'different' }; },
    value => { value.tasks.competingClaim = 'accepted'; }, value => { value.tasks.compact.finished = false; },
    value => { value.tasks.sharedTaskCompletedAfterCreatorClosed = false; },
  ]) { const changed = structuredClone(report); mutate(changed); assert.throws(() => validateBrowserPeerReport(changed)); }
});
