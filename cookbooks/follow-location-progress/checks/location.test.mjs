import test from 'node:test';
import assert from 'node:assert/strict';
import { admitFix, createArrivalTracker, createLocationController, createFixPublisher, distanceMetres } from '../snippets/location.mjs';
import { runtimeFixture, pageFixture, gesture, deferred, tick } from '../../../test/sensor-fixtures.mjs';
const target = { latitude: 0, longitude: 0 };
const fix = (meters, timestamp, accuracy = 3) => ({ coords: { latitude: 0, longitude: meters / 111195.08, accuracy }, timestamp });
test('arrival uses metres, accuracy filtering, sample age and conservative inner/outer hysteresis', () => {
  assert.ok(Math.abs(distanceMetres(target, { latitude: 0, longitude: 1 }) - 111195.08) < 1);
  const tracker = createArrivalTracker(target, { innerM: 30, outerM: 60 });
  const update = (meters, time, accuracy) => tracker.update(admitFix(fix(meters, time, accuracy), { now: time }));
  assert.equal(update(20, 1000).arrived, true); assert.equal(update(40, 2000).arrived, true);
  assert.equal(update(70, 3000).arrived, false); assert.equal(update(40, 4000).arrived, false);
  assert.equal(admitFix(fix(20, 5000, 200), { now: 5000 }), null);
  assert.equal(admitFix(fix(20, -10000), { now: 5000 }), null);
  assert.equal(admitFix(fix(20, 3000), { now: 1000 }), null);
  assert.throws(() => distanceMetres(target, { latitude: 200, longitude: 0 }), /coordinates/);
  tracker.reset(); assert.equal(update(40, 6000).arrived, false);
});
test('one-shot registers before acquisition, cancels late fixes and expires a successful snapshot', () => {
  const runtime = runtimeFixture(), document = pageFixture(), states = [], fixes = []; let success, pulse;
  const controller = createLocationController({ tendril: runtime, document, now: () => 1000,
    schedule: fn => { pulse = fn; return 1; }, cancel() {}, onFix: value => fixes.push(value), onState: value => states.push(value.state),
    geolocation: { getCurrentPosition(callback) { assert.deepEqual(runtime.sensors.status().pending, ['location']); success = callback; } } });
  const signal = controller.start(gesture, { watch: false }); runtime.sensors.stopAll(); success(fix(0, 1000));
  assert.equal(signal.aborted, true); assert.equal(fixes.length, 0);
  controller.start(gesture, { watch: false }); success(fix(0, 1000)); assert.equal(runtime.resources.size, 0);
  assert.equal(states.at(-1), 'fresh'); pulse(); assert.equal(states.at(-1), 'stale');
  controller.dispose(); assert.throws(() => controller.start({ isTrusted: false }), /Start location/);
});
test('watch reports stale state, rejects out-of-order data and clears on visibility loss', () => {
  const runtime = runtimeFixture(), document = pageFixture(), states = [], fixes = []; let success, pulse, clears = 0;
  const controller = createLocationController({ tendril: runtime, document, now: () => 2000,
    schedule: fn => { pulse = fn; return 1; }, cancel() {}, onFix: value => fixes.push(value), onState: value => states.push(value.state),
    geolocation: { watchPosition(callback) { success = callback; return 12; }, clearWatch(id) { assert.equal(id, 12); clears++; } } });
  controller.start(gesture); assert.deepEqual(states, ['pending'], 'Starting an idle controller must not stop the new publisher.');
  success(fix(0, 2000)); success(fix(1, 1000)); assert.equal(fixes.length, 1);
  pulse(); assert.equal(states.at(-1), 'stale');
  document.hide(); success(fix(0, 2001)); assert.equal(states.at(-1), 'stopped');
  controller.stop(); controller.dispose(); assert.equal(clears, 1);
});
test('producer coalesces to one in-flight and one latest fix with explicit stream identity', async () => {
  const first = deferred(), sends = []; let timer, clock = 1000;
  const publisher = createFixPublisher({ signals: { async send(topic, payload, options) { sends.push({ topic, payload, options }); if (sends.length === 1) await first.promise; } } },
    { streamId: 'route-run', now: () => clock, schedule: fn => { timer = fn; return 1; }, cancel() {} });
  publisher.offer({ sampledAtMs: 1000, value: 1 }); timer(); await tick();
  publisher.offer({ sampledAtMs: 1001, value: 2 }); publisher.offer({ sampledAtMs: 1002, value: 3 });
  assert.equal(sends.length, 1); first.resolve(); await tick(); clock = 2000; timer(); await tick();
  assert.deepEqual(sends.map(value => value.payload.value), [1, 3]); assert.equal(sends[0].options.stream.streamId, 'route-run');
  publisher.stop(); publisher.offer({ sampledAtMs: clock, value: 4 }); assert.equal(sends.length, 2);
});
