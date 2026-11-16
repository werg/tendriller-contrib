---
id: "build-correctable-forms"
title: "Build forms people can complete and correct"
summary: "Choose progressive fields, validation, saved drafts, review, and submission recovery that preserve meaning and user-entered work."
group: "Design everyday interactions"
tags: ["forms", "validation", "drafts"]
choices: ["Single page or purposeful branching steps", "Local draft, authorized saved draft, or submitted snapshot", "Client feedback and authoritative acceptance"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "recover-outdated-work", "complete-accessible-interactions", "choose-data-model"]
sources: ["https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/CAPTURES.md", "https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/BROWSER_API.md"]
---

# Build forms people can complete and correct

Use a form when a task needs structured information that a person can review: an equipment request, intake questionnaire, inspection note, or change proposal. A good form makes required decisions clear, saves effort during correction, and distinguishes draft progress from authoritative submission. Begin by identifying the minimum information needed to act.

For a workspace equipment request, the core journey might be item, purpose, delivery preference, optional reference, review, and submit. A conversational prompt may be simpler when the information is highly variable. A form is useful when stable fields, explicit validation, comparison, or repeatable review reduce ambiguity.

## Choose structure from the decisions

| Structure | Good fit | Cost to consider |
| --- | --- | --- |
| One page | A small set of related fields. | Long forms can hide errors or overload the view. |
| Several steps | Distinct decisions with a meaningful order. | Back navigation, saved progress, and a complete review become necessary. |
| Conditional sections | Only some answers need additional detail. | Hidden values, changed branches, and validation scope must be explicit. |
| Repeated rows | Several items share the same fields. | Stable row IDs, clear totals, and per-row correction matter. |

Use stable field and row IDs independent of labels and order. Keep the form-definition version separate from the draft version and submitted request ID. Those identities help explain what changed when an old saved draft is reopened against a newer questionnaire.

Ask for optional information only when it has a clear use. Explain why a field is needed beside it. Labels, grouped inputs, and concise instructions should remain visible during editing; the [W3C forms tutorial](https://www.w3.org/WAI/tutorials/forms/) provides the underlying markup and feedback guidance. Do not make a person infer required fields from color or an unexplained asterisk.

## Let people enter incomplete work

An editable draft can be incomplete or temporarily invalid. Preserve the actual input string separately from a parsed value when parsing can change meaning. For example, a decimal separator, partial date, or leading zero may be intentional. Do not silently turn an ambiguous input into a plausible-looking different value.

Choose when feedback appears. Required-field warnings on an untouched first screen are often distracting. Field-level feedback after a relevant interaction can help; full submission validation catches omitted or cross-field information. Expensive asynchronous checks should identify the field value and request revision they checked, so a late response cannot reject a newer valid input.

Client-side feedback helps the person correct mistakes. Authoritative validation still belongs at the service or deliberately selected trusted policy when the rule protects shared state or external action. Hiding an option or disabling Submit is not an authorization boundary.

## Make branching reversible

Suppose choosing “delivery” reveals an address and choosing “pickup” hides it. Decide whether a hidden address is retained only as a local draft, removed from the submitted snapshot, or deliberately included for a stated purpose. Preserve useful work when switching back, but do not secretly submit irrelevant hidden answers.

When one answer invalidates another, explain the consequence before discarding meaningful work. A changed item category may make an accessory choice incompatible; show that the choice needs review rather than silently substituting an accessory. Stable row identity prevents removing one item from attaching its validation errors or uploaded reference to the next row.

Keep navigation understandable. Back should preserve current input. A step indicator should reflect actual completion, not only that the page was visited. Let the person review earlier answers before submitting, and make error links return to the right step and field.

## Save drafts with honest guarantees

Distinguish “In this tab,” “Saved on this device,” and “Saved to your authorized draft.” Do not show a generic saved checkmark before the relevant storage operation succeeds. Local storage can fail or be unavailable; retain the draft in memory and offer a deliberate export/copy path where appropriate. Cross-device resume requires an actual authorized server draft, not a browser-only cache.

Choose retention and audience for sensitive fields. A draft shared across devices must obey current access policy before display. Do not put private intake responses into public/shared state merely to simplify autosave. The [data-model guide](../choose-data-model/COOKBOOK.md) distinguishes storage homes and authority.

For concurrent shared-state draft edits, take a coherent `state.snapshot()` and use core's conditional `set` or `apply` against the reviewed record value or revision. Multi-field changes can commit in one batch; its original guards survive offline delivery. Show pending separately from accepted and retain the proposed values when a conflict asks for comparison. Use the [concurrent editing guide](../reconcile-concurrent-edits/COOKBOOK.md) to choose field conditions versus a global revision. Reopening a draft after a form-definition change should map known stable fields, flag incompatible values, and preserve unmapped input for review. Do not turn a new required field into a claim that an old submitted request was invalid when accepted.

## Review a coherent submission

Present the exact outgoing request in readable terms: item names, quantities, units, relevant choices, and included attachments. Show missing or conflicting values before the final action. Keep correction links beside each section and preserve focus when returning from an edit.

Submitting creates an immutable application snapshot with a stable request identity and relevant task/form revision. New typing belongs to another editable draft. If media is included, distinguish each attachment's capture/acceptance status from overall form readiness. Several independent accepted uploads do not make a multi-field application transaction atomic.

Use the public command interface for the semantic submission and [reviewed capture](../capture-reviewed-evidence/COOKBOOK.md) for media. For protected work, keep the captured generation and original command identity on retry. The [public capture contract](https://github.com/werg/tendriller/blob/367c756a382781effb947acb6a8c6ae43f5a91f1/docs/CAPTURES.md) distinguishes accepted, queued, and rejected outcomes. An accepted request still may await human or agent processing; call it completed only when that separate result exists.

## Make correction a first-class outcome

After an explicit failed submit, show a summary that identifies affected fields and the action needed. Preserve every entered value that can be safely retained. W3C's [error-identification guidance](https://www.w3.org/WAI/WCAG22/Understanding/error-identification) calls for identifying and describing detected input errors in text. Field hints, focus, and linked summary entries should work together without forcing repeated blind submissions.

A transient delivery failure can retry the original snapshot. A stale-generation or changed-policy rejection needs deliberate review before creating new work. Do not silently refresh the generation and submit a different meaning. If the person already started another request, show the rejected snapshot separately rather than restoring it over the current draft.

For correcting an accepted request, choose an amendment or replacement operation with clear version linkage. An edit to a local draft does not automatically alter an earlier accepted record. Explain what the reviewer will see and whether earlier versions remain available. Withdrawal, deletion, and changing a field are different operations.

## Acceptance scenarios

Test untouched required fields, ambiguous numeric/date input, a stale asynchronous validator, switching branches twice, and removing the middle repeated row. Expected results are specific errors, preserved original input, and stable identity. Fail autosave, reload an older form version, and open the same draft on two devices: the UI must explain recovery and conflicts. Submit while offline, then type a new draft and delay rejection of the first: both remain recoverable. Finally, complete the full correction and review flow with keyboard and zoom. These are proposed checks; a form is not exercised until its actual authored implementation passes them.
