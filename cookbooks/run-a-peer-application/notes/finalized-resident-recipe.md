
# Run an explicitly finalized resident application

Use this approach when an application has a native agent peer that must keep
working while an LLM is idle, thinking, or restarting. A browser keeps a local
replica, queries its own SQL, derives views from accepted events, and authors
changes. A separately selected finality service certifies included proposals and
a closed author-time frontier. It may run in the resident process or elsewhere;
running an agent does not itself grant finality or membership rights. Every
replica computes the same application order from signed author time and
deterministic tie-breakers.

This is the explicitly selected **chronological live collaboration** profile. Signed operations,
timestamp ordering and deterministic replay are common foundations; finality is
the live policy's additional contract. An asynchronous branch/merge policy would
select and merge operations without finality APIs or final/provisional states.
This recipe does not implement that alternative or require it to use finality.

This recipe and its pinned evidence use the stronger finalized contract. The
[new peer-generation recipe](../COOKBOOK.md) has replaceable coordinators and
explicit tail abandonment; applied events do not inherit the guarantees below.

Start with the [finalized primitive and role guide](../../../guides/finalized-peer-applications.md).
Durable events and transactions use this history. Live typing, presence, cursor
motion and progress use the independent [signal channel](../../share-live-signals/COOKBOOK.md)
and need neither SQL nor a finality service.

A hosted application backend remains a useful choice when no resident machine is
available. Select one backend for an application's writes. The page should not
send the same command to a hosted state queue and a peer proposal outbox. This is
a choice of owner, availability, and recovery contract; it is not a competition
between UI frameworks.

The [paired implementation work](implementation-and-qualification.md) maps
the public boundaries and the remaining deployment qualifications. The linked qualification reports
identify the portable foundation and artifacts exercised for this guide. A
proposed scenario is not evidence that it passed; recorded checks name their
actual artifacts and limits.

The implementation places **portable membership administration on
Cloudflare by default**, separately from native inclusion/finality, execution
and payload storage. Participant operations synchronize small signed descriptors
and inline roster/epoch records without downloading application payloads or
loading the application SQL engine. Ordinary application writes do not trigger
administrator synchronization. Full peers retrieve detached envelopes through
their peer path. The
[thin-administration evidence](thin-membership-administration.md) records
passing live enrollment, revocation, restart and byte-accounting checks against
the packaged Cloudflare Worker, a separate native authority and an actual browser.
The two task-board layouts also pass their separate public-runtime regression.
Their fixture pregrants its two identities; it does not replace the fresh-device
enrollment gate. Deployed networking, login, storage recovery and cost remain
explicit qualification issues.

## Follow a concrete task to completion

Imagine two colleagues managing an inspection board with an agent. Each browser
shows the task table and a conversation. One person claims a task, asks the agent
to summarize its evidence, and receives a final result. The second browser can
reconstruct the same final task and conversation history after reconnecting.

1. **Join.** Open the published page, establish the device's application identity,
   and request the necessary reader/writer grant. Page login and a successful
   peer connection do not by themselves approve database access. Show pending
   enrollment and incomplete historical access explicitly.
2. **Read.** Capture one revision-scoped view for the task query and effective
   events. Display it only when both are ready. A previous coherent view can stay
   visible during catch-up, labeled with its status.
3. **Claim.** Submit a single signed change containing a SQL assertion, the task
   update, and `task.claimed`. The assertion establishes that the task was still
   available. A payload named `task.claimed` alone establishes no business fact.
4. **Discuss.** Submit a durable message with a stable message ID. Keep later
   typing separate from the submitted snapshot. Typing indicators use expiring
   peer signals; the final message uses the durable history.
5. **Request work.** Publish a durable `job.requested` event. The resident worker
   acts only after that intent is final, journals dispatch state, and publishes
   a durable result. The browser reducer only renders recorded inputs.
6. **Return.** Restore local drafts and the original pending operations. Catch up
   from durable storage, recheck current access, and show accepted, rejected,
   pending, and uncertain external outcomes separately.

An event-only conversation can use the same history and reader contract without
loading a SQL engine. The task-board variant uses a mixed SQL/event execution
profile. A client that cannot execute that profile must not label an inclusion
certificate as proof that the SQL succeeded.

## Put each kind of traffic in its intended place

| Information | Mechanism | Application decision |
| --- | --- | --- |
| Task rows, schema, conditional claims | SQL steps in a durable change | Which assertions and row ownership rules define a valid transition? |
| Messages, job requests, final results | Durable events | Which stable domain ID links a correction or reply to its original? |
| SQL transition plus its event | One mixed change | Must both become visible at the same applied revision? |
| Typing, replaceable progress, presence | Bounded expiring peer signals | How quickly does a stale indication disappear? |
| Draft text, focus, scroll, expanded panels | Local interaction state | Which parts should survive reload, and for which identity? |
| Photos, captures, large documents | Immutable bytes with durable metadata | Which storage receipt and retention reference make bytes available? |
| Credentials and private agent reasoning | Agent-private storage or a separate authorized group | Who is actually allowed to decrypt the underlying records? |

