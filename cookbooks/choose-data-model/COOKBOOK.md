---
id: "choose-data-model"
title: "Choose the right home for application data"
summary: "Match authority, ordering, lifetime, and privacy to each kind of information instead of putting everything in shared state."
group: "Keep work dependable"
tags: ["data-model", "authority", "retention"]
choices: ["Current value versus ordered history", "Authority, privacy, and record lifetime", "View checkpoints versus handled-agent-work checkpoints"]
capabilities: []
evidence: "explained"
related: ["recover-outdated-work", "collect-private-responses", "reconcile-concurrent-edits", "export-and-restore-work"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/EXPERIENCES.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/stream-view.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/model.mjs", "https://github.com/werg/tendriller/blob/2cbc6b9be59efad6fe8fdf3353e1858a8729f40e/contract/blobs.mjs", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/PROTOCOL.md"]
---

# Choose the right home for application data

Use this before adding application data. Different information has different owners and lifetimes; one shared object rarely serves every draft, measurement, command, and private answer. Begin with the person's task and the question each record must answer. A one-person checklist may need only a local draft and an agreed progress value. Add history, private records, and immutable evidence when their distinct guarantees matter.

## Work backward from a real journey

Consider a field inspection: a person drafts a note, attaches a photograph, submits an observation, receives an interpretation, and later corrects the conclusion. On reopening the page they should understand what was saved, what remains private to this device, and what another person can see. That experience needs several records, even if its interface is one form.

| User-visible thing | Candidate home | Identity and recovery question |
| --- | --- | --- |
| Unsent note and selected photo | Local draft, with a disclosed persistence policy | Can this device restore it, and may this reader still see it? |
| Submitted observation | Durable event and application receipt | Which exact snapshot was accepted, and is its follow-up still pending? |
| Current agreed inspection status | Shared state | Who may change it, and which revision or generation was reviewed? |
| Original photograph | Immutable bytes with an intentional retention reference | Which bytes were reviewed, and how long will they remain available? |
| Latest editable report | Shared-file reference | Which previous path revision does an edit replace? |
| Private reviewer assignment | Authorized private record when the policy requires it | Can the service enforce its reader set? |
| Reading position or expanded panel | Local view preference | Would losing it change domain meaning, or merely convenience? |

These are example choices, not a common inspection schema. If a task needs no ordered replay, do not create a stream merely because another application uses one. If the record must be private, a different tab or an obscure state key is insufficient.

## Match the mechanism to the guarantee

| Mechanism | Good fit | What it does not establish |
| --- | --- | --- |
| Shared state | Current agreed values and atomic, conditional batches over them. | Complete history, privacy between readers, or automatic conflict resolution. |
| Events | Something happened and a consumer needs to react. | That the consumer handled it, or that repeated delivery is new intent. |
| Streams | Ordered observations with retention and cursors. | Infinite history, exact external execution, or acknowledgement from a callback. |
| Local draft | Unsent typing, sketch, or temporary view choice. | Cross-device durability or current authorization for cached private data. |
| Immutable bytes | A specific image, document, or asset with verified length and digest. | A current named file, accepted application input, or permanent retention. |
| Shared-file reference | Current file at a canonical path, updated against its previous revision. | Immutable meaning for that path, coherent multi-file publication, or privacy. |
| Publication | Complete reviewed file graph and entry served with its exact runtime. | That individual uploads already changed the live page. |
| Private records | Authorized answers, assignments, or protected policy records. | Privacy after copying them into shared state, logs, or public summaries. |

For each kind of information, record its writer, readers, authoritative owner, ordering, lifetime, and failure behavior. A compact design worksheet should also name the unit, schema version when needed, maximum size, and deletion policy. Use stable IDs independent of position and editable labels. Keep application state vocabulary local to the page; familiar names such as `session` do not activate server behavior.

## Make saving legible

Display persistence at the level the person cares about: “Draft on this device,” “Submission queued,” “Accepted,” and “Awaiting review” have different meanings. Do not show a global green “Saved” indicator while a selected photo is only in memory or its semantic submission was rejected. Associate failures with their object, preserve the draft, and offer a useful next action.

A submitted snapshot must remain separate from later typing. When acknowledgement arrives, clear only the accepted snapshot. An interpretation can change without rewriting its original evidence; link it to the exact evidence revision and show superseded conclusions. For two or more shared-state changes that must commit together, use core's `state.apply(ops, options)` batch. If the effects span another authority, use its actual transaction or model an explicit intermediate state.

Choose display state separately from domain state. Changing a chart filter or opening a section should not overwrite an agreed decision. For collaboration, distinguish a personal filter from a deliberately shared selection. Announce save and conflict transitions accessibly without repeatedly stealing focus; retain labels and error text when a form rerenders.

## Use core's concurrency primitives directly

The [browser state API](https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md) separates a useful local view from an authoritative review snapshot. `state.get()` includes pending ordinary writes; `state.revision` alone does not make that view a coherent server snapshot. Use `await state.snapshot()` to obtain matching `{state, rev, scopes}` while connected. Keep that observation with the draft being reviewed; a later save must not silently substitute newer values or scope generations.

`set`, `delete`, `patch`, and `apply` accept `conditions` and `expected_revision`. Conditions check exact JSON values or presence against one server snapshot before any batch mutation. Guard an item's value when unrelated items may change independently. Use the global revision when any intervening shared-state write must require review, including a value that changed and later returned to its original value. All supplied conditions are checked together, and their read paths participate in scope-generation protection alongside write paths. Capture relevant `expected_generations` from the reviewed snapshot or the task's reviewed scope context.

Missing and null have different meanings. Arrays are whole values, and an explicit path cannot silently replace an existing array, scalar, or null ancestor with an object. Use literal array paths for keys containing dots. Deliberately replacing a parent is an explicit `set`; a merge `patch` follows its documented replacement and null-deletion semantics. These are core semantics to design around, not separate rules each page should reimplement.

A conditional write stays pending until accepted; it does not claim optimistic ownership or approval. A conflict leaves every covered value unchanged and returns an actionable result. The same command's accepted or state-conflict receipt survives retries. Keep the user's proposed change for a new decision instead of automatically upgrading its guards. These optional concurrency checks do not restrict another authorized writer's operations or enforce arbitrary domain policy; additional permission and business rules still belong at a trusted boundary.

## Preserve identity through history and retention

A stream cursor belongs to one consumer or materialized view. An agent's handled cursor advances after effects succeed; a chart's cursor advances after records enter its model. Reusing either for the other can lose work. If only current values matter, choose a deliberate latest-value model and explain that earlier samples are not retained.

Keep immutable content identity separate from mutable names. An annotation or approved document should name the bytes or file revision it reviewed, because a path can later resolve to different content. A named-file update and a publication switch have different authoritative revisions. A task generation protects application meaning across these operations; it does not replace their revision guards or grant permission.

Unreferenced uploads have bounded expiry whether a page or agent created them. Inspect returned retention reasons and expiry instead of treating an upload as an archive. A live shared-file head, retained file history, publication, pin, or icon can retain an object; an arbitrary ID inside shared state is not itself a retention root. Equal digests can share physical bytes while their handles retain separate metadata and lifetime decisions. Explain what a delete action removes, what referenced material remains, and whether restoration is possible.

Private policy belongs in a deliberately installed trusted extension when ordinary access rules are insufficient. Read the [public core entry](https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/agent.md) and verify the deployed capability; reading this guide installs nothing. Minimize cached private content and reauthorize before restoring it after identity changes.

## Verify the model through user outcomes

| Scenario | Expected observation |
| --- | --- |
| Reload after drafting but before submission | Restore only data covered by the stated draft policy; make any lost in-memory attachment explicit. |
| Acceptance arrives after a new note is typed | The original snapshot receives its receipt; the new note remains intact. |
| Another writer changes the report | The stale update is rejected or reconciled under an explicit policy; no silent overwrite. |
| Photograph retention expires | Show unavailable evidence with its known identity; do not invent or substitute an image. |
| Reader loses access | Cached private material cannot restore itself into the visible page. |
| Task resets while a command is queued | The original command remains tied to its original generations and fails visibly if stale. |
| A two-part save fails halfway | The real transaction rejects both, or the documented intermediate state remains recoverable. |

Trace each outcome to an authoritative record and an available recovery action. That exercise usually reveals whether the model is sufficient before more fields or mechanisms are added.
