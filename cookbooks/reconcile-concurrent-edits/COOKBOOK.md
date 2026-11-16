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

Use a shared collection for notes, packing items, tasks, or decisions edited by more than one person or device. A single shared text field may be simpler when concurrency is rare and a conflict can be reviewed. Silent last-write-wins is a policy choice, not a neutral default.

## Choose how edits combine

| Model | Useful property | Tradeoff |
| --- | --- | --- |
| Append-only records | Independent contributions rarely conflict; history is clear. | Corrections and current-view selection need explicit revision links. |
| Field-level patches | Unrelated fields can change independently. | Concurrent edits to the same field still need conflict handling. |
| Revision precondition | Rejects a stale edit before it overwrites newer work. | The interface must preserve the draft and support review/rebase. |
| Explicit human merge | Makes conflicting intent visible. | Adds interruption, so use it where the meaning warrants review. |

Use stable record IDs independent of array position or display text. Keep ordering separate from identity; moving an item must not make a pending edit affect a different item. Choose deletion semantics: immediate removal, tombstone, or archival history. A stale edit should not accidentally resurrect a deleted record.

## Adapt the plan

Store local drafts separately from acknowledged shared state. Show optimistic changes only with a pending indicator and a defined rejection path. Capture the relevant revision or generation before sending a protected command and retain it on retry. When a conflict arrives, keep the submitted snapshot and current draft distinguishable; fetch current authority and offer an intentional merge.

Choose whether a completed/ticked item is a new event or a mutable field. If ordering matters, use explicit stable order keys or a deliberate transaction rather than hoping array indexes remain stable. Bound history and explain export/retention choices.

## Verify

Run two independent writers editing different fields, the same field, and an item one deletes. Reconnect an offline edit after a generation reset. Check a reordered list while an edit is pending, a retry after lost acknowledgement, and a late rejection after new typing. The desired outcome is preserved intent and visible conflict, not a universal merge algorithm.
