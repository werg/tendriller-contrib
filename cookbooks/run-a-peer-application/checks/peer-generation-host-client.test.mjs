import assert from 'node:assert/strict';
import test from 'node:test';
import { createHostedFixture } from './peer-generation-host-client.mjs';

test('the native hosted adapter preserves typed control errors independently of their messages', async t => {
  let message = 'PEER_GENERATION_CONFLICT';
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    const path = new URL(input).pathname;
    if (path === '/testing/page') return Response.json({ ready: true });
    if (path === '/api/peers/application' && options.method === 'PUT') return Response.json({ descriptor: 'test-descriptor' });
    if (path === '/api/peers/definition') return Response.json({ descriptor: 'test-descriptor' });
    assert.equal(path, '/api/peers/generations');
    assert.equal(options.method, 'POST');
    return Response.json({ error: { code: 'peer_generation_conflict', message } }, { status: 409 });
  });
  const host = await createHostedFixture('https://test.invalid').createControl({ applicationId: 'test', configuration: {} });
  for (const next of ['PEER_GENERATION_CONFLICT', 'A different eligible coordinator won the transition']) {
    message = next;
    await assert.rejects(host.select({ transition: 'same-request' }), error => {
      assert.ok(error instanceof Error);
      assert.equal(error.code, 'peer_generation_conflict');
      assert.equal(error.message, message);
      assert.equal(error.status, 409);
      return true;
    });
  }
});

test('an untyped host failure is never inferred to be a generation conflict from its text', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'PEER_GENERATION_CONFLICT' }, { status: 409 }));
  await assert.rejects(createHostedFixture('https://test.invalid').createControl({ applicationId: 'test', configuration: {} }), error => {
    assert.equal(error.code, 'invalid_host_error');
    assert.equal(error.status, 409);
    assert.match(error.message, /without a typed error/u);
    return true;
  });
});
