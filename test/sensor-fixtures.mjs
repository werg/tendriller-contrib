// Deterministic browser fixtures for the page-owned sensor examples.
// These model the public runtime ports; hardware qualification is separate.
export const gesture = Object.freeze({ isTrusted: true });
export const tick = () => new Promise(resolve => setImmediate(resolve));
export function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
export function runtimeFixture(report = { capabilities: {} }) {
  const resources = new Set(), calls = [];
  const runtime = {
    calls, resources,
    async capabilities(filter) { calls.push([...filter]); return { ...report, capabilities: Object.fromEntries(filter.filter(key => report.capabilities[key]).map(key => [key, report.capabilities[key]])) }; },
    sensors: {
      register(spec) {
        const owner = new AbortController();
        const record = { ...spec, state: spec.state ?? 'pending', owner, stopped: false };
        resources.add(record);
        const finish = () => resources.delete(record);
        const handle = {
          signal: owner.signal,
          setState(state) { if (!owner.signal.aborted) record.state = state; },
          unregister() {
            if (record.stopped) return;
            record.stopped = true; owner.abort(new DOMException('Stopped', 'AbortError'));
            record.state = 'stopping';
            try {
              const result = spec.stop();
              if (result?.then) record.done = result.then(finish, error => { record.state = 'failed'; record.error = error; });
              else finish();
            } catch (error) { record.state = 'failed'; record.error = error; }
          },
        };
        record.handle = handle;
        return handle;
      },
      stopAll() { const pending = [...resources].filter(value => !value.stopped); for (const record of pending) record.handle.unregister(); return pending.length; },
      status() {
        return { active: [...new Set([...resources].filter(value => value.state === 'active').map(value => value.kind))],
          pending: [...new Set([...resources].filter(value => value.state === 'pending').map(value => value.kind))] };
      },
    },
  };
  return runtime;
}
export function pageFixture() {
  const document = new EventTarget();
  document.visibilityState = 'visible';
  document.hide = () => { document.visibilityState = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); };
  return document;
}
export function trackFixture() {
  const track = new EventTarget(); track.readyState = 'live'; track.stops = 0;
  track.stop = () => { track.stops++; track.readyState = 'ended'; };
  return track;
}
