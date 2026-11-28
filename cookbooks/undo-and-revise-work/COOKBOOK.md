---
id: "undo-and-revise-work"
title: "Undo and revise work without changing its meaning"
summary: "Choose local undo, revision history, guarded reversal, or explicit compensation according to what changed and who may have acted on it."
group: "Design everyday interactions"
tags: ["undo", "history", "concurrency"]
choices: ["Local edit history versus accepted shared revisions", "Guarded inverse versus restore or compensation", "Reversible UI changes versus irreversible external effects"]
related: ["reconcile-concurrent-edits", "review-exact-proposal", "recover-outdated-work"]
sources: ["https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/PROTOCOL.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md"]
capabilities: []
evidence: "explained"
---

# Undo and revise work without changing its meaning

Use this when people need to correct mistakes, explore alternatives, or understand how work evolved. Undo is simple for an unsent text edit and much more consequential for an accepted shared change or an external action. Choose the behavior by the effect's scope. A revision history with explicit restoration may be clearer than a universal Undo button.

## Distinguish four kinds of reversal

| Kind of work | Appropriate mechanism | Meaning to communicate |
| --- | --- | --- |
| Local unsent editing | Local undo/redo history. | Restore an earlier draft state on this device. |
| Accepted shared data | A new guarded change or reviewed restoration. | Request a reversal against current authoritative state. |
| Published evidence or decision | A new revision that preserves the earlier record. | Correct or supersede the interpretation without rewriting what was reviewed. |
| External effect | Domain-specific compensation when supported. | Perform another action; the original effect still happened. |

Tendriller has no default application-wide undo policy. The application definition supplies guarded commands and retained domain history through one session; it chooses which inverse is meaningful. Reading this guide installs neither history nor compensation. A command retry repeats the original intent; it is not undo. A task reset is not an all-purpose history rewind.

## Separate late-operation revision from user Undo

The operation set is a union ordered by signed author time, so an operation that arrives late with an earlier time can change later provisional outcomes, with no recovery step. `session.changes()` reports the revision and revised `opId`s. The page rederives a coherent projection while preserving drafts and the original operation references. Outcomes stay identifiable and nothing is silently removed. A configured closed-time frontier can exclude a first-seen older operation; its original intent remains inspectable. Neither mechanism invents new user intent.

Undo of an accepted domain action is a newly reviewed guarded command. Redo is another new decision. Retrying an original operation instead resumes its exact signed operation and author time. A finality-excluded operation is not silently retimestamped or resubmitted; if it is still wanted, a deliberately reviewed new operation is separate intent. External effects must never be dispatched merely because a view rebuilds or history is replayed.

## Make correction part of the normal journey

Consider a shared checklist where someone marks the wrong item complete. Immediately after the accepted change, offer a visible “Undo completion” action with the affected item and a short description. If another person has already changed that item, show the conflict and a comparison rather than overwriting their work. A history panel can reveal the original completion, its reversal, and any intervening revision.

For an unsent rich draft, local Undo and Redo can remain immediate. Explain their scope when the page also supports shared revisions. A familiar keyboard shortcut should act in the focused editor unless a clearly defined page-level context takes precedence. Do not let undoing a text edit unexpectedly reverse a submitted decision elsewhere.

Provide an accessible action in addition to a transient toast or shortcut. A brief toast can be convenient, but the only recovery path should not disappear before a person can read it. Give history entries meaningful verbs and object names, timestamps, and outcomes, without exposing private content to a broader audience.

## Choose the history model

A snapshot history is easy to inspect for small drafts but consumes more storage. Operation history can be compact and semantically useful but requires well-defined inverse operations. A domain revision history often best explains accepted shared work. Choose a bounded retention policy and show when earlier versions are no longer available.

Group related local edits into units people understand: a pasted paragraph, one drawn stroke, a field change, or a deliberate formatting action. Do not make every keystroke or pointer sample a separate visible history step unless that is useful. A new edit after undo usually creates a new branch of local history; define whether redo is discarded or retained as a named alternative.

For shared records, retain stable object identity and the exact before/after revision or relevant precondition. Store the minimum data needed for the selected correction policy. Sensitive deleted content should not remain indefinitely in an unrestricted history panel merely to support undo. History retention and reader authority are application policy decisions.

## Reverse accepted work against current truth

Review a proposed inverse under current authority and domain context. Undoing a rename from “A” to “B” should require the reviewed resulting value before restoring “A.” If someone renamed it to “C,” that inverse is stale. A value guard and a record-version guard intentionally differ when a value changes away and back. Select the policy, then enforce the predicate and inverse in one command transaction.

