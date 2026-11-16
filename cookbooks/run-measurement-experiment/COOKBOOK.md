---
id: "run-measurement-experiment"
title: "Run a bounded measurement experiment"
summary: "Choose acquisition, aggregation, intervention, and export policies before treating a dashboard as an experimental record."
group: "Make sense of information"
tags: ["experiments", "aggregation", "provenance"]
choices: ["Live acquisition, uploaded data, or declared simulation", "Raw retention versus explicit summary buckets", "Intervention records and honest export scope"]
capabilities: []
evidence: "explained"
related: ["connect-instrument", "present-live-measurements", "ingest-bounded-telemetry"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/hardware-experiment/AGENT.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/hardware-experiment/model.mjs"]
---

# Run a bounded measurement experiment

Use an experiment page when a person needs to compare conditions or intervene in a measured process. A static uploaded dataset may be enough when there is no live decision. A simulation can help develop the interface, but its records must remain visibly distinguishable from instrument observations. A polished chart does not itself make a defensible experimental record.

## Start with a question and a closeout decision

For example, a person might compare how two fan settings affect a room's measured temperature over a fixed interval. Before collecting, state the question, what will be changed, what will be observed, and what result would justify the next action. Record the relevant context and limitations; a simple demonstration cannot establish causation merely because two curves differ.

Guide the person through setup, preflight, baseline, running, intervention, stop, review, and export. The initial view should identify the instrument or file source, proposed run name, units, expected duration, storage budget, and whether the data is live, imported, or simulated. A run name is a readable label; assign a separate stable identity that survives renaming.

A small experiment can use one control panel and a result table. Add a comparison chart, multiple runs, or annotated events when those features answer the question. Prefer an explicit procedure with a few meaningful checkpoints over a general laboratory dashboard that introduces uncontrolled choices.

## Define the measurement before choosing controls

| Decision | What to record | Why it affects interpretation |
| --- | --- | --- |
| Source and run | Stable identities and acquisition method. | Concurrent or repeated runs must not merge accidentally. |
| Quantity and unit | Raw unit, any conversion, and valid domain. | A numeric record can still be physically meaningless. |
| Time coordinate | Acquisition time, arrival time when relevant, and ordering policy. | Delivery delays should not appear to be experimental delays. |
| Calibration | Identifier, parameters, method, and applicable interval. | A changed calibration changes the meaning of subsequent values. |
| Independent variable | Intended condition and actual observed application when available. | Requesting a setting does not prove the instrument applied it. |
| Missing-data policy | Invalid, absent, late, and out-of-order handling. | Missing observations must not become zero or hidden continuity. |
| Retention | Raw record budget, summaries, and any archive destination. | A screen buffer is not the complete experimental record. |

Keep protocol parsing separate from interpretation. Validate shape, bounds, units, and run identity without silently correcting implausible measurements. If a source cannot provide acquisition time, label the recorded time as arrival time. Treat clock discontinuities and source restarts as visible boundaries.

For calibration changes mid-run, either close the run and start another or record an explicit interpretation segment with the new calibration. Do not relabel all historical values using the latest calibration. Preserve original measurements and derivation parameters when later review matters.

## Choose acquisition and aggregation deliberately

Live acquisition helps when the person must react during the run. Uploaded data is simpler when the experiment already happened. Declared simulation supports training and interface development. Keep their identities and exports separate, and do not fill a live gap with simulated samples.

Raw retention and summary buckets are independent choices. A bucket mean loses extremes and timing; minimum, maximum, valid count, and missing count can preserve useful context. A sample mean and a time-weighted mean answer different questions when spacing is irregular. For an illustrative interval with values 10 and 20, the sample mean is 15 regardless of how long either condition lasted; a time-weighted result needs defined intervals and a documented interpolation or hold model. Do not call one calculation the other.

Define bucket boundaries, interval inclusion, and the handling of late data. Empty buckets remain empty. Label provisional summaries if late records can revise them. If a complete raw record is required, select and verify an archive before starting; increasing a chart's point limit is not an archival strategy.

Bound both the admitted model and painting cost. Coalesce redraws without silently discarding admitted observations. A paused view can continue acquisition, while pausing the experiment may stop or mark acquisition according to the source's real behavior. Give these actions different labels.

## Make interventions part of the record

Provide controls only for operations the actual source supports. Before changing a consequential setting, show the exact run, requested value and unit, applicable bounds, and any required review or authorization. Separate requested, accepted, applied, rejected, and uncertain outcomes. A disabled button is a usability cue, not the enforcement boundary.

Record interventions as events with their time, identity, and meaning rather than encoding them as unexplained jumps. A person's note can say that they opened a window; it should not claim the instrument confirmed that action. Bind an instrument response to the original request where supported. If the request's reply is lost, reconcile that intent before sending a potentially duplicate physical command.

Allow notes and evidence annotations without stopping acquisition. Keep them attached to an exact run and interval, and retain corrections as revisions when they change interpretation. A delayed note can carry both the stated event time and the time it was recorded. Do not move previous annotations when the plot rescales.

## Review before calling the run complete

Stopping acquisition and closing the record are different steps. Show remaining buffered work, pending interventions, and incomplete uploads. Let the person inspect known gaps, malformed input counts, unit/calibration changes, and any source uncertainty. A closeout summary should state the actual recorded interval and why the run ended.

Compare runs only after aligning the intended quantity, units, condition definitions, and coordinate. Alignment by elapsed time, absolute time, or experimental step has different meaning. Show absent intervals and avoid implying that two unmatched observations are simultaneous. Keep raw values available through an accessible table or text inspector alongside visual trends.

Export the retained range, source/run identities, units, time basis, calibration, algorithm parameters, simulation status, interventions, and known gaps. Include the export's creation time and format version where restoration matters. If only summaries remain, state that plainly. A result narrative should distinguish observation, calculation, and interpretation.

## Verify before relying on the record

| Scenario | Expected observation |
| --- | --- |
| Source emits a malformed packet or missing run identity | Input is diagnosed under the stated policy and cannot contaminate another run. |
| Calibration or unit changes | The view creates the chosen explicit boundary or conversion, preserving original meaning. |
| Long burst exceeds paint capacity | All admitted records reach the bounded model; redraw coalescing alone reduces rendering. |
| Timestamp moves backward or a source restarts | Ordering uncertainty is visible and run segments are not silently joined. |
| Empty, irregular, and late buckets | Counts and statistics match manually calculated reference cases. |
| Stop is requested during an intervention | Acquisition, command outcome, and unresolved effects remain separately visible. |
| Export follows raw eviction | The file describes retained summaries/ranges and cannot imply a complete raw archive. |
| Simulation is used for rehearsal | Every relevant screen and export keeps its simulation status. |

Use actual instrument checks before claiming measurement accuracy or applied control behavior. Browser fixtures establish how the supplied records and interactions are presented; they do not validate the physical experiment.
