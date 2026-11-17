// This file is copied into an isolated installation. Only packed public
// Chronolog exports provide application behavior; Playwright/esbuild are tools.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { build } from 'esbuild';
import { applicationDefinitionDigest, bytesDigest, createGenerationRegistry, createParticipantRequest, createParticipantResponse,
  eventExecutionManifest, executionManifestArtifacts, participantGrant, signApplicationDescriptor, signControlRevision,
  signTransitionRequest, validateParticipantRequest } from '@chronolog/peer-session';
import { openNativeApplication, openNativeDevice } from '@chronolog/peer-session/native';
import { connectNativeApplicationWebRtc } from '@chronolog/peer-session/webrtc-native';
import { conversation } from './peer-generation-definition.mjs';

const path = resolve(process.argv[2]), report = JSON.parse(await readFile(path, 'utf8'));
const directory = dirname(path), stores = join(directory, 'stores'), assets = join(directory, 'assets');
const sessions = new Set(), devices = new Set(), connections = [], introductions = new Map();
const timeout = () => AbortSignal.timeout(20_000);
const hash = value => createHash('sha256').update(value).digest('hex');
const valueHash = value => hash(JSON.stringify(value));
let browser, page, server, registry, authority, a, controlDevice, deviceA, deviceC, browserIdentity;
let blocked = false, controlRequests = 0, controlBodyBytes = 0, signalingRequests = 0, signalingBodyBytes = 0;
const applicationId = randomBytes(32).toString('hex'), key = new Uint8Array(randomBytes(32));
const native = { iceInterfaceAddresses: { udp4: '127.0.0.1' }, iceAdditionalHostAddresses: ['127.0.0.1'],
  iceUseIpv4: false, iceUseIpv6: false, iceUseTcp: false };
