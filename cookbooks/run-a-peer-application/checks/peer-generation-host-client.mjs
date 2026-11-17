// Test adapter to a separate workerd process executing the packed public engine.
// The bridge transports test requests; application commands remain on peer RTC.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

export function createHostedFixture(base, { createParticipantTransport, createParticipantRequest, PEER_PARTICIPANT_POLICY }) {
  const request = async (path, { method = 'GET', body, signal } = {}) => {
    const response = await fetch(new URL(path, base), { method,
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30_000)]) : AbortSignal.timeout(30_000),
    });
    const value = await response.json();
    if (!response.ok) throw Object.assign(new Error(typeof value?.error?.message === 'string'
      ? value.error.message : `Control host returned HTTP ${response.status} without a typed error`), {
      code: typeof value?.error?.code === 'string' ? value.error.code : 'invalid_host_error', status: response.status,
    });
    return value;
  };
  return {
    async createControl({ applicationId, configuration }) {
      await request('/testing/page', { method: 'POST', body: { applicationId } });
      const exchange = (body, { signal } = {}) => request('/api/peers/participant', { method: 'POST', body, signal });
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
        select: transition => participant.request('control', 'select', { request: transition }),
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
      };
    },
    async signalingPair(a, b) {
      const channel = `qualification-${randomUUID()}`;
      const opened = await request('/rendezvous/open', { method: 'POST', body: { channel, peers: [a.deviceId, b.deviceId] } });
      assert.deepEqual(opened.roles, ['offerer', 'answerer']);
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
      return { a: endpoint(0), b: endpoint(1), types,
        closed: () => closed.every(Boolean), snapshot: () => ({ sentMessages, sentBytes, closed: closed.every(Boolean) }) };
    },
  };
}
