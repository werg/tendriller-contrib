import test from 'node:test';
import assert from 'node:assert/strict';
import { DISPLAY_LIMIT, emptyProjection, operationLabel, readBoard, reduceBatch } from './shared/projection.mjs';
import { clearSubmittedText, newDrafts, retainReference, validateDrafts } from './shared/drafts.mjs';

const message = index => ({ id: `proposal-${index}:0`, proposalId: `proposal-${index}`, eventOrdinal: 0, topic: 'conversation', payload: { type: 'message.posted', version: 1, messageId: `message-${index}`, text: `Text ${index}` } });
const batch = (events, revision = 'view-a', scannedThrough = 'opaque-cursor', hasMore = false) => ({ transactions: [{ proposalId: 'proposal', events }], revision, scannedThrough, hasMore });
const taskResult = { columns: ['id', 'title', 'claimed_by', 'status'].map(name => ({ name })), rows: [['task-1', 'Review evidence', null, 'open'].map(value => value === null ? { kind: 'null' } : { kind: 'text', value })], truncated: false };

test('UI projection is bounded while its source history remains untouched', () => {
  const source = Array.from({ length: DISPLAY_LIMIT + 25 }, (_, index) => message(index));
  const projection = reduceBatch(emptyProjection(), batch(source));
  assert.equal(projection.messages.length, DISPLAY_LIMIT);
  assert.equal(projection.eventCount, DISPLAY_LIMIT + 25);
  assert.equal(source.length, DISPLAY_LIMIT + 25);
  assert.equal(projection.messages[0].messageId, 'message-25');
  assert.deepEqual(reduceBatch(emptyProjection(), batch(source)), projection);
});

test('message identity and final job results survive pure rebuild without effects', () => {
  const events = [message(1), { ...message(2), topic: 'jobs', payload: { type: 'job.requested', version: 1, jobId: 'job-1', taskId: 'task-1' } }, { ...message(3), topic: 'jobs', payload: { type: 'job.completed', version: 1, jobId: 'job-1', text: 'Reviewed' } }];
  const first = reduceBatch(emptyProjection(), batch(events));
  const replayed = reduceBatch(emptyProjection(), batch(events));
  assert.deepEqual(first, replayed);
  assert.equal(first.jobs[0].taskId, 'task-1');
  assert.equal(first.jobs[0].status, 'completed');
  assert.equal(first.messages[0].eventId, 'proposal-1:0');
});

test('SQL and empty-event scan progress use one captured handle and release it', async () => {
  const calls = [];
  const backend = { capabilities: ['sql'], readView: async options => {
    calls.push(['capture', options.view]);
    return { revision: 'view-a', query: async () => taskResult, readEvents: async options => {
      calls.push(['read', options.cursor]);
      return options.cursor ? batch([message(1)], 'view-a', 'after-matching') : batch([], 'view-a', 'after-irrelevant', true);
    }, release: () => calls.push(['release']) };
  } };
  const result = await readBoard(backend);
  assert.equal(result.tasks[0].id, 'task-1');
  assert.equal(result.messages[0].text, 'Text 1');
  assert.equal(result.revision, 'view-a');
  assert.deepEqual(calls, [['capture', 'final'], ['read', undefined], ['read', 'after-irrelevant'], ['release']]);
});

test('event-only view never calls SQL and malformed captured revisions fail closed', async () => {
  let queries = 0, released = 0;
  const backend = { capabilities: ['events'], readView: async () => ({ revision: 'view-a', query: () => { queries++; throw Error('SQL unavailable'); }, readEvents: () => batch([message(1)]), release: () => { released++; } }) };
  assert.equal((await readBoard(backend)).messages.length, 1);
  assert.equal(queries, 0);
  assert.equal(released, 1);
  backend.readView = async () => ({ revision: 'view-a', readEvents: () => batch([], 'view-b'), release: () => { released++; } });
  await assert.rejects(readBoard(backend), /captured task revision/);
  assert.equal(released, 2);
});

test('stalled durable scan or cancelled projection releases its pinned view', async () => {
  let released = 0;
  const backend = { capabilities: [], readView: async () => ({ revision: 'view-a', readEvents: () => batch([], 'view-a', 'same', true), release: () => { released++; } }) };
  await assert.rejects(readBoard(backend), /did not progress/);
  const controller = new AbortController(); controller.abort(Error('View superseded'));
  await assert.rejects(readBoard(backend, { signal: controller.signal }), /View superseded/);
  assert.equal(released, 2);
});

test('references are not a second outbox and old completion preserves new typing', () => {
  const reference = { operationId: 'operation-1', kind: 'message', domainId: 'message-1', text: 'Submitted' };
  let drafts = retainReference({ ...newDrafts(), message: 'Submitted' }, reference);
  assert.equal(clearSubmittedText(drafts, 'Submitted').message, '');
  drafts = { ...drafts, message: 'New typing' };
  assert.equal(clearSubmittedText(drafts, 'Submitted').message, 'New typing');
  assert.deepEqual(retainReference(drafts, reference), drafts);
  assert.throws(() => retainReference(drafts, { ...reference, text: 'Different meaning' }), /cannot change/);
  assert.deepEqual(Object.keys(drafts.operations[0]).sort(), ['domainId', 'kind', 'operationId', 'text']);
  assert.throws(() => validateDrafts({ ...drafts, operations: [reference, reference] }), /Invalid operation/);
});

test('provisional rejection is distinct from final rejection or unknown submission', () => {
  assert.match(operationLabel({ status: 'provisional', outcome: 'rejected' }), /awaiting final order/);
  assert.match(operationLabel({ status: 'rejected', error: 'already_claimed' }), /Rejected: already_claimed/);
  assert.equal(operationLabel({ status: 'final' }), 'Accepted and final');
  assert.match(operationLabel(null), /No durable submission found/);
});
