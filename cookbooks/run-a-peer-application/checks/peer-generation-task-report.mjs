import assert from 'node:assert/strict';

/** Require actual SQL-domain observations without inferring browser or hosted coverage. */
export function validatePeerTaskReport(report) {
  const hex = (value, length) => assert.match(value ?? '', new RegExp(`^[a-f0-9]{${length}}$`, 'u'));
  assert.equal(report?.format, 'peer-generation-consumer/v1');
  assert.equal(report.mode, 'runtime'); assert.equal(report.profile, 'peer-generation-v1');
  assert.equal(report.topology, 'independent-packed-tasks'); assert.equal(report.passed, true);
  hex(report.source?.commit, 40); hex(report.source?.tree, 40); assert.equal(typeof report.source.dirty, 'boolean');
  assert.equal(report.artifacts?.length, 1);
  const artifact = report.artifacts[0]; assert.equal(artifact.name, '@chronolog/peer-session');
  hex(artifact.sha256, 64); hex(artifact.sourceCommit, 40); hex(artifact.sourceTree, 40); assert.equal(typeof artifact.sourceDirty, 'boolean');
  assert.deepEqual(report.publicBoundary?.imports, ['@chronolog/peer-session', '@chronolog/peer-session/native', '@chronolog/peer-session/sql', '@chronolog/peer-session/sql-native']);
  assert.equal(report.publicBoundary.siblingSourceImports, 0); assert.equal(report.publicBoundary.applicationRetryQueues, 0);
  assert.equal(report.publicBoundary.residentRequired, false);
  assert.equal(report.sqlEngine?.implementation, '@dolthub/doltlite@0.11.29');
  assert.equal(report.sqlEngine.platform, report.runtime.platform); assert.equal(report.sqlEngine.architecture, report.runtime.architecture);
  hex(report.sqlEngine.patchSha256, 64); hex(report.executionManifestDigest, 64);
  const tasks = report.tasks;
  assert.equal(tasks?.definitionId, 'shared-peer-task-board'); hex(tasks.signedSchemaDigest, 64); hex(tasks.schemaAdministrator, 64);
  assert.equal(tasks.claims?.length, 2); assert.deepEqual(tasks.claims.map(value => value.outcome).sort(), ['accepted', 'rejected']);
  for (const claim of tasks.claims) { assert.ok(claim.operationId); hex(claim.attemptId, 64); }
  assert.notEqual(tasks.claims[0].operationId, tasks.claims[1].operationId);
  assert.equal(tasks.unauthorizedCompletion, 'rejected'); assert.equal(tasks.sharedCreatorClosed, true);
  assert.equal(tasks.completionAfterCreatorClosed, 'accepted');
  const recovery = report.recovery;
  hex(recovery?.previousGeneration, 64); hex(recovery.selectedGeneration, 64);
  assert.notEqual(recovery.previousGeneration, recovery.selectedGeneration);
  assert.ok(Number.isSafeInteger(recovery.adoptedPosition) && recovery.adoptedPosition > 0 && recovery.previousHead > recovery.adoptedPosition);
  hex(recovery.retainedDigest, 64); assert.equal(recovery.recoveredDigest, recovery.retainedDigest); assert.equal(recovery.otherPeerDigest, recovery.retainedDigest);
  for (const name of ['sqlAndEventsResetTogether', 'inheritedIdentityPreserved', 'returningTailExcluded', 'retryRefused']) assert.equal(recovery[name], true, name);
  assert.ok(tasks.claims.some(value => value.operationId === recovery.originalOperationId && value.outcome === 'accepted'));
  assert.ok(recovery.reappliedOperationId); assert.notEqual(recovery.reappliedOperationId, recovery.originalOperationId);
  hex(recovery.originalAttemptId, 64); hex(recovery.reappliedAttemptId, 64);
  assert.notEqual(recovery.reappliedAttemptId, recovery.originalAttemptId); assert.equal(recovery.reapplyOf, recovery.originalAttemptId);
  const reopen = report.reopen;
  hex(reopen?.identityBefore, 64); assert.equal(reopen.identityAfter, reopen.identityBefore);
  assert.ok(reopen.storageBefore); assert.equal(reopen.storageAfter, reopen.storageBefore);
  hex(reopen.digestBefore, 64); assert.equal(reopen.digestAfter, reopen.digestBefore);
  assert.equal(reopen.operationBefore?.outcome, 'accepted'); assert.deepEqual(reopen.operationAfter, reopen.operationBefore);
  assert.equal(reopen.epochKeysProvided, false);
  return { format: 'peer-generation-task-summary/v1', source: report.source, artifacts: report.artifacts,
    sqlEngine: report.sqlEngine, executionManifestDigest: report.executionManifestDigest,
    tasks: report.tasks, recovery: report.recovery, reopen: report.reopen,
    limitations: ['Actual native SQL with direct authenticated peer transport; browser WASM and RTC are separate gates.',
      'Generation selection used a local portable control registry; Tendriller HTTP and deployed identities were not exercised.'] };
}
