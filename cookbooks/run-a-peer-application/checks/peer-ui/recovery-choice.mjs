// Presentation and explicit approval only. The session owns recovery policy.
export function bindRecoveryChoice(participation, { panel, message, details, button, signal, onError }) {
  let proposal = null, pending = false, requested = null;
  const render = value => {
    proposal = value?.phase === 'approval-required' ? value.recovery : null;
    panel.hidden = proposal === null;
    button.disabled = proposal === null || pending || requested === proposal.id || signal.aborted;
    button.textContent = pending || requested === proposal?.id ? 'Recovery requested…' : 'Recover from this history';
    if (proposal === null) return;
    message.textContent = proposal.reason === 'freshness-unknown'
      ? 'The age of this available history is unknown. Recovering may exclude recent work. Original attempts remain available for review.'
      : 'This available history is older than the configured recovery budget. Recovering may exclude more recent work. Original attempts remain available for review.';
    details.textContent = [
      `Reason: ${proposal.reason}`,
      `History: ${proposal.point.generation}`,
      `Position: ${proposal.point.sequence}`,
      `Content root: ${proposal.point.root}`,
      `Last verified coordinator contact: ${proposal.observedAt === null ? 'Unknown' : new Date(proposal.observedAt).toISOString()}`,
      `Observed age: ${proposal.ageMs === null ? 'Unknown' : `${proposal.ageMs} ms`}`,
    ].join('\n');
  };
  button.onclick = async () => {
    if (proposal === null || pending || requested === proposal.id || signal.aborted) return;
    const id = proposal.id;
    pending = true; render(participation.status);
    try { await participation.approveRecovery(id); requested = id; }
    catch (error) { if (!signal.aborted) onError(error); }
    finally { pending = false; if (!signal.aborted) render(participation.status); }
  };
  const stop = participation?.onStatus(render) ?? (() => {});
  if (!participation) render(null);
  const close = () => { stop(); button.disabled = true; button.onclick = null; signal.removeEventListener('abort', close); };
  signal.addEventListener('abort', close, { once: true });
  if (signal.aborted) close();
  return close;
}
