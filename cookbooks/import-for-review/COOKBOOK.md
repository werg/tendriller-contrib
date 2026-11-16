---
id: "import-for-review"
title: "Import information for review"
summary: "Turn pasted or uploaded data into a correctable model with preserved originals and explicit partial acceptance."
group: "Collect evidence"
tags: ["import", "review", "provenance"]
choices: ["Manual entry or staged import", "All-or-nothing versus explicit partial acceptance", "Ambiguous mappings, preserved originals, and retry identity"]
capabilities: []
evidence: "explained"
related: ["turn-records-into-signals", "separate-evidence-interpretation", "review-exact-proposal"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/COLLECTOR.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/model.mjs"]
---

# Import information for review

Use an import flow when people bring spreadsheets, copied text, logs, or documents that need interpretation before the system acts. If a small manual form is clearer, use it. Parsing is not validation, and validation is not approval of the resulting action.

## Separate stages

Preserve the original input or its authorized reference. Parse into candidate records, map fields and units, validate domain constraints, then show a review before acceptance. Distinguish a parse failure from an ambiguous mapping or a domain-invalid value. Do not silently choose a date locale, unit conversion, or duplicate policy when it can change meaning.

Choose all-or-nothing versus partial acceptance. Partial acceptance is useful for large datasets but needs a durable report of accepted, rejected, and unresolved records plus stable IDs for retry. A retry must not duplicate rows already accepted. Undo may be a compensating operation with limitations, not a promise to erase external effects.

## Adapt and check

Design review around consequential ambiguities rather than exposing every parser detail. Show originals beside corrected values when useful, preserve provenance, and keep local corrections separate from accepted records. Bind acceptance to a reviewed snapshot/revision so late changes do not alter what the person approved.

Test malformed rows, mixed units, ambiguous dates, duplicate keys, huge fields, partial failures, edited mapping, and retry after acknowledgement loss. Verify originals remain available to authorized readers and that export includes corrections and limitations. This guide is an explained extension from record-projection and reviewed-capture reasoning; actual task adaptations should refine it before an evidence label is promoted.