Topics are filters over one group history. They do not create separate finality
rules or private sublogs. A reader holding group keys can inspect the history
regardless of the current UI filter. Separate groups have separate transaction
boundaries; a private-to-shared publication is an explicit workflow.

Keep complete source history for this initial profile. Bound individual programs,
event payloads, reader batches, and storage quota. A full disk needs a visible
refusal and recovery action. Evicting old messages from a small display is a local
view decision and never permission to prune the canonical history.

## Assign membership, execution and finality separately

The finality provider decides which proposals are included and which author-time
frontier is closed. In the native profile one fixed authority key certifies those
decisions. Every replica sorts included proposals by their immutable signed
author time and deterministic tie-breakers; neither receipt position nor arrival
order chooses the winner of a SQL conflict.

The finality service retains exact envelope hashes, lengths and routing metadata,
deduplication identities, and an authenticated receipt prefix. Signed closure
markers bind a closed timestamp to the preceding included prefix. A newly
included proposal at or below an already closed timestamp is rejected as late;
an exact retry of an earlier included proposal retains its original result. Full
peers fetch and verify detached application envelopes. Receipt and closure
evidence can travel through other authorized peers. A relay forwards data; it
does not acquire SQL, membership, or finality authority.

The Cloudflare membership root is a separate role. Signed genesis selects the
application schema administrator independently, so native application setup does
not require the host to become a SQL peer. The thin administrator follows finalized
governance controls and their signed cumulative checkpoint and certificate, without
application descriptors or bodies. It can establish roster progress
without establishing that an application replica has fetched or executed the
corresponding payloads.

Every writer grant includes explicit `program` rights. A page that authors the
task board might receive
`{ sql: true, topics: ['conversation', 'tasks', 'job-requests'], signals: ['typing'] }`.
A resident that only publishes results can receive
`{ sql: false, topics: ['job-results'], signals: ['job-progress'] }` plus a reader
grant for shared history. A full mixed program must fit one grant. Enrollment
requests and approvals use the same `ProgramRights` shape as `writerProgram`;
approval may narrow the request. There is no implicit SQL permission and no
administrator capability to add to these grants. Membership authority comes
from the pinned root; schema administration and row ownership remain separate.

Reader revocation and the corresponding encryption-epoch change form one signed
membership revision. Key delivery makes that authorized epoch usable; it does
not define a second activation timeline. A missing key is a readiness blocker.
It cannot make a revoked reader current or alter the signed ordering timestamp.

Keep these facts distinct in both the interface and operations:

| Status | What it establishes |
| --- | --- |
| Stored locally | This device durably prepared its original proposal. |
| Included | The provider committed receipt evidence; the SQL outcome may still be unresolved locally. |
| Frontier closed | Complete evidence fixes the included set through a signed author-time cutoff. |
| Applied final | The replica applied the closed canonical prefix under the pinned execution profile. |
| Replicated or backed up | An additional stated location has acknowledged the bytes. |
| Worker completed | A separately recorded effect/result reached its declared completion condition. |

A disconnected finality service pauses new coordinated finality. Existing reads,
proof exchange, durable pending proposals and established live signal paths
remain useful under their own availability contracts. Do not silently switch to
another agent, the hosted backend, or a different finality policy during an
outage. A restored old disk cannot prove continuity by consulting only its own
restored state. Recovery needs established continuity or an explicit new lineage.

Use a persistent volume and one fenced writer. An asynchronous backup can lag
behind finality; losing the only disk may lose recently acknowledged history.
If the product requires survival of that immediate loss, its acknowledgment
contract must require another durable copy. A running disposable container is
not a durable finality service.

The agent's `context.finality` identifies its configured local
`NativeFinalityService`, or `null` when the resident does not perform that role.
Ordinary effect workers and replicas do not need to own it. The service is opened
from the verified enrollment descriptor; its timing and trusted key come from
signed genesis, rather than repeated process-local policy settings.

## Author one operation and retain its meaning

Allocate the operation and domain IDs before submission. The core outbox retains
the exact signed proposal before sending; retry that operation instead of
constructing another command. Reusing an operation ID for different contents is
a conflict. A final accepted or rejected original outcome remains the answer after a
lost response, reload, or membership change.

For a claim, assert availability and update the row in the same program as its
event. For a dependent second action, either batch it with the first or observe
the first action's final accepted result before authoring the dependent change.
Chronolog advances the author's clock past successfully applied history and
verified closed time, including after reopening; application
code does not choose protocol timestamps. Keep the dependency's business guard
inside the new program because another final change may intervene. Total order
cannot discover a prerequisite the author has not observed. If an earlier authored edit and a later reset are both
included before closure, replay applies the edit first and the reset clears it,
even when the reset arrived first. A stale-generation assertion fails when the
edit executes after the reset; receipt order alone cannot cause that rejection.

