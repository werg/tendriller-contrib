// Run only after installing the exact public archives in a fresh directory.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { MessageChannel } from 'node:worker_threads';
import { bytesDigest, connectApplications, controlParticipantGrant, createApplicationOwner,
  createGenerationRegistry, defineApplication, defineCommand, participantGrant, program,
  signApplicationDescriptor, signControlRevision, signTransitionRequest, sqlStatement } from '@chronolog/peer-session';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { connectApplicationOwner } from '@chronolog/peer-session/browser';
import { openSqlApplication, prepareSqlApplication } from '@chronolog/peer-session/sql';
import { createNativeSqlEngine } from '@chronolog/peer-session/sql-native';
import { createViewStore, prepareCollaborationCommand } from '@tendriller/core/collaboration';
import { reviewWorkspace, reviewClient } from './review-workspace.mjs';
import { reviewAssignedTask } from './reviewer.mjs';

const reportPath = resolve(process.argv[2]), report = JSON.parse(await readFile(reportPath, 'utf8'));
const directory = join(dirname(reportPath), 'stores'), resources = [], channels = [], links = [];
const startedAt = performance.now(), samples = { commandAppliedMs: [], convergenceMs: [], viewQueryMs: [], reopenedMs: [] }, memory = [];
const measure = async (name, operation) => {
  const start = performance.now(); try { return await operation(); } finally { samples[name].push(performance.now() - start); }
};
const signal = () => AbortSignal.timeout(15_000);
const applied = async (client, method, input, operationId) => measure('commandAppliedMs', async () => {
  const operation = await client[method](input, { operationId });
  return operation.applied({ signal: signal() });
});
const accepted = async (...args) => {
  const result = await applied(...args); assert.equal(result.outcome, 'accepted', JSON.stringify(result)); return result;
};
const observed = (name, observation) => {
  assert.ok(!report.checks.some(value => value.name === name), `Duplicate check ${name}`);
  report.checks.push({ name, passed: true, observation });
  memory.push(process.memoryUsage());
  console.log(`✓ ${name}`);
};
const stores = [];

