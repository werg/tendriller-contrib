// Independent public-package acceptance: selected views and durable external facts.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { MessageChannel, Worker } from 'node:worker_threads';
import {
  ApplicationProjection, ApplicationEffectWorker, ApplicationEffectUncertainError,
  applicationDefinitionDigest, bytesDigest, connectApplications, controlParticipantGrant,
  createGenerationRegistry, participantGrant, peerDigest, signApplicationDescriptor,
  signControlRevision, signTransitionRequest,
} from '@chronolog/peer-session';
import { NativeBytesStore, openNativeDevice } from '@chronolog/peer-session/native';
import { openNativeSqlApplication, prepareNativeSqlApplication } from '@chronolog/peer-session/sql-native';
import { connectApplicationWorker } from '@chronolog/peer-session/browser';
import { notifications, initialNotes, reduceNotes } from './peer-generation-workers-definition.mjs';
import { createEffectProvider } from './peer-generation-effect-provider.mjs';
import { exerciseTimers } from './peer-generation-workers-timers.mjs';

const path = resolve(process.argv[2]), report = JSON.parse(await readFile(path, 'utf8'));
const directory = join(dirname(path), 'stores'), resources = [], links = [];
const timeout = () => AbortSignal.timeout(15_000);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const noteIds = checkpoint => checkpoint.state.notes.map(value => value.noteId);
const post = async (session, command, input, operationId) => {
  const operation = await session.command(command, input, { operationId });
  assert.equal((await operation.applied({ signal: timeout() })).outcome, 'accepted');
  return operation;
};
const stage = async name => { report.stage = name; await writeFile(path, `${JSON.stringify(report, null, 2)}\n`); console.log(`Application workers: ${name}`); };
const drain = async worker => {
  for (let count = 0; count < 64; count++) { const turn = await worker.processNext({ signal: timeout() }); if (!turn.hasMore) return turn; }
  throw Error('INDEPENDENT_EFFECT_DRAIN_LIMIT');
};

