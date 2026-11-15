/** Session workflow data schemas; the core owns only command metadata. */
const object = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const text = maxLength => ({ type: 'string', minLength: 1, maxLength });
const count = { type: 'integer', minimum: 0 };
const revision = { type: 'integer', minimum: 1 };
const id = text(200);
export const SCOPE_NAMES = Object.freeze(['notebook', 'guide', 'workshop', 'experiment', 'decisions', 'facilitation']);
const scope = { enum: SCOPE_NAMES };
const decision = { title: text(200), summary: text(8000), proposal: {}, expires_at: { type: ['integer', 'null'], minimum: 0 } };
const assignment = { title: text(200), prompt: text(8000), feedback: { type: 'string', maxLength: 8000 }, status: { enum: ['open', 'closed'] } };
export const schemas = Object.freeze({
  activate: object({ scope }, ['scope']),
  deactivate: object({ scope }, ['scope']),
  archivePreview: object({ scope }, ['scope']),
  archive: object({ scope, title: text(200), expected_state_revision: count, expected_interaction_revision: count }, ['scope', 'expected_state_revision', 'expected_interaction_revision']),
  archives: object({}), archiveGet: object({ id }, ['id']), archiveDelete: object({ id }, ['id']),
  decisions: object({}),
  decisionCreate: object({ ...decision, status: { const: 'pending' } }, ['title', 'summary']),
  decisionUpdate: object({ ...decision, id, expected_version: revision, status: { enum: ['pending', 'working', 'completed', 'failed'] }, result: { type: 'string', maxLength: 8000 } }, ['id', 'expected_version']),
  decisionRespond: object({ id, expected_version: revision, decision: { enum: ['approve', 'reject', 'revise'] }, note: { type: 'string', maxLength: 4000 } }, ['id', 'expected_version', 'decision']),
  participants: object({}), assignments: object({}), assignmentsAll: object({}),
  assignmentCreate: object({ ...assignment, participant: id }, ['participant', 'title', 'prompt']),
  assignmentUpdate: object({ ...assignment, id, expected_revision: revision }, ['id', 'expected_revision']),
  responses: object({}), responsesAll: object({}),
  responseSubmit: object({ prompt_id: text(100), answer: text(8000), expected_revision: revision, expected_assignment_revision: revision }, ['prompt_id', 'answer']),
});
