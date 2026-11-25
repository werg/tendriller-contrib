// Runs in an empty consumer installation from exact public archives.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createApplicationSession, createProjection, createLiveView } from '@chronolog/peer-session';
import { recordDigest } from '@chronolog/authority';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { conversation, conversationCounts, readConversation } from './operation-set-definition.mjs';
import { qualifyFinality } from './operation-set-finality.mjs';
import { createFixtureAuthority } from './operation-set-authority.mjs';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const exactHash = value => recordDigest(value);
async function query(session) { const view = await session.readView(); try { return readConversation(view); } finally { view.release(); } }

export async function runOperationSetScenario({ path, connectSessions, createHost }) {
  const reportPath = resolve(path), report = JSON.parse(await readFile(reportPath, 'utf8'));
  const directory = join(dirname(reportPath), 'stores'); await mkdir(directory, { recursive: true });
  const sessions = [], devices = [], links = []; let host;
  const stage = async name => { report.stage = name; await writeFile(reportPath, JSON.stringify(report, null, 2)); };
  const openDevice = async (name, create = false) => {
    const device = await openNativeDevice({ path: join(directory, `${name}.sqlite`), ...(create ? { create: true } : {}) });
    devices.push(device); return device;
  };
  try {
    const [control, ...authors] = await Promise.all(['authority', 'a', 'b', 'c', 'd'].map(name => openDevice(name, true)));
    await assert.rejects(openDevice('a'), /BYTES_STORE_IN_USE|BUSY/);
    await assert.rejects(openDevice('missing'), /APPLICATION_DEVICE_NOT_FOUND/);
    report.nativeOwnership = { secondOwnerRefused: true, implicitIdentityCreationRefused: true };
    const applicationId = randomBytes(32).toString('hex'), epochKey = new Uint8Array(randomBytes(32));
    let bundle = await createFixtureAuthority({ applicationId, signer: control.identity, devices: authors, epochKey });
    if (createHost) { host = await createHost({ bundle, definition: conversation, signer: authors[0].identity, devices: authors }); bundle = host.bundle; report.host.participant=host.participant; }
    report.executionManifestDigest = bundle.descriptor.payload.executionManifestDigest;
    const open = async (device, cached = false) => {
      const session = await createApplicationSession({ device, definition: conversation,
        ...(cached ? { applicationId } : { authority: bundle, epochKeys: new Map([[0, epochKey]]) }) });
      sessions.push(session); return session;
    };
    const [a, b, c, d] = await Promise.all(authors.map(device => open(device)));
    const connect = async (left, right) => { const link = await connectSessions(left, right); links.push(link); return link; };
    const post = async (session, operationId, time, text = operationId) => {
      const operation = await session.command('postMessage', { messageId: operationId, text }, { operationId, authorTimestampMs: time });
      assert.equal(operation.stored, true);
      assert.equal((await operation.materialized()).outcome, 'accepted');
      return operation;
    };
    await stage('independent-offline-authors');
    assert.equal(a.status.connectedPeers, 0); assert.equal(b.status.connectedPeers, 0);
    const first = await post(a, 'offline-a', 200n), second = await post(b, 'offline-b', 200n);
    assert.deepEqual((await query(a)).messages.map(row => row.messageId), ['offline-a']);
    assert.deepEqual((await query(b)).messages.map(row => row.messageId), ['offline-b']);
    await assert.rejects(first.finalized(), /FINALITY_UNSUPPORTED/);
    report.offline = { independentAuthors: [a.identity.publicKey, b.identity.publicKey], stored: [first.stored, second.stored],
      materialized: [(await first.materialized()).outcome, (await second.materialized()).outcome], connectedPeers: [0, 0], finality: 'none', unsupportedWaitRejected: true };
    const captured = await a.readView(), before = readConversation(captured);
    const live = createLiveView(a, readConversation), projection = createProjection(a, conversationCounts);
    await live.ready(); await projection.ready();
    const early = await post(b, 'late-earlier', 100n);
    const lateFacts = b.exportFacts();
    const ab = await connect(a, b); await ab.synchronize();
    const converged = await query(a);
    assert.deepEqual(await query(b), converged);
    assert.equal(converged.messages[0].messageId, 'late-earlier');
    const equalTime = converged.messages.slice(1);
    assert.deepEqual(equalTime.map(row => row.author), [a.identity.publicKey, b.identity.publicKey].sort());
    const capturedAfter = readConversation(captured); assert.deepEqual(capturedAfter, before); captured.release();
    assert.deepEqual((await live.refresh()).value, converged);
    assert.equal((await projection.refresh()).value.messages, 3);
    report.reactive = { capturedBefore: hash(before), capturedAfter: hash(capturedAfter), coherentCapturedView: true,
      snapshot: hash(converged), liveSnapshot: hash(live.snapshot.value), projectionCount: projection.snapshot.value.messages,
      earlierInsertionFirst: converged.messages[0].proposalId, expectedEarlierProposal: early.id, equalTimeAuthors: equalTime.map(row => row.author) };
    // Replay permutations and duplicates through public fact ingestion, not a mocked materializer.
    const facts = a.exportFacts(), reverse = { ...facts, envelopes: [...facts.envelopes].reverse() };
    for (const envelope of reverse.envelopes) await c.mergeFacts({ envelopes: [envelope, envelope], retentions: [], finality: [] });
    await d.mergeFacts(lateFacts); await d.mergeFacts(facts); await d.mergeFacts(reverse);
    assert.deepEqual(await query(c), converged); assert.deepEqual(await query(d), converged);
    assert.equal(c.exportFacts().envelopes.length, 3); assert.equal(d.exportFacts().envelopes.length, 3);
    report.merge = { permutations: 3, duplicateDeliveries: 6, operations: 3, digests: await Promise.all([a, b, c, d].map(async session => hash(await query(session)))),
      revisions: [a, b, c, d].map(session => session.revision.digest) };
    await stage('exact-retry-and-independent-retention');
    const envelopeBefore = a.exportFacts().envelopes.find(value => value.payload.proposalId === first.id);
    // Suppress a successful local reply at the fixture caller, then repeat the same request.
    await assert.rejects((async () => { await a.command('postMessage', { messageId: 'offline-a', text: 'offline-a' }, { operationId: 'offline-a', authorTimestampMs: 200n }); throw Error('REPLY_LOST'); })(), /REPLY_LOST/);
    const retried = await a.command('postMessage', { messageId: 'offline-a', text: 'offline-a' }, { operationId: 'offline-a' });
    const envelopeAfter = a.exportFacts().envelopes.find(value => value.payload.proposalId === retried.id);
    assert.equal(retried.id, first.id); assert.deepEqual(envelopeAfter, envelopeBefore);
    await assert.rejects(a.command('postMessage', { messageId: 'offline-a', text: 'changed intent' }, { operationId: 'offline-a' }), /OPERATION_ID_REUSED/);
    await ab.synchronize();
    const retained = await first.retained();
    assert.ok(retained.some(value => value.payload.peer === b.identity.publicKey && value.payload.storageId !== a.device.storageId));
    report.retry = { replyLostAfterStorage: true, originalProposalId: first.id, retriedProposalId: retried.id,
      signedBefore: await exactHash(envelopeBefore), signedAfter: await exactHash(envelopeAfter), alteredIntentRejected: true,
      operationCount: a.exportFacts().envelopes.length };
    report.retention = { evidence: retained, authorStorageId: a.device.storageId, independentPeer: b.identity.publicKey };
    if (ab.live) {
      const priorFacts = await exactHash(a.exportFacts().envelopes), signal = AbortSignal.timeout(15_000);
      const events = b.signals.subscribe({ topics: ['typing'], signal })[Symbol.asyncIterator]();
      const next = events.next(); await a.signals.send('typing', { marker: 'private-live-signal-marker', typing: true }, { ttlMs: 2500 });
      assert.equal((await next).value.payload.marker, 'private-live-signal-marker'); await events.return?.();
      assert.equal(await exactHash(a.exportFacts().envelopes), priorFacts);
      report.live = { observed: true, historyBefore: priorFacts, historyAfter: await exactHash(a.exportFacts().envelopes) };
    }
    if (host) {
      await host.block(true); await assert.rejects(host.probe(), /HOST_UNAVAILABLE/);
      const hostBefore = await host.traffic(), transportBefore = await ab.inspect();
      await post(a, 'host-blocked-a', 300n); await post(b, 'host-blocked-b', 301n); await ab.synchronize();
      const hostAfter = await host.traffic(); assert.deepEqual(hostAfter, hostBefore);
      report.hostOutage = { boundary: 'tendriller-workerd-http', blockedProbeRejected: true, before: hostBefore, after: hostAfter,
        commandsMaterialized: 2, transportBefore, transportAfter: await ab.inspect() };
      await host.block(false); report.host.publication = await host.qualifyPublication();
    } else report.hostOutage = { boundary: 'no-server', requests: 0, finalizerProcesses: 0 };
    await ab.close();
    const disconnected = await post(b, 'second-partition-b', 400n);
    const identity = a.identity.publicKey, savedId = first.id, savedEnvelope = await exactHash(envelopeBefore);
    live.close(); projection.close(); await a.close();
    const crashed = spawnSync(process.execPath,[fileURLToPath(new URL('./operation-set-native-restart.mjs',import.meta.url)),join(directory,'a.sqlite'),applicationId],{timeout:30000,encoding:'utf8'});
    assert.equal(crashed.status,73,crashed.stderr);assert.equal(crashed.signal,null);
    const reopened = await open(await openDevice('a'), true);
    const abrupt = reopened.operation('native-abrupt-durable');assert.ok(abrupt?.stored);assert.equal((await abrupt.materialized()).outcome,'accepted');
    const crashObservation=JSON.parse(crashed.stdout);assert.equal(abrupt.id,crashObservation.proposalId);
    assert.equal(abrupt.inspect().authorTimestampMs,crashObservation.authorTimestampMs);
    const crashSignedDigest=await exactHash(reopened.exportFacts().envelopes.find(value=>value.payload.proposalId===abrupt.id));
    assert.equal(crashSignedDigest,crashObservation.signedDigest);
    assert.equal(reopened.identity.publicKey, identity);
    assert.equal(reopened.operation('offline-a').id, savedId);
    assert.equal(await exactHash(reopened.exportFacts().envelopes.find(item => item.payload.proposalId === savedId)), savedEnvelope);
    const reconnect = await connect(reopened, b); await reconnect.synchronize();
    assert.deepEqual(await query(reopened), await query(b));
    assert.ok((await query(reopened)).messages.some(row => row.proposalId === disconnected.id));
    report.reload = { identityBefore: identity, identityAfter: reopened.identity.publicKey, proposalBefore: savedId,
      proposalAfter: reopened.operation('offline-a').id, signedBefore: savedEnvelope,
      signedAfter: await exactHash(reopened.exportFacts().envelopes.find(item => item.payload.proposalId === savedId)),
      cachedAuthority: true, disconnectedAuthoring: true, automaticUnion: true, abruptNativeRestart:true, abruptExitCode:crashed.status, abruptProposal:abrupt.id, abruptSignedBefore:crashObservation.signedDigest, abruptSignedAfter:crashSignedDigest,
      digest: hash(await query(reopened)), peerDigest: hash(await query(b)) };
    // Content must actually traverse the selected framed transport. Missing support is a gate failure.
    const bytes = new TextEncoder().encode('private-content-marker'.repeat(8192)).slice(0,131095);
    const staged = await reopened.content.stage({bytes:bytes.length});await staged.write(0,bytes.slice(0,65536));
    const progressBefore = await staged.progress();assert.deepEqual(progressBefore.missingChunks,[1,2]);
    await reconnect.close();await reopened.close();
    const contentOwner = await open(await openDevice('a'),true),resumed = await contentOwner.content.resumeUpload(staged.id);
    const progressAfter = await resumed.progress();assert.deepEqual(progressAfter,progressBefore);
    for(let index=1;index*65536<bytes.length;index++)await resumed.write(index,bytes.slice(index*65536,(index+1)*65536));
    const reference = await resumed.commit(),contentLink = await connect(contentOwner,b);await contentLink.synchronize();
    const received = await b.content.readBytes(reference, { maxBytes: bytes.length });
    assert.deepEqual(received, bytes);
    await contentLink.close();await contentOwner.close();
    const retainedContentOwner = await open(await openDevice('a'),true);
    const reloadedContent = await retainedContentOwner.content.readBytes(reference,{maxBytes:bytes.length});assert.deepEqual(reloadedContent,bytes);
    report.content = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
      receivedSha256: createHash('sha256').update(received).digest('hex'), reloadSha256:createHash('sha256').update(reloadedContent).digest('hex'),
      resumedStageId:resumed.id,originalStageId:staged.id,partialUploadResumed:true,localReload:true,transport: 'authenticated-peer-channel' };
    report.finality = await qualifyFinality(directory);
    report.passed = true; report.stage = 'passed';
  } catch (error) { report.passed = false; report.error = error.stack ?? String(error); throw error; }
  finally {
    await Promise.allSettled(links.map(link => link.close())); await Promise.allSettled(sessions.map(session => session.close()));
    await Promise.allSettled(devices.map(device => device.close())); await host?.close?.();
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}
