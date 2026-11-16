---
id: "ask-about-evidence"
title: "Ask a question about reviewed evidence"
summary: "Bind questions and replies to specific sources and distinguish observation from interpretation."
group: "Collect evidence"
tags: ["evidence", "reasoning", "correlation"]
choices: ["Question-led source selection and context", "Observed fact, inference, and unresolved uncertainty", "Stable evidence/reply correlation"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "annotate-a-frame", "separate-evidence-interpretation"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/photo-inspector/index.html", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/AGENT.md"]
---

# Ask a question about reviewed evidence

Use this when a person wants an agent to interpret an image, document, sketch, or measurement. Start with the question. A close-up photo may not answer a question about dimensions or history; additional context may matter more than a higher-resolution image. If the original source is unavailable, state that limitation before presenting conclusions.

## Keep correlation and provenance

Give the evidence and the submitted question stable IDs. Snapshot the question and task context at send time. A reply to an earlier image must not appear as a judgment of a new retake. If several sources disagree, preserve the disagreement rather than collapsing it into a confident summary.

Separate observations that are visible in the source from inferred explanations and suggested actions. For annotations, bind geometry to the exact frame and coordinate transform. For measurements, retain units, provenance, gaps, and uncertainty. A text description may be the best fallback for inaccessible or private source material.

## Adapt and check

Use the reviewed-capture flow, then choose a response layout that supports the task: a concise answer, a side-by-side comparison, labelled regions, or a list of unresolved questions. Let the person correct an interpretation without replacing the original evidence. Keep source references in exported conclusions where appropriate.

Test retake while a reply is pending, a late reply, unavailable source, contradictory measurements, a user correction, and rejected submission. The UI should explain which evidence each result addresses and which claims remain uncertain. A polished annotation is not proof that the underlying inference is correct.
