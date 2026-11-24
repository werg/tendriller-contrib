import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiagnosticForwarder, redactDiagnosticText } from '../snippets/page-diagnostics.mjs';

test('diagnostic forwarder redacts secrets, buffers offline errors, flushes on connect, and enforces rate limits', () => {
  const sent = [];
  let peers = [];
  const session = {
    signals: { async send(topic, payload) { sent.push({ topic, payload }); } },
    participation: { get status() { return { connectedPeers: peers }; } },
  };

  const diag = createDiagnosticForwarder({ session, maxBuffered: 5, maxPerMinute: 2 });
  const boot = diag.record({
    id: 'e1',
    message: 'Failed https://app.test/?token=secret123 Bearer jwt.abc.def',
    context: 'boot',
  }, 1_000);

  assert.doesNotMatch(boot.message, /secret123|jwt\.abc\.def/);
  assert.match(boot.message, /token=\[redacted\]/);
  assert.match(boot.message, /Bearer \[redacted\]/);
  assert.equal(sent.length, 0);

  // Connect and flush buffered boot error.
  peers = ['agent-1'];
  assert.equal(diag.flush(2_000), 1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].topic, 'dev/telemetry');

  // Second error sends; third within same minute is rate-limited.
  diag.record({ id: 'e2', message: 'Second error' }, 2_500);
  diag.record({ id: 'e3', message: 'Rate limited' }, 2_600);
  assert.equal(sent.length, 2);
  assert.equal(diag.list().length, 3);
  assert.equal(redactDiagnosticText('ok'), 'ok');
});
