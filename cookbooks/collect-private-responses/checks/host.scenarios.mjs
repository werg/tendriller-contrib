import { beforeAll, expect, inject, it } from 'vitest';
import { createTestPage, initializeTestService } from '@tendriller/engine/testing';

beforeAll(() => initializeTestService(inject('d1Migrations')));
const accepted = async response => {
  const body = await response.json();
  expect(response.status, JSON.stringify(body)).toBe(200);
  return body;
};
const rejected = async (response, status, code) => {
  expect(response.status).toBe(status);
  expect(await response.json()).toMatchObject({ error: { code } });
};

it('keeps assignments and answers private and publishes only a reviewed summary', async () => {
  const page = await createTestPage(), alice = await page.participant(), bob = await page.participant(), display = await page.display();
  const opened = await accepted(await page.agent('private-responses', 'open', { label: 'Review' }));
  const guards = { [opened.scope.id]: opened.scope.generation };
  const assignment = await accepted(await page.agent('private-responses', 'assign', { participant: alice.account, prompt: 'Private prompt for Alice', expected_revision: 0 }, guards));
  expect((await accepted(await alice.call('private-responses', 'mine'))).assignments).toHaveLength(1);
  expect((await accepted(await bob.call('private-responses', 'mine'))).assignments).toEqual([]);
  await rejected(await bob.call('private-responses', 'submit', { assignment: assignment.assignment.id, answer: 'Unauthorized', expected_revision: 0 }, guards), 404, 'assignment_unavailable');
  await rejected(await display('private-responses', 'mine'), 403, 'forbidden');
  const data = { assignment: assignment.assignment.id, answer: 'A private original answer', expected_revision: 0 };
  const saved = await accepted(await alice.call('private-responses', 'submit', data, guards, 'same-answer-command'));
  expect(await accepted(await alice.call('private-responses', 'submit', data, guards, 'same-answer-command'))).toEqual(saved);
  await rejected(await alice.call('private-responses', 'submit', { ...data, answer: 'Stale correction' }, guards), 409, 'revision_conflict');
  await rejected(await bob.call('private-responses', 'review'), 403, 'forbidden');
  await rejected(await page.agent('private-responses', 'publish', { summary: 'Agent cannot approve', expected_revision: 2 }, guards), 403, 'forbidden');
  await rejected(await page.owner('private-responses', 'publish', { summary: 'Stale review', expected_revision: 1 }, guards), 409, 'revision_conflict');
  await accepted(await page.owner('private-responses', 'publish', { summary: 'Reviewed group summary', expected_revision: 2 }, guards));
  const state = await accepted(await page.api('GET', 'state'));
  expect(state.state.findings.text).toBe('Reviewed group summary');
  const exposed = JSON.stringify([state, await accepted(await page.api('GET', 'events?after=0'))]);
  for (const privateValue of ['A private original answer', 'Private prompt for Alice', alice.account, bob.account]) expect(exposed).not.toContain(privateValue);
  const archive = await accepted(await page.owner('private-responses', 'archive', { expected_revision: 3 }, guards));
  const retained = await accepted(await page.agent('private-responses', 'readArchive', { id: archive.id }));
  expect(retained.answers[0].answer).toBe(data.answer);
  await rejected(await alice.call('private-responses', 'readArchive', { id: archive.id }), 403, 'forbidden');
  expect((await accepted(await alice.call('private-responses', 'mine'))).assignments).toEqual([]);
  expect((await accepted(await page.api('GET', 'state'))).state).toEqual({});
  await rejected(await alice.call('private-responses', 'submit', { ...data, expected_revision: 1 }, guards), 409, 'stale_generation');
  // A lost receipt still replays the original accepted command after the reset.
  expect(await accepted(await alice.call('private-responses', 'submit', data, guards, 'same-answer-command'))).toEqual(saved);
});

it('binds approval to exact content and version and keeps execution identity stable', async () => {
  const page = await createTestPage(), guest = await page.participant();
  const scope = await accepted(await page.agent('proposal-review', 'initialize'));
  const guards = { [scope.id]: scope.generation };
  const original = await accepted(await page.agent('proposal-review', 'propose', { title: 'Change setting', payload: { level: 1 }, expires_at: Date.now() + 60_000 }, guards));
  const revised = await accepted(await page.agent('proposal-review', 'revise', { id: original.id, version: 1, title: 'Change setting', payload: { level: 2 }, expires_at: Date.now() + 60_000 }, guards));
  expect(revised.version).toBe(2);
  await rejected(await page.owner('proposal-review', 'respond', { id: original.id, version: 1, approve: true }, guards), 409, 'version_conflict');
  await rejected(await guest.call('proposal-review', 'respond', { id: original.id, version: 2, approve: true }, guards), 403, 'forbidden');
  await rejected(await page.agent('proposal-review', 'claimExecution', { id: original.id, version: 2 }, guards), 409, 'approval_required');
  const approved = await accepted(await page.owner('proposal-review', 'respond', { id: original.id, version: 2, approve: true }, guards));
  expect(approved.payload).toEqual({ level: 2 });
  await rejected(await page.agent('proposal-review', 'revise', { id: original.id, version: 2, title: 'Changed after approval', payload: {}, expires_at: Date.now() + 60_000 }, guards), 409, 'immutable_proposal');
  const executing = await accepted(await page.agent('proposal-review', 'claimExecution', { id: original.id, version: 2 }, guards));
  expect((await accepted(await page.agent('proposal-review', 'claimExecution', { id: original.id, version: 2 }, guards))).execution_key).toBe(executing.execution_key);
  await page.advance(120_000);
  const complete = await accepted(await page.agent('proposal-review', 'finish', { id: original.id, version: 2, execution_key: executing.execution_key, succeeded: true, outcome: { actual: 2 } }, guards));
  expect(complete).toMatchObject({ status: 'completed', payload: { level: 2 }, outcome: { actual: 2 } });
});

it('checks expiry at both the owner response and the first execution claim', async () => {
  const page = await createTestPage(), scope = await accepted(await page.agent('proposal-review', 'initialize'));
  const guards = { [scope.id]: scope.generation }, expires_at = Date.now() + 60_000;
  const first = await accepted(await page.agent('proposal-review', 'propose', { title: 'Response expires', payload: {}, expires_at }, guards));
  const second = await accepted(await page.agent('proposal-review', 'propose', { title: 'Execution expires', payload: {}, expires_at }, guards));
  await accepted(await page.owner('proposal-review', 'respond', { id: second.id, version: 1, approve: true }, guards));
  await page.advance(120_000);
  await rejected(await page.owner('proposal-review', 'respond', { id: first.id, version: 1, approve: true }, guards), 409, 'proposal_expired');
  await rejected(await page.agent('proposal-review', 'claimExecution', { id: second.id, version: 1 }, guards), 409, 'proposal_expired');
});
