---
id: "follow-location-progress"
title: "Follow location changes and route progress"
summary: "Filter uncertain fixes, choose arrival semantics, and keep a route usable when foreground location stops."
group: "Choose inputs and algorithms"
tags: ["location", "uncertainty", "routes"]
choices: ["One fix, manual progress, or continuous tracking", "Accuracy filtering and inner/outer arrival radii", "First-fix, skipped-waypoint, and replanning semantics"]
capabilities: []
evidence: "explained"
related: ["detect-meaningful-changes", "guide-explicit-checkpoints", "choose-interruptions"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/geo.js", "https://github.com/werg/tendriller/blob/a0a84cc9e0db104313caf6ece2cbe0d009a9e19d/runtime/src/rules.ts"]
---

# Follow location changes and route progress

Use this when progress through physical places is part of a task: a person visits several equipment stations and records an inspection at each. A useful route page gives them the current stop, what to do there, a clear way to confirm completion, and recovery when location becomes uncertain. A moving dot alone does not establish useful progress.

Choose the least demanding source. One location fix may identify a nearby station; manual selection may be enough for a known route. Continuous tracking is justified when repeated location checks materially reduce effort. Keep a manual **I'm at this stop** or **Choose a stop** path, with self-reported provenance where that distinction matters.

## Design the route journey

1. Review the route as an ordered list, with optional map, stop names, tasks, and any time constraints. Let the person correct or skip an inappropriate stop before tracking begins.
2. Explain why location is useful and what will be retained. Request it only after **Use my location**. Denial leaves the route and manual progress usable.
3. Show the first fix's age and uncertainty before suggesting a stop. Distinguish “near this stop” from “inspection complete.”
4. Present one useful next action at the current stop: inspect, record evidence, mark complete, skip with a reason, or choose another stop.
5. After a credible arrival candidate, ask for confirmation where the task requires actual presence or work. A distance threshold cannot prove either.
6. Show completed, skipped, remaining, and uncertain stops separately. End with a review of exceptions and observation gaps; allow corrections without rewriting the original route.

A map helps spatial orientation, but an ordered text list should carry the essential task. Keep stop selection and completion usable through keyboard, zoom, and a screen reader. Do not make dragging a map pin or distinguishing colored markers the only route to progress.

## Make arrival an explicit policy

Filter or label stale and low-quality fixes before using them. A ten-metre destination with a two-hundred-metre uncertainty estimate does not support a confident arrival. Choose quality thresholds from the task's spatial scale, and treat browser-reported accuracy as uncertainty information rather than a guaranteed geometric boundary. Display a coarse estimate when a precise-looking number would mislead.

Calculate geographic distance using a suitable great-circle method or reviewed geographic library with explicit units. Do not subtract latitude/longitude degrees and label the result metres. Handle invalid coordinates and impossible timestamps before applying arrival logic. A location fix is not a trustworthy wall-clock history merely because it contains a timestamp.

Use distinct inner/outer radii when jitter near a boundary would repeatedly enter and exit. Inside the inner radius, admit an arrival candidate; beyond the outer radius, admit departure; in between, retain the previous state while valid evidence supports it. The retired core rule used a margin based on `max(20 m, radius × 0.25, min(accuracy, 200 m))`. That is source history, not a universal radius or proof of arrival.

Decide separately whether the first fix inside counts as arrival or only initializes state. An exit normally needs a previously observed inside state. A dwell rule can reduce transient passes, but missing fixes must not count as observed dwell time. Use [change-detection semantics](../detect-meaningful-changes/COOKBOOK.md) for those state transitions rather than assuming a timeout proves continued presence.

## Keep route definition and progress distinct

Use stable stop IDs independent of list position and names. Keep a route revision, stop coordinates, optional arrival policy, and task instructions separate from progress records. A progress record may include stop ID, route revision, completion method, observed time, accepted time, evidence reference, and correction history. These are application choices, not special core field names.

Automatic nearest-stop jumps can be surprising on loops, parallel paths, or closely spaced entrances. Prefer an explicit stop switch when more than one candidate is plausible. Decide whether out-of-order visits are allowed; if they are, preserve their actual order rather than rewriting the route to make them appear sequential.

A route change should produce a comparison: which stop was renamed, moved, removed, or added, and which completions still apply. Reordering stable IDs may preserve progress; moving a destination or changing its task can require deliberate review. Never assign an old completion to a new stop simply because both occupy index three. Keep late location callbacks attached to the route revision that requested them.

## Location, completion, and evidence have different authority

The browser may suggest that the person is nearby. The person may report arrival. A completed inspection may require measurements or a reviewed note. Model these separately so an automatic geofence does not silently finish work.

For protected task updates, use the current public command/scoping contract and retain the original generation on retry. An old queued completion after replanning must stay associated with its original route, not be relabelled as new work. The [checkpoint guide](../guide-explicit-checkpoints/COOKBOOK.md) covers intentional completion, while [recovery](../recover-outdated-work/COOKBOOK.md) covers stale outcomes.

Emit meaningful changes rather than waking the agent on every fix. A local distance display can update quietly. An interruption might be useful when the person deliberately asks for help or a reviewed exception needs attention. Neither a push notification nor an agent reply guarantees dependable background navigation.

## Handle interruption and retention

Foreground browser tracking may pause. Show the last valid fix time and an interrupted/unknown state when observations stop. Clear the location watch on Stop and invalidate pending callbacks. Do not silently restart after reload or background return; follow the person's explicit active-task policy and request a fresh observation.

After a long pause, do not assume an old inside/outside state remains trustworthy. A fresh fix may initialize a new observation interval while the person's completed tasks remain intact. Preserve local notes separately from sensor resources. If offline storage is unavailable, explain which unsent notes exist only in the open tab and provide a deliberate save path.

Retain the least location detail that supports the task. A confirmed stop ID may be sufficient without a complete travel trace. If coordinates are kept, state their readers, purpose, precision, and expiry. Exports and shared reports should not acquire a full movement history by accident. If dependable arrival processing while the page is closed is required, choose an appropriate external service and verify its contract rather than promising it from a foreground watch.

## Acceptance scenarios

| Scenario | Expected observation |
| --- | --- |
| First fix already inside a stop | The chosen initialization policy is applied visibly. |
| Boundary jitter or uncertain fix | No repeated completion; uncertainty remains inspectable. |
| Pass near two stops on a loop | No unreviewed nearest-stop jump changes the task. |
| Skip, visit out of order, or correct completion | Original route identity and actual progress history remain distinct. |
| Replan while a completion is queued | Its original route/generation is preserved and any rejection is recoverable. |
| Long background pause | The page shows an observation gap and revalidates before another arrival. |
| Denied location or keyboard-only use | Manual progress can finish the route with honest provenance. |

These are proposed adaptation checks. Record real device conditions before claiming reliable location behavior.
