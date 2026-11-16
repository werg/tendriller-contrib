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
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/list.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/ui.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/model.mjs", "https://github.com/werg/tendriller/blob/1492d58501ef5b6f111b5330dc08fc381c84eefe/docs/PROTOCOL.md"]
---

# Maintain a shared editable collection

Use a shared collection for notes, packing items, tasks, or decisions edited by several people or devices. The outcome is not merely synchronized text: people should understand whose changes were accepted, what remains local, and how to resolve competing intent. A single shared note can be simpler when concurrent edits are rare and manual review is acceptable. Silent last-write-wins is an application policy with consequences, not a neutral default.

Consider two people preparing an event. One edits an item's quantity while another changes its supplier; later, both change the quantity. The first pair may combine naturally, but the second needs an explicit rule. A reorder or deletion during either edit must not redirect a pending command to another item.

## Make the everyday editing loop complete

1. **Read.** Load current authorized records and show connection/freshness separately from saved state. A cached collection may be useful but must not masquerade as current authority.
2. **Start a draft.** Use `await tendril.state.snapshot()` while connected to capture the record ID, authoritative base values, revision, and relevant scope generations together. Keep the draft separate from accepted shared state. `state.get()` is useful for rendering but can include ordinary optimistic writes; pairing it with `state.revision` does not create an authoritative snapshot.
3. **Edit.** Keep the input stable while remote changes arrive. Mark relevant remote changes without overwriting local typing.
4. **Submit.** Capture an immutable edit snapshot and its concurrency context. Show a proposed value in the draft or pending card; conditional core writes do not change the optimistic shared view before acceptance.
5. **Accept or reconcile.** On acceptance, reconcile by command and record identity. On conflict, show the base, current accepted value, and proposed value, with a meaningful choice to merge, discard, or revise.
6. **Continue.** New typing belongs to a new draft. A late outcome for the earlier submission must not erase it.
7. **Leave and return.** Restore eligible drafts under the current identity and task, then compare with current authority before resubmission.

A dense spreadsheet-like interface, a mobile item editor, and an append-only notebook can all use this loop. They need not share a renderer or schema.

## Choose how edits combine

| Model | Useful property | Tradeoff and boundary |
| --- | --- | --- |
| Append-only records | Independent contributions rarely conflict and history is clear. | Corrections need revision links and an explicit current-view rule. |
| Field conditions | `equals` checks the edited field's base value while unrelated fields can change. | Include every other field whose value influenced this decision. A value changed and changed back still matches. |
| Global revision precondition | Core's `expected_revision` rejects any intervening shared-state write, including change-and-change-back. | Unrelated changes also conflict; use it when the whole reviewed snapshot matters. |
| Explicit human merge | Competing intent remains inspectable. | Review costs attention; reserve it for meaningful conflicts. |
| Last-write-wins | A disposable shared preference is easy to update. | Define ordering and expose that concurrent intent may be lost; avoid it for important records. |

Core's [conditional state contract](https://github.com/werg/tendriller/blob/1492d58501ef5b6f111b5330dc08fc381c84eefe/docs/PROTOCOL.md#shared-state-writes) supplies the atomic check and mutation. `state.set(path,value,options)` handles one field; `state.apply(ops,options)` commits several changes together. All `conditions` read the same pre-mutation state. `exists:false` requires a genuinely absent path, while `equals:null` requires a present null value. Use the first for an unused record ID, the second when null means “unassigned.” Scope generations independently protect the context against resets or rebinding and cover condition-read paths as well as written paths.

For example, records below have a numeric `quantity` and an explicit `deleted:false`. Capture `base` when opening the editor, retain it with the draft, and pass the person's validated `submittedQuantity` on Save:

```js
const base = await tendril.state.snapshot();
const expected_generations = Object.fromEntries(
  base.scopes.map(scope => [scope.id, scope.generation]),
);
const original = base.state.items[itemId];

// Later, after the person edits this same item:
const result = await tendril.state.set(
  ["items", itemId, "quantity"], submittedQuantity,
  {expected_generations, conditions: [
    {path: ["items", itemId, "quantity"], equals: original.quantity},
    {path: ["items", itemId, "deleted"], equals: false},
  ]},
);
```

