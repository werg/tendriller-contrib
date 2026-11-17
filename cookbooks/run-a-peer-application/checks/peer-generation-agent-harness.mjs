// An enrolled application bootstrap for an independent agent. Business work is
// accepted only by the packed public JSON-lines tool interface below.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { bytesDigest, connectApplications, controlParticipantGrant, createGenerationRegistry, createParticipantResponse, createParticipantTransport,
  participantGrant, serveApplicationToolLines, signApplicationDescriptor, signControlRevision, signTransitionRequest,
  validateParticipantRequest } from '@chronolog/peer-session';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { openSqlApplication, prepareSqlApplication } from '@chronolog/peer-session/sql';
import { createNativeSqlEngine } from '@chronolog/peer-session/sql-native';
import { taskBoard } from './peer-generation-task-definition.mjs';
import { createParticipationFixture, waitParticipation, waitRevision } from './peer-generation-participation.mjs';

const reportPath = resolve(process.argv[2]), report = JSON.parse(await readFile(reportPath, 'utf8'));
const directory = join(dirname(reportPath), 'agent-stores'), resources = [], controllers = [], trace = [];
const timeout = () => AbortSignal.timeout(20_000);
const checkpoint = async () => writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const send = value => process.stdout.write(`${JSON.stringify(value)}\n`);
// Enrollment supplies one public embedded connection. Participation owns its
// observation and recovery; the agent supplies no transport or policy code.
const network = createParticipationFixture({ openConnection: async () => { throw Error('FIXTURE_COORDINATOR_REMOVED'); } });
let member, coordinator, memberControl, memberParticipation, reopen, faulted = false, restarted = false;
report.exercise = { scope: 'fresh-agent-public-tools-with-provided-enrollment', startedAt: new Date().toISOString(),
  domain: taskBoard.id, commands: [], trace, passed: false };
await checkpoint();

