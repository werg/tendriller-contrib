/**
 * Deliberately installed reference policy, not a default core capability.
 * Text answers are private server records. Shared state contains only an
 * owner-authored summary. This example does not claim private media storage.
 * @import { WorkflowModule } from '@tendriller/core/host'
 */
export function privateResponses({ implementationVersion, summaryPath }) {
  if (typeof implementationVersion !== 'string' || !implementationVersion || !Array.isArray(summaryPath) || !summaryPath.length)
    throw new TypeError('Choose an implementation identity and a page-owned summary path');
  const id = 'private-responses', scope = `${id}:round`, path = [...summaryPath];
  const required = () => [scope];
  const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
  const text = maxLength => ({ type: 'string', minLength: 1, maxLength });
  const revision = { type: 'integer', minimum: 0 };
  const active = h => h.records.get('round', 'active') ?? h.fail(409, 'round_closed', 'Open a fresh round before continuing');
  const expectRevision = (h, actual, expected) => {
    if (actual !== expected) h.fail(409, 'revision_conflict', 'Read the current record before making this change');
  };
  const bump = (h, round) => h.records.put('round', 'active', { ...round, revision: round.revision + 1 });
  /** @type {WorkflowModule} */
  const module = {
    id, interfaceVersion: '1', schemaVersion: '1', implementationVersion,
    operations: {
      open: {
        access: 'controller', mutate: true, schema: object({ label: text(200) }),
        run(h, data) {
          if (h.records.get('round', 'active')) h.fail(409, 'round_open', 'Archive the active round before opening another');
          const binding = h.scopes.get(scope) ?? h.scopes.register(scope, {
            paths: [path], operations: ['assign', 'submit', 'publish', 'archive'].map(name => `workflow:${id}:${name}`),
          });
          const round = { id: h.id(), label: data.label, revision: 0, opened_at: h.now() };
          h.records.put('round', 'active', round);
          return { round, scope: binding };
        },
      },
      assign: {
        access: 'controller', mutate: true, scopes: required,
        schema: object({ participant: text(200), prompt: text(4000), expected_revision: revision }),
        run(h, data) {
          const round = active(h); expectRevision(h, round.revision, data.expected_revision);
          if (!h.participants().some(person => person.id === data.participant)) h.fail(404, 'participant_unavailable', 'Choose an authorized participant');
          const assignment = { id: h.id(), round: round.id, participant: data.participant, prompt: data.prompt };
          h.records.put('assignments', assignment.id, assignment); bump(h, round);
          h.notify('assignments', 'participants');
          return { assignment, revision: round.revision + 1 };
        },
      },
      mine: {
        access: 'participant', mutate: false,
        run(h) {
          const assignments = h.records.list('assignments').map(row => row.value).filter(item => item.participant === h.identity.accountId);
          return { assignments: assignments.map(({ participant, ...item }) => ({ ...item, response: h.records.get('answers', item.id) })) };
        },
      },
      submit: {
        access: 'participant', mutate: true, scopes: required,
        schema: object({ assignment: text(200), answer: text(16000), expected_revision: revision }),
        run(h, data) {
          const round = active(h), assignment = h.records.get('assignments', data.assignment);
          if (!assignment || assignment.participant !== h.identity.accountId || assignment.round !== round.id)
            h.fail(404, 'assignment_unavailable', 'No assignment is available to this identity');
          const previous = h.records.get('answers', assignment.id);
          expectRevision(h, previous?.revision ?? 0, data.expected_revision);
          const response = { assignment: assignment.id, answer: data.answer, revision: (previous?.revision ?? 0) + 1, submitted_at: h.now() };
          h.records.put('answers', assignment.id, response); bump(h, round);
          // Notification contains no answer, prompt, identity, or private record ID.
          h.notify('responses');
          return response;
        },
      },
      review: {
        access: 'controller', mutate: false,
        run(h) { return { round: active(h), assignments: h.records.list('assignments').map(row => row.value), answers: h.records.list('answers').map(row => row.value) }; },
      },
      publish: {
        access: 'owner', mutate: true, scopes: required,
        schema: object({ summary: text(16000), expected_revision: revision }),
        run(h, data) {
          const round = active(h); expectRevision(h, round.revision, data.expected_revision);
          const summary = { text: data.summary, reviewed_at: h.now(), source_revision: round.revision };
          h.state.apply([{ op: 'set', path, value: summary }]); bump(h, round);
          return { summary, revision: round.revision + 1 };
        },
      },
      archive: {
        access: 'owner', mutate: true, scopes: required, schema: object({ expected_revision: revision }),
        run(h, data) {
          const round = active(h); expectRevision(h, round.revision, data.expected_revision);
          const archive = { id: h.id(), round, assignments: h.records.list('assignments').map(row => row.value), answers: h.records.list('answers').map(row => row.value), archived_at: h.now() };
          // All changes, including quota checks, share the host transaction.
          h.records.clear('assignments'); h.records.clear('answers'); h.records.delete('round', 'active');
          h.records.put('archives', archive.id, archive);
          h.state.apply([{ op: 'delete', path }]);
          const binding = h.scopes.rotate(scope);
          h.notify('round-closed', 'participants');
          return { id: archive.id, scope: binding };
        },
      },
      readArchive: {
        access: 'controller', mutate: false, schema: object({ id: text(200) }),
        run(h, data) { return h.records.get('archives', data.id) ?? h.fail(404, 'archive_unavailable', 'No such archive'); },
      },
    },
  };
  return module;
}
