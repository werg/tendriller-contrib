// Runs from a fresh directory containing only the installed public archive.
// Faults affect transport/control availability; the application owns no outbox.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  AbandonedOperationError, applicationDescriptionDigest, bytesDigest,
  createGenerationRegistry, createParticipantResponse, createParticipantTransport,
  describeApplication, eventExecutionManifest, validateParticipantRequest,
  executionManifestArtifacts, participantGrant, peerDigest, signApplicationDescriptor, signControlRevision, signTransitionRequest,
} from '@chronolog/peer-session';
import { openNativeApplication, openNativeDevice } from '@chronolog/peer-session/native';
import { conversation, conversationCounts } from './peer-generation-definition.mjs';
import { isNextPublishedCommand } from './peer-generation-fault.mjs';

export async function runPeerGenerationScenario({ path, connectSessions, qualifyParticipation, createControl = createPortableControl }) {
  const reportPath = resolve(path);
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  const storeRoot = join(dirname(reportPath), 'stores');
  await mkdir(storeRoot);
  const sessions = new Set(), devices = new Set(), links = new Set();
  const timeout = () => AbortSignal.timeout(15_000);
  const checkpoint = async name => {
    report.stage = name;
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Peer-generation consumer: ${name}`);
  };
  const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const database = name => join(storeRoot, name, 'device.sqlite');
  const openDevice = async (name, create = false) => {
    const device = await openNativeDevice({ path: database(name), ...(create ? { create: true } : {}) });
    devices.add(device); return device;
  };
  let authority, host;
  const epochKey = new Uint8Array(randomBytes(32)), epochKeys = new Map([[0, epochKey]]);
  const open = async (device, selected = authority) => {
    const session = await openNativeApplication({ device, authority: selected, epochKeys, definition: conversation });
    sessions.add(session); return session;
  };
  const connect = async (a, b) => { const link = await connectSessions(a, b); links.add(link); return link; };
  const query = session => session.query('conversation', {});
  const counts = (session, version = conversationCounts.version) => {
    let calls = 0;
    const projection = session.project({ ...conversationCounts, version,
      reduce(state, event) { calls++; return conversationCounts.reduce(state, event); } });
    return { projection, get calls() { return calls; } };
  };
  const post = async (session, operationId, text, basedOn) => {
    const operation = await session.command('postMessage', { messageId: operationId, text }, {
      operationId, ...(basedOn === undefined ? {} : { basedOn }),
    });
    const applied = await operation.applied({ signal: timeout() });
    assert.equal(applied.outcome, 'accepted');
    return { operation, applied };
  };

  try {
    const hostDevice = await openDevice('control', true);
    const [deviceA, deviceB, deviceC, deviceD, deviceE] = await Promise.all(['a', 'b', 'c', 'd', 'e'].map(name => openDevice(name, true)));
    await assert.rejects(openNativeDevice({ path: database('a') }), /BYTES_STORE_IN_USE/);
    await assert.rejects(openNativeDevice({ path: database('missing') }), /APPLICATION_DEVICE_NOT_FOUND/);
    report.nativeOwnership = { secondOwnerRefused: true, implicitIdentityCreationRefused: true };
    const applicationId = randomBytes(32).toString('hex');
    const execution = await executionManifestArtifacts(await eventExecutionManifest());
    const definition = describeApplication(conversation);
    host = await createControl({ applicationId, hostDevice,
      configuration: {
        historyId: 'independent-peer-conversation',
        executionManifestDigest: Buffer.from(execution.executionManifestDigest).toString('hex'),
        definition,
        schemaAdministrator: hostDevice.identity.publicKey, schema: null,
        epoch: 0, keyDigest: await bytesDigest(epochKey),
        members: [deviceA, deviceB, deviceC, deviceD, deviceE].map(device => ({ grant: participantGrant(device.identity.publicKey, {
          dataRole: 'member', administrator: [deviceA, deviceB, deviceD].includes(device), publisher: device === deviceA,
        }) })),
      },
    });
    const descriptor = host.descriptor;
    if (host.qualifyParticipant) report.host.participant = await host.qualifyParticipant();
    const transition = async (requester, coordinator, expectedGeneration, base, transitionId, reason = 'takeover') => signTransitionRequest({
      applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
      transitionId, expectedGeneration, coordinator: coordinator.identity.publicKey, requester: requester.identity.publicKey,
      controlRevision: 0, reason, base,
    }, requester.identity);
    const g1 = await host.select(await transition(deviceA, deviceA, null, null, 'create', 'create'));
    authority = await host.read();
    let a = await open(deviceA), b = await open(deviceB);
    let loseControlReply = false;
    const transitionExchanges = [];
    const beforeAttach = await host.traffic();
    const aControl = a.connectControlParticipant({ exchange: host.exchange });
    const bControl = b.connectControlParticipant({ exchange: async (request, options) => {
      const response = await host.exchange(request, options);
      if (request.facet === 'control' && request.action === 'select') {
        transitionExchanges.push({ request: structuredClone(request.payload.request), selected: response.payload.id });
        if (loseControlReply) { loseControlReply = false; throw Error('CONTROL_REPLY_LOST_AFTER_SELECTION'); }
      }
      return response;
    } });
    const afterAttach = await host.traffic();
    assert.equal(afterAttach.requests, beforeAttach.requests, 'Attaching the control participant must not contact the host');
    assert.equal(aControl.role, 'control');
    assert.equal(bControl.policy.role, 'control');
    assert.deepEqual((await aControl.definition()).definition, definition);
    report.controlParticipant = { owner: 'application-session', role: aControl.role,
      attachRequests: afterAttach.requests - beforeAttach.requests, definitionVerified: true };
    if (host.qualifyPublication) report.host.publication = await host.qualifyPublication({
      control: aControl, signer: deviceA.identity, reader: deviceB.identity,
    });
    assert.equal(a.status.role, 'coordinator');
    assert.equal(b.status.role, 'follower');
    assert.equal(a.describe().capabilities.finality, false);
    assert.equal(a.describe().capabilities.automaticExternalEffects, false);
    report.executionManifestDigest = descriptor.payload.executionManifestDigest;
    await checkpoint('opened independent native sessions');
    let projected = counts(a);
    const emptyProjection = await projected.projection.read();
    assert.deepEqual(emptyProjection.state, { messages: 0 });
    await post(a, 'anchor-a', 'A retained message');
    const firstProjection = await projected.projection.read();
    assert.equal(firstProjection.state.messages, 1); assert.equal(projected.calls, 1);
    assert.deepEqual(await projected.projection.read(), firstProjection);
    assert.equal(projected.calls, 1, 'An unchanged projection read must not replay history');
    report.projection = { owner: 'application-session', id: conversationCounts.id, version: conversationCounts.version,
      first: firstProjection, initialReducerCalls: 1, unchangedReadReducerCalls: 0 };
    let ab = await connect(a, b);

    // Only reply-lost is submitted after this point. Ignore repeated coverage
    // invalidations, then cut at its durable publication before the order reply.
    const beforeLostReply = (await a.recoveryPoint()).point;
    const watchAbort = new AbortController();
    const updates = a.changes({ signal: AbortSignal.any([watchAbort.signal, timeout()]) })[Symbol.asyncIterator]();
    await updates.next();
    const cut = (async () => {
      for (;;) {
        const update = await updates.next();
        assert.equal(update.done, false);
        if (!isNextPublishedCommand(update.value, beforeLostReply)) continue;
        // No awaited query/get here: close fences both transport owners before
        // the coordinator's order-result continuation can transmit its reply.
        await ab.close();
        return;
      }
    })();
    const lost = await b.command('postMessage', { messageId: 'reply-lost', text: 'Stored before a lost reply' }, { operationId: 'reply-lost' });
    await cut;
    watchAbort.abort();
    await updates.return?.();
    assert.equal((await query(a)).value.messages.some(message => message.operationId === 'reply-lost'), true);
    assert.equal((await lost.get()).status, 'saved', 'Fault must actually lose the follower result');
    const orderedBeforeRetry = await a.recoveryPoint();
    ab = await connect(a, b);
    await lost.retry();
    const recoveredReply = await lost.applied({ signal: timeout() });
    const retained = await lost.shared({ signal: timeout() });
    assert.ok(retained.some(value => value.payload.peer !== b.deviceId && value.payload.storageId !== deviceB.storageId));
    report.retention = { peers: retained.map(value => value.payload.peer), storageIds: retained.map(value => value.payload.storageId) };
    const orderedAfterRetry = await a.recoveryPoint();
    await assert.rejects(b.command('postMessage', { messageId: 'reply-lost', text: 'Different intent under the same ID' }, { operationId: 'reply-lost' }));
    assert.equal(recoveredReply.operationId, 'reply-lost');
    assert.deepEqual(orderedAfterRetry, orderedBeforeRetry);
    report.lostReply = {
      injectedAfterPersistence: true, originalOperationId: 'reply-lost', retriedOperationId: recoveredReply.operationId,
      originalReceipt: orderedBeforeRetry.receipt, retriedReceipt: orderedAfterRetry.receipt,
      orderedRecords: { before: orderedBeforeRetry.point.sequence, after: orderedAfterRetry.point.sequence },
    };

    await checkpoint('recovered exact operation after lost reply');

    // Bootstrap/control calls are counted separately. The public session receives
    // cached verified authority and must never invoke this host while commanding.
    await host.block(true);
    await assert.rejects(bControl.application(), /CONTROL_HOST_UNAVAILABLE/);
    const hostBefore = await host.traffic();
    const transportBefore = await ab.inspect?.();
    await post(a, 'host-blocked-a', 'A continues without host access');
    await post(b, 'host-blocked-b', 'B continues through its coordinating peer');
    await ab.synchronize();
    const signalAbort = new AbortController();
    const live = b.signals.subscribe({ topics: ['typing'], signal: AbortSignal.any([signalAbort.signal, timeout()]) })[Symbol.asyncIterator]();
    const nextLive = live.next();
    const beforeLive = await a.recoveryPoint();
    await a.signals.send('typing', { typing: true }, { ttlMs: 2500 });
    assert.equal((await nextLive).value.payload.typing, true);
    signalAbort.abort(); await live.return?.();
    assert.deepEqual(await a.recoveryPoint(), beforeLive, 'Live signals must not append history');
    assert.deepEqual((await query(a)).value, (await query(b)).value);
    const hostAfter = await host.traffic();
    report.hostOutage = { boundary: host.boundary, blocked: true, blockedProbeRejected: true,
      commandsApplied: 2, requests: { before: hostBefore.requests, after: hostAfter.requests },
      applicationBodyBytes: { before: hostBefore.applicationBodyBytes, after: hostAfter.applicationBodyBytes },
      observations: { before: hostBefore, after: hostAfter }, finalityCapability: a.capabilities.finality,
      liveSignalsObserved: 1, peerReplicationObserved: true,
      ...(transportBefore === undefined ? {} : { transport: { before: transportBefore, after: await ab.inspect() } }) };

    await checkpoint('continued with control host blocked');
    await host.block(false);
    const retainedOperation = await b.operations.get('reply-lost');
    const adopted = await b.recoveryPoint();
    // D retains this complete ancestor, but receives no later application bytes.
    // Signed newer authority alone must not make an incomplete view readable.
    const d = await open(deviceD), ad = await connect(a, d);
    await ad.synchronize(); await ad.close();
    const ancestor = await d.recoveryPoint(), ancestorView = await query(d);
    assert.deepEqual(ancestor, adopted);
    const ancestorOperation = await d.operations.get('reply-lost', { author: b.deviceId });
    await ab.close();
    await post(a, 'abandoned-a', 'Recent message that B has not retained');
    const excludedView = (await query(a)).revision;
    await post(a, 'isolated-a', 'An additional isolated old-branch message');
    const oldHead = await a.recoveryPoint();
    report.projection.excluded = await projected.projection.read();
    assert.equal(report.projection.excluded.state.messages, (await query(a)).value.messages.length);
    assert.ok(oldHead.point.sequence > adopted.point.sequence);
    const previousTail = await a.operations.get('abandoned-a');
    const priorIdentity = a.deviceId;
    await a.close(); sessions.delete(a);
    await rename(join(storeRoot, 'a'), join(storeRoot, 'a-offline'));

    // Discard the persisted selection at the transport boundary. The session
    // journal must retain the exact signed request and retry its original base.
    loseControlReply = true;
    await assert.rejects(b.recovery.takeover(bControl, { transitionId: 'takeover-b' }), /CONTROL_REPLY_LOST_AFTER_SELECTION/);
    const savedTransition = (await b.recovery.inspect()).find(value => value.request.payload.transitionId === 'takeover-b');
    assert.ok(savedTransition);
    assert.equal(savedTransition.selected, null);
    assert.deepEqual(savedTransition.request.payload.base, adopted);
    const reset = await b.recovery.takeover(bControl, { transitionId: 'takeover-b' });
    authority = await bControl.application();
    const selected = authority.generations.at(-1);
    const retriedTransition = (await b.recovery.inspect()).find(value => value.request.payload.transitionId === 'takeover-b');
    assert.deepEqual(retriedTransition.request, savedTransition.request);
    assert.equal(retriedTransition.selected, selected.id);
    assert.equal(transitionExchanges.length, 2);
    assert.deepEqual(transitionExchanges[0], transitionExchanges[1]);
    report.controlParticipant.recovery = { injectedAfterSelection: true, journalSavedBeforeRetry: true,
      originalRequest: hash(savedTransition.request), retriedRequest: hash(retriedTransition.request),
      originalSelection: transitionExchanges[0].selected, retriedSelection: transitionExchanges[1].selected,
      recoveryNoticeObserved: reset !== null };
    assert.ok(reset);
    assert.equal(reset.generation, selected.id);
    assert.deepEqual(await b.operations.get('reply-lost'), retainedOperation);
    const coherentB = await query(b);
    assert.equal(coherentB.revision.generation, selected.id);
    assert.equal(coherentB.value.messages.some(message => message.operationId === 'abandoned-a'), false);
    await checkpoint('selected older prefix on survivor');
    const c = await open(deviceC);
    const cControl = c.connectControlParticipant({ exchange: host.exchange });
    const bc = await connect(b, c);
    await bc.synchronize();
    const coherentC = await query(c);
    assert.deepEqual(coherentC.value, coherentB.value);

    await rename(join(storeRoot, 'a-offline'), join(storeRoot, 'a'));
    const returningDevice = await openDevice('a');
    a = await open(returningDevice, { ...authority, generations: authority.generations.slice(0, 1) });
    assert.equal(a.deviceId, priorIdentity);
    projected = counts(a);
    const persistedProjection = await projected.projection.read();
    assert.deepEqual(persistedProjection.state, report.projection.excluded.state);
    assert.equal(projected.calls, 0, 'Reopening must reuse the persisted projection checkpoint');
    report.projection.excludedCheckpointReopened = true;
    const beforeReturn = await query(b);
    const notice = await a.adopt(authority);
    assert.ok(notice.abandoned.some(value => value.operationId === 'abandoned-a'));
    assert.deepEqual((await a.operations.get('abandoned-a')).previous, previousTail);
    await assert.rejects(a.retry('abandoned-a'), error => error instanceof AbandonedOperationError);
    ab = await connect(a, b);
    await ab.synchronize();
    const afterReturn = await query(b);
    assert.deepEqual(afterReturn.value, beforeReturn.value);
    assert.equal((await a.operations.get('abandoned-a')).status, 'abandoned');
    const recoveredProjection = await projected.projection.read();
    assert.equal(recoveredProjection.reset.reason, 'recovery');
    assert.deepEqual(recoveredProjection.reset.previousRevision, report.projection.excluded.revision);
    assert.equal(recoveredProjection.state.messages, beforeReturn.value.messages.length);
    assert.ok(recoveredProjection.state.messages < report.projection.excluded.state.messages);
    report.projection.recovered = recoveredProjection;
    report.recovery = {
      previousGeneration: g1.id, selectedGeneration: selected.id,
      previousHead: oldHead.point.sequence, adoptedPosition: adopted.point.sequence,
      sourceRemoved: true, coherentReset: true, recoveredDigest: hash(coherentB.value), freshPeerDigest: hash(coherentC.value),
      inheritedOperationIds: ['reply-lost'], abandonedOperationIds: notice.abandoned.map(value => value.operationId),
      inheritedIdentityPreserved: true, abandonedEvidencePreserved: true, unknownLoss: reset.unknownLoss,
    };
    report.returningBranch = {
      generationBefore: beforeReturn.revision.generation, generationAfter: afterReturn.revision.generation,
      digestBefore: hash(beforeReturn.value), digestAfter: hash(afterReturn.value),
      oldAttemptReadmitted: false, excludedAncestorReadopted: false, thirdGenerationChecked: false,
    };

    await checkpoint('isolated returning abandoned branch');

    // Review both the input and current view. The old branch's captured revision
    // cannot be reused as if its abandoned preconditions were still current.
    await assert.rejects(a.reapply('abandoned-a', 'postMessage', { messageId: 'reapply-invalid', text: '' }, {
      operationId: 'reapply-invalid', basedOn: (await query(a)).revision,
    }), /APPLICATION_INPUT_INVALID/);
    await assert.rejects(a.reapply('abandoned-a', 'postMessage', { messageId: 'reapply-stale', text: 'Reviewed message' }, {
      operationId: 'reapply-stale', basedOn: excludedView,
    }));
    const reread = await query(a);
    const reapplied = await a.reapply('abandoned-a', 'postMessage', { messageId: 'reapplied-a', text: 'Reviewed message' }, {
      operationId: 'reapplied-a', basedOn: reread.revision,
    });
    const reappliedResult = await reapplied.applied({ signal: timeout() });
    assert.equal(reappliedResult.outcome, 'accepted');
    const inspected = await a.operations.inspect('reapplied-a');
    report.reapply = { originalOperationId: 'abandoned-a', newOperationId: reappliedResult.operationId,
      originalAttemptId: previousTail.attemptId, newAttemptId: reappliedResult.attemptId,
      reapplyOf: inspected.attempt.payload.header.reapplyOf, outcome: reappliedResult.outcome, currentGuardsChecked: true };

    await bc.synchronize();
    await assert.rejects(host.select(await transition(deviceC, deviceC, selected.id, oldHead, 'resurrect-old-tail')),
      /PEER_PREFIX_EXCLUDED/);
    await c.recovery.takeover(cControl, { transitionId: 'takeover-c' });
    authority = await cControl.application();
    const third = authority.generations.at(-1);
    await b.adopt(authority); await a.adopt(authority);
    assert.equal(third.payload.number, 2);
    assert.equal((await a.operations.get('abandoned-a')).status, 'abandoned');
    assert.deepEqual(await a.operations.get('reapplied-a'), reappliedResult);
    report.returningBranch.thirdGenerationChecked = true;
    report.returningBranch.thirdGeneration = third.id;

    const beforeReopen = await a.operations.get('reapplied-a');
    const projectionBeforeReopen = await projected.projection.read();
    assert.equal(projectionBeforeReopen.state.messages, (await query(a)).value.messages.length);
    const identityBefore = a.deviceId;
    await a.close(); sessions.delete(a);
    const reopened = await open(await openDevice('a'));
    assert.equal(reopened.deviceId, identityBefore);
    const afterReopen = await reopened.operations.get('reapplied-a');
    assert.deepEqual(afterReopen, beforeReopen);
    report.reopen = { identityBefore, identityAfter: reopened.deviceId, operationBefore: beforeReopen, operationAfter: afterReopen };
    projected = counts(reopened);
    const projectionAfterReopen = await projected.projection.read();
    assert.deepEqual(projectionAfterReopen.state, projectionBeforeReopen.state);
    assert.equal(projectionAfterReopen.reset, null); assert.equal(projected.calls, 0);
    report.projection.reopened = { before: projectionBeforeReopen, after: projectionAfterReopen, reducerCalls: projected.calls };
    await projected.projection.close();
    projected = counts(reopened, '2');
    const revisedProjection = await projected.projection.read();
    assert.equal(revisedProjection.reset.reason, 'definition');
    assert.deepEqual(revisedProjection.state, projectionAfterReopen.state);
    assert.equal(projected.calls, revisedProjection.state.messages);
    report.projection.definitionReset = { snapshot: revisedProjection, reducerCalls: projected.calls };
    await Promise.all([...links].map(link => link.close()));

    // The selected G3 includes G2's body, which D never received. The session
    // must propose its complete G1 ancestor, without exposing a partial G3 view
    // or allowing a planned handover to use that fallback.
    await c.close(); sessions.delete(c);
    let loseAncestorReply = true;
    const ancestorExchanges = [];
    const dControl = d.connectControlParticipant({ exchange: async (request, options) => {
      const response = await host.exchange(request, options);
      if (request.facet === 'control' && request.action === 'select') {
        ancestorExchanges.push({ request: structuredClone(request.payload.request), selected: response.payload.id });
        if (loseAncestorReply) { loseAncestorReply = false; throw Error('ANCESTOR_REPLY_LOST_AFTER_SELECTION'); }
      }
      return response;
    } });
    authority = await dControl.application();
    const observed = authority.generations.at(-1), e = await open(deviceE);
    const eControl = e.connectControlParticipant({ exchange: host.exchange });
    assert.equal(observed.id, third.id);
    await assert.rejects(query(d), /PEER_RECOVERING/);
    await assert.rejects(e.recoveryPoint(), /PEER_RECOVERY_PREFIX_INCOMPLETE/);
    await assert.rejects(d.recovery.handover(dControl, { coordinator: b.deviceId, transitionId: 'incomplete-handover' }), /PEER_RECOVERY_PREFIX_INCOMPLETE/);
    const ancestorProposal = await d.recoveryPoint();
    assert.deepEqual(ancestorProposal, ancestor);
    await assert.rejects(query(d), /PEER_RECOVERING/, 'Inspecting a recovery point cannot publish a partial view');
    const expected = { generation: observed.id, controlRevision: observed.payload.controlRevision, point: ancestor.point };
    await assert.rejects(d.recovery.takeover(dControl, { transitionId: 'ancestor-takeover', expected }), /ANCESTOR_REPLY_LOST_AFTER_SELECTION/);
    const savedAncestor = (await d.recovery.inspect()).find(value => value.request.payload.transitionId === 'ancestor-takeover');
    assert.equal(savedAncestor.selected, null);
    assert.deepEqual(savedAncestor.request.payload.base, ancestor);
    assert.equal(savedAncestor.request.payload.expectedGeneration, observed.id);
    const ancestorNotice = await d.recovery.takeover(dControl, { transitionId: 'ancestor-takeover', expected });
    authority = await dControl.application();
    const ancestorSelected = authority.generations.at(-1);
    const retriedAncestor = (await d.recovery.inspect()).find(value => value.request.payload.transitionId === 'ancestor-takeover');
    assert.deepEqual(retriedAncestor.request, savedAncestor.request);
    assert.equal(ancestorExchanges.length, 2); assert.deepEqual(ancestorExchanges[1], ancestorExchanges[0]);
    assert.deepEqual(ancestorSelected.payload.adopted, ancestor.point);
    assert.equal(ancestorNotice.unknownLoss, true);
    const restoredAncestor = await query(d);
    assert.deepEqual(restoredAncestor.value, ancestorView.value);
    assert.deepEqual(await d.operations.get('reply-lost', { author: b.deviceId }), ancestorOperation);
    assert.equal((await query(d)).value.messages.some(value => ['reapplied-a', 'abandoned-a', 'isolated-a'].includes(value.operationId)), false);

    // E now has the recovered ancestor but misses one new body. Protect that
    // body with an explicit control floor, then check both the owned recovery
    // path and the hosted verifier refuse an otherwise valid older proof.
    const de = await connect(d, e); await de.synchronize(); await de.close();
    const freshAncestor = await query(e);
    assert.deepEqual(freshAncestor.value, restoredAncestor.value);
    await post(d, 'ancestor-resumed', 'Work resumes from the complete inherited ancestor');
    const protectedBase = await d.recoveryPoint(), previousControl = authority.controls.at(-1);
    const floorUpdate = { epoch: previousControl.payload.epoch, keyDigest: previousControl.payload.keyDigest,
      grants: previousControl.payload.grants, recoveryFloor: protectedBase.point };
    const floorRequest = await signTransitionRequest({ applicationId, profile: descriptor.payload.profile,
      policy: descriptor.payload.policy, transitionId: 'protect-recovered-prefix', expectedGeneration: ancestorSelected.id,
      coordinator: deviceD.identity.publicKey, requester: deviceD.identity.publicKey,
      controlRevision: previousControl.payload.revision + 1, reason: 'control-change', base: protectedBase,
    }, deviceD.identity);
    const floorSelected = await host.select(floorRequest, floorUpdate);
    authority = await dControl.application(); await eControl.application();
    assert.deepEqual(authority.controls.at(-1).payload.recoveryFloor, protectedBase.point);
    await assert.rejects(query(e), /PEER_RECOVERING/);
    await assert.rejects(e.recoveryPoint(), /PEER_RECOVERY_FLOOR_UNAVAILABLE/);
    await assert.rejects(e.recovery.takeover(eControl, { transitionId: 'below-floor-owned' }), /PEER_RECOVERY_FLOOR_UNAVAILABLE/);
    assert.deepEqual(await e.recovery.inspect(), []);
    await assert.rejects(host.select(await signTransitionRequest({ applicationId, profile: descriptor.payload.profile,
      policy: descriptor.payload.policy, transitionId: 'below-floor-hosted', expectedGeneration: floorSelected.id,
      coordinator: deviceE.identity.publicKey, requester: deviceE.identity.publicKey,
      controlRevision: floorSelected.payload.controlRevision, reason: 'takeover', base: ancestor,
    }, deviceE.identity)), /PEER_RECOVERY_FLOOR_UNAVAILABLE/);
    assert.equal((await host.read()).generations.at(-1).id, floorSelected.id);
    report.inheritedRecovery = { owner: 'application-session', previousGeneration: observed.id,
      previousNumber: observed.payload.number, ancestorNumber: g1.payload.number, ancestor: ancestor.point,
      selectedGeneration: ancestorSelected.id, selectedNumber: ancestorSelected.payload.number, adopted: ancestorSelected.payload.adopted,
      sourceRemoved: true, incompleteViewRejected: true, proposalDidNotPublishView: true, emptyPeerRejected: true,
      plannedHandoverRejected: true, originalRequest: hash(savedAncestor.request), retriedRequest: hash(retriedAncestor.request),
      expectedGeneration: savedAncestor.request.payload.expectedGeneration, journalSavedBeforeRetry: savedAncestor.selected === null,
      originalSelection: ancestorExchanges[0].selected, retriedSelection: ancestorExchanges[1].selected,
      retainedDigest: hash(ancestorView.value), restoredDigest: hash(restoredAncestor.value), freshPeerDigest: hash(freshAncestor.value),
      inheritedOperationBefore: ancestorOperation, inheritedOperationAfter: await d.operations.get('reply-lost', { author: b.deviceId }),
      excludedSuffixAbsent: true, unknownLoss: ancestorNotice.unknownLoss, commandResumed: true,
      floor: { point: protectedBase.point, selectedGeneration: floorSelected.id, localRejected: true,
        hostRejected: true, journalUnchanged: true, incompleteViewRejected: true } };
    await checkpoint('recovered complete ancestor and enforced its protected floor');
    const observerControl = reopened.connectControlParticipant({ exchange: host.exchange });
    report.participation = await qualifyParticipation({ coordinator: d, follower: b, observer: reopened,
      coordinatorControl: dControl, followerControl: bControl, observerControl, host });
    report.stage = 'passed';
    report.passed = true;
    console.log('Independent packed peer sessions preserved identity, exact retry and selected-prefix recovery.');
  } catch (error) {
    report.passed = false;
    report.error = error instanceof Error ? error.stack ?? error.message : String(error);
    throw error;
  } finally {
    await Promise.allSettled([...links].map(link => link.close()));
    await Promise.allSettled([...sessions].map(session => session.close()));
    await Promise.allSettled([...devices].map(device => device.close()));
    await host?.close?.();
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

async function createPortableControl({ applicationId, hostDevice, configuration }) {
  const { definition, schema, members, epoch, keyDigest, ...description } = configuration;
  assert.equal(schema, null, 'This independent conversation requires no SQL schema');
  const descriptor = await signApplicationDescriptor({ ...description, applicationId,
    definitionDigest: await applicationDescriptionDigest(definition), schemaDigest: null,
    profile: 'peer-generation-v1', policy: 'eligible-members-v1', controlPublicKey: hostDevice.identity.publicKey,
  }, hostDevice.identity);
  const control = await signControlRevision({ applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
    revision: 0, previous: null, epoch, keyDigest, recoveryFloor: null, grants: members.map(value => value.grant),
  }, hostDevice.identity);
  const registry = await createGenerationRegistry({ store: hostDevice.store, descriptor, controls: [control], signer: hostDevice.identity });
  let requests = 0, blocked = false;
  const transport = createParticipantTransport({ applicationId, exchange: async input => {
    const request = validateParticipantRequest(input);
    requests++;
    if (blocked) throw Error('CONTROL_HOST_UNAVAILABLE');
    let payload;
    if (request.facet === 'control' && request.action === 'read') payload = await registry.read();
    else if (request.facet === 'control' && request.action === 'select') {
      let control;
      if (request.payload.control !== undefined) {
        const previous = (await registry.read()).controls.at(-1);
        control = await signControlRevision({ applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
          revision: previous.payload.revision + 1, previous: await peerDigest(previous), ...request.payload.control }, hostDevice.identity);
      }
      payload = await registry.select(request.payload.request, control === undefined ? {} : { control });
    }
    else if (request.facet === 'publication' && request.action === 'definition') payload = { descriptor, definition, schema };
    else throw Error('UNEXPECTED_CONTROL_REQUEST');
    return createParticipantResponse(request, payload);
  } });
  return {
    descriptor, boundary: 'portable-control-port',
    exchange: transport.exchange,
    block(value) { blocked = value; },
    traffic() { return { requests, applicationBodyBytes: 0 }; },
    read: () => transport.request('control', 'read', {}),
    select: (request, control) => transport.request('control', 'select', { request, ...(control === undefined ? {} : { control }) }),
  };
}
