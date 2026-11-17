import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bindRecoveryChoice } from './peer-ui/recovery-choice.mjs';

const proposal = (id = 'reviewed', fields = {}) => ({ id, coordinator: 'coordinator',
  point: { generation: 'selected-generation', sequence: 7, root: 'verified-root' },
  reason: 'freshness-unknown', observedAt: null, ageMs: null, ...fields });
function fixture(initial = proposal()) {
  const lifetime = new AbortController(), listeners = new Set(), approvals = [], errors = [];
  const elements = { panel: {}, message: {}, details: {}, button: {} };
  const participation = { status: { phase: 'approval-required', recovery: initial },
    onStatus(listener) { listeners.add(listener); listener(this.status); return () => listeners.delete(listener); },
    approveRecovery(id) { const deferred = Promise.withResolvers(); approvals.push({ id, ...deferred }); return deferred.promise; } };
  const update = (recovery, phase = 'approval-required') => {
    participation.status = { phase, recovery }; for (const listener of listeners) listener(participation.status);
  };
  bindRecoveryChoice(participation, { ...elements, signal: lifetime.signal, onError: error => errors.push(error) });
  return { ...elements, participation, lifetime, approvals, errors, update, listeners };
}

test('a broader-recovery choice preserves unknown evidence and approves only the displayed proposal', async () => {
  const f = fixture();
  assert.equal(f.panel.hidden, false); assert.match(f.message.textContent, /age.*unknown/);
  for (const value of ['freshness-unknown', 'selected-generation', 'Position: 7', 'verified-root',
    'Last verified coordinator contact: Unknown', 'Observed age: Unknown']) assert.ok(f.details.textContent.includes(value));
  const first = f.button.onclick();
  assert.equal(f.approvals[0].id, 'reviewed'); assert.equal(f.button.disabled, true);
  await f.button.onclick(); assert.equal(f.approvals.length, 1, 'A pending click must not dispatch another approval');
  f.update(proposal('new-choice'));
  f.approvals[0].resolve(); await first;
  assert.equal(f.approvals.length, 1, 'A new proposal must not inherit approval for the previous one');
  assert.equal(f.button.disabled, false);
  const second = f.button.onclick(); assert.equal(f.approvals[1].id, 'new-choice');
  f.approvals[1].resolve(); await second;
  assert.equal(f.button.disabled, true, 'An acknowledged choice waits for owner status instead of resubmitting');
  f.update(null, 'coordinating'); assert.equal(f.panel.hidden, true);
  f.lifetime.abort(); assert.equal(f.listeners.size, 0);
});

test('a superseded approval is visibly rejected while the new exact choice remains reviewable', async () => {
  const f = fixture(proposal('older', { reason: 'older-than-budget', observedAt: 1000, ageMs: 350_000 }));
  assert.match(f.message.textContent, /older than the configured recovery budget/);
  assert.match(f.details.textContent, /1970-01-01T00:00:01.000Z/); assert.match(f.details.textContent, /350000 ms/);
  const pending = f.button.onclick(); f.update(proposal('replacement'));
  const error = Error('APPLICATION_RECOVERY_APPROVAL_STALE'); f.approvals[0].reject(error); await pending;
  assert.deepEqual(f.errors, [error]); assert.equal(f.panel.hidden, false); assert.equal(f.button.disabled, false);
  assert.match(f.details.textContent, /Observed age: Unknown/);
  f.lifetime.abort(); assert.equal(f.listeners.size, 0); assert.equal(f.button.onclick, null);
});

test('closing the page retires the observer and cannot paint a late approval failure', async () => {
  const f = fixture(), pending = f.button.onclick();
  f.lifetime.abort(); f.approvals[0].reject(Error('LATE_FAILURE')); await pending;
  assert.deepEqual(f.errors, []); assert.equal(f.listeners.size, 0); assert.equal(f.button.disabled, true);
});
