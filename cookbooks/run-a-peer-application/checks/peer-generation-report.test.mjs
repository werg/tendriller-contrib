import { syntheticReport, syntheticRtcReport, syntheticHostedReport } from './peer-generation-report-fixtures.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validatePeerGenerationReport } from './peer-generation-report.mjs';

// Deliberately synthetic input tests the evidence boundary, not a runtime.

function rejects(mutate, message) {
  const value = syntheticReport();
  mutate(value);
  assert.throws(() => validatePeerGenerationReport(value), message);
}

test('peer-generation evidence retains actual source cleanliness and exact recovery limits', () => {
  const summary = validatePeerGenerationReport(syntheticReport());
  assert.equal(summary.source.dirty, true);
  assert.equal(summary.hostRequestsDuringCommands, 0);
  assert.deepEqual(summary.recovery.abandonedOperationIds, ['op-abandoned']);
  assert.equal(summary.recovery.previousHead, 4);
  assert.equal(summary.recovery.adoptedPosition, 2);
  assert.ok(summary.limitations.some(value => value.includes('not a deployed-network')));
});

test('a build, historical finalized profile or source checkout cannot qualify the packed peer session', () => {
  rejects(value => { value.mode = 'build-only'; });
  rejects(value => { value.profile = 'signed-inclusion-v2'; });
  rejects(value => { delete value.executionManifestDigest; });
  rejects(value => { value.source.commit = 'feat/portable-peer-core'; });
  rejects(value => { delete value.artifacts[0].sourceDirty; });
  rejects(value => { value.publicBoundary.siblingSourceImports = 1; });
  rejects(value => { value.publicBoundary.applicationRetryQueues = 1; });
  rejects(value => { value.publicBoundary.residentRequired = true; });
});

test('zero hosted command traffic needs an actual blocked workload and complete unchanged measurements', () => {
  rejects(value => { value.hostOutage.commandsApplied = 0; });
  rejects(value => { value.hostOutage.blockedProbeRejected = false; });
  rejects(value => { delete value.hostOutage.requests.before; });
  rejects(value => { value.hostOutage.requests.after += 1; });
  rejects(value => { value.hostOutage.applicationBodyBytes = { before: 100, after: 100 }; });
  rejects(value => { value.hostOutage.finalityCapability = true; });
});

test('lost-reply recovery must retain identity, original receipt and record count', () => {
  rejects(value => { value.lostReply.injectedAfterPersistence = false; });
  rejects(value => { value.lostReply.retriedOperationId = 'replacement'; });
  rejects(value => { value.lostReply.retriedReceipt.sequence += 1; });
  rejects(value => { value.lostReply.orderedRecords.after += 1; });
});

test('control participant qualification requires owned lifecycle and exact journaled takeover recovery', () => {
  for (const mutate of [
    value => { delete value.controlParticipant; },
    value => { value.controlParticipant.owner = 'fixture-retry-queue'; },
    value => { value.controlParticipant.attachRequests++; },
    value => { value.controlParticipant.definitionVerified = false; },
    value => { value.controlParticipant.recovery.injectedAfterSelection = false; },
    value => { value.controlParticipant.recovery.journalSavedBeforeRetry = false; },
    value => { value.controlParticipant.recovery.retriedRequest = 'b'.repeat(64); },
    value => { value.controlParticipant.recovery.retriedSelection = 'g3'; },
    value => { value.controlParticipant.recovery.originalSelection = 'g3'; value.controlParticipant.recovery.retriedSelection = 'g3'; },
    value => { value.controlParticipant.recovery.recoveryNoticeObserved = false; },
  ]) rejects(mutate);
});

test('tolerant recovery must remove the source, lose a suffix and preserve adopted and abandoned evidence', () => {
  rejects(value => { value.recovery.sourceRemoved = false; });
  rejects(value => { value.recovery.adoptedPosition = value.recovery.previousHead; });
  rejects(value => { value.recovery.freshPeerDigest = '2'.repeat(64); });
  rejects(value => { value.recovery.coherentReset = false; });
  rejects(value => { value.recovery.inheritedOperationIds.push('op-abandoned'); });
  rejects(value => { value.recovery.abandonedEvidencePreserved = false; });
});

test('returning old branches remain excluded across a later takeover', () => {
  rejects(value => { value.returningBranch.generationAfter = 'g1'; });
  rejects(value => { value.returningBranch.digestAfter = '2'.repeat(64); });
  rejects(value => { value.returningBranch.oldAttemptReadmitted = true; });
  rejects(value => { value.returningBranch.excludedAncestorReadopted = true; });
  rejects(value => { value.returningBranch.thirdGenerationChecked = false; });
});

test('deliberate reapplication needs new identity, linked abandoned intent and current guards', () => {
  rejects(value => { value.reapply.newOperationId = value.reapply.originalOperationId; });
  rejects(value => { value.reapply.reapplyOf = 'unknown'; });
  rejects(value => { value.reapply.currentGuardsChecked = false; });
  rejects(value => { value.reopen.identityAfter = 'replacement-device'; });
  rejects(value => { value.reopen.operationAfter.status = 'waiting'; });
});

