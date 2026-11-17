import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { openNativeSqlSession } from '@chronolog/peer-session/sql-native';
import { definition } from './task-definition.mjs';

// A narrow continuation of run-2, using only public cached reopen/inspection.
// The original coordinator's independent store supplies an additional copy
// of its original signed attempt; no device store is read directly or reset.
const runtime = resolve(process.env.TASK_RUNTIME_DIR ?? './runtime/run-1');
const raw = await readFile(process.env.TASK_PRIOR_EVIDENCE ?? './evidence/run-2.jsonl', 'utf8');
const prior = raw.trim().split('\n').map(line => JSON.parse(line));
const find = event => prior.find(entry => entry.event === event);
const applicationId = find('run.started').applicationId;
const identities = find('devices.resumed.setup').devices;
const foreign = find('abandoned.foreign.operation.inspected');
const reapplication = find('abandoned.foreign.operation.reapplied');
const sessions = new Set();
let fetchCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchCalls += 1; throw new Error('This cached-reopen proof must not use the network'); };
function log(event, data) { process.stdout.write(`${JSON.stringify({ at: new Date().toISOString(), event, ...data })}\n`); }
function jsonFingerprint(value) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
async function open(name) {
  const device = await openNativeDevice({ path: resolve(runtime, `${name}-device.sqlite`) });
  assert.equal(device.identity.publicKey, identities[name].publicKey);
  assert.equal(device.storageId, identities[name].storageId);
  const session = await openNativeSqlSession({ device, definition, applicationId, databasePath: resolve(runtime, `${name}-application.sqlite`) });
  sessions.add(session);
  return { device, session };
}

try {
  const alice = await open('alice');
  const bob = await open('bob');
  const original = await alice.session.operations.inspect('alice-complete-in-abandoned-suffix');
  const retained = await bob.session.operations.inspect('alice-complete-in-abandoned-suffix', { author: identities.alice.publicKey });
  assert.equal(original.attempt.id, foreign.state.attemptId);
  assert.equal(retained.attempt.id, foreign.state.attemptId);
  assert.deepEqual(retained.attempt, original.attempt);
  assert.equal(retained.attempt.payload.header.author, identities.alice.publicKey);
  assert.equal(retained.state.status, 'abandoned');
  assert.equal(original.state.status, 'applied');
  const reapplied = await bob.session.operations.inspect('bob-deliberate-reapply');
  assert.equal(reapplied.attempt.id, reapplication.result.attemptId);
  assert.equal(reapplied.attempt.payload.header.author, identities.bob.publicKey);
  assert.equal(reapplied.attempt.payload.header.reapplyOf, retained.attempt.id);
  const tasks = await bob.session.query('tasks', null);
  assert.deepEqual(tasks.value, reapplication.finalTasks.value);

  // JSON property enumeration is not signed-attempt identity. A reordered
  // object has exactly the same content yet a different JSON.stringify hash.
  const reordered = Object.fromEntries(Object.entries(retained.attempt).reverse());
  assert.deepEqual(reordered, retained.attempt);
  assert.notEqual(jsonFingerprint(reordered), jsonFingerprint(retained.attempt));
  log('reopen.original.signed.content.verified', {
    originalAuthor: identities.alice.publicKey,
    survivingAuthor: identities.bob.publicKey,
    originalStoreStatus: original.state.status,
    survivingStoreStatus: retained.state.status,
    recordedOriginalAttemptId: foreign.state.attemptId,
    originalStoreAttemptId: original.attempt.id,
    survivingStoreAttemptId: retained.attempt.id,
    fullSignedAttemptDeepEquality: true,
    recordedJsonFingerprint: foreign.retainedAttemptFingerprint,
    reopenedJsonFingerprint: jsonFingerprint(retained.attempt),
    reorderedSameContentFingerprint: jsonFingerprint(reordered),
    newAttempt: reapplied.state,
    reapplyOf: reapplied.attempt.payload.header.reapplyOf,
    tasks,
  });

  await bob.session.close();
  sessions.delete(bob.session);
  const bobAgain = await open('bob');
  const reopenedAttempt = await bobAgain.session.operations.inspect('alice-complete-in-abandoned-suffix', { author: identities.alice.publicKey });
  assert.deepEqual(reopenedAttempt.attempt, retained.attempt);
  assert.deepEqual((await bobAgain.session.query('tasks', null)).value, tasks.value);
  assert.equal(fetchCalls, 0);
  log('reopen.continuation.passed', {
    identityPreserved: bobAgain.device.identity.publicKey === identities.bob.publicKey,
    storageIdentityPreserved: bobAgain.device.storageId === identities.bob.storageId,
    originalSignedAttemptPreserved: true,
    foreignReapplicationPreserved: true,
    fetchCalls,
  });
} catch (error) {
  log('reopen.continuation.failed', { error: { name: error.name, message: error.message, stack: error.stack } });
  process.exitCode = 1;
} finally {
  globalThis.fetch = originalFetch;
  for (const session of sessions) await session.close();
}
