---
id: "interpret-motion"
title: "Turn noisy motion into useful events"
summary: "Calibrate simple motion heuristics and describe their uncertainty before treating an event as progress."
group: "Choose inputs and algorithms"
tags: ["motion", "calibration", "heuristics"]
choices: ["Manual marking or heuristic events", "Rising edge/refractory period or low/high hysteresis", "Raw diagnostics, corrections, and summary uncertainty"]
capabilities: []
evidence: "exercised"
related: ["detect-meaningful-changes", "present-live-measurements", "discover-capabilities"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/motion.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/motion-companion/index.html"]
---

# Turn noisy motion into useful events

## Runnable current API specimen

[motion.mjs](snippets/motion.mjs) implements `createMotionController` and a pure
`createMagnitudeDetector`. It uses gravity-free `event.acceleration` in m/s²,
explicit high/low thresholds, and an elapsed-time refractory period. It rejects
missing/nonfinite values and requires a new quiet sample after an observation
gap. These parameters are a rehearsal heuristic, not calibrated movement counts.

```js
import { createMotionController } from './snippets/motion.mjs';
const motion = createMotionController({
  tendril,
  detector: { high: 12, low: 4, refractoryMs: 600, gapMs: 2000 },
  onStatus: state => { document.querySelector('#motion-status').textContent = state; },
  onSample: sample => { if (sample.detected) document.querySelector('#estimate').textContent = String(sample.count); },
});
document.querySelector('#motion-start').onclick = event => {
  void motion.start(event).catch(error => { document.querySelector('#motion-status').textContent = error.message; });
};
document.querySelector('#motion-stop').onclick = () => motion.stop();
```

The controller calls iOS `DeviceMotionEvent.requestPermission()` in the trusted
Start handler before any asynchronous probe. It registers pending work first,
ignores a grant after Stop, removes its listener on visibility loss, and requires
a fresh Start after return. Call `motion.dispose()` when the authored route ends.
Keep manual marking and correction controls usable throughout.

The [checks](checks/README.md) exercise permission timing, denied/late permission,
visibility teardown, refractory equality, low-edge rearming and invalid samples.
Those deterministic checks do not qualify an iPhone or the accuracy of a physical
movement detector.

Use motion when a rough movement event is enough: noticing a deliberate shake, detecting a change in orientation, or reviewing a repeated handling task. Consider a packing demonstration in which a person wants to mark each deliberate lift of a phone-mounted test object. The useful outcome is an inspectable estimate with corrections, not an unexplained count that keeps rising.

Manual marking may be more accurate and more accessible. Offer it throughout the session, especially when a device cannot be mounted consistently. A generic threshold must not be presented as a calibrated step count, medical measurement, distance, calorie estimate, or movement-quality assessment.

## Start with a positioning and rehearsal flow

1. Explain the intended event and how the device should be held or mounted. Show a manual alternative before requesting access.
2. Ask for relevant motion permission from the person's deliberate action. Show waiting, unavailable, denied, and active states separately.
3. Observe a short still period to inspect noise and a few deliberately labelled events to examine shape and timing. Do not quietly treat this rehearsal as completed task progress.
4. Choose parameters from that placement and show what they mean: the movement required to count, the minimum separation, and the conditions for rearming.
5. Start a named session only after the person can see a plausible detection. Keep **Pause**, **Mark one**, **Correct count**, and **End session** accessible.
6. Finish with observed time, detected events, manual additions/removals, gaps, and calibration notes. Let the person review the event timeline before using the summary elsewhere.

A compact counter can suit active use; a separate diagnostics view can show sample traces and markers. Both should explain whether the sensor is observing now and when the last valid sample arrived.

## Choose a detector you can explain

Separate sampling, filtering, event detection, and interpretation. A low-pass baseline can estimate gravity or slow drift; a residual magnitude can emphasize faster changes. Choose units and the sensor fields explicitly. If the source includes gravity, describe how the baseline treats it. Do not mix values from differently defined fields as if they were comparable measurements.

| Choice | Useful property | Cost to examine |
| --- | --- | --- |
| Fixed-axis signal | Meaningful direction with a consistent mount. | Rotation or remounting changes the signal. |
| Vector magnitude | Less dependent on orientation. | Direction is lost; unrelated movements can look alike. |
| Rising edge plus refractory interval | One event per excursion with a simple minimum separation. | Fast genuine events can be suppressed. |
| Low/high hysteresis | Requires returning below a lower boundary before another count. | A sustained position may prevent rearming. |
| Manual marker | Explicit intent without sensor inference. | Requires attention at each event. |

Smoothing reduces some noise while delaying onset and potentially erasing brief movements. Device placement, sampling intervals, and real movement differ; avoid treating constants copied from another example as calibrated. An interval based on elapsed time is clearer than “ignore the next ten samples” when sample cadence can vary. Reject invalid/nonfinite samples and identify gaps before updating the detector.

Use a small hand-labelled sample with both desired events and nuisances: picking up the phone, tapping a table, turning it over, and ordinary stationary noise. Inspect false positives and missed events independently. Choose a threshold whose errors fit the task; a confidence-looking percentage cannot rescue a heuristic that has never been evaluated.

## Preserve what the count means

Store a session ID, source/placement description, algorithm version, parameter revision, observed intervals, and admitted event identities. Raw or aggregated diagnostics may help investigate a count, but retain them only within a stated memory and privacy budget. Keep sensor observation separate from the interpretation “one completed action.”

Represent correction as a reviewed adjustment with a reason or linked event, rather than rewriting the raw signal. For example, a user may reject two pickup artifacts and add one missed lift. The summary should then distinguish detected total, removed detections, added manual events, and resulting reviewed total. This is application-owned information, not a required universal schema.

Bind any event or submitted summary to its original task/session revision. A late sensor callback from a completed session must not increment a new one. If an event is delivered to an agent or shared state, follow the [recovery guide](../recover-outdated-work/COOKBOOK.md) for stable command identity rather than creating duplicate progress after reconnect.

## Pauses, remounting, and changing conditions

Pause should stop admitting events and make the observation gap visible. Decide whether resource sampling also stops or continues only for a visible diagnostic purpose. On resume, require a brief settling/rehearsal period if the device moved or the previous baseline is no longer trustworthy. Carrying the phone to another location must not create several unexplained task completions.

A hidden page, operating-system interruption, or absent sensor data cannot establish continued activity. Stop listeners and pending timers according to the page policy, retain the last valid observation time, and show an interrupted state. Reload restores recorded progress only where persistence exists; it must not fabricate the unobserved interval or restart motion sensing silently.

Changing orientation or calibration creates a new parameter epoch. Keep prior event counts associated with the earlier settings. If old and new estimates are not comparable, say so in the summary and offer per-interval results. End session should freeze a reviewable snapshot; later correction creates a visible revision rather than silently modifying a previously sent report.

## Make feedback helpful during the task

Use a large readable count, a text active/pause indicator, and optional brief feedback for admitted events. Allow sound or vibration to be disabled independently. Avoid announcing every sensor sample to assistive technology; announce meaningful state changes and reviewed counts at a useful cadence. Buttons must be usable without the motion being detected, so shaking cannot be the only way to stop or correct the task.

A “Why did this count?” view can show the event timestamp, selected signal, threshold crossing, and calibration revision. Keep it understandable without exposing a wall of raw numbers. Provide undo for a mistaken manual correction where the task's concurrency rules allow it. The relevant goal is trustworthy task progress, not maximizing the total.

## Verify the boundaries

| Scenario | Expected observation |
| --- | --- |
| Stationary noise and device pickup | Rehearsal exposes nuisance detections before they become task progress. |
| One deliberate event | One event identity is admitted and can be inspected. |
| Events near the refractory boundary | The documented equality/minimum-separation rule is consistent. |
| Rotate or remount the device | The page requests or offers revalidation and records the changed epoch. |
| Permission denial or missing readings | Manual marking completes the task with distinct provenance. |
| Stop during a pending sample | No callback changes the completed session. |
| Correct a count, then export | Raw detections and reviewed adjustments remain distinguishable. |

Report the tested placement, device, sample size, and error types. These acceptance scenarios remain proposed checks until performed; source review does not establish device-wide accuracy.
