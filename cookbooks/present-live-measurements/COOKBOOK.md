---
id: "present-live-measurements"
title: "Present live measurements honestly"
summary: "Choose a bounded data model, rendering approach, and recovery policy without hiding gaps or mixing runs."
group: "Make sense of information"
tags: ["streams", "visualization", "recovery"]
choices: ["Latest reading, trend, or run comparison", "Raw values, EMA, or time-aware smoothing", "Replay or an atomic view-and-cursor checkpoint"]
capabilities: ["streams"]
evidence: "exercised"
related: ["choose-data-model", "ingest-bounded-telemetry", "recover-outdated-work"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/README.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/chart.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/stream-view.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/examples/training-dashboard/model.mjs"]
---

# Present live measurements honestly

Use this when a person needs to understand an evolving process. First decide whether they need the latest reading, a trend, a comparison between runs, or evidence for a decision. A numeric readout may answer the question better than a chart. A chart is a presentation choice, never the storage model.

## Help the person arrive, inspect, and decide

For a room-condition monitor, the first decision might be whether a recent temperature rise is real, recent, and large enough to act on. Begin with the selected source/run, an exact latest reading and unit, the observation's age, and the interval available for inspection. An empty chart should distinguish waiting for the first sample, no source selected, permission unavailable, and no records in this interval. These states lead to different actions.

Offer a deliberate path from glance to detail: select a source, inspect a trend, choose an observation, compare raw values, and record or export the evidence behind a decision. A paused display freezes inspection, not necessarily acquisition; label it “View paused” and continue admitted ingestion under the budget. When the person resumes following latest, show whether values arrived or were evicted while the view was paused.

| Feature | Useful default | Tradeoff to disclose |
| --- | --- | --- |
| Range selection | A recent interval with visible start/end and retained bounds. | An older selection may be incomplete after retention or display eviction. |
| Source/run selector | Stable identities with readable labels. | Renaming a label must not merge histories or move an old annotation. |
| Exact-value inspection | Keyboard-operable table or details alongside the chart. | A nearest-point shortcut differs from comparing at the exact same x. |
| Auto-follow | Follow newest data until the person intentionally inspects history. | New arrivals should not constantly move their selected point. |
| Threshold cue | Label the threshold's units and policy, with an acknowledgement action. | A crossing is an application interpretation, not proof of a physical event. |
| Export | The selected retained interval and its transformation description. | Exporting the view is not exporting the complete source archive. |

Use series names, line patterns, and text as well as color. Keep focus stable when a new sample arrives or a selected point falls outside the retained range; explain that eviction and offer the nearest retained interval without silently changing what was selected. Provide a concise textual trend summary when useful, but make it traceable to actual records rather than turning a noisy curve into a certain conclusion.

Separate unit conversion from smoothing and display scale. A change of source unit or calibration is a semantic boundary: reject incompatible values, split the series, or apply a documented conversion. Do not merely relabel an axis. Keep raw values and conversion metadata available for review. A changed mapping or transform should invalidate an incompatible cache and identify the interpretation used by an export.

For a long session, show the ingestion and retention status independently of whether a canvas is repainting. Pause or slow rendering when appropriate without silently dropping admitted data. Stop subscriptions when leaving the task; guard late callbacks so they cannot repaint a different run or a revoked view. The interaction choices in this section are proposed adaptations; the evidence record below covers only its named specimens and scenarios.

## Start with meaning and budgets

Name the source, run, units, and x coordinate before choosing a renderer. Source time, arrival time, training step, and distance are different quantities. Two runs with the same metric name must not become one line. Reject nonfinite coordinates; keep missing measurements distinguishable from zero. State whether duplicate x values are revisions or separate observations, and whether late data may change an already displayed interval.

Choose the visible raw-data budget, server retention, and local checkpoint budget independently. For sample rate `r` and useful visible duration `T`, `r × T` is an initial display budget. Then account for bursts, memory, irregular sampling, and aggregation. A small chart buffer does not reduce server storage or preserve evidence that has expired there. If the complete record matters, select an archive deliberately.

## Decisions that change the implementation

| Decision | A useful starting choice | Choose differently when |
| --- | --- | --- |
| Current value or history | Use a stream for ordered observations and state for selected range or summary. | Only the newest value matters, or authorized private records own the evidence. |
| Smoothing | Keep raw values visible; offer sample-weighted EMA for regularly spaced noisy observations. | Spikes are the task, or irregular timing calls for time-aware decay. |
| Scale | Start with a linear scale and explicit missing segments. | Ratios over orders of magnitude answer the question; label a log scale and retain nonpositive raw values for inspection. |
| Inspection | Compare exact observations at the same x and show absence. | A justified interpolation model is part of the task; label it and explain uncertainty. |
| Replay | Apply every admitted record to a bounded model; coalesce only repainting. | Intentional aggregation is the ingestion policy; document what is discarded. |
| Reload | Rebuild a small view from retained history. | Replay is expensive; checkpoint the complete materialized view and its cursor together. |

For a sample-weighted EMA, `s = alpha × y + (1 − alpha) × previous`. A larger alpha reacts faster. Fixed alpha weights samples rather than elapsed time. With irregular intervals, `alpha = 1 − exp(−deltaTime / tau)` can represent a time-decay model. Neither formula decides what a gap means. Choose whether a missing segment resets smoothing. Perform smoothing in original units before a logarithmic display unless a different scientific model is justified.

The extracted chart seeded EMA at the oldest retained observation, restarted at gaps and nonpositive log values, and recomputed the bounded window after eviction. Earlier displayed averages could therefore change. Those are example semantics, not requirements on every adaptation. The [small numerical specimen](snippets/measurements.mjs) makes these decisions inspectable.

## Adapt the plan

1. Inspect the actual records and the person's question. Write down units, record identity, missing values, duplicate policy, and retention owner.
2. Decide which values belong together. Preserve source and run boundaries even when the display groups them visually.
3. Define a bounded model independent of DOM or canvas. Apply ordered records synchronously; do not drop records merely to save repaints.
4. Give transformations explicit names. Make exact raw values accessible through text, a table, or selection details.
5. If replay is asynchronous, advance the processing checkpoint only after processing succeeds. A subscription callback returning a promise does not imply an acknowledged consumer.
6. If caching, atomically save `{modelVersion, cursor, view, historyIncomplete}` under a key that includes page, reader, stream, and interpretation. Validate all fields before restoring.
7. Authorize the current reader before displaying private cached values. Clear or segregate caches on identity changes. Stop subscriptions and clear sensitive DOM immediately, then check the new identity. Guard pending authorization, stream callbacks, and scheduled paints with the same view generation so an older success cannot restore a revoked view. Local storage grants no authority.
8. On corrupt or incompatible cache, rebuild both model and cursor; never restore only the cursor. Preserve a known history gap across reloads.
9. Expose stale data, unavailable storage, and incomplete retention as distinct states. Keep the last coherent checkpoint when a save fails.

## Two intentionally different adaptations

A desktop observatory can use multiple aligned panels, a keyboard-operated shared-x inspector, and a detailed source/run table. It needs comparison and historical context. A mobile instrument can show one exact reading, freshness, a small trend, and a clear gap notice. It needs glanceable status, not desktop navigation. The [desktop specimen](checks/desktop/index.html) and [nested mobile specimen](checks/mobile/pages/index.html) use different DOM and information density. They are verification specimens, not recommended page templates.

Both must process the same admitted records, separate runs, retain raw values, and restore a coherent checkpoint. Neither needs contrib metadata in its published directory.

## Verify the decisions

- Replay a burst larger than the paint budget. Every admitted record changes the model even if only one paint occurs.
- Give two runs the same metric name. They remain separate, including after reload.
- Select an x absent from one series. Show a missing value; do not silently choose a nearby sample.
- Feed zero, negative, null, and nonnumeric values to a log view. Raw values remain inspectable and invalid segments remain gaps.
- Evict old observations. Export and summaries say which samples are retained; smoothing follows the stated seed policy.
- Fail storage during save and reload. Restore the previous complete checkpoint or deliberately rebuild both halves.
- Expire server history. The incomplete-history notice persists after checkpoint/reload.
- Revoke access. Cached private values do not appear merely because they are on disk.

**Evidence:** five numerical cases and eight browser scenarios across the desktop and mobile adaptations passed. The [pilot record](../../guides/pilot-evidence.json) identifies exact source, runtime, preview, browser, and CI artifacts. These checks cover bounded ingestion, exact values, gaps, reload, and delayed authorization changes. A fixture display does not establish live service authorization or production retention behavior.
