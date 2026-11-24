import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrivateApiFeed } from '../snippets/private-api-feed.mjs';

test('private API feed pauses when idle, deduplicates unchanged snapshots, and pushes on peer connect', async () => {
  const sent = [];
  const listeners = new Set();
  let peers = [];
  const session = {
    signals: { async send(topic, payload) { sent.push({ topic, payload }); } },
    participation: {
      get status() { return { connectedPeers: peers }; },
      onStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    },
  };

  let value = { ok: true, count: 1 };
  let fetchCalls = 0;
  const feed = createPrivateApiFeed(session, {
    name: 'private-metrics',
    pollMs: 0,
    fetchData: async () => { fetchCalls++; return value; },
  });

  // No peers connected -> skips fetch & signal.
  assert.equal(await feed.pollOnce(), null);
  assert.equal(fetchCalls, 0);
  assert.equal(sent.length, 0);

  // Connect peer -> fetches and sends revision 1.
  peers = ['browser-1'];
  await feed.pollOnce();
  assert.equal(fetchCalls, 1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].topic, 'feed/private-metrics');
  assert.equal(sent[0].payload.revision, 1);

  // Unchanged reading -> skips redundant signal.
  await feed.pollOnce();
  assert.equal(fetchCalls, 2);
  assert.equal(sent.length, 1);

  // Changed reading -> sends revision 2.
  value = { ok: true, count: 2 };
  await feed.pollOnce();
  assert.equal(sent.length, 2);
  assert.equal(sent[1].payload.revision, 2);

  feed.close();
});
