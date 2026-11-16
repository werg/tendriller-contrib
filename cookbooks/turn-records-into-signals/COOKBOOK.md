---
id: "turn-records-into-signals"
title: "Turn messy records into useful signals"
summary: "Project fields, preserve units, and bound flattening without silently changing the meaning of a source record."
group: "Make sense of information"
tags: ["records", "projection", "limits"]
choices: ["Explicit field projection or bounded flattening", "Missing/null/malformed values and units", "Collision, depth, cardinality, and byte limits"]
capabilities: []
evidence: "explained"
related: ["ingest-bounded-telemetry", "present-live-measurements", "import-for-review"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/COLLECTOR.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/tools/collector/lib/stream-sources/records.mjs"]
---

# Turn messy records into useful signals

Use an adapter when an existing log or API record contains useful data in a shape the page cannot directly interpret. If the source can emit a clear numeric schema, that is often better than increasingly clever inference. Preserve the original or a provenance reference when later review matters.

## Choose projection before flattening

Explicit paths make field selection understandable. A path segment containing a dot or slash may be a literal key; do not split it unless the source contract says to. Decide whether an absent key, explicit null, empty string, and nonnumeric value have different meanings. Do not coerce booleans or arbitrary strings to numbers because a chart expects a number.

Flattening can simplify a wide record but risks collisions, deep recursion, and exploding cardinality. Set maximum depth, number of fields, array treatment, and output bytes. Choose collision behavior—reject, preserve nested paths, or rename explicitly—rather than silently overwriting. Keep source/run identity and units visible after projection.

## Adapt and check

Start from representative source records and define a small mapping with reasons. Label derived values and transformations. For aggregate statistics, include denominators and missing counts; a mean over valid samples is not the mean over all intended samples. Separate malformed-source diagnostics from measured data so parse errors do not become zero readings.

Test literal dotted keys, nested arrays, absent versus null fields, collisions, oversized records, excessive depth, nonfinite values, and changing source shape. Compare output against manually expected values. If a mapping changes, revise the model/checkpoint identity so cached interpretations are not silently reused under different semantics.
