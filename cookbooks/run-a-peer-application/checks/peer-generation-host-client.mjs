// Test adapter to a separate workerd process executing the packed public engine.
// The bridge transports test requests; application commands remain on peer RTC.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

export function createHostedFixture(base, { createParticipantTransport, createParticipantRequest, PEER_PARTICIPANT_POLICY,
  bytesDigest, signPublicationManifest, verifyPublicationManifest, verifyAuthorityBundle }) {
  const closing = new Set();
  const request = async (path, { method = 'GET', body, signal, timeoutMs = 30_000 } = {}) => {
    const response = await fetch(new URL(path, base), { method,
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs),
    });
    const value = await response.json();
    if (!response.ok) throw Object.assign(new Error(typeof value?.error?.message === 'string'
      ? value.error.message : `Control host returned HTTP ${response.status} without a typed error`), {
      code: typeof value?.error?.code === 'string' ? value.error.code : 'invalid_host_error', status: response.status,
    });
    return value;
  };
  const socket = (kind, fields, signal) => {
    signal?.throwIfAborted();
    // This is transport to an actual Worker-owned test socket. Opening is
    // bounded independently so a cancelled owner can still close a late socket.
    const created = request(`/introductions/${kind}/open`, { method: 'POST', body: fields });
    let closed = false, closeTask;
    const call = async (action, body = {}, options = {}) => {
      const { id } = await created;
      return request(`/introductions/${kind}/${action}`, { method: 'POST', body: { id, ...body }, ...options });
    };
    const close = () => {
      if (closeTask) return closeTask;
      closed = true; signal?.removeEventListener('abort', abort);
      closeTask = call('close'); closing.add(closeTask);
      void closeTask.finally(() => closing.delete(closeTask)).catch(() => {});
      return closeTask;
    };
    const abort = () => { void close().catch(() => {}); };
    signal?.addEventListener('abort', abort, { once: true });
    const ready = call('ready', {}, { signal });
    void ready.catch(() => {});
    const messages = { async *[Symbol.asyncIterator]() {
      try {
        await ready;
        while (!closed) {
          const next = await call('next', {}, { signal, timeoutMs: 120_000 });
          if (next === null) return;
          yield next;
        }
      } finally { await close(); }
    } };
    return { ready, messages, invitations: messages,
      send: description => call('send', { description }, { signal }), close };
  };
  const relay = (channel, peerId, remotePeerId, createPeerRelay, signal) => {
    const endpoint = lane => {
      const url = new URL('/relay', base); url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.search = new URLSearchParams({ channel, peerId, remotePeerId, lane });
      return new WebSocket(url, 'tendriller.relay.v1');
    };
    return createPeerRelay({ reliable: endpoint('reliable'), live: endpoint('live') }, { peerId, remotePeerId, signal });
  };
  return {
    relay,
    relayTraffic: () => request('/testing/relay-traffic'),
    cutRelays: () => request('/testing/relay-cut', { method: 'POST', body: {} }),
    async drainIntroductions() { await Promise.all([...closing]); },
    createParticipationPorts(session, { openDirectConnection, openRelayConnection, createPeerIntroductions, createPeerRelay }) {
      const participant = createParticipantTransport({ applicationId: session.applicationId,
        exchange: (body, { signal } = {}) => request('/api/peers/participant', { method: 'POST', body, signal }) });
      const peers = {
        discover: options => participant.request('discovery', 'read', {}, options),
        advertise: (advertisement, { ttlMs, signal }) => participant.request('discovery', 'advertise', { advertisement, ttlMs }, { signal }),
        withdraw: (peerId, options) => participant.request('discovery', 'withdraw', { peerId }, options),
        invite: (peerId, invitation, options) => participant.request('ephemeral', 'invite', { peerId, ...invitation }, options),
        rendezvous: (channel, peerId, { signal }) => socket('rendezvous', { channel, peerId }, signal),
        listenInvitations: (peerId, { signal }) => socket('invitations', { peerId }, signal),
        relay: (channel, peerId, { remotePeerId, signal }) => relay(channel, peerId, remotePeerId, createPeerRelay, signal),
      };
      return createPeerIntroductions({ peers, identity: session.deviceId, openDirectConnection, openRelayConnection });
    },
    async createControl({ applicationId, configuration }) {
      await request('/testing/page', { method: 'POST', body: { applicationId } });
      let losePublicationReply = false;
      const exchange = async (body, { signal } = {}) => {
        const response = await request('/api/peers/participant', { method: 'POST', body, signal });
        if (losePublicationReply && body.facet === 'publication' && body.action === 'publish') {
          losePublicationReply = false;
          throw Error('PUBLICATION_REPLY_LOST_AFTER_PERSISTENCE');
        }
        return response;
      };
      const participant = createParticipantTransport({ applicationId, exchange });
      const configured = await participant.request('control', 'configure', configuration);
      const published = await participant.request('publication', 'definition', {});
      assert.deepEqual(published.descriptor, configured.descriptor);
      assert.deepEqual(published.definition, configuration.definition);
      assert.deepEqual(published.schema, configuration.schema);
      return {
        descriptor: configured.descriptor, boundary: 'tendriller-workerd-http',
        exchange: participant.exchange,
        read: () => participant.request('control', 'read', {}),
        select: (transition, control) => participant.request('control', 'select', { request: transition,
          ...(control === undefined ? {} : { control }) }),
        block: blocked => request('/testing/block', { method: 'POST', body: { blocked } }),
        traffic: () => request('/testing/traffic'),
        async qualifyParticipant() {
          const excluded = [ ['database', 'submit'], ['content', 'chunk'], ['ephemeral', 'signal'] ];
          const before = await request('/testing/traffic');
          for (const [facet, action] of excluded) {
            await assert.rejects(participant.request(facet, action, {}), error => error.code === 'PEER_PARTICIPANT_FACET_FORBIDDEN');
          }
          const after = await request('/testing/traffic');
          assert.equal(after.requests, before.requests, 'Filtered updates must never reach the HTTP transport');
          for (const [facet, action] of excluded) {
            const envelope = createParticipantRequest({ applicationId, facet, action, payload: {} }, PEER_PARTICIPANT_POLICY);
            await assert.rejects(exchange(envelope), error => error.status >= 400 && error.status < 500);
          }
          return { protocol: 'chronolog-participant-v1', route: 'peers/participant',
            transport: 'public-chronolog-participant', clientFiltered: excluded.map(value => value.join('.')),
            hostRejected: excluded.map(value => value.join('.')), clientFilteredHttpRequests: after.requests - before.requests };
        },
        async qualifyPublication({ control, signer, reader }) {
          const authority = await control.application();
          const verified = await verifyAuthorityBundle(authority, configured.descriptor);
          assert.equal(await control.publication(), null);
          const grant = identity => verified.control.payload.grants.find(value => value.publicKey === identity);
          assert.equal(grant(signer.publicKey).publisher, true);
          assert.equal(grant(reader.publicKey).administrator, true);
          assert.equal(grant(reader.publicKey).publisher, false, 'Administration does not grant code publication');
          const prepare = async (revision, previous, author = signer) => {
            const marker = `participant-publication-${revision}`;
            const content = [ ['index.html', 'text/html', `<!doctype html><html><head><meta charset="utf-8"></head><body><p>${marker}</p><script type="module" src="./page.mjs"></script></body></html>`],
              ['page.mjs', 'text/javascript', `export const publication = '${marker}';\n`] ];
            const assets = [], files = [];
            for (const [path, type, text] of content) {
              const bytes = new TextEncoder().encode(text), hash = await bytesDigest(bytes);
              files.push({ path, type, size: bytes.length, hash });
              assets.push({ hash, bytes: Buffer.from(bytes).toString('base64') });
            }
            const intent = { operationId: `publish-${revision}-${author.publicKey}`, entry: 'index.html', files };
            const publication = author === signer ? await control.preparePublication(intent) : await signPublicationManifest({ applicationId,
              historyId: verified.descriptor.historyId, profile: verified.descriptor.profile,
              controlRevision: verified.control.payload.revision, author: author.publicKey,
              operationId: intent.operationId, revision, previous,
              definitionDigest: verified.descriptor.definitionDigest,
              executionManifestDigest: verified.descriptor.executionManifestDigest,
              entry: 'index.html', files }, author);
            assert.equal(publication.payload.revision, revision);
            assert.equal(publication.payload.previous, previous);
            return { publication, assets, intent, marker, code: content[1][2] };
          };
          const publish = ({ publication, assets }) => control.publish(publication, assets);
          const publishRaw = ({ publication, assets }) => participant.request('publication', 'publish', { publication, assets });
          const first = await prepare(0, null);
          losePublicationReply = true;
          await assert.rejects(publish(first), /PUBLICATION_REPLY_LOST_AFTER_PERSISTENCE/);
          assert.deepEqual(await control.preparePublication(first.intent), first.publication, 'A lost reply must retain the exact saved publication');
          const selected = await publish(first);
          assert.deepEqual(selected.publication, first.publication);
          await verifyPublicationManifest(selected.publication, verified);
          assert.deepEqual(await publish(first), selected, 'Exact publication retry must recover the same selected version');
          const asset = async path => request(`/testing/asset?path=${encodeURIComponent(path)}`);
          const firstCode = await asset('page.mjs');
          assert.equal(firstCode.status, 200); assert.equal(firstCode.text, first.code);
          const firstPage = await asset('');
          assert.equal(firstPage.status, 200); assert.ok(firstPage.text.includes(first.marker));
          const second = await prepare(1, first.publication.id);
          const damaged = structuredClone(second);
          damaged.assets[1].bytes = Buffer.from('different unsigned code').toString('base64');
          await assert.rejects(publishRaw(damaged), error => error.status >= 400 && error.status < 500);
          assert.deepEqual(await control.publication(), selected);
          await assert.rejects(publishRaw(await prepare(1, first.publication.id, reader)), error => error.status === 403);
          const updated = await publish(second);
          assert.deepEqual(updated.publication, second.publication);
          assert.ok(updated.version > selected.version);
          const conflict = { ...second, publication: await signPublicationManifest({
            ...second.publication.payload, operationId: 'stale-publication-head',
          }, signer) };
          await assert.rejects(publishRaw(conflict), error => error.status === 409);
          const secondCode = await asset('page.mjs');
          assert.equal(secondCode.status, 200); assert.equal(secondCode.text, second.code);
          const secondPage = await asset('');
          assert.equal(secondPage.status, 200); assert.ok(secondPage.text.includes(second.marker));
          const retained = await asset(`_publications/${selected.version}/page.mjs`);
          assert.equal(retained.status, 200); assert.equal(retained.text, first.code);
          await request('/testing/restart', { method: 'POST' });
          assert.deepEqual(await control.publication(), updated);
          const restarted = await asset('page.mjs');
          assert.equal(restarted.status, 200); assert.equal(restarted.text, second.code);
          assert.deepEqual(await control.application(), authority, 'Page publication cannot rewrite application controls or history');
          return { author: signer.publicKey, nonPublisher: reader.publicKey, administratorWithoutPublisher: true,
            first: { id: selected.publication.id, version: selected.version,
              expectedCodeDigest: first.publication.payload.files[1].hash, servedCodeDigest: await bytesDigest(new TextEncoder().encode(firstCode.text)) },
            second: { id: updated.publication.id, version: updated.version, previous: updated.publication.payload.previous,
              expectedCodeDigest: second.publication.payload.files[1].hash, servedCodeDigest: await bytesDigest(new TextEncoder().encode(restarted.text)) },
            sessionOwned: true, lostReplyAfterPersistence: true, savedIdentityRecovered: true,
            exactRetry: true, alteredBytesRejected: true, nonPublisherRejected: true, staleHeadRejected: true,
            authoredHtmlObserved: true, priorCodeRetained: true, headAndCodeSurviveRestart: true, applicationAuthorityUnchanged: true };
        },
      };
    },
    async signalingPair(a, b) {
      const channel = `qualification-${randomUUID()}`;
      const opened = await request('/rendezvous/open', { method: 'POST', body: { channel, peers: [a.deviceId, b.deviceId] } });
      assert.deepEqual([...opened.roles].sort(), ['answerer', 'offerer']);
      const types = [], closed = [false, false];
      let sentMessages = 0, sentBytes = 0;
      const endpoint = index => ({
        messages: { async *[Symbol.asyncIterator]() {
          const value = await request(`/rendezvous/${opened.id}/${index}/next`);
          if (value !== null) yield value;
        } },
        async send(description) {
          assert.equal(closed[index], false);
          types.push(description.type); sentMessages++;
          sentBytes += new TextEncoder().encode(description.sdp).length;
          await request(`/rendezvous/${opened.id}/${index}/send`, { method: 'POST', body: description });
        },
        async close() {
          if (closed[index]) return;
          await request(`/rendezvous/${opened.id}/${index}/close`, { method: 'POST' });
          closed[index] = true;
        },
      });
      return { a: endpoint(0), b: endpoint(1), roles: opened.roles, types,
        closed: () => closed.every(Boolean), snapshot: () => ({ sentMessages, sentBytes, closed: closed.every(Boolean) }) };
    },
  };
}
