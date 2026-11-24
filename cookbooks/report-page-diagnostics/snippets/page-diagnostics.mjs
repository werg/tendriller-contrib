// Redacted bounded error buffer and rate-limited ephemeral telemetry forwarder.
// Writes zero durable Chronolog records.

export function redactDiagnosticText(text, maxLength = 500) {
  const cleaned = String(text ?? '')
    .replace(/([?&](?:token|code|secret|key|auth|session|sig|password)=)[^&#\s]+/gi, '$1[redacted]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[redacted]');
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength - 1) + '…' : cleaned;
}

export function createDiagnosticForwarder({
  session,
  topic = 'dev/telemetry',
  maxBuffered = 30,
  maxPerMinute = 30,
} = {}) {
  const buffer = [];
  const sentIds = new Set();
  const stamps = [];

  const allowSend = now => {
    while (stamps.length && now - stamps[0] > 60_000) stamps.shift();
    if (stamps.length >= maxPerMinute) return false;
    stamps.push(now);
    return true;
  };

  const connected = () => (session?.participation?.status?.connectedPeers?.length ?? 0) > 0;

  const forward = (entry, now = Date.now()) => {
    if (!session?.signals || sentIds.has(entry.id) || !connected() || !allowSend(now)) return false;
    sentIds.add(entry.id);
    void session.signals.send(topic, { kind: 'error', entry }, { ttlMs: 30_000 }).catch(() => {});
    return true;
  };

  return Object.freeze({
    record({ id, kind = 'error', message, context }, now = Date.now()) {
      const entry = {
        id: id || `${now}-${buffer.length}`,
        at: now,
        kind,
        message: redactDiagnosticText(message),
        ...(context ? { context: redactDiagnosticText(context, 160) } : {}),
      };
      buffer.push(entry);
      if (buffer.length > maxBuffered) buffer.splice(0, buffer.length - maxBuffered);
      forward(entry, now);
      return entry;
    },
    flush(now = Date.now()) {
      let count = 0;
      for (const entry of buffer) if (forward(entry, now)) count++;
      return count;
    },
    list: () => buffer.slice(),
  });
}
