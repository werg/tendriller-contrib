import test from 'node:test';
import assert from 'node:assert/strict';
import { captureScreenFrame, createAudioClip } from '../snippets/capture.mjs';
import { createObservationReview, validateObservationRequest, observeRequests } from '../snippets/observation.mjs';
import { runtimeFixture, pageFixture, trackFixture, gesture, deferred, tick } from '../../../test/sensor-fixtures.mjs';

function screenDocument(track) {
  const document = pageFixture();
  document.createElement = tag => tag === 'video' ? { muted: false, videoWidth: 1920, videoHeight: 1080, play: async () => {}, pause() {} }
    : { getContext: () => ({ drawImage() {} }), toBlob(callback) { assert.equal(track.readyState, 'ended'); callback(new Blob(['frame'], { type: 'image/jpeg' })); } };
  return document;
}
test('screen capture requires a gesture, bounds its frame and stops before encoding/review', async () => {
  const track = trackFixture(), runtime = runtimeFixture(), document = screenDocument(track); let acquisitions = 0;
  const options = { tendril: runtime, document, mediaDevices: { getDisplayMedia(options) { acquisitions++; assert.equal(options.audio, false); return Promise.resolve({ getTracks: () => [track] }); } } };
  await assert.rejects(captureScreenFrame({ isTrusted: false }, options), /trusted/); assert.equal(acquisitions, 0);
  const blob = await captureScreenFrame(gesture, options);
  assert.equal(blob.type, 'image/jpeg'); assert.equal(track.stops, 1); assert.equal(runtime.resources.size, 0);
});
test('Stop rejects a pending screen chooser and closes a late stream', async () => {
  const runtime = runtimeFixture(), grant = deferred(), track = trackFixture();
  const pending = captureScreenFrame(gesture, { tendril: runtime, document: screenDocument(track), mediaDevices: { getDisplayMedia: () => grant.promise } });
  assert.deepEqual(runtime.sensors.status().pending, ['screen_capture']);
  runtime.sensors.stopAll(); await assert.rejects(pending, { name: 'AbortError' });
  grant.resolve({ getTracks: () => [track] }); await tick(); assert.equal(track.stops, 1);
});
class Recorder extends EventTarget {
  static instances = [];
  static isTypeSupported = type => type === 'audio/webm';
  constructor(stream, { mimeType }) { super(); this.mimeType = mimeType + ';codecs=opus'; this.state = 'inactive'; Recorder.instances.push(this); }
  start(ms) { assert.equal(ms, 250); this.state = 'recording'; }
  emit(bytes) { const event = new Event('dataavailable'); event.data = new Blob([new Uint8Array(bytes)]); this.dispatchEvent(event); }
  stop() { if (this.state === 'inactive') return; this.state = 'inactive'; queueMicrotask(() => this.dispatchEvent(new Event('stop'))); }
}
test('audio auto-finishes at the duration cap, returns reviewed bytes and releases its track', async () => {
  const runtime = runtimeFixture(), track = trackFixture(); let timer, duration;
  const audio = createAudioClip({ tendril: runtime, document: pageFixture(), Recorder,
    mediaDevices: { getUserMedia: async () => ({ getTracks: () => [track] }) }, maxDurationMs: 1234,
    schedule(fn, ms) { timer = fn; duration = ms; }, cancel() {} });
  const pending = audio.start(gesture); await tick(); Recorder.instances.at(-1).emit(10); timer();
  const blob = await pending; assert.equal(duration, 1234); assert.equal(blob.size, 10);
  assert.equal(blob.type, 'audio/webm;codecs=opus'); assert.equal(track.stops, 1); audio.dispose();
});
test('audio byte overflow and visibility cancellation never yield a candidate', async () => {
  const runtime = runtimeFixture(), document = pageFixture(), track = trackFixture();
  const options = { tendril: runtime, document, Recorder, mediaDevices: { getUserMedia: async () => ({ getTracks: () => [track] }) }, maxBytes: 5 };
  const audio = createAudioClip(options), pending = audio.start(gesture); await tick();
  Recorder.instances.at(-1).emit(6); await assert.rejects(pending, /byte budget/); audio.dispose();
  const second = createAudioClip({ ...options, document: pageFixture() }), cancelled = second.start(gesture); await tick(); runtime.sensors.stopAll();
  await assert.rejects(cancelled, { name: 'AbortError' }); second.dispose();
});
test('audio late grant after cancellation is closed without creating a recorder', async () => {
  const runtime = runtimeFixture(), grant = deferred(), track = trackFixture(), before = Recorder.instances.length;
  const audio = createAudioClip({ tendril: runtime, document: pageFixture(), Recorder, mediaDevices: { getUserMedia: () => grant.promise } });
  const pending = audio.start(gesture); audio.cancel(); await assert.rejects(pending, { name: 'AbortError' });
  grant.resolve({ getTracks: () => [track] }); await tick(); assert.equal(track.stops, 1); assert.equal(Recorder.instances.length, before); audio.dispose();
});
const nativeId = '11'.repeat(32), pageId = '22'.repeat(32);
const request = { requestId: 'ask-1', requester: nativeId, recipient: pageId, question: 'Show the instrument reading.', expiresAt: 20000 };
function sessionFixture() {
  const writes = [], sends = [], discards = []; let reference = { profile: 'authored-content-v1', applicationId: 'ab'.repeat(32), id: 'cd'.repeat(32), epoch: 0, bytes: 70000, mediaType: 'image/jpeg' };
  const upload = { async write(index, bytes) { writes.push({ index, size: bytes.length }); }, async commit() { return reference; }, async discard() { discards.push('upload'); } };
  return { applicationId: 'ab'.repeat(32), identity: { publicKey: pageId }, writes, sends, discards, upload,
    content: { async stage({ bytes, mediaType }) { reference = { ...reference, bytes, mediaType }; return upload; }, async discard(ref) { discards.push(ref.id); } },
    signals: { async send(topic, payload) { sends.push({ topic, payload }); } } };
}
test('agent requests are bounded, addressed, expiring, authenticated and only render a card', async () => {
  const session = sessionFixture(), payload = { ...request, requester: undefined }, base = { authorId: nativeId, scope: session.applicationId, expiresAtMs: 20000, payload };
  assert.ok(validateObservationRequest(base, { session, requester: nativeId, now: 1000 }));
  for (const event of [{ ...base, authorId: 'stranger' }, { ...base, scope: 'other' }, { ...base, expiresAtMs: 1 },
    { ...base, payload: { ...payload, recipient: 'other' } }, { ...base, payload: { ...payload, question: 'x'.repeat(1001) } }]) {
    assert.equal(validateObservationRequest(event, { session, requester: nativeId, now: 1000 }), null);
  }
  session.signals.subscribe = async function* () { yield base; yield base; };
  const cards = []; await observeRequests({ session, requester: nativeId, now: () => 1000, onRequest: card => cards.push(card) });
  assert.equal(cards.length, 1); assert.equal(session.sends.length, 0); assert.equal(session.writes.length, 0);
});
test('review sends exact bounded chunks only after trusted Send and preserves sample time', async () => {
  const session = sessionFixture(); let now = 1000;
  const review = createObservationReview({ session, request, now: () => now });
  review.setCandidate(new Blob([new Uint8Array(70000)], { type: 'image/jpeg' }), { observedAt: now });
  assert.equal(session.writes.length, 0);
  await assert.rejects(review.send({ isTrusted: false }, { text: 'reading' }), /trusted/);
  now = 2000; const response = await review.send(gesture, { text: 'reading' });
  assert.deepEqual(session.writes, [{ index: 0, size: 65536 }, { index: 1, size: 4464 }]);
  assert.equal(Object.isFrozen(response), true); assert.equal(Object.isFrozen(response.reference), true);
  assert.throws(() => { response.reference.bytes = 1; }, TypeError);
  assert.equal(response.reference.profile, 'authored-content-v1');
  assert.equal(response.reference.applicationId, session.applicationId);
  assert.equal(response.reference.bytes, 70000);
  assert.equal(response.observedAt, 1000); assert.equal(response.requestId, 'ask-1'); assert.equal(response.recipient, nativeId);
  assert.equal(session.discards.length, 0); await review.releaseAfterReceipt(); assert.deepEqual(session.discards, ['cd'.repeat(32)]);
});
test('discard during an in-flight write never sends and explicitly discards staged bytes', async () => {
  const session = sessionFixture(), writing = deferred(); session.upload.write = () => writing.promise;
  const review = createObservationReview({ session, request, now: () => 1000 });
  review.setCandidate(new Blob(['photo'], { type: 'image/jpeg' }));
  const pending = review.send(gesture); await tick(); await review.discard(); writing.resolve();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(session.sends.length, 0); assert.deepEqual(session.discards, ['upload']);
});
test('retention is an explicit declared callback with stable operation identity; uncertain sends cannot silently duplicate', async () => {
  const session = sessionFixture(), retained = [], review = createObservationReview({ session, request, now: () => 1000, retainEvidence: async value => retained.push(value) });
  session.signals.send = async () => { throw Error('lost route'); };
  await assert.rejects(review.send(gesture, { text: 'typed alternative', keep: true }), /lost route/);
  assert.equal(retained.length, 1); assert.equal(retained[0].operationId, review.snapshot().operationId);
  assert.equal(review.snapshot().phase, 'uncertain'); assert.equal(review.snapshot().retained, true);
  await assert.rejects(review.send(gesture, { text: 'duplicate', keep: true }), /dispatched/);
  await assert.rejects(review.discard(), /dispatched/);
});
test('empty, expired and oversized review cannot send', async () => {
  const session = sessionFixture(), review = createObservationReview({ session, request, now: () => 30000 });
  await assert.rejects(review.send(gesture, { text: 'late' }), /expired/);
  assert.throws(() => review.setCandidate(new Blob([new Uint8Array(8 * 1024 * 1024 + 1)], { type: 'audio/wav' })), /8 MiB/);
  assert.equal(session.sends.length, 0);
});

test('MediaRecorder codec parameters are normalized for the public content reference', async () => {
  const session = sessionFixture(); let mediaType;
  session.content.stage = async options => { mediaType = options.mediaType; return session.upload; };
  const review = createObservationReview({ session, request, now: () => 1000 });
  review.setCandidate(new Blob(['audio'], { type: 'audio/webm;codecs=opus' }));
  await review.send(gesture);
  assert.equal(mediaType, 'audio/webm');
});

test('imported files do not acquire a fabricated original observation timestamp', async () => {
  const session = sessionFixture(), review = createObservationReview({ session, request, now: () => 1000 });
  review.setCandidate(new Blob(['old photo'], { type: 'image/jpeg' }));
  const response = await review.send(gesture); assert.equal(response.observedAt, null);
});
