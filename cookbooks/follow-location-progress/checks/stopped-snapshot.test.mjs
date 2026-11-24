import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocationController } from '../snippets/location.mjs';
import { runtimeFixture, pageFixture, gesture } from '../../../test/sensor-fixtures.mjs';

test('Stop and visibility loss clear a completed one-shot snapshot without leaving it fresh forever', () => {
  const runtime = runtimeFixture(), document = pageFixture(), states = [];
  let success, expire;
  const location = createLocationController({ tendril: runtime, document, now: () => 1000,
    geolocation: { getCurrentPosition(callback) { success = callback; } },
    schedule(callback) { expire = callback; return 1; }, cancel() {},
    onState(value) { states.push(value); } });
  const sample = { timestamp: 1000, coords: { latitude: 52.52, longitude: 13.405, accuracy: 3 } };
  location.start(gesture, { watch: false }); success(sample);
  assert.deepEqual(states.at(-1), { state: 'fresh', sharing: false, sampledAtMs: 1000, expiresAtMs: 11000 });
  assert.equal(runtime.resources.size, 0);
  location.stop(); assert.deepEqual(states.at(-1), { state: 'stopped', sharing: false });
  expire(); assert.deepEqual(states.at(-1), { state: 'stopped', sharing: false });
  location.start(gesture, { watch: false }); success(sample);
  assert.equal(states.at(-1).state, 'fresh'); document.hide();
  assert.deepEqual(states.at(-1), { state: 'stopped', sharing: false });
  expire(); assert.deepEqual(states.at(-1), { state: 'stopped', sharing: false });
  location.dispose();
});
