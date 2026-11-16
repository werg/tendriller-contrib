---
id: "capture-rendered-evidence"
title: "Capture rendered evidence"
summary: "Choose between DOM rendering, browser capture, and underlying source data, and review what the capture leaves out."
group: "Collect evidence"
tags: ["capture", "rendering", "provenance"]
choices: ["Rendered appearance or source/data export", "DOM reconstruction or browser/screen capture", "Explicit readiness and reviewed disclosure"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "publish-coherent-updates"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/screenshot.js", "https://github.com/werg/tendriller/blob/62f15021e77812e58533aa816cd24698aa70cfc8/docs/BROWSER_API.md"]
---

# Capture rendered evidence

Use a rendered capture when appearance itself matters: discussing a clipped label, preserving a reviewed diagram, or showing a visual defect to another person. A screenshot is a view of a state at a moment. If exact values, formulas, or later editing matter, the underlying data or authored source may be more useful.

For a chart defect report, a complete flow lets the person choose the relevant area, establish the intended state, capture it, inspect omissions and disclosure, annotate what matters, and submit it with useful context. Avoid a one-click “send screen” flow that hides which surface, time, or content will be shared.

## Choose what the artifact needs to establish

| Artifact | Useful evidence | Limits |
| --- | --- | --- |
| Underlying data/source export | Exact values, structure, and reproducible calculations. | Does not show the browser's actual visual result. |
| DOM-to-image reconstruction | A selected authored region using a known renderer. | Supported content may differ from the real painted page. |
| Browser/screen capture | The selected visible surface. | Surface choice, permission, overlays, and private content need review. |
| Paired image and data/context | Appearance linked to the values or state that produced it. | Larger disclosure and a need to correlate both artifacts. |

DOM reconstruction libraries may omit or change cross-origin images, canvas/video content, fonts, and unsupported CSS. A successful image encoding is not proof of faithful rendering. Browser/screen capture has different permission, source-selection, and browser constraints; test the actual environment rather than treating it as a universal substitute.

Choose the smallest artifact that answers the question. For a cut-off axis label, a cropped visual capture may suffice. For an incorrect total, include the relevant source values or a reproducible case; a screenshot of the displayed number alone cannot establish how it was calculated.

## Make the capture boundary deliberate

Let the person choose a component, region, page, or visible surface as appropriate. Explain whether hidden or off-screen content is included. A full-page reconstruction and a visible-viewport screenshot can show different states, especially with scrolling, sticky elements, virtualized lists, and expanded sections.

Wait for an explicit readiness condition when reproducibility matters. A capture action can check that the requested data revision is displayed, required assets/fonts have settled, and the intended scene is stable. An arbitrary delay only guesses. If waiting times out, offer a partial capture with a stated omission or let the person cancel; do not silently call it complete.

Decide what happens to animation, live values, timers, hover states, and selection. If a chart is frozen for capture, visibly label that snapshot and preserve its data interval. Resume the live view afterward according to the chosen interaction. Freezing a display must not pretend acquisition stopped or rewrite the underlying observation history.

## Walk through a chart issue report

1. Ask what the person wants to show and offer **Capture this chart**, with data export as a separate useful option.
2. Show the selected area and current chart/run revision. Let the person include a legend or relevant controls deliberately.
3. Establish readiness and capture the chosen representation. Let the person abandon the application attempt while resources load. A browser-owned source chooser may require its own cancellation and can temporarily prevent interaction with the page.
4. Present the candidate before upload. Show its size, method, source time/state, and any known omissions in plain language.
5. Allow retake, crop, redaction, a short description, and optional region annotation. Keep the original candidate separate from derived edits when further correction is expected.
6. Review the exact outgoing bytes and metadata, then submit through the durable evidence flow.
7. Show queued, accepted, and answered separately. An older capture remains tied to its recorded state even if the live chart changes.

A report form and a focused fullscreen review route can use the same guarantees. Choose the layout that makes accidental disclosure or wrong-state capture less likely for the task, without requiring a shared component or application schema.

## Preserve context without oversharing

Useful context can include publication identity, selected region, capture method, viewport dimensions, display scale, page-owned data revision, relevant interval, and acquisition time. Record only what helps explain the artifact. Full URLs, query parameters, account names, and unrelated screen content can expose information without improving the report.

Redaction must affect the actual outgoing pixels or selected export, not merely cover content with a visual overlay that is absent from the encoded image. After cropping or redaction, review the derived bytes that will be sent. A redacted screenshot does not automatically redact a separately attached data file or original image. Give those attachments independent disclosure choices.

Retain source identity for follow-up where needed, but do not assume an uploaded screenshot is participant-private or permanent. The [data-model guide](../choose-data-model/COOKBOOK.md) distinguishes immutable bytes, retention roots, and readers. If different audiences need access to different reports, enforce that at the actual authority boundary.

## Keep asynchronous work attached to its original state

Create a page-owned attempt ID before capture starts and bind it to the chosen page/data revision. If the task changes while rendering is pending, show the candidate as an earlier-state capture or ask for a retake. Do not label a late image as evidence for the new decision.

Cancel and source replacement must invalidate late callbacks. Release media tracks, rendering resources, buffers, listeners, and object URLs when no longer needed. Discarding a local candidate stops it from being submitted later, but discarding a queue entry is not an undo of an already accepted server request.

Read `tendril.sensors.status()` and subscribe through `tendril.sensors.on(listener)` to distinguish its `pending` acquisitions from `active` resources. The listener receives the same `{active, pending}` snapshot shape; keep the sensor Stop action available while either array is nonempty, rather than waiting for the screen/camera chooser to produce a live stream.

When cancelling the page's sensor session, call core's [sensor stop boundary](https://github.com/werg/tendriller/blob/62f15021e77812e58533aa816cd24698aa70cfc8/docs/BROWSER_API.md), `tendril.sensors.stopAll()`. Pending wrapped screen/camera requests reject immediately with `AbortError`, and core stops any stream granted after that cancellation. The browser may still show its native chooser. Use the application attempt ID to prevent an already-produced render or candidate from entering a new task; core owns the tracked acquisition race, while the page owns the capture's meaning. If other independent inputs must continue, scope cancellation to the owned capture rather than using a page-wide stop. Rehearse the pending-only and late-grant cases against the actual browser without adding a second global sensor lifecycle.

Use [reviewed capture](../capture-reviewed-evidence/COOKBOOK.md) to persist bytes and semantic context together. Keep a new note separate from a pending report, so a late rejection cannot overwrite it. A blank or failed render should produce an error and retained context, not a successful empty report. If a third-party renderer is deliberately bundled, retain its exact dependency identity and notices; copied application code remains editable source.

## Accessible review and useful fallback

Describe the candidate in text, retain the report question, and provide keyboard access to retake/discard/send and any crop controls. A pointer-only crop tool should not block reporting; allow preset regions or use the original with a textual description. Keep focus on the person's current task while capture finishes. Status messages should explain whether preparation, rendering, upload, or agent response is pending.

When faithful capture cannot be produced, offer source/data export, an explicitly selected image file, or a written description. Label the replacement honestly. Avoid silently substituting a reconstruction when the report specifically requires the browser's painted result.

## Acceptance scenarios

Check custom fonts, cross-origin media, canvas/video, long scrolling content, hidden or virtualized elements, animations, and updates during capture. Compare the result with the actual browser when fidelity matters. Test cancellation, missing assets, a blank render, redaction of actual outgoing bytes, and source replacement during a slow capture. The person should see omissions before sending, and each accepted report should retain the state it actually depicts. These scenarios describe what an adaptation must verify; this guide does not certify a capture library's fidelity.