A page can show a provisional claim while finality is pending, but it should label
that state. If another claim wins, replace the whole affected view from a coherent
revision and preserve the losing operation's rejection. Do not reverse DOM edits
or replay arbitrary UI callbacks to restore shared truth. This internal
rollback/re-execution is different from a user's Undo: reversing final work
requires a new guarded change or explicit compensation.

Business assertions belong in deterministic SQL/platform work. UI reducers are
pure caches outside consensus. Time, randomness, and external responses that
affect durable behavior must enter the history as explicit recorded inputs.

The clean pre-release API needs no legacy command conversion or old-data mirror.
If an application uses reset generations, its generation check, mutation, and
exact retry result must still live in the replica's deterministic transaction. A new
API does not justify refreshing a stale guard or splitting authoritative checks
between Cloudflare and a native peer.

The [scoped JSON reset recipe](scoped-json-state.md) makes that rule concrete
with ordinary SQL: capture an exact scope/generation, assert it in the authored
write, and rotate monotonically in a separate atomic reset. Its executable
builders share the public application bundle and the core's original operation
identity; an older rejected edit is reviewed instead of silently upgraded.

The operation API separates progress (`queued`, `provisional`, `final`) from
the executed outcome (`accepted` or `rejected`). A terminal rejection is
`{ status: 'final', outcome: 'rejected' }`. Native operation handles expose
`local()` for the executed result at its current position and `final()` for its
immutable result; both return accepted or rejected outcomes. Inspect
`result.outcome.type` after awaiting `final()` before dependent work. A final
rejection returns normally; the application handles it explicitly and preserves
the reviewed draft. The browser adapter exposes the
same decision through `operations.subscribe`. Submission resolving is not by
itself permission to proceed.

Use authenticated `event.origin` when attributing a record or choosing which
agent policy may handle it. Chronolog supplies the verified group, author,
operation, membership revision and writer capability. A JSON field that claims
to be an owner instruction cannot confer that authority. The handler's allowed
topics, verified sender policy and actual tool credentials are separate checks.
The original signed timestamp and grant context stay attached through the
worker's durable checkpoint. A later retry keeps this original operation; it
does not become newly authorized future work after a revocation.

## Subscribe to views without consuming work

Chronological queries, live queries, React hooks, read views, changes and durable
event reads default to the currently applied final prefix. A final read does not
wait for pending writes; select `view: 'local'` explicitly for previews. Before
dependent work, await the prerequisite's `final()` and inspect its accepted result.

A display follows `backend.changes({ view, signal })`. It receives the current
revision immediately and later coalesced invalidations, including SQL-only
updates, provisional rebases and finality transitions. Capture and release a
fresh read view for each needed render. Keep a `local` view visibly provisional;
use a `final` view before authoring work that depends on a confirmed state.

The change stream has no work cursor. It is allowed to skip intermediate
revisions, and it does not acknowledge events. This keeps an ordinary current
state UI small without weakening the event consumer contract below.

## Read events without skipping processing

Use the durable event reader for work that must observe every effective event.
Snapshot subscriptions may coalesce intermediate revisions; that is appropriate
for current-state displays and insufficient for an effect worker.

The durable reader returns bounded whole-transaction batches and an opaque
continuation tied to the group, history, filter/version, and applied progress.
Treat the token as data. Do not turn it into an authority sequence counter or
reuse it after changing topic filters. Empty matching batches still return safe
scan progress. They can advance past resolved rejections and irrelevant records,
but never past missing inputs or unresolved execution.

Receive one batch, process it, then durably save the projection and its processed
cursor together. If that commit fails, retain the previous pair and replay the
batch. Received progress is not handled progress. The same continuation connects
catch-up to live delivery; a wake hint merely says to read again.

A projection checkpoint also binds the reducer version. A new frontend reducer
can invalidate and rebuild its cache without changing the shared SQL outcomes.
Publish the combined UI only after its required SQL and event views have reached
the captured revision. Finality or operation status changes must notify the UI
even when its SQL rows have not changed.

## Keep external work out of replay

The resident worker consumes final intent. For each event and handler/version,
derive one stable effect identity, durably record dispatch state, use that identity
as a provider idempotency key where supported, and record the result as another
durable event. Then advance processed progress. No projection reducer sends email,
speaks, invokes tools, or schedules external notifications.

If the provider acted and the worker crashed before saving the result, recovery
may need a retry using that same provider key or an explicit provider lookup.
Without either facility, keep the outcome uncertain and expose a reconciliation
action. The log cannot make an external service transactional after the fact.

