import test from 'node:test';
import assert from 'node:assert/strict';
import { createMetricModel, buildSparklinePoints } from '../snippets/dashboard-card.mjs';

test('metric model bounds history, computes threshold tones, detects staleness, and produces sparkline points', () => {
  const model = createMetricModel({
    title: 'CPU Load',
    unit: '%',
    historyLimit: 4,
    staleAfterMs: 10_000,
    warnAbove: 70,
    alertAbove: 90,
  });

  model.push(20, { fetchedAtMs: 1_000 });
  model.push(45, { fetchedAtMs: 2_000 });
  model.push(75, { fetchedAtMs: 3_000 });
  model.push(94, { fetchedAtMs: 4_000, delta: '+19%' });
  const fresh = model.push(95, { fetchedAtMs: 5_000, delta: '+1%' });

  assert.deepEqual(fresh.history, [45, 75, 94, 95]);
  assert.equal(fresh.tone, 'alert');
  assert.equal(fresh.stale, false);
  assert.match(fresh.sparklinePoints, /^0\.0,/);
  assert.equal(fresh.contextForAgent().value, 95);

  const stale = model.view(20_000);
  assert.equal(stale.stale, true);
  assert.equal(stale.ageMs, 15_000);
  assert.equal(buildSparklinePoints([42]), '');
});
