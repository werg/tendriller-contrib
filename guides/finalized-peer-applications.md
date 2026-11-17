# Use an explicitly finalized peer profile

This guide describes the explicitly selected stronger chronological finality
profiles and their existing packaged APIs. New application architecture follows
the [adopted peer-generation target](application-primitives.md), whose implementation
and qualification are in progress. Select this chronological profile explicitly
when its immutable final-prefix contract is required. Its `local()` / `final()`
methods and existing checks do not define or qualify the generation-scoped
applied/shared/abandoned contract.

Start with what must survive. A live cursor can disappear. A submitted message
must be recoverable. A resource reservation must satisfy its condition. Sending
an email must wait until its recorded intent cannot be rolled back. These are
different requirements, even when one screen uses all four.

## Choose the smallest sufficient mechanism

| Need | Use | Recovery meaning |
| --- | --- | --- |
| A value useful only on this device | Local state or a local draft | The application chooses whether it survives reload. |
| Live information that may be lost or replaced | Ephemeral signals | No history, offline queue, replay, transaction or finality. Reconnect with fresh observations. |
| A message, observation or intent that must remain available | Durable events | Retained operations, stable retry identity and replay; the live profile also supplies final outcomes. |
| A guarded transition in shared state | A durable transaction | Assertions, mutations and emitted events succeed or fail together. |
| An external effect that must follow an agreed decision | A final durable intent and an effect worker | Journal dispatch, use provider idempotency when available, and record the result. |

The [live-signals guide](../cookbooks/share-live-signals/COOKBOOK.md) covers typing,
presence, cursors, progress, live readings and streamed previews. Use FIFO
delivery for distinct transient messages and choose `mode: 'latest'` only when a
new value replaces the old value. Neither mode makes disconnected delivery
durable.

For durable peer work, [the peer application guide](../cookbooks/run-a-peer-application/COOKBOOK.md)
connects event-only and mixed SQL/event profiles to public APIs. Choose one
durable application backend for each application. A hosted backend and a peer
backend have different execution and availability contracts; the UI should not
submit the same intent to both.

## Select chronological live collaboration explicitly

Chronolog's chronological peer backend uses live collaboration: peers share one timestamp-ordered
application history, may show a provisional local view, and observe final
accepted or rejected outcomes when the selected provider closes a verified
prefix. Keep that progression visible. Inclusion, deterministic execution and
finality answer different questions; a receipt is not proof that SQL succeeded.
Live signals remain independent of that progression and can start while durable
history is catching up or finality is unavailable.

A Tendriller page selects that peer backend explicitly. Without a backend
selection, its durable application API uses hosted Cloudflare storage. Choosing
the peer history does not automatically connect hosted signals; live transport
composition remains an independent choice.

Signed operations, immutable operation identity, timestamp ordering and
deterministic replay are reusable foundations. In the shipped live profile, the
selected finality provider closes a prefix, and effect workers consume accepted
intent from that prefix. A future asynchronous branch/merge interpretation can
select and merge operations without any finality concept, API or operation
states. Its execution and effect policy would be separate; a branch tip is not
a final frontier. That interpretation is not implemented by these live recipes.

The page's immutable backend selection is explicit: omitting it selects
Tendriller's hosted Cloudflare backend, not a peer replica. Neither selection
changes the independent live-signal contract.

For the current live profile, an offline proposal can become too old to enter an
already closed prefix. Preserve that original proposal and its rejection. Retry
asks for the same original outcome; it never updates its timestamp or guards.
If the person still wants the action, review current state and author a new
operation with a new ID. Preserve the original observation time in domain data
when it matters, separately from the new operation's ordering timestamp. This
keeps signed chronological semantics and recovery meaning explicit.

## Name roles precisely

"Authority" is too broad to be an application role. Describe the decision each
participant may make instead. A single resident process can fulfill several
roles, but colocating them does not grant one role another role's rights.

| Role | Decision it owns | What that role does not establish |
| --- | --- | --- |
| Page host | Assets, page accounts and configured introductions | Database reader/writer permission or successful SQL execution |
| Membership administrator | Capability grants, revocations and group-key delivery | Application schema administration, finality or permission to perform external effects |
| Schema administrator | Allowed schema changes under the group's execution rules | Finality or tool credentials |
| Finality provider | Which proposals are included and which author-time range is closed | SQL success, replication to every peer or completion of an external action |
| Replica | Verification and deterministic execution of available history | Permission to write, certify finality or act for a user |
| Effect worker | Dispatch of explicitly configured final intents | Permission to invent intent, redefine handlers from event data or bypass provider authorization |
| Signal authorization policy | Who may send each live topic in its scope | Any durable application role |

