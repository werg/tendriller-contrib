// Installed public APIs only: real OPFS Workers and the maintained native RTC adapter.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { applicationDefinitionDigest, bytesDigest, CONTENT_CHUNK_BYTES, createGenerationRegistry,
  eventExecutionManifest, executionManifestArtifacts, participantGrant,
  signApplicationDescriptor, signControlRevision, signTransitionRequest } from '@chronolog/peer-session';
import { openNativeApplication, openNativeDevice } from '@chronolog/peer-session/native';
import { connectNativeApplicationWebRtc } from '@chronolog/peer-session/webrtc-native';
import { conversation } from './peer-generation-definition.mjs';

const reportPath = resolve(process.argv[2]), report = JSON.parse(await readFile(reportPath, 'utf8'));
const root = dirname(fileURLToPath(import.meta.url));
const resources = [], links = [], introductions = [];
let browser, host, page, native, authority, browserIdentity;
const stage = async name => { report.stage = name; await writeReport(); console.log(`Peer browser consumer: ${name}`); };
const call = (action, args) => page.evaluate(({ action, args }) => window.peerFixture.call(action, args), { action, args });
const query = () => call('query');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const timeout = () => AbortSignal.timeout(15_000);

try {
  host = await serve();
  browser = await chromium.launch({ headless: true,
    ...(process.env.PEER_BROWSER_EXECUTABLE ? { executablePath: process.env.PEER_BROWSER_EXECUTABLE } : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-experimental-web-platform-features'] });
  const context = await browser.newContext();
  page = await context.newPage();
  await page.goto(host.url); await page.waitForFunction(() => window.peerFixture);
  report.browser = { version: browser.version(), headless: true, owner: 'DedicatedWorker', storage: 'OPFS', tabs: 2,
    consoleErrors: [], runtimeErrors: [] };
  page.on('pageerror', error => report.browser.runtimeErrors.push(String(error)));
  const storageName = `peer-consumer-${randomBytes(8).toString('hex')}`;
  const workerDevice = await page.evaluate(name => window.peerFixture.openDevice({ name, create: true }), storageName);
  browserIdentity = workerDevice.deviceId;
  const second = await context.newPage(); await second.goto(host.url); await second.waitForFunction(() => window.peerFixture);
  await assert.rejects(second.evaluate(name => window.peerFixture.openDevice({ name }), storageName), /BROWSER_STORAGE_IN_USE/);
  await second.close();
  assert.match(await page.evaluate(() => window.peerFixture.unsupported()), /BROWSER_DURABLE_STORAGE_UNAVAILABLE/);
  assert.match(await page.evaluate(() => window.peerFixture.pageOwner()), /BROWSER_PEER_WORKER_REQUIRED/);
  report.ownership = { secondTabRefused: true, unsupportedStorageRefused: true,
    unsupportedFault: 'Worker navigator.storage.getDirectory removed by the test', pageOwnershipRefused: true };

  const device = await openNativeDevice({ path: join(dirname(reportPath), 'stores/native.sqlite'), create: true });
  const controlDevice = await openNativeDevice({ path: join(dirname(reportPath), 'stores/control.sqlite'), create: true });
  resources.push(device, controlDevice);
  const applicationId = randomBytes(32).toString('hex'), epochKey = new Uint8Array(randomBytes(32));
  const execution = await executionManifestArtifacts(await eventExecutionManifest('peer-generation-v1'));
  const descriptor = await signApplicationDescriptor({ applicationId, historyId: 'browser-peer-conversation',
    profile: 'peer-generation-v1', policy: 'eligible-members-v1', controlPublicKey: controlDevice.identity.publicKey,
    executionManifestDigest: Buffer.from(execution.executionManifestDigest).toString('hex'),
    definitionDigest: await applicationDefinitionDigest(conversation), schemaAdministrator: controlDevice.identity.publicKey, schemaDigest: null,
  }, controlDevice.identity);
  const control = await signControlRevision({ applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
    revision: 0, previous: null, epoch: 0, keyDigest: await bytesDigest(epochKey), recoveryFloor: null,
    grants: [workerDevice.deviceId, device.identity.publicKey].map(key => participantGrant(key, { dataRole: 'member', administrator: true })) }, controlDevice.identity);
  const registry = await createGenerationRegistry({ store: controlDevice.store, descriptor, controls: [control], signer: controlDevice.identity });
  const select = async (coordinator, expectedGeneration, base, transitionId, reason = 'takeover') => registry.select(await signTransitionRequest({
    applicationId, profile: descriptor.payload.profile, policy: descriptor.payload.policy,
    transitionId, expectedGeneration, coordinator, requester: device.identity.publicKey, controlRevision: 0, reason, base,
  }, device.identity));
  const first = await select(workerDevice.deviceId, null, null, 'browser-initial', 'create');
  authority = await registry.read();
  const opened = await call('open', { authority, epochKey: [...epochKey] });
  assert.equal(opened.status.role, 'coordinator'); assert.equal(opened.capabilities.finality, false);
  native = await openNativeApplication({ device, authority, epochKeys: new Map([[0, epochKey]]), definition: conversation });
  resources.push(native);
  report.executionManifestDigest = descriptor.payload.executionManifestDigest;
  await stage('opened real exclusive OPFS Worker');

  let link = await connect();
  const firstOperation = await submitMessage('Retained from a real browser Worker');
  assert.equal(firstOperation.outcome, 'accepted');
  await synchronize(link);
  const retained = await native.recoveryPoint();
  assert.deepEqual((await query()).value, (await native.query('conversation', {})).value);

  host.blocked = true;
  assert.equal(await page.evaluate(() => fetch('/blocked-probe').then(response => response.status)), 503);
  const requestsBefore = host.requests, bytesBefore = link.native.stats.sentBytes + link.native.stats.receivedBytes;
  const fromNative = await native.command('postMessage', { messageId: 'native-blocked', text: 'Native with page host unavailable' }, { operationId: 'native-blocked' });
  assert.equal((await fromNative.applied({ signal: timeout() })).outcome, 'accepted');
  assert.equal((await submitMessage('Browser with page host unavailable')).outcome, 'accepted');
  const liveAbort = new AbortController();
  const live = native.signals.subscribe({ topics: ['typing'], signal: AbortSignal.any([liveAbort.signal, timeout()]) })[Symbol.asyncIterator]();
  const liveResult = live.next(), beforeLive = await native.recoveryPoint();
  await call('signal');
  assert.equal((await liveResult).value.payload.typing, true);
  liveAbort.abort(); await live.return?.();
  assert.deepEqual(await native.recoveryPoint(), beforeLive);
  await synchronize(link);
  assert.deepEqual((await query()).value, (await native.query('conversation', {})).value);
  assert.equal(host.requests, requestsBefore);
  const bytesAfter = link.native.stats.sentBytes + link.native.stats.receivedBytes;
  assert.ok(bytesAfter > bytesBefore);
  report.hostOutage = { boundary: 'loopback-static-page-and-sdp', blockedProbeStatus: 503,
    requests: { before: requestsBefore, after: host.requests }, applicationBodyBytes: host.applicationBodyBytes,
    commandsApplied: 2, liveSignalsObserved: 1, reliableBytes: { before: bytesBefore, after: bytesAfter },
    signalingClosed: introductions.every(value => value.closed()) };
  host.blocked = false;
  await stage('browser/native commands and live signals outlived the page host');

  const upload = await native.content.stage({ bytes: CONTENT_CHUNK_BYTES * 2 + 23, mediaType: 'application/octet-stream' });
  for (let index = 0; index < 3; index++) {
    const size = index < 2 ? CONTENT_CHUNK_BYTES : 23;
    await upload.write(index, Uint8Array.from({ length: size }, (_, offset) => (index * CONTENT_CHUNK_BYTES + offset) % 251));
  }
  const reference = await upload.commit();
  assert.equal((await call('readContent', { reference, length: CONTENT_CHUNK_BYTES })).bytes, CONTENT_CHUNK_BYTES);
  await assert.rejects(call('retained', { reference }), /CONTENT_NOT_RETAINED/);
  await closeLink(link);
  // A second observed update occurs only in the disconnected original Worker.
  const abandoned = await submitMessage('A signed old-branch operation');
  assert.equal(abandoned.outcome, 'accepted');
  const oldHead = await call('point');
  const beforeRecovery = await query();
  const beforeRestart = await call('operation', { id: firstOperation.operationId });
  const draft = 'An unsent draft must survive page replacement and recovery.';
  await page.locator('#message').fill(draft);
  assert.equal(await page.locator('#message').inputValue(), draft);
  await page.evaluate(() => window.peerFixture.close());
  await page.goto(`${host.url}/compact.html`); await page.waitForFunction(() => window.peerFixture);
  const reopenedDevice = await page.evaluate(name => window.peerFixture.openDevice({ name }), storageName);
  assert.deepEqual(reopenedDevice, workerDevice);
  await call('open', { authority, epochKey: [...epochKey] });
  await page.waitForFunction(() => !document.querySelector('#message').disabled);
  const draftAfterRestart = await page.locator('#message').inputValue();
  assert.equal(draftAfterRestart, draft);
  assert.deepEqual(await call('operation', { id: firstOperation.operationId }), beforeRestart);
  assert.equal((await call('readContent', { reference, length: CONTENT_CHUNK_BYTES })).bytes, CONTENT_CHUNK_BYTES);
  await assert.rejects(call('readContent', { reference, offset: CONTENT_CHUNK_BYTES }), /CONTENT_UNAVAILABLE/);
  report.reopen = { identityBefore: workerDevice.deviceId, identityAfter: reopenedDevice.deviceId,
    storageBefore: workerDevice.storageId, storageAfter: reopenedDevice.storageId,
    operationBefore: beforeRestart, operationAfter: await call('operation', { id: firstOperation.operationId }) };
  report.content = { bytes: reference.bytes, interruptedAfter: CONTENT_CHUNK_BYTES,
    partialRetentionRefused: true, partialSurvivedRestart: true, unavailableRemainderRefused: true };
  await stage('reopened identity, operations, and partial content from OPFS');

  // The recovery decision deliberately selects the first retained command.
  const selected = await select(device.identity.publicKey, first.id, retained, 'native-recovery');
  authority = await registry.read();
  const nativeNotice = await native.adopt(authority);
  assert.equal(nativeNotice.generation, selected.id);
  const notice = await call('adopt', authority);
  assert.ok(notice.abandoned.some(value => value.operationId === abandoned.operationId));
  const recovered = await query();
  const nativeRecovered = await native.query('conversation', {});
  assert.notEqual(beforeRecovery.revision.generation, recovered.revision.generation);
  assert.deepEqual(recovered.value, nativeRecovered.value);
  assert.deepEqual(await call('operation', { id: firstOperation.operationId }), beforeRestart);
  assert.equal((await call('operation', { id: abandoned.operationId })).status, 'abandoned');
  await assert.rejects(call('retry', { id: abandoned.operationId }), /abandoned|Abandoned|ABANDONED/u);
  await page.locator('#recovery').waitFor({ state: 'visible' });
  await page.waitForFunction(id => document.querySelector(`[data-operation="${id}"][data-status="abandoned"]`), abandoned.operationId);
  assert.equal(await page.locator('#message').inputValue(), draft);
  await page.waitForFunction(() => document.querySelectorAll('#conversation li').length === 1);
  assert.doesNotMatch(await page.locator('#conversation').textContent(), /A signed old-branch operation/u);
  link = await connect(); await synchronize(link);
  assert.deepEqual((await query()).value, recovered.value, 'Returning Worker must not import its excluded tail');
  const reviewedIds = await page.locator('#operations li').evaluateAll(rows => rows.map(row => row.dataset.operation));
  page.once('dialog', dialog => dialog.accept());
  await page.locator(`#operations [data-operation="${abandoned.operationId}"] [data-action="reapply"]`).click();
  await page.waitForFunction(ids => [...document.querySelectorAll('#operations li')].some(row => !ids.includes(row.dataset.operation) && row.dataset.status === 'applied'), reviewedIds);
  const reappliedId = await page.locator('#operations li').evaluateAll((rows, ids) => rows.find(row => !ids.includes(row.dataset.operation)).dataset.operation, reviewedIds);
  const reapplied = await call('operation', { id: reappliedId });
  assert.equal(reapplied.outcome, 'accepted'); assert.notEqual(reapplied.attemptId, abandoned.attemptId);
  const reapplication = await call('inspectOperation', { id: reapplied.operationId });
  assert.equal(reapplication.attempt.payload.header.reapplyOf, abandoned.attemptId);
  const retention = await call('retain', { reference });
  assert.equal(retention.payload.peer, workerDevice.deviceId);
  assert.equal(retention.payload.storageId, workerDevice.storageId);
  assert.equal((await call('readContent', { reference })).bytes, reference.bytes);
  Object.assign(report.content, { completeAfterReconnect: true, retainedBy: retention.payload.peer, retentionSignature: retention.signature });
  report.recovery = { previousGeneration: first.id, selectedGeneration: selected.id, previousHead: oldHead.point.sequence,
    adoptedPosition: retained.point.sequence, recoveredDigest: hash(recovered.value), nativeDigest: hash(nativeRecovered.value),
    coherentReset: true, inheritedIdentityPreserved: true, abandonedOperationId: abandoned.operationId,
    abandonedAttemptId: abandoned.attemptId, returningTailExcluded: true, retryRefused: true,
    reappliedOperationId: reapplied.operationId, reappliedAttemptId: reapplied.attemptId,
    reapplyOf: reapplication.attempt.payload.header.reapplyOf };
  report.ui = { pages: ['board.html', 'compact.html'], domain: 'events', sessionFacade: 'connectApplicationWorker',
    sentThroughForms: 3, reapplicationConfirmed: true, recoveryNoticeVisible: await page.locator('#recovery').isVisible(),
    draftBeforeRestart: draft, draftAfterRestart, draftAfterRecovery: await page.locator('#message').inputValue(),
    originalReviewPreserved: await page.locator(`#operations [data-operation="${abandoned.operationId}"][data-status="abandoned"]`).count() === 1 };
  await synchronize(link);
  assert.deepEqual((await query()).value, (await native.query('conversation', {})).value);
  assert.equal(report.browser.runtimeErrors.length, 0);
  await stage('recovered a coherent browser/native history and explicitly reapplied');
  report.passed = true;
} catch (error) {
  report.error = error instanceof Error ? error.stack ?? error.message : String(error);
  throw error;
} finally {
  for (const link of links) await closeLink(link).catch(() => undefined);
  await page?.evaluate(() => window.peerFixture?.close()).catch(() => undefined);
  await browser?.close();
  await Promise.allSettled(resources.map(value => value.close()));
  await host?.close();
  report.rtc = { implementation: 'Chromium and werift', nativeVersion: '0.27.0',
    candidateSource: 'native-explicit-loopback/browser-discovered', byteBoundary: 'authenticated-reliable-application-frames',
    signalingBoundary: 'one-off-loopback-http-test-mailbox', connections: links.map(value => ({ ...value.observed,
      closed: value.closed, native: { ...value.native.stats }, signaling: value.introduction.snapshot() })) };
  await writeReport();
}

async function connect() {
  const introduction = host.introduction(); introductions.push(introduction);
  const results = await Promise.allSettled([
    connectNativeApplicationWebRtc(native, { role: 'offerer', expectedPeerId: browserIdentity, signaling: introduction.native,
      // The expected browser identity is retained by the fixture, never inferred from RTC.
      native: { iceInterfaceAddresses: { udp4: '127.0.0.1' }, iceAdditionalHostAddresses: ['127.0.0.1'],
        iceUseIpv4: false, iceUseIpv6: false, iceUseTcp: false } }),
    page.evaluate(({ id, peerId }) => window.peerFixture.connect({ id, peerId }), { id: introduction.id, peerId: native.deviceId }),
  ]);
  if (results.some(value => value.status === 'rejected')) {
    if (results[0].status === 'fulfilled') await results[0].value.close();
    await page.evaluate(() => window.peerFixture.disconnect()).catch(() => undefined);
    throw results.find(value => value.status === 'rejected').reason;
  }
  const connection = results[0].value, remote = results[1].value;
  assert.equal(remote.peerId, native.deviceId); assert.equal(introduction.closed(), true);
  const value = { native: connection, introduction, closed: false,
    observed: { authenticated: true, nativePeer: connection.peerId, browserPeer: remote.peerId,
      routes: [await connection.rtc.getRoute(), remote.route] } };
  links.push(value); return value;
}
async function synchronize(link) { await Promise.all([link.native.synchronize(), page.evaluate(() => window.peerFixture.synchronize())]); }
async function submitMessage(text) {
  await page.waitForFunction(() => !document.querySelector('#send').disabled);
  await page.locator('#message').fill(text);
  await page.locator('#send').click();
  await page.waitForFunction(label => [...document.querySelectorAll('#operations li')].some(row => row.querySelector('strong')?.textContent === label && row.dataset.status === 'applied'), text);
  const operationId = await page.locator('#operations li').evaluateAll((rows, label) => rows.find(row => row.querySelector('strong')?.textContent === label).dataset.operation, text);
  return call('operation', { id: operationId });
}
async function closeLink(link) {
  if (link.closed) return;
  await Promise.allSettled([link.native.close(), page?.evaluate(() => window.peerFixture.disconnect())]);
  link.closed = true;
}
async function writeReport() { await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`); }

async function serve() {
  let requests = 0, applicationBodyBytes = 0, blocked = false, sequence = 0;
  const sessions = new Map();
  const replacements = new Map([['@chronolog/peer-session/browser', '/package/browser.mjs'],
    ['@chronolog/peer-session/webrtc', '/package/webrtc.mjs'], ['@chronolog/peer-session', '/package/index.mjs']]);
  const server = createServer(async (request, response) => {
    requests++;
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      const signal = /^\/signaling\/(\d+)\/(send|next|close)$/u.exec(path);
      const chunks = []; let size = 0;
      for await (const chunk of request) { size += chunk.length; assert.ok(size < 65_536); chunks.push(chunk); }
      if (!signal) applicationBodyBytes += size;
      if (blocked) { response.writeHead(503).end('Host unavailable'); return; }
      if (signal) {
        const item = sessions.get(signal[1]); assert.ok(item);
        let value;
        if (signal[2] === 'send') { item.send(1, JSON.parse(Buffer.concat(chunks).toString())); value = { sent: true }; }
        else if (signal[2] === 'next') value = await item.receive(1);
        else { item.close(1); value = { closed: true }; }
        response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(value)); return;
      }
      if (path === '/favicon.ico') { response.writeHead(204).end(); return; }
      if (path === '/deployment/bootstrap.mjs') {
        response.writeHead(200, { 'Content-Type': 'application/javascript' }).end("export { applicationReady } from '/peer-generation-browser-page.mjs';\n"); return;
      }
      const base = path.startsWith('/package/') ? join(root, 'node_modules/@chronolog/peer-session') : root;
      const relative = path === '/' ? 'board.html' : path.startsWith('/package/') ? path.slice(9) : path.slice(1);
      const type = relative.endsWith('.mjs') ? 'application/javascript' : relative.endsWith('.html') ? 'text/html' : relative.endsWith('.css') ? 'text/css' : null;
      assert.ok(type && !relative.split('/').includes('..'));
      const file = resolve(base, relative); assert.ok(file.startsWith(`${base}${sep}`));
      let code = await readFile(file, 'utf8');
      for (const [name, value] of replacements) code = code.replaceAll(`'${name}'`, `'${value}'`);
      response.writeHead(200, { 'Content-Type': type }).end(code);
    } catch (error) { response.writeHead(500).end(String(error)); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, get requests() { return requests; },
    get applicationBodyBytes() { return applicationBodyBytes; },
    set blocked(value) { blocked = value; },
    introduction() {
      const id = `${++sequence}`, incoming = [deferred(), deferred()], closed = [false, false];
      let sentMessages = 0, sentBytes = 0;
      const item = { id,
        send(index, value) { assert.equal(closed[index], false); sentMessages++; sentBytes += Buffer.byteLength(value.sdp); incoming[1 - index].resolve(value); },
        receive: index => incoming[index].promise,
        close(index) { closed[index] = true; }, closed: () => closed.every(Boolean),
        snapshot: () => ({ closed: closed.every(Boolean), sentMessages, sentBytes }),
      };
      item.native = { async send(value) { item.send(0, value); }, messages: (async function* () { yield await item.receive(0); })(), close: () => item.close(0) };
      sessions.set(id, item); return item;
    },
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); },
  };
}
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
