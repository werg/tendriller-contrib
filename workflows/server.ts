import type { WorkflowHost, WorkflowModule, WorkflowOperation } from '@tendriller/core/host';
import { schemas } from './schema.mjs';

type Json = Record<string, any>;
type ScopeName = 'notebook' | 'guide' | 'workshop' | 'experiment' | 'decisions' | 'facilitation';
const definitions: Record<ScopeName, { paths: string[][]; reset: (h: WorkflowHost) => Json; counts: (state: Json) => Json }> = {
  notebook: { paths: [['notebook']], reset: () => ({ notebook: {} }), counts: s => ({ observations: count(s.notebook?.entries) }) },
  guide: { paths: [['guide'], ['guide_progress']], reset: () => ({ guide_progress: {} }), counts: s => ({ steps: count(s.guide?.steps), completed_checkpoints: count(s.guide_progress?.completed) }) },
  workshop: { paths: [['workshop']], reset: () => ({ workshop: {} }), counts: s => ({ steps: count(s.workshop?.steps), shared_frames: s.workshop?.frame ? 1 : 0, step_receipts: count(s.workshop?.receipts) }) },
  experiment: { paths: [['experiment']], reset: () => ({ experiment: {} }), counts: s => ({ runs: count(s.experiment?.runs), interpretations: count(s.experiment?.results) }) },
  decisions: { paths: [], reset: () => ({}), counts: () => ({}) },
  facilitation: { paths: [['facilitation']], reset: h => ({ facilitation: { stage: 'collect', prompt: { id: h.id(), text: 'What would you like to explore next?', description: 'A new session with space for everyone.' }, summary: '' } }), counts: s => ({ shared_summaries: s.facilitation?.summary ? 1 : 0 }) },
};
const count = (value: unknown): number => Array.isArray(value) ? value.length : value && typeof value === 'object' ? Object.keys(value).length : 0;
const scopeId = (name: string) => `sessions:${name}`;
function data(h: WorkflowHost, value: unknown): Json { if (!value || typeof value !== 'object' || Array.isArray(value)) h.fail(400, 'bad_request', 'Expected an object'); return value as Json; }
function name(h: WorkflowHost, value: unknown): ScopeName { if (typeof value !== 'string' || !Object.hasOwn(definitions, value)) h.fail(400, 'bad_scope', 'Choose a supported workflow scope'); return value as ScopeName; }
function text(h: WorkflowHost, value: unknown, field: string, max: number, empty = false): string {
  if (typeof value !== 'string' || (!empty && !value.trim()) || value.length > max) h.fail(400, 'bad_request', `Invalid ${field}`);
  return (value as string).trim();
}
function all<T = Json>(h: WorkflowHost, collection: string): T[] { return h.records.list<T>(collection).map(row => row.value); }
const revision = (h: WorkflowHost): number => h.records.get<number>('meta', 'revision') ?? 0;
function changed(h: WorkflowHost, topic: string) { const value = revision(h) + 1; h.records.put('meta', 'revision', value); h.notify(topic); return value; }
function required(h: WorkflowHost, collection: string, id: unknown): Json {
  if (typeof id !== 'string') h.fail(400, 'bad_request', 'An ID is required');
  const value = h.records.get<Json>(collection, id as string);
  if (!value) h.fail(404, 'not_found', 'No such workflow record');
  return value!;
}
function active(h: WorkflowHost, name: ScopeName) { const value = h.scopes.get(scopeId(name)); if (!value) h.fail(409, 'workflow_inactive', 'A controller must activate this workflow scope'); return value!; }
function snapshot(h: WorkflowHost, selected: ScopeName): Json {
  const state = h.state.get().state;
  return { shared_state: Object.fromEntries(definitions[selected].paths.map(path => path[0]).filter(key => Object.hasOwn(state, key)).map(key => [key, structuredClone(state[key])])),
    ...(selected === 'decisions' ? { decisions: all(h, 'decisions') } : {}),
    ...(selected === 'facilitation' ? { responses: all(h, 'responses'), assignments: all(h, 'assignments') } : {}) };
}
function preview(h: WorkflowHost, selected: ScopeName): Json {
  const current = active(h, selected), value = snapshot(h, selected);
  return { scope: selected, generation: current.generation, state_revision: h.state.get().rev, interaction_revision: revision(h),
    counts: { ...definitions[selected].counts(value.shared_state), ...(value.decisions ? { decisions: value.decisions.length } : {}), ...(value.responses ? { responses: value.responses.length, assignments: value.assignments.length } : {}) } };
}
function op(access: WorkflowOperation['access'], mutate: boolean, run: WorkflowOperation['run'], selected?: ScopeName | ((value: any) => string)): WorkflowOperation {
  return { access, mutate, run, ...(selected ? { scopes: value => [scopeId(typeof selected === 'function' ? selected(value) : selected)] } : {}) };
}
const operations: Record<string, WorkflowOperation> = {
  activate: op('controller', true, (h, value) => {
    const selected = name(h, data(h, value).scope);
    const existing = h.scopes.get(scopeId(selected));
    if (existing) return { scope: existing };
    return { scope: h.scopes.register(scopeId(selected), { paths: definitions[selected].paths, operations: [] }) };
  }),
  deactivate: op('controller', true, (h, value) => { const selected = name(h, data(h, value).scope); h.scopes.retire(scopeId(selected)); return { retired: true }; }, value => value?.scope),
  archivePreview: op('controller', false, (h, value) => preview(h, name(h, data(h, value).scope))),
  archive: op('controller', true, (h, value) => {
    const body = data(h, value), selected = name(h, body.scope), current = preview(h, selected);
    if (body.expected_state_revision !== current.state_revision || body.expected_interaction_revision !== current.interaction_revision)
      h.fail(409, 'version_conflict', 'Work changed during review. Review the current snapshot.');
    const archive = { format: 'tendriller-session-archive', version: 2, id: h.id(), scope: selected, generation: current.generation,
      title: body.title === undefined ? selected : text(h, body.title, 'title', 200), created_at: h.now(), ...snapshot(h, selected) };
    if (archive.decisions?.some((decision: Json) => decision.status === 'approved' || decision.status === 'working')) h.fail(409, 'work_in_progress', 'Finish approved work before archiving');
    const bytes = new TextEncoder().encode(JSON.stringify(archive)).byteLength;
    const stored = all(h, 'archives');
    if (stored.length >= 20 || stored.reduce((total, item) => total + item.bytes, 0) + bytes > 8 * 1024 * 1024) h.fail(429, 'archive_quota', 'Download and remove an older archive first');
    h.records.put('archives', archive.id, { ...archive, bytes });
    h.pinBlobs(archive);
    if (selected === 'decisions') h.records.clear('decisions');
    if (selected === 'facilitation') { h.records.clear('responses'); h.records.clear('assignments'); }
    const reset = definitions[selected].reset(h);
    if (Object.keys(reset).length) h.state.apply(Object.entries(reset).map(([key, value]) => ({ op: 'set', path: [key], value })));
    const next = h.scopes.rotate(scopeId(selected));
    const interaction_revision = changed(h, 'archived');
    h.emit({ type: 'session_archived', scope: selected, archive_id: archive.id });
    return { archive, scope: next, state_revision: h.state.get().rev, interaction_revision };
  }, value => value?.scope),
  archives: op('controller', false, h => ({ archives: all(h, 'archives').map(({ id, scope, title, created_at, bytes }) => ({ id, scope, title, created_at, bytes })).sort((a, b) => b.created_at - a.created_at), limit: 20, byte_limit: 8 * 1024 * 1024 })),
  archiveGet: op('controller', false, (h, value) => required(h, 'archives', data(h, value).id)),
  archiveDelete: op('controller', true, (h, value) => { const record = required(h, 'archives', data(h, value).id); h.records.delete('archives', record.id); return { deleted: true }; }),
  decisions: op('controller', false, h => ({ decisions: all(h, 'decisions').sort((a, b) => b.updated_at - a.updated_at) })),
  decisionCreate: op('controller', true, (h, value) => saveDecision(h, data(h, value)), 'decisions'),
  decisionUpdate: op('controller', true, (h, value) => { const body = data(h, value); return saveDecision(h, body, required(h, 'decisions', body.id)); }, 'decisions'),
  decisionRespond: op('owner', true, (h, value) => {
    const body = data(h, value), previous = required(h, 'decisions', body.id);
    if (body.expected_version !== previous.version) h.fail(409, 'version_conflict', 'Review the latest proposal');
    if (previous.status !== 'pending') h.fail(409, 'already_decided', 'This proposal already has a decision');
    if (previous.expires_at !== null && previous.expires_at <= h.now()) h.fail(410, 'expired', 'This proposal has expired');
    if (!['approve', 'reject', 'revise'].includes(body.decision)) h.fail(400, 'bad_request', 'Choose approve, reject or revise');
    const record = { ...previous, version: previous.version + 1, status: ({ approve: 'approved', reject: 'rejected', revise: 'revision_requested' } as Json)[body.decision],
      updated_at: h.now(), responded_at: h.now(), note: body.note === undefined ? '' : text(h, body.note, 'note', 4000, true) };
    h.records.put('decisions', record.id, record); changed(h, 'decisions');
    h.emit({ type: 'decision', decision_id: record.id, decision: body.decision, version: previous.version, note: record.note }, { wake: true });
    return record;
  }, 'decisions'),
  participants: op('controller', false, h => ({ participants: h.participants().map((who, index) => ({ ...who, label: who.role === 'owner' ? 'Facilitator' : `Participant ${index + 1}` })) })),
  assignments: op('participant', false, h => ({ participant: h.identity.accountId, assignments: all(h, 'assignments').filter(item => item.participant === h.identity.accountId) })),
  assignmentsAll: op('controller', false, h => ({ assignments: all(h, 'assignments') })),
  assignmentCreate: op('controller', true, (h, value) => saveAssignment(h, data(h, value)), 'facilitation'),
  assignmentUpdate: op('controller', true, (h, value) => { const body = data(h, value); return saveAssignment(h, body, required(h, 'assignments', body.id)); }, 'facilitation'),
  responses: op('participant', false, h => ({ participant: h.identity.accountId, responses: all(h, 'responses').filter(item => item.participant === h.identity.accountId) })),
  responsesAll: op('controller', false, h => ({ responses: all(h, 'responses') })),
  responseSubmit: op('participant', true, (h, value) => {
    const body = data(h, value), prompt = text(h, body.prompt_id, 'prompt_id', 100), answer = text(h, body.answer, 'answer', 8000), participant = h.identity.accountId!;
    if (prompt.startsWith('assignment:')) {
      const assignment = required(h, 'assignments', prompt.slice(11));
      if (assignment.participant !== participant) h.fail(404, 'not_found', 'No assignment for this participant');
      if (assignment.status !== 'open') h.fail(409, 'assignment_closed', 'This assignment is closed');
      if (body.expected_assignment_revision !== assignment.revision) h.fail(409, 'version_conflict', 'Review the latest assignment');
    } else if (h.state.get().state.facilitation && (h.state.get().state.facilitation as Json).prompt?.id !== prompt) h.fail(409, 'prompt_changed', 'Review the current prompt');
    const responses = all(h, 'responses'), previous = responses.find(item => item.participant === participant && item.prompt_id === prompt);
    if (previous && body.expected_revision !== previous.revision) h.fail(409, 'version_conflict', 'Review your latest response');
    if (!previous && responses.length >= 500) h.fail(429, 'quota', 'This session has reached its response limit');
    const now = h.now(), record = { id: previous?.id ?? h.id(), participant, prompt_id: prompt, answer, revision: (previous?.revision ?? 0) + 1, created_at: previous?.created_at ?? now, updated_at: now };
    h.records.put('responses', record.id, record); changed(h, 'responses');
    h.emit({ type: 'response_submitted', response_id: record.id, prompt_id: prompt, revision: record.revision }, { wake: true });
    return record;
  }, 'facilitation'),
};
function saveDecision(h: WorkflowHost, body: Json, previous?: Json): Json {
  active(h, 'decisions');
  if (previous && body.expected_version !== previous.version) h.fail(409, 'version_conflict', 'The proposal changed');
  if (!previous && all(h, 'decisions').length >= 100) h.fail(429, 'quota', 'At most 100 proposals per session');
  const now = h.now(), record: Json = previous ? { ...previous, version: previous.version + 1, updated_at: now } : { id: h.id(), version: 1, created_at: now, updated_at: now, status: 'pending' };
  const status = body.status ?? previous?.status ?? 'pending';
  if (status !== 'pending') {
    if (!previous || !['approved', 'working'].includes(previous.status) || !['working', 'completed', 'failed'].includes(status)) h.fail(409, 'invalid_transition', 'Only approved work can run or receive an outcome');
    if (['title', 'summary', 'proposal', 'expires_at'].some(key => body[key] !== undefined)) h.fail(409, 'proposal_immutable', 'Reissue a proposal before changing approved work');
    record.status = status;
    if (body.result !== undefined) record.result = text(h, body.result, 'result', 8000, true);
  } else {
    record.title = text(h, body.title ?? previous?.title, 'title', 200);
    record.summary = text(h, body.summary ?? previous?.summary, 'summary', 8000);
    const expires = body.expires_at === undefined ? previous?.expires_at ?? null : body.expires_at;
    if (expires !== null && (!Number.isSafeInteger(expires) || expires <= now)) h.fail(400, 'bad_request', 'expires_at must be a future epoch time');
    record.expires_at = expires; record.status = 'pending'; record.proposal = body.proposal ?? previous?.proposal;
    if (JSON.stringify(record.proposal ?? null).length > 16000) h.fail(413, 'too_large', 'Proposal details are too large');
    for (const key of ['responded_at', 'note', 'result']) delete record[key];
  }
  h.records.put('decisions', record.id, record); changed(h, 'decisions'); return record;
}
function saveAssignment(h: WorkflowHost, body: Json, previous?: Json): Json {
  active(h, 'facilitation');
  if (previous && body.expected_revision !== previous.revision) h.fail(409, 'version_conflict', 'The assignment changed');
  if (!previous && !h.participants().some(who => who.id === body.participant)) h.fail(400, 'unknown_participant', 'Choose an approved participant');
  if (!previous && all(h, 'assignments').length >= 500) h.fail(429, 'quota', 'Archive the session before creating more assignments');
  const now = h.now(), id = previous?.id ?? h.id(), status = body.status ?? previous?.status ?? 'open';
  if (!['open', 'closed'].includes(status)) h.fail(400, 'bad_request', 'Assignment status must be open or closed');
  const record = { id, participant: previous?.participant ?? body.participant, prompt_id: `assignment:${id}`, status,
    title: text(h, body.title ?? previous?.title, 'title', 200), prompt: text(h, body.prompt ?? previous?.prompt, 'prompt', 8000),
    feedback: text(h, body.feedback ?? previous?.feedback ?? '', 'feedback', 8000, true), revision: (previous?.revision ?? 0) + 1, created_at: previous?.created_at ?? now, updated_at: now };
  h.records.put('assignments', id, record); changed(h, 'assignments');
  h.emit({ type: 'assignment_changed', assignment_id: id, revision: record.revision }); return record;
}
for (const [name, operation] of Object.entries(operations)) operation.schema = schemas[name as keyof typeof schemas];
export const sessions: WorkflowModule = Object.freeze({ id: 'sessions', interfaceVersion: '1', schemaVersion: '1', implementationVersion: '0.2.0-rc.3', operations: Object.freeze(operations) });
export default [sessions];
