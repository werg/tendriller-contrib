import test from 'node:test';
import assert from 'node:assert/strict';
import { configureInputRoutes, summarizeCapabilities } from '../snippets/capability-routes.mjs';
import { runtimeFixture } from '../../../test/sensor-fixtures.mjs';

test('task filter gates routes and leaves text/file usable without leaking the inventory', async () => {
  const runtime = runtimeFixture({ device: 'private fingerprint', captured_at: 123, capabilities: {
    camera: { available: true, permission: 'denied', deviceLabel: 'secret' },
    microphone: { available: false, permission: 'unknown' }, bluetooth: { available: true, permission: 'prompt' },
  } });
  const buttons = { camera: {}, microphone: {} }, fileInput = { hidden: true, disabled: true }, typedInput = { hidden: true, disabled: true };
  const summary = await configureInputRoutes(runtime, { buttons, fileInput, typedInput, status: {} });
  assert.deepEqual(runtime.calls, [['camera', 'microphone']]);
  assert.equal(buttons.camera.disabled, true); assert.equal(buttons.microphone.hidden, true);
  assert.deepEqual(fileInput, { hidden: false, disabled: false }); assert.deepEqual(typedInput, fileInput);
  assert.deepEqual(summary, { camera: { available: true, permission: 'denied' }, microphone: { available: false, permission: 'unknown' } });
  assert.equal(JSON.stringify(summary).includes('private'), false);
});
test('unknown fields and unbounded inventory requests are refused', () => {
  assert.throws(() => summarizeCapabilities({}, ['battery']), /task-relevant/);
  assert.deepEqual(summarizeCapabilities({}, ['camera']), { camera: { available: false, permission: 'unknown' } });
});
test('probe failure preserves fallback completion', async () => {
  const fileInput = {}, typedInput = {}, buttons = { camera: {} }, status = {};
  await assert.rejects(configureInputRoutes({ capabilities: async () => { throw Error('closed'); } }, { buttons, fileInput, typedInput, status }), /closed/);
  assert.equal(buttons.camera.hidden, true); assert.equal(typedInput.disabled, false);
  assert.match(status.textContent, /Choose a file/);
});

test('general task summaries share only bounded permission/availability after explicit gesture', async () => {
  const { inspectInputs, shareInputChoices } = await import('../snippets/capabilities.mjs');
  const runtime = runtimeFixture({ device: 'private', capabilities: { serial: { available: true, permission: 'prompt', active: true } } });
  const summary = await inspectInputs(runtime, ['serial']); const sends = [];
  assert.equal(summary.capabilities.serial.active, true); assert.deepEqual(summary.fallbacks, ['file', 'text']);
  const session = { signals: { async send(topic, payload, options) { sends.push({ topic, payload, options }); } } };
  await assert.rejects(shareInputChoices(session, summary, { isTrusted: false }, { streamId: 'task' }), /Share capabilities/);
  await shareInputChoices(session, summary, { isTrusted: true }, { streamId: 'task' });
  assert.deepEqual(sends[0].payload, { capabilities: { serial: { available: true, permission: 'prompt' } } });
  assert.equal(sends[0].options.stream.streamId, 'task');
});
