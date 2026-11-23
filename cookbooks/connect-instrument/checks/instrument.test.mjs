import test from 'node:test';
import assert from 'node:assert/strict';
import { createLineFramer, parseReading, createSerialReader, createBluetoothReader } from '../snippets/instrument.mjs';
import { runtimeFixture, pageFixture, gesture, deferred, tick } from '../../../test/sensor-fixtures.mjs';
const bytes = text => new TextEncoder().encode(text);
test('framing is invariant at every packet split, across combined frames and UTF-8 boundaries', () => {
  const source = bytes('{"value":23,"unit":"°C"}\n{"value":24,"unit":"°C"}\r\n');
  for (let split = 0; split <= source.length; split++) {
    const readings = [], framer = createLineFramer(line => readings.push(parseReading(line)));
    framer.push(source.subarray(0, split)); framer.push(source.subarray(split));
    assert.deepEqual(readings, [{ value: 23, unit: '°C' }, { value: 24, unit: '°C' }]);
  }
});
test('oversized and invalid UTF-8 frames recover at the next delimiter within a fixed budget', () => {
  const records = [], rejected = [], framer = createLineFramer(line => records.push(line), { maxFrameBytes: 8, onReject: why => rejected.push(why) });
  framer.push(bytes('x'.repeat(100000))); assert.equal(framer.bufferedBytes, 0);
  framer.push(bytes('\nok\n')); framer.push(new Uint8Array([255, 10])); framer.push(bytes('fine\n'));
  assert.deepEqual(records, ['ok', 'fine']); assert.deepEqual(rejected, ['oversized-frame', 'invalid-utf8']);
  assert.throws(() => parseReading('{"value":null,"unit":"V"}'), /Invalid/);
});
test('serial Stop cancels a chooser before opening any late port', async () => {
  const runtime = runtimeFixture(), chooser = deferred(); let opened = 0;
  const controller = createSerialReader({ tendril: runtime, document: pageFixture(), serial: { requestPort() {
    assert.deepEqual(runtime.sensors.status().pending, ['serial']); return chooser.promise;
  } }, onFrame() {} });
  const start = controller.start(gesture); runtime.sensors.stopAll();
  chooser.resolve({ open() { opened++; } }); await assert.rejects(start, { name: 'AbortError' });
  await tick(); assert.equal(opened, 0); controller.dispose();
});
test('serial Stop during open awaits it and then closes exactly once', async () => {
  const runtime = runtimeFixture(), opened = deferred(); let closes = 0;
  const controller = createSerialReader({ tendril: runtime, document: pageFixture(), serial: { requestPort: async () => ({
    open: () => opened.promise, close: async () => { closes++; },
  }) }, onFrame() {} });
  const start = controller.start(gesture); await tick(); runtime.sensors.stopAll();
  assert.equal([...runtime.resources][0].state, 'stopping');
  opened.resolve(); await assert.rejects(start, { name: 'AbortError' }); await tick();
  assert.equal(closes, 1); assert.equal(runtime.resources.size, 0); controller.dispose();
});
test('serial combines reads, releases the reader and closes on visibility loss', async () => {
  const runtime = runtimeFixture(), document = pageFixture(), waiting = deferred(); let reads = 0, released = 0, closed = 0;
  const reader = { async read() { return reads++ === 0 ? { value: bytes('one\ntwo\n'), done: false } : waiting.promise; },
    async cancel() { waiting.resolve({ done: true }); }, releaseLock() { released++; } };
  const frames = [], controller = createSerialReader({ tendril: runtime, document, serial: { requestPort: async () => ({
    open: async () => {}, readable: { getReader: () => reader }, close: async () => { closed++; },
  }) }, onFrame: frame => frames.push(frame) });
  await controller.start(gesture); await tick(); document.hide(); await tick();
  assert.deepEqual(frames, ['one', 'two']); assert.equal(released, 1); assert.equal(closed, 1); controller.dispose();
});
test('Bluetooth pending connection is disconnected after its late grant', async () => {
  const runtime = runtimeFixture(), connection = deferred(), device = new EventTarget(); let disconnects = 0;
  device.gatt = { connected: false, connect: () => connection.promise, disconnect() { this.connected = false; disconnects++; } };
  const controller = createBluetoothReader({ tendril: runtime, document: pageFixture(),
    bluetooth: { requestDevice: async options => { assert.deepEqual(options, { filters: [{ services: ['service'] }] }); return device; } },
    service: 'service', characteristic: 'reading', onFrame() {} });
  const start = controller.start(gesture); await tick(); runtime.sensors.stopAll();
  device.gatt.connected = true; connection.resolve({});
  await assert.rejects(start, { name: 'AbortError' }); await tick();
  assert.equal(disconnects, 1); assert.equal(runtime.resources.size, 0); controller.dispose();
});

test('Bluetooth notifications use packet framing and detach before asynchronous shutdown', async () => {
  const runtime = runtimeFixture(), document = pageFixture(), device = new EventTarget(), value = new EventTarget();
  let disconnects = 0, stopped = 0; const frames = [];
  value.startNotifications = async () => value; value.stopNotifications = async () => { stopped++; };
  device.gatt = { connected: false, async connect() { this.connected = true; return { getPrimaryService: async () => ({ getCharacteristic: async () => value }) }; },
    disconnect() { this.connected = false; disconnects++; } };
  const controller = createBluetoothReader({ tendril: runtime, document, bluetooth: { requestDevice: async () => device },
    service: 'service', characteristic: 'reading', onFrame: line => frames.push(line) });
  await controller.start(gesture); assert.deepEqual(runtime.sensors.status().active, ['bluetooth']);
  const notify = text => { const chunk = bytes(text); value.value = new DataView(chunk.buffer); value.dispatchEvent(new Event('characteristicvaluechanged')); };
  notify('first'); notify('\nsecond\n'); controller.stop(); notify('late\n'); await tick();
  assert.deepEqual(frames, ['first', 'second']); assert.equal(stopped, 1); assert.equal(disconnects, 1); controller.dispose();
});
