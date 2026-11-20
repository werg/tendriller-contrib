// Fixture delivery only. The public session owns discovery scheduling, retries,
// identity verification, replication, candidate choice and recovery policy.
import assert from 'node:assert/strict';

const timeout = () => AbortSignal.timeout(30_000);
const point = revision => `${revision.generation}/${revision.point.generation}/${revision.point.sequence}/${revision.point.root}`;

export function waitParticipation(participation, predicate, signal = timeout()) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    let done = false, unsubscribe = () => {};
    const finish = (error, value) => {
      if (done) return; done = true; unsubscribe(); signal.removeEventListener('abort', abort);
      error ? reject(error) : resolve(value);
    };
    const abort = () => finish(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    unsubscribe = participation.onStatus(status => { if (predicate(status)) finish(null, status); });
    if (done) unsubscribe();
  });
}
export async function waitRevision(session, revision) {
  const iterator = session.changes({ signal: timeout() })[Symbol.asyncIterator]();
  try {
    for (;;) {
      const next = await iterator.next();
      assert.equal(next.done, false, 'The expected coherent revision was not observed');
      if (point(next.value.revision) === point(revision)) return next.value.revision;
    }
  } finally { await iterator.return?.(); }
}

/** Bounded in-process discovery/SDP delivery for portable and loopback RTC gates. */
export function createParticipationFixture({ openConnection } = {}) {
  const directory = new Map(), inboxes = new Map(), pending = new Map(), opened = [], listeners = new Set();
  const changed = () => { for (const notify of listeners) notify(); };
  const offer = (value, signal) => {
    assert.ok(pending.size < 16, 'Fixture introduction tokens are bounded');
    const token = crypto.randomUUID();
    const abort = () => {
      if (pending.delete(token)) void Promise.resolve((value.connection ?? value.signaling).close()).catch(() => {});
    };
    pending.set(token, { value, signal, abort }); signal.addEventListener('abort', abort, { once: true });
    return token;
  };
  const accept = token => {
    assert.equal(typeof token, 'string', 'Invitations carry only an opaque serializable token');
    const entry = pending.get(token); assert.ok(entry, 'The fixture introduction expired');
    pending.delete(token); entry.signal.removeEventListener('abort', entry.abort); return entry.value;
  };
  const ports = session => {
    const inbox = mailbox(); inboxes.set(session.deviceId, inbox);
    return {
      discovery: {
        notifications({ signal }) { return discoveryNotifications(listeners, signal); },
        async read({ signal }) { signal.throwIfAborted(); return [...directory.keys()].filter(id => id !== session.deviceId)
          .map(identity => ({ identity, route: identity })); },
        async advertise(value, { signal }) {
          signal.throwIfAborted(); assert.equal(value.identity, session.deviceId);
          const previous = directory.get(value.identity);
          directory.set(value.identity, { storageId: value.storageId });
          if (!previous || previous.storageId !== value.storageId) changed();
        },
        async withdraw() { if (directory.delete(session.deviceId)) changed(); },
        invitations({ signal }) { return inbox.messages(signal); },
      },
      transport: {
        async open({ peer, invitation }, { signal }) {
          signal.throwIfAborted();
          let connection;
          if (invitation !== undefined) {
            const offered = accept(invitation);
            connection = openConnection ? await openConnection({ role: 'answerer', signaling: offered.signaling, signal }) : offered.connection;
          } else {
            assert.equal(directory.has(peer.identity), true, 'The fixture route is unavailable');
            const target = inboxes.get(peer.identity);
            assert.ok(target, 'A fixture invitation receiver is required');
            if (openConnection) {
              const signaling = signalingPair();
              target.send({ peer: { identity: session.deviceId, route: session.deviceId }, token: offer({ signaling: signaling.b }, signal) });
              connection = await openConnection({ role: 'offerer', signaling: signaling.a, signal });
            } else {
              const [local, remote] = framedPair();
              target.send({ peer: { identity: session.deviceId, route: session.deviceId }, token: offer({ connection: remote }, signal) });
              connection = local;
            }
          }
          opened.push({ owner: session.deviceId, peer: peer.identity, connection });
          return connection;
        },
      },
    };
  };
  return { ports, async inspect() {
    return { boundary: openConnection ? 'loopback-rtc-fixture-discovery' : 'in-process-fixture-discovery',
      pendingIntroductions: pending.size,
      connections: await Promise.all(opened.map(async item => ({ owner: item.owner, peer: item.peer,
        closed: item.connection.signal.aborted,
        ...(item.connection.session?.getRoute ? { route: await item.connection.session.getRoute() } : {}) }))) };
  } };
}

