import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { createEffectProvider } from './peer-generation-effect-provider.mjs';

test('provider commits before losing its HTTP reply and reconciles after reopen', async () => {
  const parent = resolve('test-results');
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(join(parent, 'effect-provider-'));
  let provider;
  try {
    provider = await createEffectProvider(directory);
    const request = { event: { payload: { message: 'Synthetic notification' } },
      idempotencyKey: 'stable-provider-intent', signal: AbortSignal.timeout(5000) };
    provider.loseNextReply();
    await assert.rejects(provider.dispatch(request), /fetch failed/u);
    const before = provider.snapshot();
    assert.equal(before.effects.length, 1);
    assert.equal(before.requests.length, 1);
    assert.equal(before.requests[0].resultCommitted, true);
    assert.equal(before.requests[0].replyLost, true);
    await provider.close();

    provider = await createEffectProvider(directory);
    const observed = await provider.reconcile({ ...request, signal: AbortSignal.timeout(5000) });
    assert.deepEqual(observed, { kind: 'completed', result: { receipt: before.effects[0].receipt } });
    assert.deepEqual(provider.snapshot().effects, before.effects);
    assert.equal(provider.snapshot().requests.some(value => value.method === 'POST'), false);
    assert.deepEqual(await provider.dispatch({ ...request, signal: AbortSignal.timeout(5000) }), observed.result);
    assert.equal(provider.snapshot().effects.length, 1);
    assert.equal(provider.snapshot().requests.at(-1).existing, true);
  } finally { await provider?.close(); await rm(directory, { recursive: true, force: true }); }
});