Transport admission is another boundary. An endpoint accepting an offer or a
WebRTC connection succeeding does not grant application access. Standalone
signals can use a policy that has no Chronolog database at all. A Chronolog peer
application can instead authorize signal topics using its current membership.
Both paths still require an explicit policy. In the standard group adapter,
signal-topic rights live on a writer-kind publisher grant; `sql: false` and empty
durable `topics` restrict it to its declared signals. This does not make a signal
a durable change, and the standalone channel requires no such grant.

The practical deployment decision is who holds each key and what stops if that
process disappears. A page host can serve a signal-only application. A reader
can verify a durable history without certifying it. A resident can run effects
without holding the membership or finality key. Only combine these roles when
the deployment intends to trust the same operator with each decision.

Chronolog writer grants carry explicit `ProgramRights` in `program`:

```js
const writerProgram = { sql: false, topics: ['job-results'], signals: ['job-progress'] };
```

`sql` covers SQL and platform steps; `topics` and `signals` list exact durable
and live topics. Omitted `forwarded` means false. One writer grant must cover
the whole submitted program; the system does not combine fragments from
several grants to authorize a mixed operation. Reader and validator grants do
not carry program rights. There is no grantable administrator role: the genesis
membership root and capability feed own membership administration, while the
separately selected schema administrator owns schema changes. A writer's SQL
permission still leaves row ownership, schema checks and domain assertions in
force. It grants no private tool or provider credentials.
The pinned membership root is a trusted key issuer: it can grant reader access
and create or withhold content keys. Choose its operator with that power in mind.

Enrollment requests and approvals name `writerProgram` explicitly when they
include the writer role. An approval may narrow those requested rights, never
widen them. A signal-only sender can request
`{ sql: false, topics: [], signals: ['typing'] }`; a standard full peer also
needs its independent reader grant for the authenticated peer connection.
Standalone signals have their own explicit policy and require neither grant.

Reader revocation and encryption-epoch advancement belong to the same signed
membership revision. Key-delivery manifests supply material for that authorized
state; their arrival order cannot activate a new epoch. Missing an authorized
key blocks access without changing permissions or timestamp order. Enrollment
readiness requires both captured history keys and the current active epoch's
key. Future keys that happen to arrive early do not enlarge the captured target
or activate a new epoch.

Durable event provenance is supplied by the backend in `event.origin`. For a
Chronolog event it identifies the verified group, author, original operation,
membership revision, writer capability and signed author time. For a hosted
event it identifies the application, authenticated author, operation and role.
Keep that metadata attached when building projections or handing work to an
agent. A payload's `role`, `author` or `instruction` field is application data;
it cannot replace verified provenance or grant permission to invoke a tool.
The Chronolog author's canonical hex identity is the same `authorId` used by
its live signals. The group, membership revision and writer grant are opaque
base64url identities; signed author time is a decimal string. A null writer
grant denotes an explicitly configured static membership resolver, not an
implicit privilege. Keep the authenticated origin intact across checkpoints.

Chronolog's durable worker also retains the origin in its dispatch checkpoint,
so recovery cannot lose the authenticated requester while preserving only their
text. The origin describes historical publication rights; application policy
still decides current instruction authority and holds actual tool credentials.

Select a finality provider for the durable history independently of the page host
and effect worker. The fixed native provider is an implementation of that role,
not a requirement that every signal, page or agent action pass through one
machine. Its unavailability pauses new coordinated final outcomes; established
signal connections and existing local reads have their own lifetimes.

## Separate inclusion, execution and finality in live mode

In Chronolog, replicas order included proposals by signed author time, author
identity and stable proposal identity. The finality provider certifies inclusion
and closes an author-time range. It does not choose SQL winners by network
arrival order. A replica still needs complete bodies and the pinned execution
profile to determine the accepted or rejected application outcome.

For application code, progress and outcome answer separate questions:

| `status` | `outcome` | What the application can say |
| --- | --- | --- |
| `queued` | Absent | The original proposal is prepared locally and awaits progress. |
| `provisional` | `accepted` or `rejected` | The current result may change as eligible history arrives. |
| `final` | `accepted` | The agreed prefix was executed and this operation succeeded. |
| `final` | `rejected` | The original operation has a stable rejection; recovery is a newly reviewed action. |

Submission returns the operation's current state. Subscribe to
`application.operations` when the workflow needs its final outcome. Native
Chronolog handles expose `local()` for the current executed result and `final()`
for the immutable result. Both return accepted or rejected outcomes. Inspect
`result.outcome.type`; waiting successfully does not mean the operation succeeded.
Dependent work requires an accepted result from `final()`; handle its final
rejection explicitly and preserve the reviewed draft.
A provisional success never releases dependent work or an irreversible effect.
The public operation type reflects this directly: queued has no outcome, while
provisional and final require one. An exact retry can immediately return its
original final receipt; it does not restart the lifecycle.

