import test from 'node:test';
import assert from 'node:assert/strict';
import { publicSourceViolations } from '../distribution/public-boundaries.mjs';

const markdown = { markdown: true };

test('retired hosted signal calls fail in source and active Markdown examples', () => {
  for (const call of ['connectHostedSignals(options)', 'host.connectSignals(options)', 'tendril.control.start()']) {
    assert.deepEqual(publicSourceViolations(call), ['retains a retired API']);
    for (const fence of ['```js', '~~~typescript']) {
      const closing = fence.startsWith('```') ? '```' : '~~~';
      assert.deepEqual(publicSourceViolations(`${fence}\n${call}\n${closing}`, markdown), ['retains a retired API']);
    }
  }
});

test('historical provenance stays readable without exempting a later active example', () => {
  const provenance = [
    'Historical source: [connectSignals](https://example.test/old/connectSignals.mjs).',
    'The removed `connectHostedSignals` helper is not a current integration.',
    '```text', 'host.connectSignals(options)', '```',
    '```js historical', 'host.connectSignals(options)', '```',
  ].join('\n');
  assert.deepEqual(publicSourceViolations(provenance, markdown), []);
  assert.deepEqual(publicSourceViolations(`${provenance}\n\`\`\`js\nawait host.connectSignals();\n\`\`\``, markdown), ['retains a retired API']);
});

test('current installed-session examples pass and private source imports remain rejected', () => {
  const current = '```js\ntendril.signals.install(session.signals);\nfor await (const event of session.signals.subscribe({ mode: "latest" })) {}\n```';
  assert.deepEqual(publicSourceViolations(current, markdown), []);
  const privateImport = "import { secret } from '../../../tendriller/runtime/src/internal.mjs';";
  assert.deepEqual(publicSourceViolations(privateImport), ['imports private sibling source']);
  assert.deepEqual(publicSourceViolations(`~~~js\n${privateImport}\n~~~`, markdown), ['imports private sibling source']);
});
