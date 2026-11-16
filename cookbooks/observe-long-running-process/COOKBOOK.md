---
id: "observe-long-running-process"
title: "Observe long-running work and enable intervention"
summary: "Separate freshness, progress, failures, and intervention from the agent conversation that may come and go."
group: "Decide and act"
tags: ["processes", "status", "intervention"]
choices: ["Completion notice or continuous observation", "Observed process states and freshness", "Polling/events, scoped collectors, and deliberate intervention"]
capabilities: []
evidence: "explained"
related: ["present-live-measurements", "ingest-bounded-telemetry", "review-exact-proposal"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/examples/training-dashboard/README.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/examples/training-dashboard/model.mjs", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/COLLECTOR.md"]
---

# Observe long-running work and enable intervention

Use this for training runs, remote jobs, imports, or experiments that outlive an agent turn. A process can continue while the agent is absent; a dashboard should not pretend that a live agent is monitoring it continuously. If only an eventual result matters, a completion notice may be enough.

## Define states that actually exist

Distinguish received, queued, running, paused, cancellation requested, cancelled, failed, uncertain, and completed when the process can occupy them. A successful request receipt does not imply execution. A cancellation request may race with completion and may not undo external effects. Show the observed source status and its freshness rather than an invented percentage.

Separate metric, log, machine-status, and control information. Preserve source/run identity so resumed or concurrent runs are not merged accidentally. Choose polling or events according to the source's real capabilities. A collector should use scoped append credentials and run independently of the administrative agent handle.

## Adapt the display and intervention

A dense desktop observatory can show trends and logs; a mobile view can show the latest state and a safe intervention. Both should label missing history, stale producers, retained ranges, and simulation. Keep raw retention distinct from display buffers. If an intervention is consequential, bind it to the exact run/revision and use the required approval or authority boundary.

On agent resume, restore the task brief separately from the event-consumer checkpoint. The chart cursor is not evidence that an agent handled an event. Do not wake the agent for every telemetry record; choose meaningful thresholds, completion, failures, or explicit requests.

## Verify

Stop the producer, stall a job, lose a reply, reconnect after retention expires, and finish after cancellation was requested. Confirm no fabricated data fills gaps and status indicates the age of observation. Retry a control request under the chosen idempotency policy. Export a bounded history honestly, and demonstrate that the process continues safely while the agent receiver is absent.
