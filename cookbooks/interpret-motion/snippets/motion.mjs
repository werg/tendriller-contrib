// Example heuristic, not a step counter or measurement of completed work.
// Uses gravity-free event.acceleration in m/s²; never substitutes gravity data.
export function createMagnitudeDetector({ high = 12, low = 4, refractoryMs = 600, gapMs = 2000 } = {}) {
  if (![high, low, refractoryMs, gapMs].every(Number.isFinite) || low < 0 || high <= low || refractoryMs < 0 || gapMs <= 0) throw RangeError('Invalid motion thresholds.');
  let armed = true, lastEvent = -Infinity, lastSample = -Infinity, count = 0;
  return {
    reset() { armed = true; lastEvent = lastSample = -Infinity; count = 0; },
    sample(acceleration, sampledAt) {
      if (!acceleration || ![acceleration.x, acceleration.y, acceleration.z, sampledAt].every(Number.isFinite)
        || sampledAt <= lastSample) return null;
      const gap = lastSample !== -Infinity && sampledAt - lastSample > gapMs;
      if (gap) { armed = false; lastEvent = -Infinity; } // Re-arm only after a fresh quiet sample.
      lastSample = sampledAt;
      const magnitude = Math.hypot(acceleration.x, acceleration.y, acceleration.z);
      if (magnitude <= low) armed = true;
      const detected = armed && magnitude >= high && sampledAt - lastEvent >= refractoryMs;
      if (magnitude >= high) armed = false; // A suppressed excursion still needs a fresh low edge.
      if (detected) { lastEvent = sampledAt; count++; }
      return { magnitude, unit: 'm/s²', sampledAt, detected, count, gap };
    },
  };
}

/** Call start(event) directly in the click handler so iOS sees user activation. */
export function createMotionController({ tendril, target = globalThis.window, document = globalThis.document,
  MotionEvent = globalThis.DeviceMotionEvent, now = () => performance.now(), detector = {},
  onSample = () => {}, onStatus = () => {} }) {
  const algorithm = createMagnitudeDetector(detector);
  let handle = null, disposed = false, phase = 'stopped';
  const status = value => { phase = value; onStatus(value); };
  const stop = () => handle?.unregister();
  const hidden = () => { if (document.visibilityState !== 'visible') stop(); };
  document?.addEventListener('visibilitychange', hidden);
  return {
    get phase() { return phase; },
    async start(event) {
      if (event?.isTrusted !== true) throw Error('Start motion from a trusted local action.');
      if (disposed) throw Error('Motion controls are closed.');
      if (document?.visibilityState !== 'visible') throw Error('Open this page before starting motion.');
      if (!MotionEvent) throw Error('Motion input is unavailable. Use the manual marker.');
      stop(); algorithm.reset();
      const listener = event => {
        if (current.signal.aborted) return;
        const sample = algorithm.sample(event.acceleration, now());
        if (sample) onSample(sample);
      };
      const current = tendril.sensors.register({ kind: 'motion', label: 'Movement rehearsal', state: 'pending',
        stop() { target.removeEventListener('devicemotion', listener); if (handle === current) { handle = null; status('stopped'); } } });
      handle = current; status('requesting');
      try {
        // No asynchronous capability probe between gesture and permission call.
        const permission = typeof MotionEvent.requestPermission === 'function' ? await MotionEvent.requestPermission() : 'granted';
        current.signal.throwIfAborted();
        if (permission !== 'granted') throw Error('Motion permission was denied. Use the manual marker.');
        target.addEventListener('devicemotion', listener);
        current.setState('active'); status('active');
      } catch (error) {
        const cancelled = current.signal.aborted;
        current.unregister();
        if (!cancelled) status('unavailable');
        throw error;
      }
    },
    stop,
    dispose() { if (disposed) return; stop(); disposed = true; document?.removeEventListener('visibilitychange', hidden); },
  };
}
