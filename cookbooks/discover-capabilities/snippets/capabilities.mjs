// Editable page source. RuntimeApi is supplied by the page's @tendriller/runtime.
// Select only capabilities needed for this task; do not share the full report.
const permissions = new Set(['granted', 'prompt', 'denied', 'unknown']);
export async function inspectInputs(tendril, keys = ['camera', 'microphone']) {
  if (!Array.isArray(keys) || keys.length > 12 || keys.some(key => !/^[a-z][a-z0-9_-]{0,47}$/.test(key))) {
    throw new TypeError('Choose at most 12 task-relevant capability keys');
  }
  const selected = [...new Set(keys)];
  const report = await tendril.capabilities(selected);
  const capabilities = Object.create(null);
  for (const key of selected) {
    const value = report.capabilities[key];
    capabilities[key] = {
      available: value?.available === true,
      permission: permissions.has(value?.permission) ? value.permission : 'unknown',
      active: value?.active === true,
    };
  }
  // Deliberately exclude device, captured_at, notes and unrelated capabilities.
  return { capabilities, fallbacks: ['file', 'text'] };
}

export function applyInputChoices(summary, { buttons, status, fileButton, textButton }) {
  for (const [key, button] of Object.entries(buttons)) {
    const value = summary.capabilities[key];
    button.hidden = !value?.available;
    button.disabled = !value?.available || value.permission === 'denied';
    button.title = value?.permission === 'denied' ? 'Access denied. Use a file or type instead.'
      : 'Choose to request access; availability does not establish working hardware.';
  }
  for (const button of [fileButton, textButton]) if (button) { button.hidden = false; button.disabled = false; }
  if (status) status.textContent = 'Choose an input. Files and typed descriptions are always available.';
}

// Sharing diagnostics is a distinct local decision, never a startup side effect.
// This 2 KiB budget is below the session's 16 KiB signal payload limit.
export async function shareInputChoices(session, summary, event, { streamId, signal } = {}) {
  if (event?.isTrusted !== true) throw new Error('Choose Share capabilities on this device');
  if (typeof streamId !== 'string' || !streamId || streamId.length > 128) throw new TypeError('A bounded stream identity is required');
  const capabilities = Object.fromEntries(Object.entries(summary.capabilities).slice(0, 12).map(([key, value]) => {
    if (!/^[a-z][a-z0-9_-]{0,47}$/.test(key)) throw new TypeError('Invalid capability key');
    return [key, { available: value.available === true,
      permission: permissions.has(value.permission) ? value.permission : 'unknown' }];
  }));
  const payload = { capabilities };
  if (new TextEncoder().encode(JSON.stringify(payload)).length > 2048) throw new RangeError('Capability summary exceeds budget');
  return session.signals.send('inputs/capabilities', payload, { ttlMs: 10_000, stream: { streamId }, signal });
}
