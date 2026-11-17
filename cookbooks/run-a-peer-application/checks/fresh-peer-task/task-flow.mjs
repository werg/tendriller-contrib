import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  connectApplications,
  RecoveredViewError,
} from '@chronolog/peer-session';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { openNativeSqlSession } from '@chronolog/peer-session/sql-native';
import { createPeerGenerationApplicationBackend } from '@chronolog/peer-session/tendriller';
import { createClient } from '@tendriller/core';
import { definition } from './task-definition.mjs';

const studyStart = Date.parse('2026-11-17T13:38:19Z');
const runStart = Date.now();
const runtime = resolve(process.env.TASK_RUNTIME_DIR ?? './runtime');
const resumeSetup = process.env.TASK_RESUME_SETUP === '1';
const supplied = process.env.TASK_HOST_CONFIG
  ? JSON.parse(await readFile(process.env.TASK_HOST_CONFIG, 'utf8')) : {};
const api = process.env.TENDRILLER_API ?? supplied.api;
const token = process.env.TENDRILLER_TOKEN ?? supplied.token;
const applicationId = process.env.TENDRILLER_APPLICATION_ID ?? supplied.applicationId;
assert(api && token && applicationId,
  'Set TENDRILLER_API, TENDRILLER_TOKEN, TENDRILLER_APPLICATION_ID, or TASK_HOST_CONFIG');

const observations = [];
function log(event, data = {}) {
  const entry = { at: new Date().toISOString(), elapsedMs: Date.now() - runStart, event, ...data };
  observations.push(entry);
  process.stdout.write(`${JSON.stringify(entry, (_, value) => typeof value === 'bigint' ? value.toString() : value)}\n`);
}
function errorRecord(error) {
  return {
    name: error?.name, message: error?.message, code: error?.code, stack: error?.stack,
    ...(error?.cause ? { cause: errorRecord(error.cause) } : {}),
  };
}
function fingerprint(attempt) {
  return createHash('sha256').update(JSON.stringify(attempt)).digest('hex');
}
function records(result) {
  return result.value.rows.map(row => Object.fromEntries(result.value.columns.map((column, i) => [column.name, row[i]])));
}
async function eventually(check, message) {
  const until = Date.now() + 10000;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise(done => setTimeout(done, 20));
  }
  throw new Error(message);
}
const requests = [];
const client = createClient({ api, token }, {
  fetch: async (url, options) => {
    const response = await fetch(url, options);
    requests.push({ method: options?.method ?? 'GET', path: new URL(url).pathname, status: response.status });
    return response;
  },
});
const sessions = new Set();
const links = new Set();
const devices = new Map();
async function openDevice(name, create) {
  const device = await openNativeDevice({ path: resolve(runtime, `${name}-device.sqlite`), ...(create ? { create: true } : {}) });
  devices.set(name, device);
  return device;
}
async function openSession(name, device, extra = {}) {
  const session = await openNativeSqlSession({
    device, definition, applicationId,
    databasePath: resolve(runtime, `${name}-application.sqlite`),
    ...extra,
  });
  sessions.add(session);
  return session;
}
async function connect(a, b) {
  const link = await connectApplications(a, b);
  links.add(link);
  return link;
}
function disconnect(link) { link.close(); links.delete(link); }
async function retire(session) { await session.close(); sessions.delete(session); }
async function command(session, name, input, operationId) {
  const before = await session.query('tasks', null);
  const operation = await session.command(name, input, { operationId, basedOn: before.revision });
  const result = await operation.applied({ signal: AbortSignal.timeout(10000) });
  log('command.applied', { device: session.deviceId, name, operationId, result });
  return { operation, result };
}

