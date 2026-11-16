---
id: "run-reviewed-batch-actions"
title: "Review and execute a batch with clear partial outcomes"
summary: "Freeze the selected work, preview per-item effects, and expose bounded execution, cancellation, retries, and uncertain outcomes without hiding partial completion."
group: "Decide and act"
tags: ["batch", "review", "partial-results"]
choices: ["Exact selected snapshot versus changing query results", "Atomic transaction versus independent per-item outcomes", "Retry original item intent versus a newly reviewed batch"]
related: ["review-exact-proposal", "recover-outdated-work", "undo-and-revise-work"]
sources: ["https://github.com/werg/tendriller/blob/0c7b2d8e6b625609403bcf797d943f136d740a51/docs/PROTOCOL.md", "https://github.com/werg/tendriller/blob/0c7b2d8e6b625609403bcf797d943f136d740a51/docs/DURABILITY.md", "https://github.com/werg/tendriller/blob/0c7b2d8e6b625609403bcf797d943f136d740a51/docs/BROWSER_API.md"]
capabilities: []
evidence: "explained"
---

# Review and execute a batch with clear partial outcomes

Use this when a person needs to apply a similar action to several records: approve selected observations, archive completed items, rename reviewed files, or export a defined set. A batch should reduce repetitive effort without making consequences obscure. For a few unrelated or highly consequential actions, individual review may be clearer.

## Freeze what the person actually selected

Imagine a queue of 200 imported records where a person wants to accept 40 reviewed rows. A filter may change while new records arrive. The batch must refer to the exact reviewed identities and relevant versions, not “whatever matches this query when execution starts.” Distinguish selected rows on the current page from all matching results, and show the count and scope explicitly.

Provide select, inspect, preview, confirm, execute, and reconcile stages. Preserve selection across pagination only when that is the defined behavior, and make hidden selected rows discoverable. Offer an accessible list and per-row controls alongside any visual selection gesture. If a record disappears or changes, mark it unresolved rather than quietly substituting another row at the same index.

A selection snapshot should identify the intended operation, target identities, reviewed versions/generations, parameters, and any evidence or approval versions needed to preserve meaning. It is application data; using a field named `batch` does not activate a core workflow or transaction.

## Preview consequences at the right level

Show a concise summary with counts of eligible, unchanged, conflicted, unsupported, and excluded items, then a per-item detail view. For a rename, show old and proposed names. For a publication or external action, show the exact reviewed content and audience where relevant. Do not hide validation failures in a final toast after execution has already started.

| Decision | Useful starting choice | Choose differently when |
| --- | --- | --- |
| Selection | Explicit stable item IDs captured at review. | A deliberate dynamic policy is itself the action and has a separate trusted contract. |
| Validation | Preview all selected items within a bounded size. | Very large workloads need chunked review with explicit unreviewed scope. |
| Execution | Independent per-item operations with visible receipts. | One authoritative atomic batch is required and can fit its resource limits. |
| Ordering | Preserve a declared order or independence. | Later items depend on earlier results and must stop when prerequisites fail. |
| Concurrency | A small bounded number of independent requests. | The external service's documented capacity and ordering justify another choice. |
| Retry | Reconcile and retry the original failed/uncertain intent. | Changed inputs require a fresh review and new intent. |

A dry run validates under the conditions it observed; it does not reserve authority or guarantee that the destination will remain unchanged. Revalidate the relevant preconditions at execution. If an approval expires or an item changes, require the selected current review policy rather than silently widening the approved batch.

## Choose atomic or partial semantics honestly

An atomic batch means every covered mutation commits together or none does at the actual authority boundary. For shared-state changes, use core's [conditional `state.apply` operation](https://github.com/werg/tendriller/blob/0c7b2d8e6b625609403bcf797d943f136d740a51/docs/BROWSER_API.md). It checks all supplied conditions against one authoritative snapshot and applies every operation in one transaction. It also persists the command and its accepted or state-conflict receipt. A page does not need a custom transaction implementation for this guarantee.

For example, after `observed = await tendril.state.snapshot()`, freeze a bounded list of existing `selectedIds` for review. Retain each exact record from `observed.state.items`. Once the person confirms archiving those records, submit:

```js
const result = await tendril.state.apply(
  selectedIds.map(id => ({
    op: "set", path: ["items", id, "status"], value: "archived",
  })),
  {
    conditions: selectedIds.map(id => ({
      path: ["items", id], equals: observed.state.items[id],
    })),
    expected_generations: Object.fromEntries(
      observed.scopes.map(scope => [scope.id, scope.generation]),
    ),
  },
);
```

This example requires a nonempty selection of existing non-null object records within the service's condition and payload limits; its `status` path cannot traverse an array or scalar. It guards every observed scope conservatively; a task can select its relevant scope dependencies. A changed selected record rejects the entire batch, while an unrelated record can change without failing these value conditions. Use `expected_revision: observed.rev` instead when any intervening state mutation must invalidate review. Show `queued`, `accepted`, and `rejected` distinctly; the conditional batch does not optimistically remove rows. Optional conditions provide concurrency control for cooperating writers, not permission or approval enforcement against other authorized operations.

