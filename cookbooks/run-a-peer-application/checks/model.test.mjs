import test from 'node:test';
import assert from 'node:assert/strict';
import { DISPLAY_LIMIT, emptyProjection, mergeOperation, operationLabel, readBoard, reduceBatch } from './shared/projection.mjs';
import { clearSubmittedText, newDrafts, retainReference, validateDrafts } from './shared/drafts.mjs';

const message = index => ({ id: `proposal-${index}:0`, proposalId: `proposal-${index}`, eventOrdinal: 0, topic: 'conversation', payload: { type: 'message.posted', version: 1, messageId: `message-${index}`, text: `Text ${index}` } });
const jobRequest = (index, jobId = 'job-1', taskId = 'task-1') => ({ ...message(index), topic: 'job-requests',
  payload: { type: 'job.requested', version: 1, jobId, taskId, kind: 'summarize-task' } });
const jobResult = (index, request, overrides = {}) => ({ ...message(index), topic: 'job-results', payload: {
  type: 'effect.completed', version: 1, effectId: `effect-${index}`, originEventId: request.id,
  handlerId: 'summarize-task', handlerVersion: '1',
  result: { type: 'job.completed', version: 1, jobId: request.payload.jobId, taskId: request.payload.taskId, text: 'Reviewed', ...overrides },
} });
const batch = (events, revision = 'view-a', scannedThrough = 'opaque-cursor', hasMore = false) => ({ transactions: [{ proposalId: 'proposal', events }], revision, scannedThrough, hasMore });
const taskResult = { columns: ['id', 'title', 'claimed_by', 'status'].map(name => ({ name })), rows: [['task-1', 'Review evidence', null, 'open']], truncated: false };

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
  const request = jobRequest(2);
  const events = [message(1), request, jobResult(3, request)];
  const first = reduceBatch(emptyProjection(), batch(events));
  const replayed = reduceBatch(emptyProjection(), batch(events));
  assert.deepEqual(first, replayed);
  assert.equal(first.jobs[0].taskId, 'task-1');
  assert.equal(first.jobs[0].status, 'completed');
  assert.equal(first.jobs[0].requestEventId, 'proposal-2:0');
  assert.equal(first.messages[0].eventId, 'proposal-1:0');
});

test('job results bind their original intent and duplicate display IDs cannot merge separate effects', () => {
  const request = jobRequest(1, 'same', 'one');
  const another = { ...request, id: 'second:0', proposalId: 'second' };
  const before = reduceBatch(emptyProjection(), batch([request, another]));
  assert.equal(before.jobs.length, 2);
  const completed = jobResult(3, request);
  const after = reduceBatch(before, batch([completed]));
  assert.equal(after.jobs.filter(job => job.status === 'completed').length, 1);
  assert.equal(after.jobs.find(job => job.requestEventId === 'second:0').status, 'requested');
  for (const overrides of [{ jobId: 'different' }, { taskId: 'other-task' }]) {
    const rejected = reduceBatch(before, batch([jobResult(3, request, overrides)]));
    assert.deepEqual(rejected.jobs, before.jobs);
    assert.equal(rejected.omittedEventCount, 1);
    assert.equal(reduceBatch(rejected, batch([completed])).jobs[1].status, 'completed');
  }
});

test('malformed or unsupported domain records cannot hide later valid history', () => {
  const invalid = [
    { ...message(2), payload: { ...message(2).payload, text: undefined } },
    { ...message(3), payload: { ...message(3).payload, inReplyTo: 17 } },
    { ...message(4), payload: { ...message(4).payload, version: 2 } },
    { ...message(5), payload: [] },
  ];
  const events = [message(1), ...invalid, message(6)];
  const state = reduceBatch(emptyProjection(), batch(events));
  assert.deepEqual(state.messages.map(value => value.messageId), ['message-1', 'message-6']);
  assert.equal(state.eventCount, 6);
  assert.equal(state.omittedEventCount, 4);
  assert.deepEqual(reduceBatch(emptyProjection(), batch(events)), state);
  assert.equal(events.length, 6);
});

test('the task-summary projection validates its handler and bounded domain fields', () => {
  const request = jobRequest(1);
  const result = jobResult(2, request);
  const invalid = [
    { ...request, payload: { ...request.payload, kind: 'another-handler' } },
    { ...result, payload: { ...result.payload, handlerId: 'another-handler' } },
    { ...result, payload: { ...result.payload, handlerVersion: '2' } },
    jobResult(2, request, { text: 'x'.repeat(8001) }),
  ];
  const state = reduceBatch(emptyProjection(), batch([...invalid, request, result]));
  assert.equal(state.jobs.length, 1);
  assert.equal(state.jobs[0].status, 'completed');
  assert.equal(state.omittedEventCount, invalid.length);
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

test('a coherent read skips malformed domain input but still rejects an invalid SQL result', async () => {
  let released = 0;
  const backend = { capabilities: ['sql'], readView: async () => ({ revision: 'view-a', query: () => taskResult,
    readEvents: () => batch([{ ...message(1), payload: null }, message(2)]), release: () => { released++; } }) };
  const view = await readBoard(backend);
  assert.equal(view.tasks[0].id, 'task-1');
  assert.equal(view.messages[0].messageId, 'message-2');
  assert.equal(view.omittedEventCount, 1);
  assert.equal(released, 1);
  backend.readView = async () => ({ revision: 'view-a', query: () => ({ ...taskResult, columns: [] }),
    readEvents: () => batch([message(2)]), release: () => { released++; } });
  await assert.rejects(readBoard(backend), /Unexpected task query columns/);
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

test('delayed submit replies cannot regress an observed final or provisional outcome', () => {
  const receipt = { operationId: 'one', proposalId: 'signed-one', status: 'queued' };
  const provisional = { ...receipt, status: 'provisional', outcome: 'accepted' };
  const final = { ...provisional, status: 'final' };
  const rejected = { ...receipt, status: 'rejected', outcome: 'rejected' };
  assert.equal(mergeOperation(provisional, receipt), provisional);
  assert.equal(mergeOperation(final, receipt), final);
  assert.equal(mergeOperation(rejected, receipt), rejected);
  assert.equal(mergeOperation(receipt, provisional), provisional);
  assert.equal(mergeOperation(provisional, rejected), rejected);
  assert.equal(mergeOperation(final, null), final);
  assert.throws(() => mergeOperation(final, { ...receipt, proposalId: 'different' }), /different durable intent/);
});
