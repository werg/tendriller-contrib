import test from 'node:test';
import assert from 'node:assert/strict';
import { createTypingState, observeTyping } from './shared/typing.mjs';

const event = (authorId, expiresAtMs, typing = true, sessionId = 'session') => ({
  topic: 'typing', authorId, sessionId, payload: { typing }, expiresAtMs,
});

test('typing senders expire independently and false clears only its sender', () => {
  const state = createTypingState();
  state.update(event('alice', 2100), 100);
  state.update(event('bob', 900), 100);
  assert.deepEqual(state.snapshot(100), { count: 2, expiresAtMs: 900 });
  assert.deepEqual(state.snapshot(900), { count: 1, expiresAtMs: 2100 });
  state.update(event('bob', 2400), 1000);
  state.update(event('alice', 2500, false), 1100);
  assert.deepEqual(state.snapshot(1100), { count: 1, expiresAtMs: 2400 });
});

test('independent sessions do not clear each other and long lifetimes stay bounded', () => {
  const state = createTypingState();
  state.update(event('alice', 9000, true, 'laptop'), 100);
  state.update(event('alice', 9000, true, 'phone'), 200);
  state.update(event('alice', 9000, false, 'laptop'), 300);
  assert.deepEqual(state.snapshot(300), { count: 1, expiresAtMs: 2700 });
  assert.deepEqual(state.snapshot(2700), { count: 0, expiresAtMs: null });
});

test('malformed, unrelated and expired live data does not create or clear typing', () => {
  const state = createTypingState();
  state.update(event('alice', 1000), 100);
  for (const value of [
    { ...event('alice', 900), topic: 'progress' },
    { ...event('alice', 900), payload: { typing: 'false' } },
    event('alice', 50, false), event('', 900), event('bob', Infinity),
  ]) state.update(value, 200);
  assert.deepEqual(state.snapshot(200), { count: 1, expiresAtMs: 1000 });
});

test('the visible set is bounded and an update refreshes eviction priority', () => {
  const state = createTypingState({ maxPeers: 2 });
  state.update(event('alice', 2000), 100);
  state.update(event('bob', 2100), 100);
  state.update(event('alice', 2200), 200);
  state.update(event('charlie', 2300), 300);
  assert.deepEqual(state.snapshot(300), { count: 2, expiresAtMs: 2200 });
});

test('live subscription explicitly coalesces typing and clears its timer/view on failure', async () => {
  const snapshots = [], timers = new Map();
  let timerId = 0, requested;
  const signals = { async *subscribe(options) {
    requested = options;
    yield event('alice', 1100);
    yield event('bob', 600);
    throw new Error('SIGNAL_SUBSCRIPTION_OVERFLOW');
  } };
  await assert.rejects(observeTyping(signals, {
    now: () => 100,
    onChange: snapshot => snapshots.push(snapshot),
    schedule: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
    cancel: id => timers.delete(id),
  }), /OVERFLOW/);
  assert.equal(requested.mode, 'latest');
  assert.deepEqual(requested.topics, ['typing']);
  assert.deepEqual(snapshots, [
    { count: 1, expiresAtMs: 1100 }, { count: 2, expiresAtMs: 600 }, { count: 0, expiresAtMs: null },
  ]);
  assert.equal(timers.size, 0);
});

test('expiry updates the view without new traffic and an aborted stream cannot repaint', async () => {
  const controller = new AbortController(), snapshots = [];
  let clock = 100, timer, resume;
  const signals = { async *subscribe() {
    yield event('alice', 600);
    await new Promise(resolve => { resume = resolve; });
    yield event('bob', 2000);
  } };
  const running = observeTyping(signals, {
    signal: controller.signal,
    now: () => clock,
    onChange: snapshot => snapshots.push(snapshot),
    schedule: callback => { timer = callback; return 1; },
    cancel: () => {},
  });
  await new Promise(resolve => setImmediate(resolve));
  clock = 600;
  timer();
  assert.deepEqual(snapshots.at(-1), { count: 0, expiresAtMs: null });
  controller.abort();
  resume();
  await running;
  const count = snapshots.length;
  timer();
  assert.equal(snapshots.length, count);
  assert.equal(snapshots.some(snapshot => snapshot.expiresAtMs === 2000), false);
});
