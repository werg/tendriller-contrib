// Page-owned task-board vocabulary. This reducer never authors a change or effect.
export const REDUCER_VERSION = 'task-board/v3';
export const TOPICS = Object.freeze(['conversation', 'job-requests', 'job-results', 'tasks']);
export const DISPLAY_LIMIT = 100;

export const emptyProjection = () => ({ messages: [], jobs: [], eventCount: 0, omittedEventCount: 0 });

const isText = (value, limit) => typeof value === 'string' && value.length > 0 && value.length <= limit;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value, limit, field) => {
  if (!isText(value, limit)) throw new TypeError(`Invalid ${field}`);
  return value;
};
const advance = (state, update = {}, omitted = false) => ({
  ...state, ...update, eventCount: state.eventCount + 1,
  omittedEventCount: state.omittedEventCount + Number(omitted),
});

export function reduceEvent(state, event) {
  // Task rows come from the captured SQL query; view invalidation drives reads.
  if (event.topic === 'tasks') return advance(state);
  const data = event.payload;
  // Topic grants authorize publication, not this page's application vocabulary.
  // Preserve later valid history when another writer emits an unsupported record.
  if (!isText(event.id, 1024) || !isObject(data) || data.version !== 1) return advance(state, {}, true);
  let messages = state.messages, jobs = state.jobs;
  if (event.topic === 'conversation' && data.type === 'message.posted') {
    if (!isText(data.messageId, 128) || !isText(data.text, 8000) ||
        (data.inReplyTo !== undefined && !isText(data.inReplyTo, 128))) return advance(state, {}, true);
    const entry = {
      eventId: event.id, messageId: data.messageId, text: data.text,
      inReplyTo: data.inReplyTo ?? null,
      // Authenticated adapter metadata, never a role claimed by the JSON payload.
      origin: event.origin,
    };
    // Identity is the effective event, not a mutable display position or label.
    messages = [...messages.filter(value => value.eventId !== entry.eventId), entry].slice(-DISPLAY_LIMIT);
  } else if ((event.topic === 'job-requests' && data.type === 'job.requested') ||
             (event.topic === 'job-results' && data.type === 'effect.completed')) {
    const result = event.topic === 'job-results';
    const job = result ? data.result : data;
    if (!isObject(job) || job.version !== 1 ||
        !(result ? ['job.completed', 'job.failed'] : ['job.requested']).includes(job.type) ||
        !isText(job.jobId, 128) || !isText(job.taskId, 128) ||
        (job.text !== undefined && !isText(job.text, 8000)) ||
        (!result && job.kind !== 'summarize-task') ||
        (result && (data.handlerId !== 'summarize-task' || data.handlerVersion !== '1' ||
          !isText(data.effectId, 256) || !isText(data.originEventId, 1024)))) return advance(state, {}, true);
    const jobId = job.jobId, requestEventId = result ? data.originEventId : event.id;
    const prior = jobs.find(value => value.requestEventId === requestEventId);
    if (prior && (prior.jobId !== jobId || prior.taskId !== job.taskId)) return advance(state, {}, true);
    const entry = {
      jobId, requestEventId, status: job.type.slice(4),
      taskId: job.taskId, text: job.text ?? prior?.text ?? '', eventId: event.id,
      // Each author comes from its own authenticated event, never payload lineage.
      requestOrigin: result ? prior?.requestOrigin ?? null : event.origin,
      resultOrigin: result ? event.origin : null,
    };
    jobs = [...jobs.filter(value => value.requestEventId !== requestEventId), entry].slice(-DISPLAY_LIMIT);
  } else return advance(state, {}, true);
  return advance(state, { messages, jobs });
}

export function reduceBatch(state, batch) {
  return batch.transactions.reduce((next, transaction) =>
    transaction.events.reduce(reduceEvent, next), state);
}

export function taskRows(result) {
  if (result.truncated) throw new Error('Task view exceeded its configured row bound');
  const expected = ['id', 'title', 'claimed_by', 'status'];
  if (!Array.isArray(result.columns) || !expected.every((name, index) => result.columns[index]?.name === name)) {
    throw new TypeError('Unexpected task query columns');
  }
  return result.rows.map(row => {
    if (row.length !== expected.length) throw new TypeError('Unexpected task row width');
    const [id, title, claimant, status] = row;
    text(id, 128, 'task identity'); text(title, 1000, 'task title');
    if (claimant !== null) text(claimant, 128, 'claimant');
    if (!['open', 'done'].includes(status)) throw new TypeError('Unknown task status');
    return { id, title, claimant, status };
  });
}

/** A delayed append acknowledgement cannot replace an already observed result. */
export function mergeOperation(previous, observed) {
  if (!previous) return observed;
  if (!observed) return previous;
  if (previous.operationId !== observed.operationId || previous.proposalId !== observed.proposalId) {
    throw new Error('An operation reference resolved to different durable intent');
  }
  if (previous.status === 'final') return previous;
  if (observed.status === 'queued' && previous.status !== 'queued') return previous;
  return observed;
}

/** Capture SQL and events from one immutable view. No UI is published half-ready. */
export async function readBoard(backend, { view = 'final', signal } = {}) {
  const handle = await backend.readView({ view });
  let cursor;
  let projection = emptyProjection();
  try {
    const tasks = backend.capabilities.includes('sql')
      ? taskRows(await handle.query('SELECT id, title, claimed_by, status FROM tasks ORDER BY id')) : [];
    for (;;) {
      signal?.throwIfAborted();
      const batch = await handle.readEvents({ topics: TOPICS, limit: 32, ...(cursor === undefined ? {} : { cursor }), ...(signal ? { signal } : {}) });
      if (batch.revision !== handle.revision) throw new Error('Events do not belong to the captured task revision');
      if (typeof batch.scannedThrough !== 'string') throw new Error('Missing durable scan progress');
      projection = reduceBatch(projection, batch);
      if (!batch.hasMore) return Object.freeze({ revision: handle.revision, view, tasks, ...projection, cursor: batch.scannedThrough });
      if (batch.scannedThrough === cursor) throw new Error('Durable scan did not progress');
      cursor = batch.scannedThrough;
    }
  } finally { await handle.release(); }
}

export function operationLabel(operation) {
  if (operation === undefined) return 'Checking the original operation…';
  if (operation === null) return 'No durable submission found; review the saved draft';
  if (operation.status === 'final') return operation.outcome === 'rejected'
    ? `Rejected: ${operation.message || operation.error || 'Review this intent'}` : 'Accepted and final';
  if (operation.status === 'provisional') return operation.outcome === 'rejected'
    ? 'Provisional rejection; awaiting finality' : 'Provisional; awaiting finality';
  return 'Prepared locally; awaiting inclusion';
}

/** Dependent intent is authored only after observing its confirmed prerequisite. */
export async function requireFinalClaim(backend, taskId) {
  const final = await backend.readView({ view: 'final' });
  try {
    const result = await final.query('SELECT claimed_by FROM tasks WHERE id = ?', [taskId]);
    if (result.truncated || result.rows.length !== 1 || typeof result.rows[0][0] !== 'string') {
      throw new Error('Wait for the task claim to be accepted and final before asking the agent');
    }
    return result.rows[0][0];
  } finally { await final.release(); }
}
