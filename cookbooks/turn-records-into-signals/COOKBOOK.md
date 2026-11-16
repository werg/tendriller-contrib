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

Use an adapter when an existing log or API record contains useful information in a shape the page cannot directly interpret. If the source can emit a clear numeric schema, that is often simpler than increasingly clever inference. Preserve the original or a provenance reference when later review matters. The goal is a reviewable interpretation, not merely a record that a chart accepts.

## Build a mapping people can inspect

Imagine a job log with nested metrics, literal dotted keys, optional values, and mixed runs. The person wants three signals: step, loss, and throughput. Start by showing representative input records beside the proposed output, then let them review field selection, names, units, missing-value behavior, and excluded data before enabling the mapping.

The first preview should include more than a convenient success record. Include an absent field, explicit null, malformed value, a second run, and a large record if those occur in the source. Show accepted and rejected counts with concrete reasons. A transformation that “worked” for one sample may discard the rest of a source.

Keep the review interaction small: choose fields, inspect paths and types, label meaning, validate a sample range, confirm the mapping version, then observe output and diagnostics. For a fixed integration, a readable configuration plus a before/after table may be better than an interactive mapping editor. Add editing controls when a person actually needs to maintain mappings without changing code.

## Choose explicit projection before flattening

| Decision | Practical default | Choose differently when |
| --- | --- | --- |
| Field selection | Literal path segments to named output fields. | The source's wide and changing shape genuinely requires bounded discovery. |
| Missing field | Preserve absence and count it. | A documented domain default is valid and explicitly identified. |
| Explicit null | Preserve its distinct meaning. | The source contract defines null as equivalent to missing. |
| Numeric text | Reject or flag until an explicit parser is selected. | A known source grammar, locale, and unit justify conversion. |
| Arrays | Select a documented index or retain a bounded structured value. | A deliberate expansion defines stable identities and cardinality. |
| Collision | Reject the mapping or preserve unambiguous paths. | An explicit reviewed renaming policy resolves it. |

A path segment containing a dot or slash may be a literal key. Do not split it unless the source contract requires that interpretation. For example, `["train.loss"]` and `["train", "loss"]` can select different values. Core collector projection uses literal path arrays and preserves JSON value types; it is selection/renaming rather than an expression engine. Read the [public collector reference](https://github.com/werg/tendriller/blob/7c6e61529e8878a1dc3585f2eb4d9cc8945f734d/docs/tools/COLLECTOR.md) before writing its configuration.

Core's source/run metadata policy also matters: supplied values, including explicit null or an empty string, remain distinguishable from absence, and configured defaults fill absent fields only. Do not overwrite these identities to make a chart look cleaner. Server-assigned producer authority is separate from source-provided labels.

## Define transformations as application policy

If a page needs a derived value, name its inputs, output unit, valid range, and failure behavior. Keep raw values available when useful. A rate requires a defined interval and reset policy; a percentage requires a nonzero denominator and known bounds. Rounding for display should not silently alter stored evidence.

Do not coerce booleans, empty strings, arbitrary text, nonfinite values, or malformed numbers merely because the destination expects a number. If parsing numeric text is appropriate, document its grammar and locale. The strings `"1,234"` and `"1.234"` can be ambiguous across conventions; unresolved input should remain reviewable rather than guessed.

For an aggregate, show valid count, missing count, and excluded count. A mean over valid samples is not a mean over all intended observations. Preserve source/run boundaries before grouping, and state whether late records revise previous summaries. Label every derived column with its definition or a reachable explanation.

Separate malformed-source diagnostics from measured data. A parse failure is an event about acquisition, not a zero reading. Diagnostic payloads need size and privacy limits too; quoting the entire failed line can reveal sensitive source data or exceed the very budget being enforced.

## Bound flattening and discovery

Flattening can simplify a wide record but introduces collisions, recursion depth, and exploding field cardinality. Set maximum depth, output fields, array expansion, key length, and total bytes. Bound the input record before expensive traversal. When a limit is hit, choose rejection, truncation with explicit omitted-path accounting, or another documented fallback; do not silently overwrite or discard fields.

Stable output names matter over time. Discovery from one record must not remap an existing series when a new key appears or object property order changes. If flattened paths can collide, use an unambiguous representation or a reviewed naming table. Avoid treating attacker-controlled keys as trusted object properties or markup; render names as text and keep data separate from code.

A preview can suggest candidate fields, but the confirmed mapping should be inspectable and versioned when changes affect interpretation. Record the source sample identity, selected paths, transformations, units, limits, and missing/collision policy. This is an application model, not a new universal contrib schema.

## Change mappings without rewriting history

On a mapping change, show a sample diff: fields added/removed, unit changes, altered validity counts, and affected run ranges. Decide whether to create a new interpretation series or explicitly reprocess retained originals. If originals have expired, explain which intervals cannot be recomputed; do not mix old and new semantics under one unchanged label.

Revise model/checkpoint identity so cached interpretations are not restored under new rules. Rebuild both the model and its cursor when required. A new mapping does not authorize repeating external actions triggered by the old interpretation. Keep such actions bound to their original evidence and command identities.

Make output inspection accessible through a table and textual diagnostics. Preserve focus when a preview refreshes, provide a clear empty result when no records qualify, and let the person inspect rejected examples before accepting a partial mapping. Minimize sensitive fields at acquisition where practical instead of hiding them only in the visualization.

## Verify against manually expected records

| Input or change | Expected observation |
| --- | --- |
| Literal dotted key and nested key both exist | The selected path returns exactly the reviewed value. |
| Field absent, null, empty, boolean, and zero | Each follows its documented policy; none becomes zero accidentally. |
| Nested arrays or excessive depth | Traversal stays bounded and reports the chosen rejection/truncation outcome. |
| Two paths flatten to the same name | Collision is visible or resolved by the explicit naming policy. |
| Oversized record or huge field cardinality | Resource limits apply before unbounded processing; diagnostics remain bounded. |
| Source shape changes mid-run | Missing/invalid counts reveal drift without inventing new meanings. |
| Mapping or unit changes with a saved checkpoint | Incompatible cached interpretation is rejected or deliberately rebuilt. |
| Partial sample acceptance | Preview and export identify accepted, missing, and excluded populations. |

Keep the small expected-record set with the adaptation when it supports ongoing maintenance. Deterministic examples establish the mapping's behavior; they do not establish the accuracy of the originating instrument or API.
