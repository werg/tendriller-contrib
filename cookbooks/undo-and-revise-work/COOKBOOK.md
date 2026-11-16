---
id: "undo-and-revise-work"
title: "Undo and revise work without changing its meaning"
summary: "Choose local undo, revision history, guarded reversal, or explicit compensation according to what changed and who may have acted on it."
group: "Design everyday interactions"
tags: ["undo", "history", "concurrency"]
choices: ["Local edit history versus accepted shared revisions", "Guarded inverse versus restore or compensation", "Reversible UI changes versus irreversible external effects"]
related: ["reconcile-concurrent-edits", "review-exact-proposal", "recover-outdated-work"]
sources: ["https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/PROTOCOL.md", "https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/BROWSER_API.md"]
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

Tendriller has no default application-wide undo policy. Core's atomic conditional state writes supply the concurrency primitive; the application chooses which inverse is meaningful and retains the required history. Reading this guide installs neither history nor compensation. A command retry repeats the original intent; it is not undo. A task reset is not an all-purpose history rewind.

## Make correction part of the normal journey

Consider a shared checklist where someone marks the wrong item complete. Immediately after the accepted change, offer a visible “Undo completion” action with the affected item and a short description. If another person has already changed that item, show the conflict and a comparison rather than overwriting their work. A history panel can reveal the original completion, its reversal, and any intervening revision.

For an unsent rich draft, local Undo and Redo can remain immediate. Explain their scope when the page also supports shared revisions. A familiar keyboard shortcut should act in the focused editor unless a clearly defined page-level context takes precedence. Do not let undoing a text edit unexpectedly reverse a submitted decision elsewhere.

Provide an accessible action in addition to a transient toast or shortcut. A brief toast can be convenient, but the only recovery path should not disappear before a person can read it. Give history entries meaningful verbs and object names, timestamps, and outcomes, without exposing private content to a broader audience.

## Choose the history model

A snapshot history is easy to inspect for small drafts but consumes more storage. Operation history can be compact and semantically useful but requires well-defined inverse operations. A domain revision history often best explains accepted shared work. Choose a bounded retention policy and show when earlier versions are no longer available.

Group related local edits into units people understand: a pasted paragraph, one drawn stroke, a field change, or a deliberate formatting action. Do not make every keystroke or pointer sample a separate visible history step unless that is useful. A new edit after undo usually creates a new branch of local history; define whether redo is discarded or retained as a named alternative.

For shared records, retain stable object identity and the exact before/after revision or relevant precondition. Store the minimum data needed for the selected correction policy. Sensitive deleted content should not remain indefinitely in an unrestricted history panel merely to support undo. History retention and reader authority are application policy decisions.

## Reverse accepted work against current truth

A proposed inverse must be reviewed under current authority and task context. For example, undoing a rename from “A” to “B” should check that the object still has the reviewed resulting value before restoring “A.” If someone renamed it to “C,” the inverse is stale. Use core's `conditions` with `state.set` or `state.apply`: the authority checks the predicate and applies the whole batch atomically. No custom trusted transaction is needed merely to make that comparison safe.

Read a coherent current view with `await tendril.state.snapshot()`. A failed/offline read leaves the local history available but cannot establish current authority. `state.get()` may include optimistic ordinary writes, so do not pair it with `state.revision` to manufacture a base. Show the inverse and any intervening changes before offering an accepted shared reversal.

For a history entry from the current task, assume `entry` retains its stable `itemId` and boolean `before`/`after` completion values. Items have an explicit deletion flag. Capture `reviewed` and its generations when preparing the Undo action, then retain these values until the person responds:

```js
const reviewed = await tendril.state.snapshot();
const expected_generations = Object.fromEntries(
  reviewed.scopes.map(scope => [scope.id, scope.generation]),
);
const result = await tendril.state.set(
  ["items", entry.itemId, "done"], entry.before,
  {expected_generations, conditions: [
    {path: ["items", entry.itemId, "done"], equals: entry.after},
    {path: ["items", entry.itemId, "deleted"], equals: false},
  ]},
);
```

The equality predicate retains the original resulting value; it does not adopt whatever is current during a retry. A different current completion conflicts. An unrelated note can still change. If changing away and back must also invalidate Undo, guard an application revision advanced by every cooperating edit, or use `expected_revision` with the original accepted global revision. The global guard is stricter and also rejects unrelated page changes. A revision from the new review protects that review interval, not the entire period since the original action. These are distinct correction policies.

For restoring a truly absent record, `exists:false` can guard its stable ID before an explicit whole-record `set`. A tombstone is present: use `equals` on its reviewed value or revision instead. Missing and null are distinct. Conditions on the object and its task-generation protect against reusing a history entry for a different lifecycle; an old-task history entry needs a deliberate restore-as-new review, not silently refreshed guards.

An arithmetic inverse may also be wrong. Subtracting a previous increment can be valid for an explicitly additive domain but not for a field that someone has subsequently set to a chosen total. Reversing a deletion may require preserving identity, references, ordering, and permissions; recreating a visually similar row is not necessarily the same object.

Each new browser write creates its own reversal command; automatic delivery retries retain that command's original predicates and generations. Keep the original operation's receipt available. A conditional inverse does not change the optimistic shared view: show “Undo pending” until `accepted`, retain it through `queued`, and offer comparison on `rejected`. Observe `state_result` for a terminal result after queuing. Do not invoke Undo again to retry delivery. A durable `state_conflict` remains rejected even if the predicate later becomes true; a fresh reviewed inverse is new intent. See the [browser API](https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/BROWSER_API.md).

Use the admitted result's `cid` to correlate this reversal. `state.pending()` and `state_queue` restore unsettled operations after reload; `state_result` includes their original normalized `ops` and predicates, so the affected item and inverse value remain identifiable without another outbox. If accepted history needs an explicit “reverses this earlier operation” link, write that application history record in the same conditional `apply` batch. The pending view is not retained rejection history; keep the person's recoverable draft according to the history policy. An empty unconditional inverse returns `unchanged`, which is not an accepted reversal.

These predicates are optional cooperative guards. They do not authorize reversal of someone else's work or prevent another authorized writer from omitting them. Enforced role rules, approval revocation, and external compensation still need their actual authorized operations. For a shared file, restoration needs the current path revision; publication rollback changes the publication-head revision. Restoring earlier bytes does not reset those concurrency histories.

A Redo after an accepted reversal is also new reviewed work, not permission to replay the original command with new meaning. Recheck current authority, generation, referenced evidence, and any external conditions.

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
| A task resets after the Undo offer is prepared | Original generations remain attached and the old inverse cannot alter the new task. |
| Deleted item is restored | Identity, references, ordering, and permissions follow the reviewed restoration policy. |
| Evidence is corrected after approval | Earlier approval remains tied to its original evidence and requires reassessment when appropriate. |
| Some batch items can no longer be reversed | Outcomes identify reversible, conflicted, and irreversible items explicitly. |
| History retention expires or reader authority changes | Unavailable history and access limits are explained without leaking cached content. |

The useful outcome is confidence to revise work while preserving an honest account of what happened. The exact history and compensation mechanisms remain page-owned or explicitly trusted application policy.
