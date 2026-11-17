// Page-owned live projection. The channel verifies identity, sequence and access;
// this model owns only the typing payload, UI expiry and a bounded visible set.
export function createTypingState({ maxPeers = 64, maxTtlMs = 2500 } = {}) {
  if (!Number.isSafeInteger(maxPeers) || maxPeers < 1 || !Number.isSafeInteger(maxTtlMs) || maxTtlMs < 1) {
    throw new Error('Typing bounds must be positive integers');
  }
  const peers = new Map();
  const prune = now => { for (const [key, expiry] of peers) if (expiry <= now) peers.delete(key); };
  return {
    update(event, now) {
      prune(now);
      if (event.topic !== 'typing' || typeof event.payload?.typing !== 'boolean' ||
          typeof event.authorId !== 'string' || !event.authorId || typeof event.sessionId !== 'string' || !event.sessionId ||
          !Number.isFinite(event.expiresAtMs) || event.expiresAtMs <= now) return;
      const key = JSON.stringify([event.authorId, event.sessionId]);
      peers.delete(key);
      if (!event.payload.typing) return;
      if (peers.size >= maxPeers) peers.delete(peers.keys().next().value);
      peers.set(key, Math.min(event.expiresAtMs, now + maxTtlMs));
    },
    snapshot(now) {
      prune(now);
      return { count: peers.size, expiresAtMs: peers.size ? Math.min(...peers.values()) : null };
    },
    clear() { peers.clear(); },
  };
}

export async function observeTyping(signals, { onChange, signal, now = Date.now,
  schedule = setTimeout, cancel = clearTimeout, ...bounds }) {
  const state = createTypingState(bounds);
  let timer, stopped = false;
  const paint = () => {
    cancel(timer);
    if (stopped || signal?.aborted) return;
    const snapshot = state.snapshot(now());
    onChange(snapshot);
    if (snapshot.expiresAtMs !== null) timer = schedule(paint, Math.max(0, snapshot.expiresAtMs - now()));
  };
  try {
    for await (const event of signals.subscribe({ topics: ['typing'], mode: 'latest', signal })) {
      if (signal?.aborted) break;
      state.update(event, now());
      paint();
    }
  } finally {
    stopped = true;
    cancel(timer);
    state.clear();
    onChange(state.snapshot(now()));
  }
}
