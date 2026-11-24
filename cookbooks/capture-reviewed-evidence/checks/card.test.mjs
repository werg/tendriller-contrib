import test from 'node:test';
import assert from 'node:assert/strict';
import { mountObservationCard } from '../snippets/card.mjs';
import { pageFixture, deferred, gesture, tick } from '../../../test/sensor-fixtures.mjs';

// Minimal DOM fixture: exercise the actual card's handlers, not browser permissions.
function fixture(capabilities, send = async () => {}) {
  const document = pageFixture(), nodes = [];
  document.createElement = tag => {
    const listeners = new Map();
    const node = { tagName: tag.toUpperCase(), textContent: '', value: '', disabled: false, hidden: false,
      append() {}, prepend() {}, replaceChildren() {}, setAttribute() {},
      addEventListener(name, listener) { listeners.set(name, listener); },
      click() { listeners.get('click')?.(gesture); } };
    nodes.push(node); return node;
  };
  const card = mountObservationCard({ container: document.createElement('main'), document,
    tendril: { capabilities, sensors: { register() { throw Error('Unexpected acquisition'); } } },
    session: { signals: { send } }, request: { requestId: 'one', requester: 'native', expiresAt: Date.now() + 60_000 } });
  return { card, nodes, button: title => nodes.find(node => node.textContent === title) };
}
const report = permission => ({ capabilities: {
  screen_capture: { available: true, permission }, microphone: { available: true, permission },
} });

test('late capability discovery cannot reopen capture while a response is sending or sent', async () => {
  const probe = deferred(), sending = deferred(), f = fixture(() => probe.promise, () => sending.promise);
  f.nodes.find(node => node.tagName === 'TEXTAREA').value = 'Reviewed description';
  f.button('Send reviewed response').click();
  probe.resolve(report('prompt')); await tick();
  assert.equal(f.button('Capture screen frame').disabled, true);
  assert.equal(f.button('Start audio clip').disabled, true);
  sending.resolve(); await tick();
  assert.equal(f.button('Capture screen frame').disabled, true);
  f.card.dispose();
});

test('a correctable empty response does not reenable denied capture routes', async () => {
  const f = fixture(async () => report('denied')); await tick();
  f.button('Send reviewed response').click(); await tick();
  assert.equal(f.button('Send reviewed response').disabled, false);
  assert.equal(f.button('Capture screen frame').disabled, true);
  assert.equal(f.button('Start audio clip').disabled, true);
  f.card.dispose();
});

test('discarded review leaves no editable controls and cannot be reopened by capability discovery', async () => {
  const probe = deferred(), f = fixture(() => probe.promise);
  f.button('Discard').click(); await tick(); probe.resolve(report('prompt')); await tick();
  for (const node of f.nodes.filter(node => ['BUTTON', 'INPUT', 'TEXTAREA'].includes(node.tagName))) {
    assert.equal(node.disabled, true, node.textContent || node.tagName);
  }
  f.card.dispose();
});
