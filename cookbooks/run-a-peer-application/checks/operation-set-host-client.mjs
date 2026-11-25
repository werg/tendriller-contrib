import { createHostRequester } from './operation-set-host-request.mjs';
import { verifyServedPublication } from './operation-set-host-document.mjs';
// Public host controls over a bounded test bridge to the real Workerd engine.
// Never carries epoch keys or application transaction bodies.
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { createAuthorityClient, authorityRecord, authorityRecordBytes } from '@tendriller/core/authority';
import { encodeRecord, decodeRecord, recordDigest, signEnrollmentRequest, signPublicationManifest, verifyAuthorityBundle, signParticipantRequest } from '@chronolog/authority';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function createHostedFixture(base) {
  const request = createHostRequester(base);
  const client = createAuthorityClient((path, options) => request(`/api/${path}`, options));
  const post = (path, body = {}) => request(path, { method: 'POST', body });
  const createHost = async ({ bundle, signer, devices }) => {
    const applicationId = bundle.descriptor.payload.applicationId;
    await post('/testing/page', { applicationId });
    const prepared = await client.prepare({ executionManifestDigest: bundle.descriptor.payload.executionManifestDigest,
      executionProfile: 'events', publisherKeys: [signer.publicKey] });
    assert.equal(prepared.authority, null, 'Publication authority must precede the data root');
    const publicationScope = prepared.publicationAuthority;
    const enrollmentEpoch = bundle.memberships[0].payload;
    let metadata;
    for (const [index, device] of devices.entries()) {
      const challenge = await client.challenge(device.identity.publicKey);
      const proof = await signEnrollmentRequest({ applicationId, publicKey: device.identity.publicKey,
        challenge: challenge.challenge, epoch: 0, epochKeyDigest: enrollmentEpoch.epochKeyDigest }, device.identity);
      metadata = await client.enroll(authorityRecord(encodeRecord(proof)));
      if (index > 0) {
        const current = decodeRecord(authorityRecordBytes(metadata.authority));
        const grant = { requestId: `fixture-grant-${index}`, expectedMembershipId: await recordDigest(current.memberships.at(-1)),
          authorTimeAfterMs: String(index), grant: { publicKey: device.identity.publicKey, reader: true, writer: true,
            administrator: index === 1, publisher: false, finalizer: false } };
        metadata = await client.grant(grant);
        const exact = await client.grant(grant); assert.deepEqual(exact.grant, metadata.grant);
      }
    }
    const actual = decodeRecord(authorityRecordBytes(metadata.authority)); await verifyAuthorityBundle(actual);
    const beforeAuthority = await recordDigest(actual);
    const readRequest = await signParticipantRequest({applicationId,requestId:randomUUID(),action:'authority.read'},signer);
    const readResponse = decodeRecord(authorityRecordBytes(await client.participant(authorityRecord(encodeRecord(readRequest)))));
    await verifyAuthorityBundle(readResponse.authority);assert.equal(await recordDigest(readResponse.authority),beforeAuthority);
    const hostRejected=[];
    for(const action of ['database.submit','content.chunk','ephemeral.signal']){
      const request=await signParticipantRequest({applicationId,requestId:randomUUID(),action},signer);
      await assert.rejects(client.participant(authorityRecord(encodeRecord(request))));hostRejected.push(action);
    }
    const participant={boundary:'public-authority-record',authorityVerified:true,hostRejected};
    const qualifyPublication = async () => {
      // Explicit device enrollment may have advanced authority since createHost.
      // Publication itself must preserve the verified head present when it starts.
      const publicationAuthority = decodeRecord(authorityRecordBytes((await client.application()).authority));
      await verifyAuthorityBundle(publicationAuthority);
      const beforePublicationAuthority = await recordDigest(publicationAuthority);
      const signed = async (text, operationId, revision, previous, identity = signer, extraFiles = []) => {
        const bytes = Buffer.from(text), digest = hash(bytes), path = `page-${revision}.html`;
        const publication = await signPublicationManifest({ applicationId, membershipId: publicationScope.grantId,
          executionManifestDigest: publicationScope.executionManifestDigest, author: identity.publicKey, operationId,
          revision, previous, entry: path, files: [...extraFiles, { path, hash: digest, size: bytes.length, type: 'text/html' }].sort((a,b) => a.path.localeCompare(b.path)) }, identity);
        return { publication, bytes, digest, assets: [{ hash: digest, bytes: bytes.toString('base64') }] };
      };
      const first = await signed('<!doctype html><title>Signed first page</title><p>First public bytes</p>', 'publication-1', 0, null);
      let original;
      await assert.rejects((async () => { original = await client.publish(first.publication, first.assets); throw Error('PUBLICATION_REPLY_LOST'); })(), /PUBLICATION_REPLY_LOST/);
      const retried = await client.publish(first.publication, first.assets); assert.deepEqual(retried, original);
      // The host serves authored bytes behind its own runtime injection; verify both, never the injected document as source.
      const served = async (route, authored, receipt) => verifyServedPublication({ served: await request(`/testing/asset?path=${route}`),
        authored, receipt, path: route.slice(route.lastIndexOf('/') + 1), applicationId });
      const servedFirst = await served('page-0.html', first.bytes, original);
      const altered = structuredClone(first.publication); altered.payload.entry = 'altered.html';
      await assert.rejects(client.publish(altered, first.assets));
      assert.equal(actual.memberships.at(-1).payload.members.find(member=>member.publicKey===devices[1].identity.publicKey).administrator,true);
      assert.equal(publicationScope.publisherKeys.includes(devices[1].identity.publicKey),false);
      const forbidden = await signed('<!doctype html><p>Forbidden</p>', 'publication-forbidden', 1, first.publication.id, devices[1].identity);
      await assert.rejects(client.publish(forbidden.publication, forbidden.assets));
      const second = await signed('<!doctype html><title>Signed second page</title><p>Updated public bytes</p>', 'publication-2', 1, first.publication.id, signer, first.publication.payload.files);
      const secondReceipt = await client.publish(second.publication, second.assets);
      const stale = await signed('<!doctype html><p>Stale</p>', 'publication-stale', 0, null);
      await assert.rejects(client.publish(stale.publication, stale.assets));
      const servedSecond = await served('page-1.html', second.bytes, secondReceipt);
      const headFirst = await served('page-0.html', first.bytes, secondReceipt);
      assert.equal(headFirst.authoredSourceDigest, first.digest);
      const retained = await client.publication(first.publication.id); assert.deepEqual(retained.publication, first.publication); assert.equal(retained.version, original.version);
      const pinnedFirst = () => served(`_publications/${original.version}/page-0.html`, first.bytes, original);
      assert.equal((await pinnedFirst()).authoredSourceDigest, first.digest);
      await post('/testing/restart'); assert.deepEqual(await client.publication(), secondReceipt);
      const restartedSecond = await served('page-1.html', second.bytes, secondReceipt);
      assert.equal(restartedSecond.authoredSourceDigest, second.digest); assert.equal((await pinnedFirst()).authoredSourceDigest, first.digest);
      assert.equal(restartedSecond.injection.runtimeId, servedFirst.injection.runtimeId);
      const after = decodeRecord(authorityRecordBytes((await client.application()).authority)); assert.equal(await recordDigest(after), beforePublicationAuthority);
      return { administratorWithoutPublisher:true, exactRetry: true, lostReplyAfterPersistence: true, alteredBytesRejected: true, nonPublisherRejected: true,
        staleHeadRejected: true, priorCodeRetained: true, headAndCodeSurviveRestart: true, applicationAuthorityUnchanged: true,
        first: { id: first.publication.id, version: original.version, ...servedFirst },
        second: { id: second.publication.id, previous: second.publication.payload.previous, version: secondReceipt.version, ...servedSecond } };
    };
    return { bundle: actual, participant,
      challenge: publicKey => client.challenge(publicKey),
      async enrollDevice(proof) {
        const enrolled = await client.enroll(authorityRecord(encodeRecord(proof)));
        const current = decodeRecord(authorityRecordBytes(enrolled.authority)), head = current.memberships.at(-1);
        const grant = await client.grant({ requestId: `browser-${proof.payload.publicKey.slice(0,16)}`,
          expectedMembershipId: await recordDigest(head), authorTimeAfterMs: String(head.payload.authorTimeAfterMs + 1n),
          grant: { publicKey: proof.payload.publicKey, reader: true, writer: true, administrator: false, publisher: false, finalizer: false } });
        const result = decodeRecord(authorityRecordBytes(grant.authority)); await verifyAuthorityBundle(result); return result;
      }, block: blocked => post('/testing/block', { blocked }),
      probe: async () => { try { return await client.application(); } catch (error) { throw Error(`HOST_UNAVAILABLE ${error.message}`); } },
      traffic: () => request('/testing/traffic'), qualifyPublication };
  };
  const signalingPair = async (a, b) => {
    const channel = `qualification:${randomUUID()}`;
    const opened = await post('/rendezvous/open', { channel, peers: [a.identity.publicKey, b.identity.publicKey] });
    let sentMessages = 0, sentBytes = 0; const closed = [false, false];
    const endpoint = index => ({
      messages: { async *[Symbol.asyncIterator]() { const value = await post(`/rendezvous/${opened.id}/${index}/next`); if (value) yield value; } },
      send: async description => { sentMessages++; sentBytes += Buffer.byteLength(JSON.stringify(description)); return post(`/rendezvous/${opened.id}/${index}/send`, description); },
      close: async () => { await post(`/rendezvous/${opened.id}/${index}/close`); closed[index] = true; },
    });
    return { a: endpoint(0), b: endpoint(1), roles: opened.roles, snapshot: () => ({ sentMessages, sentBytes, closed: closed.every(Boolean) }) };
  };
  return { createHost, signalingPair, relayTraffic: () => request('/testing/relay-traffic'), cutRelays: () => post('/testing/relay-cut') };
}
