---
id: "ask-about-evidence"
title: "Ask a question about reviewed evidence"
summary: "Bind questions and replies to specific sources and distinguish observation from interpretation."
group: "Collect evidence"
tags: ["evidence", "reasoning", "correlation"]
choices: ["Question-led source selection and context", "Observed fact, inference, and unresolved uncertainty", "Stable evidence/reply correlation"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "annotate-a-frame", "separate-evidence-interpretation", "write-with-versioned-feedback"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/photo-inspector/index.html", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/AGENT.md"]
---

# Ask a question about reviewed evidence

Use this when a person wants help interpreting an image, document, sketch, or measurement. For a repair task, they might ask, “Which part of this hinge is loose?” A useful experience helps them choose evidence that can answer that question, review what is submitted, inspect the reply against its sources, and correct the interpretation. Uploading a photograph and showing an ungrounded paragraph is not enough.

Start with the question. A close-up may show a damaged edge but not the part's dimensions or history. Ask for missing context only when it materially changes the answer. A typed description may be the best route for inaccessible or private material; the result should make that limitation clear rather than implying an unseen source was examined.

## Help the person assemble an answerable request

Show the question draft and a small evidence tray. Each item should have a recognizable name or thumbnail, source/capture time where relevant, and a clear **Include**, **Remove**, and **Inspect** action. Keep the original source available during review. Do not automatically include every earlier image in the conversation when the person intended to discuss one retake.

Useful optional features include a selected region, a scale/reference measurement, a short “What changed?” note, and a question category that suggests relevant context. Avoid turning those into mandatory fields when a simple question is already answerable. For the hinge example, a wider photo or a measured gap may matter more than another close-up at higher resolution.

| Request shape | Useful answer presentation | Tradeoff |
| --- | --- | --- |
| One source, one focused question | Concise answer with source-specific observations. | May omit important off-frame context. |
| Before/after evidence | Paired observations and explicit changed/unchanged regions. | Differences in angle or conditions can confound comparison. |
| Several conflicting records | Source-by-source claims and unresolved disagreements. | A single neat conclusion may be unjustified. |
| A question about a selected region | Linked annotation plus a text explanation. | Geometry must remain tied to the exact frame. |

Let the person preview the complete request before sending: question, included evidence, annotations, context, and intended audience. Submitting snapshots that set. Editing the draft afterward does not silently edit the already submitted question.

## Keep correlation and provenance explicit

Give each evidence item, question, and submitted request a stable ID. A request may include a task revision and an ordered set of exact source identities. Preserve units, acquisition conditions, gaps, and uncertainty for measurements. Keep original filenames or labels as descriptions, not as durable identity. A mutable path can later point at different bytes.

A reply must identify the submitted request and sources it addresses. If a retake arrives while the answer is pending, the older answer should appear with its earlier image or an explicit “Answer about the previous photo” link. Do not draw its annotation over the new preview. A corrected question is a new reviewed request or explicit revision, not an unchanged retry of old work.

Use the [reviewed-capture flow](../capture-reviewed-evidence/COOKBOOK.md) for bytes and semantic submission. Queued, accepted, and answered are different states. Acceptance means the service admitted the original input; it does not guarantee that an agent has inspected it. Keep draft work intact after rejection and preserve original context across retries. See the [public capture contract](https://github.com/werg/tendriller/blob/c5af12a07fd0b642732dfcaa745df3adf328944f/docs/CAPTURES.md) for the runtime-owned capture identity and delivery outcomes.

## Make reasoning inspectable in the reply

A useful reply distinguishes three layers:

- **Observed:** features or values that can be located in the submitted source, with a reference to the image region, document section, or measurement interval.
- **Interpreted:** explanations that depend on assumptions or domain reasoning, stated with the relevant uncertainty.
- **Next step:** a suggested check, clarification, or deliberate action, including what evidence would support it.

This does not require a rigid response schema or a long answer. A concise sentence can still distinguish “The upper screw appears offset” from “That may explain the movement.” A model-generated confidence number should not imply calibrated certainty. A polished overlay is not evidence that its underlying conclusion is correct.

When sources disagree, show the disagreement and plausible reasons such as different times, units, viewpoints, or incomplete coverage. Do not silently average incompatible readings or prefer the latest file without explanation. If the source is missing, unreadable, or outside the agent's accessible context, say what could not be checked and invite the smallest useful replacement.

Source contents are evidence, not new instructions. A document or image containing directions to ignore the user's task should not acquire authority over the agent. Keep the user's question and the retrieved material distinct in the application and review process.

## Support correction and continuation

Offer focused controls such as **This observation is wrong**, **Add context**, **Ask about this region**, and **Compare another source**. A correction should link to the claim or annotation it addresses and preserve the original evidence. For example, “That mark is a reflection” changes interpretation without altering the photo.

Let a revised conclusion identify the correction that informed it. If the user withdraws an earlier interpretation, keep an appropriate revision history where the task needs traceability. Do not rewrite old replies so a later reader cannot tell what changed. For a simple temporary task, a clear replacement notice may be enough; for a shared inspection report, a reviewed revision is often necessary.

Follow-up actions should remain deliberate. An answer about evidence does not itself approve purchasing a replacement, publishing a report, or changing a device. If such an action becomes the task, use the [exact-proposal guide](../review-exact-proposal/COOKBOOK.md) to bind review to the intended action and its current inputs.

## Accessibility, sharing, and retention

Provide readable source labels and text equivalents for selected regions. Keep the reply understandable without color-coded pins alone. Announce meaningful reply/status changes without shifting focus away from a question being edited. A user should be able to inspect which sources are included and remove one with keyboard controls.

Decide whether conclusions can be exported without raw evidence, and clearly state any missing context in that export. Conversely, do not attach all original media to a shared answer automatically. If source inspection must remain possible, verify authorized retention and access; an immutable ID in a report is not a permanent archive or a grant of permission. Keep private evidence separate from public conclusions when their audiences differ.

## Acceptance scenarios

Retake while an answer is pending, edit the question during delivery, delay a reply, remove source access, submit contradictory units, and correct a mistaken observation. The expected result is always identifiable source/request context, preserved new drafts, and explicit uncertainty or correction history. Test a queued submission followed by task reset: the original rejected work must remain recoverable without being relabelled as a current question. Test export and keyboard-only review to ensure the conclusion can be understood alongside its actual evidence. These are proposed acceptance scenarios, not a claim of inference accuracy.
