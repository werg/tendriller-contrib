---
id: "separate-evidence-interpretation"
title: "Keep evidence and interpretation separate"
summary: "Preserve original observations while allowing conclusions, labels, and explanations to evolve."
group: "Collect evidence"
tags: ["evidence", "provenance", "notes"]
choices: ["Append-only note or structured observation record", "Original evidence versus editable interpretation", "Retention, search coverage, and export scope"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "reconcile-concurrent-edits", "ask-about-evidence"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/AGENT.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/model.mjs"]
---

# Keep evidence and interpretation separate

Use this for field notes, inspections, interviews, or experiments where later reasoning may change without changing what was observed. The useful outcome is a record that can answer both “What did we see?” and “What did we conclude then?” A simple append-only note may be enough for casual work. Structured observations become valuable when source review, corrections, search, collaboration, or export matter.

Imagine an equipment inspection. A person records a sound, a photograph, and a measured temperature, then writes “bearing wear suspected.” A later review might reject that interpretation. The observation should remain attributable, while the conclusion can be revised with an explanation. Treating the whole entry as one mutable paragraph would hide the difference.

## Build a notebook journey around evidence

1. **Orient.** Show the current investigation or task, collection policy, and whether a note is local or shared. Offer a quick text entry before requiring structured detail that the task may not need.
2. **Record.** Capture the original observation with source identity, acquisition time, and units where meaningful. Add a coarse place label, precise location, or no location according to the task's need.
3. **Review.** Let the person inspect text and media before sending. If a photograph contains unrelated private material, offer recapture or a clearly identified derivative rather than silently altering the original.
4. **Accept.** Bind the submitted snapshot to the task and source version. Show queued, accepted, and rejected states accurately while preserving a new local draft.
5. **Interpret.** Add a hypothesis, tag, confidence explanation, or summary as a distinct editable layer linked to observation IDs.
6. **Compare.** Put conflicting observations or interpretations side by side. A disagreement is information to review, not a reason to overwrite one source.
7. **Correct.** Create a visible correction with its reason and relationship to the original. Flag downstream conclusions that depended on the corrected fact.
8. **Share or archive.** Choose the exact scope, authorization, and retention of the result. A concise report and an evidence archive serve different purposes.

A mobile quick-entry view can prioritize speed, a table can support batch review, and a chronological or spatial view can expose patterns. Preserve the same source relationships without imposing one notebook layout.

## Decide what stays original

| Record kind | Useful contents | Revision behavior |
| --- | --- | --- |
| Observation | Stable ID, acquisition time, source, raw value/text, units, evidence reference | Preserve the submitted meaning; corrections remain attributable. |
| Interpretation | Claim, linked observations, reasoning, uncertainty, author/revision | May evolve without rewriting its evidence. |
| Correction | Target source/revision, corrected assertion, reason | Explicitly changes what a later reader should rely on. |
| Derived artifact | Summary, transformed image, extracted text, calculation | Names the source versions and transformation assumptions. |
| View state | Search, map extent, selected entry, local sorting | Changes presentation without modifying the underlying record. |

These are application-owned concepts, not a required schema. Keep IDs independent of list position, title, or a mutable filename. An interpretation citing “photo.jpg” can become ambiguous when that path changes; reference the exact content or file revision that was reviewed. A digest identifies bytes but does not prove source truth, authorization, or permanent retention.

Record time carefully. Acquisition time, upload time, and interpretation time can differ, especially after offline work. If a device clock is uncertain, preserve that qualification. Do not sort an offline observation into a misleading chronology solely by its upload receipt. Units and measurement conditions should travel with numeric values so later summaries cannot silently reinterpret them.

## Choose correction and deletion policy

For an obvious transcription error, a correction can retain the original value and the person's revised value with a reason. For an image, crop or redaction creates a derivative; describe its source and omitted region. For a mistaken task association, move or relink the observation only through an intentional operation that preserves enough history to explain existing references.

“Immutable evidence” does not mean “keep everything forever.” Retention, consent, access changes, and deletion requirements can justify removing bytes. Represent the resulting state honestly: source unavailable, deliberately deleted, retention expired, or authorization unavailable. A retained summary is not a substitute for the missing original and should not claim that verification is still possible.

Choose where each record belongs. Ordinary shared state is visible under its actual access model. Private notes or participant-specific interviews need a suitable authorized storage boundary, not an obscure path or hidden panel. Check permissions for archived sources and exports as well as active views. Never infer that an arbitrary blob ID embedded in a note keeps the bytes retained.

## Make interpretation review practical

Let a reviewer open the exact evidence from a claim, inspect what the claim adds, and record agreement, disagreement, or a revised explanation. Keep the distinction between an observed fact and an inferred cause visible in ordinary language. A confidence label should explain the evidence and gaps; do not attach a precise-looking percentage without a justified meaning.

When a source changes through a correction, identify affected interpretations using their source references. Offer “Review needed” rather than automatically rewriting every conclusion. Some corrections are irrelevant to a particular claim; the reviewer can acknowledge that with a reason. The history should show what the agent believed at the time and what was later revised without treating either as an instruction to execute external work.

Useful features include linked observations, a contradiction view, saved review filters, and a draft shelf for interrupted field work. A fixed hundred-entry limit was an example choice; set display, storage, retention, and export budgets separately. Search should state which fields and retained range it covers. No matches does not establish that no observation ever existed.

## Keep the experience accessible and usable in the field

Allow meaningful text descriptions for photos, sketches, and sound. Avoid making a map the only route to an entry. Provide readable timestamps and units, large enough quick-entry controls, and a way to record uncertainty without an elaborate form. Do not require precise location when a place label is sufficient.

Preserve local drafts through temporary disconnection where the chosen storage permits it, and state the durability limit. Keep pending submissions tied to their original task. If a reset rejects old work, offer a deliberate review into the new task rather than silently changing the source context. Access changes must invalidate pending private reads so a late response cannot restore cleared evidence.

## Verify the provenance chain

| Scenario | Expected observation |
| --- | --- |
| Edit a hypothesis or tag. | Original observations and their submitted versions remain unchanged. |
| Correct a measured value or its unit. | The correction is attributable and dependent interpretations become reviewable. |
| Replace a named image file. | Earlier annotations still identify the exact previously reviewed bytes or report their unavailability. |
| Delete or expire source media. | The entry explains the missing evidence without fabricating a recoverable original. |
| Upload an old offline observation. | Acquisition and acceptance times remain distinct and chronology states its uncertainty. |
| Search a bounded retained subset. | Coverage and missing history are visible; empty results are not overstated. |
| Export a report and evidence package. | IDs, units, timestamps, corrections, source scope, and limitations survive appropriately. |
| Change identity during an evidence fetch. | Old data cannot repopulate a view that is no longer authorized. |

This guide is explained reasoning. A polished notebook screen alone does not establish provenance, private storage, or a retention guarantee; verify those against the actual selected operations.
