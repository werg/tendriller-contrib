// Uses installed public archives only. Faults occur at transport boundaries.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createClient } from '@tendriller/core';
import { bytesDigest, connectApplications, describeApplication, eventExecutionManifest, executionManifestArtifacts,
  participantGrant, signTransitionRequest } from '@chronolog/peer-session';
import { NativeBytesStore, openNativeApplication, openNativeDevice } from '@chronolog/peer-session/native';
import { openReleaseObserver, openReleasePublisher, peerDigest, signReleaseManifest, verifyReleaseState } from '@chronolog/peer-session/releases';
import { conversation } from './peer-conversation.mjs';
import { releaseAssets } from './peer-release-assets.mjs';
import { openReleaseBrowser } from './peer-release-browser.mjs';

const reportPath = process.env.PEER_RELEASE_REPORT, report = JSON.parse(await readFile(reportPath, 'utf8'));
const directory = dirname(reportPath), fixture = JSON.parse(await readFile(process.env.TASK_HOST_CONFIG, 'utf8'));
const bridge = new URL(fixture.api).origin, client = createClient(fixture), host = client.peers.releases;
const resources = [], timeout = () => AbortSignal.timeout(15_000);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const stage = async name => { report.stage = name; await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`); console.log(`Signed releases: ${name}`); };
const fault = async (name, body = {}) => {
  const response = await fetch(`${bridge}/testing/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: timeout() });
  assert.equal(response.status, 200); return response.json();
};
const page = async (path = '') => {
  const response = await fetch(`${bridge}/page/${path}`, { signal: timeout() });
  assert.equal(response.status, 200); return { response, bytes: new Uint8Array(await response.arrayBuffer()) };
};
const bootstrap = bytes => JSON.parse(/window\.__TENDRIL__=(.*?);<\/script>/u.exec(new TextDecoder().decode(bytes))[1]);

