// Application-owned request schema. Signals authenticate the sender but do not
// grant permission to capture. A request only displays a local review card.
const id = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
const encoder = new TextEncoder();
export function validateObservationRequest(event, { session, requester, now = Date.now() }) {
  const value = event?.payload;
  if (event?.authorId !== requester || event.scope !== session.applicationId || !Number.isFinite(event.expiresAtMs) || event.expiresAtMs <= now
    || !value || !id(value.requestId) || value.recipient !== session.deviceId
    || typeof value.question !== 'string' || !value.question.trim() || value.question.length > 1000
    || !Number.isSafeInteger(value.expiresAt) || value.expiresAt <= now || value.expiresAt > now + 60_000
    || encoder.encode(JSON.stringify(value)).length > 2048) return null;
  return Object.freeze({ requestId: value.requestId, requester, recipient: value.recipient, question: value.question, expiresAt: value.expiresAt });
}
export async function observeRequests({ session, requester, onRequest, signal, now = Date.now }) {
  const recent = new Map();
  for await (const event of session.signals.subscribe({ topics: ['evidence/request'], mode: 'all', signal })) {
    if (signal?.aborted) break;
    for (const [key, expiresAt] of recent) if (expiresAt <= now()) recent.delete(key);
    const request = validateObservationRequest(event, { session, requester, now: now() });
    if (!request || recent.has(request.requestId) || recent.size >= 32) continue;
    recent.set(request.requestId, request.expiresAt);
    onRequest(request); // Render only. Never call a capture API from this callback.
  }
}

export function createObservationReview({ session, request, retainEvidence, onStatus = () => {}, now = Date.now }) {
  let candidate = null, candidateAt = null, reference = null, upload = null, owner = null, phase = 'review', operationId = null, dispatched = false, retained = false;
  const status = value => { phase = value; onStatus({ phase, operationId, reference, retained }); };
  const editable = () => {
    if (dispatched) throw Error('This exact response was dispatched. Inspect its operation ID before another submission.');
    if (phase === 'discarded') throw Error('This review was discarded.');
  };
  const expired = () => { if (request.expiresAt <= now()) throw Error('The observation request expired. Ask for a fresh request.'); };
  return {
    snapshot: () => ({ phase, candidate, reference, operationId, retained }),
    setCandidate(blob, { observedAt = null } = {}) {
      editable();
      if (observedAt !== null && (!Number.isFinite(observedAt) || observedAt < 0 || observedAt > now() + 1000)) throw Error('Invalid observation time. Imported media may use null.');
      if (owner) throw Error('Wait for the current send.');
      if (!(blob instanceof Blob) || !blob.size || blob.size > 8 * 1024 * 1024
        || !['image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'].includes(blob.type.split(';', 1)[0])) throw Error('Choose a supported image/audio file up to 8 MiB.');
      candidate = blob.slice(0, blob.size, blob.type); candidateAt = observedAt; status('review');
    },
    async send(event, { text = '', keep = false } = {}) {
      if (event?.isTrusted !== true) throw Error('Send requires a trusted local review action.');
      editable(); expired();
      if (owner) throw Error('A send is already pending.');
      if (typeof text !== 'string' || text.length > 2000 || !text.trim() && !candidate) throw Error('Review a description or evidence first.');
      if (keep && typeof retainEvidence !== 'function') throw Error('This application has not declared an evidence retention command.');
      const captured = candidate, reviewedText = text.trim(), current = new AbortController(); owner = current;
      operationId = crypto.randomUUID(); status('preparing');
      try {
        if (captured) {
          // Content references use a type/subtype. MediaRecorder's codec
          // parameters remain encoded in the exact container bytes.
          upload = await session.content.stage({ bytes: captured.size, mediaType: captured.type.split(';', 1)[0].trim().toLowerCase() });
          current.signal.throwIfAborted();
          // Blob slices bound the transient upload buffer to 64 KiB.
          for (let offset = 0; offset < captured.size; offset += 65_536) {
            current.signal.throwIfAborted();
            const bytes = new Uint8Array(await captured.slice(offset, offset + 65_536).arrayBuffer());
            current.signal.throwIfAborted(); await upload.write(offset / 65_536, bytes);
          }
          current.signal.throwIfAborted(); reference = await upload.commit();
        }
        current.signal.throwIfAborted(); expired();
        const response = Object.freeze({ requestId: request.requestId, recipient: request.requester, operationId,
          text: reviewedText, reference, observedAt: captured ? candidateAt : null });
        if (keep) {
          // The application callback submits its DECLARED command with this
          // stable operationId and frozen original task context. No auto retry.
          dispatched = true; status('retaining');
          await retainEvidence(response); retained = true;
        }
        current.signal.throwIfAborted();
        dispatched = true; status('sending');
        await session.signals.send('evidence/response', response, { ttlMs: 20_000, signal: current.signal });
        status('sent'); return response;
      } catch (error) {
        status(dispatched ? 'uncertain' : current.signal.aborted ? 'discarded' : 'error');
        if (!dispatched) {
          if (reference && typeof session.content.prune === 'function') { await session.content.prune(reference); reference = null; }
          else await upload?.discard?.();
        }
        throw error;
      } finally { if (owner === current) owner = null; }
    },
    async discard() {
      editable(); owner?.abort(new DOMException('Review discarded.', 'AbortError')); candidate = null; status('discarded');
      // The in-flight sender owns stage cleanup after its last awaited write.
      if (!owner) {
        if (reference && typeof session.content.prune === 'function') await session.content.prune(reference);
        else await upload?.discard?.();
        reference = null;
      }
    },
    async releaseAfterReceipt() {
      if (phase !== 'sent' || retained) throw Error('Release only unretained evidence after the receiver confirms it read the bytes.');
      if (reference) {
        if (typeof session.content.prune !== 'function') throw Error('This session version has no local pruning. Keep the reference until explicit cleanup is available.');
        await session.content.prune(reference); reference = null;
      }
      candidate = null; status('released');
    },
  };
}
