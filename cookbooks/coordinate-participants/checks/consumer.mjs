// Run only after installing the exact public archives in a fresh directory.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { MessageChannel } from 'node:worker_threads';
import { bytesToHex, createApplicationSession, createViewStore, defineApplication, defineCommand, program,
  executionManifestArtifacts, sqlStatement, verifyAuthorityBundle } from '@chronolog/peer-session';
import { createApplicationOwner } from '@chronolog/peer-session/worker';
import { createFixtureAuthority } from './operation-set-authority.mjs';
import { awaitPhase, connectDirect } from './operation-set-participation.mjs';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { connectApplicationOwner } from '@chronolog/peer-session/browser';
import { createSqlMaterializationRuntime } from '@chronolog/peer-session/sql';
import { createNativeSqlEngine } from '@chronolog/peer-session/sql-native';
import { captureCollaborationReader, prepareCollaborationCommand } from '@tendriller/core/collaboration';
import { reviewWorkspace, reviewClient } from './review-workspace.mjs';
import { reviewAssignedTask, runReviewer } from './reviewer.mjs';

const reportPath = resolve(process.argv[2]), report = JSON.parse(await readFile(reportPath, 'utf8'));
const directory = join(dirname(reportPath), 'stores'), resources = [], channels = [], links = [];
const startedAt = performance.now(), samples = { commandMaterializedMs: [], convergenceMs: [], viewQueryMs: [], reopenedMs: [] }, memory = [];
const measure = async (name, operation) => {
  const start = performance.now(); try { return await operation(); } finally { samples[name].push(performance.now() - start); }
};
// Failure context only: deadlines keep their original durations. A timeout aborts with the
// same TimeoutError name, but its message names the wait, stage and current operation.
const context = { stage: 'before ordinaryInitialization', stageStartedAt: startedAt, operation: null, events: [] };
const note = event => { context.events.push({ atMs: Math.round(performance.now() - startedAt), event }); if (context.events.length > 40) context.events.shift(); };
const timeoutSignal = (milliseconds, label) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException(`${label} exceeded ${milliseconds} ms at ${Math.round(performance.now() - startedAt)} ms (after stage ${context.stage}, ${Math.round(performance.now() - context.stageStartedAt)} ms into the next stage; operation ${context.operation ?? 'none'})`, 'TimeoutError')), milliseconds);
  timer.unref(); return controller.signal;
};
const signal = (label = 'operation wait') => timeoutSignal(15_000, label);
let synchronizeAll = async () => {};
const projected = async (client, method, input, operationId) => measure('commandMaterializedMs', async () => {
  const previous = context.operation; context.operation = `${method} ${operationId}`; note(`start ${context.operation}`);
  try {
    const operation = await client[method](input, { operationId });
    await operation.materialized({signal:signal(`materialization of ${method} ${operationId}`)});await synchronizeAll();const state=await operation.inspect();note(`done ${context.operation}`);return{...state,...state.materialized};
  } finally { context.operation = previous; }
});
const accepted = async (...args) => {
  const result = await projected(...args); assert.equal(result.outcome, 'accepted', JSON.stringify(result)); return result;
};
const observed = (name, observation) => {
  assert.ok(!report.checks.some(value => value.name === name), `Duplicate check ${name}`);
  report.checks.push({ name, passed: true, observation });
  context.stage = name; context.stageStartedAt = performance.now(); note(`stage ${name}`);
  memory.push(process.memoryUsage());
  console.log(`✓ ${name}`);
};
const stores = [], verifiedReferences = [];
const assertReference = (reference, outcome, author) => {
  assert.deepEqual(reference, { applicationId: report.applicationId, author, operationId: outcome.operationId, proposalId: outcome.proposalId });
  verifiedReferences.push(reference);
};

