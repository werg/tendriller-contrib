import { captureScreenFrame, createAudioClip } from './capture.mjs';
import { createObservationReview } from './observation.mjs';

/** Render a validated request in an authored element. Nothing starts on mount.
 * Keep one visible request card at a time; subsequent requests may wait/expire.
 */
export function mountObservationCard({ container, tendril, session, request, retainEvidence, document = globalThis.document }) {
  const element = (tag, text) => { const node = document.createElement(tag); if (text) node.textContent = text; return node; };
  const heading = element('h3', 'Observation requested'), question = element('p', request.question);
  const disclosure = element('p', 'Capture stays in this page until you review and Send. Application members can receive shared evidence.');
  const status = element('p', 'Choose a file, type a description, or start an optional capture.'); status.setAttribute('role', 'status');
  const label = element('label', 'Your description '), text = element('textarea'); text.maxLength = 2000; label.append(text);
  const fileLabel = element('label', 'Choose evidence '), file = element('input'); file.type = 'file'; file.accept = 'image/jpeg,image/png,image/webp,audio/webm,audio/mp4,audio/ogg,audio/wav'; fileLabel.append(file);
  const screen = element('button', 'Capture screen frame'), record = element('button', 'Start audio clip'), finish = element('button', 'Finish clip');
  const discard = element('button', 'Discard'), send = element('button', 'Send reviewed response'), preview = element('div');
  const keepLabel = element('label', ' Retain this evidence in the application'), keep = element('input'); keep.type = 'checkbox'; keepLabel.prepend(keep); keepLabel.hidden = !retainEvidence;
  for (const button of [screen, record, finish, discard, send]) button.type = 'button';
  screen.hidden = record.hidden = true; finish.disabled = true;
  container.append(heading, question, disclosure, label, fileLabel, screen, record, finish, preview, keepLabel, discard, send, status);
  let disposed = false, revision = 0, url = null, screenStop = null, capturing = false, sending = false;
  const review = createObservationReview({ session, request, retainEvidence, onStatus(value) { status.textContent = value.phase === 'uncertain'
    ? 'Delivery is uncertain. Inspect the original operation before sending again: ' + value.operationId : 'Response: ' + value.phase; } });
  const audio = createAudioClip({ tendril, document, onStatus(phase) { status.textContent = 'Audio: ' + phase; finish.disabled = phase !== 'recording'; } });
  const clearPreview = () => { if (url) URL.revokeObjectURL(url); url = null; preview.replaceChildren(); };
  const candidate = (blob, observedAt = null) => {
    review.setCandidate(blob, { observedAt }); clearPreview(); url = URL.createObjectURL(blob);
    const node = element(blob.type.startsWith('audio/') ? 'audio' : 'img'); node.src = url;
    if (node.tagName === 'AUDIO') node.controls = true; else node.alt = 'Review the exact outgoing screen or image.';
    preview.append(node); status.textContent = 'Review this candidate, then Send or Discard. Nothing has been shared.';
  };
  const error = failure => { if (!disposed && failure.name !== 'AbortError') status.textContent = failure.message; };
  const cancelCapture = () => { revision++; screenStop?.abort(); screenStop = null; audio.cancel(); capturing = false; };
  const run = (event, capture) => {
    if (capturing || sending || disposed) return;
    const ticket = ++revision; capturing = true;
    // capture(event) executes now, not in a Promise callback, preserving activation.
    capture(event).then(blob => { if (!disposed && ticket === revision) candidate(blob, Date.now()); })
      .catch(failure => { if (ticket === revision) error(failure); }).finally(() => { if (ticket === revision) { capturing = false; finish.disabled = true; } });
  };
  screen.addEventListener('click', event => run(event, localEvent => {
    screenStop = new AbortController();
    return captureScreenFrame(localEvent, { tendril, document, signal: screenStop.signal, onStatus: phase => { status.textContent = 'Screen: ' + phase; } });
  }));
  record.addEventListener('click', event => run(event, localEvent => audio.start(localEvent)));
  finish.addEventListener('click', () => audio.finish());
  file.addEventListener('change', () => { if (sending) return; cancelCapture(); try { if (file.files?.[0]) candidate(file.files[0]); } catch (failure) { error(failure); } });
  discard.addEventListener('click', () => { if (sending) return; cancelCapture(); void review.discard().then(() => { clearPreview(); text.value = ''; send.disabled = true; }, error); });
  send.addEventListener('click', event => {
    if (capturing || sending || disposed) return;
    sending = true; send.disabled = true; screen.disabled = record.disabled = file.disabled = discard.disabled = keep.disabled = text.disabled = true;
    void review.send(event, { text: text.value, keep: keep.checked }).catch(error).finally(() => {
      sending = false;
      if (['review', 'error'].includes(review.snapshot().phase)) send.disabled = screen.disabled = record.disabled = file.disabled = discard.disabled = keep.disabled = text.disabled = false;
    });
  });
  void tendril.capabilities(['screen_capture', 'microphone']).then(report => {
    if (disposed) return;
    screen.hidden = !report.capabilities.screen_capture?.available;
    record.hidden = !report.capabilities.microphone?.available;
    screen.disabled = report.capabilities.screen_capture?.permission === 'denied';
    record.disabled = report.capabilities.microphone?.permission === 'denied';
  }, () => { if (!disposed) status.textContent = 'Use a file or typed response; optional capture could not be checked.'; });
  return {
    review,
    dispose() { if (disposed) return; disposed = true; cancelCapture(); audio.dispose();
      if (['review', 'preparing', 'error'].includes(review.snapshot().phase)) void review.discard().catch(() => {});
      clearPreview(); container.replaceChildren(); },
  };
}
