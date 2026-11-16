---
id: "interpret-motion"
title: "Turn noisy motion into useful events"
summary: "Calibrate simple motion heuristics and describe their uncertainty before treating an event as progress."
group: "Choose inputs and algorithms"
tags: ["motion", "calibration", "heuristics"]
choices: ["Manual marking or heuristic events", "Rising edge/refractory period or low/high hysteresis", "Raw diagnostics, corrections, and summary uncertainty"]
capabilities: []
evidence: "explained"
related: ["detect-meaningful-changes", "present-live-measurements", "discover-capabilities"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/motion.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/motion-companion/index.html"]
---

# Turn noisy motion into useful events

Use motion when a rough movement event is enough for the task: noticing a shake, detecting a change in orientation, or supporting a person reviewing a movement session. Do not present a heuristic step or repetition estimate as a medical or calibrated measurement. Manual marking can be both more accurate and more accessible.

## Choose a detector you can explain

Separate sensor sampling, filtering, event detection, and interpretation. A low-pass baseline can estimate gravity or slow drift; a residual magnitude can highlight faster changes. Fixed thresholds depend on placement and device. A rising-edge detector avoids counting every sample above a threshold; a refractory period prevents immediate double counts but can miss genuinely fast repetitions. Low/high hysteresis is another useful approach: arm below the low threshold, count above the high threshold, then require rearming.

Calibrate against the actual user and task before choosing constants. Holding a phone, putting it in a pocket, and attaching it to equipment produce different signals. A single axis may be interpretable with a fixed mount; vector magnitude is less orientation-dependent but discards direction. Smooth only as much as the task can tolerate: smoothing delays onset and can erase short events.

## Adapt the session

Request relevant permissions from a gesture and explain what is measured. Keep raw or aggregated diagnostic samples long enough to investigate bad counts, within a deliberate privacy and memory budget. Record calibration and algorithm version with the derived count. Let the person correct the interpretation or mark a session manually. Define when a session starts, pauses, and ends; a page becoming hidden must not create imaginary continued activity.

A summary should distinguish observed duration, detected events, manual corrections, and uncertainty. Choose median/range or a simple timeline when a single total hides important variation. Do not claim calorie, distance, fitness, or movement-quality accuracy from a generic threshold.

## Check

Test stationary noise, a device pickup, one deliberate event, repeated events near the refractory boundary, changed orientation, and denied sensors. Verify that stop removes listeners and late callbacks cannot increment a completed session. Compare counts against a small hand-labelled sample and state the observed errors, without promoting that sample into a broad device-support claim.