For protected domain transitions, private records, or effects in an external system, the trusted operation must enforce those additional rules. A shared-state transaction does not atomically rename files, publish assets, create timers, or execute an external action. Use the authority that owns those effects and state its actual boundary.

Independent per-item execution is often more practical. Define whether an item failure stops the batch, skips dependent work, or allows independent items to continue. Give every item its own immutable intent and result identity while retaining a parent batch identity for navigation. A parent receipt saying “started” does not mean every child succeeded.

Do not split a semantic transaction into arbitrary chunks and still call it atomic. If a large workload must be chunked, expose the chunk boundaries and partial completion. Bound selected count, payload bytes, in-flight requests, retry age, retained result details, and diagnostic data. Quota rejection should leave a coherent record of what happened.

## Present progress people can act on

Distinguish not started, checking, queued, accepted, executing, completed, rejected, skipped, and uncertain where the integration can establish those states. Count completed outcomes separately from requests merely sent. A useful summary might be “28 complete, 6 rejected, 4 not started, 2 checking outcome,” with a filterable detail list.

Keep the denominator tied to the immutable selected set. If the person edits the selection during execution, treat it as a separate future batch or a deliberate supported modification. Do not let new matching records silently increase the total or inherit earlier approval. Retain the original preview alongside actual outcomes so differences are understandable.

Provide a pause or stop action only with clear scope. “Stop starting new items” is different from cancelling in-flight work. Once an external request is accepted, it may still complete. Show which items were never started, which are still being reconciled, and which cannot be recalled. A cancel receipt does not establish rollback of completed items.

Use accessible status summaries without announcing every result at high volume. Preserve focus and the inspected row as the list updates. Allow export of a bounded outcome report that includes failures and uncertainty, not just successful rows.

## Recover without duplicating effects

Retain the review selection and explanatory progress under an appropriate privacy policy. Core already persists an admitted shared-state batch's operations, conditions, identity, and generations; use `state.pending()` and `state_queue` to restore outstanding work, then correlate `state_result.cid` and its original `ops` with the reviewed rows. Do not build a second mutation outbox or submit a new `state.apply` merely because its promise returned `queued`. Those APIs expose pending commands and terminal events, not an application history of completed batches. Keep a bounded outcome report when completed per-item history must survive a later reload. Reauthorize before restoring private details. External integrations still need their own durable progress and supported receipt mechanism. Do not restart an entire batch because the browser lost its progress counter.

A lost reply after an effect is an uncertain outcome, not an ordinary failure. Query the authoritative result or use the external system's supported idempotency mechanism before retrying. For Tendriller durable operations, preserve their original command and generation context through retry; runtime-owned capture identities follow their own documented retry path. Never attach current generations to an old payload solely to make it pass.

Offer “Retry these original failures” only for cases whose retry meaning is unchanged. If records or parameters must change, create a new reviewed batch and link it to the prior one. Successful items should remain excluded unless the person deliberately selects a new action. External effects still require their own deduplication and compensation policy.

## Close out with useful next steps

Completion means every selected item has a known terminal disposition under the declared policy, or the batch is explicitly closed with unresolved items. Show final counts, exact target set, skipped reasons, uncertain outcomes, and any remaining review. A batch can be mostly successful without being fully complete.

If reversal is supported, preview it as another guarded operation with its own conflicts and limits. Some completed items may have changed since execution or produced irreversible effects. Follow [undo and revision policy](../undo-and-revise-work/COOKBOOK.md) rather than promising a single universal Rollback button.

## Verify partial outcomes under pressure

| Scenario | Expected observation |
| --- | --- |
| New rows arrive after selection | They are excluded from the captured batch unless deliberately reviewed. |
| One selected record changes before execution | Its stale operation rejects or follows the explicit conflict policy. |
| One condition fails in a core atomic state batch | None of the selected rows change; the proposal and conflict remain reviewable. |
| An accepted batch reply is lost, then the page reloads | Core replays the original command and receipt without admitting the batch twice. |
| One item fails in an independent batch | Other outcomes remain visible and follow the stated continue/stop policy. |
| A claimed atomic batch hits quota midway | The real transaction commits none; a client loop cannot claim this result. |
| Stop is requested with work in flight | Not-started, accepted, completed, and uncertain items remain distinct. |
| Browser reloads after partial completion | Reconciliation restores the original batch without repeating known successes. |
| External effect succeeds but its reply is lost | The item stays uncertain until authoritative reconciliation prevents a blind duplicate. |
| Retry requires changed parameters | The interface requires a new reviewed intent and preserves the earlier receipt. |

The scenario list is a proposed acceptance plan. Live transaction, authorization, and external-effect guarantees require checks at the actual boundary that owns them.
