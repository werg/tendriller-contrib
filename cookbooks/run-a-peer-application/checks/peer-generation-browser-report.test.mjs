import { syntheticBrowserReport as fixture } from './peer-generation-report-fixtures.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateBrowserPeerReport } from './peer-generation-browser-report.mjs';

// Synthetic evidence checks the validator. It does not qualify any runtime.
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
  rejects(report => { report.ownership.controlParticipant.owner = 'fixture-adapter'; });
  rejects(report => { report.ownership.controlParticipant.attachRequests = 1; });
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
  rejects(report => { report.recovery.capturedViewPreserved = false; });
  rejects(report => { delete report.recovery.staleCursorError; });
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
