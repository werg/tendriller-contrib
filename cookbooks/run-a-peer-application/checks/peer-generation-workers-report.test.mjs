import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validatePeerWorkersReport } from './peer-generation-workers-report.mjs';

const report = JSON.parse(await readFile(new URL('../notes/evidence/peer-workers-6afc600-6509200-report.json', import.meta.url)));
test('validates the preserved actual public worker acceptance', () => {
  assert.equal(validatePeerWorkersReport(report).source.commit, report.source.commit);
});

for (const [name, mutate] of [
  ['missing timer evidence', value => { delete value.timers; }],
  ['blind repeat of a completed outside action', value => { value.effects.externalAfter.requests.push({ method: 'POST' }); }],
  ['a Worker reset retaining the excluded note', value => { value.worker.recoveredDigest = value.worker.changedDigest; }],
  ['a cancellation race with no guarded rejection', value => { value.timers.race.cancelled = 0; }],
  ['a timer reapplication with a new occurrence identity', value => { value.timers.restored.occurrence.occurrenceId = 'unrelated-occurrence'; }],
]) test(`refuses ${name}`, () => {
  const value = structuredClone(report); mutate(value);
  assert.throws(() => validatePeerWorkersReport(value));
});
