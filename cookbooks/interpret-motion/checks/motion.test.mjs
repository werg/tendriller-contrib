import test from 'node:test';
import assert from 'node:assert/strict';
import { createMagnitudeDetector, createMotionController } from '../snippets/motion.mjs';
import { runtimeFixture, pageFixture, gesture, deferred } from '../../../test/sensor-fixtures.mjs';
const sample = (detector, value, time) => detector.sample({ x: value, y: 0, z: 0 }, time);
test('magnitude requires low rearm, exact refractory equality and fresh data', () => {
  const detector = createMagnitudeDetector({ high: 10, low: 3, refractoryMs: 600 });
  assert.equal(sample(detector, 10, 0).detected, true);
  assert.equal(sample(detector, 20, 700).detected, false);
  sample(detector, 1, 800);
  assert.equal(sample(detector, 10, 900).detected, true);
  sample(detector, 1, 1000);
  assert.equal(sample(detector, 10, 1500).detected, true);
  assert.equal(sample(detector, 10, 1500), null);
  assert.equal(detector.sample({ x: null, y: 0, z: 0 }, 1600), null);
  assert.equal(sample(detector, 50, 10000).detected, false);
  sample(detector, 1, 10001); assert.equal(sample(detector, 10, 10002).detected, true);
});
test('iOS permission is called in the gesture stack and a late grant cannot attach', async () => {
  const runtime = runtimeFixture(), permission = deferred(), target = new EventTarget(), document = pageFixture();
  let asked = false;
  const motion = createMotionController({ tendril: runtime, target, document, MotionEvent: { requestPermission() {
    asked = true; assert.deepEqual(runtime.sensors.status().pending, ['motion']); return permission.promise;
  } } });
  const start = motion.start(gesture); assert.equal(asked, true);
  runtime.sensors.stopAll(); permission.resolve('granted');
  await assert.rejects(start, { name: 'AbortError' }); assert.equal(motion.phase, 'stopped'); motion.dispose();
});
test('visibility loss removes listener and denial leaves manual fallback state', async () => {
  const runtime = runtimeFixture(), target = new EventTarget(), document = pageFixture(); let count = 0, clock = 0;
  const motion = createMotionController({ tendril: runtime, target, document, MotionEvent: {}, now: () => ++clock, onSample() { count++; } });
  await motion.start(gesture);
  const event = new Event('devicemotion'); event.acceleration = { x: 20, y: 0, z: 0 };
  target.dispatchEvent(event); document.hide(); target.dispatchEvent(event);
  assert.equal(count, 1); assert.equal(motion.phase, 'stopped'); motion.dispose();
  const denied = createMotionController({ tendril: runtime, target, document: pageFixture(), MotionEvent: { requestPermission: async () => 'denied' } });
  await assert.rejects(denied.start(gesture), /denied/); assert.equal(denied.phase, 'unavailable'); denied.dispose();
});