An inclusion receipt alone cannot establish either final application outcome.
A final accepted operation also does not establish that another peer has a
backup, that a person read the result, or that an external provider acted.

Author dependent work after observing the prerequisite's final accepted result,
and retain the appropriate guards inside the new transaction. Chronolog advances
its author clock past successfully applied history and verified closed time;
merely receiving an unadmitted envelope does not advance that clock. Applications never
calculate timestamps to order dependent work. An operation ID identifies one
immutable request. Retry preserves its signed bytes and meaning; updating a
guard or payload creates new intent and needs a new operation ID. The clock does
not invent dependencies on work the replica has not observed.

The signed group's future-skew limit still applies. If new authoring reports
`AUTHOR_CLOCK_AHEAD`, retain the draft and resolve the clock difference before
preparing a new operation. Do not edit signed timestamps or refresh an existing
operation's identity to hide that condition.

## Observe state or consume work

Chronolog's `query`, `queryCompiled`, `liveQuery`, React query hooks, `readView`,
`changes` and durable event reads default to the final applied prefix. A final
read returns the current applied state; it does not wait for pending writes.
Choose `view: 'local'` explicitly for previews that can change after replay.

Use `application.changes({ view: 'final', signal })` to keep a confirmed view
current, or select `view: 'local'` for provisional feedback. The stream yields
the current `{ view, revision, finalRevision }` immediately and then coalesces
invalidations. Each notification means to capture a fresh `readView`, read its
SQL and events, and release it. SQL-only changes, rollback/re-execution and
finality changes can invalidate a view even when no matching event was added.

```js
for await (const change of application.changes({ view: 'final', signal })) {
  const view = await application.readView({ view: change.view });
  try { render(await readProjection(view)); }
  finally { await view.release(); }
}
```

This is a display subscription: it has no durable cursor and may skip
intermediate revisions. A worker that must handle each final event uses
`application.events.subscribe`, and commits its handled cursor with its
projection or effect journal. Do not use event history as an ad hoc UI wake
protocol, or treat a view notification as a work acknowledgement.

## Keep replay, retry and user Undo distinct

Use a coherent `final` view for confirmed work. A `local` view may include
provisional work when immediate feedback is useful. When eligible earlier
history arrives, Chronolog may roll back and re-execute its provisional suffix.
The UI replaces its affected projection from one captured revision; it keeps
drafts, focus and original operation references separately.

A deterministic projection may run many times. It reads recorded inputs and
returns state. It never sends email, speaks, charges a card or invokes a tool.
The effect worker consumes final intents, journals a stable effect identity, and
publishes a result. If a provider acted before a crash, use its idempotency key or
query its original result. Without either, retain an uncertain outcome for
reconciliation.

A timer preserves the original configuration event's authenticated
`configurationOrigin` alongside `configurationEventId`, including after a
scheduler restart or an uncertain publication. Its publisher checks whether
that requester and the current schedule generation authorize the derived
action, and retains the relevant guards in the atomic publication. The fired
event's own `origin` identifies the scheduler. Its payload's
`configurationOrigin` is scheduler-attested lineage: downstream consumers trust
an explicitly authorized scheduler or verify the referenced retained event.
Copying an origin-shaped object into JSON does not authenticate a requester.

Disposable live work can stay live: a signal may update a cursor, request a
preview, stop a local playback or produce an expiring progress indication under
its explicit topic policy. No durable intent is required merely because an
agent participates. Choose a final intent when losing, repeating or reversing
the requested action would lose required work or create an irreversible effect.

Application Undo is different from replica rollback. Undo of final work is a
new guarded reversal or compensation; it does not erase the agreed history or
recall an external action. See [undo and revision](../cookbooks/undo-and-revise-work/COOKBOOK.md).

## Give an implementing agent a short contract

Before changing the page, write down:

1. Which values are local, live, durable, transactional and external.
2. Which durable backend and execution profile own application writes.
3. Which explicit writer programs may publish topics or SQL, and who may change
   schema, administer membership, certify finality and dispatch each effect.
4. Which view is provisional, which progress is final, and what resets on loss of
   a live connection.
5. Which failure would lose meaning: a lost signal, a failed assertion, a delayed
   retry, a rebase, a revoked capability or a crash after external dispatch.
6. Which authenticated origin authorizes each private tool action, including
   requester lineage for scheduled work; a final intent alone grants no access.

Then implement the smallest path that meets those guarantees. Use the public
signal channel, operation store, view changes, read views and effect service. Do not create a
second proposal outbox, manually refresh guards on retries, infer completion
from a live preview, or promote a UI checkpoint into a worker's handled cursor.

This guide describes design choices. The individual cookbooks and source-pinned
qualification reports state which implementations and failure scenarios were
actually exercised.
