// Copy into the authored page. No permission requests or sensor acquisition.
// Typed and file inputs remain available regardless of optional API support.
export const INPUT_KEYS = Object.freeze(['camera', 'microphone', 'location', 'motion', 'serial', 'bluetooth', 'screen_capture']);
const PERMISSIONS = new Set(['granted', 'prompt', 'denied', 'unknown']);

export function summarizeCapabilities(report, keys) {
  if (!Array.isArray(keys) || keys.length > INPUT_KEYS.length || keys.some(key => !INPUT_KEYS.includes(key))) {
    throw new TypeError('Choose only the task-relevant input keys.');
  }
  return Object.fromEntries([...new Set(keys)].map(key => {
    const value = report?.capabilities?.[key];
    return [key, { available: value?.available === true,
      permission: PERMISSIONS.has(value?.permission) ? value.permission : 'unknown' }];
  }));
}

/** Supply authored buttons keyed by capability; do not send the complete report. */
export async function configureInputRoutes(tendril, { buttons, fileInput, typedInput, status }) {
  const keys = Object.keys(buttons);
  summarizeCapabilities({}, keys); // Validate before probing.
  if (fileInput) { fileInput.hidden = false; fileInput.disabled = false; }
  if (typedInput) { typedInput.hidden = false; typedInput.disabled = false; }
  let summary;
  try { summary = summarizeCapabilities(await tendril.capabilities(keys), keys); }
  catch (error) {
    for (const button of Object.values(buttons)) button.hidden = true;
    if (status) status.textContent = 'Optional inputs could not be checked. Choose a file or type a description.';
    throw error;
  }
  for (const [key, button] of Object.entries(buttons)) {
    const capability = summary[key];
    button.hidden = !capability.available;
    button.disabled = capability.permission === 'denied';
    button.title = capability.permission === 'denied'
      ? 'Access is denied here. Use a file or text, or change browser permissions deliberately.'
      : 'Available to try after you choose it. Hardware and capture quality are still unknown.';
  }
  if (status) status.textContent = 'Describe the task or choose a file. Optional sensors start only when you choose them.';
  return summary; // Bounded availability/permission only: no user agent, labels or device IDs.
}
