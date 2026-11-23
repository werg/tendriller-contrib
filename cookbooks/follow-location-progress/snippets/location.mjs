// Editable page policy: degrees, metres, and epoch milliseconds throughout.
export function admitFix(position, { now = Date.now(), maxAgeMs = 10_000, maxAccuracyM = 50 } = {}) {
  const coords = position?.coords, sampledAtMs = position?.timestamp;
  if (!coords || !Number.isFinite(coords.latitude) || Math.abs(coords.latitude) > 90
    || !Number.isFinite(coords.longitude) || Math.abs(coords.longitude) > 180
    || !Number.isFinite(coords.accuracy) || coords.accuracy < 0 || coords.accuracy > maxAccuracyM
    || !Number.isFinite(sampledAtMs) || sampledAtMs > now + 1000 || now - sampledAtMs > maxAgeMs) return null;
  return { latitude: coords.latitude, longitude: coords.longitude, accuracyM: coords.accuracy, sampledAtMs };
}

export function distanceMetres(a, b) {
  for (const value of [a, b]) if (!value || !Number.isFinite(value.latitude) || Math.abs(value.latitude) > 90 || !Number.isFinite(value.longitude) || Math.abs(value.longitude) > 180) throw TypeError('Invalid coordinates');
  const radians = value => value * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude), dLon = radians(b.longitude - a.longitude);
  const square = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, square))));
}

export function createArrivalTracker(target, { innerM = 30, outerM = 70 } = {}) {
  if (!Number.isFinite(target?.latitude) || Math.abs(target.latitude) > 90
    || !Number.isFinite(target.longitude) || Math.abs(target.longitude) > 180
    || !(innerM > 0 && outerM > innerM && Number.isFinite(outerM))) throw new TypeError('Invalid destination or hysteresis');
  let arrived = false;
  return {
    update(fix) {
      if (!Number.isFinite(fix?.accuracyM) || fix.accuracyM < 0) throw TypeError('Invalid accuracy');
      const distanceM = distanceMetres(fix, target);
      // Require the complete accuracy circle inside; require it outside to leave.
      if (!arrived && distanceM + fix.accuracyM <= innerM) arrived = true;
      else if (arrived && distanceM - fix.accuracyM >= outerM) arrived = false;
      return { arrived, distanceM, accuracyM: fix.accuracyM };
    },
    reset() { arrived = false; },
  };
}

export function createLocationController({ tendril, geolocation = globalThis.navigator?.geolocation,
  document = globalThis.document, now = Date.now, onFix = () => {}, onState = () => {},
  maxAgeMs = 10_000, maxAccuracyM = 50, schedule = setTimeout, cancel = clearTimeout } = {}) {
  if (!(maxAgeMs > 0 && maxAgeMs <= 300_000 && maxAccuracyM > 0 && Number.isFinite(maxAccuracyM))) throw new RangeError('Invalid fix limits');
  let current = null, disposed = false, snapshotTimer = null, generation = 0;
  function stop() {
    const hadSnapshot = snapshotTimer !== null;
    generation++; cancel(snapshotTimer); snapshotTimer = null;
    if (current) current.handle.unregister(); // A phase label alone never performs cleanup.
    else if (hadSnapshot) onState({ state: 'stopped', sharing: false }); // Completed one-shot, not an idle/new controller.
  }
  function hidden() { if (document?.visibilityState !== 'visible' || document?.hidden) stop(); }
  document?.addEventListener('visibilitychange', hidden);
  return {
    start(event, { watch = true } = {}) {
      if (event?.isTrusted !== true) throw new Error('Choose Start location on this device');
      if (disposed || !geolocation || document?.visibilityState !== 'visible') throw new Error('Location unavailable. Use a manual checkpoint.');
      stop();
      const version = generation, run = { watchId: null, timer: null, handle: null, lastSampledAt: -Infinity };
      current = run;
      run.handle = tendril.sensors.register({ kind: 'location', label: watch ? 'Route location sharing' : 'One location fix', state: 'pending',
        stop() {
          cancel(run.timer); run.timer = null;
          if (run.watchId !== null) { geolocation.clearWatch(run.watchId); run.watchId = null; }
          if (current === run) { current = null; generation++; onState({ state: 'stopped', sharing: false }); }
        } });
      const success = position => {
        if (run.handle.signal.aborted || current !== run) return;
        run.handle.setState('active');
        const fix = admitFix(position, { now: now(), maxAgeMs, maxAccuracyM });
        if (!fix) {
          if (!watch) { current = null; run.handle.unregister(); }
          onState({ state: 'uncertain', sharing: false }); return;
        }
        if (fix.sampledAtMs <= run.lastSampledAt) return;
        run.lastSampledAt = fix.sampledAtMs; cancel(run.timer);
        if (!watch) { current = null; run.handle.unregister(); }
        onFix(fix);
        if (generation !== version || watch && run.handle.signal.aborted) return;
        onState({ state: 'fresh', sharing: true, sampledAtMs: fix.sampledAtMs });
        const timer = schedule(() => {
          if (generation === version && (!watch || current === run && !run.handle.signal.aborted)) onState({ state: 'stale', sharing: false });
        }, Math.max(0, fix.sampledAtMs + maxAgeMs - now()) + 1);
        if (watch) run.timer = timer; else snapshotTimer = timer;
      };
      const failure = error => {
        if (run.handle.signal.aborted || current !== run) return;
        run.handle.unregister();
        onState({ state: error?.code === 1 ? 'denied' : 'unavailable', sharing: false });
      };
      onState({ state: 'pending', sharing: false });
      try {
        const options = { enableHighAccuracy: false, maximumAge: 0, timeout: 10_000 };
        if (watch) {
          const watchId = geolocation.watchPosition(success, failure, options);
          if (run.handle.signal.aborted) geolocation.clearWatch(watchId); else run.watchId = watchId;
        } else geolocation.getCurrentPosition(success, failure, options);
      } catch (error) { failure(error); }
      return run.handle.signal;
    },
    stop,
    dispose() { if (disposed) return; disposed = true; stop(); document?.removeEventListener('visibilitychange', hidden); },
  };
}

// At most one send and one replaceable pending sample. No timer callback queues
// an unbounded promise chain. Latest-mode subscription is a receiver policy only.
export function createFixPublisher(session, { streamId, intervalMs = 1000, now = Date.now,
  onError = () => {}, schedule = setTimeout, cancel = clearTimeout } = {}) {
  if (typeof streamId !== 'string' || !streamId || streamId.length > 128 || !(intervalMs >= 100 && intervalMs <= 60_000)) throw new TypeError('Invalid stream or cadence');
  const owner = new AbortController();
  let latest = null, sending = false, timer = null, nextAt = 0;
  async function flush() {
    timer = null;
    if (sending || !latest || owner.signal.aborted) return;
    const fix = latest; latest = null; sending = true; nextAt = now() + intervalMs;
    try {
      const age = now() - fix.sampledAtMs;
      if (Number.isFinite(age) && age >= -1000 && age <= 10_000) await session.signals.send('location/fix', fix,
        { ttlMs: 5000, stream: { streamId }, signal: owner.signal });
    } catch (error) { if (!owner.signal.aborted) onError(error); }
    finally { sending = false; queue(); }
  }
  function queue() {
    if (!owner.signal.aborted && latest && !sending && timer === null) timer = schedule(() => { void flush(); }, Math.max(0, nextAt - now()));
  }
  return {
    offer(fix) { if (!owner.signal.aborted) { latest = { ...fix }; queue(); } },
    stop() { if (owner.signal.aborted) return; owner.abort(); latest = null; cancel(timer); timer = null; },
  };
}