const checkpoint = async stage => {
  report.stage = stage; await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Browser peer consumer: ${stage}`);
};
const nativeDevice = async name => {
  const device = await openNativeDevice({ path: join(stores, name, 'device.sqlite'), create: true });
  devices.add(device); return device;
};
const openNative = async (device, selected, epochKeys) => {
  const session = await openNativeApplication({ device, authority: selected, definition: conversation,
    ...(epochKeys === undefined ? {} : { epochKeys }) });
  sessions.add(session); return session;
};
const post = async (session, id, text) => {
  const operation = await session.command('postMessage', { messageId: id, text }, { operationId: id });
  assert.equal((await operation.applied({ signal: timeout() })).outcome, 'accepted'); return operation;
};
const browserPost = (id, text) => page.evaluate(async ({ id, text }) => {
  const operation = await application.command('postMessage', { messageId: id, text }, { operationId: id });
  return operation.applied({ signal: AbortSignal.timeout(20_000) });
}, { id, text });
const browserQuery = () => page.evaluate(() => application.query('conversation', {}));
const traffic = () => ({ controlRequests, controlBodyBytes, signalingRequests, signalingBodyBytes });

try {
  await mkdir(stores); await mkdir(assets);
  await mkdir(join(process.cwd(), 'deployment'));
  await writeFile(join(process.cwd(), 'deployment/bootstrap.mjs'), "export { applicationReady } from '../peer-generation-browser-page.mjs';\n");
  const bundle = await build({ entryPoints: { app: 'app.mjs', worker: 'peer-generation-browser-worker.mjs' },
    absWorkingDir: process.cwd(), outdir: assets, bundle: true, splitting: true, format: 'esm', platform: 'browser',
    target: ['chrome145'], outExtension: { '.js': '.mjs' }, metafile: true, logLevel: 'warning' });
  for (const input of Object.keys(bundle.metafile.inputs)) assert.ok(input.startsWith('node_modules/@chronolog/peer-session/') ||
    ['peer-generation-browser-page.mjs', 'peer-generation-browser-worker.mjs', 'peer-generation-definition.mjs',
      'app.mjs', 'typing.mjs', 'deployment/bootstrap.mjs'].includes(input), `Unexpected browser bundle input: ${input}`);
  for (const file of ['board.html', 'compact.html', 'style.css']) await writeFile(join(assets, file), await readFile(join(process.cwd(), file)));
  report.browserAssets = await Promise.all((await readdir(assets)).map(async file => ({ file, sha256: hash(await readFile(join(assets, file))) })));
  report.browserBundleInputs = Object.keys(bundle.metafile.inputs).sort();
  [controlDevice, deviceA, deviceC] = await Promise.all(['control', 'a', 'c'].map(nativeDevice));
  server = createServer((request, response) => {
    void route(request, response).catch(error => {
      if (!response.writableEnded) { response.statusCode = 500; response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ error: { code: error.code ?? 'fixture_failure', message: error.message } })); }
    });
  });
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true,
    ...(process.env.PEER_GENERATION_CHROMIUM ? { executablePath: process.env.PEER_GENERATION_CHROMIUM } : {}),
    args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  report.browser = { implementation: 'chromium', version: browser.version(), headless: true,
    transportOwner: 'dedicated-worker', storage: 'opfs-with-exclusive-web-lock',
    signalingBoundary: 'loopback-fixture-http', controlBoundary: 'chronolog-participant-over-loopback-http',
    nativeCandidateSource: 'explicit-loopback-only', interfaceEnumeration: 'disabled-by-native-options',
    pageErrors: [], consoleErrors: [] };
  const context = await browser.newContext();
  page = await context.newPage();
  page.on('pageerror', error => report.browser.pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.browser.consoleErrors.push(message.text()); });
  await page.goto(origin);
  await page.waitForFunction(() => !!globalThis.fixture);
  const deviceName = `peer-browser-${randomBytes(8).toString('hex')}`;
  const opened = await page.evaluate(deviceName => fixture.open({ deviceName, provision: true }), deviceName);
  assert.equal(opened.deviceId, browserIdentity.deviceId);
  assert.equal(opened.status.phase, 'awaiting-keys');
  assert.equal(opened.capabilities.finality, false);
  assert.equal(controlRequests, 0, 'Attaching the Worker control participant must not perform I/O');
  assert.equal(await page.evaluate(() => fixture.windowStorage()), 'BROWSER_PEER_WORKER_REQUIRED');
  assert.equal(await page.evaluate(() => fixture.secondOwner()), 'BROWSER_STORAGE_IN_USE');
  assert.equal(await page.evaluate(() => fixture.unsupportedStorage()), 'BROWSER_DURABLE_STORAGE_UNAVAILABLE');
  const otherTab = await page.context().newPage();
  try {
    await otherTab.goto(origin); await otherTab.waitForFunction(() => !!globalThis.fixture);
    await assert.rejects(otherTab.evaluate(deviceName => fixture.open({ deviceName }), deviceName), /BROWSER_STORAGE_IN_USE/);
  } finally { await otherTab.close(); }
  report.ownership = { workerOnly: true, secondOwnerRefused: true, secondTabRefused: true,
    unsupportedStorageRefused: true, unsupportedFault: 'Worker navigator.storage.getDirectory removed by the fixture', initialDeviceId: opened.deviceId,
    initialStorageId: opened.storageId, pagePrivateKeys: 0, freshDeviceAwaitedKeys: true,
    controlParticipant: { owner: 'application-session', attachRequests: controlRequests } };
  await checkpoint('opened a keyless Worker-owned browser and refused a second owner');

  await post(a, 'anchor', 'A retained anchor');
  let ab = await connect(a, 'answerer');
  assert.equal((await browserQuery()).revision.generation, authority.generations.at(-1).id);
  await disconnect(ab);
  const original = await submitMessage('Saved while disconnected', 'saved');
  const offline = await page.evaluate(async operationId => {
    const before = await application.operations.inspect(operationId);
    const abort = new AbortController();
    const waiter = application.operations.wait(operationId, { signal: abort.signal }).catch(error => error.message);
    abort.abort(Error('cancel page waiter'));
    return { before, after: await application.operations.inspect(operationId), cancelled: await waiter };
  }, original.operationId);
  assert.equal(offline.before.state.status, 'saved');
  assert.deepEqual(offline.after, offline.before);
  assert.equal(offline.cancelled, 'cancel page waiter');
  ab = await connect(a, 'answerer');
  const applied = await page.evaluate(async operationId => {
    const result = await application.operations.wait(operationId, { signal: AbortSignal.timeout(20_000) });
    await application.retry(operationId);
    return { result, inspected: await application.operations.inspect(operationId), status: application.status };
  }, original.operationId);
  assert.equal(applied.result.operationId, original.operationId);
  assert.equal(applied.result.outcome, 'accepted');
  assert.deepEqual(applied.inspected.attempt, offline.before.attempt);
  assert.equal(applied.status.phase, 'ready');
  assert.equal((await a.operations.get(original.operationId, { author: opened.deviceId })).status, 'applied');
  assert.deepEqual((await browserQuery()).value, (await a.query('conversation', {})).value);
  report.operations = { cancelledWaitPreservedAttempt: true, resumedExactAttempt: true, operationId: original.operationId,
    attemptId: applied.result.attemptId, receiptPeer: a.deviceId, enrolledFromPeer: true };
  await checkpoint('enrolled browser keys and applied the exact offline attempt over real RTC');

  await page.evaluate(async () => {
    globalThis.capturedView = await application.readView();
    globalThis.initialEvents = (await capturedView.readEvents()).events.length;
    globalThis.liveAbort = new AbortController();
    globalThis.liveStream = application.signals.subscribe({ topics: ['typing'], signal: liveAbort.signal })[Symbol.asyncIterator]();
    globalThis.liveNext = liveStream.next();
    await application.query('conversation', {});
  });
  blocked = true;
  const rejected = await fetch(`${origin}/participant`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(createParticipantRequest({ applicationId, facet: 'control', action: 'read', payload: {} })),
  });
  assert.equal(rejected.status, 503);
  const beforeTraffic = traffic(), beforeTransport = await inspect(ab);
  assert.equal((await submitMessage('Browser commands without host access')).outcome, 'accepted');
  await post(a, 'native-host-blocked', 'Native commands without host access');
  await synchronize(ab);
  const beforeDisposable = await a.recoveryPoint();
  await a.signals.send('typing', { typing: true }, { ttlMs: 2500 });
  const live = await page.evaluate(async () => {
    const result = await Promise.race([liveNext, new Promise((_, reject) => setTimeout(() => reject(Error('FIXTURE_SIGNAL_TIMEOUT')), 10_000))]);
    liveAbort.abort(); await liveStream.return(); return result.value;
  });
  assert.equal(live.payload.typing, true);
  const contentBytes = new Uint8Array(randomBytes(32_768));
  const upload = await a.content.stage({ bytes: contentBytes.length, mediaType: 'application/octet-stream' });
  await upload.write(0, contentBytes); const reference = await upload.commit();
  const retainedContent = await page.evaluate(async reference => {
    const retention = await application.content.retain(reference), chunks = [];
    for await (const chunk of application.content.read(reference)) chunks.push(...chunk);
    const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(chunks)))].map(value => value.toString(16).padStart(2, '0')).join('');
    return { retention, bytes: chunks.length, digest };
  }, reference);
  assert.equal(retainedContent.digest, hash(contentBytes));
  assert.equal(retainedContent.retention.payload.peer, browserIdentity.deviceId);
  assert.deepEqual(await a.recoveryPoint(), beforeDisposable);
  const coherent = await page.evaluate(async () => ({ old: (await capturedView.readEvents()).events.length,
    initial: initialEvents, current: (await application.query('conversation', {})).value.messages.length }));
  assert.equal(coherent.old, coherent.initial); assert.ok(coherent.current > coherent.old);
  const afterTransport = await inspect(ab), afterTraffic = traffic();
  assert.deepEqual(afterTraffic, beforeTraffic);
  assert.ok(afterTransport.reliable.sentBytes > beforeTransport.reliable.sentBytes);
  assert.deepEqual((await browserQuery()).value, (await a.query('conversation', {})).value);
  report.hostOutage = { blocked: true, blockedProbeRejected: true, commandsApplied: 2,
    before: beforeTraffic, after: afterTraffic, transport: { before: beforeTransport, after: afterTransport },
    liveSignalsObserved: 1, content: { bytes: retainedContent.bytes, sha256: retainedContent.digest, retainedByBrowser: true },
    disposablePathsDidNotAppend: true, coherentReadView: true };
  await checkpoint('applied commands, live signals, and encrypted content with control HTTP blocked');

  // A retained receipt certifies complete local ciphertext. A partial read must
  // survive a Worker restart without claiming that the missing suffix exists.
  await page.evaluate(() => capturedView.release());
  blocked = false;
  const resumableBytes = Uint8Array.from({ length: 131_095 }, (_, index) => index % 251);
  const staged = await a.content.stage({ bytes: resumableBytes.length });
  for (let index = 0; index * 65_536 < resumableBytes.length; index++) await staged.write(index, resumableBytes.slice(index * 65_536, (index + 1) * 65_536));
  const resumableReference = await staged.commit();
  const readRange = async (offset, length) => page.evaluate(async ({ reference, offset, length }) => {
    let bytes = 0;
    for await (const chunk of application.content.read(reference, { offset, length })) {
      for (let index = 0; index < chunk.length; index++) if (chunk[index] !== (offset + bytes + index) % 251) throw Error('FIXTURE_CONTENT_BYTES_CHANGED');
      bytes += chunk.length;
    }
    return bytes;
  }, { reference: resumableReference, offset, length });
  assert.equal(await readRange(0, 65_536), 65_536);
  await assert.rejects(page.evaluate(reference => application.content.retained(reference), resumableReference), /CONTENT_NOT_RETAINED/);
  const draft = 'An unsent draft must survive page replacement and recovery.';
  await page.locator('#message').fill(draft);
  await disconnect(ab); await page.evaluate(() => fixture.close());
  await page.goto(`${origin}/compact.html`); await page.waitForFunction(() => !!globalThis.fixture);
  const partialReopened = await page.evaluate(deviceName => fixture.open({ deviceName }), deviceName);
  assert.equal(partialReopened.deviceId, opened.deviceId); assert.equal(partialReopened.storageId, opened.storageId);
  await page.waitForFunction(() => !document.querySelector('#message').disabled);
  const draftAfterRestart = await page.locator('#message').inputValue(); assert.equal(draftAfterRestart, draft);
  assert.equal(await readRange(0, 65_536), 65_536);
  await assert.rejects(readRange(65_536, 1), /CONTENT_UNAVAILABLE/);
  ab = await connect(a, 'answerer');
  assert.equal(await readRange(0, resumableBytes.length), resumableBytes.length);
  const completeRetention = await page.evaluate(reference => application.content.retain(reference), resumableReference);
  assert.equal(completeRetention.payload.peer, opened.deviceId);
  report.contentRecovery = { bytes: resumableBytes.length, interruptedAfter: 65_536, partialRetentionRefused: true,
    partialSurvivedRestart: true, unavailableRemainderRefused: true, completeAfterReconnect: true,
    retainedBy: completeRetention.payload.peer, retentionSignature: completeRetention.signature };
  await page.evaluate(async () => { globalThis.capturedView = await application.readView(); });
  await checkpoint('partial encrypted content survived Worker restart and completed after reconnect');

  const retainedPrefix = await page.evaluate(() => application.recoveryPoint());
  await disconnect(ab);
  const excluded = await submitMessage('Intent on the old generation', 'saved');
  await page.locator('#message').fill(draft);
  await post(a, 'originator-tail-1', 'Unshared originator tail one');
  await post(a, 'originator-tail-2', 'Unshared originator tail two');
  const lostHead = await a.recoveryPoint();
  assert.ok(lostHead.point.sequence > retainedPrefix.point.sequence);
  await a.close();
  await rename(join(stores, 'a'), join(stores, 'a-unavailable'));
  blocked = false;
  const recovered = await page.evaluate(async operationId => {
    const notice = await application.recovery.takeover({ transitionId: 'browser-retained-prefix' });
    let abandoned, staleView;
    try { await application.operations.wait(operationId); } catch (error) { abandoned = { name: error.name, state: error.operation }; }
    try { await capturedView.readEvents(); } catch (error) { staleView = error.name; }
    await capturedView.release();
    const selected = await application.query('conversation', {});
    return { notice, abandoned, staleView, selected,
      journal: await application.recovery.inspect(), recovery: await application.inspectRecovery(), status: application.status };
  }, excluded.operationId);
  await page.locator('#recovery').waitFor({ state: 'visible' });
  await page.waitForFunction(id => ['abandoned', 'needsReapply'].includes(document.querySelector(`[data-operation="${id}"]`)?.dataset.status), excluded.operationId);
  assert.equal(await page.locator('#message').inputValue(), draft);
  const reviewedIds = await page.locator('#operations li').evaluateAll(rows => rows.map(row => row.dataset.operation));
  page.once('dialog', dialog => dialog.accept());
  await page.locator(`#operations [data-operation="${excluded.operationId}"] [data-action="reapply"]`).click();
  await page.waitForFunction(ids => [...document.querySelectorAll('#operations li')].some(row => !ids.includes(row.dataset.operation) && row.dataset.status === 'applied'), reviewedIds);
  const reappliedId = await page.locator('#operations li').evaluateAll((rows, ids) => rows.find(row => !ids.includes(row.dataset.operation)).dataset.operation, reviewedIds);
  recovered.applied = await page.evaluate(id => application.operations.get(id), reappliedId);
  recovered.inspected = await page.evaluate(id => application.operations.inspect(id), reappliedId);
  assert.equal(recovered.status.role, 'coordinator');
  assert.equal(recovered.abandoned.name, 'AbandonedOperationError');
  assert.ok(['abandoned', 'needsReapply'].includes(recovered.abandoned.state.status));
  assert.equal(recovered.staleView, 'RecoveredViewError');
  assert.equal(recovered.applied.outcome, 'accepted');
  assert.equal(recovered.applied.operationId, reappliedId);
  assert.equal(recovered.inspected.attempt.payload.header.reapplyOf, recovered.abandoned.state.attemptId);
  assert.notEqual(recovered.applied.attemptId, recovered.abandoned.state.attemptId);
  assert.equal(recovered.journal.length, 1);
  assert.equal(recovered.journal[0].request.payload.base.point.root, retainedPrefix.point.root);
  assert.equal(recovered.journal[0].selected, recovered.status.generation);
  assert.ok(recovered.recovery.length > 0);
  assert.ok(recovered.selected.value.messages.every(message => !message.operationId.startsWith('originator-tail-')));
  report.recovery = { originatorClosed: true, originatorStoreUnavailable: true, priorHead: lostHead.point,
    adoptedPrefix: retainedPrefix.point, selectedGeneration: recovered.status.generation,
    originalAttempt: recovered.abandoned.state, reapplied: recovered.applied, staleViewError: recovered.staleView,
    reapplyOf: recovered.inspected.attempt.payload.header.reapplyOf, currentGuardsChecked: true,
    noticesPersisted: recovered.recovery.length, transitionJournalEntries: recovered.journal.length };
  report.ui = { pages: ['board.html', 'compact.html'], domain: 'events', sessionFacade: 'connectApplicationWorker',
    sentThroughForms: 3, reapplicationConfirmed: true, recoveryNoticeVisible: await page.locator('#recovery').isVisible(),
    draftBeforeRestart: draft, draftAfterRestart, draftAfterRecovery: await page.locator('#message').inputValue(),
    originalReviewPreserved: await page.locator(`#operations [data-operation="${excluded.operationId}"]`).count() === 1 };
  await checkpoint('browser took over its retained prefix and visibly abandoned old-generation intent');

  authority = await registry.read();
  const c = await openNative(deviceC, authority);
  assert.equal(c.status.phase, 'awaiting-keys');
  const bc = await connect(c, 'offerer');
  await synchronize(bc);
  const [browserResult, freshResult] = await Promise.all([browserQuery(), c.query('conversation', {})]);
  assert.deepEqual(freshResult.value, browserResult.value);
  assert.equal(c.status.phase, 'ready');
  assert.ok(freshResult.value.messages.some(message => message.operationId === reappliedId));
  assert.ok(freshResult.value.messages.every(message => !message.operationId.startsWith('originator-tail-')));
  report.freshPeer = { deviceId: c.deviceId, joinedAfterOriginatorLoss: true, enrolledFromBrowser: true,
    generation: freshResult.revision.generation, browserViewSha256: valueHash(browserResult.value), nativeViewSha256: valueHash(freshResult.value) };
  await disconnect(bc);
  await page.evaluate(() => fixture.close());
  await page.goto(`${origin}/board.html`); await page.waitForFunction(() => !!globalThis.fixture);
  const reopened = await page.evaluate(deviceName => fixture.open({ deviceName }), deviceName);
  assert.equal(reopened.deviceId, opened.deviceId); assert.equal(reopened.storageId, opened.storageId);
  assert.deepEqual((await browserQuery()).value, browserResult.value);
  assert.equal(reopened.status.phase, 'ready');
  assert.equal(await page.evaluate(async id => (await application.operations.get(id)).status, reappliedId), 'applied');
  report.ownership.gracefulReopen = { sameDeviceId: true, sameStorageId: true, sameView: true, storedKeysReused: true };

  assert.equal((await browserPost('before-worker-loss', 'Durable before abrupt Worker loss')).outcome, 'accepted');
  const beforeCrash = await browserQuery();
  await page.evaluate(() => fixture.crash());
  await page.goto(`${origin}/compact.html`); await page.waitForFunction(() => !!globalThis.fixture);
  let crashReopened, attempts = 0;
  for (;;) {
    attempts++;
    try { crashReopened = await page.evaluate(deviceName => fixture.open({ deviceName }), deviceName); break; }
    catch (error) { if (!String(error).includes('BROWSER_STORAGE_IN_USE') || attempts >= 20) throw error; await new Promise(resolveWait => setTimeout(resolveWait, 50)); }
  }
  assert.equal(crashReopened.deviceId, opened.deviceId); assert.equal(crashReopened.storageId, opened.storageId);
  assert.deepEqual((await browserQuery()).value, beforeCrash.value);
  assert.equal(await page.evaluate(async () => (await application.operations.get('before-worker-loss')).status), 'applied');
  report.ownership.abruptWorkerReopen = { sameDeviceId: true, sameStorageId: true, sameView: true, durableOperation: true, attempts };
  report.browser.observations = await page.evaluate(() => fixture.observations());
  assert.equal(report.browser.observations.secureContext, true);
  assert.equal(report.browser.observations.storage, true); assert.equal(report.browser.observations.locks, true);
  assert.equal(report.browser.pageErrors.length, 0);
  await page.evaluate(() => fixture.close());
  report.passed = true;
  await checkpoint('fresh peer replay and graceful plus abrupt Worker reopening passed');
} catch (error) {
  report.passed = false; report.error = error instanceof Error ? error.stack : String(error); throw error;
} finally {
  report.connections = connections.map(connection => ({ ...connection.observed, signaling: connection.mailbox.snapshot(),
    nativeClosed: connection.native.signal.aborted }));
  await Promise.allSettled(connections.map(connection => connection.native.close()));
  await browser?.close().catch(() => undefined);
  await Promise.allSettled([...sessions].map(session => session.close()));
  await Promise.allSettled([...devices].map(device => device.close()));
  if (server) { server.closeAllConnections(); await new Promise(resolveClose => server.close(resolveClose)); }
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
}

