import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validatePeerGenerationReport } from './peer-generation-report.mjs';

// Deliberately synthetic input tests the evidence boundary, not a runtime.
function syntheticReport() {
  const receipt = { generation: 'g1', sequence: 2, root: 'a'.repeat(64) };
  return {
    format: 'peer-generation-consumer/v1', mode: 'runtime', profile: 'peer-generation-v1',
    topology: 'independent-packed-peers', passed: true, executionManifestDigest: 'a'.repeat(64),
    runtime: { node: 'v24.0.0', platform: 'linux' },
    source: { commit: 'a'.repeat(40), tree: 'b'.repeat(40), dirty: true },
    artifacts: [{ name: '@chronolog/peer-session', version: '0.0.0-test', sha256: 'c'.repeat(64),
      sourceCommit: 'd'.repeat(40), sourceTree: 'e'.repeat(40), sourceDirty: false }],
    publicBoundary: { imports: ['@chronolog/peer-session', '@chronolog/peer-session/native'], siblingSourceImports: 0, applicationRetryQueues: 0, residentRequired: false },
    hostOutage: { boundary: 'portable-control-port', blocked: true, blockedProbeRejected: true, commandsApplied: 3,
      requests: { before: 4, after: 4 }, applicationBodyBytes: { before: 0, after: 0 }, finalityCapability: false },
    lostReply: { injectedAfterPersistence: true, originalOperationId: 'op-retained', retriedOperationId: 'op-retained',
      originalReceipt: receipt, retriedReceipt: structuredClone(receipt), orderedRecords: { before: 2, after: 2 } },
    recovery: { previousGeneration: 'g1', selectedGeneration: 'g2', previousHead: 4, adoptedPosition: 2,
      sourceRemoved: true, coherentReset: true, recoveredDigest: 'f'.repeat(64), freshPeerDigest: 'f'.repeat(64),
      inheritedOperationIds: ['op-retained'], abandonedOperationIds: ['op-abandoned'],
      inheritedIdentityPreserved: true, abandonedEvidencePreserved: true },
    returningBranch: { generationBefore: 'g2', generationAfter: 'g2', digestBefore: '1'.repeat(64), digestAfter: '1'.repeat(64),
      oldAttemptReadmitted: false, excludedAncestorReadopted: false, thirdGenerationChecked: true },
    reapply: { originalOperationId: 'op-abandoned', newOperationId: 'op-reapplied', originalAttemptId: 'attempt-abandoned', newAttemptId: 'attempt-reapplied', reapplyOf: 'attempt-abandoned',
      outcome: 'accepted', currentGuardsChecked: true },
    reopen: { identityBefore: 'device-a', identityAfter: 'device-a', operationBefore: { id: 'op-reapplied', status: 'applied' },
      operationAfter: { id: 'op-reapplied', status: 'applied' } },
  };
}

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
