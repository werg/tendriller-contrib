// Adaptable numerical example, not a mounted UI or a supported package export.
// Inputs: finite numeric x, numeric y or null, ascending x chosen by the caller.
// EMA is sample weighted, in original units, restarting at gaps/nonpositive log y.
export function ema(points, alpha, { log = false } = {}) {
  if (!(alpha > 0 && alpha <= 1)) throw new RangeError('alpha must be in (0, 1]');
  let previous = null;
  return points.map(({ x, y }) => {
    if (!Number.isFinite(x)) throw new TypeError('x must be finite');
    if (!Number.isFinite(y) || log && y <= 0) { previous = null; return { x, raw: y, smoothed: null }; }
    previous = previous === null ? y : alpha * y + (1 - alpha) * previous;
    return { x, raw: y, smoothed: previous };
  });
}

// Exact shared-x inspection. A duplicate coordinate uses the last admitted value.
// No interpolation or independent nearest-neighbour substitution is implied.
export function exactAtX(points, x) {
  for (let i = points.length - 1; i >= 0; i--) if (points[i].x === x) return points[i].y;
  return null;
}

export function seriesKey({ source, run, unit }) {
  if (![source, run, unit].every(value => typeof value === 'string' && value.length)) throw new TypeError('source, run, and unit must be nonempty strings');
  return JSON.stringify([source, run, unit]);
}

// A checkpoint stores the entire materialized view and cursor in one atomic item.
// Caller authorizes the current reader BEFORE load/render and uses one writer/key.
// This example permits only bounded plain JSON data; it never acknowledges agent work.
function validate(value, maxPoints) {
  if (!value || value.modelVersion !== 1 || !Number.isSafeInteger(value.cursor) || value.cursor < 0 || typeof value.historyIncomplete !== 'boolean' || !Array.isArray(value.records) || value.records.length > maxPoints) throw new TypeError('Invalid measurement checkpoint');
  if (value.records.some(record => !record || !Number.isSafeInteger(record.seq) || record.seq < 1 || record.seq > value.cursor || !Number.isFinite(record.x) || !(record.y === null || Number.isFinite(record.y)) || typeof record.source !== 'string' || typeof record.run !== 'string' || typeof record.unit !== 'string')) throw new TypeError('Invalid checkpoint records');
  return value;
}
export function saveCheckpoint(storage, key, value, { maxPoints = 500, maxBytes = 1024 * 1024 } = {}) {
  validate(value, maxPoints);
  const data = JSON.stringify(value);
  if (new TextEncoder().encode(data).byteLength > maxBytes) throw new RangeError('Checkpoint byte budget exceeded');
  storage.setItem(key, data); // Failure leaves the previous atomic item intact.
}
export function loadCheckpoint(storage, key, { maxPoints = 500 } = {}) {
  const value = storage.getItem(key);
  return value === null ? null : validate(JSON.parse(value), maxPoints);
}
