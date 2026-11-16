---
id: "detect-meaningful-changes"
title: "Detect meaningful changes cheaply"
summary: "Choose baseline, hysteresis, debounce, and cooldown according to the cost of false triggers and missed events."
group: "Choose inputs and algorithms"
tags: ["heuristics", "hysteresis", "sampling"]
choices: ["Threshold, hysteresis, debounce, or cooldown", "Fixed or adaptive baseline and first observation", "False-trigger versus missed-event costs"]
capabilities: []
evidence: "explained"
related: ["notice-visual-changes", "interpret-motion", "follow-location-progress", "choose-interruptions"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/motion.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/glance.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/geo.js", "https://github.com/werg/tendriller/blob/a0a84cc9e0db104313caf6ece2cbe0d009a9e19d/runtime/src/rules.ts"]
---

# Detect meaningful changes cheaply

Use a lightweight detector when an observed change can guide a useful action without a heavy model. Motion, scene differences, geofences, and numeric thresholds share decisions, but their units and error sources differ. A single generic threshold engine would hide the important differences.

## Choose the semantics

A threshold answers whether a value is beyond a boundary now. Hysteresis uses different enter/exit boundaries and retains state between them, reducing chatter. Debounce requires a condition to persist for a duration; it filters brief noise but delays detection. Cooldown suppresses repeated accepted events; it does not distinguish noise from signal. Baseline adaptation can follow slow drift, but may learn away the very change the task seeks.

Choose first-observation behavior. Being inside a region on the first fix may count as entering, or may only initialize state. An exit normally needs a prior inside observation. Decide how long remembered state is trustworthy after a pause; the retired geofence code used thirty minutes, an example rather than a law.

## Adapt the detector

Define the input units, sample cadence, validity checks, baseline update rule, thresholds, and event identity. Keep detection separate from actions such as navigation, speech, or state mutation. A noisy sensor should not repeatedly move the user's page. Use public primitives and application-owned functions instead of restoring the retired rule DSL.

Choose a reference dataset that includes nuisance changes and real events. Estimate missed events and false triggers separately. Consider the cost of each: a harmless visual hint can tolerate more false positives than a consequential external action. Require explicit review or a stronger authoritative check where a heuristic is insufficient.

## Verify

Test values exactly on each threshold, oscillation in the band, a brief spike, slow drift, a long pause, missing samples, and changed calibration. Check state initialization and reset, and stop all active subscriptions on lifecycle end. Record chosen constants with their assumptions so a later application can reconsider them rather than treating them as platform invariants.
