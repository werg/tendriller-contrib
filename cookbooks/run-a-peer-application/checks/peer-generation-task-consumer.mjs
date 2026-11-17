// The cookbook's real guarded SQL domain, imported only from an installed archive.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { applicationDefinitionDigest, bytesDigest, connectApplications, controlParticipantGrant, createGenerationRegistry,
  participantGrant, peerDigest, signApplicationDescriptor, signControlRevision, signTransitionRequest } from '@chronolog/peer-session';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { openNativeSqlApplication, prepareNativeSqlApplication } from '@chronolog/peer-session/sql-native';
import { taskBoard } from './peer-generation-task-definition.mjs';

const path = resolve(process.argv[2]), report = JSON.parse(await readFile(path, 'utf8'));
const directory = join(dirname(path), 'stores'), resources = [], links = [];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const applied = async (session, command, input, operationId) =>
  (await session.command(command, input, { operationId })).applied({ signal: AbortSignal.timeout(15_000) });

try {
  const host = await openNativeDevice({ path: join(directory, 'host.sqlite'), create: true });
  const devices = await Promise.all(['creator', 'member'].map(name => openNativeDevice({ path: join(directory, `${name}.sqlite`), create: true })));
  resources.push(host, ...devices);
  const applicationId = randomBytes(32).toString('hex'), epochKey = new Uint8Array(randomBytes(32));
  const prepared = await prepareNativeSqlApplication({ applicationId, definition: taskBoard, schemaAdministrator: devices[0].identity });
  const descriptor = await signApplicationDescriptor({ applicationId, historyId: 'independent-guarded-tasks',
    profile: 'peer-generation-v1', policy: 'eligible-members-v1', controlPublicKey: host.identity.publicKey,
    executionManifestDigest: prepared.executionManifestDigest, schemaAdministrator: prepared.schemaAdministrator,
    definitionDigest: await applicationDefinitionDigest(taskBoard), schemaDigest: await peerDigest(prepared.schema) }, host.identity);
  const control = await signControlRevision({ applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
    revision: 0, previous: null, epoch: 0, keyDigest: await bytesDigest(epochKey), recoveryFloor: null,
    grants: [controlParticipantGrant(host.identity.publicKey), ...devices.map(device => participantGrant(device.identity.publicKey, { dataRole: 'member', administrator: true }))] }, host.identity);
  const registry = await createGenerationRegistry({ store: host.store, descriptor, controls: [control], signer: host.identity });
  const initial = await registry.select(await signTransitionRequest({ applicationId, profile: descriptor.payload.profile,
    policy: descriptor.payload.policy, expectedGeneration: null, requester: devices[0].identity.publicKey,
    coordinator: devices[0].identity.publicKey, controlRevision: 0, base: null, reason: 'create', transitionId: 'task-initial' }, devices[0].identity));
  const open = async (device, name, initialize) => {
    const session = await openNativeSqlApplication({ device, databasePath: join(directory, `${name}-materialized.sqlite`),
      definition: taskBoard, schema: prepared.schema, authority: await registry.read(),
      ...(initialize ? { epochKeys: new Map([[0, epochKey]]) } : {}) });
    resources.push(session); return session;
  };
  const [creator, member] = await Promise.all([open(devices[0], 'creator', true), open(devices[1], 'member', true)]);
  report.executionManifestDigest = descriptor.payload.executionManifestDigest;
  let link = await connectApplications(creator, member); links.push(link);
  assert.equal((await applied(creator, 'addTask', { taskId: 'claim-race', title: 'One claimant at a time' }, 'add-claim-race')).outcome, 'accepted');
  assert.equal((await applied(creator, 'addTask', { taskId: 'shared-after-close', title: 'Continue after the creator leaves' }, 'add-shared')).outcome, 'accepted');
  const retainedMessage = await applied(creator, 'postMessage', { messageId: 'retained-message', text: 'The retained SQL and event view' }, 'retained-message');
  assert.equal(retainedMessage.outcome, 'accepted');
  await link.synchronize();
  const retained = await member.recoveryPoint(), retainedView = await member.query('board', {});
  const claims = await Promise.all([applied(creator, 'claimTask', { taskId: 'claim-race' }, 'creator-claim'),
    applied(member, 'claimTask', { taskId: 'claim-race' }, 'member-claim')]);
  assert.deepEqual(claims.map(value => value.outcome).sort(), ['accepted', 'rejected']);
  const winnerIndex = claims.findIndex(value => value.outcome === 'accepted'), winner = [creator, member][winnerIndex];
  const loser = [member, creator][winnerIndex];
  const unauthorized = await applied(loser, 'finishTask', { taskId: 'claim-race' }, 'wrong-claimant-finish');
  assert.equal(unauthorized.outcome, 'rejected');
  const claimedView = await creator.query('board', {});
  assert.equal(claimedView.value.tasks.find(value => value.id === 'claim-race').claimedBy, winner.deviceId);
  assert.equal((await applied(creator, 'postMessage', { messageId: 'excluded-message', text: 'This event is excluded with the claims' }, 'excluded-message')).outcome, 'accepted');
  await link.synchronize(); const oldHead = await creator.recoveryPoint(); await link.close();
  const successor = await registry.select(await signTransitionRequest({ applicationId, profile: descriptor.payload.profile,
    policy: descriptor.payload.policy, expectedGeneration: initial.id, requester: devices[1].identity.publicKey,
    coordinator: devices[1].identity.publicKey, controlRevision: 0, base: retained, reason: 'takeover', transitionId: 'task-recovery' }, devices[1].identity));
  const authority = await registry.read(); await Promise.all([creator.adopt(authority), member.adopt(authority)]);
  const recovered = await member.query('board', {}), recoveredCreator = await creator.query('board', {});
  assert.deepEqual(recovered.value, retainedView.value); assert.deepEqual(recoveredCreator.value, recovered.value);
  assert.equal(recovered.value.tasks.find(value => value.id === 'claim-race').claimedBy, null);
  assert.equal(recovered.value.messages.length, 1);
  const original = claims[winnerIndex];
  assert.equal((await winner.operations.get(original.operationId)).status, 'abandoned');
  await assert.rejects(winner.retry(original.operationId), /abandoned|Abandoned|ABANDONED/u);
  assert.deepEqual(await creator.operations.get(retainedMessage.operationId), retainedMessage);
  link = await connectApplications(creator, member); links.push(link); await link.synchronize();
  assert.deepEqual((await creator.query('board', {})).value, recovered.value);
  const reapplied = await (await winner.reapply(original.operationId, 'claimTask', { taskId: 'claim-race' },
    { operationId: 'reviewed-claim', basedOn: (await winner.query('board', {})).revision })).applied({ signal: AbortSignal.timeout(15_000) });
  assert.equal(reapplied.outcome, 'accepted');
  const inspected = await winner.operations.inspect(reapplied.operationId);
  assert.equal(inspected.attempt.payload.header.reapplyOf, original.attemptId);
  await link.synchronize(); await link.close(); await creator.close();
  const afterCreator = await applied(member, 'claimTask', { taskId: 'shared-after-close' }, 'claim-without-creator');
  assert.equal(afterCreator.outcome, 'accepted');
  const completed = await applied(member, 'finishTask', { taskId: 'shared-after-close' }, 'finish-without-creator');
  assert.equal(completed.outcome, 'accepted');
  const completeView = await member.query('board', {}), identityBefore = member.deviceId, storageBefore = member.storageId;
  assert.equal(completeView.value.tasks.find(value => value.id === 'shared-after-close').status, 'done');
  await member.close();
  const reopened = await open(await openNativeDevice({ path: join(directory, 'member.sqlite') }), 'member', false);
  const reopenedView = await reopened.query('board', {});
  assert.equal(reopened.deviceId, identityBefore); assert.equal(reopened.storageId, storageBefore);
  assert.deepEqual(reopenedView.value, completeView.value);
  assert.deepEqual(await reopened.operations.get(completed.operationId), completed);
  report.tasks = { definitionId: taskBoard.id, signedSchemaDigest: descriptor.payload.schemaDigest,
    schemaAdministrator: devices[0].identity.publicKey, sharedCreatorClosed: true,
    claims: claims.map(value => ({ operationId: value.operationId, attemptId: value.attemptId, outcome: value.outcome })),
    unauthorizedCompletion: unauthorized.outcome, completionAfterCreatorClosed: completed.outcome };
  report.recovery = { previousGeneration: initial.id, selectedGeneration: successor.id,
    previousHead: oldHead.point.sequence, adoptedPosition: retained.point.sequence,
    retainedDigest: hash(retainedView.value), recoveredDigest: hash(recovered.value), otherPeerDigest: hash(recoveredCreator.value),
    sqlAndEventsResetTogether: true, inheritedIdentityPreserved: true, returningTailExcluded: true, retryRefused: true,
    originalOperationId: original.operationId, originalAttemptId: original.attemptId,
    reappliedOperationId: reapplied.operationId, reappliedAttemptId: reapplied.attemptId, reapplyOf: inspected.attempt.payload.header.reapplyOf };
  report.reopen = { identityBefore, identityAfter: reopened.deviceId, storageBefore, storageAfter: reopened.storageId,
    digestBefore: hash(completeView.value), digestAfter: hash(reopenedView.value),
    operationBefore: completed, operationAfter: await reopened.operations.get(completed.operationId), epochKeysProvided: false };
  report.passed = true;
} catch (error) {
  report.error = error instanceof Error ? error.stack ?? error.message : String(error); throw error;
} finally {
  await Promise.allSettled(links.map(link => link.close()));
  await Promise.allSettled(resources.reverse().map(value => value.close()));
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
}
