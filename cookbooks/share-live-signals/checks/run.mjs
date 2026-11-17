// Run against an explicitly supplied built PUBLIC @chronolog/signals entry.
// No database, membership history, durable outbox or finality provider is created.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { createTokenPreview } from '../snippets/token-preview.mjs';

const { values } = parseArgs({ options: { 'signals-module': { type: 'string' } } });
assert(values['signals-module'], 'Supply --signals-module /exact/built-public-signals.mjs');
const modulePath = resolve(values['signals-module']);
const { SignalChannel, generateSignalIdentity } = await import(pathToFileURL(modulePath).href);
const identities = await Promise.all([generateSignalIdentity(), generateSignalIdentity()]);
const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
const allowedAuthors = new Set(identities.map(identity => hex(identity.publicKeyBytes)));
const topics = new Set(['reading', 'preview']);
const authorize = ({ authorId, topic }) => allowedAuthors.has(hex(authorId)) && topics.has(topic);
const sender = new SignalChannel({ scope: 'live-workbench', identity: identities[0], authorize });
const receiver = new SignalChannel({ scope: 'live-workbench', identity: identities[1], authorize });
const lifetime = new AbortController();
const signal = AbortSignal.any([lifetime.signal, AbortSignal.timeout(10_000)]);
let dropNext = false, congested = false, frames = 0;
const toReceiver = { async trySend(frame, { signal }) {
  signal.throwIfAborted();
  if (congested) return false; // Refuse before dispatch; do not queue a retry.
  frames++;
  // Simulate network loss after local dispatch, so this is still a successful dispatch.
  if (dropNext) { dropNext = false; return true; }
  await receiverRoute.receive(frame);
  return true;
} };
const toSender = { async trySend(frame, { signal }) {
  signal.throwIfAborted(); frames++;
  await senderRoute.receive(frame);
  return true;
} };
let senderRoute = sender.attachRoute(toReceiver);
const receiverRoute = receiver.attachRoute(toSender);
const reading = receiver.subscribe({ topics: ['reading'], mode: 'latest', signal })[Symbol.asyncIterator]();
const chunks = receiver.subscribe({ topics: ['preview'], signal })[Symbol.asyncIterator]();
const checks = [];
try {
  // Starting iteration attaches live consumers. There is no catch-up read.
  const firstReading = reading.next();
  const firstChunk = chunks.next();
  await sender.send('reading', { source: 'thermometer', run: 'run-1', value: 20 }, { ttlMs: 3000 });
  const initial = (await firstReading).value;
  assert.equal(initial.authorId, hex(identities[0].publicKeyBytes));
  assert.equal(initial.payload.value, 20);
  await sender.send('reading', { source: 'thermometer', run: 'run-1', value: 21 });
  await sender.send('reading', { source: 'thermometer', run: 'run-1', value: 22 });
  assert.equal((await reading.next()).value.payload.value, 22);
  checks.push('replaceable live readings coalesce without durable history');

  const preview = createTokenPreview({ requestId: 'request-1' });
  await sender.send('preview', { requestId: 'request-1', index: 0, text: 'Review ' });
  preview.receive((await firstChunk).value.payload);
  await sender.send('preview', { requestId: 'request-1', index: 1, text: 'the ' });
  await sender.send('preview', { requestId: 'request-1', index: 2, text: 'evidence.' });
  preview.receive((await chunks.next()).value.payload);
  preview.receive((await chunks.next()).value.payload);
  assert.deepEqual(preview.snapshot(), { requestId: 'request-1', text: 'Review the evidence.', incomplete: false });
  checks.push('distinct preview chunks retain FIFO order for an attached consumer');

  dropNext = true;
  await sender.send('preview', { requestId: 'request-1', index: 3, text: ' Missing.' });
  await sender.send('preview', { requestId: 'request-1', index: 4, text: ' Later.' });
  preview.receive((await chunks.next()).value.payload);
  assert.equal(preview.snapshot().incomplete, true);
  checks.push('a lost preview chunk is visible as incomplete instead of a completed answer');

  await assert.rejects(sender.send('administration', { role: 'owner' }), { code: 'SIGNAL_UNAUTHORIZED' });
  checks.push('payload role claims cannot authorize a disallowed live topic');

  congested = true;
  const beforeCongestion = frames;
  await assert.rejects(sender.send('reading', { source: 'thermometer', run: 'run-1', value: 98 }), { code: 'SIGNAL_BACKPRESSURE' });
  assert.equal(frames, beforeCongestion);
  congested = false;
  const recoveredReading = reading.next();
  await sender.send('reading', { source: 'thermometer', run: 'run-1', value: 22.5 });
  assert.equal((await recoveredReading).value.payload.value, 22.5);
  assert.equal(frames, beforeCongestion + 1);
  checks.push('congestion refuses local dispatch without closing the route or retrying the discarded observation');

  senderRoute.close();
  const beforeDisconnected = frames;
  await assert.rejects(sender.send('reading', { source: 'thermometer', run: 'run-1', value: 99 }), { code: 'SIGNAL_ROUTE_UNAVAILABLE' });
  assert.equal(frames, beforeDisconnected);
  senderRoute = sender.attachRoute(toReceiver);
  const freshReading = reading.next();
  await sender.send('reading', { source: 'thermometer', run: 'run-1', value: 23 });
  assert.equal((await freshReading).value.payload.value, 23);
  assert.equal(frames, beforeDisconnected + 1);
  checks.push('reconnection sends a fresh observation with no replayed offline backlog');

  lifetime.abort();
  assert.equal((await reading.next()).done, true);
  assert.equal((await chunks.next()).done, true);
  preview.clear();
  checks.push('ending the live session disposes consumers and clears transient state');
} finally {
  lifetime.abort(); senderRoute.close(); receiverRoute.close(); sender.close(); receiver.close();
}
console.log(JSON.stringify({ format: 'standalone-live-signals/v1', passed: true,
  publicModuleSha256: createHash('sha256').update(await readFile(modulePath)).digest('hex'), checks,
  boundary: 'Actual public SignalChannel with two signing identities and an in-process frame transport; no database or finality service.',
  limits: ['This check does not qualify a network transport, confidentiality, browser lifecycle or deployed authorization provider.'],
}, null, 2));
