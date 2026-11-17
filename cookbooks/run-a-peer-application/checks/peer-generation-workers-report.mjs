import assert from 'node:assert/strict';

/** New worker evidence must include actual durable outcomes, not only stage labels. */
export function validatePeerWorkersReport(report) {
  const hex = (value, length = 64) => assert.match(value ?? '', new RegExp(`^[a-f0-9]{${length}}$`, 'u'));
  assert.equal(report?.format, 'peer-generation-consumer/v1');
  assert.equal(report.mode, 'runtime'); assert.equal(report.profile, 'peer-generation-v1');
  assert.equal(report.topology, 'independent-packed-workers'); assert.equal(report.passed, true);
  hex(report.source?.commit, 40); hex(report.source?.tree, 40); assert.equal(report.source.dirty, false);
  assert.equal(report.artifacts?.length, 1);
  const artifact = report.artifacts[0]; assert.equal(artifact.name, '@chronolog/peer-session');
  hex(artifact.sha256); hex(artifact.sourceCommit, 40); hex(artifact.sourceTree, 40); assert.equal(artifact.sourceDirty, false);
  assert.deepEqual(report.publicBoundary?.imports, ['@chronolog/peer-session', '@chronolog/peer-session/browser', '@chronolog/peer-session/native', '@chronolog/peer-session/sql-native']);
  assert.equal(report.publicBoundary.siblingSourceImports, 0); assert.equal(report.publicBoundary.applicationRetryQueues, 0);
  assert.equal(report.publicBoundary.residentRequired, false);
  assert.equal(report.sqlEngine?.implementation, '@dolthub/doltlite@0.11.29');
  assert.equal(report.sqlEngine.platform, report.runtime.platform); assert.equal(report.sqlEngine.architecture, report.runtime.architecture);
  hex(report.sqlEngine.patchSha256); hex(report.executionManifestDigest);
  const recoveredPrefix = value => {
    hex(value?.previousGeneration); hex(value.selectedGeneration); assert.notEqual(value.previousGeneration, value.selectedGeneration);
    assert.ok(Number.isSafeInteger(value.adoptedPosition) && value.adoptedPosition > 0 && value.previousHead > value.adoptedPosition);
  };
  recoveredPrefix(report.recovery);
  const projection = report.projection;
  assert.deepEqual(projection?.initial.state.notes.map(value => value.noteId), ['retained']);
  assert.deepEqual(projection.beforeRecovery.state.notes.map(value => value.noteId), ['retained', 'excluded']);
  assert.deepEqual(projection.recovered.state, projection.initial.state); assert.equal(projection.recovered.reset, true);
  for (const key of ['sameGenerationIncremental', 'duplicateOwnerRefused', 'staleCursorRefused', 'heldViewPreserved']) assert.equal(projection[key], true, key);
  const effects = report.effects;
  assert.equal(effects?.denied.stage, 'denied'); assert.equal(effects.denied.reason, 'unauthorized');
  assert.notEqual(effects.denied.event.author, effects.denied.event.payload.requestedByLabel);
  assert.equal(effects.completed.stage, 'completed'); assert.equal(effects.uncertain.stage, 'dispatching');
  assert.equal(effects.reconciled.stage, 'completed'); assert.equal(effects.uncertainRetryRefused, true); assert.equal(effects.journalReopened, true);
  assert.equal(effects.externalBefore.effects.length, 2); assert.equal(effects.externalBefore.requests.filter(value => value.method === 'POST').length, 2);
  assert.equal(effects.externalBefore.requests.at(-1).replyLost, true);
  assert.deepEqual(effects.externalAfter.effects, effects.externalBefore.effects);
  assert.deepEqual(effects.externalAfter.requests.map(value => value.method), ['GET']);
  assert.equal(effects.matching.observedEvents.length, 2);
  assert.notEqual(effects.matching.observedEvents[0].attemptId, effects.matching.observedEvents[1].attemptId);
  assert.equal(effects.restored.publications.at(-1).reapplyOf, effects.completed.publications[0].operationId);
  const timers = report.timers, last = entry => entry.publications.at(-1);
  assert.equal(last(timers?.first).status, 'applied'); assert.equal(timers.retryPreserved, true);
  assert.equal(last(timers.cancelled).status, 'cancelled'); assert.equal(last(timers.cancelled).result.rejectionCode, 'assert:timer_inactive_configuration');
  assert.equal(timers.race.cancelled, 1); assert.equal(timers.race.emitted, 0);
  assert.equal(timers.reconciled.publications.length, 1); assert.equal(last(timers.reconciled).status, 'applied');
  assert.deepEqual(timers.reconciled.occurrence, timers.uncertain.occurrence);
  recoveredPrefix(timers.recovery); assert.equal(timers.afterReset.reset, true); assert.equal(timers.afterReset.emitted, 0);
  assert.equal(timers.afterReset.awaitingReconciliation, true); assert.equal(timers.excludedConfigurationRemoved, true);
  assert.deepEqual(timers.abandoned.occurrence, timers.completed.occurrence); assert.equal(last(timers.abandoned).status, 'abandoned');
  assert.deepEqual(timers.restored.occurrence, timers.completed.occurrence); assert.equal(last(timers.restored).status, 'applied');
  assert.equal(last(timers.restored).reapplyOf, last(timers.completed).operationId);
  assert.equal(timers.retainedEffect.observedEvents.length, 2); assert.deepEqual(timers.externalAfterRecovery, timers.externalBeforeRecovery);
  assert.equal(last(timers.waking).status, 'applied'); assert.equal(timers.clockWakeOwned, true); assert.equal(timers.closed, true);
  const worker = report.worker;
  for (const key of ['actualThread', 'publicFacade', 'resetObserved', 'followStopped', 'ownerClosedBeforeReopen']) assert.equal(worker?.[key], true, key);
  hex(worker.identityBefore); assert.equal(worker.identityAfter, worker.identityBefore);
  hex(worker.initialDigest); hex(worker.changedDigest); assert.notEqual(worker.changedDigest, worker.initialDigest);
  assert.equal(worker.recoveredDigest, worker.initialDigest); assert.equal(worker.reopenedDigest, worker.recoveredDigest);
  hex(worker.resetGeneration);
  return { format: 'peer-generation-workers-summary/v1', source: report.source, artifacts: report.artifacts,
    sqlEngine: report.sqlEngine, executionManifestDigest: report.executionManifestDigest, projection, effects, timers, worker,
    recovery: report.recovery, limitations: [
      'Actual native SQL and a real Worker thread using the public facade; this does not qualify browser OPFS or deployed RTC.',
      'A durable loopback HTTP fixture represents the external provider; no real notification service was contacted.',
      'Timer time is an eligible participant observation, not a trusted global clock; availability determines lateness.',
    ] };
}
