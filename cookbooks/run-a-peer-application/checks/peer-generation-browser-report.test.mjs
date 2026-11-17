import { syntheticBrowserRelayReport } from './peer-generation-report-fixtures.mjs';
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

test('cold protocol evidence requires live and code exchange before any durable resource or module', () => {
  rejects(report => { delete report.lazyDatabase; });
  rejects(report => { report.lazyDatabase.protocol.observation.resources.lockRequests = 1; });
  rejects(report => { report.lazyDatabase.protocol.observation.resources.opfsRoots = 1; });
  rejects(report => { report.lazyDatabase.protocol.modulesRequested.push('data.mjs'); });
  rejects(report => { report.lazyDatabase.protocol.live.browserToNative = false; });
  rejects(report => { report.lazyDatabase.protocol.observation.protocol.servedCodeDigest = 'f'.repeat(64); });
  rejects(report => { report.lazyDatabase.protocol.observation.protocol.exchanges = []; });
});

test('first real queries must share one owner and preserve late ownership and close semantics', () => {
  rejects(report => { report.lazyDatabase.firstData.workers = 2; });
  rejects(report => { report.lazyDatabase.firstData.observation.resources.opfsRoots = 2; });
  rejects(report => { report.lazyDatabase.firstData.requests.method = 'initialize'; });
  rejects(report => { report.lazyDatabase.firstData.requests.results[1] = 'f'.repeat(64); });
  rejects(report => { report.lazyDatabase.firstData.sameIdentity = false; });
  rejects(report => { report.lazyDatabase.secondOwner.protocolOpened = false; });
  rejects(report => { report.lazyDatabase.unsupportedStorage.before.resources.opfsRoots = 1; });
  rejects(report => { report.lazyDatabase.dormantClose.before.resources.lockRequests = 1; });
  rejects(report => { report.lazyDatabase.activeClose.heldLocks.push('chronolog:peer-browser-fixture'); });
});


test('browser relay evidence requires Worker sockets, private payload isolation and host byte observations', () => {
  const summary = validateBrowserPeerReport(syntheticBrowserRelayReport());
  assert.ok(summary.relay.traffic.host.relayReceivedBytes > 0);
  for (const mutate of [
    report => { report.relay.controlOutageScope = 'entire-host'; },
    report => { report.browser.transportComposition.page = 'private-session-owner'; },
    report => { report.relay.traffic.sockets[0].plaintextMatches = ['private-live-signal-marker']; },
    report => { report.connections[0].routes[0].route = 'direct'; },
    report => { report.relay.traffic.host.relayReceivedBytes = 0; },
  ]) { const report = syntheticBrowserRelayReport(); mutate(report); assert.throws(() => validateBrowserPeerReport(report)); }
});