For illustration, your definition can declare an `item` query and `reverseCompletion` command. A history entry retains the original operation ID, item ID and before/after completion values. The command checks author authority, existence, deletion status, expected version, and the expected resulting value before applying the inverse and recording its relation to the earlier operation:

```js
const reviewed = await session.query('item', { itemId: entry.itemId });
if (!reviewed.value || reviewed.value.done !== entry.after) {
  throw new Error('Review the changed item before reversing completion');
}
const operation = await session.command('reverseCompletion', {
  itemId: entry.itemId,
  expectedVersion: reviewed.value.version,
  expectedDone: entry.after,
  done: entry.before,
  reverses: entry.operationId,
}, { operationId: crypto.randomUUID() });
const receipt = await operation.materialized();
```

These names are illustrative application vocabulary. The UI check helps the person; the command must repeat all required checks inside actual execution. The captured revision records what was reviewed; it is not an order input and does not replace the domain predicates. A [guarded definition](../run-a-peer-application/snippets/peer-task-board.mjs) owns those rules for every caller.

Restoring an absent record needs an explicit policy for identity, references, ordering and access. A tombstone is a retained record, not absence. Reusing a history entry for a new domain round must be an intentional restore-as-new decision. An arithmetic inverse is valid only when the domain explicitly treats the value as additive; subtracting an old increment can be wrong after someone set a chosen total.

Retain the new reversal's operation ID and inspect the session journal after interruption. Show stored locally and materialized accepted/rejected separately. Retry uses `session.operations.retry` for that same operation; it does not create another inverse. If a late earlier operation or closed-time exclusion changes either the original action or the reversal, reread a coherent snapshot before offering a new correction. Neither `materialized()` nor retained coverage is an irreversible settlement promise; `finalized()` is only as strong as the configured policy.

A Redo after accepted reversal is also newly reviewed work. Check the current domain version, author authority, referenced evidence and external conditions. A completed publication revision is changed through another signed publication with its real predecessor; restoring old bytes does not reset publication history. External compensation still needs its actual action authority, receipt and reconciliation policy.

## Keep evidence and decisions traceable

If an observation, annotation, or approval informed later work, prefer a correcting revision with an explicit relation to the earlier one. Do not silently replace original evidence behind an old approval. Show which interpretation is current and which earlier version a decision used. A reviewer may need to reassess downstream conclusions after a substantive correction.

For bulk corrections, preview the exact set and define per-item or atomic semantics. Undoing a batch may be partially possible if some items changed or effects became irreversible. Present those outcomes separately instead of displaying one misleading success indicator. See [reviewed batch actions](../run-reviewed-batch-actions/COOKBOOK.md) for this distinct boundary.

## Treat external compensation honestly

Cancelling a reservation, issuing a refund, retracting a publication, or sending a correction has its own policy and side effects. A compensating operation can fail, require authority, or leave the original action visible. Label it with its domain meaning rather than implying time was reversed.

Before performing an uncertain compensation, reconcile the original external result. If a request timed out after the external service may have accepted it, blindly retrying or compensating can create a second error. Use the external system's stable identities and supported idempotency/reconciliation mechanism. A durable local receipt is not proof of exactly-once effects elsewhere.

If an action cannot be undone, make that clear at its review point and provide an appropriate confirmation only for that actual consequential action. Do not burden harmless local edits with the same flow. A recovery path might be a correction note or a new review, not a fictional Undo button.

## Verify that correction preserves meaning

| Scenario | Expected observation |
| --- | --- |
| Undo and redo within an unsent draft | The expected edit unit changes and unrelated fields remain intact. |
| New typing after a local undo | Redo follows the documented branch policy rather than overwriting new work. |
| Another person edits before shared undo | A guarded conflict is shown; their update is preserved. |
| The resulting value changes away and back | A value guard and a revision guard exhibit the deliberately chosen different policies. |
| Reversal reply is lost | Retry reconciles the same reversal command without applying a second inverse. |
| The inverse is queued or rejected and its predicate later becomes true | Pending UI does not claim success; a stored rejection stays terminal until the person reviews new intent. |
| A task resets after the Undo offer is prepared | Original domain guards remain attached and the old inverse cannot alter the new task. |
| Deleted item is restored | Identity, references, ordering, and permissions follow the reviewed restoration policy. |
| Evidence is corrected after approval | Earlier approval remains tied to its original evidence and requires reassessment when appropriate. |
| Some batch items can no longer be reversed | Outcomes identify reversible, conflicted, and irreversible items explicitly. |
| History retention expires or reader authority changes | Unavailable history and access limits are explained without leaking cached content. |

The useful outcome is confidence to revise work while preserving an honest account of what happened. The definition owns domain history and guards; an explicit action capability owns external compensation.
