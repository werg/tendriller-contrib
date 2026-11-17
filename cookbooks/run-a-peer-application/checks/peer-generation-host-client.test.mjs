import assert from 'node:assert/strict';
import test from 'node:test';
import { createHostedFixture } from './peer-generation-host-client.mjs';

// Only the HTTP adapter is under test here. Runtime qualification supplies the
// actual public Chronolog transport and checks its filtering at both boundaries.
const participantApi = {
  createParticipantTransport({ applicationId, exchange }) {
    return { exchange, async request(facet, action, payload) {
      const response = await exchange({ protocol: 'chronolog-participant-v1', applicationId,
        requestId: 'http-adapter-test', facet, action, payload });
      return response.payload;
    } };
  },
};

test('the native hosted adapter preserves typed control errors independently of their messages', async t => {
  let message = 'PEER_GENERATION_CONFLICT';
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    const path = new URL(input).pathname;
    if (path === '/testing/page') return Response.json({ ready: true });
    assert.equal(path, '/api/peers/participant');
    assert.equal(options.method, 'POST');
    const envelope = JSON.parse(options.body);
    if (envelope.action === 'configure' || envelope.action === 'definition') {
      return Response.json({ ...envelope, payload: { descriptor: 'test-descriptor' } });
    }
    assert.equal(envelope.facet, 'control');
    assert.equal(envelope.action, 'select');
    assert.deepEqual(envelope.payload, { request: { transition: 'same-request' } });
    return Response.json({ error: { code: 'peer_generation_conflict', message } }, { status: 409 });
  });
  const host = await createHostedFixture('https://test.invalid', participantApi).createControl({ applicationId: 'test', configuration: {} });
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
  await assert.rejects(createHostedFixture('https://test.invalid', participantApi).createControl({ applicationId: 'test', configuration: {} }), error => {
    assert.equal(error.code, 'invalid_host_error');
    assert.equal(error.status, 409);
    assert.match(error.message, /without a typed error/u);
    return true;
  });
});

test('bootstrap, publication and control reads use one participant transport and preserve cancellation', async t => {
  const calls = [], configuration = { definition: { id: 'conversation' }, schema: null };
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    const path = new URL(input).pathname;
    if (path === '/testing/page') return Response.json({ ready: true });
    assert.equal(path, '/api/peers/participant');
    assert.equal(options.method, 'POST');
    const envelope = JSON.parse(options.body); calls.push(envelope);
    const payload = envelope.action === 'read' ? { authority: true } : { descriptor: 'test-descriptor', ...configuration };
    return Response.json({ ...envelope, payload });
  });
  const host = await createHostedFixture('https://test.invalid', participantApi).createControl({ applicationId: 'test', configuration });
  assert.deepEqual(await host.read(), { authority: true });
  assert.deepEqual(calls.map(({ facet, action, payload }) => ({ facet, action, payload })), [
    { facet: 'control', action: 'configure', payload: configuration },
    { facet: 'publication', action: 'definition', payload: {} },
    { facet: 'control', action: 'read', payload: {} },
  ]);
  const transition = { signed: 'transition' }, update = { recoveryFloor: { generation: 'current', sequence: 1, root: 'retained' } };
  await host.select(transition, update);
  assert.deepEqual(calls.at(-1).payload, { request: transition, control: update });
  const cancellation = new AbortController(); cancellation.abort(new Error('qualification stopped'));
  t.mock.method(globalThis, 'fetch', async (_input, options) => options.signal.throwIfAborted());
  await assert.rejects(host.exchange(calls[2], { signal: cancellation.signal }), /qualification stopped/u);
});

test('rendezvous preserves host-assigned roles and endpoint identities when the second peer offers', async t => {
  const sent = [], closed = [];
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    const path = new URL(input).pathname;
    if (path === '/rendezvous/open') {
      assert.deepEqual(JSON.parse(options.body).peers, ['first-peer', 'second-peer']);
      return Response.json({ id: '7', roles: ['answerer', 'offerer'] });
    }
    const [, endpoint, action] = /^\/rendezvous\/7\/(0|1)\/(send|close)$/u.exec(path);
    if (action === 'send') sent.push({ endpoint: Number(endpoint), ...JSON.parse(options.body) });
    else closed.push(Number(endpoint));
    return Response.json({ ok: true });
  });
  const pair = await createHostedFixture('https://test.invalid', participantApi)
    .signalingPair({ deviceId: 'first-peer' }, { deviceId: 'second-peer' });
  assert.deepEqual(pair.roles, ['answerer', 'offerer']);
  await pair.b.send({ type: 'offer', sdp: 'second peer offer' });
  await pair.a.send({ type: 'answer', sdp: 'first peer answer' });
  assert.deepEqual(sent, [{ endpoint: 1, type: 'offer', sdp: 'second peer offer' },
    { endpoint: 0, type: 'answer', sdp: 'first peer answer' }]);
  await Promise.all([pair.a.close(), pair.b.close()]);
  assert.deepEqual(closed.sort(), [0, 1]);
  assert.equal(pair.closed(), true);
  assert.deepEqual(pair.types, ['offer', 'answer']);
});
