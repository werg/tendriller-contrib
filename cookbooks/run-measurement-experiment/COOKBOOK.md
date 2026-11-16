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

Use an experiment page when a person needs to compare conditions or intervene in a measured process. A static uploaded dataset may be enough when there is no live decision. A simulation can help develop the interface, but its records must remain visibly distinguishable from instrument observations.

## Define the measurement

Name the source/run, units, calibration, acquisition time, and independent variable. Keep protocol parsing separate from scientific interpretation. A valid JSON record can still contain a physically meaningless value. Decide how to represent malformed input, missing samples, out-of-order data, and reset boundaries.

Choose raw retention and summary buckets independently. A bucket average loses extremes and timing; min/max and sample count can preserve useful variation. If sample spacing is irregular, a sample average and a time-weighted average answer different questions. Do not label either as the other. Record interventions as events with their time and meaning rather than encoding them as unexplained jumps in a metric.

## Adapt and verify

Use a compact control panel for an instrument, a comparison table for runs, or a chart with exact values when trends matter. Bound live model size and painting cost without dropping admitted ingestion. Export should identify retained range, units, source/run, algorithm parameters, simulation status, and known gaps. If full raw evidence is required, select an archive outside the bounded display.

Test a malformed packet, missing run identity, changed calibration, timestamp discontinuity, long burst, and a stop during an intervention. Compare bucket statistics against known records and verify counts. Test export after eviction so it cannot imply the complete experiment survived. Use actual instrument checks before claiming measurement accuracy; browser fixtures prove only their supplied records.
