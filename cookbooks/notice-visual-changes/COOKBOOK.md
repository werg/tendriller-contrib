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

Use scene comparison when the task depends on a change, such as an instrument display updating or a workbench becoming ready. Do not upload every camera frame merely because a camera is available. Manual capture is often more accurate and cheaper when the person already knows what matters.

## Choose what counts as change

A small grayscale thumbnail comparison is cheap and interpretable. A mean absolute pixel difference reacts to lighting, shadows, camera shake, and compression as well as to the desired event. An object or semantic detector can answer a more specific question, but adds model assets, inference cost, and its own errors. Neither is ground truth.

Choose the reference-frame policy deliberately. Comparing with the previous sampled frame detects abrupt changes but can miss slow drift. Comparing with the last uploaded frame detects accumulated drift but can repeatedly report a permanent lighting change. A fixed reference answers whether the scene differs from a known starting condition, but can become irrelevant when the task changes.

The extracted component used a threshold of 0.08 and a minimum upload interval of ten seconds as example defaults. Those values are not accuracy guarantees. Choose a sample cadence from the shortest meaningful event and a separate upload budget from the network/privacy constraints. A cooldown reduces repeated reports; it does not improve detection accuracy.

## Adapt the plan

1. Collect examples of meaningful change and ordinary variation in the actual camera position and lighting.
2. Decide whether raw pixels, a selected region, or an explicitly selected perception model answers the question.
3. Normalize dimensions and handle capture failures before comparing. Keep frame identity and acquisition time with every result.
4. Select and document reference updates, thresholds, cooldown, and what happens after a long pause.
5. Show active camera use, last sample time, and a Stop action. Stop tracks and timers when the page becomes inactive according to the agreed policy.
6. Upload only intentionally admitted evidence. Use a local cue or quiet event when the agent does not need an interruption.

A thumbnail can be private too. If raw images leave the device, say when and why, and use the same reviewed/durable submission guarantees as other evidence.

## Check before relying on it

Test a shadow, brightness adjustment, camera movement, slow change, a brief relevant event between samples, and a stationary meaningful scene. Observe false triggers and missed events separately. Verify the upload budget under constant motion, and that Stop prevents later asynchronous captures from uploading. Label the result as a change heuristic unless evaluated data supports a stronger claim.
