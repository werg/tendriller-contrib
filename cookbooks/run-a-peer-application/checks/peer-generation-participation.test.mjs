import assert from 'node:assert/strict';
import test from 'node:test';
import { getEventListeners } from 'node:events';
import { createParticipationFixture } from './peer-generation-participation.mjs';

const nextTurn = () => new Promise(resolve => setImmediate(resolve));
const peer = (fixture, deviceId) => fixture.ports({ deviceId }).discovery;
const advertise = (discovery, identity, storageId = identity + '-store') =>
  discovery.advertise({ identity, storageId }, { signal: new AbortController().signal });
const notifications = (discovery, signal = new AbortController().signal) =>
  discovery.notifications.bind(discovery)({ signal })[Symbol.asyncIterator]();
const nextType = async (iterator, type) => assert.deepEqual(await iterator.next(), { done: false, value: { type } });

test('ready precedes queued advertisements and existing peers are readable after subscription', async () => {
  const fixture = createParticipationFixture(), a = peer(fixture, 'a'), b = peer(fixture, 'b');
  const notices = notifications(b);
  try {
    await advertise(a, 'a');
    await nextType(notices, 'ready');
    assert.deepEqual(await b.read({ signal: new AbortController().signal }), [{ identity: 'a', route: 'a' }]);
    await nextType(notices, 'changed');
    const late = notifications(peer(fixture, 'c'));
    try { await nextType(late, 'ready'); } finally { await late.return(); }
  } finally { await notices.return(); }
});

test('advertise and withdraw wake independent subscribers without a scan or renewed advertisement', async () => {
  const fixture = createParticipationFixture(), a = peer(fixture, 'a'), b = peer(fixture, 'b');
  const first = notifications(b), second = notifications(b);
  try {
    await nextType(first, 'ready'); await nextType(second, 'ready');
    const firstChanged = nextType(first, 'changed'), secondChanged = nextType(second, 'changed');
    await advertise(a, 'a');
    await Promise.all([firstChanged, secondChanged]);
    await first.return();
    const withdrawn = nextType(second, 'changed');
    await a.withdraw(); await withdrawn;
    assert.deepEqual(await b.read({ signal: new AbortController().signal }), []);
  } finally { await first.return(); await second.return(); }
});

test('only peer-map mutations notify; repeated advertisements, reads and empty withdrawals stay quiet', async () => {
  const fixture = createParticipationFixture(), a = peer(fixture, 'a'), b = peer(fixture, 'b');
  const notices = notifications(b);
  try {
    await nextType(notices, 'ready'); await advertise(a, 'a'); await nextType(notices, 'changed');
    let delivered = false;
    const pending = notices.next().then(result => { delivered = true; return result; });
    for (let index = 0; index < 50; index++) {
      await advertise(a, 'a');
      await b.read({ signal: new AbortController().signal });
      await b.withdraw();
    }
    await nextTurn(); assert.equal(delivered, false);
    await advertise(a, 'a', 'replacement-store');
    assert.deepEqual(await pending, { done: false, value: { type: 'changed' } });
  } finally { await notices.return(); }
});

test('busy discovery consumers coalesce arbitrarily many changes into one bounded invalidation', async () => {
  const fixture = createParticipationFixture(), a = peer(fixture, 'a'), b = peer(fixture, 'b');
  const notices = notifications(b);
  try {
    for (let index = 0; index < 100; index++) { await advertise(a, 'a'); await a.withdraw(); }
    await advertise(a, 'a');
    await nextType(notices, 'ready'); await nextType(notices, 'changed');
    assert.deepEqual(await b.read({ signal: new AbortController().signal }), [{ identity: 'a', route: 'a' }]);
    let delivered = false;
    const pending = notices.next().then(result => { delivered = true; return result; });
    await nextTurn(); assert.equal(delivered, false);
    await a.withdraw();
    assert.deepEqual(await pending, { done: false, value: { type: 'changed' } });
  } finally { await notices.return(); }
});

test('return retires a pending notification reader and removes it from later map changes', async () => {
  const fixture = createParticipationFixture(), a = peer(fixture, 'a'), b = peer(fixture, 'b');
  const stop = new AbortController(), notices = notifications(b, stop.signal);
  assert.equal(getEventListeners(stop.signal, 'abort').length, 1);
  await nextType(notices, 'ready');
  const pending = notices.next();
  assert.deepEqual(await notices.return(), { done: true });
  assert.equal(getEventListeners(stop.signal, 'abort').length, 0);
  assert.deepEqual(await pending, { done: true });
  await advertise(a, 'a'); await a.withdraw();
  assert.deepEqual(await notices.next(), { done: true });
});


test('aborting one notification consumer closes its pending read while its sibling stays live', async () => {
  const fixture = createParticipationFixture(), a = peer(fixture, 'a'), b = peer(fixture, 'b');
  const stop = new AbortController();
  const first = notifications(b, stop.signal), second = notifications(b);
  try {
    await nextType(first, 'ready'); await nextType(second, 'ready');
    const pending = first.next();
    stop.abort();
    assert.deepEqual(await pending, { done: true });
    await advertise(a, 'a'); await nextType(second, 'changed');
    await a.withdraw(); await nextType(second, 'changed');
    assert.deepEqual(await first.next(), { done: true });
  } finally { await first.return(); await second.return(); }
});

test('an already-aborted signal, including abort before iteration, cannot register ready or changed', async () => {
  const fixture = createParticipationFixture(), a = peer(fixture, 'a'), b = peer(fixture, 'b');
  for (const beforeCall of [true, false]) {
    const stop = new AbortController();
    if (beforeCall) stop.abort();
    const stream = b.notifications({ signal: stop.signal });
    if (!beforeCall) stop.abort();
    const notices = stream[Symbol.asyncIterator]();
    assert.deepEqual(await notices.next(), { done: true });
    await advertise(a, 'a'); await a.withdraw();
    await notices.return();
  }
});

test('abort fences a ready or changed delivery already resolved but not yet consumed', async () => {
  const fixture = createParticipationFixture(), a = peer(fixture, 'a'), b = peer(fixture, 'b');
  for (const ready of [true, false]) {
    const stop = new AbortController(), notices = notifications(b, stop.signal);
    if (!ready) { await nextType(notices, 'ready'); await advertise(a, 'a'); }
    const pending = notices.next();
    stop.abort();
    assert.deepEqual(await pending, { done: true });
    await a.withdraw();
    await notices.return();
  }
});
