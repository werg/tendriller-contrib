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

Use a lightweight detector when a change can prompt a useful decision without a heavy model: a reading has stayed above a chosen operating band, an object moved, or a route checkpoint may have been reached. First define the decision, then the signal. A continuously changing number is not itself a reason to interrupt someone.

A complete detector experience includes a sample preview, an understandable rule, rehearsal against ordinary variation, an armed state, a reviewable event history, and pause/reset controls. If the person can simply mark the event when it happens, manual input may be more dependable and cheaper. Detection should earn its complexity by reducing repeated attention.

## Define the event in task language

For a benign demonstration, suppose a person wants to notice when a room sensor stays above a chosen comfort band. They should see “Above 28 °C for at least 3 seconds” rather than a mysterious sensitivity slider. The threshold, duration, and units are example choices; they are not a safety-control policy or device recommendation.

Write down the input channel, units, acceptable sample quality, expected cadence, what counts as a true event, and what the person will do next. Decide whether the initial observation establishes state or produces an event. Starting inside a region is different from observing a crossing. An exit normally requires a previously observed inside state.

| Mechanism | Question it answers | Limitation |
| --- | --- | --- |
| Threshold | Is the current value beyond a boundary? | Noise near the boundary can chatter. |
| Hysteresis | Has the value crossed distinct enter/exit boundaries? | The band intentionally retains earlier state. |
| Debounce/dwell | Has qualifying evidence persisted for long enough? | Delays a real event and needs a gap policy. |
| Cooldown | May another accepted event be emitted yet? | Suppresses notifications; it does not improve accuracy. |
| Adaptive baseline | What change differs from recent normal behavior? | May learn away the event or slow drift of interest. |

These mechanisms can be combined, but each should have a task-specific reason. A cooldown alone is a poor fix for a detector that constantly mistakes noise for a meaningful event.

## Make the state transitions inspectable

For the example, choose an enter threshold of 28 °C, an exit threshold of 26 °C, and a three-second qualifying interval. Explicitly choose whether equality counts; the following example enters at `>= 28` and rearms at `<= 26`. Other boundaries are valid if the interface and checks agree.

| Prior state and observation | Example outcome |
| --- | --- |
| No valid baseline yet | Initialize; show “Waiting for enough readings,” with no invented crossing. |
| Armed, valid reading at or above 28 °C | Begin or continue a candidate interval. |
| Candidate falls below 28 °C before three seconds | Cancel the candidate; do not emit an event. |
| Candidate remains supported for three seconds | Record one event and mark the condition active. |
| Active, value between 26 °C and 28 °C | Remain active; do not emit repeated crossings. |
| Active, valid value at or below 26 °C | Rearm according to the documented policy. |
| Excessive gap or changed calibration | Enter unknown/rehearsal state; do not count missing time as qualifying evidence. |

Implement dwell using elapsed time and valid observations, not an assumed number of samples. Decide the longest gap that can support continuity. A timer firing after the page was suspended is not proof that the signal remained high. Keep acquisition time and receipt time distinct when records arrive late or out of order.

## Rehearse before arming

Show the raw or lightly filtered signal, the current baseline, thresholds, and an explanation of why a candidate was accepted or rejected. Give the person a way to mark “This should have counted” or “This was ordinary variation.” Preserve those labels with the parameter version so later tuning can be compared honestly.

Use separate representative examples for choosing parameters and checking them. Include nuisance changes as well as desired events; measuring only successful detections hides false-trigger cost. Report missed events and false triggers separately, with the size and conditions of the sample. A small rehearsal supports a local choice, not a broad accuracy claim.

A fixed baseline is useful when departure from a known setup matters. A previous-sample baseline highlights abrupt change but can miss slow movement. An adaptive baseline follows drift but requires a stated update rule: for example, update only during accepted quiet periods and freeze while a candidate is active. That is a proposed policy to evaluate, not a universal detector implementation.

## Separate detection from delivery and action

Keep sampling/filtering, detector state, event admission, and downstream action separate. A noisy input should not repeatedly navigate the page or modify shared progress. Each admitted event needs stable identity, detector/parameter version, relevant sample range, observed time, and a reason. Replaying the same admitted event must not become a new user intent.

Decide whether events produce a local highlight, a quiet telemetry record, an agent wake, or a reviewed action. Use [interruption choices](../choose-interruptions/COOKBOOK.md) for that policy. Cooldown can coalesce repeated notices while preserving an honest count or interval of suppressed observations. Do not silently convert “notifications suppressed” into “nothing happened.” A heuristic cannot authorize a consequential action just because a threshold was crossed.

Let the person pause detection without deleting the session. Resuming after a long gap should show whether the baseline is retained, revalidated, or reset. Changing thresholds, calibration, source, or task revision should create a new parameter epoch; historical events keep their original meaning. The retired geofence code used thirty minutes as one state-age example, not a general expiry rule.

## Complete the interaction

Provide a concise active summary such as “Watching temperature; last valid reading 4 seconds ago,” with text alternatives to graphs and sound. Offer **Pause**, **Rehearse**, **Reset baseline**, and **Mark event manually** where useful. Reset should explain which derived state changes while preserving earlier observations when they remain relevant.

Bound retained diagnostics, especially if samples reveal location, audio, or personal routines. Stop subscriptions and timers at lifecycle end, and invalidate pending work so a disposed detector cannot emit into a new task. A restarted detector must identify its new epoch; it must not pretend observation continued while the page was inactive.

## Acceptance scenarios

Test exact boundaries, oscillation inside the hysteresis band, a brief spike, slow drift, duplicated samples, out-of-order timestamps, a long gap, and changed calibration. Verify the transition table with the same parameter set used in the UI. A gap must produce unknown continuity; one admitted crossing must produce one logical event; a parameter change must preserve historical interpretation. Test Stop during an asynchronous read and confirm no later action is emitted. Record constants and rejected alternatives so another adaptation can reconsider them.
