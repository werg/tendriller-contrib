// Runs from a fresh directory containing only the installed public archive.
// Faults affect transport/control availability; the application owns no outbox.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  AbandonedOperationError, applicationDefinitionDigest, bytesDigest,
  createGenerationRegistry, eventExecutionManifest,
  executionManifestArtifacts, participantGrant, signApplicationDescriptor, signControlRevision, signTransitionRequest,
} from '@chronolog/peer-session';
import { openNativeApplication, openNativeDevice } from '@chronolog/peer-session/native';
import { conversation } from './peer-generation-definition.mjs';

export async function runPeerGenerationScenario({ path, connectSessions }) {
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
  let authority;
  const epochKey = new Uint8Array(randomBytes(32)), epochKeys = new Map([[0, epochKey]]);
  const open = async (device, selected = authority) => {
    const session = await openNativeApplication({ device, authority: selected, epochKeys, definition: conversation });
    sessions.add(session); return session;
  };
  const connect = async (a, b) => { const link = await connectSessions(a, b); links.add(link); return link; };
  const query = session => session.query('conversation', {});
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
    const [deviceA, deviceB, deviceC] = await Promise.all(['a', 'b', 'c'].map(name => openDevice(name, true)));
    await assert.rejects(openNativeDevice({ path: database('a') }), /AGENT_STORE_IN_USE/);
    await assert.rejects(openNativeDevice({ path: database('missing') }), /APPLICATION_DEVICE_NOT_FOUND/);
    report.nativeOwnership = { secondOwnerRefused: true, implicitIdentityCreationRefused: true };
    const applicationId = randomBytes(32).toString('hex');
    const execution = await executionManifestArtifacts(await eventExecutionManifest('peer-generation-v1'));
    const descriptor = await signApplicationDescriptor({
      applicationId, historyId: 'independent-peer-conversation', profile: 'peer-generation-v1', policy: 'eligible-members-v1',
      controlPublicKey: hostDevice.identity.publicKey,
      // This events-only application explicitly pins its durable control identity for schema administration.
      schemaAdministrator: hostDevice.identity.publicKey,
      executionManifestDigest: Buffer.from(execution.executionManifestDigest).toString('hex'),
      definitionDigest: await applicationDefinitionDigest(conversation), schemaDigest: null,
    }, hostDevice.identity);
    const control = await signControlRevision({
      applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
      revision: 0, previous: null, epoch: 0, keyDigest: await bytesDigest(epochKey), recoveryFloor: null,
      grants: [deviceA, deviceB, deviceC].map(device => participantGrant(device.identity.publicKey, { administrator: device !== deviceC })),
    }, hostDevice.identity);
    const registry = await createGenerationRegistry({ store: hostDevice.store, descriptor, controls: [control], signer: hostDevice.identity });
    let hostedRequests = 0, hostedApplicationBodyBytes = 0, hostBlocked = false;
    const host = {
      async read() { hostedRequests++; if (hostBlocked) throw Error('CONTROL_HOST_UNAVAILABLE'); return registry.read(); },
      async select(request) { hostedRequests++; if (hostBlocked) throw Error('CONTROL_HOST_UNAVAILABLE'); return registry.select(request); },
    };
    const transition = async (requester, coordinator, expectedGeneration, base, transitionId, reason = 'takeover') => signTransitionRequest({
      applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
      transitionId, expectedGeneration, coordinator: coordinator.identity.publicKey, requester: requester.identity.publicKey,
      controlRevision: 0, reason, base,
    }, requester.identity);
    const g1 = await host.select(await transition(deviceA, deviceA, null, null, 'create', 'create'));
    authority = await host.read();
    let a = await open(deviceA), b = await open(deviceB);
    assert.equal(a.status.role, 'coordinator');
    assert.equal(b.status.role, 'follower');
    assert.equal(a.describe().capabilities.finality, false);
    assert.equal(a.describe().capabilities.automaticExternalEffects, false);
    report.executionManifestDigest = descriptor.payload.executionManifestDigest;
    await checkpoint('opened independent native sessions');
    await post(a, 'anchor-a', 'A retained message');
    let ab = await connect(a, b);

    // The coordinator publishes a revision only after storing the command. Drop
    // the link then, before its order reply can reach the originating follower.
    const watchAbort = new AbortController();
    const updates = a.changes({ signal: AbortSignal.any([watchAbort.signal, timeout()]) })[Symbol.asyncIterator]();
    await updates.next();
    const cut = (async () => {
      const update = await updates.next();
      assert.equal(update.done, false);
      await ab.close();
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
    hostBlocked = true;
    await assert.rejects(host.read(), /CONTROL_HOST_UNAVAILABLE/);
    const beforeRequests = hostedRequests, beforeBodies = hostedApplicationBodyBytes;
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
    report.hostOutage = { boundary: 'portable-control-port', blocked: true, blockedProbeRejected: true,
      commandsApplied: 2, requests: { before: beforeRequests, after: hostedRequests },
      applicationBodyBytes: { before: beforeBodies, after: hostedApplicationBodyBytes }, finalityCapability: a.capabilities.finality,
      liveSignalsObserved: 1, peerReplicationObserved: true,
      ...(transportBefore === undefined ? {} : { transport: { before: transportBefore, after: await ab.inspect() } }) };

    await checkpoint('continued with control host blocked');
    const retainedOperation = await b.operations.get('reply-lost');
    const adopted = await b.recoveryPoint();
    await ab.close();
    await post(a, 'abandoned-a', 'Recent message that B has not retained');
    const excludedView = (await query(a)).revision;
    await post(a, 'isolated-a', 'An additional isolated old-branch message');
    const oldHead = await a.recoveryPoint();
    assert.ok(oldHead.point.sequence > adopted.point.sequence);
    const previousTail = await a.operations.get('abandoned-a');
    const priorIdentity = a.deviceId;
    await a.close(); sessions.delete(a);
    await rename(join(storeRoot, 'a'), join(storeRoot, 'a-offline'));

    hostBlocked = false;
    const takeoverRequest = await transition(deviceB, deviceB, g1.id, adopted, 'takeover-b');
    const selected = await host.select(takeoverRequest);
    // Discarding this selected response simulates a lost control reply; the exact
    // same transition must return the already persisted selection.
    assert.deepEqual(await host.select(takeoverRequest), selected);
    authority = await host.read();
    const reset = await b.adopt(authority);
    assert.equal(reset.generation, selected.id);
    assert.deepEqual(await b.operations.get('reply-lost'), retainedOperation);
    const coherentB = await query(b);
    assert.equal(coherentB.revision.generation, selected.id);
    assert.equal(coherentB.value.messages.some(message => message.operationId === 'abandoned-a'), false);
    await checkpoint('selected older prefix on survivor');
    const c = await open(deviceC);
    const bc = await connect(b, c);
    await bc.synchronize();
    const coherentC = await query(c);
    assert.deepEqual(coherentC.value, coherentB.value);

    await rename(join(storeRoot, 'a-offline'), join(storeRoot, 'a'));
    const returningDevice = await openDevice('a');
    a = await open(returningDevice, { ...authority, generations: authority.generations.slice(0, 1) });
    assert.equal(a.deviceId, priorIdentity);
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
    const third = await host.select(await transition(deviceC, deviceC, selected.id, await c.recoveryPoint(), 'takeover-c'));
    authority = await host.read();
    await c.adopt(authority); await b.adopt(authority); await a.adopt(authority);
    assert.equal(third.payload.number, 2);
    assert.equal((await a.operations.get('abandoned-a')).status, 'abandoned');
    assert.deepEqual(await a.operations.get('reapplied-a'), reappliedResult);
    report.returningBranch.thirdGenerationChecked = true;
    report.returningBranch.thirdGeneration = third.id;

    const beforeReopen = await a.operations.get('reapplied-a');
    const identityBefore = a.deviceId;
    await a.close(); sessions.delete(a);
    const reopened = await open(await openDevice('a'));
    assert.equal(reopened.deviceId, identityBefore);
    const afterReopen = await reopened.operations.get('reapplied-a');
    assert.deepEqual(afterReopen, beforeReopen);
    report.reopen = { identityBefore, identityAfter: reopened.deviceId, operationBefore: beforeReopen, operationAfter: afterReopen };
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
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}
