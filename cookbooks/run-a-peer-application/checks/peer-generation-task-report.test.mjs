import { syntheticTaskReport as synthetic } from './peer-generation-report-fixtures.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validatePeerTaskReport } from './peer-generation-task-report.mjs';

// Synthetic validator inputs are never runtime acceptance evidence.
const h = digit => digit.repeat(64);

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
