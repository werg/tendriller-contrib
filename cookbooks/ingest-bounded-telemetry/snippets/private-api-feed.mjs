// Native private-API data feed poller over authenticated live signals.
// Keeps API keys/local access on the native host, pauses polling when no browser
// peers are connected, skips unchanged payloads, and writes zero durable records.

export function createPrivateApiFeed(session, {
  name,
  fetchData,
  pollMs = 5_000,
  ttlMs = 30_000,
  signal,
} = {}) {
  if (!session?.signals || typeof fetchData !== 'function' || !name) {
    throw new TypeError('createPrivateApiFeed requires session, name, and fetchData');
  }
  const stop = new AbortController();
  const lifetime = signal ? AbortSignal.any([stop.signal, signal]) : stop.signal;
  let lastSerialized = null;
  let revision = 0;
  let latest = null;

  const peersConnected = () => (session.participation?.status?.connectedPeers?.length ?? 0) > 0;

  const pollOnce = async ({ force = false } = {}) => {
    if (lifetime.aborted) return null;
    if (!force && !peersConnected()) return null;
    const data = await fetchData({ signal: lifetime });
    const serialized = JSON.stringify(data);
    if (!force && serialized === lastSerialized) return latest;
    lastSerialized = serialized;
    latest = { feed: name, revision: ++revision, fetchedAtMs: Date.now(), data };
    await session.signals.send(`feed/${name}`, latest, { ttlMs, signal: lifetime });
    return latest;
  };

  const timer = pollMs > 0 ? setInterval(() => { void pollOnce().catch(() => {}); }, pollMs) : null;
  const offStatus = session.participation?.onStatus?.(status => {
    if ((status?.connectedPeers?.length ?? 0) > 0 && latest) {
      void session.signals.send(`feed/${name}`, latest, { ttlMs, signal: lifetime }).catch(() => {});
    }
  }) ?? (() => {});

  lifetime.addEventListener('abort', () => {
    if (timer !== null) clearInterval(timer);
    offStatus();
  }, { once: true });

  return Object.freeze({
    pollOnce,
    snapshot: () => latest,
    close() { stop.abort(); },
  });
}
