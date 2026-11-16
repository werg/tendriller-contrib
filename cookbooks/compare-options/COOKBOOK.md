---
id: "compare-options"
title: "Build a comparison and decision workspace"
summary: "Make criteria, units, provenance, and uncertainty inspectable instead of disguising assumptions behind a single score."
group: "Decide and act"
tags: ["comparison", "decisions", "uncertainty"]
choices: ["Table, small multiples, narrative, or interactive weights", "Hard constraints versus compensating preferences", "Missing evidence and sensitivity to assumptions"]
capabilities: []
evidence: "explained"
related: ["present-live-measurements", "review-exact-proposal", "import-for-review"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/approval-remote/AGENT.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/chart.js"]
---

# Build a comparison and decision workspace

Use a comparison workspace when a person must choose among alternatives with several meaningful criteria. A short narrative recommendation may be enough when one constraint dominates. A weighted score is useful only when its assumptions help the decision; it should not manufacture precision.

## Choose the representation

A table supports exact values and missing-data inspection. Small multiples reveal patterns without mixing incompatible units. A narrative can explain qualitative tradeoffs. Interactive weighting can show sensitivity, but the person must understand scales, normalization, and whether a high value is good or bad.

Separate hard constraints from preferences. An option that violates a required constraint should not win by compensating elsewhere in a weighted average. Preserve provenance and observation dates for values that can change. Unknown is not zero, and contradictory evidence should remain visible until resolved.

## Adapt and verify

Start with the actual decision and ask which criteria can change the outcome. Keep raw values, units, sources, and uncertainty accessible. If deriving a score, state its formula, normalization, handling of missing values, and weight sum policy. Let the person inspect at least one plausible alternative and why it loses under the chosen assumptions.

Test missing and contradictory evidence, incompatible units, an outlier changing normalization, and weights at zero or extremes. Apply the approach to two unrelated tasks before claiming it is broadly useful. This guide is a reasoned extension from the measurement/approval pilots; it has no field-use claim yet.
