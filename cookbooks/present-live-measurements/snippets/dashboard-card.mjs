// Bounded glanceable metric model + pure SVG sparkline geometry + staleness state.
// Separates live presentation state from storage so dashboards work identically
// over ephemeral live signals (mode: 'latest') or Chronolog queries.

export function createMetricModel({
  title,
  unit = '',
  historyLimit = 24,
  staleAfterMs = 60_000,
  warnAbove = Infinity,
  alertAbove = Infinity,
} = {}) {
  let history = [];
  let latest = null;
  let fetchedAtMs = null;

  return Object.freeze({
    push(value, { fetchedAtMs: at = Date.now(), delta = null } = {}) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        history.push(value);
        if (history.length > historyLimit) history = history.slice(-historyLimit);
      }
      latest = { value, delta };
      fetchedAtMs = at;
      return this.view(at);
    },
    view(now = Date.now()) {
      const value = latest?.value ?? null;
      const ageMs = fetchedAtMs === null ? null : Math.max(0, now - fetchedAtMs);
      const stale = ageMs !== null && ageMs > staleAfterMs;
      const numeric = typeof value === 'number' && Number.isFinite(value);
      const tone = numeric && value >= alertAbove ? 'alert'
        : numeric && value >= warnAbove ? 'warn'
        : numeric ? 'ok' : 'unknown';
      return {
        title,
        unit,
        value,
        delta: latest?.delta ?? null,
        history: history.slice(),
        fetchedAtMs,
        ageMs,
        stale,
        tone,
        sparklinePoints: buildSparklinePoints(history, { width: 160, height: 40 }),
        contextForAgent: () => ({ title, unit, value, stale, tone, samples: history.slice(-8) }),
      };
    },
  });
}

export function buildSparklinePoints(values, { width = 160, height = 40, pad = 4 } = {}) {
  const nums = values.filter(v => typeof v === 'number' && Number.isFinite(v));
  if (nums.length < 2) return '';
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const usableHeight = Math.max(1, height - pad * 2);
  return nums.map((v, index) => {
    const x = (index / (nums.length - 1)) * width;
    const y = (height - pad) - ((v - min) / span) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}