test('owned participation requires actual connections, reconnect grace, explicit broader approval and closed delivery', () => {
  for (const mutate of [
    value => { delete value.participation; },
    value => { value.participation.owner = 'fixture-policy-loop'; },
    value => { value.participation.automaticConnections = false; },
    value => { value.participation.statuses = []; },
    value => { value.participation.hostOutage.blockedProbeRejected = false; },
    value => { value.participation.hostOutage.after.requests++; },
    value => { value.participation.automaticRecovery.elapsedMs = 149; },
    value => { value.participation.broaderRecovery.ageMs = 0; },
    value => { value.participation.broaderRecovery.approvalRequired = false; },
    value => { value.participation.broaderRecovery.staleApprovalRejected = false; },
    value => { value.participation.transport.pendingIntroductions++; },
    value => { value.participation.transport.connections[0].closed = false; },
  ]) rejects(mutate);
});

test('recovery freshness requires measured workload time and independent retained coverage', () => {
  for (const mutate of [
    value => { delete value.participation.automaticRecovery.workload; },
    value => { value.participation.automaticRecovery.workload.commands = 0; },
    value => { value.participation.automaticRecovery.workload.clock = 'author timestamp'; },
    value => { value.participation.automaticRecovery.workload.completion = 'shared'; },
    value => { value.participation.automaticRecovery.workload.retentionWaits = 32; },
    value => { value.participation.automaticRecovery.workload.disconnectedAtMs = NaN; },
    value => { value.participation.automaticRecovery.workload.observedAdoptedAgeMs = 0; },
    value => { value.participation.automaticRecovery.workload.retained.payload.point.sequence++; },
    value => { value.participation.automaticRecovery.workload.retained.payload.peer = '1'.repeat(64); },
    value => { value.participation.automaticRecovery.workload.independentStorageId = 'coordinator'; },
    value => { value.participation.automaticRecovery.workload.retained.signature = ''; },
  ]) rejects(mutate);
});


test('native RTC evidence keeps unknown routes and the actual introduction and byte boundaries', () => {
  const report = syntheticRtcReport();
  const summary = validatePeerGenerationReport(report);
  assert.equal(summary.rtc.connections[0].routes[0].route, 'unknown');
  assert.ok(summary.limitations.some(value => value.includes('in-process SDP')));
  assert.throws(() => validatePeerGenerationReport({ ...syntheticReport(), topology: 'independent-native-rtc' }));
});

test('host-independent RTC commands require authenticated traffic after signaling retires', () => {
  for (const mutate of [
    value => { value.rtc.connections[0].authenticated = false; },
    value => { value.rtc.connections[0].closed = false; },
    value => { value.hostOutage.transport.after.reliable.sentBytes = 100; },
    value => { value.hostOutage.transport.after.signaling = { sentMessages: 3, sentBytes: 4096, closed: true }; },
    value => { value.rtc.connections[0].routes[0].route = 'direct'; },
    value => { delete value.runtime.dependencies.lockSha256; },
    value => { delete value.rtc.candidateSource; },
  ]) {
    const report = syntheticRtcReport(); mutate(report);
    assert.throws(() => validatePeerGenerationReport(report));
  }
});


test('actual hosted evidence retains its synthetic identity and exact public artifact pairing', () => {
  const summary = validatePeerGenerationReport(syntheticHostedReport());
  assert.equal(summary.host.runtime, 'workerd');
  assert.ok(summary.limitations.some(value => value.includes('deployed login was not exercised')));
  assert.equal(summary.hostedTraffic.before.worker.host.rendezvousUpgrades, 4);
});

test('hosted publication evidence requires actual signed code, permissions, retry and restart observations', () => {
  for (const mutate of [
    value => { delete value.host.publication; },
    value => { value.host.publication.second.servedCodeDigest = '0'.repeat(64); },
    value => { value.host.publication.second.previous = '0'.repeat(64); },
    value => { value.host.publication.second.expectedCodeDigest = value.host.publication.first.expectedCodeDigest;
      value.host.publication.second.servedCodeDigest = value.host.publication.first.servedCodeDigest; },
    value => { value.host.publication.nonPublisher = value.host.publication.author; },
    value => { value.host.publication.administratorWithoutPublisher = false; },
    ...['sessionOwned', 'lostReplyAfterPersistence', 'savedIdentityRecovered',
      'exactRetry', 'alteredBytesRejected', 'nonPublisherRejected', 'staleHeadRejected',
      'authoredHtmlObserved', 'priorCodeRetained', 'headAndCodeSurviveRestart', 'applicationAuthorityUnchanged']
      .map(field => value => { value.host.publication[field] = false; }),
  ]) {
    const report = syntheticHostedReport(); mutate(report);
    assert.throws(() => validatePeerGenerationReport(report));
  }
});

test('actual host qualification refuses missing HTTP counters, hidden signaling and an unpinned host', () => {
  for (const mutate of [
    value => { delete value.hostOutage.observations.before.worker.host.httpRequests; },
    value => { value.hostOutage.observations.after.worker.host.rendezvousReceivedBytes++; },
    value => { value.hostOutage.observations.after.requestBodyBytes++; },
    value => { value.hostOutage.observations.before.worker.rendezvous[0].closed = false; },
    value => { delete value.host.artifacts[0].sourceDirty; },
    value => { value.rtc.signalingBoundary = 'one-off-in-process-sdp-mailbox'; },
    value => { delete value.host.participant; },
    value => { value.host.participant.route = 'peers/generations'; },
    value => { value.host.participant.hostRejected = []; },
    value => { value.host.participant.clientFilteredHttpRequests = 1; },
    value => { value.participation.transport.traffic.worker.invitations[0].closed = false; },
    value => { value.participation.transport.traffic.worker.rendezvous = []; },
  ]) {
    const report = syntheticHostedReport(); mutate(report);
    assert.throws(() => validatePeerGenerationReport(report));
  }
});
