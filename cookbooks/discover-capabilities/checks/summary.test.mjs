import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectInputs, applyInputChoices, shareInputChoices } from '../snippets/capabilities.mjs';
import { runtimeFixture, gesture } from '../../../test/sensor-fixtures.mjs';
test('only selected input facts survive the report; unsupported routes keep file/text available', async () => {
  const runtime = runtimeFixture({ device: 'private-user-agent', capabilities: {
    camera: { available: true, permission: 'denied', note: 'private-label' },
    microphone: { available: false, permission: 'unknown' }, bluetooth: { available: true, permission: 'granted' },
  } });
  const summary = await inspectInputs(runtime, ['camera', 'microphone', 'camera']);
  assert.deepEqual(runtime.calls, [['camera', 'microphone']]);
  assert.equal(JSON.stringify(summary).includes('private'), false);
  assert.equal(Object.hasOwn(summary.capabilities, 'bluetooth'), false);
  const camera = {}, microphone = {}, file = { hidden: true }, text = { disabled: true };
  applyInputChoices(summary, { buttons: { camera, microphone }, fileButton: file, textButton: text });
  assert.equal(camera.hidden, false); assert.equal(camera.disabled, true); assert.equal(microphone.hidden, true);
  assert.equal(file.hidden, false); assert.equal(text.disabled, false);
});
test('bounded diagnostics require a separate trusted sharing action and strip active/device details', async () => {
  const sends = [], session = { signals: { async send(...args) { sends.push(args); } } };
  const summary = { capabilities: { camera: { available: true, permission: 'prompt', active: true, label: 'private' } } };
  await assert.rejects(shareInputChoices(session, summary, {}, { streamId: 'task-1' }), /Share capabilities/);
  await shareInputChoices(session, summary, gesture, { streamId: 'task-1' });
  assert.equal(sends.length, 1);
  assert.deepEqual(sends[0][1], { capabilities: { camera: { available: true, permission: 'prompt' } } });
  assert.deepEqual(sends[0][2].stream, { streamId: 'task-1' });
  await assert.rejects(inspectInputs({}, Array(13).fill('camera')), /12/);
});
