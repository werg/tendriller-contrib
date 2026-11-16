---
id: "adapt-without-losing-work"
title: "Adapt an interface without losing work"
summary: "Choose ordinary DOM, framework state, or declarative rendering while preserving drafts, focus, and stable task identity."
group: "Keep work dependable"
tags: ["adaptation", "accessibility", "drafts"]
choices: ["Ordinary DOM, framework state, or a narrow declarative model", "Logical identity versus task/question identity", "In-place reconciliation or a deliberate disruptive update"]
capabilities: []
evidence: "explained"
related: ["reconcile-concurrent-edits", "publish-coherent-updates", "capture-reviewed-evidence"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/ui.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/ui-schema.json", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/adaptive-checkin/index.html", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/test/continuity.spec.ts"]
---

# Adapt an interface without losing work

Use interface adaptation when an agent changes a page as the task evolves: adding a follow-up question to an inspection, switching a planning table into a focused task, or replacing a provisional recommendation with reviewed choices. The useful outcome is a better next action with the person's current work intact. A new layout does not justify discarding an unsent draft, selection, drawing, or pending submission.

For a short, stable form, ordinary DOM updates are usually sufficient. A framework can clarify a complex editor's transitions. A narrow declarative model can help when agents repeatedly edit the same family of fields, but its schema and renderer become application responsibilities. The retired eleven-block, forty-block-bound model was one example, not the cookbook format or a core requirement. Prefer the smallest structure that makes identity and recovery explicit.

## Walk through an adaptive check-in

Consider a technician writing a note about an inspection. The agent receives an earlier measurement and adds a request for a photograph while the technician is still typing. The page should show the new request without replacing the note field, moving its caret, or implying that the unfinished note was sent.

1. **Orient.** Show the current inspection and question, the saved revision, and whether this device has an unsent draft. Make the task identity visible when two inspections can look similar.
2. **Edit.** Keep local text, selection, attachments, and drawing strokes in a draft associated with that logical question. The saved value remains a separate baseline.
3. **Receive change.** Classify the change: cosmetic label, reordered field, new optional field, changed question meaning, removed field, or new publication. Cosmetic updates can usually apply immediately; meaning changes need a deliberate transition.
4. **Explain.** Use a restrained notice such as “A photo is now requested; your note is unchanged.” For a changed question, offer “Review new question” and “Keep previous draft.” Do not announce every remote keystroke through an assertive live region.
5. **Send.** Capture the submitted snapshot before asynchronous work. Display pending, queued, accepted, or rejected status for that snapshot while allowing a new draft where appropriate.
6. **Recover.** A late rejection refers to the old submission. It must not overwrite the text written since then. Offer to compare or copy the rejected draft into a deliberate new response.

The same reasoning supports a dense desktop editor and a single-question phone view; neither needs identical markup or navigation.

## Keep four kinds of state separate

| State | Identity and owner | What a render may do |
| --- | --- | --- |
| Domain state | Authoritative task, question, and revision | Display new accepted facts; do not silently reinterpret a draft. |
| Edit buffer | Local task/question ID and draft revision | Preserve unsent values and composition until the person changes or discards them. |
| Pending submission | Immutable submitted content plus its command context | Update its outcome; never substitute a newer draft into a retry. |
| View state | Focus, selection, scroll anchor, expanded panels | Restore only when the destination still represents the same logical object. |

Use stable logical IDs independent of array positions, labels, and CSS selectors. A field named “answer” in a new question must not silently receive the old question's draft. Conversely, changing the wording of a label need not create an unrelated field if its meaning is unchanged. Define that distinction in the application model, not by comparing display strings.

Store only the draft information needed for recovery. If local persistence is appropriate, scope it to the authorized identity and task and state its lifetime. A reload-safe draft is not automatically transferable to another user or device. Clear or quarantine private drafts when identity changes, and recheck access before displaying them.

## Decide which changes can apply now

Small updates should preserve the existing input element when possible. Avoid replacing a focused editing subtree just because a response arrived. Test input composition, selecting a range, a touch keyboard, and assistive navigation; preserving a string alone does not preserve an interaction.

A removed field needs a visible disposition: retain a recoverable draft, move it into a clearly labeled previous-question section, or ask the person to discard it. Do not restore focus into a hidden or removed control. If focus must move, choose the nearest useful heading or action and explain why. Preserve the reader's scroll anchor rather than forcing the page to the top when content appears above it.

A full publication update is different from an in-page render. Use the [publication lifecycle](../publish-coherent-updates/COOKBOOK.md) and choose when drafts are safely preserved before changing versions. A tab may remain on its prior publication while work is pending. Show the available update and its effect, and retain a recovery route if the new interface cannot read the old draft shape. Accepted publication does not prove that this browser displays it.

## Add features when they solve a real continuity problem

A compact “Changes since you started” view helps a long form; it can be distracting for a two-field check-in. A draft shelf is useful for removed questions, but needs task labels, retention, and a deliberate discard action. A side-by-side comparison helps resolve changed instructions; automatic copying is appropriate only when the meaning remains the same. Undoing a layout change should not roll back already accepted domain work.

Keep keyboard order consistent with the visible reading order. Maintain readable labels, errors associated with fields, sufficient space for zoom, and a text alternative for canvas-only information. Do not use motion or color alone to indicate a changed question. A low-motion transition and a concise status message often communicate enough.

## Verify continuity through interaction

| Scenario | Expected observation |
| --- | --- |
| Change a label during typing or input composition. | Text, composition, selection, and logical focus survive; only the label changes. |
| Move a field while a send is pending. | The pending snapshot remains bound to its original field/task; new typing stays local. |
| Replace the question with a different task. | The old draft is visibly retained or deliberately discarded, never submitted as the new answer. |
| Remove the active control or canvas. | Work has a recoverable disposition and focus moves to a useful visible destination. |
| Receive an old rejection after another edit. | The rejected snapshot and current draft remain distinct, with an intentional recovery action. |
| Accept a publication update with an incompatible draft shape. | The person can review or export the draft; silent truncation is a failure. |
| Change identity while a private read is pending. | Old continuations cannot repopulate the new view with the previous identity's data. |

Exercise these cases at a narrow viewport, with keyboard-only use and zoom. A screenshot can show layout, but it cannot establish preserved input, correct retry identity, or safe handling of asynchronous responses. This guide remains explained; an application should record its own interaction checks before claiming continuity in its supported environments.