try {
  const host = await openNativeDevice({ path: join(directory, 'control.sqlite'), create: true }); resources.push(host);
  const a = await openNativeDevice({ path: join(directory, 'coordinator.sqlite'), create: true }); resources.push(a);
  const b = await openNativeDevice({ path: join(directory, 'member.sqlite'), create: true }); resources.push(b);
  const applicationId = randomBytes(32).toString('hex'), key = new Uint8Array(randomBytes(32)), engine = createNativeSqlEngine();
  const prepared = await prepareSqlApplication({ engine, applicationId, definition: taskBoard, schemaAdministrator: a.identity });
  const descriptor = await signApplicationDescriptor({ applicationId, historyId: 'independent-agent-exercise',
    profile: 'peer-generation-v1', policy: 'eligible-members-v1', controlPublicKey: host.identity.publicKey, ...prepared.binding }, host.identity);
  const control = await signControlRevision({ applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
    revision: 0, previous: null, epoch: 0, keyDigest: await bytesDigest(key), recoveryFloor: null,
    grants: [controlParticipantGrant(host.identity.publicKey), ...[a, b].map(device => participantGrant(device.identity.publicKey, { administrator: true }))] }, host.identity);
  const registry = await createGenerationRegistry({ store: host.store, descriptor, controls: [control], signer: host.identity });
  await registry.select(await signTransitionRequest({ applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
    transitionId: 'initial', expectedGeneration: null, coordinator: a.identity.publicKey, requester: a.identity.publicKey,
    controlRevision: 0, reason: 'create', base: null }, a.identity));
  const transport = createParticipantTransport({ applicationId, exchange: async input => {
    const request = validateParticipantRequest(input);
    assert.equal(request.applicationId, applicationId); assert.equal(request.facet, 'control');
    if (request.action === 'read') return createParticipantResponse(request, await registry.read());
    if (request.action === 'select') return createParticipantResponse(request, await registry.select(request.payload.request));
    throw Error('UNEXPECTED_EXERCISE_CONTROL_REQUEST');
  } });
  const open = async (device, name, initialize = false) => {
    const session = await openSqlApplication({ createEngine: () => engine, device, databasePath: join(directory, `${name}-view.sqlite`),
      definition: taskBoard, schema: prepared.schema, authority: await registry.read(),
      ...(initialize ? { epochKeys: new Map([[0, key]]) } : {}) });
    resources.push(session); return session;
  };
  const participate = session => {
    const port = session.connectControlParticipant({ exchange: transport.exchange });
    const participation = session.participate({ control: port, ...network.ports(session),
      recovery: { graceMs: 100, freshnessMs: 300_000 },
      connections: { retryInitialMs: 100, retryMaxMs: 500, advertiseMs: 300_000 } });
    controllers.push(participation); return { port, participation };
  };
  coordinator = await open(a, 'coordinator', true); member = await open(b, 'member', true);
  resources.push(await connectApplications(coordinator, member));
  const primary = participate(coordinator), secondary = participate(member);
  memberControl = secondary.port; memberParticipation = secondary.participation;
  await Promise.all([
    waitParticipation(primary.participation, value => value.phase === 'coordinating' && value.connectedPeers.includes(member.deviceId)),
    waitParticipation(memberParticipation, value => value.phase === 'following' && value.connectedPeers.includes(coordinator.deviceId)),
  ]);
  const seed = async (name, input, operationId) =>
    (await coordinator.command(name, input, { operationId })).applied({ signal: timeout() });
  await seed('addTask', { taskId: 'review', title: 'Review the public session experience' }, 'seed-review');
  await seed('addTask', { taskId: 'locked', title: 'A task claimed by another authenticated author' }, 'seed-locked');
  await seed('claimTask', { taskId: 'locked' }, 'seed-other-claim');
  await waitRevision(member, coordinator.revision);
  report.executionManifestDigest = descriptor.payload.executionManifestDigest;
  report.exercise.identity = member.deviceId;
  report.exercise.storageId = member.storageId;
  report.exercise.enrollment = 'provided verified authority, signed schema and persistent native device';
  report.exercise.initialRevision = member.revision;
  report.stage = 'awaiting-agent-tools'; await checkpoint();
  reopen = async () => {
    const identityBefore = member.deviceId, storageBefore = member.storageId;
    const operationBefore = await member.operations.wait('agent-finish-1', { signal: timeout() });
    assert.equal(operationBefore.outcome, 'accepted');
    await memberParticipation.close(); await member.close();
    const reopenedDevice = await openNativeDevice({ path: join(directory, 'member.sqlite') }); resources.push(reopenedDevice);
    member = await open(reopenedDevice, 'member');
    const next = participate(member); memberControl = next.port; memberParticipation = next.participation;
    assert.equal(member.deviceId, identityBefore); assert.equal(member.storageId, storageBefore);
    assert.deepEqual(await member.operations.get('agent-finish-1'), operationBefore);
    report.exercise.reopen = { identityBefore, identityAfter: member.deviceId, storageBefore, storageAfter: member.storageId,
      operationBefore, operationAfter: await member.operations.get('agent-finish-1'), plaintextKeysSupplied: false };
    restarted = true;
  };
  send({ fixture: 'ready', scope: report.exercise.scope, deviceId: member.deviceId,
    interface: 'One JSON object per line: {id,tool,input,timeoutMs?}. Use tool:list to inspect public schemas.' });
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    assert.ok(trace.length < 80, 'The independent exercise is bounded to eighty requests');
    const request = JSON.parse(line), startedAt = new Date().toISOString();
    let cut, cutCancellation;
    if (!faulted && request.tool === 'command' && request.input?.operationId === 'agent-note-1') {
      const before = coordinator.revision.point.sequence;
      cutCancellation = new AbortController();
      const changes = coordinator.changes({ signal: AbortSignal.any([cutCancellation.signal, timeout()]) })[Symbol.asyncIterator]();
      cut = (async () => {
        try {
          for (;;) {
            const update = await changes.next(); assert.equal(update.done, false);
            if (update.value.revision.point.sequence <= before) continue;
            // Fence the coordinator synchronously at durable publication, before
            // its order reply can reach the originating peer.
            const closing = coordinator.close();
            report.exercise.fault = { persistedAtCoordinator: true, originalOperationId: 'agent-note-1',
              priorGeneration: update.value.revision.generation, coordinatorRemoved: true, responseSuppressed: true };
            await closing; return;
          }
        } finally { await changes.return?.(); }
      })();
    }
    const output = [];
    await serveApplicationToolLines(member, { host: memberControl,
      input: { async *[Symbol.asyncIterator]() { yield line; } }, write: value => { output.push(value); } });
    assert.equal(output.length, 1);
    let response = JSON.parse(output[0]);
    // A rejected tool argument is ordinary feedback, not a successfully
    // submitted command on which the declared lost-reply fault can operate.
    if (cut && response.error && await member.operations.get('agent-note-1') === null) {
      cutCancellation.abort();
      try { await cut; } catch (error) { if (!cutCancellation.signal.aborted) throw error; }
      cut = undefined;
    }
    if (cut) {
      await cut; faulted = true;
      await waitParticipation(memberParticipation, value => value.phase === 'coordinating');
      report.exercise.fault.selectedGeneration = member.revision.generation;
      const lost = await member.operations.inspect('agent-note-1');
      assert.ok(['abandoned', 'needsReapply'].includes(lost.state.status));
      report.exercise.fault.originalAttemptId = lost.attempt.id;
      response = { id: request.id, error: 'EXERCISE_TRANSPORT_REPLY_LOST', outcome: 'unknown; inspect the original operation identity' };
    }
    trace.push({ startedAt, finishedAt: new Date().toISOString(), request, response });
    if (request.tool === 'command' || request.tool === 'reapply') report.exercise.commands.push(request.input.operationId);
    send(response);
    if (!restarted && response.result && request.input?.operationId === 'agent-finish-1' && ['command', 'wait'].includes(request.tool)) {
      await reopen(); send({ fixture: 'reopened', deviceId: member.deviceId, storageId: member.storageId });
    }
    await checkpoint();
    if (restarted && request.tool === 'query' && request.input?.name === 'board' && await complete()) {
      report.exercise.passed = true; report.exercise.finishedAt = new Date().toISOString();
      report.exercise.requests = trace.length; report.stage = 'passed'; report.passed = true;
      await checkpoint(); send({ fixture: 'complete', report: reportPath, requests: trace.length }); lines.close(); break;
    }
  }
  assert.equal(report.passed, true, 'The agent stopped before completing the declared business workflow');
} catch (error) {
  report.passed = false; report.error = error instanceof Error ? error.stack ?? error.message : String(error); await checkpoint(); throw error;
} finally {
  await Promise.allSettled(controllers.map(value => value.close()));
  await Promise.allSettled(resources.reverse().map(value => value.close()));
  await checkpoint();
}

