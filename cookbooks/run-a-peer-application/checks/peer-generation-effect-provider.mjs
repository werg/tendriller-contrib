// A real loopback HTTP test provider, with its own SQLite idempotency ledger.
// It performs no email, payment or other action outside this acceptance fixture.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export async function createEffectProvider(directory) {
  await mkdir(directory, { recursive: true });
  const database = new DatabaseSync(join(directory, 'provider.sqlite'));
  database.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS effects (key TEXT PRIMARY KEY, message TEXT NOT NULL, receipt TEXT NOT NULL)');
  const lookup = database.prepare('SELECT message, receipt FROM effects WHERE key = ?');
  const insert = database.prepare('INSERT INTO effects (key, message, receipt) VALUES (?, ?, ?)');
  const requests = [];
  let loseReply = false, closed = false;
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      assert.ok(requests.length < 128, 'Provider fixture request budget exceeded');
      if (request.method === 'POST' && url.pathname === '/effects') {
        const chunks = []; let length = 0;
        for await (const chunk of request) { length += chunk.length; assert.ok(length <= 8192); chunks.push(chunk); }
        const { key, message } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        assert.ok(typeof key === 'string' && key.length > 0 && key.length <= 512);
        assert.ok(typeof message === 'string' && message.length <= 4096);
        let result = lookup.get(key);
        if (result !== undefined && result.message !== message) return json(response, 409, { error: 'PROVIDER_INTENT_CONFLICT' });
        const existing = result !== undefined;
        if (!existing) {
          const receipt = createHash('sha256').update(key).digest('hex');
          insert.run(key, message, receipt);
          result = lookup.get(key);
        }
        requests.push({ method: 'POST', key, existing, resultCommitted: true, replyLost: loseReply });
        // SQLite commit is complete. The caller receives a genuine socket error.
        if (loseReply) { loseReply = false; response.destroy(); return; }
        return json(response, 200, { receipt: result.receipt });
      }
      if (request.method === 'GET' && url.pathname === '/effects') {
        const key = url.searchParams.get('key');
        assert.ok(typeof key === 'string' && key.length > 0 && key.length <= 512);
        const result = lookup.get(key);
        requests.push({ method: 'GET', key, found: result !== undefined });
        return json(response, result === undefined ? 404 : 200, result === undefined ? { error: 'NOT_FOUND' } : { receipt: result.receipt });
      }
      json(response, 404, { error: 'NOT_FOUND' });
    } catch (error) { json(response, 400, { error: error instanceof Error ? error.message : String(error) }); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    loseNextReply() { loseReply = true; },
    snapshot() { return { requests: structuredClone(requests), effects: database.prepare('SELECT key, message, receipt FROM effects ORDER BY key').all() }; },
    async dispatch({ event, idempotencyKey, signal }) {
      const response = await fetch(`${base}/effects`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: idempotencyKey, message: event.payload.message }), signal });
      if (!response.ok) throw Error(`PROVIDER_HTTP_${response.status}`);
      return response.json();
    },
    async reconcile({ idempotencyKey, signal }) {
      const response = await fetch(`${base}/effects?${new URLSearchParams({ key: idempotencyKey })}`, { signal });
      if (response.status === 404) return { kind: 'not-performed' };
      if (!response.ok) throw Error(`PROVIDER_HTTP_${response.status}`);
      return { kind: 'completed', result: await response.json() };
    },
    async close() {
      if (closed) return; closed = true;
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
      database.close();
    },
  };
}

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(value));
}