async function bootstrap(identity) {
  if (browserIdentity) { assert.deepEqual(identity, browserIdentity); return { authority: await registry.read() }; }
  assert.match(identity.deviceId, /^[a-f0-9]{64}$/u); assert.match(identity.storageId, /^[a-f0-9-]{36}$/u);
  browserIdentity = identity;
  const execution = await executionManifestArtifacts(await eventExecutionManifest());
  const descriptor = await signApplicationDescriptor({ applicationId, historyId: 'browser-peer-conversation',
    executionManifestDigest: Buffer.from(execution.executionManifestDigest).toString('hex'),
    definitionDigest: await applicationDefinitionDigest(conversation), schemaAdministrator: controlDevice.identity.publicKey, schemaDigest: null,
    profile: 'peer-generation-v1', policy: 'eligible-members-v1', controlPublicKey: controlDevice.identity.publicKey,
  }, controlDevice.identity);
  const control = await signControlRevision({ applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
    revision: 0, previous: null, epoch: 0, keyDigest: await bytesDigest(key), recoveryFloor: null,
    grants: [deviceA.identity.publicKey, identity.deviceId, deviceC.identity.publicKey].map(publicKey => participantGrant(publicKey, { administrator: true })),
  }, controlDevice.identity);
  registry = await createGenerationRegistry({ store: controlDevice.store, descriptor, controls: [control], signer: controlDevice.identity });
  await registry.select(await signTransitionRequest({ applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
    transitionId: 'browser-create', expectedGeneration: null, coordinator: deviceA.identity.publicKey, requester: deviceA.identity.publicKey,
    controlRevision: 0, reason: 'create', base: null,
  }, deviceA.identity));
  authority = await registry.read();
  a = await openNative(deviceA, authority, new Map([[0, key]]));
  report.executionManifestDigest = descriptor.payload.executionManifestDigest;
  return { authority };
}

