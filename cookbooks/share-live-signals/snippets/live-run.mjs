// Page-owned example: one selected producer reports one active run. These
// functions use only the public Signals port, with no durable backend or log.
export function createLiveRun({ runId, publisher, endpointId, endpointIncarnation }) {
  if (typeof runId !== 'string' || !runId || typeof publisher !== 'string' || !publisher) {
    throw new TypeError('A run and its authorized publisher identity are required');
  }
  let progress = null, preview = null;
  return {
    update(event, now) {
      const payload = event.payload;
      if (event.authorId !== publisher || event.stream?.streamId !== runId ||
          endpointId !== undefined && event.stream.endpointId !== endpointId ||
          endpointIncarnation !== undefined && event.stream.endpointIncarnation !== endpointIncarnation ||
          !payload || payload.runId !== runId ||
          !Number.isFinite(event.expiresAtMs) || event.expiresAtMs <= now) return;
      if (event.topic === 'progress' && Number.isSafeInteger(payload.completed) && payload.completed >= 0 &&
          (payload.total === null || Number.isSafeInteger(payload.total) && payload.total > 0 && payload.completed <= payload.total)) {
        progress = { completed: payload.completed, total: payload.total, expiresAtMs: event.expiresAtMs };
      } else if (event.topic === 'preview' && typeof payload.text === 'string' && payload.text.length <= 8192) {
        // Each preview is a complete replaceable value; a lost intermediate
        // message cannot produce a silently truncated concatenation.
        preview = { text: payload.text, expiresAtMs: event.expiresAtMs };
      }
    },
    snapshot(now) {
      if (progress?.expiresAtMs <= now) progress = null;
      if (preview?.expiresAtMs <= now) preview = null;
      return { progress: progress && { ...progress }, preview: preview && { ...preview },
        expiresAtMs: progress || preview ? Math.min(progress?.expiresAtMs ?? Infinity, preview?.expiresAtMs ?? Infinity) : null };
    },
    clear() { progress = preview = null; },
  };
}

export async function observeLiveRun(signals, { onChange, signal, now = Date.now,
  schedule = setTimeout, cancel = clearTimeout, ...selection }) {
  const run = createLiveRun(selection);
  let timer, stopped = false;
  const paint = () => {
    cancel(timer);
    if (stopped || signal?.aborted) return;
    const value = run.snapshot(now());
    onChange(value);
    if (value.expiresAtMs !== null) timer = schedule(paint, Math.max(0, value.expiresAtMs - now()));
  };
  try {
    paint();
    // Select the signed stream before the channel coalesces pending values.
    // Filtering only payload.runId here lets another run suppress this run.
    for await (const event of signals.subscribe({ topics: ['progress', 'preview'], mode: 'latest',
      streams: [{ authorId: selection.publisher, streamId: selection.runId,
        ...(selection.endpointId === undefined ? {} : { endpointId: selection.endpointId }),
        ...(selection.endpointIncarnation === undefined ? {} : { endpointIncarnation: selection.endpointIncarnation }) }], signal })) {
      if (signal?.aborted) break;
      run.update(event, now());
      paint();
    }
  } finally {
    stopped = true; cancel(timer); run.clear(); onChange(run.snapshot(now()));
  }
}

/** Harmless attention suggestions: the receiving device retains follow control. */
export async function observeAttention(signals, { runId, publisher, allowedTargets, following, highlight, signal }) {
  for await (const event of signals.subscribe({ topics: ['attention'], mode: 'all',
    streams: [{ authorId: publisher, streamId: runId }], signal })) {
    if (signal?.aborted) break;
    const payload = event.payload;
    if (event.authorId === publisher && event.stream?.streamId === runId && payload?.runId === runId &&
        typeof payload.targetId === 'string' && allowedTargets.has(payload.targetId) && following()) {
      highlight(payload.targetId);
    }
  }
}
