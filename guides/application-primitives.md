# Choose application primitives by their guarantees

Chronolog is an authenticated **operation-set CRDT**. Authorized devices author
immutable signed transactions independently, retain them durably, exchange facts,
and derive application state locally. There is no operation-ordering server.

Every replica uses exactly one canonical application comparator:

`(signed author timestamp, signing public key, stable proposal ID)`.

Network arrival, receipt position, host clocks and transport counters are not
application-order inputs. Given the same eligible proposals and execution profile,
replicas derive the same state. SQL convergence is chronological replay of the
operation set, not a merge of independently modified SQL database files.

## Local work does not require an agent

An initialized browser can save and materialize ordinary work without an agent,
native process, peer connection or finalizer. An unavailable agent affects only
features that actually invoke it. Retained local identity, permissions, keys and
state reopen before remote discovery or authority refresh.

A new browser still needs initial enrollment and the real encryption keys. State
that was never received is not available offline. Explain missing provisioning,
missing content and incomplete synchronization honestly rather than inventing an
empty replacement application or instructing the person to start a mandatory
agent server.

Use the target service's current [build guide](https://tendriller.dev/docs/BUILD_AN_APP.md)
and [capability map](https://tendriller.dev/docs/CAPABILITIES.md). On staging or another
service origin, use that same origin for discovery, readiness, enrollment and its
guides. Do not install a moving registry version in place of the service's verified
immutable composition.

## Choose the smallest sufficient mechanism

| Need | Mechanism | Actual guarantee |
| --- | --- | --- |
| An unsent draft, focus or selected tab | Per-view local state | Separate from replicated domain state; persistence is explicit. |
| Presence, typing, readings or disposable progress | Session signals | Live delivery only; no durable journal or finality. |
| Shared observations or conversation | Authored event transactions | Local durable identity and deterministic derived events; outcomes can be provisional. |
| Relational state and business guards | Ordinary SQLite transaction programs | DDL, DML, ownership operations and effective emits are atomic at their authored-time position. |
| Independent offline editing | Operation-set replication | Each device authors locally; reconnect merges facts and replays affected suffixes. |
| Retention on another device | Authenticated retention evidence | A named peer retained the specified operation; this is not finality. |
| Closed history against late first inclusion | Explicit optional finality policy | Verified admission and author-time closure, with declared authority and clock assumptions. |
| An irreversible external effect | Verified final prerequisites plus an idempotent effect protocol | Neither local materialization nor peer retention alone authorizes the effect. |

An events-only application needs no SQL engine. A SQL application explicitly
selects a qualified deterministic engine; do not infer or freeze its schema from
a setup-time program. Native and browser/WASM adapters must implement the same
pinned SQL/platform semantics.

## Ordinary schema and permission transactions

Application schema is database state. Authorized `CREATE`, `ALTER`, `DROP`,
index, view, trigger and supported virtual-table changes use the same signed
transaction flow as data changes. They do not require code publication, a special
schema transition or an online native participant.

DDL authority is explicit. Namespace creation rights differ from rights over an
existing object; ownership of a row or permission to update it does not authorize
dropping another party's table. Grants, revocations and collective membership
changes are normal authorized platform operations. Schema, permission state,
mutations and effective emits roll back together when a program fails.

The deterministic engine manifest pins SQL semantics, trusted platform code and
limits—not the application's tables or columns. Chronolog's protected internal
catalogs and unsafe SQL restrictions remain in force. Ordinary application SQL
cannot attach host files, load extensions or edit security metadata directly.

Do not dependency-sort schema changes ahead of author time. A late earlier schema
transaction can change a later transaction's outcome; an actually later schema
transaction cannot retroactively move before it. Query/schema introspection and
frontends must observe the resulting materialized revision.

## Keep connectivity, worker availability and host wake distinct

A native owner can retain a healthy protocol session while its assistant worker
is stopped. A worker's ephemeral presence names its consumer/run and handled
topics and ends with that worker; a shared signer or connected peer does not
identify which worker is available. Durable receipts and answers establish
handling separately. A one-shot event waiter or successful forwarder dispatch
does not resume a model conversation.

For unattended multi-page requests, configure and test one receiver against the
intended existing host conversation. Preserve each page/history/request identity,
one writer per durable consumer checkpoint, and exact retry identities. A host
queue can acknowledge a notice before a turn begins, so its delivery cursor is
separate from handled progress. Follow
[resuming agents](../cookbooks/connect-resuming-agent/COOKBOOK.md) and the selected
service's conversation-delivery guide, when it advertises one, for supported
mechanisms and two-probe qualification. A concrete adapter such as Codex thread
steering explains one delivery route; it does not imply wake of an arbitrary
existing ChatGPT conversation. When host admission is missing or blocked, retain
the requests and show the required next action.

## Four independent observations

These are facts, not a required ladder:

| Observation | Meaning |
| --- | --- |
| Stored locally | The exact signed proposal, timestamp and identity are durable on this device. |
| Materialized locally | This replica has a coherent current result at a projection revision. Success/rejection can change after earlier facts arrive. |
| Retained by peers | Authenticated availability evidence identifies independent holders. Two tabs sharing one device store are not two copies. |
| Finalized | The configured policy proves admission/closed time and the relevant final materialization has its bodies, keys and replay complete. |

Submission acknowledges local durable storage without waiting for a remote peer
or SQL warm-up. Inspect current operation facts or subscribe to changes. An
aborted waiter says nothing about the operation's existence; retry the exact
original proposal instead of generating another ID or timestamp.

A different body under the same author/operation handle is a conflict. Encryption
wrappers and forwarding peers do not become new authors or new logical proposals.
Do not maintain a second command outbox in a UI, cookbook or hosted adapter.

## Optional finality is not an operation sorter

Ordinary offline-first applications default to no finality. Valid eligible
operations can merge arbitrarily late, so local outcomes remain revisable.

An application can explicitly select a supported signed-frontier or validator
policy. Its authenticated configuration names authorities, parameters and clock
assumptions. An eligible browser can act as a finality authority; a native or host
provider is a deployment choice, not a privileged operation sequencer.

A provider can prove inclusion and close an author-time range. It cannot choose
which transaction executes next, rewrite a timestamp or provide a comparator.
Missing finality pauses finality only: local authoring and provisional reads keep
working. A browser being closed or suspended can pause its provider; do not
promise background execution that the platform cannot provide.

Sealing has a real consequence: an unseen operation first delivered behind the
closed frontier can be excluded even if it was genuinely authored offline. Keep
that intent inspectable, show the reason and require an explicit new authored
intent if the person chooses to resubmit. Never silently retimestamp it.

Retention, inclusion certification and final materialized state are different.
Missing bodies, keys, predecessor evidence or execution support must not be
turned into fabricated final results. Do not claim threshold safety or automatic
provider replacement beyond the implemented and qualified policy.

## Derive frontends reactively

Prefer FRP/state-derived rendering without mandating a particular framework:

`render = current materialized snapshot + local view/draft state`.

Use `createLiveView` and `createViewStore`, or a framework's equivalent subscription
and derived-state facilities. Subscribe before the first read. Treat notifications
as invalidation and re-query the snapshot; do not accumulate network arrivals into
another mutable UI database or increment a counter as truth.

Late earlier operations can move, update or remove rows, revise guard results and
change schema. Recompute lists, counts, details, inspector outcomes and available
fields from the new revision. Key DOM/components by stable entity identity rather
than array index. Preserve local unsent text, selection, focus, scroll and deep
links. A stale async read must not overwrite a newer snapshot or draft.

Captured reads bind schema, data, events and outcomes to one immutable local
revision. New reads use the replacement revision. Missing-table/column errors are
explicit view errors; retained old data must not masquerade as current, and an
outdated view must not disable unrelated local authoring.

Show network health separately from storage/materialization and optional finality.
Keep locally available content visible offline. Enable ordinary Save from signing
and storage prerequisites, not from a connection flag, remote refresh or finalizer.

## Claims, tools and external effects

Conditional claims and reservations use ordinary transactional guards. During a
partition, two devices can each see a provisional success; after merge, authored-
time replay determines the same current outcome everywhere. Do not promise global
exclusivity from an offline local result.

Use the optional [participant coordination cookbook](../cookbooks/coordinate-participants/COOKBOOK.md)
for addressed conversation and specialist work. Device identity, attached endpoint
and run are different identities. A selected tool provider is RPC dispatch policy,
not operation-order authority. Existing uncertain work keeps its original signer
and request identity when providers become unavailable.

Payload properties named `author`, `role` or `instruction` are data. Only verified
signatures, capabilities and explicit approvals confer authority. Finalizer,
publisher, writer and DDL privileges are independent.

Before irreversible work, choose a supported finality/retention policy and an
idempotent external-effect protocol. Do not drive payments, email or deletion by
imperatively reacting to provisional event arrivals. Finalized forwarding uses
stable event identities; provisional consumers must handle rederivation, resets
and outcome changes.

## Qualification

Use the [application cookbook](../cookbooks/run-a-peer-application/COOKBOOK.md)
and its [checks](../cookbooks/run-a-peer-application/checks/README.md). Required
scenarios include independent offline writers, arbitrary delivery permutations,
duplicates, late earlier operations, mutable DDL and permissions, outcome changes,
browser finalization with the agent absent, Worker/native restart and explicit
missing-dependency/finality failures.

A source build, synthetic report or method name does not establish a connected
application or a published composition. Bind actual source commits, execution
profiles, archive hashes and real native/browser/transport observations. No
migration, old ordering profile or compatibility reader is part of this system.
