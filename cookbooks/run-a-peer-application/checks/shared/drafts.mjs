// Only editor text and operation references live here. The backend owns delivery.
export const DRAFT_VERSION = 1;
export const MAX_OPERATION_REFERENCES = 100;
export const newDrafts = () => ({ version: DRAFT_VERSION, message: '', operations: [] });

export function validateDrafts(value) {
  if (!value || value.version !== DRAFT_VERSION || typeof value.message !== 'string' || value.message.length > 8000 || !Array.isArray(value.operations) || value.operations.length > MAX_OPERATION_REFERENCES) throw new TypeError('Invalid draft record');
  const seen = new Set();
  for (const reference of value.operations) {
    if (!reference || typeof reference.operationId !== 'string' || !reference.operationId || reference.operationId.length > 128 || seen.has(reference.operationId)) throw new TypeError('Invalid operation reference');
    seen.add(reference.operationId);
    if (!['message', 'claim', 'job'].includes(reference.kind) || typeof reference.text !== 'string' || reference.text.length > 8000) throw new TypeError('Invalid submitted draft');
    if (typeof reference.domainId !== 'string' || !reference.domainId || reference.domainId.length > 128) throw new TypeError('Invalid domain identity');
  }
  return structuredClone(value);
}

export function retainReference(drafts, reference) {
  const existing = drafts.operations.find(value => value.operationId === reference.operationId);
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(reference)) throw new Error('An operation reference cannot change its reviewed meaning');
    return drafts;
  }
  if (drafts.operations.length >= MAX_OPERATION_REFERENCES) throw new Error('Review and remove finished operation references before submitting more work');
  return validateDrafts({ ...drafts, operations: [...drafts.operations, reference] });
}

export function clearSubmittedText(drafts, submittedText) {
  // An old receipt must never erase text entered after this submission started.
  return drafts.message === submittedText ? { ...drafts, message: '' } : drafts;
}
