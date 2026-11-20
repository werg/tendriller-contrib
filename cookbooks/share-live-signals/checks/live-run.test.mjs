import assert from 'node:assert/strict';
import test from 'node:test';
import { createLiveRun, observeAttention, observeLiveRun } from '../snippets/live-run.mjs';

const selection = { runId: 'import-1', publisher: 'authorized-worker' };
const event = (topic, payload, expiresAtMs = 3000, authorId = selection.publisher) => ({
  topic, stream: { streamId: selection.runId }, payload: { runId: selection.runId, ...payload }, expiresAtMs, authorId,
});

test('progress and complete previews have separate expiry and require no durable backend', () => {
  const run = createLiveRun(selection);
  run.update(event('progress', { completed: 3, total: 10 }, 2000), 1000);
  run.update(event('preview', { text: 'A complete current preview' }, 4000), 1000);
  assert.deepEqual(run.snapshot(1000).progress, { completed: 3, total: 10, expiresAtMs: 2000 });
  assert.equal(run.snapshot(2000).progress, null);
  assert.equal(run.snapshot(2000).preview.text, 'A complete current preview');
  assert.deepEqual(run.snapshot(4000), { progress: null, preview: null, expiresAtMs: null });
});

test('live payloads cannot change run ownership, imply invented progress or splice missing chunks', () => {
  const run = createLiveRun(selection);
  run.update(event('progress', { completed: 100, total: 10 }), 1000);
  run.update(event('progress', { completed: 3, total: 10 }, 3000, 'different-worker'), 1000);
  run.update(event('preview', { text: 'other run', runId: 'import-2' }), 1000);
  run.update(event('preview', { text: 'x'.repeat(8193) }), 1000);
  assert.deepEqual(run.snapshot(1000), { progress: null, preview: null, expiresAtMs: null });
  run.update(event('preview', { text: 'One' }), 1000);
  // A missing intermediate preview does not affect the next complete snapshot.
  run.update(event('preview', { text: 'One complete result preview' }), 1000);
  assert.equal(run.snapshot(1000).preview.text, 'One complete result preview');
});

test('a live observer coalesces replaceable values, expires without more traffic and clears on end', async () => {
  let tick, finish, current = 1000;
  const values = [];
  const source = { subscribe(options) {
    assert.deepEqual(options.topics, ['progress', 'preview']); assert.equal(options.mode, 'latest');
    assert.deepEqual(options.streams, [{ authorId: selection.publisher, streamId: selection.runId }]);
    return { async *[Symbol.asyncIterator]() {
      yield event('progress', { completed: 3, total: null }, 2000);
      await new Promise(resolve => { finish = resolve; });
    } };
  } };
  const observing = observeLiveRun(source, { ...selection, now: () => current,
    onChange: value => values.push(value), schedule: callback => { tick = callback; }, cancel() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(values.at(-1).progress.total, null);
  current = 2000; tick();
  assert.equal(values.at(-1).progress, null);
  finish(); await observing;
  assert.deepEqual(values.at(-1), { progress: null, preview: null, expiresAtMs: null });
});

test('distinct attention suggestions honor sender, target and local follow choice', async () => {
  const highlighted = [];
  let follow = true;
  const source = { subscribe(options) {
    assert.equal(options.mode, 'all');
    assert.deepEqual(options.streams, [{ authorId: selection.publisher, streamId: selection.runId }]);
    return { async *[Symbol.asyncIterator]() {
      yield event('attention', { targetId: 'summary' });
      yield event('attention', { targetId: 'summary' }, 3000, 'unselected-worker');
      yield event('attention', { targetId: 'dangerous-external-command' });
      follow = false;
      yield event('attention', { targetId: 'details' });
      follow = true;
      yield event('attention', { targetId: 'details' });
    } };
  } };
  await observeAttention(source, { ...selection, allowedTargets: new Set(['summary', 'details']),
    following: () => follow, highlight: value => highlighted.push(value) });
  assert.deepEqual(highlighted, ['summary', 'details']);
});

test('signed stream and endpoint identity cannot be replaced by a matching payload label', () => {
  const run = createLiveRun({ ...selection, endpointId: 'tool-a', endpointIncarnation: 'incarnation-2' });
  const valid = { ...event('preview', { text: 'Current' }),
    stream: { streamId: selection.runId, endpointId: 'tool-a', endpointIncarnation: 'incarnation-2' } };
  run.update(valid, 1000);
  for (const stream of [undefined, { ...valid.stream, streamId: 'another-run' },
    { ...valid.stream, endpointId: 'tool-b' }, { ...valid.stream, endpointIncarnation: 'incarnation-1' }]) {
    run.update({ ...valid, stream, payload: { ...valid.payload, text: 'Spoofed' } }, 1000);
  }
  assert.equal(run.snapshot(1000).preview.text, 'Current');
});
