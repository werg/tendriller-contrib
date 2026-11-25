---
id: "run-reviewed-batch-actions"
title: "Review and execute a batch with clear partial outcomes"
summary: "Freeze the selected work, preview per-item effects, and expose bounded execution, cancellation, retries, and uncertain outcomes without hiding partial completion."
group: "Decide and act"
tags: ["batch", "review", "partial-results"]
choices: ["Exact selected snapshot versus changing query results", "Atomic transaction versus independent per-item outcomes", "Retry original item intent versus a newly reviewed batch"]
related: ["review-exact-proposal", "recover-outdated-work", "undo-and-revise-work"]
sources: ["https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/PROTOCOL.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/DURABILITY.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md"]
capabilities: []
evidence: "explained"
---

# Review and execute a batch with clear partial outcomes

Use this when a person needs to apply a similar action to several records: approve selected observations, archive completed items, rename reviewed files, or export a defined set. A batch should reduce repetitive effort without making consequences obscure. For a few unrelated or highly consequential actions, individual review may be clearer.

## Freeze what the person actually selected

Imagine a queue of 200 imported records where a person wants to accept 40 reviewed rows. A filter may change while new records arrive. The batch must refer to the exact reviewed identities and relevant versions, not “whatever matches this query when execution starts.” Distinguish selected rows on the current page from all matching results, and show the count and scope explicitly.

Provide select, inspect, preview, confirm, execute, and reconcile stages. Preserve selection across pagination only when that is the defined behavior, and make hidden selected rows discoverable. Offer an accessible list and per-row controls alongside any visual selection gesture. If a record disappears or changes, mark it unresolved rather than quietly substituting another row at the same index.

A selection snapshot should identify the intended operation, target identities, reviewed domain versions, parameters, and any evidence or approval versions needed to preserve meaning. It is application data; using a field named `batch` does not activate a core workflow or transaction.

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

An atomic application batch means every covered mutation commits together or none does in one deterministic command transaction. Define a bounded command that checks the author, exact selected IDs and reviewed domain versions before changing any record. A query is the review snapshot; it is not a lock.

For illustration, your definition may declare `selectedItems` and `archiveItems`:

```js
const reviewed = await session.query('selectedItems', { ids: [...selectedIds] });
const selection = reviewed.value.items.map(item => ({
  id: item.id,
  expectedVersion: item.version,
}));
const operation = await session.command('archiveItems', { selection }, {
  operationId: crypto.randomUUID(),
});
const receipt = await operation.materialized();
```

The definition rejects empty, duplicate, unknown or over-limit selections and validates every selected version and transition before updating records. An unrelated record can change without rejecting the batch unless the domain deliberately guards a broader revision. The captured application revision identifies what was reviewed; it is not an order input and does not replace version checks. These query and command names are application vocabulary, not installed runtime methods.

Observe stored locally, materialized accepted/rejected, retained coverage and finality (when configured) separately. An atomic batch is one signed operation whose provisional outcome can be revised when an earlier operation arrives. A configured closed frontier can exclude the whole operation; reread a coherent snapshot and preserve the review snapshot before offering a deliberate new, reviewed batch. Ordinary application execution cannot atomically change host publication, transfer membership across applications, send an email or commit another system's transaction.

Independent per-item commands are useful when partial progress is acceptable. Give each immutable item operation a stable identity and retain a parent batch ID for navigation. Define whether failure stops dependent work or allows independent items to continue. A parent status of “started” does not mean every child succeeded.

Bound the selected count, payload bytes, concurrent requests, retry age and retained diagnostics. If a large workload must be divided into chunks, expose those transaction boundaries and partial completion. Irreversible external actions need their own configured protected boundary, idempotency and reconciliation; a collection of materialized outcomes does not provide one.

## Present progress people can act on

Distinguish not started, checking, queued, accepted, executing, completed, rejected, skipped, and uncertain where the integration can establish those states. Count completed outcomes separately from requests merely sent. A useful summary might be “28 complete, 6 rejected, 4 not started, 2 checking outcome,” with a filterable detail list.

Keep the denominator tied to the immutable selected set. If the person edits the selection during execution, treat it as a separate future batch or a deliberate supported modification. Do not let new matching records silently increase the total or inherit earlier approval. Retain the original preview alongside actual outcomes so differences are understandable.

Provide a pause or stop action only with clear scope. “Stop starting new items” is different from cancelling in-flight work. Once an external request is accepted, it may still complete. Show which items were never started, which are still being reconciled, and which cannot be recalled. A cancel receipt does not establish rollback of completed items.

Use accessible status summaries without announcing every result at high volume. Preserve focus and the inspected row as the list updates. Allow export of a bounded outcome report that includes failures and uncertainty, not just successful rows.

## Recover without duplicating effects

Retain the review selection and explanatory progress under an appropriate privacy policy. The session persists admitted command attempts and exposes them through `session.operations`; use original operation IDs to restore the progress view. Retry each saved operation with `session.operations.retry` and correlate its actual result with the frozen selection. Do not build another mutation outbox or create new commands because a waiter timed out. Reauthorize before restoring private details.

A lost external reply is an uncertain outcome, not proof of failure. Query the real action authority or use its documented idempotency mechanism before retrying. If a configured closed frontier excludes an attempt, preserve its identity and review current domain state before authoring a deliberately new operation; never silently retimestamp it. External effect journals must independently reconcile actions already dispatched.

Offer “Retry these original failures” only for cases whose retry meaning is unchanged. If records or parameters must change, create a new reviewed batch and link it to the prior one. Successful items should remain excluded unless the person deliberately selects a new action. External effects still require their own deduplication and compensation policy.

## Close out with useful next steps

Completion means every selected item has a known terminal disposition under the declared policy, or the batch is explicitly closed with unresolved items. Show final counts, exact target set, skipped reasons, uncertain outcomes, and any remaining review. A batch can be mostly successful without being fully complete.

If reversal is supported, preview it as another guarded operation with its own conflicts and limits. Some completed items may have changed since execution or produced irreversible effects. Follow [undo and revision policy](../undo-and-revise-work/COOKBOOK.md) rather than promising a single universal Rollback button.

## Verify partial outcomes under pressure

| Scenario | Expected observation |
| --- | --- |
| New rows arrive after selection | They are excluded from the captured batch unless deliberately reviewed. |
| One selected record changes before execution | Its stale operation rejects or follows the explicit conflict policy. |
| One domain guard fails in an atomic application command | None of the selected rows change; the proposal and conflict remain reviewable. |
| An accepted batch reply is lost, then the page reloads | Core replays the original command and receipt without admitting the batch twice. |
| One item fails in an independent batch | Other outcomes remain visible and follow the stated continue/stop policy. |
| A claimed atomic batch hits quota midway | The real transaction commits none; a client loop cannot claim this result. |
| Stop is requested with work in flight | Not-started, accepted, completed, and uncertain items remain distinct. |
| Browser reloads after partial completion | Reconciliation restores the original batch without repeating known successes. |
| External effect succeeds but its reply is lost | The item stays uncertain until authoritative reconciliation prevents a blind duplicate. |
| Retry requires changed parameters | The interface requires a new reviewed intent and preserves the earlier receipt. |

The scenario list is a proposed acceptance plan. Live transaction, authorization, and external-effect guarantees require checks at the actual boundary that owns them.
