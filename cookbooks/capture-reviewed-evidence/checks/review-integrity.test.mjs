import test from 'node:test';
import assert from 'node:assert/strict';
import { createObservationReview } from '../snippets/observation.mjs';
import { gesture, deferred, tick } from '../../../test/sensor-fixtures.mjs';

const reference = { profile: 'authored-content-v1', applicationId: 'ab'.repeat(32), id: 'cd'.repeat(32), epoch: 0, bytes: 5, mediaType: 'image/jpeg' };
const request = Object.freeze({ requestId: 'review-1', requester: '11'.repeat(32), recipient: '22'.repeat(32), expiresAt: 20000 });

test('retention and signal dispatch receive the same deeply frozen reviewed response', async () => {
  let retained, sent;
  const session = {
    identity: { publicKey: request.recipient }, applicationId: reference.applicationId,
    content: { async stage() { return { async write() {}, async commit() { return reference; }, async discard() {} }; }, async discard() {} },
    signals: { async send(topic, response) { assert.equal(topic, 'evidence/response'); sent = response; } },
  };
  const review = createObservationReview({ session, request, now: () => 1000, retainEvidence: async response => {
    retained = response;
    assert.throws(() => { response.text = 'changed after review'; }, TypeError);
    assert.throws(() => { response.reference.id = 'ef'.repeat(32); }, TypeError);
  } });
  review.setCandidate(new Blob(['photo'], { type: 'image/jpeg' }));
  const response = await review.send(gesture, { text: '  reviewed original  ', keep: true });
  assert.equal(response, retained); assert.equal(response, sent);
  assert.equal(response.text, 'reviewed original'); assert.deepEqual(response.reference, reference);
  assert.notEqual(response.reference, reference); // Do not freeze or trust a mutable API-returned alias.
  assert.equal(review.snapshot().retained, true);
});

test('cancellation while commit is in flight discards committed current-format content and never dispatches', async () => {
  const committed = deferred(), discards = [], sends = [];
  const session = {
    identity: { publicKey: request.recipient }, applicationId: reference.applicationId,
    content: { async stage() { return { async write() {}, commit: () => committed.promise, async discard() { throw Error('Committed content requires content.discard(reference)'); } }; }, async discard(value) { discards.push(value); } },
    signals: { async send(...args) { sends.push(args); } },
  };
  const review = createObservationReview({ session, request, now: () => 1000 });
  review.setCandidate(new Blob(['photo'], { type: 'image/jpeg' }));
  const pending = review.send(gesture); await tick(); await review.discard(); committed.resolve(reference);
  await assert.rejects(pending, { name: 'AbortError' });
  assert.deepEqual(discards, [reference]); assert.deepEqual(sends, []);
});
