---
id: "notice-visual-changes"
title: "Notice meaningful visual changes"
summary: "Choose reference frames, thresholds, and sampling budgets for a task where a changed scene matters."
group: "Choose inputs and algorithms"
tags: ["camera", "heuristics", "budgets"]
choices: ["Previous, uploaded, or fixed reference frame", "Pixel difference or a selected perception model", "Sampling cadence versus upload cooldown"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "select-local-perception", "choose-interruptions"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/glance.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/camera.js"]
---

# Notice meaningful visual changes

Use scene comparison when a change deserves attention: a workbench is ready for the next step, an instrument display changes, or a diagram differs from a reference. Begin by deciding what the person will do after a detection. Manual capture is often cheaper and more reliable when they already know which moment matters.

For a workbench readiness task, a complete experience includes choosing a camera, framing only the relevant region, reviewing a reference, rehearsing ordinary variation, arming a bounded watch, inspecting candidate changes, and ending the session. A blinking “motion detected” indicator without those choices is unlikely to be useful.

## Choose what counts as change

A small grayscale thumbnail comparison is inexpensive and interpretable. Mean absolute pixel difference reacts to shadows, lighting, camera movement, and compression as well as the desired event. A selected object or semantic model can ask a more specific question, but adds assets, inference cost, and model errors. Neither establishes ground truth.

| Reference policy | Good fit | Failure to expose |
| --- | --- | --- |
| Previous sampled frame | Abrupt changes matter. | Gradual drift can disappear between small steps. |
| Last admitted/uploaded frame | Accumulated change matters. | A persistent nuisance can repeatedly differ from the old reference. |
| Fixed reviewed reference | Compare against a known setup. | The reference becomes wrong when the task or camera changes. |
| Person-selected reference image | Compare before/after or expected layout. | Crop, orientation, scale, and acquisition conditions may differ. |

Choose the reference independently from network delivery. If upload fails, “last uploaded” and “last detected” may differ; that distinction must not accidentally change the algorithm. Keep a reference ID and update reason so the event history can explain what each frame was compared against.

A selected region can reduce irrelevant change and disclosure. Let the person move or resize it before arming, show its exact bounds, and offer a text description. Moving the camera or region changes the observation geometry and should trigger deliberate reference review, not a burst of false task events.

## Walk through setup and rehearsal

1. Offer file/manual input and explain why continuous camera use would help this particular task.
2. Start the camera after a deliberate gesture. Show the live preview, active-use state, and a Stop action immediately.
3. Let the person frame the scene and choose a region. Capture a reference with its source dimensions, orientation, region, time, and task revision.
4. Run a local rehearsal that shows a difference score and candidate markers without sending every frame. Try ordinary lighting variation and one meaningful change.
5. Choose thresholds, sampling cadence, and an admission policy from that rehearsal. Show a readable description such as “Check the selected area periodically; ask before sending a change.”
6. Arm the watch. Display last valid sample time, reference identity, queued candidate count, and remaining budget where useful.
7. Review an admitted before/after pair, discard a nuisance, or send intentionally. Preserve the comparison when a newer frame arrives.
8. Stop and summarize the observed interval, accepted candidates, skipped samples, and limitations. Starting again is a new deliberate action.

If automatic bounded submission is central to the task, obtain that choice explicitly and show what may leave the device, how often, and how to stop. A user's choice to open a camera is not blanket permission to upload its feed.

## Bound acquisition, inference, and disclosure separately

The extracted component used a normalized threshold of 0.08 and a minimum upload interval of ten seconds. These are historical examples, not accuracy guarantees. Define the score's normalization before interpreting a number; raw 8-bit differences and normalized differences are not interchangeable.

Choose cadence from the shortest event that needs to be observed. A brief event can occur entirely between samples; increasing image resolution will not fix that gap. Choose a separate network/privacy budget for accepted uploads. Cooldown reduces repeated reports but cannot distinguish a shadow from a meaningful event.

Bound concurrent frame acquisition and analysis. If analysis takes longer than the cadence, skip or replace an unstarted sample instead of queuing an ever-growing backlog. Record that sampling was reduced. Keep at most the deliberately chosen candidates and reference frames, and release discarded image buffers/object URLs. A thumbnail can still reveal private information.

Handle capture failure before comparison. A blank or partially decoded frame should produce an acquisition error, not a dramatic scene-change score. Normalize input dimensions and orientation consistently; a shape change must not be silently stretched into a valid comparison. Record both acquisition time and processing time when latency affects interpretation.

## Keep evidence and detector state separate

Each candidate should identify the before/after frames, region and coordinate convention, score/threshold, reference policy, detector version, acquisition times, and task revision. These are application-owned fields. A new live preview must not replace the after-frame in a candidate already under review.

Use [reviewed capture](../capture-reviewed-evidence/COOKBOOK.md) for durable submission. Uploading bytes, accepting their semantic input, and receiving an agent interpretation are distinct outcomes. After an offline or stale rejection, retain the candidate for deliberate review. Repeating an upload call is new work; use the runtime's saved retry path for the original operation.

Let the person mark a candidate as meaningful or nuisance and explain how that feedback affects future detection. Do not silently retune thresholds or replace the fixed reference based on a single dismissal. Offer an explicit **Use this as reference** operation with a visible new reference revision. Historical comparisons keep the reference they actually used.

## Interruption and accessible review

Show active camera use and stop actual tracks, timers, workers, and pending callbacks when ending the flow. After a long pause, offer a fresh reference review because lighting and camera position may have changed. Do not claim the scene stayed unchanged while no valid frames were observed.

Provide a text timeline of candidate times and reasons alongside images. Before/after toggles need keyboard controls and distinct labels; side-by-side review must remain intelligible at narrow widths and zoom. Avoid flashing every frame difference or relying only on color overlays. A person who cannot judge the visual difference should be able to supply context, use a manual checkpoint, or ask for interpretation of a deliberately selected pair.

## Acceptance scenarios

Test a shadow, brightness adjustment, camera movement, slow change, a brief relevant event between samples, and a stationary scene that already differs from the reference. Observe false triggers and missed events separately. Under constant motion, verify that candidate storage and upload budgets remain bounded and suppressed observations are described honestly. Stop during an asynchronous capture and confirm no late submission occurs. Change the reference while an older candidate is pending and verify that its comparison remains unchanged. Describe the result as a heuristic unless recorded evaluation supports a stronger claim.
