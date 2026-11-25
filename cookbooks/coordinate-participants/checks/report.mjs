import assert from 'node:assert/strict';

export const requiredChecks = Object.freeze([
  'sixIndependentSigners', 'twoAttachmentsOneOwner', 'ownerVerifiedAuthority', 'capturedReadScope', 'sourceEndpointIsolation',
  'detachIsolation', 'malformedPortIsolation', 'signalRunIsolation',
  'scaleProfile', 'noisyEndpointIsolation', 'provisionalOfflineClaimRace', 'rawProgramGuard',
  'rawForgedResultGuard', 'rawForgedProposalGuard', 'rawProjectionShapeGuard', 'compositeDomainIdentities', 'signedOperationLineage', 'schemaDdlGuard', 'staleClaimRejected',
  'resultIdentityConflict', 'independentReviewPolicies', 'frozenContributionSlots', 'aggregateProvenance',
  'cancellationAcknowledgment', 'boundedCapturedPages', 'reviewerCapacityRecovery', 'ordinaryInitialization','lateClaimRevision','independentFinalityFacts',
  'operationIdentityAfterReopen', 'independentDrafts', 'independentPendingReferences',
]);

/** Validate observations without promoting local execution into a deployed claim. */
export function validateCollaborationReport(report, { allowDirty = false } = {}) {
  const hex = (value, length) => assert.match(value ?? '', new RegExp(`^[a-f0-9]{${length}}$`, 'u'));
  assert.equal(report?.format, 'tendriller-collaboration-authored-consumer/v1');
  assert.equal(report.mode, 'native-public-artifacts');
  assert.equal(report.passed, true);
  assert.equal(report.error, null);
  hex(report.source?.commit, 40); hex(report.source?.tree, 40);
  assert.equal(typeof report.source.dirty, 'boolean');
  if (!allowDirty) assert.equal(report.source.dirty, false, 'Consumer source must be clean');
  assert.deepEqual(report.artifacts.map(value => value.name).sort(), ['@chronolog/authority','@chronolog/peer-session', '@tendriller/core']);
  for (const artifact of report.artifacts) {
    hex(artifact.sha256, 64); hex(artifact.sourceCommit, 40); hex(artifact.sourceTree, 40);
    assert.equal(typeof artifact.sourceDirty, 'boolean');
    if (!allowDirty) assert.equal(artifact.sourceDirty, false, 'Public artifact source must be clean');
  }
  assert.ok(report.fixtures.length > 0);
  for (const fixture of report.fixtures) { assert.ok(fixture.path); hex(fixture.sha256, 64); }
  assert.equal(report.publicBoundary.siblingSourceImports, 0);
  assert.equal(report.publicBoundary.applicationRetryQueues, 0);
  assert.ok(report.publicBoundary.imports.includes('@tendriller/core/collaboration'));
  assert.ok(report.publicBoundary.imports.includes('@chronolog/peer-session/sql-native'));
  assert.equal(report.topology.transport, 'direct-authenticated');
  assert.equal(report.topology.signers.length, 8);
  assert.equal(new Set(report.topology.signers).size, 8);
  for (const signer of report.topology.signers) hex(signer, 64);
  assert.equal(new Set(report.topology.journeySigners).size, 6);
  assert.ok(report.topology.journeySigners.every(signer => report.topology.signers.includes(signer)));
  assert.equal(report.topology.attachments, 32);
  assert.equal(report.topology.independentAgents, 2);
  assert.equal(report.topology.processes, 1); assert.equal(report.topology.physicalDevices, 0);
  assert.equal(report.topology.grants.length, 8);
  const names = report.checks.map(value => value.name);
  assert.equal(new Set(names).size, names.length, 'Duplicate observations cannot stand for missing gates');
  assert.deepEqual([...names].sort(), [...requiredChecks].sort());
  for (const check of report.checks) {
    assert.equal(check.passed, true, `Failed gate: ${check.name}`);
    assert.ok(check.observation && typeof check.observation === 'object', `Missing observation: ${check.name}`);
  }
  const observation = name => report.checks.find(value => value.name === name).observation;
  assert.deepEqual(observation('provisionalOfflineClaimRace').offlineOutcomes,['accepted','accepted']);
  assert.equal(observation('provisionalOfflineClaimRace').globalExclusivityOffline,false);
  assert.deepEqual(observation('provisionalOfflineClaimRace').outcomes.slice().sort(), ['accepted', 'rejected']);
  assert.equal(observation('rawProgramGuard').outcome, 'rejected');
  assert.equal(observation('rawProgramGuard').rejectionCode, 'assert:collab_immutable');
  assert.equal(observation('rawForgedResultGuard').outcome, 'rejected');
  assert.equal(observation('rawForgedResultGuard').rejectionCode, 'assert:collab_result_disposition');
  assert.equal(observation('rawForgedResultGuard').retainedForgedResult, false);
  assert.equal(observation('rawForgedProposalGuard').outcome, 'rejected');
  assert.equal(observation('rawForgedProposalGuard').rejectionCode, 'assert:collab_proposal');
  const shape = observation('rawProjectionShapeGuard');
  assert.equal(shape.retainedEvidenceQueryable, true); assert.equal(shape.malformedRecordsRetained, false);
  assert.deepEqual(shape.probes.map(value => value.name).sort(), ['objectInput', 'objectContent', 'objectSource', 'deepInput',
    'duplicateInput', 'duplicateDisposition', 'nonfiniteInput', 'invalidEnvelope'].sort());
  for (const probe of shape.probes) {
    assert.equal(probe.outcome, 'rejected');
    assert.equal(probe.rejectionCode, ['objectInput', 'objectContent', 'objectSource'].includes(probe.name) ? 'assert:collab_json_fields'
      : probe.name === 'invalidEnvelope' ? 'assert:collab_envelope' : 'assert:collab_json_structure');
  }
  const composite = observation('compositeDomainIdentities');
  assert.deepEqual(composite.threads, ['collision:a', 'collision']); assert.deepEqual(composite.messageIds, ['b', 'a:b']);
  assert.deepEqual(composite.retainedPerThread, [1, 1]); assert.equal(composite.exactRetryIdempotent, true);
  assert.equal(composite.changedContentRejected, true); assert.equal(composite.originalSignedReferences, true);
  const authority = observation('ownerVerifiedAuthority');
  assert.equal(authority.verifiedSignature, true); assert.equal(authority.mutatedReturnDidNotMutateOwner, true);
  assert.equal(authority.hostTransportConfigured, false);
  const readScope = observation('capturedReadScope');
  assert.equal(readScope.eventsOnlyRawDenied, 'ENDPOINT_CAPABILITY_FORBIDDEN');
  assert.equal(readScope.namedQueryRawDenied, 'ENDPOINT_RAW_SQL_FORBIDDEN');
  assert.equal(readScope.queryOnlyEventsDenied, 'ENDPOINT_CAPABILITY_FORBIDDEN');
  for (const field of ['allowedNamedQuery', 'allowedRawQuery', 'deniedCaptureReleasedReservation', 'reviewerReadFailureRetiredObserver', 'siblingUsable']) assert.equal(readScope[field], true);
  const pages = observation('boundedCapturedPages');
  assert.ok(pages.heldTaskCount > pages.visibleTaskLimit); assert.equal(pages.visibleTaskLimit, 2);
  assert.equal(pages.completeAcceptedSummaries, 2); assert.equal(pages.capturedMessages, 2); assert.equal(pages.latestMessages, 3);
  for (const field of ['stableAcrossWrites', 'noDuplicatesOrOmissions', 'acceptedSummaryContentOmitted', 'staleCursorRejected',
    'wrongThreadRejected', 'wrongTaskRejected', 'acceptedAndLateEvidenceRetained', 'releasedReaderRejected']) assert.equal(pages[field], true);
  const capacity = observation('reviewerCapacityRecovery');
  assert.equal(capacity.activeClaimsAtStart, 4); assert.equal(capacity.rejectedBeforeRelease, true);
  assert.equal(capacity.acceptedAfterRelease, true); assert.equal(capacity.externalEffects, false);
  assert.deepEqual(capacity.targetOutcomes, ['claim-conflict', 'accepted']); assert.ok(capacity.resultId);
  const lineage = observation('signedOperationLineage');
  assert.equal(lineage.bodyReferenceIgnored, true); assert.equal(lineage.sourceSignerForced, true);
  assert.ok(lineage.references.length >= 6);
  for (const reference of lineage.references) {
    hex(reference.applicationId,64);hex(reference.author,64);hex(reference.proposalId,64);
    assert.equal(Object.hasOwn(reference,'generation'),false);
    assert.ok(typeof reference.operationId === 'string' && reference.operationId.length > 0);
  }
  assert.equal(observation('schemaDdlGuard').outcome, 'rejected');
  assert.equal(observation('schemaDdlGuard').rejectionCode, 'denied');
  const scale = observation('scaleProfile');
  assert.equal(scale.signingParticipants, 8); assert.equal(scale.simultaneousAttachments, 32);
  assert.equal(scale.successfulViews, 32); assert.equal(new Set(scale.owners).size, 8);
  assert.deepEqual(scale.attachmentsPerOwner, Array(8).fill(4));
  assert.equal(observation('noisyEndpointIsolation').siblingQuerySucceeded, true);
  assert.equal(observation('noisyEndpointIsolation').ownerClosed, false);
  assert.equal(observation('noisyEndpointIsolation').rejected, 'ENDPOINT_STREAM_LIMIT');
  const policies = observation('independentReviewPolicies');
  assert.deepEqual(policies.policies.slice().sort(), ['clarity', 'evidence']);
  assert.equal(new Set(policies.signers).size, 2); assert.equal(policies.externalEffects, false);
  assert.equal(observation('staleClaimRejected').acceptedAsCurrent, false);
  assert.ok(['superseded', 'cancelled'].includes(observation('staleClaimRejected').disposition));
  assert.equal(observation('resultIdentityConflict').conflict, 'rejected');
  const initialization=observation('ordinaryInitialization');hex(initialization.proposalId,64);hex(initialization.rootAuthor,64);assert.equal(initialization.specialSchemaChannel,false);
  const revised=observation('lateClaimRevision');for(const field of ['before','after','revisionBefore','revisionAfter','originalProposalId'])hex(revised[field],64);
  assert.notEqual(revised.before,revised.after);assert.notEqual(revised.revisionBefore,revised.revisionAfter);assert.equal(revised.originalProposalId,revised.before);
  assert.equal(revised.revisedOriginalOutcome,'rejected');assert.equal(revised.capturedStable,true);
  const facts=observation('independentFinalityFacts');assert.equal(facts.stored,true);assert.equal(facts.materialized,true);assert.equal(facts.finalized,false);assert.equal(facts.finalityWait,'FINALITY_UNSUPPORTED');assert.equal(facts.agentRequired,false);
  const reopen = observation('operationIdentityAfterReopen');
  assert.equal(reopen.signerBefore, reopen.signerAfter);
  assert.equal(reopen.storageBefore, reopen.storageAfter);
  assert.deepEqual(reopen.operationBefore, reopen.operationAfter);
  assert.equal(reopen.operationAfter.stored,true);assert.ok(reopen.operationAfter.materialized);hex(reopen.operationAfter.proposalId,64);
  const references = observation('independentPendingReferences');
  assert.equal(references.foreignApplicationRejected, true); assert.equal(references.foreignSignerRetryRejected, true);
  assert.equal(report.claims.browserQualified, false);
  assert.equal(report.claims.physicalDeviceQualified, false);
  assert.equal(report.claims.deployedHostQualified, false);
  assert.equal(report.claims.conversationalResumeQualified, false);
  assert.equal(report.claims.exactlyOnceExternalEffects, false);
  const metrics = report.measurements;
  assert.ok(metrics.elapsedMs > 0); assert.equal(metrics.performanceBudget, null);
  for (const [name, minimum] of Object.entries({ commandMaterializedMs: 15, convergenceMs: 2, viewQueryMs: 32, reopenedMs: 1 })) {
    const value = metrics.distributions[name]; assert.ok(value.samples >= minimum); assert.equal(value.samples, value.values.length);
    assert.ok(value.values.every(sample => Number.isFinite(sample) && sample >= 0));
    const sorted = value.values.slice().sort((a, b) => a - b);
    assert.equal(value.p50, sorted[Math.ceil(sorted.length * 0.5) - 1]);
    assert.equal(value.p95, sorted[Math.ceil(sorted.length * 0.95) - 1]); assert.equal(value.maximum, sorted.at(-1));
  }
  assert.ok(metrics.memory.maxRssBytes > 0); assert.ok(metrics.memory.sampledHeapUsedBytes > 0);
  assert.equal(metrics.counters.observedEndpointStreamLimitRejections, 1); assert.equal(metrics.counters.signalTransportDrops, null);
  return { format: 'tendriller-collaboration-authored-summary/v1', source: report.source,
    artifacts: report.artifacts, topology: report.topology, checks: report.checks,
    claims: report.claims, runtime: report.runtime, measurements: metrics };
}