async function route(request, response) {
  const pathname = new URL(request.url, 'http://fixture').pathname;
  const chunks = []; let bytes = 0;
  for await (const chunk of request) { bytes += chunk.length; if (bytes > 1_048_576) throw Error('FIXTURE_REQUEST_TOO_LARGE'); chunks.push(chunk); }
  const body = bytes ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
  const json = value => { response.setHeader('content-type', 'application/json'); response.end(JSON.stringify(value)); };
  if (pathname === '/fixture/bootstrap') { json(await bootstrap(body)); return; }
  if (pathname === '/participant' && request.method === 'POST') {
    controlRequests++; controlBodyBytes += bytes;
    if (blocked) { response.statusCode = 503; json({ error: { code: 'control_host_unavailable', message: 'CONTROL_HOST_UNAVAILABLE' } }); return; }
    const envelope = validateParticipantRequest(body);
    assert.equal(envelope.applicationId, applicationId);
    let payload;
    if (envelope.facet === 'control' && envelope.action === 'read') payload = await registry.read();
    else if (envelope.facet === 'control' && envelope.action === 'select') payload = await registry.select(envelope.payload.request);
    else throw Error('FIXTURE_CONTROL_INTEREST_UNKNOWN');
    json(createParticipantResponse(envelope, payload));
    return;
  }
  if (pathname.startsWith('/signaling/')) {
    signalingRequests++; signalingBodyBytes += bytes;
    const match = /^\/signaling\/(\d+)\/(next|send|close)$/u.exec(pathname), mailbox = match && introductions.get(match[1]);
    if (!mailbox) throw Error('FIXTURE_SIGNALING_UNKNOWN');
    if (match[2] === 'next') json(await mailbox.browserNext());
    else if (match[2] === 'send') { mailbox.browserSend(body); json({}); }
    else { mailbox.browserClose(); json({}); }
    return;
  }
  if (pathname === '/') { response.setHeader('content-type', 'text/html'); response.end(await readFile(join(assets, 'board.html'))); return; }
  if (pathname === '/favicon.ico') { response.statusCode = 204; response.end(); return; }
  if (/^\/[A-Za-z0-9_.-]+\.(mjs|html|css)$/u.test(pathname)) {
    response.setHeader('content-type', pathname.endsWith('.mjs') ? 'text/javascript' : pathname.endsWith('.html') ? 'text/html' : 'text/css');
    response.end(await readFile(join(assets, pathname.slice(1)))); return;
  }
  throw Error('FIXTURE_ROUTE_UNKNOWN');
}

