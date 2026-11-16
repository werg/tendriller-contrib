---
id: "reconcile-concurrent-edits"
title: "Maintain a shared editable collection"
summary: "Choose stable identities and explicit conflict behavior for additions, edits, ordering, and deletion."
group: "Keep work dependable"
tags: ["concurrency", "drafts", "collections"]
choices: ["Append-only, field patches, revision guards, or human merge", "Stable identity separate from ordering", "Deletion, optimistic edits, and stale-draft review"]
capabilities: []
evidence: "explained"
related: ["recover-outdated-work", "adapt-without-losing-work", "choose-data-model"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/list.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/ui.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/model.mjs"]
---

# Maintain a shared editable collection

Use a shared collection for notes, packing items, tasks, or decisions edited by several people or devices. The outcome is not merely synchronized text: people should understand whose changes were accepted, what remains local, and how to resolve competing intent. A single shared note can be simpler when concurrent edits are rare and manual review is acceptable. Silent last-write-wins is an application policy with consequences, not a neutral default.

Consider two people preparing an event. One edits an item's quantity while another changes its supplier; later, both change the quantity. The first pair may combine naturally, but the second needs an explicit rule. A reorder or deletion during either edit must not redirect a pending command to another item.

## Make the everyday editing loop complete

1. **Read.** Load current authorized records and show connection/freshness separately from saved state. A cached collection may be useful but must not masquerade as current authority.
2. **Start a draft.** Capture the record ID and the base value or revision used for the edit. Keep the draft separate from accepted shared state.
3. **Edit.** Keep the input stable while remote changes arrive. Mark relevant remote changes without overwriting local typing.
4. **Submit.** Capture an immutable edit snapshot and its concurrency context. Optimistic rendering can show the proposed value with a pending indicator.
5. **Accept or reconcile.** On acceptance, reconcile by command and record identity. On conflict, show the base, current accepted value, and proposed value, with a meaningful choice to merge, discard, or revise.
6. **Continue.** New typing belongs to a new draft. A late outcome for the earlier submission must not erase it.
7. **Leave and return.** Restore eligible drafts under the current identity and task, then compare with current authority before resubmission.

A dense spreadsheet-like interface, a mobile item editor, and an append-only notebook can all use this loop. They need not share a renderer or schema.

## Choose how edits combine

| Model | Useful property | Tradeoff and boundary |
| --- | --- | --- |
| Append-only records | Independent contributions rarely conflict and history is clear. | Corrections need revision links and an explicit current-view rule. |
| Field-level patches | Unrelated fields can be changed independently. | Two writes to the same field still need an agreed policy. |
| Revision precondition | A stale edit is rejected before replacing newer work. | The authority enforcing the precondition and the recovery interface must exist. |
| Explicit human merge | Competing intent remains inspectable. | Review costs attention; reserve it for meaningful conflicts. |
| Last-write-wins | A disposable shared preference is easy to update. | Define ordering and expose that concurrent intent may be lost; avoid it for important records. |

A browser-side comparison is not an atomic server revision check. If the chosen core operation does not implement a record-level compare-and-set, choose an available protected operation or a deliberately reviewed trusted policy that does. Scope generations protect against resets and rebinding; they do not automatically implement every field-merge rule an application needs. Consult [the data-model guide](../choose-data-model/COOKBOOK.md) before assuming a transaction exists.

For unrelated fields, merging can still be invalid when the fields participate in one constraint. Quantity and total price, or start and end time, may need validation together. Define the invariant and enforce it at the authority that accepts the combined state rather than repairing an invalid pair afterward in the UI.

## Separate identity, order, and visibility

Give every record a stable ID independent of position and display text. Sorting by name or dragging an item changes order, not identity. Pending writes, comments, receipts, and focus anchors should use the record ID. A row number can help navigation but must not address an edit.

Choose an ordering policy: explicit order keys, an ordered relation maintained by a transaction, or a derived sort such as due date plus a stable tie-breaker. Concurrent drag operations need a declared result. Do not assume two replacement arrays combine safely. Offer keyboard move actions when drag-and-drop is available.

Deletion also needs a policy. Immediate removal is simple for disposable items. Tombstones prevent stale writes from quietly recreating a deleted record. Archival history helps review but adds retention and access responsibilities. A user editing an item deleted elsewhere should see “This item was removed” and retain a recoverable draft; “Restore as new item” can be a deliberate separate action if allowed.

Filtering and completed-item hiding are view choices. An item that leaves the visible list after an edit is not necessarily deleted. Provide a receipt and a route to the accepted item, especially when its new value no longer matches the current filter.

## Design a humane conflict resolution

Show enough context to resolve meaning: record title, changed field, old accepted value, current accepted value, local proposal, and relevant update attribution if appropriate. Avoid a raw JSON conflict as the only interface. For text, a side-by-side comparison may be safer than a complex automatic merge. For a quantity, an explicit numeric choice is usually clearer.

Distinguish retry from a new decision. Retry keeps the original command ID and captured guards. Choosing a merged value creates new intent after reading current authority. Never silently refresh a stale command's generation so that it applies to a newly reset task.

If two people repeatedly conflict, offer a lightweight editing indication or an explicit claim policy when it helps. Presence is advisory unless an actual authoritative lock exists. A label saying “Sam is editing” cannot guarantee exclusion, and a disconnected editor needs a defined expiry or release policy. Avoid locking an entire collection when only one record needs coordinated work.

## Bound history and preserve useful recovery

Choose which revisions and draft snapshots remain, for how long, and who can read them. A completed checkbox may be a mutable preference, an append-only event, or a reviewed task fact; make that choice before implementing “Undo.” Undo should express a new intentional correction against current state, not blindly restore an obsolete full document.

Export current records with their IDs and relevant revision/provenance fields. If history is included, label its coverage and redaction policy. Local drafts are not automatically part of a shared export. An access change should clear private editor surfaces and invalidate pending reads as well as writes.

## Verify competing intent

| Scenario | Expected observation |
| --- | --- |
| Two writers edit independent fields. | The declared policy combines them without dropping an unrelated accepted change. |
| Both change the same quantity from the same base. | One chosen conflict policy applies visibly; neither draft disappears silently. |
| An item is reordered while its edit is pending. | The edit affects the same stable ID and the receipt identifies it. |
| Another writer deletes the edited item. | A stale edit does not resurrect it; recovery requires an intentional action. |
| A scope resets while one device is offline. | Old work retains its original guards and is rejected rather than rebased silently. |
| An acknowledgement is lost. | Retrying recovers the original outcome without adding a duplicate item. |
| A late rejection arrives after further typing. | The submitted snapshot and current draft remain separately recoverable. |
| An accepted edit removes the item from the active filter. | The person sees a meaningful saved receipt and can locate the result. |

Use independent writers and real service operations for concurrency claims. A single-browser optimistic demonstration establishes neither atomic checks nor a universal merge algorithm.
