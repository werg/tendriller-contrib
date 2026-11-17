// Page-owned display policy. Signed delivery and topic authorization belong to
// the channel. A missed chunk makes the preview incomplete until final text is read.
export function createTokenPreview({ requestId, maxCharacters = 8000 }) {
  if (typeof requestId !== 'string' || !requestId || requestId.length > 128 ||
      !Number.isSafeInteger(maxCharacters) || maxCharacters < 1) throw new TypeError('A bounded active request is required');
  let nextIndex = 0, text = '', incomplete = false;
  return {
    receive(payload) {
      if (requestId === undefined || !payload || payload.requestId !== requestId ||
          !Number.isSafeInteger(payload.index) || payload.index < 0 || typeof payload.text !== 'string') return;
      if (payload.index < nextIndex) return;
      if (payload.index !== nextIndex) incomplete = true;
      nextIndex = payload.index + 1;
      const remaining = maxCharacters - text.length;
      if (payload.text.length > remaining) incomplete = true;
      text += payload.text.slice(0, Math.max(0, remaining));
    },
    snapshot() { return { requestId, text, incomplete }; },
    clear() { requestId = undefined; nextIndex = 0; text = ''; incomplete = false; },
  };
}
