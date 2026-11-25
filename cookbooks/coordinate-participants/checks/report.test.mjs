import assert from 'node:assert/strict';
import test from 'node:test';
import { requiredChecks, validateCollaborationReport } from './report.mjs';

// Synthetic values test the validator; they are never emitted as qualification.
function example() {
  const observations = {
    compositeDomainIdentities: { threads: ['collision:a', 'collision'], messageIds: ['b', 'a:b'], retainedPerThread: [1, 1],
      exactRetryIdempotent: true, changedContentRejected: true, originalSignedReferences: true },
    rawProjectionShapeGuard: { retainedEvidenceQueryable: true, malformedRecordsRetained: false,
      probes: ['objectInput', 'objectContent', 'objectSource', 'deepInput', 'duplicateInput', 'duplicateDisposition', 'nonfiniteInput', 'invalidEnvelope'].map(name => ({
        name, outcome: 'rejected', rejectionCode: ['objectInput', 'objectContent', 'objectSource'].includes(name) ? 'assert:collab_json_fields'
          : name === 'invalidEnvelope' ? 'assert:collab_envelope' : 'assert:collab_json_structure' })) },
    reviewerCapacityRecovery: { activeClaimsAtStart: 4, rejectedBeforeRelease: true, acceptedAfterRelease: true,
      targetOutcomes: ['claim-conflict', 'accepted'], resultId: 'capacity-result', externalEffects: false },
    boundedCapturedPages: { heldTaskCount: 5, visibleTaskLimit: 2, completeAcceptedSummaries: 2, capturedMessages: 2, latestMessages: 3,
      stableAcrossWrites: true, noDuplicatesOrOmissions: true, acceptedSummaryContentOmitted: true, staleCursorRejected: true,
      wrongThreadRejected: true, wrongTaskRejected: true, acceptedAndLateEvidenceRetained: true, releasedReaderRejected: true },
    capturedReadScope: { eventsOnlyRawDenied: 'ENDPOINT_CAPABILITY_FORBIDDEN', namedQueryRawDenied: 'ENDPOINT_RAW_SQL_FORBIDDEN',
      queryOnlyEventsDenied: 'ENDPOINT_CAPABILITY_FORBIDDEN', noReadCapabilityViewDenied: 'ENDPOINT_CAPABILITY_FORBIDDEN',
      eventsOnlyViewAllowed: true, eventsOnlyEventsAllowed: true, eventsOnlyViewLimitDenied: 'ENDPOINT_VIEW_LIMIT',
      releasedViewRestoredCapacity: true, allowedNamedQuery: true, allowedRawQuery: true,
      deniedCaptureReleasedReservation: true, reviewerReadFailureRetiredObserver: true, siblingUsable: true },
    independentPendingReferences: { foreignApplicationRejected: true, foreignSignerRetryRejected: true },
    provisionalOfflineClaimRace: { offlineOutcomes:['accepted','accepted'],globalExclusivityOffline:false,outcomes: ['accepted', 'rejected'] }, rawProgramGuard: { outcome: 'rejected', rejectionCode: 'assert:collab_immutable' },
    rawForgedResultGuard: { outcome: 'rejected', rejectionCode: 'assert:collab_result_disposition', retainedForgedResult: false },
    schemaDdlGuard: { outcome: 'rejected', rejectionCode: 'denied' },
    ownerVerifiedAuthority: { verifiedSignature: true, mutatedReturnDidNotMutateOwner: true, hostTransportConfigured: false },
    rawForgedProposalGuard: { outcome: 'rejected', rejectionCode: 'assert:collab_proposal' },
    signedOperationLineage: { bodyReferenceIgnored: true, sourceSignerForced: true,
      references: Array(6).fill({ applicationId: '1'.repeat(64), author: '2'.repeat(64), proposalId: '3'.repeat(64), operationId: 'signed-op' }) },
    scaleProfile: { signingParticipants: 8, simultaneousAttachments: 32, successfulViews: 32,
      owners: Array.from({ length: 8 }, (_, index) => `owner-${index}`), attachmentsPerOwner: Array(8).fill(4) },
    noisyEndpointIsolation: { rejected: 'ENDPOINT_STREAM_LIMIT', siblingQuerySucceeded: true, ownerClosed: false },
    independentReviewPolicies: { policies: ['evidence', 'clarity'], signers: ['reviewer-a', 'reviewer-b'], externalEffects: false },
    staleClaimRejected: { acceptedAsCurrent: false, disposition: 'superseded' }, resultIdentityConflict: { conflict: 'rejected' },
    ordinaryInitialization:{proposalId:'1'.repeat(64),rootAuthor:'2'.repeat(64),specialSchemaChannel:false},
    lateClaimRevision: { before:'1'.repeat(64),after:'2'.repeat(64),revisionBefore:'3'.repeat(64),revisionAfter:'4'.repeat(64),originalProposalId:'1'.repeat(64),revisedOriginalOutcome:'rejected',capturedStable:true },
    independentFinalityFacts: { stored:true,materialized:true,finalized:false,finalityWait:'FINALITY_UNSUPPORTED',agentRequired:false }, operationIdentityAfterReopen: {
      signerBefore: 'same-signer', signerAfter: 'same-signer', storageBefore: 'same-store', storageAfter: 'same-store',
      operationBefore: { operationId: 'stable',proposalId:'3'.repeat(64),stored:true,materialized:{outcome:'rejected'} }, operationAfter: { operationId: 'stable',proposalId:'3'.repeat(64),stored:true,materialized:{outcome:'rejected'} },
    },
  };
  return { format: 'tendriller-collaboration-authored-consumer/v1', mode: 'native-public-artifacts', passed: true, error: null,
    source: { commit: 'a'.repeat(40), tree: 'b'.repeat(40), dirty: false },
    artifacts: ['@chronolog/authority','@chronolog/peer-session', '@tendriller/core'].map(name => ({ name, sha256: 'c'.repeat(64),
      sourceCommit: 'd'.repeat(40), sourceTree: 'e'.repeat(40), sourceDirty: false })),
    fixtures: [{ path: 'consumer.mjs', sha256: 'f'.repeat(64) }],
    publicBoundary: { siblingSourceImports: 0, applicationRetryQueues: 0,
      imports: ['@tendriller/core/collaboration', '@chronolog/peer-session/sql-native'] },
    topology: { transport: 'direct-authenticated', signers: ['1', '2', '3', '4', '5', '6', '7', '8'].map(value => value.repeat(64)),
      journeySigners: ['1', '2', '3', '4', '5', '6'].map(value => value.repeat(64)), attachments: 32, independentAgents: 2, processes: 1, physicalDevices: 0, grants: Array(8).fill({ dataRole: 'member' }) },
    checks: requiredChecks.map(name => ({ name, passed: true, observation: observations[name] ?? { observed: true } })),
    measurements: { elapsedMs: 20, performanceBudget: null, distributions: Object.fromEntries(
      Object.entries({ commandMaterializedMs: 15, convergenceMs: 2, viewQueryMs: 32, reopenedMs: 1 }).map(([name, samples]) =>
        [name, { samples, values: Array(samples).fill(1), p50: 1, p95: 1, maximum: 1 }])),
      memory: { maxRssBytes: 1024, sampledHeapUsedBytes: 512 }, counters: { observedEndpointStreamLimitRejections: 1, signalTransportDrops: null } },
    claims: { browserQualified: false, physicalDeviceQualified: false, deployedHostQualified: false,
      conversationalResumeQualified: false, exactlyOnceExternalEffects: false }, runtime: { node: 'synthetic' },
  };
}

