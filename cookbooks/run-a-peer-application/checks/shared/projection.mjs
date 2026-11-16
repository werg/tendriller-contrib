// Page-owned task-board vocabulary. This reducer never authors a change or effect.
export const REDUCER_VERSION = 'task-board/v1';
export const TOPICS = Object.freeze(['conversation', 'job-requests', 'job-results', 'tasks']);
export const DISPLAY_LIMIT = 100;

export const emptyProjection = () => ({ messages: [], jobs: [], eventCount: 0 });

const text = (value, limit, field) => {
  if (typeof value !== 'string' || !value || value.length > limit) throw new TypeError(`Invalid ${field}`);
  return value;
};

export function reduceEvent(state, event) {
  const data = event.payload;
  // Other versions are not silently reinterpreted as this application's schema.
  if (!data || typeof data !== 'object' || data.version !== 1) return { ...state, eventCount: state.eventCount + 1 };
  let messages = state.messages, jobs = state.jobs;
  if (event.topic === 'conversation' && data.type === 'message.posted') {
    const entry = {
      eventId: text(event.id, 1024, 'event identity'),
      messageId: text(data.messageId, 128, 'message identity'),
      text: text(data.text, 8000, 'message text'),
      inReplyTo: data.inReplyTo === undefined ? null : text(data.inReplyTo, 128, 'reply identity'),
    };
    // Identity is the effective event, not a mutable display position or label.
    messages = [...messages.filter(value => value.eventId !== entry.eventId), entry].slice(-DISPLAY_LIMIT);
  } else if ((event.topic === 'job-requests' && data.type === 'job.requested') ||
             (event.topic === 'job-results' && data.type === 'effect.completed')) {
    const result = event.topic === 'job-results';
    const job = result ? data.result : data;
    if (!job || typeof job !== 'object' || job.version !== 1 ||
        !(result ? ['job.completed', 'job.failed'] : ['job.requested']).includes(job.type)) {
      return { ...state, eventCount: state.eventCount + 1 };
    }
    const jobId = text(job.jobId, 128, 'job identity');
    const requestEventId = text(result ? data.originEventId : event.id, 1024, 'job request event identity');
    const prior = jobs.find(value => value.requestEventId === requestEventId);
    if (prior && prior.jobId !== jobId) throw new Error('Job result identity differs from its final intent');
    const entry = {
      jobId, requestEventId, status: job.type.slice(4),
      taskId: job.taskId === undefined ? prior?.taskId ?? null : text(job.taskId, 128, 'task identity'),
      text: job.text === undefined ? prior?.text ?? '' : text(job.text, 8000, 'job text'),
      eventId: text(event.id, 1024, 'event identity'),
    };
    jobs = [...jobs.filter(value => value.requestEventId !== requestEventId), entry].slice(-DISPLAY_LIMIT);
  }
  return { messages, jobs, eventCount: state.eventCount + 1 };
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
  if (['final', 'rejected'].includes(previous.status)) return previous;
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
  if (!operation) return 'No durable submission found; review the saved draft';
  if (operation.status === 'rejected') return `Rejected: ${operation.message || operation.error || 'Review this intent'}`;
  if (operation.status === 'final') return 'Accepted and final';
  if (operation.status === 'provisional') return operation.outcome === 'rejected'
    ? 'Provisional rejection; awaiting final order' : 'Provisional; awaiting final order';
  return 'Prepared locally; awaiting ordering';
}
