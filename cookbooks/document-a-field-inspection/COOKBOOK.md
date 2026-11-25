---
id: "document-a-field-inspection"
title: "Complete a field inspection with reviewable evidence"
summary: "Combine a versioned checklist, measurements, annotated evidence, exceptions, offline draft recovery, and a reviewed handover report."
group: "Guide and coordinate work"
tags: ["inspection", "evidence", "handover"]
choices: ["Required observations and justified not-applicable outcomes", "Offline draft capture versus authoritative completion", "Working notes, reviewed report, and later amendments"]
capabilities: []
evidence: "explained"
related: ["guide-explicit-checkpoints", "capture-reviewed-evidence", "annotate-a-frame", "follow-location-progress", "import-for-review"]
sources: ["https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/CAPTURES.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/DURABILITY.md"]
---

# Complete a field inspection with reviewable evidence

Use this when a person visits a place or object and must leave an understandable record: checking a meeting room, inspecting installed equipment, or surveying a site. The outcome is a reviewed report that shows what was observed, what could not be checked, and what needs follow-up. A row of green checkmarks cannot provide that record by itself.

This guide composes checklist, evidence, and recovery decisions into a full inspection. Use a shorter note or photo request for a single observation. Where an inspection serves a regulated or safety-critical purpose, the domain's required procedure and authorized reviewer must define the criteria; a generic cookbook is not a certification policy.

## Prepare a task that can be carried into the field

Define the inspected asset/site, checklist revision, responsible person or role, and expected report audience. Each item needs a stable ID, a clear observation or question, acceptable response types, optional units, evidence expectations, and the rule for not-applicable or unable-to-inspect. Do not use completion status as a substitute for those definitions.

Show a preparation view with location/access notes, equipment needed, expected inputs, and a concise scope. Let the person inspect the checklist before starting. If a preflight download or local draft is available, verify it and state its limits. Opening the page once does not guarantee every route, file, model, or prior report is available offline.

| Item type | Useful input | Review consideration |
| --- | --- | --- |
| Presence/condition | Explicit choice and optional note. | “Not observed” differs from confirmed absence. |
| Measurement | Value, unit, source, and observed time. | Manual entry and instrument readings have different provenance. |
| Visual evidence | Reviewed photo and optional marker. | Source identity, framing, access, and retention. |
| Exception | Reason, affected item, and requested follow-up. | A skipped item must not look completed. |
| Repeated asset | Stable asset/item identity. | Duplicate labels or list order must not mix records. |

## Guide observation without fabricating completion

Begin an inspection instance tied to the reviewed checklist version. A compact item-by-item route can help mobile use; a sectioned overview may suit repeated work at one location. Both should show which items are untouched, in progress, observed, not applicable, or blocked, and which submissions are only local or queued.

For each item, show the criterion, input, evidence controls, and relevant prior observation when authorized. Keep prior values visibly historical; prefilling them as current can create false observations. A person may deliberately copy a stable description, but a new measurement should not inherit yesterday's reading without a clear provenance decision.

Let the person save partial work, switch sections, and return without losing notes. Provide **Unable to inspect** with a reason instead of forcing an invented answer. If a required item blocks finalization, explain the missing evidence and who can accept an exception. A valid exception policy may permit a report marked incomplete; it must not silently convert unknowns into passes.

## Capture evidence in the item's context

Bind each photo, annotation, or measurement to its item ID, inspection instance, checklist revision, and acquisition context before asynchronous work. Keep captured/observed time distinct from later server acceptance. If location is useful, make it optional where appropriate, retain only the required precision, and do not treat proximity as proof that the item was inspected.

Use [reviewed capture](../capture-reviewed-evidence/COOKBOOK.md) for camera/file input and durable media delivery. Show the actual outgoing image, allow retake or redaction, and preserve captions separately from pending submissions. A late photo result must not attach to whichever item is selected now. Annotations follow the exact source geometry described in [frame annotation](../annotate-a-frame/COOKBOOK.md).

Keep original observations separate from conclusions. A photograph may show a gap; “requires replacement” is an interpretation or follow-up decision. Let the reviewer disagree without altering the photo or its recorded measurement. Include an evidence count and any unavailable source explicitly in the report.

## Make offline work and reconnection intelligible

The field view should distinguish a local draft, a durable queued command, an accepted item update, and a reviewed inspection. Use the [public capture contract](https://github.com/werg/tendriller/blob/master/docs/CAPTURES.md) for saved media operations. If a storage transaction fails, keep the open preview and offer a deliberate save route; do not claim it will survive reload.

Bound local media storage and show practical constraints before a large batch exhausts it. Explain whether stopping the inspection leaves pending uploads to resume, discards only unsent candidates, or requires explicit cancellation. Discarding local queued work does not undo a request the service already accepted.

On reconnect, show an item-level reconciliation list. Retry saved operations with their original identity and signed intent. If the checklist, task, access, or asset changed, retain old observations and offer deliberate review. Do not automatically retarget a queued measurement to a new checklist item. Conflicting edits from two devices should show both values or use the chosen authoritative conflict policy.

## Review and hand over a coherent report

Before finalization, present the inspected scope, checklist revision, all item outcomes, measurement units, evidence references, exceptions, and outstanding delivery failures. Offer correction links back to each item. The report should make “not checked” easy to see, even if most items are complete.

Choose the report boundary explicitly. For a simple application, a reviewed immutable snapshot of accepted observations may be enough. If finalization must atomically lock several private records or apply an approval policy, use a deliberately installed trusted capability and verify its transaction; several browser calls do not create that guarantee.

The handover should identify the report revision, intended audience, follow-up owner/status where applicable, and evidence access. Sending or publishing the report is a separate deliberate action. A report prepared for one audience should not acquire raw photos, precise location, or private notes automatically. Retention must be checked for referenced media; storing a blob ID in report JSON is insufficient to keep bytes forever.

Later corrections create an amendment linked to the original report. Show which observation changed, why, and whether a previous conclusion is withdrawn. A task to repair an issue is distinct from evidence that the repair happened. Avoid closing follow-up work merely because the inspection report was delivered.

## Make the field interaction usable

Use readable contrast, large practical targets, clear text statuses, and keyboard alternatives for data entry and review. Provide a text/file route when the camera is unavailable. Avoid losing the active item when orientation changes or a photo route closes. Keep required instructions reachable without a hover interaction or a network-only help panel.

A summary should distinguish checklist coverage from quality or compliance: “18 observed, 2 unable to inspect” is more informative than “90% safe.” Domain judgments require their actual criteria and accountable review.

## Acceptance scenarios

Inspect two identically named assets and verify stable identity; rotate or change items during capture and verify correlation. Lose connectivity after several photos, fill local storage, and reconnect after a checklist revision: work remains visible with honest status and no silent reassignment. Test a required item that cannot be inspected, conflicting measurements, partial upload failure, and an amendment after report finalization. A reviewer should be able to trace each conclusion to its exact observation or explicitly missing evidence. These are proposed integration checks, not claims of a tested inspection deployment.
