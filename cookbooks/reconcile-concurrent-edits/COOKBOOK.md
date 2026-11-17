---
id: "reconcile-concurrent-edits"
title: "Maintain a shared editable collection"
summary: "Choose stable identities and explicit conflict behavior for additions, edits, ordering, and deletion."
group: "Keep work dependable"
tags: ["concurrency", "drafts", "collections"]
choices: ["Append-only, field patches, revision guards, or human merge", "Stable identity separate from ordering", "Deletion, optimistic edits, and stale-draft review"]
capabilities: []
evidence: "explained"
related: ["recover-outdated-work", "adapt-without-losing-work", "choose-data-model", "search-and-filter-collections", "undo-and-revise-work"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/list.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/ui.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/model.mjs", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/PROTOCOL.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md"]
---

# Maintain a shared editable collection

Use a shared collection for notes, packing items, tasks, or decisions edited by several people or devices. The outcome is not merely synchronized text: people should understand whose changes were accepted, what remains local, and how to resolve competing intent. A single shared note can be simpler when concurrent edits are rare and manual review is acceptable. Silent last-write-wins is an application policy with consequences, not a neutral default.

Consider two people preparing an event. One edits an item's quantity while another changes its supplier; later, both change the quantity. The first pair may combine naturally, but the second needs an explicit rule. A reorder or deletion during either edit must not redirect a pending command to another item.

Use one owned application session for commands, queries, events and operation inspection. Browser, native and hosted control transports do not select different application APIs. Define domain guards in the deterministic command transaction; a page read followed by an unguarded write cannot preserve a reviewed decision.

## Make the everyday editing loop complete

1. **Read.** Obtain a coherent `session.query` result, including its application revision. Show connection and retained coverage separately from execution.
2. **Start a draft.** Capture the stable record ID, reviewed values and domain version together. Keep that snapshot separate from later typing.
3. **Edit.** Preserve the focused input while updates arrive. Show relevant changes without replacing the local draft.
4. **Submit.** Assign an operation ID to one immutable edit snapshot, retain its captured revision, and call the definition's declared command.
5. **Accept or reconcile.** Await `applied()` and inspect the accepted or rejected outcome. Show the reviewed, current and proposed values when a guard fails.
6. **Continue.** A late outcome updates its own pending card; it does not clear a newer draft.
7. **Return or recover.** Inspect the maintained operation journal. Retry the original saved operation, or deliberately reapply abandoned intent after reviewing the selected history.

A dense table, mobile item editor and append-only notebook can share this contract without sharing a renderer or schema.

## Choose how edits combine

| Model | Useful property | Tradeoff |
| --- | --- | --- |
| Append-only records | Independent contributions preserve their identity. | Corrections need explicit revision links and a current-view rule. |
| Field-value guard | An unrelated field can change without rejecting the edit. | Include every value that influenced the decision; change-and-change-back still matches. |
| Domain record version | Every relevant intervening edit invalidates review. | The definition must advance that version for every relevant mutation. |
| Explicit human merge | Competing intent remains inspectable. | Reserve the extra review for meaningful conflicts. |
| Ordered replacement | A disposable preference has a simple result. | State that concurrent intent may be superseded. |

The definition validates the author, all required predicates, the mutation and any emitted domain event as one transaction. Those guards are mandatory execution logic, not optional client conditions. The [guarded task definition](../run-a-peer-application/snippets/peer-task-board.mjs) demonstrates this boundary with SQL and authenticated signer checks.

For illustration, your definition can declare an `item` query and `changeQuantity` command. The query returns a stable ID, quantity, deletion status and domain version. The command checks that version and that the item still exists, then changes quantity, advances the version and emits its event atomically:

```js
const reviewed = await session.query('item', { itemId });
const original = reviewed.value;
if (!original || original.deleted) throw new Error('Review the removed item');

// After the person reviews and edits this snapshot:
const operationId = crypto.randomUUID();
const operation = await session.command('changeQuantity', {
  itemId,
  expectedVersion: original.version,
  quantity: submittedQuantity,
}, { operationId, basedOn: reviewed.revision });
const receipt = await operation.applied();
```

These query and command names are application definitions, not built-in methods. The captured `basedOn` revision is an ordering prerequisite. It does not itself assert that the item is unchanged: `expectedVersion` must be checked inside `changeQuantity`. A definition choosing independent field edits can instead guard the relevant values and deletion flag. A quantity/price constraint must check every calculation input and commit all outputs together.

