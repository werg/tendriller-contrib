# Choose application primitives by their guarantees

Start with what must survive. A live cursor can disappear. A submitted message
must be recoverable. A resource reservation must satisfy its condition. Sending
an email must wait until its recorded intent cannot be rolled back. These are
different requirements, even when one screen uses all four.

## Choose the smallest sufficient mechanism

| Need | Use | Recovery meaning |
| --- | --- | --- |
| A value useful only on this device | Local state or a local draft | The application chooses whether it survives reload. |
| Live information that may be lost or replaced | Ephemeral signals | No history, offline queue, replay, transaction or finality. Reconnect with fresh observations. |
| A message, observation or intent that must remain available | Durable events | Retained operations, stable retry identity, replay and final outcomes. |
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

## Name roles precisely

"Authority" is too broad to be an application role. Describe the decision each
participant may make instead. A single resident process can fulfill several
roles, but colocating them does not grant one role another role's rights.

| Role | Decision it owns | What that role does not establish |
| --- | --- | --- |
| Page host | Assets, page accounts and configured introductions | Database reader/writer permission or successful SQL execution |
| Membership administrator | Capability grants, revocations and group-key delivery | Application schema administration, finality or permission to perform external effects |
| Schema administrator | Allowed schema changes under the group's execution rules | Finality or tool credentials |
| Finality provider | Which exact proposals belong to each sealed batch | SQL success, replication to every peer or completion of an external action |
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

Select a finality provider for the durable history independently of the page host
and effect worker. The fixed native provider is an implementation of that role,
not a requirement that every signal, page or agent action pass through one
machine. Its unavailability pauses new coordinated final outcomes; established
signal connections and existing local reads have their own lifetimes.

## Separate inclusion, execution and finality

In Chronolog, finality seals exact batches of proposals. A signed batch names
its predecessor and exact membership. Replicas append that batch after the prior
sealed prefix and apply its deterministic order under the pinned execution
profile. Author timestamps describe when an operation was authored; they do not
expire an offline operation or let it insert itself into already final history.

The finality provider chooses inclusion. A replica verifies the signed batch,
fetches its complete bodies and executes the programs to determine accepted or
rejected outcomes. Governance changes in batch N become active for batch N+1,
so every program in a batch sees the same previously finalized permissions.
Changing membership, schema administration, provider placement or worker
placement remains an explicit role decision.

For application code, keep four useful states distinct:

| State | What the application can say |
| --- | --- |
| Queued | The original proposal is prepared locally and awaits progress. |
| Provisional | The replica has a current result that may change as the pending set or next sealed batch changes. |
| Final accepted | The sealed prefix was executed and this operation succeeded. |
| Final rejected | The original operation has a stable rejection; recovery is a newly reviewed action. |

An inclusion receipt alone cannot establish either final application outcome.
A final accepted operation also does not establish that another peer has a
backup, that a person read the result, or that an external provider acted.

Author dependent work after observing the prerequisite's final result, and retain
the appropriate guards inside the new transaction. It then belongs to a later
batch; no wall-clock adjustment is required. An operation prepared offline can
join the next unsealed batch with its original identity, payload and guards.
Domain guards and current authorization determine whether it is still valid.
An operation ID identifies one immutable request. Retry preserves its bytes and meaning; updating a guard,
timestamp or payload creates new intent and needs a new operation ID.

## Treat rollback and redo as replica work

Use a coherent `final` view for confirmed work. A `local` view may include
provisional work when immediate feedback is useful. When pending proposals or
the next sealed batch change the tentative order, Chronolog may roll back and
re-execute only its provisional suffix. The sealed
prefix never changes.
The UI replaces its affected projection from one captured revision; it keeps
drafts, focus and original operation references separately.

A deterministic projection may run many times. It reads recorded inputs and
returns state. It never sends email, speaks, charges a card or invokes a tool.
The effect worker consumes final intents, journals a stable effect identity, and
publishes a result. If a provider acted before a crash, use its idempotency key or
query its original result. Without either, retain an uncertain outcome for
reconciliation.

Application Undo is different from replica rollback. Undo of final work is a
new guarded reversal or compensation; it does not erase the agreed history or
recall an external action. See [undo and revision](../cookbooks/undo-and-revise-work/COOKBOOK.md).

## Give an implementing agent a short contract

Before changing the page, write down:

1. Which values are local, live, durable, transactional and external.
2. Which durable backend and execution profile own application writes.
3. Which roles may publish topics, change schema, administer membership, certify
   finality and dispatch each effect.
4. Which view is provisional, which progress is final, and what resets on loss of
   a live connection.
5. Which failure would lose meaning: a lost signal, a failed assertion, a delayed
   retry, a rebase, a revoked capability or a crash after external dispatch.

Then implement the smallest path that meets those guarantees. Use the public
signal channel, operation store, read views and effect service. Do not create a
second proposal outbox, manually refresh guards on retries, infer completion
from a live preview, or promote a UI checkpoint into a worker's handled cursor.

This guide describes design choices. The individual cookbooks and source-pinned
qualification reports state which implementations and failure scenarios were
actually exercised.
