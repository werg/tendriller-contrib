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

Use this for training runs, remote jobs, imports, or experiments that outlive an agent turn. A process can continue while the agent is absent; a dashboard should show what is known about it without implying continuous human or agent attention. If only the eventual result matters, a completion notice and a durable result page may be enough.

## Follow one job from launch to closeout

Consider a two-hour document import. The person wants to know whether it started, what has succeeded, whether problematic records need review, and whether stopping now will preserve accepted results. Their first screen should name the job, source, destination, initiation time, and current observed state. A progress bar alone cannot answer those questions.

Use a compact summary for the main decision: keep waiting, inspect a problem, intervene, or collect results. Put detailed logs and metrics behind that summary. A mobile view can prioritize state, age of observation, last meaningful milestone, and one safe intervention. A desktop view may add aligned trends and logs. Both must describe the same authoritative run and unresolved requests.

When the person returns, show what changed since their last visit, not merely the current number. Include completed milestones, new errors, intervention outcomes, and the retained history range. Preserve the person's reading position while new log records arrive; offer “Return to latest” rather than constantly forcing scroll to the bottom.

## Define states that actually exist

| State | Meaning to communicate | Useful action |
| --- | --- | --- |
| Received or queued | The system accepted a request but execution has not begun. | Inspect queue context or withdraw if supported. |
| Running | The source reports active execution. | Inspect recent evidence and relevant progress. |
| Waiting or paused | A specific dependency or intentional pause blocks progress. | Resolve the dependency or request resume. |
| Cancellation requested | A control request is pending or being applied. | Inspect its outcome; avoid sending a second contradictory request. |
| Cancelled | The source confirms its cancellation semantics. | Review partial results and any effects that remain. |
| Failed | The source reports an explicit failure. | Inspect the cause and decide whether a new attempt is appropriate. |
| Uncertain or stale | Current status cannot be established. | Reconnect or reconcile; do not infer success or failure. |
| Completed | The source confirms the defined completion condition. | Inspect and export results, including omissions and warnings. |

Use only states the process can actually occupy. “Paused” is not a synonym for missing telemetry. A successful request receipt does not imply execution. A cancellation request may race with completion and may not undo external effects. If the source cannot cancel, say so instead of presenting a decorative Stop button.

Choose progress measures that have a defensible denominator. “300 of 500 records checked” is useful when the set is fixed. An estimate over a growing queue should be labeled as an estimate; an indeterminate activity indicator is better than an invented percentage. A process can be active without advancing its main count, so distinguish heartbeat, work performed, and last milestone.

## Separate observation channels

Keep metric, log, machine-status, result, and control information distinguishable. Preserve source/run identity and attempt identity so resumed, retried, or concurrent work is not merged accidentally. Keep source time and receipt time when their difference matters; clock skew and delayed ingestion can otherwise make old work appear current.

Choose polling or events from the source's actual capabilities. A collector should use scoped append credentials and run independently of the administrative agent handle. Bound read pages, log bytes, chart points, and diagnostic retention. Raw server retention and visible buffers have different owners; dropping an old log row from the DOM does not delete it from storage or create an archive.

Display the age of the last meaningful observation next to the state. Choose stale thresholds from the expected cadence and known pauses. A heartbeat proves the reporter is alive, not necessarily that the job is progressing. When history expires, preserve an explicit gap rather than joining disconnected points with a continuous line. Label simulations and fixture data in the interface and exported records.

## Make interventions exact and accountable

A control such as pause, retry, change a limit, or cancel should name the exact run and reviewed revision or generation. Explain its likely scope before submission: stop new work, interrupt in-flight work, or request best-effort cancellation. Consequential actions belong behind the required authority or [reviewed-proposal boundary](../review-exact-proposal/COOKBOOK.md); hiding a button is not authorization.

Freeze the submitted control intent separately from further editing. Show request accepted, awaiting application, applied, rejected, or uncertain as distinct outcomes. Preserve its command identity on transport retry. If the run changed or already finished, show the observed terminal result and let the person deliberately compose a new action if appropriate. Never rebind an old Cancel request to a later run with the same display name.

For partial results, define what survives cancellation and what must be reconciled. A retry may be a new attempt with its own identity, not a replay of the old control. External effects need their own deduplication or compensation policy; Tendriller command durability alone cannot roll back another system.

## Support useful attention

Do not wake an agent or notify a person for every measurement. Select meaningful thresholds, failures, completion, prolonged lack of progress, or explicit requests. Coalesce repeated notices and link them to a stable run outcome. Notification delivery, page visibility, and agent wake are different mechanisms; verify the chosen one before promising off-page awareness.

On agent resume, restore the task brief separately from the event-consumer handled checkpoint. A chart cursor does not prove that an agent handled an intervention. Show when a response is awaiting the agent, while continuing to report process evidence independently. Offer accessible text summaries and keyboard-operable log filters; avoid announcing each live line to a screen reader.

## Close out without hiding uncertainty

A completed view should identify the final result, warnings, skipped work, retained evidence, and outstanding control requests. Let the person export the actual retained range with source/run identity, units, timestamps, and known gaps. Do not label a bounded screen export “full job log.” If complete evidence is required, choose an archive before starting the process.

Preserve terminal states as observations; a late “running” packet should not silently overwrite a newer authoritative completion. The policy for ordering or revision comparison belongs to the source integration and must be explicit. Retire live subscriptions and collector credentials deliberately according to whether further runs are expected.

## Verify consequential transitions

| Scenario | Expected observation |
| --- | --- |
| Producer stops while a job may still run | Status becomes stale or uncertain, without fabricated failure or progress. |
| Job reports heartbeat but no work | Liveness and lack of progress remain distinguishable. |
| Completion races with Cancel | Final source outcome and control receipt are both visible; no false rollback claim. |
| Control acceptance reply is lost | Retry preserves intent and reconciles the original result. |
| A second run has the same label | Old charts, controls, and replies remain bound to the original run identity. |
| History expires during absence | The restored view and export retain an incomplete-history marker. |
| Agent receiver disappears | Process observation continues where supported, and response availability is represented separately. |
| New log entries arrive during inspection | Focus and reading position remain stable until the person chooses to follow latest. |

These are acceptance scenarios to exercise in the real adaptation. Source status and external control behavior require actual integration evidence, not only a dashboard fixture.
