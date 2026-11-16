---
id: "run-a-peer-application"
title: "Run a shared application with a resident agent"
summary: "Use one verified SQL and event history for shared tasks, conversation, and agent work while keeping drafts, transient signals, and external effects distinct."
group: "Keep work dependable"
tags: ["peers", "events", "sql", "agent", "recovery"]
choices: ["Native authority or the hosted backend", "Atomic SQL and events or an event-only history", "Final worker intent versus provisional views and transient signals"]
capabilities: []
evidence: "exercised"
related: ["choose-data-model", "reconcile-concurrent-edits", "recover-outdated-work", "resume-across-sessions", "observe-long-running-process", "manage-sensitive-data", "publish-coherent-updates"]
sources: ["https://github.com/werg/tendriller/blob/0200f3b7942d8aea7144c1764677a6e203e7716c/docs/ARCHITECTURE.md", "https://github.com/werg/tendriller/blob/0200f3b7942d8aea7144c1764677a6e203e7716c/docs/DURABILITY.md", "https://github.com/werg/chronolog-db/blob/8a918b824a3be79e7c3608412ec518208896a064/docs/portable-peers.md", "https://github.com/werg/chronolog-db/blob/8a918b824a3be79e7c3608412ec518208896a064/docs/app-ownership.md"]
---

# Run a shared application with a resident agent

Use this approach when an application already has a native agent peer running
whenever new shared work needs to become final. A browser keeps a local replica,
queries its own SQL, derives views from accepted events, and authors changes. The
resident agent retains the same history, certifies included proposals and a closed
author-time frontier under the selected finality policy, and runs service loops
while an LLM is idle, thinking, or restarting. Every replica computes the same
application order from signed author time and deterministic tie-breakers.

A hosted application backend remains a useful choice when no resident machine is
available. Select one backend for an application's writes. The page should not
send the same command to a hosted state queue and a peer proposal outbox. This is
a choice of owner, availability, and recovery contract; it is not a competition
between UI frameworks.

The [paired implementation work](notes/implementation-and-qualification.md) maps
the public boundaries and the remaining deployment qualifications. The source
pins above identify the portable foundation reviewed for this guide. A proposed
scenario is not evidence that it passed; recorded checks name their actual
artifacts and limits.

The implementation places **portable membership administration on
Cloudflare by default**, separately from native inclusion/finality, execution
and payload storage. Participant operations synchronize small signed descriptors
and inline roster/epoch records without downloading application payloads or
loading the application SQL engine. Ordinary application writes do not trigger
administrator synchronization. Full peers retrieve detached envelopes through
their peer path. The
[thin-administration evidence](notes/thin-membership-administration.md) records
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

## Make the authority boundary explicit

The finality provider decides which proposals are included and which author-time
frontier is closed. In the native profile one fixed authority key certifies those
decisions. Every replica sorts included proposals by their immutable signed
author time and deterministic tie-breakers; neither receipt position nor arrival
order chooses the winner of a SQL conflict.

The authority retains exact envelope hashes, lengths and routing metadata,
deduplication identities, and an authenticated receipt prefix. Signed closure
markers bind a closed timestamp to the preceding included prefix. A newly
included proposal at or below an already closed timestamp is rejected as late;
an exact retry of an earlier included proposal retains its original result. Full
peers fetch and verify detached application envelopes. Receipt and closure
evidence can travel through other authorized peers. A relay forwards data; it
does not acquire SQL, membership, or finality authority.

The Cloudflare membership root is a separate role. Signed genesis selects the
application schema administrator independently, so native application setup does
not require the host to become a SQL peer. The thin administrator follows small
descriptors and inline capability/epoch records. It can establish roster progress
without establishing that an application replica has fetched or executed the
corresponding payloads.

Keep these facts distinct in both the interface and operations:

| Status | What it establishes |
| --- | --- |
| Stored locally | This device durably prepared its original proposal. |
| Included | The provider committed receipt evidence; the SQL outcome may still be unresolved locally. |
| Frontier closed | Complete evidence fixes the included set through a signed author-time cutoff. |
| Applied final | The replica applied the closed canonical prefix under the pinned execution profile. |
| Replicated or backed up | An additional stated location has acknowledged the bytes. |
| Worker completed | A separately recorded effect/result reached its declared completion condition. |

