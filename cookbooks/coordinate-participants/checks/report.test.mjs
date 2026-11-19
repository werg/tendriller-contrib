import assert from 'node:assert/strict';
import test from 'node:test';
import { requiredChecks, validateCollaborationReport } from './report.mjs';

// Synthetic values test the validator; they are never emitted as qualification.
function example() {
  const observations = {
    exclusiveClaimRace: { outcomes: ['accepted', 'rejected'] }, rawProgramGuard: { outcome: 'rejected' },
    staleClaimRejected: { acceptedAsCurrent: false, disposition: 'superseded' }, resultIdentityConflict: { conflict: 'rejected' },
    generationFence: { before: 'generation-1', after: 'generation-2', oldFenceAcceptedAsCurrent: false },
    explicitRebind: { outcome: 'accepted' }, operationIdentityAfterReopen: {
      signerBefore: 'same-signer', signerAfter: 'same-signer', storageBefore: 'same-store', storageAfter: 'same-store',
      operationBefore: { operationId: 'stable', status: 'applied' }, operationAfter: { operationId: 'stable', status: 'applied' },
    },
  };
  return { format: 'tendriller-collaboration-consumer/v1', mode: 'native-public-artifacts', passed: true, error: null,
    source: { commit: 'a'.repeat(40), tree: 'b'.repeat(40), dirty: false },
    artifacts: ['@chronolog/peer-session', '@tendriller/core'].map(name => ({ name, sha256: 'c'.repeat(64),
      sourceCommit: 'd'.repeat(40), sourceTree: 'e'.repeat(40), sourceDirty: false })),
    fixtures: [{ path: 'consumer.mjs', sha256: 'f'.repeat(64) }],
    publicBoundary: { siblingSourceImports: 0, applicationRetryQueues: 0,
      imports: ['@tendriller/core/collaboration', '@chronolog/peer-session/sql-native'] },
    topology: { transport: 'direct-authenticated', signers: ['1', '2', '3', '4', '5', '6'].map(value => value.repeat(64)),
      attachments: 2, independentAgents: 2 },
    checks: requiredChecks.map(name => ({ name, passed: true, observation: observations[name] ?? { observed: true } })),
    claims: { browserQualified: false, physicalDeviceQualified: false, deployedHostQualified: false,
      conversationalResumeQualified: false, exactlyOnceExternalEffects: false }, runtime: { node: 'synthetic' },
  };
}

test('one exact public composition retains local-only evidence boundaries', () => {
  const result = validateCollaborationReport(example());
  assert.equal(result.topology.signers.length, 6);
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
  ]) { const report = example(); mutate(report); assert.throws(() => validateCollaborationReport(report)); }
});

test('optimistic claim, recovery, replay and provider conclusions are refused', () => {
  for (const mutate of [
    report => { report.checks.find(value => value.name === 'exclusiveClaimRace').observation.outcomes = ['accepted', 'accepted']; },
    report => { report.checks.find(value => value.name === 'rawProgramGuard').observation.outcome = 'accepted'; },
    report => { report.checks.find(value => value.name === 'generationFence').observation.oldFenceAcceptedAsCurrent = true; },
    report => { report.checks.find(value => value.name === 'operationIdentityAfterReopen').observation.operationAfter.operationId = 'new'; },
    report => { report.claims.browserQualified = true; },
    report => { report.claims.conversationalResumeQualified = true; },
    report => { report.claims.exactlyOnceExternalEffects = true; },
  ]) { const report = example(); mutate(report); assert.throws(() => validateCollaborationReport(report)); }
});