`applied()` reports execution in the selected history; `shared()` observes retained coverage separately. Explicit recovery can abandon an applied suffix. Follow `session.changes` to refresh the projection and the operation journal to explain affected attempts. `session.retry(operationId)` preserves the original signed attempt and its meaning. A stored rejection does not become a new accepted edit when the field later changes; a new decision needs new reviewed intent. An abandoned operation requires deliberate reapplication linked to its original attempt.

## Separate identity, order, and visibility

Give every record a stable ID independent of position and display text. Sorting by name or dragging an item changes order, not identity. Pending writes, comments, receipts, and focus anchors should use the record ID. A row number can help navigation but must not address an edit.

Choose an ordering policy: explicit order keys, an ordered relation changed in one guarded command, or a derived sort such as due date plus a stable tie-breaker. Concurrent drag operations need a declared result. Guard the reviewed order or its domain version inside the command and replace it deliberately; do not assume arbitrary array edits commute. Offer keyboard move actions when drag-and-drop is available.

Deletion also needs a policy. Immediate removal is simple for disposable items. Tombstones prevent stale writes from quietly recreating a deleted record. Archival history helps review but adds retention and access responsibilities. A user editing an item deleted elsewhere should see “This item was removed” and retain a recoverable draft; “Restore as new item” can be a deliberate separate action if allowed.

Filtering and completed-item hiding are view choices. An item that leaves the visible list after an edit is not necessarily deleted. Provide a receipt and a route to the accepted item, especially when its new value no longer matches the current filter.

## Design a humane conflict resolution

Show enough context to resolve meaning: record title, changed field, old accepted value, current accepted value, local proposal, and relevant update attribution if appropriate. Avoid a raw JSON conflict as the only interface. For text, a side-by-side comparison may be safer than a complex automatic merge. For a quantity, an explicit numeric choice is usually clearer.

Distinguish retry from a new decision. The session retains the original command ID, signed attempt and domain inputs across interruption. Applied outcomes belong to the selected history: retry does not reevaluate rejected intent as a newly authored command. Choosing a merged value creates new intent after reading current authority. Never silently refresh a stale domain version or replace an abandoned operation. Query current authorized state for comparison and use the definition's bounded rejection details.

If two people repeatedly conflict, offer a lightweight editing indication or an explicit claim policy when it helps. Presence is advisory unless an actual authoritative lock exists. A label saying “Sam is editing” cannot guarantee exclusion, and a disconnected editor needs a defined expiry or release policy. Avoid locking an entire collection when only one record needs coordinated work.

## Bound history and preserve useful recovery

Choose which revisions and draft snapshots remain, for how long, and who can read them. A completed checkbox may be a mutable preference, an append-only event, or a reviewed task fact; make that choice before implementing “Undo.” Undo should express a new intentional correction against current state, not blindly restore an obsolete full document.

Export current records with their IDs and relevant revision/provenance fields. If history is included, label its coverage and redaction policy. Local drafts are not automatically part of a shared export. An access change should clear private editor surfaces and invalidate pending reads as well as writes.

## Verify competing intent

| Scenario | Expected observation |
| --- | --- |
| Two writers edit independent fields. | The declared policy combines them without dropping an unrelated accepted change. |
| Both conditionally change the same quantity from the same base. | The definition accepts the permitted change and exposes the competing guard rejection; neither draft disappears. |
| A quantity changes away and back before submission. | A field-value guard and a record-version guard follow their deliberately different policies. |
| An item is reordered while its edit is pending. | The edit affects the same stable ID and the receipt identifies it. |
| Another writer deletes the edited item. | A stale edit does not resurrect it; recovery requires an intentional action. |
| The domain round closes or application recovery replaces history while one device is offline. | Original intent remains inspectable; stale domain work rejects and abandoned history requires reviewed reapplication. |
| An acknowledgement is lost. | Retrying recovers the original outcome without adding a duplicate item. |
| A command is saved locally before connectivity returns. | The draft remains visible as pending; shared state does not claim the proposed value is accepted. |
| A rejected predicate later becomes true. | Delivery of the old command retains its original rejection; a reviewed new save is separate intent. |
| A late rejection arrives after further typing. | The submitted snapshot and current draft remain separately recoverable. |
| An accepted edit removes the item from the active filter. | The person sees a meaningful saved receipt and can locate the result. |

Use independent sessions and actual deterministic execution for concurrency claims. A single-browser optimistic demonstration establishes neither atomic checks nor a universal merge algorithm.