async function connect(session, browserRole) {
  const id = String(introductions.size + 1), mailbox = introduction(); introductions.set(id, mailbox);
  const start = performance.now();
  const outcomes = await Promise.allSettled([
    connectNativeApplicationWebRtc(session, { native, role: browserRole === 'offerer' ? 'answerer' : 'offerer',
      peerIdentity: browserIdentity.deviceId, signaling: mailbox.native, timeoutMs: 30_000 }),
    page.evaluate(options => fixture.connect(options), { id, role: browserRole, peerId: session.deviceId }),
  ]);
  if (outcomes.some(value => value.status === 'rejected')) {
    if (outcomes[0].status === 'fulfilled') await outcomes[0].value.close();
    throw outcomes.find(value => value.status === 'rejected').reason;
  }
  const nativeLink = outcomes[0].value, browserLink = outcomes[1].value;
  assert.equal(nativeLink.peerId, browserIdentity.deviceId); assert.equal(browserLink.peerId, session.deviceId);
  const routes = [await nativeLink.rtc.getRoute(), browserLink.route];
  assert.ok(routes.every(route => route.route === 'direct' && route.localCandidateType && route.remoteCandidateType));
  assert.equal(mailbox.snapshot().closed, true); assert.equal(mailbox.snapshot().descriptions, 2);
  const connection = { id, native: nativeLink, mailbox, observed: { peers: [session.deviceId, browserIdentity.deviceId],
    authenticated: true, routes, connectedInMs: performance.now() - start } };
  connections.push(connection); return connection;
}
async function synchronize(connection) { await Promise.all([connection.native.synchronize(), page.evaluate(id => fixture.inspect(id), connection.id)]); }
async function inspect(connection) {
  const browserLink = await page.evaluate(id => fixture.inspect(id), connection.id);
  return { reliable: { sentBytes: browserLink.stats.sentBytes + connection.native.stats.sentBytes,
    receivedBytes: browserLink.stats.receivedBytes + connection.native.stats.receivedBytes }, signaling: connection.mailbox.snapshot() };
}
async function disconnect(connection) { await Promise.all([connection.native.close(), page.evaluate(id => fixture.disconnect(id), connection.id)]); }
async function submitMessage(text, expected = 'applied') {
  await page.waitForFunction(() => !document.querySelector('#send').disabled);
  await page.locator('#message').fill(text); await page.locator('#send').click();
  await page.waitForFunction(({ text, expected }) => [...document.querySelectorAll('#operations li')]
    .some(row => row.querySelector('strong')?.textContent === text && row.dataset.status === expected), { text, expected });
  const operationId = await page.locator('#operations li').evaluateAll((rows, text) => rows.find(row => row.querySelector('strong')?.textContent === text).dataset.operation, text);
  return page.evaluate(id => application.operations.get(id), operationId);
}
function introduction() {
  let deliverNative, deliverBrowser, nativeClosed = false, browserClosed = false, descriptions = 0, bytes = 0;
  const toNative = new Promise(resolveNext => { deliverNative = resolveNext; }), toBrowser = new Promise(resolveNext => { deliverBrowser = resolveNext; });
  let sentNative = false, sentBrowser = false;
  const record = description => { assert.ok(['offer', 'answer'].includes(description.type)); assert.equal(typeof description.sdp, 'string'); descriptions++; bytes += Buffer.byteLength(description.sdp); };
  return {
    native: { messages: { async *[Symbol.asyncIterator]() { const description = await toNative; if (description) yield description; } },
      async send(description) { assert.equal(nativeClosed || sentNative, false); sentNative = true; record(description); deliverBrowser(description); },
      close() { nativeClosed = true; if (!sentBrowser) deliverNative(null); } },
    browserNext: () => toBrowser,
    browserSend(description) { assert.equal(browserClosed || sentBrowser, false); sentBrowser = true; record(description); deliverNative(description); },
    browserClose() { browserClosed = true; if (!sentNative) deliverBrowser(null); },
    snapshot: () => ({ descriptions, bytes, closed: nativeClosed && browserClosed }),
  };
}