async function complete() {
  const called = name => trace.some(value => value.request.tool === name);
  if (!['describe', 'query', 'operation', 'wait', 'retry', 'changes', 'recoveries', 'reapply'].every(called)) return false;
  if (!trace.some(value => value.request.tool === 'changes' && value.response.result?.resetRequired === true)) return false;
  if (!trace.some(value => value.request.tool === 'retry' && value.request.input?.operationId === 'agent-finish-1')) return false;
  const replay = await member.operations.inspect('agent-note-2'), wrong = await member.operations.get('agent-wrong-author-1');
  const claim = await member.operations.get('agent-claim-1'), finish = await member.operations.get('agent-finish-1');
  if (replay?.attempt.payload.header.reapplyOf !== report.exercise.fault.originalAttemptId || replay.state.outcome !== 'accepted') return false;
  if (wrong?.outcome !== 'rejected' || claim?.outcome !== 'accepted' || finish?.outcome !== 'accepted') return false;
  const board = await member.query('board', {}), task = board.value.tasks.find(value => value.id === 'review');
  if (task?.status !== 'done' || task.claimedBy !== member.deviceId) return false;
  if (board.value.tasks.find(value => value.id === 'locked')?.status !== 'open') return false;
  if (board.value.messages.filter(value => value.operationId === 'agent-note-2' && value.text === 'Ready for review').length !== 1) return false;
  report.exercise.final = { revision: board.revision, board: board.value, reapplication: replay.state,
    reapplyOf: replay.attempt.payload.header.reapplyOf, wrongAuthor: wrong, claim, finish };
  return true;
}
