import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validatePeerTaskReport } from './peer-generation-task-report.mjs';

// Synthetic validator inputs are never runtime acceptance evidence.
const h = digit => digit.repeat(64);
function synthetic() {
  const operation = { status: 'applied', operationId: 'finish', outcome: 'accepted', attemptId: h('5') };
  return { format: 'peer-generation-consumer/v1', mode: 'runtime', profile: 'peer-generation-v1', passed: true,
    topology: 'independent-packed-tasks', source: { commit: '1'.repeat(40), tree: '2'.repeat(40), dirty: true },
    artifacts: [{ name: '@chronolog/peer-session', sha256: h('1'), sourceCommit: '1'.repeat(40), sourceTree: '2'.repeat(40), sourceDirty: true }],
    publicBoundary: { imports: ['@chronolog/peer-session', '@chronolog/peer-session/native', '@chronolog/peer-session/sql', '@chronolog/peer-session/sql-native'],
      siblingSourceImports: 0, applicationRetryQueues: 0, residentRequired: false },
    runtime: { platform: 'synthetic', architecture: 'synthetic' }, executionManifestDigest: h('2'),
    sqlEngine: { implementation: '@dolthub/doltlite@0.11.29', platform: 'synthetic', architecture: 'synthetic', patchSha256: h('1') },
    tasks: { definitionId: 'shared-peer-task-board', signedSchemaDigest: h('1'), schemaAdministrator: h('2'),
      claims: [{ operationId: 'creator', attemptId: h('3'), outcome: 'accepted' }, { operationId: 'member', attemptId: h('4'), outcome: 'rejected' }],
      unauthorizedCompletion: 'rejected', sharedCreatorClosed: true, completionAfterCreatorClosed: 'accepted' },
    recovery: { previousGeneration: h('1'), selectedGeneration: h('2'), previousHead: 7, adoptedPosition: 3,
      retainedDigest: h('3'), recoveredDigest: h('3'), otherPeerDigest: h('3'),
      sqlAndEventsResetTogether: true, inheritedIdentityPreserved: true, returningTailExcluded: true, retryRefused: true,
      originalOperationId: 'creator', originalAttemptId: h('3'), reappliedOperationId: 'reviewed', reappliedAttemptId: h('5'), reapplyOf: h('3') },
    reopen: { identityBefore: h('2'), identityAfter: h('2'), storageBefore: 'member', storageAfter: 'member',
      digestBefore: h('4'), digestAfter: h('4'), operationBefore: operation, operationAfter: structuredClone(operation), epochKeysProvided: false } };
}

test('task evidence requires actual engine identity, transactional guards, coherent recovery and durable reopening', () => {
  const summary = validatePeerTaskReport(synthetic());
  assert.equal(summary.source.dirty, true);
  assert.ok(summary.limitations.some(value => value.includes('browser')));
  for (const mutate of [
    report => { report.mode = 'build-only'; }, report => { report.sqlEngine.patchSha256 = 'missing'; },
    report => { report.tasks.claims[1].outcome = 'accepted'; }, report => { report.tasks.unauthorizedCompletion = 'accepted'; },
    report => { report.tasks.sharedCreatorClosed = false; }, report => { report.recovery.otherPeerDigest = h('6'); },
    report => { report.recovery.reapplyOf = h('4'); }, report => { report.reopen.epochKeysProvided = true; },
    report => { report.reopen.operationAfter.outcome = 'rejected'; },
  ]) {
    const report = synthetic(); mutate(report); assert.throws(() => validatePeerTaskReport(report));
  }
});
