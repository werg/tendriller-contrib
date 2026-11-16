/**
 * Exact-version owner approval, deliberately installed through the trusted host.
 * The approved payload is immutable. Execution must begin before expires_at;
 * finishing an already claimed execution may happen later. External effects
 * must use execution_key at a service that implements its own deduplication.
 * @import { WorkflowModule } from '@tendriller/core/host'
 */
export function proposalReview({ implementationVersion }) {
  if (typeof implementationVersion !== 'string' || !implementationVersion) throw new TypeError('Choose the installed implementation identity');
  const id = 'proposal-review', scope = `${id}:proposals`;
  const required = () => [scope];
  const string = maxLength => ({ type: 'string', minLength: 1, maxLength });
  const version = { type: 'integer', minimum: 1 };
  const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
  const read = (h, data) => h.records.get('proposals', data.id) ?? h.fail(404, 'proposal_unavailable', 'No such proposal');
  const checked = (h, data) => {
    const item = read(h, data);
    if (item.version !== data.version) h.fail(409, 'version_conflict', 'Review the exact current version before proceeding');
    return item;
  };
  const expiry = (h, value) => {
    if (!Number.isSafeInteger(value) || value <= h.now() || value > h.now() + 30 * 86400_000)
      h.fail(400, 'invalid_expiry', 'Choose a future expiry within thirty days');
    return value;
  };
  const store = (h, item) => { h.records.put('proposals', item.id, item); h.notify('proposals'); return item; };
  const proposal = { title: string(200), payload: {}, expires_at: { type: 'integer', minimum: 0 } };
  /** @type {WorkflowModule} */
  const module = {
    id, interfaceVersion: '1', schemaVersion: '1', implementationVersion,
    operations: {
      initialize: {
        access: 'controller', mutate: true,
        run(h) { return h.scopes.get(scope) ?? h.scopes.register(scope, { paths: [], operations: ['propose', 'revise', 'respond', 'claimExecution', 'finish'].map(name => `workflow:${id}:${name}`) }); },
      },
      propose: {
        access: 'controller', mutate: true, scopes: required, schema: object(proposal),
        run(h, data) {
          return store(h, { id: h.id(), version: 1, title: data.title, payload: structuredClone(data.payload), expires_at: expiry(h, data.expires_at),
            status: 'pending', created_at: h.now(), created_by: h.identity.actor });
        },
      },
      revise: {
        access: 'controller', mutate: true, scopes: required,
        schema: object({ id: string(200), version, ...proposal }),
        run(h, data) {
          const item = checked(h, data);
          if (item.status !== 'pending') h.fail(409, 'immutable_proposal', 'A decided proposal cannot be edited; propose a new action');
          return store(h, { ...item, version: item.version + 1, title: data.title, payload: structuredClone(data.payload), expires_at: expiry(h, data.expires_at) });
        },
      },
      read: { access: 'controller', mutate: false, schema: object({ id: string(200) }), run: read },
      respond: {
        access: 'owner', mutate: true, scopes: required,
        schema: object({ id: string(200), version, approve: { type: 'boolean' } }),
        run(h, data) {
          const item = checked(h, data);
          if (item.status !== 'pending') h.fail(409, 'already_decided', 'This proposal already has a decision');
          if (item.expires_at <= h.now()) h.fail(409, 'proposal_expired', 'This proposal expired before the response');
          return store(h, { ...item, status: data.approve ? 'approved' : 'rejected', decided_at: h.now(), decided_by: h.identity.accountId });
        },
      },
      claimExecution: {
        access: 'controller', mutate: true, scopes: required, schema: object({ id: string(200), version }),
        run(h, data) {
          const item = checked(h, data);
          // Recovery exposes the same immutable effect identity, never a new one.
          if (item.status === 'executing') return item;
          if (item.status !== 'approved') h.fail(409, 'approval_required', 'Only the exact approved proposal can execute');
          if (item.expires_at <= h.now()) h.fail(409, 'proposal_expired', 'Approval expired before execution began');
          return store(h, { ...item, status: 'executing', execution_key: `${item.id}:${item.version}`, execution_started_at: h.now() });
        },
      },
      finish: {
        access: 'controller', mutate: true, scopes: required,
        schema: object({ id: string(200), version, execution_key: string(240), succeeded: { type: 'boolean' }, outcome: {} }),
        run(h, data) {
          const item = checked(h, data);
          if (item.status !== 'executing' || item.execution_key !== data.execution_key)
            h.fail(409, 'execution_conflict', 'Complete the recorded execution with its original effect identity');
          return store(h, { ...item, status: data.succeeded ? 'completed' : 'failed', outcome: structuredClone(data.outcome), completed_at: h.now() });
        },
      },
    },
  };
  return module;
}