The example guards all observed scopes conservatively; a task can select only its dependencies. If the record was removed before editing, offer recovery before constructing a save. A supplier-only change can coexist with this quantity edit. A changed quantity, deletion, or reset rejects the old intent. `accepted` confirms the mutation, `queued` means the original command remains durable awaiting a result, and `rejected` needs review. Listen for `state_result` after a queued promise; do not call Save again merely to deliver the same pending work. The [browser API](https://github.com/werg/tendriller/blob/feat/core-cookbook-dx/docs/BROWSER_API.md) describes snapshot availability and receipt fields.

Admitted results carry `cid`. Rebuild per-item pending indicators after reload from `state.pending()` and follow `state_queue`; each entry includes the original normalized operations and predicates. A later `state_result` carries those same operations, so its `["items",itemId,...]` path identifies the edited record even after navigation. This uses core's existing durable outbox, not another page delivery queue. Empty unconditional work returns `unchanged` without a CID or server receipt; handle that separately from a saved edit.

Fields can participate in a joint constraint: quantity and total price, for example. Check every input used in the calculation and write both outputs with one conditional `apply`. These optional cooperative guards do not enforce business rules against an authorized client that omits them. A mandatory pricing, access, or ownership rule belongs in an authorized trusted operation; generic compare-and-set itself needs no custom server policy.

## Separate identity, order, and visibility

Give every record a stable ID independent of position and display text. Sorting by name or dragging an item changes order, not identity. Pending writes, comments, receipts, and focus anchors should use the record ID. A row number can help navigation but must not address an edit.

Choose an ordering policy: explicit order keys, an ordered relation changed in one conditional batch, or a derived sort such as due date plus a stable tie-breaker. Concurrent drag operations need a declared result. Arrays are whole values: guard the reviewed order with `equals` and replace it deliberately, rather than indexing into an array or assuming replacements combine. Offer keyboard move actions when drag-and-drop is available.

Deletion also needs a policy. Immediate removal is simple for disposable items. Tombstones prevent stale writes from quietly recreating a deleted record. Archival history helps review but adds retention and access responsibilities. A user editing an item deleted elsewhere should see “This item was removed” and retain a recoverable draft; “Restore as new item” can be a deliberate separate action if allowed.

Filtering and completed-item hiding are view choices. An item that leaves the visible list after an edit is not necessarily deleted. Provide a receipt and a route to the accepted item, especially when its new value no longer matches the current filter.

## Design a humane conflict resolution

Show enough context to resolve meaning: record title, changed field, old accepted value, current accepted value, local proposal, and relevant update attribution if appropriate. Avoid a raw JSON conflict as the only interface. For text, a side-by-side comparison may be safer than a complex automatic merge. For a quantity, an explicit numeric choice is usually clearer.

Distinguish retry from a new decision. The runtime retains the original command ID, predicates, and generations across interruption. Both accepted outcomes and `state_conflict` rejections have durable receipts: a rejected command cannot succeed merely because the value later changes back. Choosing a merged value creates new intent after reading current authority. Never silently refresh a stale predicate or generation. Conflict receipts identify the failed condition/path and observed revision; fetch current authorized state for the comparison instead of expecting actual field values inside the error.

If two people repeatedly conflict, offer a lightweight editing indication or an explicit claim policy when it helps. Presence is advisory unless an actual authoritative lock exists. A label saying “Sam is editing” cannot guarantee exclusion, and a disconnected editor needs a defined expiry or release policy. Avoid locking an entire collection when only one record needs coordinated work.

## Bound history and preserve useful recovery

Choose which revisions and draft snapshots remain, for how long, and who can read them. A completed checkbox may be a mutable preference, an append-only event, or a reviewed task fact; make that choice before implementing “Undo.” Undo should express a new intentional correction against current state, not blindly restore an obsolete full document.

Export current records with their IDs and relevant revision/provenance fields. If history is included, label its coverage and redaction policy. Local drafts are not automatically part of a shared export. An access change should clear private editor surfaces and invalidate pending reads as well as writes.

## Verify competing intent

| Scenario | Expected observation |
| --- | --- |
| Two writers edit independent fields. | The declared policy combines them without dropping an unrelated accepted change. |
| Both conditionally change the same quantity from the same base. | One accepted change and one `state_conflict` are visible; neither draft disappears. |
| A quantity changes away and back before submission. | `equals` follows the declared value policy; a captured global revision rejects the intervening writes. |
| An item is reordered while its edit is pending. | The edit affects the same stable ID and the receipt identifies it. |
| Another writer deletes the edited item. | A stale edit does not resurrect it; recovery requires an intentional action. |
| A scope resets while one device is offline. | Old work retains its original guards and is rejected rather than rebased silently. |
| An acknowledgement is lost. | Retrying recovers the original outcome without adding a duplicate item. |
| A conditional save is queued offline. | The draft remains visible as pending; shared state does not claim the proposed value is accepted. |
| A rejected predicate later becomes true. | Delivery of the old command retains its original rejection; a reviewed new save is separate intent. |
| A late rejection arrives after further typing. | The submitted snapshot and current draft remain separately recoverable. |
| An accepted edit removes the item from the active filter. | The person sees a meaningful saved receipt and can locate the result. |

Use independent writers and real service operations for concurrency claims. A single-browser optimistic demonstration establishes neither atomic checks nor a universal merge algorithm.