test('one exact public composition retains local-only evidence boundaries', () => {
  const result = validateCollaborationReport(example());
  assert.equal(result.topology.signers.length, 8); assert.equal(result.topology.journeySigners.length, 6);
  assert.equal(result.claims.conversationalResumeQualified, false);
});

test('missing, repeated, failed or dirty observations cannot qualify the composition', () => {
  for (const mutate of [
    report => report.checks.pop(),
    report => report.checks.push(report.checks[0]),
    report => { report.checks[0].passed = false; },
    report => { report.source.dirty = true; },
    report => { report.artifacts[0].sourceDirty = true; },
    report => { report.publicBoundary.siblingSourceImports = 1; },
    report => { report.topology.signers[1] = report.topology.signers[0]; },
    report => { report.checks.find(value => value.name === 'scaleProfile').observation.successfulViews = 31; },
    report => { report.checks.find(value => value.name === 'noisyEndpointIsolation').observation.siblingQuerySucceeded = false; },
  ]) { const report = example(); mutate(report); assert.throws(() => validateCollaborationReport(report)); }
});

test('unsupported offline exclusivity, finality, replay and provider conclusions are refused', () => {
  for (const mutate of [
    report => { report.checks.find(value => value.name === 'provisionalOfflineClaimRace').observation.outcomes = ['accepted', 'accepted']; },
    report => { report.checks.find(value => value.name === 'rawProgramGuard').observation.outcome = 'accepted'; },
    report => { report.checks.find(value => value.name === 'lateClaimRevision').observation.capturedStable = false; },
    report => { report.checks.find(value => value.name === 'operationIdentityAfterReopen').observation.operationAfter.operationId = 'new'; },
    report => { report.checks.find(value => value.name === 'signedOperationLineage').observation.bodyReferenceIgnored = false; },
    report => { report.checks.find(value => value.name === 'rawForgedProposalGuard').observation.outcome = 'accepted'; },
    report => { report.checks.find(value => value.name === 'rawProjectionShapeGuard').observation.probes.pop(); },
    report => { report.checks.find(value => value.name === 'compositeDomainIdentities').observation.retainedPerThread = [1, 0]; },
    report => { report.checks.find(value => value.name === 'ownerVerifiedAuthority').observation.verifiedSignature = false; },
    report => { report.checks.find(value => value.name === 'capturedReadScope').observation.deniedCaptureReleasedReservation = false; },
    report => { report.checks.find(value => value.name === 'capturedReadScope').observation.eventsOnlyViewAllowed = false; },
    report => { report.checks.find(value => value.name === 'capturedReadScope').observation.releasedViewRestoredCapacity = false; },
    report => { report.checks.find(value => value.name === 'boundedCapturedPages').observation.noDuplicatesOrOmissions = false; },
    report => { report.checks.find(value => value.name === 'reviewerCapacityRecovery').observation.targetOutcomes = ['claim-conflict']; },
    report => { report.checks.find(value=>value.name==='independentFinalityFacts').observation.finalized=true; },
    report => { report.checks.find(value=>value.name==='provisionalOfflineClaimRace').observation.globalExclusivityOffline=true; },
    report => { report.format='tendriller-collaboration-consumer/v1'; },
    report => { report.claims.browserQualified = true; },
    report => { report.claims.conversationalResumeQualified = true; },
    report => { report.claims.exactlyOnceExternalEffects = true; },
  ]) { const report = example(); mutate(report); assert.throws(() => validateCollaborationReport(report)); }
});