await mkdir(runtime, { recursive: true });
try {
  log('run.started', {
    api, applicationId, node: process.version,
    transport: 'connectApplications: local independent native stores',
    replyLossScope: 'cancelled application result observation; no wire-loss claim',
  });
  const aliceDevice = await openDevice('alice', !resumeSetup);
  const bobDevice = await openDevice('bob', !resumeSetup);
  const carolDevice = await openDevice('carol', !resumeSetup);
  const originalIdentities = Object.fromEntries([...devices].map(([name, device]) => [name, { publicKey: device.identity.publicKey, storageId: device.storageId }]));
  log(resumeSetup ? 'devices.resumed.setup' : 'devices.created', { devices: originalIdentities });
  const alice = await openSession('alice', aliceDevice, {
    host: client.peers,
    create: { members: [aliceDevice, bobDevice, carolDevice].map(device => ({ publicKey: device.identity.publicKey })) },
  });
  const bob = await openSession('bob', bobDevice, { host: client.peers });
  const carol = await openSession('carol', carolDevice, { host: client.peers });
  log('members.enrolled', { alice: alice.status, bob: bob.status, carol: carol.status });
  let aliceBob = await connect(alice, bob);
  let aliceCarol = await connect(alice, carol);
  assert.equal(bob.status.phase, 'ready');
  assert.equal(carol.status.phase, 'ready');
  const publication = await client.peers.definition();
  const directory = await client.peers.discover();
  log('application.discovered', {
    directory,
    definition: publication.definition,
    localDescription: alice.describe(),
    initialQuery: await alice.query('tasks', null),
  });

  const first = await command(alice, 'createTask', { id: 'launch-checklist', title: 'Review the launch checklist' }, 'create-launch-checklist');
  assert.equal(first.result.outcome, 'accepted');
  log('first.useful.command', { studyElapsedMs: Date.now() - studyStart, runElapsedMs: Date.now() - runStart });
  await aliceBob.synchronize();
  await aliceCarol.synchronize();

  const guarded = await command(bob, 'completeTask', { id: 'launch-checklist', expectedVersion: 2 }, 'reject-stale-task-version');
  assert.equal(guarded.result.outcome, 'rejected');
  assert.equal(guarded.result.rejectionCode, 'assert:task_not_open_at_version');
  assert.equal(records(await bob.query('tasks', null))[0].state, 'open');
  const guardedEvents = (await bob.query('taskEvents', null)).value.events;
  assert.equal(guardedEvents.filter(event => event.topic === 'task.completed').length, 0);
  log('guard.atomic.rejection', { result: guarded.result, tasks: await bob.query('tasks', null), eventCount: guardedEvents.length });

  // This intentionally loses the caller's result observation, not a network frame.
  disconnect(aliceBob);
  const beforeLoss = await bob.query('tasks', null);
  const lost = await bob.command('createTask', { id: 'reply-observation', title: 'Check exact retry after a lost observation' }, {
    operationId: 'create-reply-observation', basedOn: beforeLoss.revision,
  });
  const saved = await bob.operations.inspect(lost.operationId);
  assert.equal(saved.state.status, 'saved');
  const cancelled = new AbortController();
  const ignoredWait = lost.applied({ signal: cancelled.signal }).then(
    () => ({ unexpectedlyCompleted: true }), error => ({ cancelled: true, error: errorRecord(error) }),
  );
  cancelled.abort(new Error('Deliberately discarded caller observation'));
  const cancellation = await ignoredWait;
  assert.equal(cancellation.cancelled, true);
  aliceBob = await connect(alice, bob);
  await eventually(async () => records(await alice.query('tasks', null)).some(task => task.id === 'reply-observation'), 'Coordinator did not apply the saved command');
  // The caller now explicitly retries its durable operation instead of creating new intent.
  await lost.retry();
  const retried = await lost.applied({ signal: AbortSignal.timeout(10000) });
  const inspectedRetry = await bob.operations.inspect(lost.operationId);
  assert.equal(fingerprint(saved.attempt), fingerprint(inspectedRetry.attempt));
  assert.equal(retried.outcome, 'accepted');
  await aliceBob.synchronize();
  const retryEvents = (await bob.query('taskEvents', null)).value.events;
  assert.equal(retryEvents.filter(event => event.operationId === lost.operationId).length, 1);
  log('lost.observation.exact.retry', {
    cancellation,
    savedState: saved.state,
    result: retried,
    attemptFingerprintBefore: fingerprint(saved.attempt),
    attemptFingerprintAfter: fingerprint(inspectedRetry.attempt),
    eventCopies: retryEvents.filter(event => event.operationId === lost.operationId).length,
  });

  await aliceCarol.synchronize();
  const carolPrefix = await carol.recoveryPoint();
  log('recovery.prefix.retained', { candidate: carol.deviceId, prefix: carolPrefix.point });
  disconnect(aliceCarol);
  const suffix = await command(alice, 'completeTask', { id: 'launch-checklist', expectedVersion: 1 }, 'alice-complete-in-abandoned-suffix');
  assert.equal(suffix.result.outcome, 'accepted');
  await aliceBob.synchronize();
  const bobBeforeRecovery = await bob.query('taskEvents', null);
  assert.equal(records(await bob.query('tasks', null)).find(task => task.id === 'launch-checklist').state, 'done');
  const originalAttempt = await bob.operations.inspect(suffix.operation.operationId, { author: alice.deviceId });
  assert.equal(originalAttempt.attempt.payload.header.author, alice.deviceId);
  disconnect(aliceBob);
  await retire(alice);
  log('original.coordinator.closed', { device: originalIdentities.alice.publicKey });

  const bobRecoveries = [];
  bob.onRecovery(notice => { bobRecoveries.push(notice); log('bob.recovery.notice', { notice }); });
  const selected = await carol.recovery.takeover(client.peers, { transitionId: 'carol-selected-prefix-takeover' });
  assert.equal(selected.unknownLoss, true);
  assert.deepEqual(selected.adopted, carolPrefix.point);
  await bob.adopt(await client.peers.application());
  const bobCarol = await connect(bob, carol);
  await bobCarol.synchronize();
  assert.equal(bobRecoveries.length, 1);
  assert.equal(bobRecoveries[0].unknownLoss, true);
  const recovered = await bob.query('tasks', null);
  assert.equal(records(recovered).find(task => task.id === 'launch-checklist').state, 'open');
  const recoveredView = await bob.readView();
  let staleCursorError;
  try {
    recoveredView.readEvents({ cursor: bobBeforeRecovery.value.cursor });
  } catch (error) {
    staleCursorError = error;
  } finally { recoveredView.release(); }
  assert(staleCursorError instanceof RecoveredViewError);
  log('recovery.coherent.reread', { selected, recovered, staleCursor: errorRecord(staleCursorError) });

  const abandoned = await bob.operations.inspect(suffix.operation.operationId, { author: originalIdentities.alice.publicKey });
  assert(['abandoned', 'needsReapply'].includes(abandoned.state.status));
  assert.equal(fingerprint(abandoned.attempt), fingerprint(originalAttempt.attempt));
  log('abandoned.foreign.operation.inspected', {
    state: abandoned.state,
    author: abandoned.attempt.payload.header.author,
    retainedAttemptFingerprint: fingerprint(abandoned.attempt),
  });
  const reapplied = await bob.reapply(suffix.operation.operationId, 'completeTask', { id: 'launch-checklist', expectedVersion: 1 }, {
    operationId: 'bob-deliberate-reapply', originalAuthor: originalIdentities.alice.publicKey, basedOn: recovered.revision,
  });
  const reappliedResult = await reapplied.applied({ signal: AbortSignal.timeout(10000) });
  assert.equal(reappliedResult.outcome, 'accepted');
  const inspectedReapply = await bob.operations.inspect(reapplied.operationId);
  assert.equal(inspectedReapply.attempt.payload.header.author, originalIdentities.bob.publicKey);
  assert.equal(inspectedReapply.attempt.payload.header.reapplyOf, abandoned.attempt.id);
  await bobCarol.synchronize();
  const finalTasks = await bob.query('tasks', null);
  assert.equal(records(finalTasks).find(task => task.id === 'launch-checklist').state, 'done');
  const finalEvents = (await bob.query('taskEvents', null)).value.events;
  assert.equal(finalEvents.filter(event => event.topic === 'task.completed').length, 1);
  assert.equal(finalEvents.filter(event => event.operationId === suffix.operation.operationId).length, 0);
  log('abandoned.foreign.operation.reapplied', {
    result: reappliedResult,
    newAuthor: inspectedReapply.attempt.payload.header.author,
    reapplyOf: inspectedReapply.attempt.payload.header.reapplyOf,
    finalTasks,
    selectedCompletionEvents: finalEvents.filter(event => event.topic === 'task.completed'),
  });

  const backend = createPeerGenerationApplicationBackend({ id: applicationId, session: bob, sql: true });
  const backendView = await backend.readView({ view: 'applied' });
  try {
    log('tendriller.backend.coherent.query', {
      profile: backend.profile, capabilities: backend.capabilities,
      revision: backendView.revision,
      rows: await backendView.query('SELECT id, title, state, version FROM tasks ORDER BY id'),
    });
  } finally { await backendView.release(); }

  disconnect(bobCarol);
  await retire(bob);
  await retire(carol);
  const requestsBeforeReopen = requests.length;
  const resumedBobDevice = await openDevice('bob', false);
  assert.equal(resumedBobDevice.identity.publicKey, originalIdentities.bob.publicKey);
  assert.equal(resumedBobDevice.storageId, originalIdentities.bob.storageId);
  const resumedBob = await openSession('bob', resumedBobDevice);
  const resumedTasks = await resumedBob.query('tasks', null);
  assert.deepEqual(records(resumedTasks), records(finalTasks));
  const resumedOperation = await resumedBob.operations.inspect('bob-deliberate-reapply');
  assert.equal(resumedOperation.attempt.id, inspectedReapply.attempt.id);
  const resumedAbandoned = await resumedBob.operations.inspect(suffix.operation.operationId, { author: originalIdentities.alice.publicKey });
  assert.equal(fingerprint(resumedAbandoned.attempt), fingerprint(abandoned.attempt));
  assert.equal(requests.length, requestsBeforeReopen);
  log('device.resumed.without.replacement', {
    publicKey: resumedBobDevice.identity.publicKey,
    storageId: resumedBobDevice.storageId,
    requestsDuringReopen: requests.length - requestsBeforeReopen,
    tasks: resumedTasks,
    reappliedOperation: resumedOperation.state,
    abandonedOperation: resumedAbandoned.state,
  });
  log('study.passed', { hostedRequests: requests, totalRunMs: Date.now() - runStart, observationCount: observations.length });
} catch (error) {
  log('study.failed', { error: errorRecord(error), hostedRequests: requests });
  process.exitCode = 1;
} finally {
  for (const link of links) { try { link.close(); } catch {} }
  for (const session of sessions) { try { await session.close(); } catch (error) { log('cleanup.failed', { error: errorRecord(error) }); } }
  for (const device of devices.values()) { try { await device.close(); } catch {} }
}