try {
  report.host = JSON.parse(await readFile(fixture.hostEvidence, 'utf8'));
  const device = async (name, create = true) => {
    const value = await openNativeDevice({ path: join(directory, 'stores', `${name}.sqlite`), ...(create ? { create: true } : {}) });
    resources.push(value); return value;
  };
  let publisherDevice = await device('publisher-a');
  const otherPublisherDevice = await device('publisher-b'), dataA = await device('data-a'), dataB = await device('data-b');
  const initial = await host.state(), trust = { applicationId: fixture.applicationId, controlPublicKey: initial.controlPublicKey };
  await verifyReleaseState(initial, trust);
  const publisherPolicy = await host.configure({ requestId: 'initial-publishers', expectedPolicy: null,
    publishers: [publisherDevice, otherPublisherDevice].map(value => ({ publicKey: value.identity.publicKey })) });
  let publisher = await openReleasePublisher({ device: publisherDevice, host, ...trust }); resources.push(publisher);
  const other = await openReleasePublisher({ device: otherPublisherDevice, host, ...trust }); resources.push(other);
  const observerStore = new NativeBytesStore(join(directory, 'stores', 'release-observer.sqlite')); resources.push(observerStore);
  let observer = await openReleaseObserver({ ...trust, host, store: observerStore }); resources.push(observer);
  const module = new Uint8Array(await readFile(new URL('./page.bundle.mjs', import.meta.url)));
  const prepare = (owner, version, operationId, application) => owner.prepare({ operationId, entry: 'index.html', assets: releaseAssets(version, module),
    ...(application === undefined ? {} : { application }) });

  const first = await prepare(publisher, 'A', 'release-a');
  await publisher.publish(first.operationId);
  const activatedA = await publisher.activate(first.id, { requestId: 'activate-a', expectedActivation: null });
  const observationA = await observer.refresh(); assert.equal(observationA.selection.activation.id, activatedA.id);
  const authoredA = releaseAssets('A', module), entryA = first.manifest.payload.assets.find(value => value.path === 'index.html');
  assert.deepEqual(await host.content.get(entryA.digest), authoredA.find(value => value.path === 'index.html').bytes);
  const renderedA = await page(), configA = bootstrap(renderedA.bytes);
  assert.equal(configA.publication.id, first.id); assert.equal(configA.peerRelease.state.controlPublicKey, trust.controlPublicKey);
  assert.notEqual(hash(renderedA.bytes), entryA.digest, 'Trusted runtime injection must remain separate from authored signed bytes');
  const binary = first.manifest.payload.assets.find(value => value.path.endsWith('.bin'));
  assert.deepEqual((await page(`_publications/${first.id}/assets/exact.bin`)).bytes, authoredA.find(value => value.path.endsWith('.bin')).bytes);
  const nested = new TextDecoder().decode((await page(`_publications/${first.id}/docs/`)).bytes);
  assert.ok(nested.includes(`<base href="${configA.publication.base}docs/">`));
  const browser = await openReleaseBrowser({ bridge, config: configA, executablePath: process.env.PEER_RELEASE_BROWSER_EXECUTABLE, directory }); resources.push(browser);
  await stage('rendered the first signed asset graph in a real browser');

  const next = await prepare(publisher, 'B', 'release-b');
  await assert.rejects(prepare(publisher, 'C', next.operationId), /RELEASE_OPERATION_ID_REUSED/u);
  await assert.rejects(publisher.prepare({ operationId: 'unsafe-path', entry: '../index.html', assets: [{ path: '../index.html', mediaType: 'text/html', bytes: new Uint8Array([1]) }] }));
  const partial = next.manifest.payload.assets.find(value => value.path === 'index.html');
  await host.content.put(partial.digest, releaseAssets('B', module).find(value => value.path === 'index.html').bytes, { mediaType: partial.mediaType });
  await assert.rejects(host.publish(next.manifest), error => error.status === 409);
  assert.equal((await host.state()).activations.at(-1).id, activatedA.id);
  await fault('block', { blocked: true });
  await assert.rejects(publisher.publish(next.operationId));
  assert.equal((await publisher.inspect(next.operationId)).status, 'prepared');
  await fault('block', { blocked: false });
  await publisher.close(); publisherDevice = await device('publisher-a', false);
  publisher = await openReleasePublisher({ device: publisherDevice, host, ...trust }); resources.push(publisher);
  assert.deepEqual((await publisher.inspect(next.operationId)).manifest, next.manifest);
  await publisher.publish(next.operationId);
  await fault('lose-activation-reply');
  await assert.rejects(publisher.activate(next.id, { requestId: 'activate-b', expectedActivation: activatedA.id }));
  const uncertain = await publisher.inspectActivation('activate-b'); assert.equal(uncertain.result, null);
  const committed = (await host.state()).activations.at(-1); assert.equal(committed.payload.releaseId, next.id);
  await publisher.close(); await fault('restart'); publisherDevice = await device('publisher-a', false);
  publisher = await openReleasePublisher({ device: publisherDevice, host, ...trust }); resources.push(publisher);
  assert.deepEqual((await publisher.inspectActivation('activate-b')).request, uncertain.request);
  const retry = await publisher.retry('activate-b'); assert.deepEqual(retry, committed);
  assert.equal((await host.state()).activations.length, 2);
  await assert.rejects(publisher.activate(first.id, { requestId: 'activate-b', expectedActivation: activatedA.id }), /RELEASE_ACTIVATION_REQUEST_REUSED/u);
  report.browser = await browser.applyAvailable(next.id); await browser.close();
  const observedB = await observer.refresh(); assert.equal(observedB.selection.activation.id, retry.id);
  await observer.close();
  observer = await openReleaseObserver({ ...trust, store: observerStore, host: { state: async () => observationA.state,
    manifest: (id, options) => host.manifest(id, options), content: { get: (id, options) => host.content.get(id, options) } } }); resources.push(observer);
  assert.equal((await observer.state()).selection.activation.id, retry.id);
  await assert.rejects(observer.refresh(), /RELEASE_STATE_REGRESSION/u);
  await observer.close();
  report.publication = { first, next, activatedA, interruptedPrepared: true, incompleteGraphRefused: true,
    operationReuseRefused: true, unsafePathRefused: true, uncertain, committed, retry,
    exactRequestAfterReopen: true, hostRestarted: true, binarySha256: hash((await page(`_publications/${first.id}/assets/exact.bin`)).bytes),
    authoredEntryDigest: entryA.digest, renderedEntryDigest: hash(renderedA.bytes), nestedBaseVerified: true,
    observerReopened: true, signedRegressionRefused: true };
  await stage('resumed exact publication and activation after a committed lost reply');

  await Promise.all([publisher.refresh(), other.refresh()]);
  const left = await prepare(publisher, 'C', 'race-c'), right = await prepare(other, 'D', 'race-d');
  await Promise.all([publisher.publish(left.operationId), other.publish(right.operationId)]);
  const racing = await Promise.allSettled([publisher.activate(left.id, { requestId: 'race-c', expectedActivation: retry.id }),
    other.activate(right.id, { requestId: 'race-d', expectedActivation: retry.id })]);
  assert.equal(racing.filter(value => value.status === 'fulfilled').length, 1);
  const failure = racing.find(value => value.status === 'rejected').reason; assert.equal(failure.status, 409);
  const winning = racing.find(value => value.status === 'fulfilled').value;
  await publisher.refresh();
  const restoredCode = await publisher.activate(first.id, { requestId: 'explicit-earlier-code', expectedActivation: winning.id });
  assert.equal(restoredCode.payload.revision, winning.payload.revision + 1); assert.equal(restoredCode.payload.previous, winning.id);
  assert.equal(bootstrap((await page()).bytes).publication.id, first.id);
  report.concurrency = { winning, rejectedStatus: failure.status, competingPublishers: [publisher.publisherId, other.publisherId], restoredCode };

  const execution = await executionManifestArtifacts(await eventExecutionManifest('peer-generation-v1'));
  const epochKey = new Uint8Array(randomBytes(32));
  const configured = await client.peers.configureApplication({ historyId: 'release-independent-data', definition: describeApplication(conversation), schema: null,
    executionManifestDigest: Buffer.from(execution.executionManifestDigest).toString('hex'), schemaAdministrator: dataA.identity.publicKey,
    epoch: 0, keyDigest: await bytesDigest(epochKey), members: [dataA, dataB].map(value => ({ grant: participantGrant(value.identity.publicKey, { dataRole: 'member', administrator: true }) })) });
  assert.equal(configured.descriptor.payload.controlPublicKey, trust.controlPublicKey);
  assert.ok(configured.controls[0].payload.grants.every(value => ![publisher.publisherId, other.publisherId].includes(value.publicKey)));
  const definition = configured.descriptor.payload, binding = { historyId: definition.historyId, definitionDigest: definition.definitionDigest,
    executionManifestDigest: definition.executionManifestDigest, schemaDigest: definition.schemaDigest };
  const bound = await prepare(publisher, 'E', 'bound-release', binding); await publisher.publish(bound.operationId);
  const selectedBound = await publisher.activate(bound.id, { requestId: 'activate-bound', expectedActivation: restoredCode.id });
  await assert.rejects(publisher.activate(first.id, { requestId: 'wrong-application-binding', expectedActivation: selectedBound.id }), error => error.status === 409);
  const unauthorizedManifest = await signReleaseManifest({ ...bound.manifest.payload, publisher: dataA.identity.publicKey }, dataA.identity);
  await assert.rejects(host.publish(unauthorizedManifest), error => error.status === 403);
  await assert.rejects(host.publish({ ...bound.manifest, payload: { ...bound.manifest.payload, entry: 'docs/index.html' } }), error => error.status === 422 || error.status === 403);
  await assert.rejects(host.publish({ ciphertext: 'application-frame', epoch: 0 }), error => error.status === 403 || error.status === 422 || error.status === 400);

  const transition = (owner, expectedGeneration, base, transitionId) => signTransitionRequest({ applicationId: trust.applicationId,
    profile: definition.profile, policy: definition.policy, requester: owner.identity.publicKey, coordinator: owner.identity.publicKey,
    expectedGeneration, base, transitionId, controlRevision: 0, reason: expectedGeneration === null ? 'create' : 'takeover' }, owner.identity);
  const generation = await client.peers.selectGeneration(await transition(dataA, null, null, 'release-data-create'));
  const authority = await client.peers.application();
  const a = await openNativeApplication({ device: dataA, authority, epochKeys: new Map([[0, epochKey]]), definition: conversation }); resources.push(a);
  const b = await openNativeApplication({ device: dataB, authority, epochKeys: new Map([[0, epochKey]]), definition: conversation }); resources.push(b);
  const link = await connectApplications(a, b); resources.push(link);
  const post = async (id, text) => { const operation = await a.command('postMessage', { messageId: id, text }, { operationId: id }); assert.equal((await operation.applied({ signal: timeout() })).outcome, 'accepted'); };
  await post('retained', 'Retained application data.'); await link.synchronize();
  const retained = await b.recoveryPoint(); await link.close();
  await post('excluded', 'A discarded suffix does not roll code backward.');
  const previousHead = await a.recoveryPoint(), releaseBeforeRecovery = await host.state();
  const replacement = await client.peers.selectGeneration(await transition(dataB, generation.id, retained, 'release-data-recover'));
  const recovered = await client.peers.application(); await Promise.all([a.adopt(recovered), b.adopt(recovered)]);
  assert.deepEqual(await host.state(), releaseBeforeRecovery);
  assert.equal(bootstrap((await page()).bytes).publication.id, bound.id);
  assert.deepEqual((await a.query('conversation', {})).value.messages.map(value => value.messageId), ['retained']);
  report.application = { binding, boundRelease: bound.id, selectedBound, dataGrantPublishers: false,
    writerPublicationRefused: true, changedManifestRefused: true, applicationEnvelopeRefused: true, mismatchedBindingRefused: true,
    previousGeneration: generation.id, selectedGeneration: replacement.id, previousHead: previousHead.point.sequence,
    adoptedPosition: retained.point.sequence, releaseBeforeRecovery, releaseAfterRecovery: await host.state() };

  const revoked = await host.configure({ requestId: 'revoke-first-publisher', expectedPolicy: await peerDigest(publisherPolicy), publishers: [{ publicKey: other.publisherId }] });
  await publisher.refresh(); await assert.rejects(prepare(publisher, 'F', 'revoked-publish', binding), /RELEASE_PUBLISHER_DENIED/u);
  assert.deepEqual(await publisher.retry('activate-b'), retry, 'An old acknowledged result remains inspectable after revocation');
  assert.equal(bootstrap((await page()).bytes).publication.id, bound.id);
  report.authorization = { revoked, revokedPublisherRefused: true, priorReceiptRetained: true, selectedBytesRetained: true };
  report.traffic = await fault('traffic');
  report.passed = true; report.stage = 'passed';
} catch (error) {
  report.passed = false; report.error = error instanceof Error ? error.stack ?? error.message : String(error); throw error;
} finally {
  for (const resource of resources.reverse()) { try { await resource.close(); } catch { /* Preserve the original acceptance failure. */ } }
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}
