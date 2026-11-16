import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createWorkflows } from '../client.mjs';

const descriptor = { contract: 3, workflows: [{ id: 'sessions', interface_version: '1', schema_version: '1' }] };
const metadata = () => ({ cid: 'queued-command', scope: 'sessions:notebook', expected_generations: { 'sessions:notebook': 'original' } });

test('agent adapter verifies requirements while preserving the command captured before preflight', async () => {
  let resolve, sent;
  const service = new Promise(done => { resolve = done; });
  const api = createWorkflows({ service: () => service, workflow: (...args) => { sent = args; } });
  const captured = metadata(), data = { title: 'Original draft' };
  const pending = api.call('archive', data, captured);
  captured.expected_generations['sessions:notebook'] = 'rotated'; data.title = 'Changed';
  resolve(descriptor); await pending;
  assert.deepEqual(sent, ['sessions', 'archive', { ...metadata(), data: { title: 'Original draft' } }]);
  const missing = createWorkflows({ service: async () => ({ contract: 3, workflows: [] }), workflow: () => assert.fail('Must not submit to an unavailable workflow') });
  await assert.rejects(missing.call('archive'), /does not provide/);
});

test('browser adapter discovers missing welcome metadata and never refreshes captured generations', async () => {
  let resolve, received;
  const service = new Promise(done => { resolve = done; });
  const window = {};
  runInNewContext(readFileSync(new URL('../browser.js', import.meta.url), 'utf8'), { window, crypto, structuredClone });
  const api = window.TendrilWorkflows.create({
    scopes: { capture: () => metadata(), list: () => [] },
    request: (path, options) => path === 'service' ? service : (received = { path, command: options.body }),
  });
  const captured = metadata();
  const pending = api.call('archive', { scope: 'notebook' }, captured);
  captured.expected_generations['sessions:notebook'] = 'new';
  resolve(descriptor); await pending;
  assert.deepEqual(received, { path: 'workflows/sessions/archive', command: { ...metadata(), data: { scope: 'notebook' } } });
  const missing = window.TendrilWorkflows.create({ scopes: {}, request: async () => ({ contract: 3, workflows: [] }) });
  await assert.rejects(missing.call('archives'), /does not provide/);
});
