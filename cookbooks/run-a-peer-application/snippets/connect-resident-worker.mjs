import { createHttpWebRtcSignaling, negotiateWebRtc, supervisePeerSession } from '@chronolog/transport-webrtc';

/**
 * Maintain one authenticated connection to the resident declared in the initial
 * page configuration. attach must synchronously transfer both untouched channels
 * and return an authenticated attachment lifetime { signal, close }. Its signal
 * ends when the Worker peer link ends, even if ICE remains connected.
 * The signal owns that Worker lifetime; replacing it stops attempts and retries.
 */
export function connectResidentWorker({ endpoint, headers, attach, configuration, signal,
  timeoutMs, retry, onState }) {
  if (typeof attach !== 'function') throw new TypeError('An authenticated Worker attachment is required');
  return supervisePeerSession({ signal, retry, onState, readiness: 'authenticated', async connect(supervisorSignal) {
    const deadline = new AbortController();
    const attemptSignal = AbortSignal.any([supervisorSignal, deadline.signal]);
    const signaling = createHttpWebRtcSignaling({ url: endpoint, headers, signal: attemptSignal, timeoutMs });
    const timer = setTimeout(() => deadline.abort(new Error('RESIDENT_ATTACHMENT_TIMEOUT')), timeoutMs ?? 30_000);
    let session, attached, attachment, attachmentClosing;
    const disposeAttachment = () => {
      if (!attachment || typeof attachment.close !== 'function') return Promise.resolve();
      const current = attachment;
      return attachmentClosing ??= Promise.resolve().then(() => current.close());
    };
    try {
      session = await negotiateWebRtc({ role: 'offerer', signaling, configuration, signal: attemptSignal, timeoutMs,
        onDataChannels(channels) {
          // Calling attach is synchronous, so its postMessage transfer happens
          // before this callback returns. Its result is the later auth boundary.
          attached = Promise.resolve(attach(channels, attemptSignal));
          // Even a Worker RPC port that ignores cancellation owns any late
          // attachment it returns. Retire it without reviving this attempt.
          void attached.then(value => {
            attachment = value;
            if (attemptSignal.aborted) return disposeAttachment();
          }, () => {}).catch(() => {});
        } });
      if (attached === undefined) throw new Error('RESIDENT_ATTACHMENT_MISSING');
      attachment = await awaitAttachment(attached, attemptSignal);
      if (!(attachment?.signal instanceof AbortSignal) || typeof attachment.close !== 'function') {
        throw new TypeError('Worker attachment must expose its authenticated lifetime signal and close method');
      }
      attemptSignal.throwIfAborted();
      const current = session, authenticated = attachment;
      let closing;
      return { ...current, signal: AbortSignal.any([current.signal, authenticated.signal]), introduction: signaling.stats,
        close() {
          return closing ??= Promise.resolve().then(async () => {
            const outcomes = await Promise.allSettled([disposeAttachment(), current.close()]);
            const failed = outcomes.find(result => result.status === 'rejected');
            if (failed) throw failed.reason;
          });
        } };
    } catch (error) {
      // Fence the Worker immediately, including a handoff that completed while
      // ICE/signaling was still in progress or one that will answer much later.
      deadline.abort(error);
      // The peer factory may fail before negotiation owns signaling. A failed
      // Worker authentication must also retire the already negotiated session.
      try { await signaling.close(); } catch { /* Preserve the original failure. */ }
      const disposals = [disposeAttachment(), Promise.resolve().then(() => session?.close())];
      await Promise.allSettled(disposals);
      throw error;
    } finally { clearTimeout(timer); }
  } });
}

function awaitAttachment(attachment, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => { signal.removeEventListener('abort', abort); reject(signal.reason); };
    signal.addEventListener('abort', abort, { once: true });
    void attachment.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}
