---
id: "separate-evidence-interpretation"
title: "Keep evidence and interpretation separate"
summary: "Preserve original observations while allowing conclusions, labels, and explanations to evolve."
group: "Collect evidence"
tags: ["evidence", "provenance", "notes"]
choices: ["Append-only note or structured observation record", "Original evidence versus editable interpretation", "Retention, search coverage, and export scope"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "reconcile-concurrent-edits", "ask-about-evidence"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/AGENT.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/model.mjs"]
---

# Keep evidence and interpretation separate

Use this for field notes, inspections, interviews, or experiments where later reasoning may change without changing what was observed. A simple append-only note can be enough for casual work; a structured notebook is useful when provenance, review, search, or export matters.

## Choose what remains original

Give each observation a stable ID, acquisition time, source identity, units, and reviewed evidence references. Preserve the original text/media or a deliberate immutable snapshot. Keep interpretation, tags, summaries, and confidence separately editable. A correction to an observation should be visible as a correction, not silently rewrite the source of a prior conclusion.

Location and media can be sensitive. Choose whether to collect precise location, coarse place labels, or no location; precision is not inherently useful. Use the reviewed capture flow before sending. A stored file reference must retain its authorization and retention meaning after the notebook is archived or exported.

## Adapt the notebook

Design the page for the actual work: a quick mobile entry, a searchable table, a spatial view, or a chronological journal. A fixed hundred-entry limit was an example choice. Set local display, server retention, and export budgets separately. Search should expose what fields and retained time range it covers; an empty result is not proof that no observation ever existed.

Keep local drafts separate from saved observations. Make acceptance and rejection visible and retain original concurrency context when work is retried. Let the agent link conclusions to observation IDs so a later correction can identify which conclusions need review.

## Verify

Edit an interpretation without changing original evidence, correct an observation with a visible history, and delete or expire source media. Check the page's explanation of missing evidence. Test concurrent edits, an offline draft during task reset, and export of a bounded subset. Ensure source IDs, units, timestamps, and limitations survive export; a pretty summary alone is not an evidence archive.
