import assert from 'node:assert/strict';

// The fixture submits exactly one command after this captured point. Coverage
// and other invalidations can repeat the old point without storing that command.
export function isNextPublishedCommand(change, before) {
  const point = change?.revision?.point;
  assert.equal(change?.revision?.generation, before.generation, 'Lost-reply fault crossed a generation');
  assert.equal(point?.generation, before.generation, 'Lost-reply fault crossed a generation');
  assert.ok(Number.isSafeInteger(point.sequence) && point.sequence >= 0, 'Invalid publication position');
  if (point.sequence <= before.sequence) return false;
  assert.equal(point.sequence, before.sequence + 1, 'Lost-reply fault requires exactly one new command');
  return true;
}
