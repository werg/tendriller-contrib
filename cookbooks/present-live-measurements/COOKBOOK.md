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
