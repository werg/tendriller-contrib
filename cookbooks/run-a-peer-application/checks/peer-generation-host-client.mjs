// Test adapter to a separate workerd process executing the packed public engine.
// The bridge transports test requests; application commands remain on peer RTC.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

export function createHostedFixture(base) {
  const request = async (path, { method = 'GET', body } = {}) => {
    const response = await fetch(new URL(path, base), { method,
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30_000),
    });
    const value = await response.json();
    if (!response.ok) throw new Error(typeof value.error === 'string' ? value.error : JSON.stringify(value));
    return value;
  };
  return {
    async createControl({ applicationId, configuration }) {
      await request('/testing/page', { method: 'POST', body: { applicationId } });
      const configured = await request('/api/peers/application', { method: 'PUT', body: configuration });
      const published = await request('/api/peers/definition');
      assert.deepEqual(published.descriptor, configured.descriptor);
      assert.deepEqual(published.definition, configuration.definition);
      assert.deepEqual(published.schema, configuration.schema);
      return {
        descriptor: configured.descriptor, boundary: 'tendriller-workerd-http',
        read: () => request('/api/peers/application'),
        select: transition => request('/api/peers/generations', { method: 'POST', body: { request: transition } }),
        block: blocked => request('/testing/block', { method: 'POST', body: { blocked } }),
        traffic: () => request('/testing/traffic'),
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