// A byte-only implementation of the public FramedPeerConnection interface.
// The fixture does not inspect envelopes, authenticate peers or retain history.
function framedPair() {
  const lifetime = new AbortController(), inboxes = [mailbox(64), mailbox(64)];
  const close = async () => { lifetime.abort(); for (const inbox of inboxes) inbox.close(); };
  return inboxes.map((inbox, index) => ({
    signal: lifetime.signal,
    async send(frame, { signal } = {}) {
      signal?.throwIfAborted(); lifetime.signal.throwIfAborted();
      assert.ok(frame instanceof Uint8Array); inboxes[1 - index].send(frame.slice());
    },
    frames(signal) { return inbox.messages(signal); },
    close,
  }));
}

/** The only two SDP values belong to test delivery, never to application history. */
export function signalingPair() {
  const types = [], lanes = [mailbox(1), mailbox(1)];
  let sentMessages = 0, sentBytes = 0;
  const endpoint = index => ({
    messages: lanes[index].messages(),
    async send(description) {
      assert.equal(lanes[index].closed, false, 'A retired introduction cannot carry traffic');
      types.push(description.type); sentMessages++; sentBytes += new TextEncoder().encode(description.sdp).length;
      lanes[1 - index].send(structuredClone(description));
    },
    close() { lanes[index].close(); },
  });
  return { a: endpoint(0), b: endpoint(1), roles: ['offerer', 'answerer'], types,
    closed: () => lanes.every(lane => lane.closed),
    snapshot: () => ({ sentMessages, sentBytes, closed: lanes.every(lane => lane.closed) }) };
}
// Notifications are snapshot invalidations, not a per-mutation event journal.
// Subscribe before ready; retain at most ready plus one changed hint while the
// consumer is busy. There is no scan, heartbeat, lease renewal or polling timer.
function discoveryNotifications(listeners, signal) {
  return { [Symbol.asyncIterator]() {
    const notices = mailbox(2), iterator = notices.messages()[Symbol.asyncIterator]();
    let pending = false;
    const notify = () => {
      if (notices.closed || pending) return;
      pending = true; notices.send({ type: 'changed' });
    };
    const close = () => {
      listeners.delete(notify); signal.removeEventListener('abort', close); notices.close();
    };
    signal.addEventListener('abort', close, { once: true });
    if (signal.aborted) close();
    else { listeners.add(notify); notices.send({ type: 'ready' }); }
    return {
      async next() {
        const result = await iterator.next();
        if (notices.closed) return { done: true };
        if (!result.done && result.value.type === 'changed') pending = false;
        return result;
      },
      async return() { close(); return iterator.return(); },
    };
  } };
}

function mailbox(limit = 8) {
  const queue = []; let waiting, closed = false;
  const close = () => { if (closed) return; closed = true; queue.length = 0; waiting?.({ done: true }); waiting = undefined; };
  return {
    get closed() { return closed; },
    send(value) {
      assert.equal(closed, false, 'A closed fixture mailbox cannot receive');
      if (waiting) { const deliver = waiting; waiting = undefined; deliver({ done: false, value }); }
      else { assert.ok(queue.length < limit, 'The fixture mailbox is bounded'); queue.push(value); }
    },
    close,
    messages(signal) { return { [Symbol.asyncIterator]() {
      const abort = () => close(); signal?.addEventListener('abort', abort, { once: true }); if (signal?.aborted) close();
      return {
        async next() {
          if (closed) return { done: true };
          if (queue.length) return { done: false, value: queue.shift() };
          assert.equal(waiting, undefined, 'Only one fixture reader owns a mailbox');
          return new Promise(resolve => { waiting = resolve; });
        },
        async return() { signal?.removeEventListener('abort', abort); close(); return { done: true }; },
      };
    } }; },
  };
}

