// Bounded page-owned capture. Neither function uploads or sends its candidate.
export const AUDIO_TYPES = Object.freeze(['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']);
const cancelled = () => new DOMException('Capture cancelled.', 'AbortError');
const trusted = event => { if (event?.isTrusted !== true) throw Error('Capture requires a trusted local action.'); };
const stopTracks = stream => { for (const track of stream?.getTracks() ?? []) if (track.readyState !== 'ended') track.stop(); };
const bounded = max => { if (!Number.isSafeInteger(max) || max < 1 || max > 8 * 1024 * 1024) throw RangeError('Choose an evidence limit up to 8 MiB.'); };
function owned(promise, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => { signal.removeEventListener('abort', abort); reject(signal.reason ?? cancelled()); };
    signal.addEventListener('abort', abort, { once: true });
    Promise.resolve(promise).then(value => { signal.removeEventListener('abort', abort); resolve(value); },
      error => { signal.removeEventListener('abort', abort); reject(error); });
    if (signal.aborted) abort();
  });
}

export async function captureScreenFrame(event, { tendril, mediaDevices = globalThis.navigator?.mediaDevices,
  document = globalThis.document, signal, maxBytes = 8 * 1024 * 1024, maxEdge = 1280, onStatus = () => {} }) {
  trusted(event); bounded(maxBytes);
  if (!Number.isSafeInteger(maxEdge) || maxEdge < 1 || maxEdge > 4096) throw RangeError('Invalid frame dimensions.');
  if (document?.visibilityState !== 'visible' || !mediaDevices?.getDisplayMedia) throw Error('Screen capture is unavailable here. Choose a file or text.');
  let stream, timer, canvas;
  const video = document.createElement('video'); video.muted = true; video.playsInline = true;
  const release = () => { stopTracks(stream); stream = null; video.pause?.(); video.srcObject = null; };
  const handle = tendril.sensors.register({ kind: 'screen_capture', label: 'One reviewed screen frame', state: 'pending',
    stop() { release(); onStatus('stopped'); } });
  const hidden = () => { if (document.visibilityState !== 'visible') handle.unregister(); };
  document.addEventListener('visibilitychange', hidden);
  const stop = () => handle.unregister();
  signal?.addEventListener('abort', stop, { once: true });
  if (signal?.aborted) stop();
  try {
    handle.signal.throwIfAborted();
    onStatus('requesting');
    // The chooser runs in this original trusted event stack.
    const acquisition = mediaDevices.getDisplayMedia({ video: true, audio: false });
    stream = await owned(Promise.resolve(acquisition).then(value => {
      if (handle.signal.aborted) { stopTracks(value); throw cancelled(); }
      return value;
    }), handle.signal);
    handle.signal.throwIfAborted(); handle.setState('active');
    video.srcObject = stream;
    const ready = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(Error('The screen did not provide a frame. Try again or choose a file.')), 10_000);
      Promise.resolve(video.play()).then(resolve, reject);
    });
    await owned(ready, handle.signal); clearTimeout(timer); onStatus('capturing');
    if (!(video.videoWidth > 0 && video.videoHeight > 0)) throw Error('The selected screen has no frame yet.');
    canvas = document.createElement('canvas');
    const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale)); canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d'); if (!context) throw Error('Frame encoding is unavailable.');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    release(); // Capture has ended before encoding or review.
    const encoded = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(Error('Frame encoding timed out.')), 10_000);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('No screen frame was encoded.')), 'image/jpeg', 0.85);
    });
    const blob = await owned(encoded, handle.signal); handle.signal.throwIfAborted();
    if (!blob.size || blob.size > maxBytes || blob.type !== 'image/jpeg') throw Error('The screen frame exceeds the supported evidence budget.');
    onStatus('review'); return blob;
  } finally {
    clearTimeout(timer); release(); handle.unregister(); document.removeEventListener('visibilitychange', hidden); signal?.removeEventListener('abort', stop);
    if (canvas) canvas.width = canvas.height = 0;
  }
}