try {
  const authorityDevice = await openNativeDevice({ path: join(directory, 'authority.sqlite'), create: true });
  resources.push(authorityDevice);
  const roles = ['coordinator', 'laptop', 'phone', 'reviewer-a', 'reviewer-b', 'provider', 'observer', 'display'];
  const devices = [];
  for (const role of roles) {
    const path = join(directory, `${role}.sqlite`); stores.push(path);
    const device = await openNativeDevice({ path, create: true }); devices.push(device); resources.push(device);
  }
  const base = reviewWorkspace({ administrators: [devices[0].identity.publicKey] });
  // A deliberately hostile authorized writer can prepare arbitrary SQL. The
  // signed schema must enforce its invariants independently of client helpers.
  const definition = defineApplication({ ...base, commands: { ...base.commands,
    'fixture.raw': defineCommand({ description: 'Qualification-only raw ChangeProgram probe',
      input: { type: 'string', minLength: 1, maxLength: 4096 }, prepare: sql => program(sqlStatement(sql)) }),
  } });
  const applicationId = randomBytes(32).toString('hex'), epochKey = new Uint8Array(randomBytes(32));
  const engine = createNativeSqlEngine();
  const prepared = await prepareSqlApplication({ engine, applicationId, definition, schemaAdministrator: devices[0].identity });
  const descriptor = await signApplicationDescriptor({ applicationId, historyId: 'independent-collaboration-v1',
    profile: 'peer-generation-v1', policy: 'eligible-members-v1', controlPublicKey: authorityDevice.identity.publicKey,
    ...prepared.binding }, authorityDevice.identity);
  const control = await signControlRevision({ applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
    revision: 0, previous: null, epoch: 0, keyDigest: await bytesDigest(epochKey), recoveryFloor: null,
    grants: [controlParticipantGrant(authorityDevice.identity.publicKey), ...devices.map(device => participantGrant(device.identity.publicKey,
      { dataRole: 'member', administrator: true }))] }, authorityDevice.identity);
  const registry = await createGenerationRegistry({ store: authorityDevice.store, descriptor, controls: [control], signer: authorityDevice.identity });
  const initial = await registry.select(await signTransitionRequest({ applicationId, profile: descriptor.payload.profile,
    policy: descriptor.payload.policy, expectedGeneration: null, requester: devices[0].identity.publicKey,
    coordinator: devices[0].identity.publicKey, controlRevision: 0, base: null, reason: 'create', transitionId: 'collaboration-initial' }, devices[0].identity));
  const open = async (device, index, initialize = false) => {
    const session = await openSqlApplication({ createEngine: () => engine, device,
      databasePath: join(directory, `${roles[index]}-materialized.sqlite`), definition, schema: prepared.schema,
      authority: await registry.read(), signals: { delivery: 'application', localEcho: true },
      ...(initialize ? { epochKeys: new Map([[0, epochKey]]) } : {}) });
    resources.push(session); return session;
  };
  const sessions = [];
  for (let index = 0; index < devices.length; index++) sessions.push(await open(devices[index], index, true));
  const endpoint = index => ({ deviceId: sessions[index].deviceId, endpointId: `native-${roles[index]}`,
    endpointIncarnation: `incarnation-${roles[index]}` });
  const clients = sessions.map((session, index) => reviewClient({ session, endpoint: endpoint(index), runId: `run-${roles[index]}` }));
  const connect = async coordinator => {
    for (let index = 0; index < sessions.length; index++) if (index !== coordinator) {
      const link = await connectApplications(sessions[coordinator], sessions[index]); links.push(link);
    }
    await synchronize();
  };
  const synchronize = async () => measure('convergenceMs', async () => { for (const link of links) await link.synchronize(); });
  const disconnect = async () => { await Promise.all(links.splice(0).map(link => link.close())); };
  await connect(0);
  report.executionManifestDigest = descriptor.payload.executionManifestDigest;
  report.topology = { transport: 'direct-authenticated', signers: sessions.map(session => session.deviceId),
    journeySigners: sessions.slice(0, 6).map(session => session.deviceId),
    roles, independentAgents: 2, attachments: 2, liveDelivery: 'application', processes: 1, physicalDevices: 0,
    network: 'in-process authenticated direct links; local filesystem stores; real MessagePorts',
    grants: devices.map((device, index) => ({ signer: device.identity.publicKey, dataRole: 'member',
      controlAdministrator: true, schemaAdministrator: index === 0, collaborationAdministrator: index === 0 })) };
  assert.equal(new Set(report.topology.signers).size, 8);
  observed('sixIndependentSigners', { signers: report.topology.journeySigners, coordinator: sessions[0].deviceId });

  const owner = createApplicationOwner(sessions[1], {
    prepareCommand: (binding, name, input) => prepareCollaborationCommand(binding, name, input, sessions[1].deviceId),
  });
  resources.push(owner);
  const attach = async (viewId, documentPath) => {
    const channel = new MessageChannel(); channels.push(channel.port1, channel.port2);
    owner.attach(channel.port1);
    const facade = await connectApplicationOwner(channel.port2, { applicationId, definitionId: definition.id,
      definitionVersion: definition.version, context: { viewId, documentPath, publicationId: 'publication-1' } });
    resources.push(facade); return facade;
  };
  const board = await attach('board', '/board.html'), discussion = await attach('discussion', '/discussion.html');
  assert.equal(board.deviceId, discussion.deviceId);
  assert.equal(board.endpoint.ownerInstanceId, discussion.endpoint.ownerInstanceId);
  assert.notEqual(board.endpoint.endpointId, discussion.endpoint.endpointId);
  assert.notEqual(board.endpoint.endpointIncarnation, discussion.endpoint.endpointIncarnation);
  observed('twoAttachmentsOneOwner', { signer: board.deviceId, owner: board.endpoint.ownerInstanceId,
    endpoints: [board.endpoint.endpointId, discussion.endpoint.endpointId] });
  const boardClient = reviewClient({ session: board, endpoint: board.endpoint, runId: 'board-run' });
  const discussionClient = reviewClient({ session: discussion, endpoint: discussion.endpoint, runId: 'discussion-run' });
  const request = (interactionId, signers, policy = 'one') => ({ interactionId, kind: 'reviewEvidence', title: `Review ${interactionId}`,
    input: { evidenceId: 'evidence-12', revision: 1 }, context: { evidenceId: 'evidence-12', revision: 1 },
    target: signers.length === 1 ? { kind: 'signer', deviceId: signers[0] } : { kind: 'workerGroup', groupId: 'reviewers' },
    responsePolicy: policy,
    slots: policy === 'one' ? [{ slotId: 'review', eligibleSigners: signers, label: 'Review' }]
      : signers.map((signer, index) => ({ slotId: `review-${index + 1}`, eligibleSigners: [signer], label: `Specialist ${index + 1}` })),
  });
  await Promise.all([
    accepted(boardClient, 'request', request('board-request', [sessions[3].deviceId]), 'board-request-op'),
    accepted(discussionClient, 'request', request('discussion-request', [sessions[4].deviceId]), 'discussion-request-op'),
  ]);
  await synchronize();
  const boardTask = (await boardClient.inspect('board-request')).value.task;
  const discussionTask = (await discussionClient.inspect('discussion-request')).value.task;
  assert.equal(boardTask.source.endpointId, board.endpoint.endpointId);
  assert.equal(discussionTask.source.endpointId, discussion.endpoint.endpointId);
  assert.equal(boardTask.source.documentPath, '/board.html');
  assert.equal(discussionTask.source.documentPath, '/discussion.html');
  observed('sourceEndpointIsolation', { board: boardTask.source, discussion: discussionTask.source });
  await discussion.detach();
  assert.equal(sessions[1].signal.aborted, false);
  assert.equal((await boardClient.inspect('board-request')).value.task.taskId, 'board-request');
  observed('detachIsolation', { siblingUsable: true, ownerClosed: sessions[1].signal.aborted });
  // A malformed attachment uses a real independent MessagePort. Its protocol
  // failure must not close the valid board attachment or the shared session.
  const malformedChannel = new MessageChannel(); channels.push(malformedChannel.port1, malformedChannel.port2);
  owner.attach(malformedChannel.port1);
  const malformedRpc = new MessageChannel(); channels.push(malformedRpc.port1, malformedRpc.port2);
  const handshake = new Promise((resolve, reject) => {
    malformedRpc.port1.once('message', value => value.ready ? resolve(value) : reject(Error(JSON.stringify(value))));
  });
  malformedChannel.port2.postMessage({ protocol: 'chronolog/peer-session/owner/v2', port: malformedRpc.port2,
    handshake: { applicationId, definitionId: definition.id, definitionVersion: definition.version } }, [malformedRpc.port2]);
  await handshake;
  const ended = new Promise(resolve => malformedRpc.port1.once('message', resolve));
  malformedRpc.port1.postMessage({ invalid: 'not an RPC request' });
  const termination = await Promise.race([ended, new Promise((_, reject) => setTimeout(() => reject(Error('Malformed attachment was not terminated')), 5000))]);
  assert.ok(termination.ended);
  assert.equal((await boardClient.inspect('board-request')).value.task.taskId, 'board-request');
  observed('malformedPortIsolation', { attachmentEnded: true, siblingUsable: true });

  // The representative journey above remains six independent roles. Exercise a
  // separate scale envelope with eight signers and four live views per owner.
  const owners = sessions.map((session, index) => {
    if (index === 1) return owner;
    const instance = createApplicationOwner(session, {
      prepareCommand: (binding, name, input) => prepareCollaborationCommand(binding, name, input, session.deviceId),
    });
    resources.push(instance); return instance;
  });
  const scaleViews = sessions.map((_, index) => index === 1 ? [board] : []);
  for (let index = 0; index < sessions.length; index++) {
    while (scaleViews[index].length < 4) {
      const channel = new MessageChannel(); channels.push(channel.port1, channel.port2);
      const narrow = index === 1 && scaleViews[index].length === 1;
      owners[index].attach(channel.port1, narrow ? { maxStreams: 2, maxRequests: 4,
        capabilities: ['commands', 'queries', 'events', 'signals', 'operations'] } : {});
      const view = await connectApplicationOwner(channel.port2, { applicationId, definitionId: definition.id,
        definitionVersion: definition.version, context: { viewId: `scale-${index}-${scaleViews[index].length}`,
          documentPath: `/scale/${roles[index]}/${scaleViews[index].length}.html` } });
      resources.push(view); scaleViews[index].push(view);
    }
  }
  const scaleEndpoints = scaleViews.flat().map(view => view.endpoint.endpointId);
  assert.equal(new Set(scaleEndpoints).size, 32);
  assert.ok(owners.every(instance => instance.endpoints().length === 4));
  const scaleSnapshots = await Promise.all(scaleViews.flat().map(view => measure('viewQueryMs', () => view.query('collab.snapshot', null))));
  assert.ok(scaleSnapshots.every(value => value.value.tasks.some(task => task.taskId === 'board-request')));
  report.topology.attachments = 32;
  observed('scaleProfile', { signingParticipants: sessions.length, simultaneousAttachments: scaleEndpoints.length,
    owners: owners.map(instance => instance.ownerInstanceId), attachmentsPerOwner: owners.map(instance => instance.endpoints().length),
    successfulViews: scaleSnapshots.length });

  const noisy = scaleViews[1][1], sibling = scaleViews[1][2];
  const saturated = ['load-a', 'load-b'].map(topic => noisy.signals.subscribe({ topics: [topic], signal: signal() })[Symbol.asyncIterator]());
  const warming = saturated.map(iterator => iterator.next());
  // A round trip on the same port follows both stream.open requests.
  await noisy.query('collab.snapshot', null);
  await sessions[1].signals.send('load-a', { live: true }, { stream: { streamId: 'noisy-a' } });
  await sessions[1].signals.send('load-b', { live: true }, { stream: { streamId: 'noisy-b' } });
  await Promise.all(warming);
  const held = saturated.map(iterator => iterator.next());
  for (const waiting of held) void waiting.catch(() => undefined);
  const overflowing = noisy.signals.subscribe({ topics: ['overflow'], signal: signal() })[Symbol.asyncIterator]();
  await assert.rejects(overflowing.next(), /APPLICATION_WORKER_STREAM_LIMIT/u);
  const siblingResult = await sibling.query('collab.snapshot', null);
  assert.ok(siblingResult.value.tasks.some(task => task.taskId === 'discussion-request'));
  assert.equal(sibling.signal.aborted, false); assert.equal(noisy.signal.aborted, false);
  await Promise.all(saturated.map(iterator => iterator.return())); await Promise.allSettled(held);
  observed('noisyEndpointIsolation', { perEndpointStreamLimit: 2, rejected: 'APPLICATION_WORKER_STREAM_LIMIT',
    siblingQuerySucceeded: true, ownerClosed: sessions[1].signal.aborted });

  const progress = scaleViews[6][0].signals.subscribe({ topics: ['progress'], mode: 'latest',
    streams: [{ authorId: sessions[3].deviceId, streamId: 'run-a' }, { authorId: sessions[3].deviceId, streamId: 'run-b' }], signal: signal() })[Symbol.asyncIterator]();
  const firstProgress = progress.next();
  // The facade opens a stream asynchronously. Two round trips on its ordered
  // port fence stream.open and the subsequent stream.next registration. Signals
  // sent before a subscriber exists are correctly disposable, not buffered.
  await scaleViews[6][0].query('collab.snapshot', null);
  await scaleViews[6][0].query('collab.snapshot', null);
  await sessions[3].signals.send('progress', { completed: 1, total: 2 }, { stream: { streamId: 'run-a' } });
  await sessions[3].signals.send('progress', { completed: 2, total: 2 }, { stream: { streamId: 'run-b' } });
  const received = [await firstProgress, await progress.next()].map(value => {
    assert.equal(value.done, false, 'Both independent signed streams must reach the registered observer'); return value.value;
  });
  assert.deepEqual(received.map(value => value.stream.streamId).sort(), ['run-a', 'run-b']);
  await progress.return();
  observed('signalRunIsolation', { observer: scaleViews[6][0].deviceId,
    streams: received.map(value => ({ streamId: value.stream.streamId, author: value.authorId })) });

  await accepted(clients[0], 'request', request('exclusive', [sessions[3].deviceId, sessions[4].deviceId]), 'exclusive-op');
  await synchronize();
  const claimInput = (taskId, slotId, index, expectedEpoch = 0) => ({ taskId, slotId,
    claimId: `${taskId}-${slotId}-${index}-${expectedEpoch}`, expectedEpoch, taskVersion: 1,
    runId: `run-${roles[index]}`, endpointIncarnation: endpoint(index).endpointIncarnation });
  const race = await Promise.all([3, 4].map(index => applied(clients[index], 'claim', claimInput('exclusive', 'review', index), `race-${index}`)));
  assert.deepEqual(race.map(value => value.outcome).sort(), ['accepted', 'rejected']);
  const winner = race[0].outcome === 'accepted' ? 3 : 4, loser = winner === 3 ? 4 : 3;
  observed('exclusiveClaimRace', { outcomes: race.map(value => value.outcome), winner: sessions[winner].deviceId,
    operations: race.map(value => ({ operationId: value.operationId, attemptId: value.attemptId })) });
  await synchronize();
  const originalClaim = (await clients[0].inspect('exclusive')).value.claims[0];
  const raw = await sessions[loser].command('fixture.raw', "DELETE FROM collab_journal", { operationId: 'raw-delete-claims' });
  const rawOutcome = await raw.applied({ signal: signal() });
  assert.equal(rawOutcome.outcome, 'rejected');
  assert.equal(rawOutcome.rejectionCode, 'assert:collab_immutable');
  assert.deepEqual((await clients[0].inspect('exclusive')).value.claims[0], originalClaim);
  observed('rawProgramGuard', { outcome: rawOutcome.outcome, rejectionCode: rawOutcome.rejectionCode,
    operationId: raw.operationId, attempted: 'DELETE FROM collab_journal' });
  const drop = await sessions[loser].command('fixture.raw', 'DROP TRIGGER collab_result', { operationId: 'raw-drop-result-guard' });
  const dropOutcome = await drop.applied({ signal: signal() });
  assert.equal(dropOutcome.outcome, 'rejected'); assert.equal(dropOutcome.rejectionCode, 'denied');
  observed('schemaDdlGuard', { outcome: dropOutcome.outcome, rejectionCode: dropOutcome.rejectionCode,
    attempted: 'DROP TRIGGER collab_result', author: sessions[loser].deviceId });
  await accepted(clients[0], 'handoff', { taskId: 'exclusive', slotId: 'review', actionId: 'handoff-review',
    expectedEpoch: originalClaim.claimEpoch, assignee: sessions[loser].deviceId, reason: 'Use the other specialist' }, 'handoff-review-op');
  const offered = (await clients[0].inspect('exclusive')).value.claims[0];
  await accepted(clients[loser], 'claim', claimInput('exclusive', 'review', loser, offered.claimEpoch), 'replacement-claim-op');
  const resultInput = (taskId, slotId, claim, resultId, content = { decision: 'reviewed' }) => ({ taskId, slotId, resultId,
    claimEpoch: claim.claimEpoch, taskVersion: 1, generation: claim.generation, runId: claim.runId,
    endpointIncarnation: claim.endpointIncarnation, outcome: 'succeeded', content });
  const forgedBody = JSON.stringify({ ...resultInput('exclusive', 'review', originalClaim, 'forged-current-result'),
    content: JSON.stringify({ decision: 'Force stale work into the current aggregate' }), disposition: 'accepted' });
  const quoted = value => `'${value.replaceAll("'", "''")}'`;
  const forgedSql = `INSERT INTO collab_journal (id,sequence,type,task_id,slot_id,author,generation,body)
    SELECT 'forged-current-result',COALESCE(MAX(sequence),0)+1,'result','exclusive','review',
      lower(hex(chronolog_actor())),${quoted(initial.id)},${quoted(forgedBody)} FROM collab_journal`;
  const forged = await sessions[winner].command('fixture.raw', forgedSql, { operationId: 'raw-forged-result' });
  const forgedOutcome = await forged.applied({ signal: signal() });
  assert.equal(forgedOutcome.outcome, 'rejected'); assert.equal(forgedOutcome.rejectionCode, 'assert:collab_result_disposition');
  assert.equal((await clients[0].inspect('exclusive')).value.results.some(value => value.resultId === 'forged-current-result'), false);
  observed('rawForgedResultGuard', { outcome: forgedOutcome.outcome, rejectionCode: forgedOutcome.rejectionCode,
    actualSigner: sessions[winner].deviceId, assertedDisposition: 'accepted', retainedForgedResult: false });
  await accepted(clients[winner], 'result', resultInput('exclusive', 'review', originalClaim, 'late-result'), 'late-result-op');
  let inspection = (await clients[0].inspect('exclusive')).value;
  const lateResult = inspection.results.find(value => value.resultId === 'late-result');
  assert.equal(lateResult.disposition, 'superseded');
  assert.equal(inspection.claims[0].claimant, sessions[loser].deviceId);
  observed('staleClaimRejected', { acceptedAsCurrent: false, disposition: lateResult.disposition,
    currentClaimant: inspection.claims[0].claimant, oldClaimant: originalClaim.claimant });
  const replacementClaim = inspection.claims[0], canonicalResult = resultInput('exclusive', 'review', replacementClaim, 'canonical-result');
  await accepted(clients[loser], 'result', canonicalResult, 'canonical-result-op');
  await accepted(clients[loser], 'result', canonicalResult, 'canonical-result-repeat');
  const conflict = await applied(clients[loser], 'result', { ...canonicalResult, content: { decision: 'different' } }, 'canonical-result-conflict');
  assert.equal(conflict.outcome, 'rejected');
  inspection = (await clients[0].inspect('exclusive')).value;
  assert.equal(inspection.results.filter(value => value.resultId === 'canonical-result').length, 1);
  observed('resultIdentityConflict', { conflict: conflict.outcome, acceptedResults: inspection.results.filter(value => value.disposition === 'accepted').length });

  await accepted(clients[0], 'request', request('round', [sessions[3].deviceId, sessions[4].deviceId], 'allSlots'), 'round-request');
  await synchronize();
  const independentReviews = await Promise.all([3, 4].map((index, offset) => reviewAssignedTask({ session: sessions[index],
    endpoint: endpoint(index), runId: `run-${roles[index]}`, taskId: 'round', slotId: `review-${offset + 1}`,
    policy: index === 3 ? 'evidence' : 'clarity', signal: signal() })));
  assert.deepEqual(independentReviews.map(value => value.status), ['accepted', 'accepted']);
  assert.deepEqual(independentReviews.map(value => value.result.content.policy).sort(), ['clarity', 'evidence']);
  assert.equal(new Set(independentReviews.map(value => value.result.author)).size, 2);
  observed('independentReviewPolicies', { policies: independentReviews.map(value => value.result.content.policy),
    signers: independentReviews.map(value => value.result.author), results: independentReviews.map(value => value.result.resultId),
    externalEffects: false });
  const round = (await clients[0].inspect('round')).value;
  assert.equal(round.task.slots.length, 2);
  const unauthorizedClaim = await applied(clients[5], 'claim', claimInput('round', 'review-1', 5), 'unassigned-provider-claim');
  assert.equal(unauthorizedClaim.outcome, 'rejected');
  assert.equal((await clients[0].inspect('round')).value.task.slots.length, 2);
  observed('frozenContributionSlots', { slots: round.task.slots.map(value => value.slotId), unassignedOutcome: unauthorizedClaim.outcome });
  const resultIds = round.results.filter(value => value.disposition === 'accepted').map(value => value.resultId);
  await accepted(clients[0], 'finalize', { taskId: 'round', actionId: 'final-round', expectedVersion: round.task.version,
    resultIds, content: { decision: 'Proceed', evidenceId: 'evidence-12' }, allowPartial: false }, 'round-finalize');
  const finalRound = (await clients[0].inspect('round')).value;
  assert.equal(finalRound.task.status, 'completed');
  assert.deepEqual(finalRound.task.aggregate.resultIds.slice().sort(), resultIds.slice().sort());
  observed('aggregateProvenance', { resultIds: finalRound.task.aggregate.resultIds, status: finalRound.task.status,
    contributors: finalRound.results.filter(value => value.disposition === 'accepted').map(value => value.author) });

  await accepted(clients[0], 'request', request('cancel-me', [sessions[3].deviceId]), 'cancel-request');
  await accepted(clients[3], 'claim', claimInput('cancel-me', 'review', 3), 'cancel-claim');
  const cancelling = (await clients[0].inspect('cancel-me')).value;
  await accepted(clients[0], 'cancel', { taskId: 'cancel-me', actionId: 'request-cancel',
    expectedVersion: cancelling.task.version, reason: 'Changed requirements' }, 'cancel-operation');
  assert.equal((await clients[0].inspect('cancel-me')).value.task.status, 'cancelRequested');
  const cancelClaim = cancelling.claims[0];
  await accepted(clients[3], 'acknowledgeCancel', { taskId: 'cancel-me', slotId: 'review', actionId: 'ack-cancel',
    claimEpoch: cancelClaim.claimEpoch, generation: cancelClaim.generation, runId: cancelClaim.runId,
    endpointIncarnation: cancelClaim.endpointIncarnation }, 'cancel-ack-operation');
  assert.equal((await clients[0].inspect('cancel-me')).value.task.status, 'cancelled');
  observed('cancellationAcknowledgment', { requested: 'cancelRequested', acknowledged: 'cancelled', effectsRecalled: false });

  await accepted(clients[0], 'request', request('surviving-claim', [sessions[3].deviceId]), 'survive-request');
  await accepted(clients[3], 'claim', claimInput('surviving-claim', 'review', 3), 'survive-claim');
  const survivingClaim = (await clients[0].inspect('surviving-claim')).value.claims[0];
  await synchronize();
  const retained = await sessions[2].recoveryPoint();
  await disconnect();
  const successor = await registry.select(await signTransitionRequest({ applicationId, profile: descriptor.payload.profile,
    policy: descriptor.payload.policy, expectedGeneration: initial.id, requester: devices[2].identity.publicKey,
    coordinator: devices[2].identity.publicKey, controlRevision: 0, base: retained, reason: 'takeover',
    transitionId: 'collaboration-recovery' }, devices[2].identity));
  const newAuthority = await registry.read();
  for (const session of sessions) await session.adopt(newAuthority);
  await connect(2);
  await accepted(clients[3], 'result', resultInput('surviving-claim', 'review', survivingClaim, 'old-generation-result'), 'old-generation-result-op');
  const recovered = (await clients[2].inspect('surviving-claim')).value;
  const oldResult = recovered.results.find(value => value.resultId === 'old-generation-result');
  assert.equal(oldResult.disposition, 'needsReview');
  observed('generationFence', { before: initial.id, after: successor.id, oldFenceAcceptedAsCurrent: false,
    disposition: oldResult.disposition, retainedClaim: recovered.claims[0] });
  const rebind = await accepted(clients[3], 'rebind', claimInput('surviving-claim', 'review', 3, survivingClaim.claimEpoch), 'rebind-claim-op');
  const reboundClaim = (await clients[2].inspect('surviving-claim')).value.claims[0];
  assert.equal(reboundClaim.generation, successor.id);
  assert.ok(reboundClaim.claimEpoch > survivingClaim.claimEpoch);
  observed('explicitRebind', { outcome: rebind.outcome, oldEpoch: survivingClaim.claimEpoch,
    newEpoch: reboundClaim.claimEpoch, generation: reboundClaim.generation });
  const retainedOperation = await accepted(clients[3], 'result', resultInput('surviving-claim', 'review', reboundClaim, 'rebound-result'), 'rebound-result-op');
  await synchronize(); await disconnect();
  const signerBefore = sessions[3].deviceId, storageBefore = sessions[3].storageId;
  const operationBefore = await sessions[3].operations.get(retainedOperation.operationId);
  await sessions[3].close();
  const reopened = await measure('reopenedMs', async () => {
    const reopenedDevice = await openNativeDevice({ path: stores[3] }); resources.push(reopenedDevice);
    return open(reopenedDevice, 3);
  });
  const operationAfter = await reopened.operations.get(retainedOperation.operationId);
  assert.equal(reopened.deviceId, signerBefore); assert.equal(reopened.storageId, storageBefore);
  assert.deepEqual(operationAfter, operationBefore);
  observed('operationIdentityAfterReopen', { signerBefore, signerAfter: reopened.deviceId,
    storageBefore, storageAfter: reopened.storageId, operationBefore, operationAfter, epochKeysProvided: false });

  const local = memoryStorage();
  const a = createViewStore({ storage: local, applicationId, profileId: signerBefore, viewId: 'view-a' });
  const b = createViewStore({ storage: local, applicationId, profileId: signerBefore, viewId: 'view-b' });
  a.writeDraft({ text: 'Unsent board draft' }); b.writeDraft({ text: 'Unsent discussion draft' });
  assert.equal(a.readDraft().text, 'Unsent board draft'); assert.equal(b.readDraft().text, 'Unsent discussion draft');
  observed('independentDrafts', { views: ['view-a', 'view-b'], draftsPreserved: true });
  const reference = { applicationId, author: signerBefore, operationId: retainedOperation.operationId, attemptId: retainedOperation.attemptId };
  a.retainOperation(reference); b.retainOperation(reference); a.removeOperation(reference);
  assert.equal(a.pending().length, 0); assert.equal(b.pending().length, 1);
  assert.deepEqual(b.pending()[0].reference, reference);
  observed('independentPendingReferences', { firstViewReferences: a.pending().length, secondViewReferences: b.pending().length,
    originalOperationId: reference.operationId, journalChanged: false });
  report.passed = true;
} catch (error) {
  report.passed = false; report.error = error instanceof Error ? error.stack ?? error.message : String(error); throw error;
} finally {
  memory.push(process.memoryUsage());
  const usage = process.resourceUsage();
  report.measurements = { scope: 'one local Node process; eight retained signers; 32 real MessagePort attachments; no Internet latency claim',
    elapsedMs: performance.now() - startedAt,
    definitions: { commandAppliedMs: 'client command start through selected-history applied result, including rejected commands',
      convergenceMs: 'all authenticated direct links synchronized, after an explicit fixture boundary',
      viewQueryMs: '32 simultaneous facade snapshot queries; one measured sample per view',
      reopenedMs: 'existing device store reopen and session bootstrap; no replacement identity or epoch key supplied' },
    distributions: Object.fromEntries(Object.entries(samples).map(([name, values]) => [name, distribution(values)])),
    memory: { maxRssBytes: usage.maxRSS * 1024, sampledHeapUsedBytes: Math.max(...memory.map(value => value.heapUsed)),
      sampledExternalBytes: Math.max(...memory.map(value => value.external)), samples: memory.length },
    cpu: { userMicroseconds: usage.userCPUTime, systemMicroseconds: usage.systemCPUTime },
    counters: { observedEndpointStreamLimitRejections: report.checks.some(value => value.name === 'noisyEndpointIsolation') ? 1 : 0,
      signalTransportDrops: null, signalDropCounterAvailability: 'not exposed by this public API' },
    performanceBudget: null };
  for (const link of links.reverse()) await link.close().catch(() => undefined);
  for (const resource of resources.reverse()) await resource.close().catch(() => undefined);
  for (const channel of channels) channel.close();
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

function distribution(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const percentile = p => sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)] : null;
  return { samples: sorted.length, p50: percentile(0.5), p95: percentile(0.95), maximum: sorted.at(-1) ?? null, values };
}

function memoryStorage() {
  const records = new Map();
  return { get length() { return records.size; }, key: index => [...records.keys()][index] ?? null,
    getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, String(value)), removeItem: key => records.delete(key) };
}
