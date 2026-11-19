import assert from 'node:assert/strict';

export const requiredChecks = Object.freeze([
  'sixIndependentSigners', 'twoAttachmentsOneOwner', 'sourceEndpointIsolation',
  'detachIsolation', 'malformedPortIsolation', 'signalRunIsolation',
  'scaleProfile', 'noisyEndpointIsolation', 'exclusiveClaimRace', 'rawProgramGuard',
  'rawForgedResultGuard', 'schemaDdlGuard', 'staleClaimRejected',
  'resultIdentityConflict', 'frozenContributionSlots', 'aggregateProvenance',
  'cancellationAcknowledgment', 'generationFence', 'explicitRebind',
  'operationIdentityAfterReopen', 'independentDrafts', 'independentPendingReferences',
]);

/** Validate observations without promoting local execution into a deployed claim. */
export function validateCollaborationReport(report, { allowDirty = false } = {}) {
  const hex = (value, length) => assert.match(value ?? '', new RegExp(`^[a-f0-9]{${length}}$`, 'u'));
  assert.equal(report?.format, 'tendriller-collaboration-consumer/v1');
  assert.equal(report.mode, 'native-public-artifacts');
  assert.equal(report.passed, true);
  assert.equal(report.error, null);
  hex(report.source?.commit, 40); hex(report.source?.tree, 40);
  assert.equal(typeof report.source.dirty, 'boolean');
  if (!allowDirty) assert.equal(report.source.dirty, false, 'Consumer source must be clean');
  assert.deepEqual(report.artifacts.map(value => value.name).sort(), ['@chronolog/peer-session', '@tendriller/core']);
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
  const names = report.checks.map(value => value.name);
  assert.equal(new Set(names).size, names.length, 'Duplicate observations cannot stand for missing gates');
  assert.deepEqual([...names].sort(), [...requiredChecks].sort());
  for (const check of report.checks) {
    assert.equal(check.passed, true, `Failed gate: ${check.name}`);
    assert.ok(check.observation && typeof check.observation === 'object', `Missing observation: ${check.name}`);
  }
  const observation = name => report.checks.find(value => value.name === name).observation;
  assert.deepEqual(observation('exclusiveClaimRace').outcomes.slice().sort(), ['accepted', 'rejected']);
  assert.equal(observation('rawProgramGuard').outcome, 'rejected');
  assert.equal(observation('rawProgramGuard').rejectionCode, 'assert:collab_immutable');
  assert.equal(observation('rawForgedResultGuard').outcome, 'rejected');
  assert.equal(observation('rawForgedResultGuard').rejectionCode, 'assert:collab_result_disposition');
  assert.equal(observation('rawForgedResultGuard').retainedForgedResult, false);
  assert.equal(observation('schemaDdlGuard').outcome, 'rejected');
  assert.equal(observation('schemaDdlGuard').rejectionCode, 'denied');
  const scale = observation('scaleProfile');
  assert.equal(scale.signingParticipants, 8); assert.equal(scale.simultaneousAttachments, 32);
  assert.equal(scale.successfulViews, 32); assert.equal(new Set(scale.owners).size, 8);
  assert.deepEqual(scale.attachmentsPerOwner, Array(8).fill(4));
  assert.equal(observation('noisyEndpointIsolation').siblingQuerySucceeded, true);
  assert.equal(observation('noisyEndpointIsolation').ownerClosed, false);
  assert.equal(observation('noisyEndpointIsolation').rejected, 'APPLICATION_WORKER_STREAM_LIMIT');
  assert.equal(observation('staleClaimRejected').acceptedAsCurrent, false);
  assert.ok(['superseded', 'cancelled', 'needsReview'].includes(observation('staleClaimRejected').disposition));
  assert.equal(observation('resultIdentityConflict').conflict, 'rejected');
  assert.equal(observation('generationFence').oldFenceAcceptedAsCurrent, false);
  assert.notEqual(observation('generationFence').before, observation('generationFence').after);
  assert.equal(observation('explicitRebind').outcome, 'accepted');
  const reopen = observation('operationIdentityAfterReopen');
  assert.equal(reopen.signerBefore, reopen.signerAfter);
  assert.equal(reopen.storageBefore, reopen.storageAfter);
  assert.deepEqual(reopen.operationBefore, reopen.operationAfter);
  assert.equal(reopen.operationAfter.status, 'applied');
  assert.equal(report.claims.browserQualified, false);
  assert.equal(report.claims.physicalDeviceQualified, false);
  assert.equal(report.claims.deployedHostQualified, false);
  assert.equal(report.claims.conversationalResumeQualified, false);
  assert.equal(report.claims.exactlyOnceExternalEffects, false);
  return { format: 'tendriller-collaboration-summary/v1', source: report.source,
    artifacts: report.artifacts, topology: report.topology, checks: report.checks,
    claims: report.claims, runtime: report.runtime };
}
