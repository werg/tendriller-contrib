import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isNextPublishedCommand } from './peer-generation-fault.mjs';

const generation = '1'.repeat(64);
const before = { generation, sequence: 7, root: '2'.repeat(64) };
const publication = (sequence, materializationRevision = '1', selected = generation) => ({
  kind: 'applied', revision: { generation: selected,
    point: { generation: selected, sequence, root: '3'.repeat(64) }, materializationRevision }, recovery: null,
});

test('lost-reply cut ignores coverage and repeated view invalidations before the command is stored', () => {
  assert.equal(isNextPublishedCommand(publication(7), before), false);
  assert.equal(isNextPublishedCommand(publication(7, '2'), before), false);
  assert.equal(isNextPublishedCommand(publication(6), before), false);
  assert.equal(isNextPublishedCommand(publication(8), before), true);
});

test('matching publication can fence the link before the order reply continuation runs', async () => {
  let publish;
  const changed = new Promise(resolve => { publish = resolve; });
  let closed = false;
  const cut = (async () => {
    const change = await changed;
    if (isNextPublishedCommand(change, before)) closed = true;
  })();
  publish(publication(8));
  // Production publishes before its order promise resolves. The cut adds no
  // query/get await between receiving this notification and fencing the link.
  await Promise.resolve();
  assert.equal(closed, true);
  await cut;
});

test('lost-reply cut refuses another generation or an unexpected extra command', () => {
  assert.throws(() => isNextPublishedCommand(publication(8, '1', '4'.repeat(64)), before), /crossed a generation/u);
  assert.throws(() => isNextPublishedCommand(publication(9), before), /exactly one new command/u);
  assert.throws(() => isNextPublishedCommand(publication(Number.NaN), before), /Invalid publication position/u);
});