try {
  const host = await openNativeDevice({ path: join(directory, 'host.sqlite'), create: true });
  const [author, survivor] = await Promise.all(['author', 'survivor'].map(name => openNativeDevice({ path: join(directory, `${name}.sqlite`), create: true })));
  resources.push(host, author, survivor);
  const applicationId = randomBytes(32).toString('hex'), epochKey = new Uint8Array(randomBytes(32));
  const prepared = await prepareNativeSqlApplication({ applicationId, definition: notifications, schemaAdministrator: host.identity });
  assert.deepEqual(Object.keys(prepared).sort(), ['definition', 'executionManifestDigest', 'schema', 'schemaAdministrator']);
  const descriptor = await signApplicationDescriptor({ applicationId, historyId: 'independent-application-workers',
    profile: 'peer-generation-v1', policy: 'eligible-members-v1', controlPublicKey: host.identity.publicKey,
    executionManifestDigest: prepared.executionManifestDigest, schemaAdministrator: prepared.schemaAdministrator,
    definitionDigest: await applicationDefinitionDigest(notifications), schemaDigest: await peerDigest(prepared.schema) }, host.identity);
  const control = await signControlRevision({ applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
    revision: 0, previous: null, epoch: 0, keyDigest: await bytesDigest(epochKey), recoveryFloor: null,
    grants: [controlParticipantGrant(host.identity.publicKey), ...[author, survivor].map(device => participantGrant(device.identity.publicKey, { dataRole: 'member', administrator: true }))] }, host.identity);
  const registry = await createGenerationRegistry({ store: host.store, descriptor, controls: [control], signer: host.identity });
  const select = async (device, expectedGeneration, base, transitionId) => registry.select(await signTransitionRequest({
    applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
    requester: device.identity.publicKey, coordinator: device.identity.publicKey,
    expectedGeneration, controlRevision: 0, base, transitionId, reason: expectedGeneration === null ? 'create' : 'takeover',
  }, device.identity));
  const initial = await select(author, null, null, 'workers-create');
  const open = async (device, name, create = false) => {
    const session = await openNativeSqlApplication({ device, databasePath: join(directory, `${name}-sql.sqlite`),
      definition: notifications, schema: prepared.schema, authority: await registry.read(),
      ...(create ? { epochKeys: new Map([[0, epochKey]]) } : {}) });
    resources.push(session); return session;
  };
  let a = await open(author, 'author', true), b = await open(survivor, 'survivor', true);
  let link = await connectApplications(a, b); links.push(link);
  report.executionManifestDigest = descriptor.payload.executionManifestDigest;

  let journal = new NativeBytesStore(join(directory, 'consumers.sqlite')); resources.push(journal);
  let reductions = 0;
  const projectionOptions = session => ({ id: 'visible-notes', version: '1', session, store: journal, topics: ['notes'],
    initial: initialNotes, reduce(state, event) { reductions++; return reduceNotes(state, event); } });
  let projection = await ApplicationProjection.open(projectionOptions(a)); resources.push(projection);
  await assert.rejects(ApplicationProjection.open(projectionOptions(a)), /APPLICATION_CONSUMER_IN_USE/u);
  await post(a, 'recordNote', { noteId: 'retained', text: 'This note survives the selected prefix.' }, 'retained-note');
  const first = await projection.catchUp({ signal: timeout() });
  assert.deepEqual(noteIds(first), ['retained']); assert.equal(first.reset, false);
  const callsBefore = reductions;
  assert.deepEqual((await projection.catchUp({ signal: timeout() })).state, first.state);
  assert.equal(reductions, callsBefore, 'A same-generation checkpoint must not replay its old events');

  let provider = await createEffectProvider(join(directory, 'provider')); resources.push(provider);
  const effectOptions = session => ({ id: 'notification-delivery', version: '1', session, store: journal,
    topics: ['notifications'], intentKey: event => event.payload.intentId,
    authorize: ({ event }) => event.author === author.identity.publicKey && event.payload.type === 'notification.requested',
    dispatch: context => provider.dispatch(context), recovery: 'reconcile', reconcile: context => provider.reconcile(context), timeoutMs: 10_000,
    publishResult: (entry, { operationId, reapplyOf }) => {
      const input = { effectId: entry.effectId, receipt: entry.result.receipt };
      return reapplyOf === null ? session.command('recordNotificationResult', input, { operationId })
        : session.reapply(reapplyOf, 'recordNotificationResult', input, { operationId });
    },
  });
  let effects = await ApplicationEffectWorker.open(effectOptions(a)); resources.push(effects);
  await post(b, 'requestNotification', { intentId: 'spoofed-author', message: 'No provider call is authorized.', requestedByLabel: author.identity.publicKey }, 'spoofed-author');
  await link.synchronize(); await drain(effects);
  const denied = (await effects.inspect()).find(value => value.intentKey === 'spoofed-author');
  assert.equal(denied.stage, 'denied'); assert.equal(denied.reason, 'unauthorized');
  assert.equal(denied.event.author, survivor.identity.publicKey); assert.equal(provider.snapshot().effects.length, 0);
  const retained = await b.recoveryPoint();
  await link.close();

  await post(a, 'recordNote', { noteId: 'excluded', text: 'This note is outside the recovered prefix.' }, 'excluded-note');
  const prior = await projection.catchUp({ signal: timeout() });
  assert.deepEqual(noteIds(prior), ['retained', 'excluded']); assert.equal(prior.reset, false);
  assert.equal(reductions, callsBefore + 1);
  const held = await a.readView(); resources.push({ close: () => held.release() });
  const heldEvents = held.readEvents({ topics: ['notes'] });
  const completedInput = { intentId: 'completed-intent', message: 'One synthetic provider effect.', requestedByLabel: 'Application member' };
  await post(a, 'requestNotification', completedInput, 'completed-request');
  await drain(effects);
  const completed = (await effects.inspect()).find(value => value.intentKey === completedInput.intentId);
  assert.equal(completed.stage, 'completed'); assert.equal(completed.publications[0].status, 'applied');
  provider.loseNextReply();
  await post(a, 'requestNotification', { intentId: 'uncertain-intent', message: 'Committed but its response is lost.', requestedByLabel: 'Application member' }, 'uncertain-request');
  await assert.rejects(drain(effects), error => error instanceof ApplicationEffectUncertainError);
  const uncertain = (await effects.inspect()).find(value => value.intentKey === 'uncertain-intent');
  assert.equal(uncertain.stage, 'dispatching');
  const externalBefore = provider.snapshot();
  assert.equal(externalBefore.effects.length, 2); assert.equal(externalBefore.requests.filter(value => value.method === 'POST').length, 2);
  assert.equal(externalBefore.requests.at(-1).replyLost, true);
  await assert.rejects(effects.retry(uncertain.effectId, { signal: timeout() }), error => error instanceof ApplicationEffectUncertainError);
  assert.deepEqual(provider.snapshot(), externalBefore, 'An uncertain non-idempotent retry must not call the provider');
  const oldHead = await a.recoveryPoint();
  await stage('completed one external effect and lost a second committed reply');

  await effects.close(); await projection.close(); journal.close(); await provider.close();
  const successor = await select(survivor, initial.id, retained, 'workers-recovery');
  const authority = await registry.read();
  await Promise.all([a.adopt(authority), b.adopt(authority)]);
  link = await connectApplications(a, b); links.push(link); await link.synchronize();
  assert.deepEqual(held.readEvents({ topics: ['notes'] }), heldEvents, 'A held view must remain coherent across recovery');
  await held.release();
  const current = await a.readView();
  try { await assert.rejects(async () => current.readEvents({ topics: ['notes'], cursor: prior.cursor }), error => error.name === 'RecoveredViewError'); }
  finally { await current.release(); }
  journal = new NativeBytesStore(join(directory, 'consumers.sqlite')); resources.push(journal);
  projection = await ApplicationProjection.open(projectionOptions(a)); resources.push(projection);
  assert.deepEqual((await projection.inspect()).state, prior.state, 'Reopen must retain the prior complete checkpoint until replacement commits');
  const recovered = await projection.catchUp({ signal: timeout() });
  assert.equal(recovered.reset, true); assert.deepEqual(noteIds(recovered), ['retained']);
  assert.deepEqual(recovered.state, (await a.query('notes', {})).value);
  provider = await createEffectProvider(join(directory, 'provider')); resources.push(provider);
  effects = await ApplicationEffectWorker.open(effectOptions(a)); resources.push(effects);
  assert.equal((await effects.inspect(completed.effectId)).stage, 'completed');
  assert.equal((await effects.inspect(uncertain.effectId)).stage, 'dispatching');
  await drain(effects);
  assert.equal((await effects.inspect(completed.effectId)).publications[0].status, 'abandoned');
  assert.equal(provider.snapshot().requests.length, 0);
  const reconciled = await effects.reconcile(uncertain.effectId, { signal: timeout() });
  assert.equal(reconciled.stage, 'completed');
  assert.equal(provider.snapshot().requests.length, 1); assert.equal(provider.snapshot().requests[0].method, 'GET');
  await effects.republish(completed.effectId, { operationId: 'reviewed-result', signal: timeout() });
  const restored = await effects.inspect(completed.effectId);
  assert.equal(restored.publications.at(-1).reapplyOf, completed.publications[0].operationId);
  assert.equal(restored.publications.at(-1).status, 'applied');
  const reapply = await a.reapply('completed-request', 'requestNotification', completedInput, { operationId: 'reviewed-request', basedOn: a.revision });
  assert.equal((await reapply.applied({ signal: timeout() })).outcome, 'accepted');
  await drain(effects);
  const matching = await effects.inspect(completed.effectId);
  assert.equal(matching.observedEvents.length, 2);
  assert.notEqual(matching.observedEvents[0].attemptId, matching.observedEvents[1].attemptId);
  assert.equal(provider.snapshot().requests.filter(value => value.method === 'POST').length, 0);
  assert.deepEqual(provider.snapshot().effects, externalBefore.effects);
  report.projection = { initial: first, beforeRecovery: prior, recovered,
    sameGenerationIncremental: true, duplicateOwnerRefused: true, staleCursorRefused: true, heldViewPreserved: true };
  report.effects = { denied, completed, uncertain, reconciled, restored, matching,
    externalBefore, externalAfter: provider.snapshot(), uncertainRetryRefused: true, journalReopened: true };
  report.recovery = { previousGeneration: initial.id, selectedGeneration: successor.id,
    previousHead: oldHead.point.sequence, adoptedPosition: retained.point.sequence };
  await stage('recovered views and reconciled retained external facts');

  // Timer acceptance is composed below with the same SQL/session ownership.
  let currentGeneration = successor;
  await exerciseTimers({ a, b, journal, resources, post, report, timeout, effects, provider, drain,
    synchronize: () => link.synchronize(),
    recover: async (base, transitionId) => {
      const previous = currentGeneration, previousHead = await a.recoveryPoint();
      await link.close(); currentGeneration = await select(survivor, previous.id, base, transitionId);
      const authority = await registry.read();
      await Promise.all([a.adopt(authority), b.adopt(authority)]);
      link = await connectApplications(a, b); links.push(link); await link.synchronize();
      return { previousGeneration: previous.id, selectedGeneration: currentGeneration.id,
        previousHead: previousHead.point.sequence, adoptedPosition: base.point.sequence };
    },
  });

  await effects.close(); await projection.close();
  const beforeWorker = (await a.query('notes', {})).value;
  await link.synchronize(); await link.close();
  // The survivor is current coordinator. Close its owner before transferring its
  // exact store to a real Worker; no duplicated signer or ad-hoc application RPC.
  await b.close();
  const channel = new MessageChannel();
  const worker = new Worker(new URL('./peer-generation-workers-owner.mjs', import.meta.url), { workerData: {
    port: channel.port2, path: join(directory, 'survivor.sqlite'), databasePath: join(directory, 'survivor-sql.sqlite'),
    authority: await registry.read(), schema: prepared.schema,
  }, transferList: [channel.port2] });
  resources.push({ close: async () => { channel.port1.close(); await worker.terminate(); } });
  const facade = await Promise.race([connectApplicationWorker(channel.port1, { timeoutMs: 15_000 }),
    new Promise((_, reject) => worker.once('error', reject))]); resources.push(facade);
  assert.equal(facade.deviceId, survivor.identity.publicKey);
  const workerProjection = await ApplicationProjection.open({ ...projectionOptions(facade), id: 'worker-notes' }); resources.push(workerProjection);
  const workerInitial = await workerProjection.catchUp({ signal: timeout() });
  assert.deepEqual(workerInitial.state, beforeWorker);
  const workerBase = await facade.recoveryPoint();
  const following = workerProjection.follow({ signal: timeout() })[Symbol.asyncIterator]();
  await following.next();
  await post(facade, 'recordNote', { noteId: 'worker-note', text: 'The maintained Worker facade observes this note.' }, 'worker-note');
  let changed;
  for (let count = 0; count < 16; count++) {
    const next = await following.next(); assert.equal(next.done, false); changed = next.value;
    if (noteIds(changed).includes('worker-note')) break;
  }
  assert.ok(noteIds(changed).includes('worker-note'));
  const third = await select(survivor, currentGeneration.id, workerBase, 'workers-facade-recovery');
  await facade.adopt(await registry.read());
  let workerReset;
  for (let count = 0; count < 16; count++) {
    const next = await following.next(); assert.equal(next.done, false); workerReset = next.value;
    if (workerReset.revision.generation === third.id) break;
  }
  assert.equal(workerReset.reset, true); assert.deepEqual(workerReset.state, beforeWorker);
  await following.return();
  await workerProjection.close(); await facade.close(); channel.port1.close(); await worker.terminate();
  const reopened = await open(await openNativeDevice({ path: join(directory, 'survivor.sqlite') }), 'survivor');
  const reopenedProjection = await ApplicationProjection.open({ ...projectionOptions(reopened), id: 'worker-notes' }); resources.push(reopenedProjection);
  const afterWorker = await reopenedProjection.catchUp({ signal: timeout() });
  assert.deepEqual(afterWorker.state, workerReset.state); assert.equal(afterWorker.reset, false);
  report.worker = { actualThread: true, publicFacade: true, identityBefore: facade.deviceId, identityAfter: reopened.deviceId,
    initialDigest: hash(workerInitial.state), changedDigest: hash(changed.state), recoveredDigest: hash(workerReset.state), reopenedDigest: hash(afterWorker.state),
    resetGeneration: third.id, resetObserved: workerReset.reset, followStopped: true, ownerClosedBeforeReopen: true };
  report.passed = true; report.stage = 'passed';
} catch (error) {
  report.passed = false; report.error = error instanceof Error ? error.stack ?? error.message : String(error); throw error;
} finally {
  await Promise.allSettled(links.map(link => link.close()));
  for (const resource of resources.reverse()) { try { await resource.close(); } catch { /* The original acceptance failure is retained. */ } }
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
}