A disconnected authority pauses new coordinated finality. Existing reads, proof
exchange, and durable pending proposals remain useful. Do not silently switch to
another agent, the hosted backend, or a different finality policy during an
outage. A restored old disk cannot prove continuity by consulting only its own
restored state. Recovery needs established continuity or an explicit new lineage.

Use a persistent volume and one fenced writer. An asynchronous backup can lag
behind finality; losing the only disk may lose recently acknowledged history.
If the product requires survival of that immediate loss, its acknowledgment
contract must require another durable copy. A running disposable container is
not a durable authority.

## Author one operation and retain its meaning

Allocate the operation and domain IDs before submission. The core outbox retains
the exact signed proposal before sending; retry that operation instead of
constructing another command. Reusing an operation ID for different contents is
a conflict. An accepted or rejected original outcome remains the answer after a
lost response, reload, or membership change.

For a claim, assert availability and update the row in the same program as its
event. For a dependent second action, either batch it with the first or wait for
the first action's final result and author the dependent change with a later
timestamp. Total order by itself does not discover causal dependencies submitted
through different paths. If an earlier authored edit and a later reset are both
included before closure, replay applies the edit first and the reset clears it,
even when the reset arrived first. A stale-generation assertion fails when the
edit executes after the reset; receipt order alone cannot cause that rejection.

A page can show a provisional claim while finality is pending, but it should label
that state. If another claim wins, replace the whole affected view from a coherent
revision and preserve the losing operation's rejection. Do not reverse DOM edits
or replay arbitrary UI callbacks to restore shared truth.

Business assertions belong in deterministic SQL/platform work. UI reducers are
pure caches outside consensus. Time, randomness, and external responses that
affect durable behavior must enter the history as explicit recorded inputs.

The clean pre-release API needs no legacy command conversion or old-data mirror.
If an application uses reset generations, its generation check, mutation, and
exact retry result must still live in the replica's deterministic transaction. A new
API does not justify refreshing a stale guard or splitting authoritative checks
between Cloudflare and a native peer.

The [scoped JSON reset recipe](notes/scoped-json-state.md) makes that rule concrete
with ordinary SQL: capture an exact scope/generation, assert it in the authored
write, and rotate monotonically in a separate atomic reset. Its executable
builders share the public application bundle and the core's original operation
identity; an older rejected edit is reviewed instead of silently upgraded.

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

Start with one designated worker for each effect kind. Preserve stable timer
occurrence IDs, cancellation boundaries, and notification intent. A timer firing
is recorded intent; a page being open, a model being awake, and a notification
being delivered are separate facts. Multiple dispatchers need an explicit
ownership/fencing design, which this first profile does not assume.

## Connect peers without hiding the route

Use the [WebRTC peer architecture](notes/peer-network.md): Tendriller introduces
peers with one bounded offer/answer exchange, then closes the rendezvous sockets.
Chronolog's authenticated framed connection carries application traffic directly
between peers. Bind application identity and grants independently of rendezvous
hints and transport endpoint keys. A
publish-only collector can submit its own signed, topic-scoped proposal without
receiving group history keys; allowing one topic must not authorize SQL or
platform operations in a mixed program.

The existing count-only agent wake socket is not a generic tunnel. Keep durable
replication and ephemeral signals in separate protocol domains. Apply bounded
frames, queues, expiry, and receiver-known membership to transient signals. A
disconnected receiver cannot promise immediate knowledge of revocations elsewhere.

Keep the page host out of the warm data path: peer pages have no implicit hosted
application socket, event stream or health poll. The browser owns its RTC
connection; its synchronous channel callback transfers the untouched data
channel to the exclusive replica Worker for framing and authentication. A warm
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

The [task-board/chat checks](checks/README.md) provide two page-owned layouts: a
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

The [qualification matrix](notes/implementation-and-qualification.md) names each
required failure and its evidence boundary, including actual network and cost
measurements that a deterministic test cannot establish.
