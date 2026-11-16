---
id: "choose-data-model"
title: "Choose the right home for application data"
summary: "Match authority, ordering, lifetime, and privacy to each kind of information instead of putting everything in shared state."
group: "Keep work dependable"
tags: ["data-model", "authority", "retention"]
choices: ["Current value versus ordered history", "Authority, privacy, and record lifetime", "View checkpoints versus handled-agent-work checkpoints"]
capabilities: []
evidence: "explained"
related: ["recover-outdated-work", "collect-private-responses", "reconcile-concurrent-edits"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/EXPERIENCES.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/stream-view.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/model.mjs", "https://github.com/werg/tendriller/blob/2cbc6b9be59efad6fe8fdf3353e1858a8729f40e/contract/blobs.mjs"]
---

# Choose the right home for application data

Use this before adding application data. Different information has different owners and lifetimes; a single shared object is rarely the right home for every draft, measurement, command, and private answer. Begin with the question each record must answer.

| Mechanism | Good fit | What it does not establish |
| --- | --- | --- |
| Shared state | Current agreed value, selected range, public task progress. | A complete history, privacy between readers, or automatic conflict resolution. |
| Events | Something happened and a consumer needs to react. | That the consumer handled it, or that a repeated event is a new intent. |
| Streams | Ordered observations with explicit retention and cursors. | Infinite history, exact external execution, or processing acknowledgement from a callback. |
| Local draft | Unsent typing, selection, sketch, or temporary view choice. | Cross-device durability or current authorization to display cached private data. |
| Immutable bytes | A specific image, document, recording, or authored asset with verified length and digest. | A current named file, accepted application input, permanent retention, or participant-private access. |
| Shared-file reference | The current file at a canonical path, updated against its exact previous revision. | An immutable meaning for that path, a coherent multi-file page, or privacy from an obscure name. |
| Publication | One complete reviewed file graph and entry point served with its exact runtime. | That uploading the individual bytes has already changed the live page. |
| Private records | Authorized answers, assignments, or protected policy records. | Privacy if copied into shared state, notifications, or public summaries. |

## Adapt the model

For each field, identify the writer, readers, authoritative owner, ordering, lifetime, and failure behavior. Keep display state separate from domain state and local drafts separate from submitted snapshots. Choose stable IDs independently of position and mutable labels. Use revision or generation guards when stale writes could change the meaning of work.

A stream's cursor belongs to a particular consumer/materialized view. An agent's handled cursor advances after effects succeed; a chart's cursor advances after its model accepted records. Reusing one for the other can lose work. If only current values matter, use a deliberate latest-value model instead of retaining an unnecessary history.

Keep immutable content identity separate from the names that point to it. An annotation or approved document should name the exact bytes or file revision it reviewed; a mutable path alone can later resolve to different content. A named-file update and a publication switch have different authoritative revisions. A task generation protects application meaning across either operation; it does not replace their revision guards.

Choose byte retention deliberately. Unreferenced uploads have a bounded expiry whether a page or an agent created them; inspect the returned retention reasons and expiry instead of treating an upload as an archive. A live shared-file head, retained file history, publication, pin, or icon can keep an object. An arbitrary ID inside shared state is not itself a retention root. Equal digests can share physical bytes while their handles retain separate metadata and lifetime decisions.

Private policy belongs in an explicit trusted extension when the platform's ordinary access model is insufficient. Reading a cookbook does not install one. A browser hiding fields cannot enforce different readers.

## Verify

Walk through reload, offline edit, duplicate delivery, concurrent writers, revoked access, retention expiry, and task reset for each data kind. Ask what is authoritative after each failure. If two fields must change atomically, verify the chosen server operation supplies that transaction rather than relying on a sequence of browser calls. Document the smallest model that meets those requirements.