export function createAudioClip({ tendril, mediaDevices = globalThis.navigator?.mediaDevices,
  Recorder = globalThis.MediaRecorder, document = globalThis.document,
  maxBytes = 8 * 1024 * 1024, maxDurationMs = 15_000, onStatus = () => {}, schedule = setTimeout, cancel = clearTimeout }) {
  bounded(maxBytes);
  if (!Number.isSafeInteger(maxDurationMs) || maxDurationMs < 1 || maxDurationMs > 30_000) throw RangeError('Choose an audio duration up to 30 seconds.');
  let handle = null, finishCurrent = null, disposed = false;
  const stop = () => handle?.unregister();
  const hidden = () => { if (document?.visibilityState !== 'visible') stop(); };
  document?.addEventListener('visibilitychange', hidden);
  return {
    async start(event) {
      trusted(event);
      if (disposed || handle) throw Error('Finish or discard the current clip first.');
      if (document?.visibilityState !== 'visible' || !mediaDevices?.getUserMedia || !Recorder) throw Error('Audio capture is unavailable here. Choose a file or text.');
      const mimeType = AUDIO_TYPES.find(type => Recorder.isTypeSupported(type));
      if (!mimeType) throw Error('No supported bounded audio format. Choose a file or text.');
      let stream, recorder, timer, chunks = [], total = 0, settled = false, finish, reject, failure;
      const completed = new Promise((yes, no) => { finish = yes; reject = no; }); void completed.catch(() => {});
      const current = tendril.sensors.register({ kind: 'microphone', label: 'Reviewed audio clip', state: 'pending', stop() {
        cancel(timer);
        if (!settled) { settled = true; chunks = []; reject(cancelled()); }
        if (recorder?.state !== 'inactive') recorder?.stop();
        stopTracks(stream);
        if (handle === current) { handle = null; finishCurrent = null; }
        onStatus('stopped');
      } });
      handle = current; onStatus('requesting');
      const end = () => {
        if (current.signal.aborted || !recorder || recorder.state === 'inactive') return;
        cancel(timer); recorder.stop(); stopTracks(stream); onStatus('finishing');
      };
      finishCurrent = end;
      try {
        const acquisition = mediaDevices.getUserMedia({ audio: true, video: false });
        stream = await owned(Promise.resolve(acquisition).then(value => {
          if (current.signal.aborted) { stopTracks(value); throw cancelled(); } return value;
        }), current.signal);
        current.signal.throwIfAborted();
        recorder = new Recorder(stream, { mimeType, audioBitsPerSecond: 64_000 });
        recorder.addEventListener('dataavailable', event => {
          if (settled || current.signal.aborted || !event.data?.size) return;
          total += event.data.size;
          if (total > maxBytes) { failure = Error('The audio clip exceeds the evidence byte budget.'); chunks = []; end(); }
          else if (!failure) chunks.push(event.data);
        });
        recorder.addEventListener('error', () => { failure = Error('The audio recorder failed.'); end(); if (!settled) { settled = true; reject(failure); } });
        recorder.addEventListener('stop', () => {
          stopTracks(stream);
          if (settled) return; settled = true;
          const blob = new Blob(chunks, { type: recorder.mimeType || mimeType }); chunks = [];
          if (failure || !blob.size || blob.size > maxBytes || !AUDIO_TYPES.includes(blob.type.split(';', 1)[0])) reject(failure ?? Error('No usable audio was captured.'));
          else { onStatus('review'); finish(blob); }
        }, { once: true });
        recorder.start(250); current.setState('active'); onStatus('recording');
        timer = schedule(end, maxDurationMs);
        return await owned(completed, current.signal);
      } finally { cancel(timer); current.unregister(); stopTracks(stream); }
    },
    finish() { finishCurrent?.(); }, // Stops acquisition and produces a local candidate.
    cancel: stop, // Discards; Stop sensors and visibility changes take this path.
    dispose() { if (disposed) return; stop(); disposed = true; document?.removeEventListener('visibilitychange', hidden); },
  };
}
