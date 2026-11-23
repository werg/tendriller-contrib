// Test-only bridge. Actual public sessions authenticate and encrypt every frame.
export function publicTransport(send) {
  const owner = new AbortController(), lanes = { reliable: [], live: [] }, waiters = new Set();
  const wake = () => { for (const resolve of waiters) resolve(); waiters.clear(); };
  const deliver = (lane, bytes) => {
    if (owner.signal.aborted) return false;
    if (!lanes[lane] || lanes[lane].length >= 64 || bytes.length > 1024 * 1024) throw Error('Test bridge capacity exceeded.');
    lanes[lane].push(new Uint8Array(bytes)); wake(); return true;
  };
  const frames = (lane, signal) => ({ async *[Symbol.asyncIterator]() {
    const lifetime = signal ? AbortSignal.any([owner.signal, signal]) : owner.signal;
    lifetime.addEventListener('abort', wake);
    try {
      while (!lifetime.aborted) {
        if (lanes[lane].length) yield lanes[lane].shift();
        else await new Promise(resolve => { waiters.add(resolve); if (lifetime.aborted || lanes[lane].length) wake(); });
      }
    } finally { lifetime.removeEventListener('abort', wake); }
  } });
  const close = async () => { owner.abort(); lanes.reliable.length = lanes.live.length = 0; wake(); };
  const connection = { signal: owner.signal, close, frames: signal => frames('reliable', signal),
    async send(bytes, { signal } = {}) { owner.signal.throwIfAborted(); signal?.throwIfAborted(); await send('reliable', [...bytes]); },
    live: { signal: owner.signal, close, frames: signal => frames('live', signal),
      async trySend(bytes, { signal } = {}) { owner.signal.throwIfAborted(); signal?.throwIfAborted(); return send('live', [...bytes]); } } };
  return { connection, deliver, close };
}