/** Ordinary operation and recovery run through the maintained controller. */
export async function qualifyParticipation({ coordinator, follower, observer, coordinatorControl, followerControl,
  observerControl, host, ports, copyPrefix, inspectTransport = async () => ({}),
  graceMs = 150, qualifyTransport = async () => {} }) {
  const controllers = [], statuses = [];
  let stage = 'establishing-owned-connections';
  const start = (session, control) => {
    const participation = session.participate({ control, ...ports(session), recovery: { graceMs, freshnessMs: 300_000 },
      connections: { retryInitialMs: 100, retryMaxMs: 500, timeoutMs: 15_000 } });
    controllers.push(participation);
    participation.onStatus(status => statuses.push({ device: session.deviceId, ...status }));
    return participation;
  };
  const post = async (session, operationId, text = operationId) => {
    const operation = await session.command('postMessage', { messageId: operationId, text }, { operationId });
    assert.equal((await operation.applied({ signal: timeout() })).outcome, 'accepted'); return operation;
  };
  try {
    const primary = start(coordinator, coordinatorControl), secondary = start(follower, followerControl);
    await Promise.all([
      waitParticipation(primary, value => value.phase === 'coordinating' && value.connectedPeers.includes(follower.deviceId)),
      waitParticipation(secondary, value => value.phase === 'following' && value.connectedPeers.includes(coordinator.deviceId)),
    ]);
    stage = 'commands-during-host-outage';
    await post(follower, 'controller-established');
    await waitRevision(coordinator, follower.revision);
    await host.block(true); await assert.rejects(followerControl.application(), /CONTROL_HOST_UNAVAILABLE/);
    const before = await host.traffic();
    await post(follower, 'controller-host-blocked');
    await waitRevision(coordinator, follower.revision);
    // Measure a declared burst through the ordinary applied() path. The single
    // coverage wait after the burst observes background retention; it is not a
    // per-command durability barrier or a fabricated heartbeat loss estimate.
    const workload = { commands: 32, textBytesPerCommand: 1024, completion: 'applied',
      retentionWaits: 1, clock: 'performance.now', startedAtMs: performance.now() };
    const payload = 'x'.repeat(workload.textBytesPerCommand);
    let lastOperation, lastAppliedAtMs;
    for (let index = 0; index < workload.commands; index++) {
      lastOperation = await post(coordinator, `freshness-${index}`, payload);
      lastAppliedAtMs = performance.now();
    }
    workload.appliedAtMs = lastAppliedAtMs;
    const coverage = await lastOperation.shared({ signal: timeout() });
    workload.retainedAtMs = performance.now();
    const receipt = coverage.find(value => value.payload.peer === follower.deviceId);
    assert.ok(receipt, 'The survivor must acknowledge the complete workload prefix');
    assert.notEqual(receipt.payload.storageId, coordinator.storageId, 'The measured copy must have independent durable storage');
    await waitRevision(follower, coordinator.revision);
    assert.deepEqual(receipt.payload.point, follower.revision.point);
    const after = await host.traffic();
    assert.deepEqual(after, before, 'Ordinary controller-owned work must not contact the host');
    await host.block(false);
    // Deliberate link failure has its own discovery/reconnect traffic. Exercise
    // it after the unchanged-traffic workload, before coordinator removal, so
    // queued fault recovery is not mislabeled as ordinary command traffic.
    stage = 'qualifying-transport-reconnection';
    await qualifyTransport({ coordinator, follower, primary, secondary });
    const previousGeneration = follower.revision.generation, retained = follower.revision.point;
    stage = 'automatic-recovery-after-grace';
    const disconnectedAt = performance.now();
    await coordinator.close();
    const automatic = await waitParticipation(secondary, value => value.phase === 'coordinating' && follower.revision.generation !== previousGeneration);
    const recoveredAt = performance.now();
    const automaticAuthority = await followerControl.application();
    assert.deepEqual(automaticAuthority.generations.at(-1).payload.adopted, retained);
    assert.equal(automatic.recovery, null);
    for (let index = 0; index < workload.commands; index++) {
      assert.equal((await follower.operations.get(`freshness-${index}`, { author: coordinator.deviceId })).outcome,
        'accepted', 'The original author\'s observed retained workload must survive takeover');
    }
    assert.ok(recoveredAt - disconnectedAt >= graceMs, 'Takeover must honor reconnect grace');

    // Deliberate cold-observer fault setup: supply verified bytes through a
    // public connection before attaching a controller, so no coordinator-age
    // observation exists in this device's owned participation journal.
    const copied = await copyPrefix(observer, follower);
    await copied.synchronize(); await copied.close();
    const observedGeneration = observer.revision.generation;
    await secondary.close(); await follower.close();
    stage = 'approval-for-unknown-freshness';
    const cold = start(observer, observerControl);
    const approval = await waitParticipation(cold, value => value.phase === 'approval-required');
    assert.equal(approval.recovery.reason, 'freshness-unknown');
    assert.equal(approval.recovery.ageMs, null);
    assert.equal((await observerControl.application()).generations.at(-1).id, observedGeneration,
      'Unknown freshness must not authorize an automatic transition');
    await assert.rejects(cold.approveRecovery('unreviewed-proposal'), /APPLICATION_RECOVERY_APPROVAL_STALE/);
    await cold.approveRecovery(approval.recovery.id);
    stage = 'explicitly-approved-recovery';
    await waitParticipation(cold, value => value.phase === 'coordinating' && observer.revision.generation !== observedGeneration);
    await post(observer, 'controller-approved-recovery');
    const finalAuthority = await observerControl.application();
    assert.deepEqual(finalAuthority.generations.at(-1).payload.adopted, approval.recovery.point);
    await Promise.all(controllers.map(value => value.close()));
    return { owner: 'application-session', entry: 'session.participate', automaticConnections: true,
      observedPeerIdentities: [coordinator.deviceId, follower.deviceId],
      hostOutage: { blocked: true, blockedProbeRejected: true, commandsApplied: 1 + workload.commands, before, after },
      automaticRecovery: { previousGeneration, selectedGeneration: automaticAuthority.generations.at(-1).id,
        adopted: retained, graceMs, elapsedMs: recoveredAt - disconnectedAt, freshnessBudgetMs: 300_000,
        workload: { ...workload, disconnectedAtMs: disconnectedAt, recoveredAtMs: recoveredAt,
          lastOperationId: 'freshness-31', lastAppliedAtMs, observedAdoptedAgeMs: disconnectedAt - lastAppliedAtMs,
          recoveryReadyMs: recoveredAt - disconnectedAt, targetMs: 300_000,
          retained: receipt, coordinatorStorageId: coordinator.storageId,
          independentStorageId: follower.storageId, adopted: retained, knownLostCommands: 0,
          scope: '32-command two-peer burst; observed prefix age, not a universal loss bound' } },
      broaderRecovery: { reason: approval.recovery.reason, ageMs: approval.recovery.ageMs, approvalRequired: true,
        staleApprovalRejected: true, proposalId: approval.recovery.id, adopted: approval.recovery.point,
        selectedGeneration: finalAuthority.generations.at(-1).id, commandApplied: true },
      statuses, transport: await inspectTransport() };
  } catch (error) {
    throw new Error(`PARTICIPATION_QUALIFICATION_FAILED at ${stage}: ${JSON.stringify(statuses.slice(-6))}`, { cause: error });
  } finally {
    await host.block(false);
    await Promise.allSettled(controllers.map(value => value.close()));
  }
}