try {
  const authorityDevice = await openNativeDevice({ path: join(directory, 'authority.sqlite'), create: true });
  resources.push(authorityDevice);
  const roles = ['author', 'laptop', 'phone', 'reviewer-a', 'reviewer-b', 'provider', 'observer', 'display'];
  const devices = [];
  for (const role of roles) {
    const path = join(directory, `${role}.sqlite`); stores.push(path);
    const device = await openNativeDevice({ path, create: true }); devices.push(device); resources.push(device);
  }
  const {definition:base,initializationProgram} = reviewWorkspace({ administrators: [devices[0].identity.publicKey], members:devices.map(device=>device.identity.publicKey) });
  // A deliberately hostile authorized writer can prepare arbitrary SQL. The
  // signed schema must enforce its invariants independently of client helpers.
  const definition = defineApplication({ ...base, commands: { ...base.commands,
    'fixture.raw': defineCommand({ description: 'Qualification-only raw ChangeProgram probe',
      input: { type: 'string', minLength: 1, maxLength: 4096 }, prepare: sql => program(sqlStatement(sql)) }),
  } });
  const applicationId = randomBytes(32).toString('hex'), epochKey = new Uint8Array(randomBytes(32));
  report.applicationId = applicationId;
  const engine = createNativeSqlEngine();
  const artifacts=await executionManifestArtifacts(engine.executionManifest);
  const bundle=await createFixtureAuthority({applicationId,signer:authorityDevice.identity,devices,epochKey,executionManifestDigest:bytesToHex(artifacts.executionManifestDigest)});
  const descriptor=bundle.descriptor;
  const open = async (device, index, initialize = false) => {
    const session=await createApplicationSession({device,definition,authority:bundle,...(initialize?{epochKeys:new Map([[0,epochKey]])}:{}),
      createMaterializer:({rootPrincipal})=>createSqlMaterializationRuntime({engine:createNativeSqlEngine(),path:join(directory,`${roles[index]}-materialized.sqlite`),rootPrincipal})});
    resources.push(session);return session;
  };
  const sessions = [];
  for (let index = 0; index < devices.length; index++) sessions.push(await open(devices[index], index, true));
  const initialized=await sessions[0].submit({program:initializationProgram,operationId:'ordinary-collaboration-initialization'});
  assert.equal(initialized.stored,true);assert.equal((await initialized.materialized()).outcome,'accepted');
  observed('ordinaryInitialization',{proposalId:initialized.id,specialSchemaChannel:false,rootAuthor:devices[0].identity.publicKey});
  const endpoint = index => ({ deviceId: sessions[index].identity.publicKey, endpointId: `native-${roles[index]}`,
    endpointIncarnation: `incarnation-${roles[index]}` });
  const clients = sessions.map((session, index) => reviewClient({ session, endpoint: endpoint(index), runId: `run-${roles[index]}` }));
  const connect = async hub => {
    for (let index = 0; index < sessions.length; index++) if (index !== hub) {
      // Disposable signals use the authenticated live datagram channel, not reliable facts.
      const link = await connectDirect(sessions[hub], sessions[index], { live: true }); links.push(link);
    }
    await synchronize();
  };
  const synchronize = async () => measure('convergenceMs', async () => { for (const link of links) await link.synchronize();
    for(const session of sessions){const view=await session.readView();await view.release();} });
  synchronizeAll=synchronize;
  const disconnect = async () => { await Promise.all(links.splice(0).map(link => link.close())); };
  await connect(0);
  report.executionManifestDigest = descriptor.payload.executionManifestDigest;
  report.topology = { transport: 'direct-authenticated', signers: sessions.map(session => session.identity.publicKey),
    journeySigners: sessions.slice(0, 6).map(session => session.identity.publicKey),
    roles, independentAgents: 2, attachments: 2, liveDelivery: 'application', processes: 1, physicalDevices: 0,
    network: 'in-process authenticated direct links; local filesystem stores; real MessagePorts',
    grants: devices.map((device, index) => ({ signer: device.identity.publicKey, dataRole: 'member',
      cryptoAdministrator:index===0, ddlOwner: index === 0, collaborationAdministrator: index === 0 })) };
  assert.equal(new Set(report.topology.signers).size, 8);
  observed('sixIndependentSigners', { signers: report.topology.journeySigners, orderingParticipantRequired:false });

  const owner=createApplicationOwner(sessions[1],{prepareCommand:(binding,name,input)=>prepareCollaborationCommand(binding,name,input,sessions[1].identity.publicKey)});
  resources.push(owner);
  const attach = async (viewId, documentPath, grant) => {
    const channel = new MessageChannel(); channels.push(channel.port1, channel.port2);
    owner.attach(channel.port1, grant);
    const facade = await connectApplicationOwner(channel.port2, { applicationId, context: { viewId, documentPath, publicationId: 'publication-1' } });
    resources.push(facade); return facade;
  };
  const board = await attach('board', '/board.html'), discussion = await attach('discussion', '/discussion.html');
  assert.equal(board.identity.publicKey, discussion.identity.publicKey);
  assert.equal(board.endpoint.ownerInstanceId, discussion.endpoint.ownerInstanceId);
  assert.notEqual(board.endpoint.endpointId, discussion.endpoint.endpointId);
  assert.notEqual(board.endpoint.endpointIncarnation, discussion.endpoint.endpointIncarnation);
  observed('twoAttachmentsOneOwner', { signer: board.identity.publicKey, owner: board.endpoint.ownerInstanceId,
    endpoints: [board.endpoint.endpointId, discussion.endpoint.endpointId] });
  const localAuthority = await board.readAuthority();
  assert.deepEqual(localAuthority, sessions[1].authority.bundle());
  await verifyAuthorityBundle(localAuthority, descriptor);
  const verifiedAuthority=localAuthority;
  assert.equal(verifiedAuthority.memberships.at(-1).payload.revision, 0);
  localAuthority.memberships.at(-1).payload.members = [];
  assert.notDeepEqual(await board.readAuthority(), localAuthority);
  observed('ownerVerifiedAuthority', { revision: verifiedAuthority.memberships.at(-1).payload.revision, hostTransportConfigured: false,
    ownerSigner: sessions[1].identity.publicKey, mutatedReturnDidNotMutateOwner: true, verifiedSignature: true });
  const denied = async (promise, code) => assert.rejects(promise, error => {
    assert.equal(error.code ?? error.message, code); return true;
  });
  const eventsOnly = await attach('events-only', '/scope/events.html', { capabilities: ['events'], maxViews: 1 });
  const namedOnly = await attach('named-only', '/scope/named.html', { capabilities: ['queries', 'events'], queries: ['collab.snapshot'], maxViews: 1 });
  const queryOnly = await attach('query-only', '/scope/query.html', { capabilities: ['queries'], maxViews: 1 });
  // The owner admits a coherent view when either queries or events is granted;
  // each view method is then checked against its own capability.
  const diagnosticsOnly = await attach('diagnostics-only', '/scope/diagnostics.html', { capabilities: ['diagnostics'], maxViews: 1 });
  await denied(diagnosticsOnly.readView(),'ENDPOINT_CAPABILITY_FORBIDDEN');
  await diagnosticsOnly.detach();
  const eventsView = await eventsOnly.readView();
  await denied(eventsView.query('SELECT 1'),'ENDPOINT_CAPABILITY_FORBIDDEN');
  assert.ok(Array.isArray((await eventsView.readEvents()).events));
  await denied(eventsOnly.readView(),'ENDPOINT_VIEW_LIMIT');
  await eventsView.release();
  await (await eventsOnly.readView()).release();
  const namedView=await namedOnly.readView(),queryView=await queryOnly.readView();
  await denied(namedView.query('SELECT id FROM collab_journal'),'ENDPOINT_RAW_SQL_FORBIDDEN');
  assert.ok(Array.isArray((await eventsOnly.readEvents()).events));
  await denied(queryView.readEvents(),'ENDPOINT_CAPABILITY_FORBIDDEN');
  assert.deepEqual((await queryView.query('SELECT 7 AS value')).rows,[[7]]);
  await Promise.all([namedView.release(),queryView.release()]);
  await denied(captureCollaborationReader(eventsOnly),'ENDPOINT_CAPABILITY_FORBIDDEN');
  await denied(captureCollaborationReader(namedOnly),'ENDPOINT_RAW_SQL_FORBIDDEN');
  assert.deepEqual((await namedOnly.query('collab.snapshot',null)).value.tasks,[]);
  // With no caller abort, an independent raw-read denial must retire the
  // reviewer's pending change observer and preserve that original failure.
  let failureTimer;
  try {
    await denied(Promise.race([
      runReviewer({ session: namedOnly, endpoint: namedOnly.endpoint, runId: 'denied-reviewer', policy: 'clarity' }),
      new Promise((_, reject) => { failureTimer = setTimeout(() => reject(Error('Reviewer cleanup did not finish after its independent read failure')), 5000); }),
    ]), 'ENDPOINT_RAW_SQL_FORBIDDEN');
  } finally { clearTimeout(failureTimer); }
  const queryCapture = await captureCollaborationReader(queryOnly);
  assert.deepEqual((await queryCapture.tasks()).value.tasks, []); await queryCapture.close();
  // A denied capture must release the single allowed view reservation.
  await eventsOnly.detach();
  for (const facade of [namedOnly, queryOnly]) { const again = await facade.readView(); await again.release(); await facade.detach(); }
  assert.equal(sessions[1].signal.aborted, false); assert.equal(owner.endpoints().length, 2);
  observed('capturedReadScope', { eventsOnlyRawDenied: 'ENDPOINT_CAPABILITY_FORBIDDEN',
    namedQueryRawDenied: 'ENDPOINT_RAW_SQL_FORBIDDEN', queryOnlyEventsDenied: 'ENDPOINT_CAPABILITY_FORBIDDEN',
    noReadCapabilityViewDenied: 'ENDPOINT_CAPABILITY_FORBIDDEN', eventsOnlyViewAllowed: true, eventsOnlyEventsAllowed: true,
    eventsOnlyViewLimitDenied: 'ENDPOINT_VIEW_LIMIT', releasedViewRestoredCapacity: true,
    allowedNamedQuery: true, allowedRawQuery: true, deniedCaptureReleasedReservation: true,
    reviewerReadFailureRetiredObserver: true, siblingUsable: true });
  const boardClient = reviewClient({ session: board, endpoint: board.endpoint, runId: 'board-run' });
  const discussionClient = reviewClient({ session: discussion, endpoint: discussion.endpoint, runId: 'discussion-run' });
  const request = (interactionId, signers, policy = 'one') => ({ interactionId, kind: 'reviewEvidence', title: `Review ${interactionId}`,
    input: { evidenceId: 'evidence-12', revision: 1 }, context: { evidenceId: 'evidence-12', revision: 1 },
    target: signers.length === 1 ? { kind: 'signer', deviceId: signers[0] } : { kind: 'workerGroup', groupId: 'reviewers' },
    responsePolicy: policy,
    slots: policy === 'one' ? [{ slotId: 'review', eligibleSigners: signers, label: 'Review' }]
      : signers.map((signer, index) => ({ slotId: `review-${index + 1}`, eligibleSigners: [signer], label: `Specialist ${index + 1}` })),
  });
  const [boardRequest, discussionRequest] = await Promise.all([
    accepted(boardClient, 'request', request('board-request', [sessions[3].identity.publicKey]), 'board-request-op'),
    accepted(discussionClient, 'request', request('discussion-request', [sessions[4].identity.publicKey]), 'discussion-request-op'),
  ]);
  await synchronize();
  const boardTask = (await boardClient.inspect('board-request')).value.task;
  const discussionTask = (await discussionClient.inspect('discussion-request')).value.task;
  assertReference(boardTask.operation, boardRequest, board.identity.publicKey);
  assertReference(discussionTask.operation, discussionRequest, discussion.identity.publicKey);
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
  const malformed = await connectApplicationOwner(malformedChannel.port2,{applicationId});
  await denied(malformed.request('fixture.invalid',[]),'ENDPOINT_METHOD_UNKNOWN');
  await malformed.detach();
  assert.equal((await boardClient.inspect('board-request')).value.task.taskId,'board-request');
  observed('malformedPortIsolation', { malformedRequestRejected: true, attachmentClosedByCaller:true, siblingUsable: true });

  // The representative journey above remains six independent roles. Exercise a
  // separate scale envelope with eight signers and four live views per owner.
  const owners = sessions.map((session, index) => {
    if (index === 1) return owner;
    const instance=createApplicationOwner(session,{prepareCommand:(binding,name,input)=>prepareCollaborationCommand(binding,name,input,session.identity.publicKey)});
    resources.push(instance); return instance;
  });
  const scaleViews = sessions.map((_, index) => index === 1 ? [board] : []);
  for (let index = 0; index < sessions.length; index++) {
    while (scaleViews[index].length < 4) {
      const channel = new MessageChannel(); channels.push(channel.port1, channel.port2);
      const narrow = index === 1 && scaleViews[index].length === 1;
      owners[index].attach(channel.port1, narrow ? { maxRequests: 8,
        capabilities: ['commands', 'queries', 'events', 'signals', 'operations'] } : {});
      const view = await connectApplicationOwner(channel.port2, { applicationId, context: { viewId: `scale-${index}-${scaleViews[index].length}`,
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
  const saturated = ['load-a', 'load-b', 'load-c', 'load-d'].map(topic => noisy.signals.subscribe({ topics: [topic], signal: signal() })[Symbol.asyncIterator]());
  const warming = saturated.map(iterator => iterator.next());
  // If a later assertion fails first, closing the facade rejects these pending
  // reads; observe that cleanup rejection so the original failure is reported.
  for (const waiting of warming) void waiting.catch(() => undefined);
  // The first reply admits stream.open; a second ordered round trip also
  // follows the deferred stream.next registration before disposable sends.
  await noisy.query('collab.snapshot', null);
  await noisy.query('collab.snapshot', null);
  await sessions[1].signals.send('load-a', { live: true }, { stream: { streamId: 'noisy-a' } });
  for(const suffix of ['b','c','d'])await sessions[1].signals.send(`load-${suffix}`, { live: true }, { stream: { streamId: `noisy-${suffix}` } });
  const warmed = await Promise.all(warming);
  assert.ok(warmed.every(value => !value.done), 'Both quota-holding subscriptions must observe a real signal before overflow is tested');
  assert.deepEqual(warmed.map(value => value.value.topic).sort(), ['load-a', 'load-b','load-c','load-d']);
  const held = saturated.map(iterator => iterator.next());
  for (const waiting of held) void waiting.catch(() => undefined);
  const overflowing = noisy.signals.subscribe({ topics: ['overflow'], signal: signal() })[Symbol.asyncIterator]();
  await denied(overflowing.next(), 'ENDPOINT_STREAM_LIMIT');
  const siblingResult = await sibling.query('collab.snapshot', null);
  assert.ok(siblingResult.value.tasks.some(task => task.taskId === 'discussion-request'));
  assert.equal(sibling.signal.aborted, false); assert.equal(noisy.signal.aborted, false);
  await Promise.all(saturated.map(iterator => iterator.return())); await Promise.allSettled(held);
  observed('noisyEndpointIsolation', { perEndpointStreamLimit: 4, rejected: 'ENDPOINT_STREAM_LIMIT',
    siblingQuerySucceeded: true, ownerClosed: sessions[1].signal.aborted });

  const progress = scaleViews[6][0].signals.subscribe({ topics: ['progress'], mode: 'latest',
    streams: [{ authorId: sessions[3].identity.publicKey, streamId: 'run-a' }, { authorId: sessions[3].identity.publicKey, streamId: 'run-b' }], signal: signal() })[Symbol.asyncIterator]();
  const firstProgress = progress.next();
  void firstProgress.catch(() => undefined);
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
  observed('signalRunIsolation', { observer: scaleViews[6][0].identity.publicKey,
    streams: received.map(value => ({ streamId: value.stream.streamId, author: value.authorId })) });

  await accepted(clients[0], 'request', request('exclusive', [sessions[3].identity.publicKey, sessions[4].identity.publicKey]), 'exclusive-op');
  await synchronize();
  const claimInput = (taskId, slotId, index, expectedEpoch = 0) => ({ taskId, slotId,
    claimId: `${taskId}-${slotId}-${index}-${expectedEpoch}`, expectedEpoch, taskVersion: 1,
    runId: `run-${roles[index]}`, endpointIncarnation: endpoint(index).endpointIncarnation });
  await disconnect();
  const offline = await Promise.all([3, 4].map(index => projected(clients[index], 'claim', claimInput('exclusive', 'review', index), `race-${index}`)));
  assert.deepEqual(offline.map(value=>value.outcome),['accepted','accepted']);await connect(0);
  const race=await Promise.all([3,4].map(async(index,offset)=>{const state=await (await sessions[index].operations.get(offline[offset].proposalId)).inspect();return{...state,...state.materialized};}));
  assert.deepEqual(race.map(value => value.outcome).sort(), ['accepted', 'rejected']);
  const winner = race[0].outcome === 'accepted' ? 3 : 4, loser = winner === 3 ? 4 : 3;
  observed('provisionalOfflineClaimRace', { offlineOutcomes:offline.map(value=>value.outcome),outcomes: race.map(value => value.outcome), globalExclusivityOffline:false,winner: sessions[winner].identity.publicKey,
    operations: race.map(value => ({ operationId: value.operationId, proposalId: value.proposalId })) });
  await synchronize();
  const originalClaim = (await clients[0].inspect('exclusive')).value.claims[0];
  assertReference(originalClaim.operation, race[winner === 3 ? 0 : 1], sessions[winner].identity.publicKey);
  await accepted(clients[loser],'message',{threadId:'raw-immutability',messageId:'owned-row',text:'The signer owns this row but may not mutate the journal'},'owned-journal-row');
  const raw = await sessions[loser].command('fixture.raw', "DELETE FROM collab_journal WHERE author=lower(hex(chronolog_actor()))", { operationId: 'raw-delete-claims' });
  const rawOutcome = await raw.materialized({ signal: signal() });
  assert.equal(rawOutcome.outcome, 'rejected');
  assert.equal(rawOutcome.rejectionCode, 'assert:collab_immutable');
  assert.deepEqual((await clients[0].inspect('exclusive')).value.claims[0].operation, originalClaim.operation);
  assert.equal((await clients[0].inspect('exclusive')).value.claims[0].claimEpoch,originalClaim.claimEpoch);
  observed('rawProgramGuard', { outcome: rawOutcome.outcome, rejectionCode: rawOutcome.rejectionCode,
    operationId: raw.operationId, attempted: 'DELETE signer-owned journal rows' });
  const drop = await sessions[loser].command('fixture.raw', 'DROP TRIGGER collab_result', { operationId: 'raw-drop-result-guard' });
  const dropOutcome = await drop.materialized({ signal: signal() });
  assert.equal(dropOutcome.outcome, 'rejected'); assert.equal(dropOutcome.rejectionCode, 'denied');
  observed('schemaDdlGuard', { outcome: dropOutcome.outcome, rejectionCode: dropOutcome.rejectionCode,
    attempted: 'DROP TRIGGER collab_result', author: sessions[loser].identity.publicKey });
  await accepted(clients[0], 'handoff', { taskId: 'exclusive', slotId: 'review', actionId: 'handoff-review',
    expectedEpoch: originalClaim.claimEpoch, assignee: sessions[loser].identity.publicKey, reason: 'Use the other specialist' }, 'handoff-review-op');
  const offered = (await clients[0].inspect('exclusive')).value.claims[0];
  await accepted(clients[loser], 'claim', claimInput('exclusive', 'review', loser, offered.claimEpoch), 'replacement-claim-op');
  const resultInput = (taskId, slotId, claim, resultId, content = { decision: 'reviewed' }) => ({ taskId, slotId, resultId,
    claimEpoch: claim.claimEpoch, taskVersion: 1, claimProposalId: claim.claimProposalId, runId: claim.runId,
    endpointIncarnation: claim.endpointIncarnation, outcome: 'succeeded', content });
  const forgedBody = JSON.stringify({ ...resultInput('exclusive', 'review', originalClaim, 'forged-current-result'),
    content: JSON.stringify({ decision: 'Force stale work into the current aggregate' }), disposition: 'accepted' });
  const quoted = value => `'${value.replaceAll("'", "''")}'`;
  const forgedSql = `INSERT INTO collab_journal (id,sequence,type,task_id,slot_id,author,proposal_id,body)
    SELECT 'forged-current-result',COALESCE(MAX(sequence),0)+1,'result','exclusive','review',
      lower(hex(chronolog_actor())),chronolog_transaction_id(),${quoted(forgedBody)} FROM collab_journal`;
  const forged = await sessions[winner].command('fixture.raw', forgedSql, { operationId: 'raw-forged-result' });
  const forgedOutcome = await forged.materialized({ signal: signal() });
  assert.equal(forgedOutcome.outcome, 'rejected'); assert.equal(forgedOutcome.rejectionCode, 'assert:collab_result_disposition');
  assert.equal((await clients[0].inspect('exclusive')).value.results.some(value => value.resultId === 'forged-current-result'), false);
  observed('rawForgedResultGuard', { outcome: forgedOutcome.outcome, rejectionCode: forgedOutcome.rejectionCode,
    actualSigner: sessions[winner].identity.publicKey, assertedDisposition: 'accepted', retainedForgedResult: false });
  await accepted(clients[winner], 'result', resultInput('exclusive', 'review', originalClaim, 'late-result'), 'late-result-op');
  let inspection = (await clients[0].inspect('exclusive')).value;
  const lateResult = inspection.results.find(value => value.resultId === 'late-result');
  assert.equal(lateResult.disposition, 'superseded');
  assert.equal(inspection.claims[0].claimant, sessions[loser].identity.publicKey);
  observed('staleClaimRejected', { acceptedAsCurrent: false, disposition: lateResult.disposition,
    currentClaimant: inspection.claims[0].claimant, oldClaimant: originalClaim.claimant });
  const replacementClaim = inspection.claims[0], canonicalResult = resultInput('exclusive', 'review', replacementClaim, 'canonical-result');
  const canonicalResultOutcome = await accepted(clients[loser], 'result', canonicalResult, 'canonical-result-op');
  await accepted(clients[loser], 'result', canonicalResult, 'canonical-result-repeat');
  const conflict = await projected(clients[loser], 'result', { ...canonicalResult, content: { decision: 'different' } }, 'canonical-result-conflict');
  assert.equal(conflict.outcome, 'rejected');
  inspection = (await clients[0].inspect('exclusive')).value;
  assert.equal(inspection.results.filter(value => value.resultId === 'canonical-result').length, 1);
  assertReference(inspection.results.find(value => value.resultId === 'canonical-result').operation, canonicalResultOutcome, sessions[loser].identity.publicKey);
  observed('resultIdentityConflict', { conflict: conflict.outcome, acceptedResults: inspection.results.filter(value => value.disposition === 'accepted').length });

  // A raw writer can provide misleading descriptive fields, but cannot assign
  // another attempt or author to the selected record's authenticated reference.
  const falseReference = { applicationId, author: sessions[0].identity.publicKey, operationId: 'forged-body-operation',
    proposalId: boardRequest.proposalId };
  const untrustedMessage = JSON.stringify({ messageId: 'untrusted-reference', text: 'The signed transaction owns this message.',
    source: JSON.stringify({ deviceId: sessions[0].identity.publicKey, evidence: 'owner-bound' }), operation: falseReference });
  const rawMessageSql = attempt => `INSERT INTO collab_journal (id,sequence,type,task_id,slot_id,author,proposal_id,body)
    SELECT 'untrusted-reference',COALESCE(MAX(sequence),0)+1,'message','workspace','',lower(hex(chronolog_actor())),
      ${attempt},${quoted(untrustedMessage)} FROM collab_journal`;
  const spoofedAttempt = await sessions[loser].command('fixture.raw', rawMessageSql(`X'${boardRequest.proposalId}'`), { operationId: 'raw-forged-attempt' });
  const spoofedAttemptOutcome = await spoofedAttempt.materialized({ signal: signal() });
  assert.equal(spoofedAttemptOutcome.outcome, 'rejected'); assert.equal(spoofedAttemptOutcome.rejectionCode, 'assert:collab_proposal');
  observed('rawForgedProposalGuard', { outcome: spoofedAttemptOutcome.outcome, rejectionCode: spoofedAttemptOutcome.rejectionCode,
    attemptedBorrowedProposal: boardRequest.proposalId, actualAuthor: sessions[loser].identity.publicKey });
  const signedMessage = await sessions[loser].command('fixture.raw', rawMessageSql('chronolog_transaction_id()'), { operationId: 'raw-authenticated-message' });
  await signedMessage.materialized({ signal: signal() });const messageOutcome={...signedMessage.inspect(),...signedMessage.inspect().materialized}; assert.equal(messageOutcome.outcome, 'accepted');
  const message = (await clients[loser].snapshot()).value.messages.find(value => value.messageId === 'untrusted-reference');
  assertReference(message.operation, messageOutcome, sessions[loser].identity.publicKey);
  assert.equal(message.source.deviceId, sessions[loser].identity.publicKey); assert.equal(message.source.evidence, 'signer-asserted');
  assert.equal(message.source.contextEvidence, 'caller-asserted');
  assert.equal(message.source.assertedDeviceId, sessions[0].identity.publicKey);

  // Raw writers must not admit a row that the public projection cannot decode
  // or safely send to another attachment. These use real signed programs, not
  // the SDK's input validator, and leave ordinary retained records queryable.
  const poisonRequest = name => {
    const value = request(`poison-${name}`, [sessions[4].identity.publicKey]);
    return { ...value, input: JSON.stringify(value.input), target: JSON.stringify(value.target),
      context: JSON.stringify(value.context), source: JSON.stringify({ deviceId: sessions[loser].identity.publicKey }) };
  };
  let deepInput = 1; for (let depth = 0; depth < 26; depth++) deepInput = { nested: deepInput };
  const poisonedResult = name => ({ ...resultInput('exclusive', 'review', originalClaim, `poison-${name}`),
    content: JSON.stringify({ decision: 'Superseded evidence' }), disposition: 'superseded' });
  const shapes = [
    { name: 'objectInput', type: 'request', body: JSON.stringify({ ...poisonRequest('objectInput'), input: { raw: 'object' } }), code: 'assert:collab_json_fields' },
    { name: 'objectContent', type: 'result', signer: winner, taskId: 'exclusive', slotId: 'review',
      body: JSON.stringify({ ...poisonedResult('objectContent'), content: { raw: 'object' } }), code: 'assert:collab_json_fields' },
    { name: 'objectSource', type: 'message', body: JSON.stringify({ messageId: 'poison-objectSource', text: 'Malformed source', source: { raw: 'object' } }), code: 'assert:collab_json_fields' },
    { name: 'deepInput', type: 'request', body: JSON.stringify({ ...poisonRequest('deepInput'), input: JSON.stringify(deepInput) }), code: 'assert:collab_json_structure' },
    { name: 'duplicateInput', type: 'request', body: JSON.stringify({ ...poisonRequest('duplicateInput'), input: '{"choice":1,"choice":2}' }), code: 'assert:collab_json_structure' },
    { name: 'duplicateDisposition', type: 'result', signer: winner, taskId: 'exclusive', slotId: 'review',
      body: `${JSON.stringify(poisonedResult('duplicateDisposition')).slice(0, -1)},"disposition":"accepted"}`, code: 'assert:collab_json_structure' },
    { name: 'nonfiniteInput', type: 'request', body: JSON.stringify({ ...poisonRequest('nonfiniteInput'), input: '{"unbounded":1e400}' }), code: 'assert:collab_json_structure' },
    { name: 'invalidEnvelope', type: 'request', body: JSON.stringify({ ...poisonRequest('invalidEnvelope'), kind: 42 }), code: 'assert:collab_envelope' },
  ];
  const shapeObservations = [];
  for (const probe of shapes) {
    const id = `poison-${probe.name}`;
    const sql = `INSERT INTO collab_journal (id,sequence,type,task_id,slot_id,author,proposal_id,body)
      SELECT ${quoted(id)},COALESCE(MAX(sequence),0)+1,${quoted(probe.type)},${quoted(probe.taskId ?? id)},${quoted(probe.slotId ?? '')},
        lower(hex(chronolog_actor())),chronolog_transaction_id(),${quoted(probe.body)} FROM collab_journal`;
    const operation = await sessions[probe.signer ?? loser].command('fixture.raw', sql, { operationId: `${id}-operation` });
    const outcome = await operation.materialized({ signal: signal() });
    assert.equal(outcome.outcome, 'rejected', probe.name); assert.equal(outcome.rejectionCode, probe.code, probe.name);
    shapeObservations.push({ name: probe.name, outcome: outcome.outcome, rejectionCode: outcome.rejectionCode });
  }
  assert.equal((await clients[0].inspect('exclusive')).value.results.length, 2);
  const safePreview = await boardClient.snapshot();
  assert.ok(safePreview.value.tasks.every(task => !task.taskId.startsWith('poison-')));
  assert.ok(safePreview.value.messages.every(message => !message.messageId.startsWith('poison-')));
  observed('rawProjectionShapeGuard', { probes: shapeObservations, retainedEvidenceQueryable: true, malformedRecordsRetained: false });

  const scopedMessages = [
    { threadId: 'collision:a', messageId: 'b', text: 'First independently addressed conversation' },
    { threadId: 'collision', messageId: 'a:b', text: 'Second independently addressed conversation' },
  ];
  const scopedFirst = await accepted(clients[0], 'message', scopedMessages[0], 'scope-message-first');
  const scopedSecond = await accepted(clients[0], 'message', scopedMessages[1], 'scope-message-second');
  await accepted(clients[0], 'message', scopedMessages[0], 'scope-message-identical');
  const scopedConflict = await projected(clients[0], 'message', { ...scopedMessages[0], text: 'Changed content under the original scoped identity' }, 'scope-message-conflict');
  assert.equal(scopedConflict.outcome, 'rejected');
  const scopedReader = await captureCollaborationReader(sessions[0]);
  try {
    const first = (await scopedReader.thread({ threadId: scopedMessages[0].threadId })).value.messages;
    const second = (await scopedReader.thread({ threadId: scopedMessages[1].threadId })).value.messages;
    assert.equal(first.length, 1); assert.equal(second.length, 1);
    assert.equal(first[0].text, scopedMessages[0].text); assert.equal(second[0].text, scopedMessages[1].text);
    assertReference(first[0].operation, scopedFirst, sessions[0].identity.publicKey);
    assertReference(second[0].operation, scopedSecond, sessions[0].identity.publicKey);
    observed('compositeDomainIdentities', { threads: scopedMessages.map(value => value.threadId),
      messageIds: scopedMessages.map(value => value.messageId), retainedPerThread: [first.length, second.length],
      exactRetryIdempotent: true, changedContentRejected: true, originalSignedReferences: true });
  } finally { await scopedReader.close(); }

  await accepted(clients[0], 'request', request('round', [sessions[3].identity.publicKey, sessions[4].identity.publicKey], 'allSlots'), 'round-request');
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
  const unauthorizedClaim = await projected(clients[5], 'claim', claimInput('round', 'review-1', 5), 'unassigned-provider-claim');
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

  await accepted(clients[0], 'request', request('cancel-me', [sessions[3].identity.publicKey]), 'cancel-request');
  await accepted(clients[3], 'claim', claimInput('cancel-me', 'review', 3), 'cancel-claim');
  const cancelling = (await clients[0].inspect('cancel-me')).value;
  await accepted(clients[0], 'cancel', { taskId: 'cancel-me', actionId: 'request-cancel',
    expectedVersion: cancelling.task.version, reason: 'Changed requirements' }, 'cancel-operation');
  assert.equal((await clients[0].inspect('cancel-me')).value.task.status, 'cancelRequested');
  const cancelClaim = cancelling.claims[0];
  await accepted(clients[3], 'acknowledgeCancel', { taskId: 'cancel-me', slotId: 'review', actionId: 'ack-cancel',
    claimEpoch: cancelClaim.claimEpoch, claimProposalId: cancelClaim.claimProposalId, runId: cancelClaim.runId,
    endpointIncarnation: cancelClaim.endpointIncarnation }, 'cancel-ack-operation');
  assert.equal((await clients[0].inspect('cancel-me')).value.task.status, 'cancelled');
  observed('cancellationAcknowledgment', { requested: 'cancelRequested', acknowledged: 'cancelled', effectsRecalled: false });

  for (const suffix of ['a', 'b']) await accepted(boardClient, 'message', {
    threadId: 'paged-conversation', messageId: `paged-${suffix}`, text: `Captured message ${suffix}`,
  }, `paged-message-${suffix}`);
  const heldReader = await captureCollaborationReader(board);
  let heldObservation;
  try {
    const first = await heldReader.tasks({ limit: 2 }); assert.equal(first.value.page.hasMore, true);
    const firstThread = await heldReader.thread({ threadId: 'paged-conversation', limit: 1 });
    const firstEvidence = await heldReader.results({ taskId: 'exclusive', limit: 1 });
    assert.equal(firstThread.value.page.hasMore, true); assert.equal(firstEvidence.value.page.hasMore, true);
    const acceptedSummary = (await heldReader.inspect('round')).value.acceptedResults;
    assert.deepEqual(acceptedSummary.map(result => result.resultId).sort(), resultIds.slice().sort());
    assert.ok(acceptedSummary.every(result => !Object.hasOwn(result, 'content') && result.operation.applicationId === applicationId));
    await accepted(clients[0], 'request', request('after-capture', [sessions[4].identity.publicKey]), 'after-capture-request');
    await accepted(clients[0], 'message', { threadId: 'paged-conversation', messageId: 'paged-later', text: 'Written after capture' }, 'paged-message-later');
    await synchronize();
    const tasks = first.value.tasks.map(task => task.taskId); let taskCursor = first.value.page.nextCursor;
    while (taskCursor) {
      const page = await heldReader.tasks({ limit: 2, cursor: taskCursor });
      assert.deepEqual(page.revision, first.revision); assert.equal(page.value.page.total, first.value.page.total);
      tasks.push(...page.value.tasks.map(task => task.taskId)); taskCursor = page.value.page.nextCursor;
    }
    assert.equal(tasks.length, first.value.page.total); assert.equal(new Set(tasks).size, tasks.length);
    assert.equal(tasks.includes('after-capture'), false);
    const secondThread = (await heldReader.thread({ threadId: 'paged-conversation', limit: 1, cursor: firstThread.value.page.nextCursor })).value;
    assert.deepEqual([...firstThread.value.messages, ...secondThread.messages].map(message => message.messageId), ['paged-a', 'paged-b']);
    const secondEvidence = (await heldReader.results({ taskId: 'exclusive', limit: 1, cursor: firstEvidence.value.page.nextCursor })).value;
    assert.deepEqual([...firstEvidence.value.results, ...secondEvidence.results].map(result => result.disposition).sort(), ['accepted', 'superseded']);
    await assert.rejects(heldReader.thread({ threadId: 'different-thread', cursor: firstThread.value.page.nextCursor }), { code: 'CURSOR_RESET_REQUIRED' });
    await assert.rejects(heldReader.results({ taskId: 'round', cursor: firstEvidence.value.page.nextCursor }), { code: 'CURSOR_RESET_REQUIRED' });
    const latest = await captureCollaborationReader(board);
    try {
      await assert.rejects(latest.tasks({ limit: 2, cursor: first.value.page.nextCursor }), { code: 'CURSOR_RESET_REQUIRED' });
      assert.equal((await latest.tasks({ limit: 2 })).value.page.total, tasks.length + 1);
      assert.equal((await latest.thread({ threadId: 'paged-conversation' })).value.messages.length, 3);
    } finally { await latest.close(); }
    heldObservation = { heldTaskCount: tasks.length, visibleTaskLimit: 2, stableAcrossWrites: true,
      noDuplicatesOrOmissions: true, completeAcceptedSummaries: acceptedSummary.length,
      acceptedSummaryContentOmitted: true, staleCursorRejected: true, wrongThreadRejected: true, wrongTaskRejected: true,
      capturedMessages: 2, latestMessages: 3, acceptedAndLateEvidenceRetained: true };
  } finally { await heldReader.close(); }
  await assert.rejects(heldReader.tasks(), { code: 'COLLABORATION_READER_CLOSED' });
  observed('boundedCapturedPages', { ...heldObservation, releasedReaderRejected: true });

  // Exercise the observing reviewer, including an admission failure that becomes
  // eligible later. A failed attempt must neither hot-loop nor permanently hide
  // work after another completed claim frees this signer's bounded capacity.
  const quotaTasks = Array.from({ length: 4 }, (_, index) => `held-capacity-${index}`);
  for (const taskId of quotaTasks) {
    await accepted(clients[0], 'request', request(taskId, [sessions[4].identity.publicKey]), `${taskId}-request`);
    await accepted(clients[4], 'claim', claimInput(taskId, 'review', 4), `${taskId}-claim`);
  }
  await accepted(clients[0], 'request', request('waiting-capacity', [sessions[4].identity.publicKey]), 'waiting-capacity-request');
  // The worker lives until stopped or its session closes; each awaited reviewer phase has its own
  // 45 s deadline, so the driver's own commands and heavy syncs never consume the reviewer's budget.
  const stopped = new AbortController(), lifetime = stopped.signal;
  const reviewerPhase = (work, label) => awaitPhase(work, { milliseconds: 45_000, abort: error => stopped.abort(error),
    label: () => `${label} (after stage ${context.stage}; operation ${context.operation ?? 'none'}; ${Math.round(performance.now() - startedAt)} ms since start)` });
  note('observing reviewer started');
  const blocked = Promise.withResolvers(), completed = Promise.withResolvers();
  void completed.promise.catch(() => undefined);
  const outcomes = [];
  const reviewer = runReviewer({ session: sessions[4], endpoint: endpoint(4), runId: 'observing-reviewer-b', policy: 'clarity', signal: lifetime,
    onResult(value) {
      note(`reviewer ${value.taskId}/${value.slotId} ${value.status}`);
      if (value.taskId !== 'waiting-capacity') return;
      outcomes.push(value.status);
      if (value.status === 'claim-conflict') blocked.resolve(value);
      if (value.status === 'accepted') completed.resolve(value);
    } });
  void reviewer.catch(error => { blocked.reject(error); completed.reject(error); });
  try {
    const refused = await reviewerPhase(blocked.promise, 'observing reviewer refusing waiting-capacity at the claim limit');
    assert.equal(refused.operation.outcome, 'rejected');
    assert.equal((await clients[0].inspect('waiting-capacity')).value.claims.length, 0);
    const occupied = (await clients[4].inspect(quotaTasks[0])).value.claims[0];
    await accepted(clients[4], 'result', resultInput(quotaTasks[0], 'review', occupied, 'released-capacity-result'), 'released-capacity-result-operation');
    note('release accepted; observing reviewer completion phase starts');
    const finished = await reviewerPhase(completed.promise, 'observing reviewer completing waiting-capacity after capacity release');
    assert.equal(finished.result.disposition, 'accepted'); assert.equal(finished.result.content.policy, 'clarity');
    assert.deepEqual(outcomes, ['claim-conflict', 'accepted']);
    observed('reviewerCapacityRecovery', { activeClaimsAtStart: 4, rejectedBeforeRelease: true,
      acceptedAfterRelease: true, targetOutcomes: outcomes, resultId: finished.result.resultId, externalEffects: false });
  } finally {
    stopped.abort();
    await reviewer.catch(error => { if (error !== lifetime.reason && error.name !== 'AbortError') throw error; });
  }

  const time=BigInt(Date.now())+1_000_000n;
  const lateRequest=await clients[0].request(request('late-claim',[sessions[3].identity.publicKey,sessions[4].identity.publicKey]),{operationId:'late-claim-request',authorTimestampMs:time});
  await lateRequest.materialized();await synchronize();await disconnect();
  const laterClaim=await clients[3].claim(claimInput('late-claim','review',3),{operationId:'later-claim',authorTimestampMs:time+30n});
  assert.equal((await laterClaim.materialized()).outcome,'accepted');
  const originalFence=(await clients[3].inspect('late-claim')).value.claims[0];
  const originalResult=await clients[3].result(resultInput('late-claim','review',originalFence,'later-result'),{operationId:'later-result',authorTimestampMs:time+40n});
  assert.equal((await originalResult.materialized()).outcome,'accepted');
  const lateCaptured=await clients[3].capture(),before=(await lateCaptured.inspect('late-claim')).value;
  const earlierClaim=await clients[4].claim(claimInput('late-claim','review',4),{operationId:'earlier-claim',authorTimestampMs:time+20n});
  assert.equal((await earlierClaim.materialized()).outcome,'accepted');await connect(0);
  const after=(await clients[0].inspect('late-claim')).value;
  const changed=await laterClaim.inspect(),changedResult=await originalResult.inspect();
  assert.equal(after.claims[0].claimant,sessions[4].identity.publicKey);assert.equal(changed.materialized.outcome,'rejected');assert.equal(changedResult.materialized.outcome,'rejected');
  assert.deepEqual((await lateCaptured.inspect('late-claim')).value,before);assert.notEqual(lateCaptured.revision.digest,changed.materialized.revision.digest);await lateCaptured.close();
  observed('lateClaimRevision',{before:before.claims[0].claimProposalId,after:after.claims[0].claimProposalId,
    revisionBefore:before.task.revision.digest,revisionAfter:after.task.revision.digest,revisedOriginalOutcome:changed.materialized.outcome,capturedStable:true,originalProposalId:laterClaim.proposalId});
  await assert.rejects(laterClaim.finalized(),error=>(error.code??error.message)==='FINALITY_UNSUPPORTED');
  observed('independentFinalityFacts',{stored:changed.stored,materialized:true,finalized:changed.finalized,finalityWait:'FINALITY_UNSUPPORTED',agentRequired:false});
  observed('signedOperationLineage',{references:verifiedReferences,bodyReferenceIgnored:true,sourceSignerForced:true});
  await synchronize();await disconnect();
  const retainedOperation=await originalResult.inspect();
  const signerBefore=sessions[3].identity.publicKey,storageBefore=sessions[3].device.storageId;
  const operationBefore=await (await sessions[3].operations.get(retainedOperation.proposalId)).inspect();await sessions[3].close();
  const reopened=await measure('reopenedMs',async()=>{const reopenedDevice=await openNativeDevice({path:stores[3]});resources.push(reopenedDevice);return open(reopenedDevice,3);});
  const operationAfter=await (await reopened.operations.get(retainedOperation.proposalId)).inspect();
  assert.equal(reopened.identity.publicKey,signerBefore);assert.equal(reopened.device.storageId,storageBefore);
  // Opening schedules replay; a coherent read proves the retained outcome is current before comparing.
  const reopenedView=await reopened.readView();await reopenedView.release();
  const reloaded=await (await reopened.operations.get(retainedOperation.proposalId)).inspect();
  assert.equal(reloaded.proposalId,operationBefore.proposalId);assert.equal(reloaded.authorTimestampMs,operationBefore.authorTimestampMs);assert.deepEqual(reloaded.materialized,operationBefore.materialized);
  observed('operationIdentityAfterReopen',{signerBefore,signerAfter:reopened.identity.publicKey,storageBefore,storageAfter:reopened.device.storageId,operationBefore,operationAfter:reloaded,epochKeysProvided:false});

  const local = memoryStorage();
  const a = createViewStore({ storage: local, applicationId, profileId: signerBefore, viewId: 'view-a' });
  const b = createViewStore({ storage: local, applicationId, profileId: signerBefore, viewId: 'view-b' });
  a.writeDraft({ text: 'Unsent board draft' }); b.writeDraft({ text: 'Unsent discussion draft' });
  assert.equal(a.readDraft().text, 'Unsent board draft'); assert.equal(b.readDraft().text, 'Unsent discussion draft');
  observed('independentDrafts', { views: ['view-a', 'view-b'], draftsPreserved: true });
  const reference = { applicationId, author: signerBefore, operationId: retainedOperation.operationId, proposalId: retainedOperation.proposalId };
  a.retainOperation(reference); b.retainOperation(reference); a.removeOperation(reference);
  assert.equal(a.pending().length, 0); assert.equal(b.pending().length, 1);
  assert.deepEqual(b.pending()[0].reference, reference);
  assert.throws(() => b.retainOperation({ ...reference, applicationId: 'f'.repeat(64) }), { code: 'OPERATION_SCOPE_MISMATCH' });
  await assert.rejects(clients[0].inspectOperation({ ...reference, applicationId: 'f'.repeat(64) }), { code: 'OPERATION_SCOPE_MISMATCH' });
  await assert.rejects(clients[0].retry(reference), { code: 'ORIGINAL_SIGNER_REQUIRED' });
  observed('independentPendingReferences', { firstViewReferences: a.pending().length, secondViewReferences: b.pending().length,
    originalOperationId: reference.operationId, foreignApplicationRejected: true, foreignSignerRetryRejected: true, journalChanged: false });
  report.passed = true;
} catch (error) {
  report.passed = false; report.error = error instanceof Error ? error.stack ?? error.message : String(error);
  // The original error remains primary; context is evidence beside it.
  report.errorContext = { elapsedMs: Math.round(performance.now() - startedAt), afterStage: context.stage,
    msIntoNextStage: Math.round(performance.now() - context.stageStartedAt), operation: context.operation, recentEvents: context.events };
  console.error('Consumer error context', JSON.stringify(report.errorContext));
  throw error;
} finally {
  memory.push(process.memoryUsage());
  const usage = process.resourceUsage();
  report.measurements = { scope: 'one local Node process; eight retained signers; 32 real MessagePort attachments; no Internet latency claim',
    elapsedMs: performance.now() - startedAt,
    definitions: { commandMaterializedMs: 'client command start through local materialized observation; revisions remain provisional, including rejected commands',
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
