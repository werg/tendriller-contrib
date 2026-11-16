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

Use this when progress through physical places is part of the task. A manually selected waypoint or typed location is often sufficient; avoid continuous tracking when the question needs one position. Location permission, accuracy, freshness, and page visibility are independent concerns.

## Make arrival a policy

A distance calculation does not prove a person arrived. Reject or label stale and low-quality fixes, and choose an accuracy threshold from the task's spatial scale. A ten-metre destination and a two-hundred-metre uncertainty circle do not support a confident arrival claim. Calculate great-circle distance for geographic points; do not mix latitude degrees with metres.

Use hysteresis when the location jitters near a boundary. Enter at an inner radius and exit beyond an outer radius; while in the band, retain the previous state. The retired core rule used a margin based on `max(20 m, radius × 0.25, min(accuracy, 200 m))`. That is source evidence, not a universal radius. Decide separately whether the first fix inside counts as arrival or merely establishes initial state. An exit normally needs a previously observed inside state.

Route progress needs a skipped-waypoint policy. Automatic nearest-waypoint jumps may be surprising on loops or parallel paths. A clear “skip” or “I'm here” action can be safer than guessing from uncertain GPS. Keep the route definition revision separate from completed progress so replanning cannot silently apply old completions to new stops.

## Adapt and verify

Capture fixes only after the relevant gesture. Display accuracy and freshness where they affect the decision, filter before updating progress, and emit meaningful step changes instead of waking the agent on every fix. Clear the location watch on stop and state that foreground browser tracking may pause. Do not promise background navigation from a page that cannot deliver it.

Test boundary jitter, a stale saved inside state, first fix already inside, a skipped point, a changed route, and a long background pause. Check denial and manual completion. If the task requires dependable timed arrival while the browser is closed, choose an appropriate external service rather than presenting a foreground heuristic as durable enforcement.