The runnable summary worker only reads shared final task data and formats a
bounded result; it has no private provider or tool. A handler with email,
filesystem, account or model-provider access must apply its own explicit
requester and resource policy to authenticated `event.origin` before using
those credentials. Publishing an allowed request topic and reaching finality
do not grant those private powers. Handler selection remains deployment code.

Start with one designated worker for each effect kind. Preserve stable timer
occurrence IDs, cancellation boundaries, and notification intent. A timer firing
is recorded intent; a page being open, a model being awake, and a notification
being delivered are separate facts. Multiple dispatchers need an explicit
ownership/fencing design, which this first profile does not assume.

For scheduled work, retain both `configurationEventId` and authenticated
`configurationOrigin` through schedule and pending-occurrence checkpoints.
The timer publisher authorizes the original requester and current generation
before publishing the derived action. The resulting event's `origin` remains
the scheduler's identity; payload lineage does not replace it. A downstream
worker trusts that lineage only from an authorized scheduler or after verifying
the referenced retained configuration event. Generation and due-time guards
protect the timer transition; they do not grant private tool access.

## Connect peers without hiding the route

Use the [WebRTC peer architecture](peer-network.md). The initial page
configuration declares the resident's reachable HTTPS introduction endpoint.
[`connectResidentWorker`](../snippets/connect-resident-worker.mjs) sends one bounded
offer and receives one answer from the independently running
[native resident task](../snippets/serve-resident-webrtc.mjs), then closes signaling.
Chronolog's authenticated framed connection carries application traffic between
peers. Optional Tendriller rendezvous requires both endpoints to join the same
attempt; it is a separate coordinated introduction path. Bind application
identity and grants independently of endpoint admission and routing hints. A
publish-only collector can submit its own signed, topic-scoped proposal without
receiving group history keys; allowing one topic must not authorize SQL or
platform operations in a mixed program.

The existing count-only agent wake socket is not a generic tunnel. Keep durable
replication and ephemeral signals in separate protocol domains. Apply bounded
frames, queues, expiry and explicit authorization to transient signals. The
Chronolog integration uses receiver-known membership; standalone channels may
use a different policy without loading history. A disconnected receiver cannot
promise immediate knowledge of revocations elsewhere. Signal subscriptions use
FIFO delivery by default; select `latest` for replaceable values such as typing.

Keep the page host out of the warm data path: peer pages have no implicit hosted
application socket, event stream or health poll. The browser owns its RTC
connection; its synchronous channel callback transfers both untouched reliable/live data
channels to the exclusive replica Worker for framing and authentication. A warm
session continues while introduction services are unavailable.
Cold page loads, new introductions and participant administration retain their
declared service dependencies.

Qualify the selected ICE route on the actual browser/native pair. A TURN
candidate uses a relay and must be accounted for as such. Configure any fallback
explicitly; a failed direct connection must not silently put application traffic
back through Cloudflare or switch the application's durable write owner.

Measure direct and relayed **bytes**, reconnect/catch-up time, memory, and failure
behavior across the real networks. Keep Cloudflare application write avoidance
separate from avoiding cloud-carried traffic. Cold bootstrap can depend on hosting
even when an established direct session continues without it.

## Adapt the executable specimen

The [task-board/chat checks](../checks/README.md) provide two page-owned layouts: a
desktop board with conversation alongside it, and a compact single-task/list
view. They share domain semantics and public APIs while preserving each layout's
own focus and draft state. They are verification specimens, not a component
package or an installed application schema.

Use the task board when conditional shared state earns the SQL engine. Use the
event-only variation for a conversation or bounded collection of recorded facts.
Leave large blob bytes on the existing immutable storage path initially. A
committed reference is not proof that another durable peer has received the bytes.

The public [Chronolog file/capture metadata recipe](https://github.com/werg/chronolog-db/blob/feat/portable-peer-core/examples/blob-metadata.ts)
demonstrates that boundary with ordinary SQL and emits. Stage immutable bytes
through the existing host uploader and retain its exact receipt, location and
retention decision. Commit the file path/version/reference under one stable
operation ID with an expected-revision SQL guard. A stale competing edit leaves
no partial metadata or effective file event; retry keeps the original staged
receipt and signed proposal.

Choose whether the application requires an actual pin receipt or accepts the
host's stated expiry. The reference records observed upload completion and says
additional durable copies are unknown. It cannot promise current availability,
redundancy or backup. An upload whose metadata loses a race remains under the
explicit host/orphan policy. Reviewed captures use the same mechanism; private
bytes stay in an authorized store or separate group. This is an application
schema and staged upload workflow, not another core proposal outbox.

The [qualification matrix](implementation-and-qualification.md) names each
required failure and its evidence boundary, including actual network and cost
measurements that a deterministic test cannot establish.
