---
id: "export-and-restore-work"
title: "Export, inspect, and restore portable work"
summary: "Make exports explicit about their contents and limits, then preview identity mappings and conflicts before restoring reviewed work."
group: "Keep work dependable"
tags: ["export", "restore", "provenance"]
choices: ["Readable report versus restorable data versus portable page", "Complete evidence versus explicitly bounded export", "New copy versus guarded restore into existing work"]
related: ["import-for-review", "publish-coherent-updates", "choose-data-model"]
sources: ["https://github.com/werg/tendriller/blob/111bde967a1831fb16a33201acc5c67b624fd360/docs/PROTOCOL.md", "https://github.com/werg/tendriller/blob/111bde967a1831fb16a33201acc5c67b624fd360/docs/DURABILITY.md", "https://github.com/werg/tendriller/blob/111bde967a1831fb16a33201acc5c67b624fd360/docs/tools/CLI.md"]
capabilities: []
evidence: "explained"
---

# Export, inspect, and restore portable work

Use this when people need to keep a record, move work to another task, or recover from an intentional saved copy. Distinguish a readable report, structured application data, and a complete portable page. A CSV of visible values may be enough for analysis; it cannot automatically restore annotations, evidence bytes, authority, or an application's interaction history.

## Begin with what the recipient must be able to do

For a field notebook, a person may want a report to share, a data file for analysis, or a reviewed copy to continue later. Offer those as meaningful choices with a contents preview, rather than a generic Download button whose meaning is unclear. State the selected time range, included records, omitted private information, evidence availability, and whether the export is complete or bounded.

| Export purpose | Include deliberately | Do not imply |
| --- | --- | --- |
| Human-readable report | Selected findings, evidence references, units, provenance, and limitations. | A machine-restorable backup or complete underlying history. |
| Analysis dataset | Defined schema, units, record/run identities, missing-value policy, and retained range. | That display filtering or aggregation preserved raw observations. |
| Application snapshot | Versioned domain data and the references needed to interpret it. | That credentials, live receivers, or authority travel with it. |
| Portable page | Exact authored entry/file graph and explicitly chosen application content. | That uploading bytes has already switched the destination page. |

Prefer the smallest format that meets the task. A restorable format costs more to maintain than a report because it needs validation, identity mapping, and failure policy. Do not introduce an old-system migration or compatibility layer without an actual supported format requirement; reject unknown versions clearly.

## Design an inspectable export

A proposed application manifest can name its format/version, creation time, source identity, selection/range, included record count, transformation versions, file list and digests, and omissions. These are application choices, not new core fields. Keep the manifest readable enough that a person or another implementation can understand what survived.

Preserve stable record identities and exact evidence identity. A mutable filename alone cannot prove which photograph or document a conclusion reviewed. Include bytes when the recipient needs independent access and is authorized to receive them; otherwise mark an external reference and its access/retention dependency. A checksum establishes byte consistency, not trustworthiness or permission.

Be explicit about incompleteness: expired history, filtered rows, evicted raw samples, unavailable attachments, or omitted private records. A successful export can still be partial, but the preview and file should agree about that limitation. Include an accessible summary rather than relying on a chart image to communicate the contents.

Treat export as a data-disclosure action. Review the recipient audience, metadata, comments, hidden fields, and embedded filenames. Remove credentials and unnecessary private context. For CSV or spreadsheet-bound output, preserve text fields intentionally so untrusted source text is not accidentally interpreted as a formula; choose and document an appropriate escaping or text-typing policy for the target format.

## Validate before offering a restore

Imported files are untrusted input. Bound encoded and decoded size, record counts, nesting, file counts, and individual byte objects. Validate paths, types, required identities, and digest/length claims. Reject path traversal, duplicate logical paths, missing required entries, and unsupported versions before changing destination state. Do not execute embedded scripts as part of a data preview.

Show an inspection summary: source/version, contents, record counts, exact evidence availability, transformations, omissions, and validation failures. A malformed field should identify its location and consequence without dumping sensitive contents. If partial import is supported, make selection and dependency consequences explicit; a reference to an omitted record must not quietly attach to an unrelated destination record.

Separate three actions: inspect, stage, and apply. Staging must not be presented as a completed restore. Let the person cancel or revise the mapping while the live destination remains intact.

## Choose copy or restore and resolve identity

A new copy should create a new application task identity where appropriate while preserving provenance to the original. Restoring into existing work requires a deliberate collision policy: replace reviewed records, merge under a defined rule, keep both with new identities, or reject conflicts. Never infer “same item” solely from an editable title.

Preview the changes per affected object and count creates, updates, conflicts, skips, and missing dependencies. For evidence and annotations, preserve the exact source revision relationship even if destination names differ. If the destination changed during review, show the conflict and require a fresh reviewed command rather than silently refreshing its guards.

A portable page restore has core-specific guarantees. Publication, imported shared-file heads, and restored state must obey the current guarded operation and atomic publication contract. Capture the destination head and relevant file revisions before asynchronous transfer; a publication version number alone is not a concurrency guard. Use the current public tooling and [protocol](https://github.com/werg/tendriller/blob/111bde967a1831fb16a33201acc5c67b624fd360/docs/PROTOCOL.md), not a browser loop that claims equivalent atomicity.

## Reestablish authority and live services

Portable content does not transfer owner credentials, device identities, authoritative scope bindings, private workflow records, active leases, notification intents, or handled receiver checkpoints as ordinary application JSON. Core bundle export/remix explicitly omits operational consumer state. Explain these omissions and identify what must be configured or authorized at the destination.

A restored page may render while its agent receiver, optional trusted workflow, or source collector is unavailable. Show those readiness states separately and verify them before promising a working live experience. Reauthorize access to private evidence; a copied ID or digest is not a grant. Do not restart sensors, timers, or external actions merely because the source snapshot mentioned them.

## Close the restore with a receipt

After apply, show the actual destination identity, accepted counts, unchanged/skipped items, unresolved references, and required setup. Preserve a bounded import receipt that links the reviewed manifest to the result. If the reply is lost, reconcile the original operation before applying a second copy. Removing a staged import or downloaded file should describe only what that action actually removes.

Where rollback is offered, define its scope. Restoring earlier data is new guarded work and may conflict with edits made since import. It does not undo external messages or other side effects. A separate reviewed copy is often easier to reason about than overwriting a live task.

## Verify portability rather than the download button

| Scenario | Expected observation |
| --- | --- |
| Export after retention or display eviction | Preview and file state the actual retained range and omissions. |
| Missing evidence bytes or bad digest | Validation identifies the unavailable/corrupt object before apply. |
| Unknown version or unsafe path | Import rejects clearly without changing the destination. |
| Destination changes during review | Guarded apply rejects the stale intent; no silent overwrite. |
| A colliding title belongs to a different record | Identity mapping keeps them distinct or asks for explicit resolution. |
| Apply succeeds but the reply is lost | Reconciliation finds the original outcome instead of duplicating the import. |
| Portable content lacks live authority | The restored page explains setup requirements and does not fabricate readiness. |
| Restore is tested into a fresh destination | The promised data and evidence can actually be interpreted independently. |

A restore rehearsal is the meaningful evidence for a restorable format. Successfully downloading a file establishes only that bytes were produced.
