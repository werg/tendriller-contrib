import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

test('live observation starts before durable readiness and survives its failure', { timeout: 5000 }, async () => {
  const key = Symbol.for('tendriller.contrib.independent-startup');
  let rejectReady, subscribed, subscriptionEnded = false, durableReads = 0;
  const applicationReady = new Promise((_, reject) => { rejectReady = reject; });
  const liveStarted = new Promise(resolve => { subscribed = resolve; });
  globalThis[key] = applicationReady;
  const hooks = registerHooks({
    resolve(specifier, context, next) {
      if (specifier === './deployment/bootstrap.mjs') return { url: 'startup-test:bootstrap', shortCircuit: true };
      if (specifier === './public-application.mjs') return { url: 'startup-test:program', shortCircuit: true };
      return next(specifier, context);
    },
    load(url, context, next) {
      if (url === 'startup-test:bootstrap') return { format: 'module', shortCircuit: true,
        source: "export const applicationReady = globalThis[Symbol.for('tendriller.contrib.independent-startup')];" };
      if (url === 'startup-test:program') return { format: 'module', shortCircuit: true,
        source: 'export const program = () => {}, emit = () => {}, sqlStatement = () => {};' };
      return next(url, context);
    },
  });
  const globals = new Map(['window', 'document', 'addEventListener'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const elements = new Map(), listeners = new Map();
  globalThis.document = { querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, { textContent: '', dataset: {}, addEventListener() {} });
    return elements.get(selector);
  } };
  globalThis.addEventListener = (name, listener) => listeners.set(name, listener);
  globalThis.window = { tendril: {
    application: { ready() { durableReads++; throw new Error('Durable initialization has not completed'); } },
    signals: { available: true, subscribe({ signal }) {
      subscribed();
      return { async *[Symbol.asyncIterator]() {
        await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }));
        subscriptionEnded = true;
      } };
    } },
  } };
  try {
    const importing = import('./shared/app.mjs');
    await liveStarted;
    assert.equal(durableReads, 0);
    assert.equal(subscriptionEnded, false);
    rejectReady(new Error('Database still catching up'));
    await importing;
    assert.equal(elements.get('#status').textContent, 'Application unavailable: Database still catching up');
    assert.equal(subscriptionEnded, false, 'A durable failure must not cancel the independent live reader');
    listeners.get('pagehide')();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(subscriptionEnded, true);
    assert.equal(elements.get('#typing').textContent, '');
  } finally {
    hooks.deregister(); delete globalThis[key];
    for (const [name, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
});
