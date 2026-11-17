---
id: "import-for-review"
title: "Import information for review"
summary: "Turn pasted or uploaded data into a correctable model with preserved originals and explicit partial acceptance."
group: "Collect evidence"
tags: ["import", "review", "provenance"]
choices: ["Manual entry or staged import", "All-or-nothing versus explicit partial acceptance", "Ambiguous mappings, preserved originals, and retry identity"]
capabilities: []
evidence: "explained"
related: ["turn-records-into-signals", "separate-evidence-interpretation", "review-exact-proposal", "build-correctable-forms"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/docs/COLLECTOR.md", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/field-notebook/model.mjs"]
---

# Import information for review

Use an import flow when someone brings a spreadsheet, copied table, log, or document that needs interpretation before it becomes application data. A small manual form may be clearer for a handful of items. The useful result is a reviewed, correctable set of records with an accountable receipt. Parsing bytes, validating records, and authorizing an action are separate decisions.

For example, a person importing an equipment inventory may supply mixed date formats, prices in different currencies, and two names for the same item. A successful parser is only the beginning. The interface must help them resolve the ambiguities that affect meaning without forcing them to inspect every mechanical detail.

## Design the staged journey

1. **Choose input.** Explain supported formats, size limits, expected columns, and what the page will do with the original. Offer paste or manual entry where feasible. Do not upload private source material before the person understands the destination.
2. **Inspect.** Show the filename or source label, record count if known, and a small representative preview. Treat imported text as data, never executable markup or instructions to the agent.
3. **Map.** Suggest field mappings and display uncertain matches. Ask explicitly about date interpretation, decimal separators, units, and identifiers when a wrong choice changes meaning.
4. **Validate.** Separate unreadable input, unmapped fields, domain-invalid values, duplicates, and warnings. Show counts and a filterable set of affected rows with their source locations.
5. **Correct.** Let the person edit the candidate model, apply a reviewed correction to similar rows, or return to mapping. Preserve original values beside corrections where the difference matters.
6. **Review.** Present the exact proposed additions, updates, skips, unresolved items, and any destructive effect. Acceptance names a fixed candidate snapshot and policy, not “whatever is currently in the file.”
7. **Commit.** Use the selected service operation and stable command identity. Distinguish queued, accepted, partially accepted, rejected, and unknown outcomes where they can occur.
8. **Reconcile.** Provide a durable result report and a way to fix rejected rows without resending accepted ones. Keep a separate draft for subsequent edits while an import is pending.

Back navigation should keep the source and intentional corrections. Changing a mapping can invalidate downstream corrections; show which values will be recalculated rather than quietly erasing the person's work.

## Keep the import model inspectable

An application-owned candidate might retain a source identity, source row or location, original values, mapped values, validation findings, duplicate match, and intended operation. A batch has its own ID, parser/mapping version, review revision, and acceptance policy. These are example concepts, not a required universal schema.

Use stable source-row identities within the batch, including when rows are filtered or sorted. A visible row number is useful for finding an error but is not a durable record key after editing. If a file is replaced, assign a new source identity and recompute the review; do not attach the previous approval to different bytes.

Preserve the original input or an authorized immutable reference when that is necessary for audit or correction. A digest helps identify bytes but does not grant access or retain a blob by itself. Decide separately how long raw imports, rejected rows, and accepted records remain available. Importing data into ordinary shared state makes it accessible under that state's actual access policy; a hidden preview column is not a privacy boundary.

## Choose acceptance and duplicate policies

| Decision | Useful option | Tradeoff |
| --- | --- | --- |
| Batch acceptance | All-or-nothing when records must stay coherent. | One invalid record blocks the batch; the chosen server operation must actually supply atomicity. |
| Partial acceptance | Accept independent valid rows after explicit review. | The receipt must identify accepted, rejected, and unresolved rows and support safe continuation. |
| Duplicate handling | Match by a declared stable domain identifier. | A name or fuzzy match may be ambiguous; route ambiguity for review. |
| Existing record update | Preview changed fields against an authoritative revision. | A concurrent change may invalidate the reviewed update and require reconciliation. |
| Bulk correction | Preview affected rows and sample edge cases before applying. | A convenient global rule can damage outliers if its scope is hidden. |

Capture the reviewed records and application revision with one coherent `session.query`. Submit a declared domain command with stable operation identity and `basedOn`; the definition must check the reviewed domain versions, author and allowed transition before making all covered changes atomically. Keep later typing separate, restore pending work from `session.operations`, and use exact retry after a lost reply. A rejected or abandoned attempt needs current review before new intent. The [concurrent editing guide](../reconcile-concurrent-edits/COOKBOOK.md) explains this common boundary. Content transfer and external effects have their own receipts; a button does not combine separate authorities into a transaction.

A replay after a lost reply must recover the original outcome, not create another batch with new identities. Deduplication of delivery differs from deduplication of source records: two identical-looking rows may be intentional, while the same accepted command must not create them twice. For a deliberate corrected import, create new intent and show which previous rows it replaces or supplements.

## Make review usable at realistic scale

Start with a summary such as “96 ready, 3 need a date choice, 1 duplicate to review.” Let the person inspect each category and compare an original with its proposed interpretation. Provide keyboard navigation, labeled errors, and a clear return to the relevant mapping control. Avoid relying on red cells alone or on hover to reveal validation details.

Bound file size, row count, field length, and preview work according to the actual environment. For long parsing, show progress only when it is measurable, otherwise name the active phase and offer cancellation. Cancelling parsing is different from cancelling an accepted server mutation. Stop controls should explain which work has already been committed.

Export a correction report in a format that preserves source locations, decisions, and unresolved items. If the export may be opened by spreadsheet software, handle formula-like text according to the target format's rules rather than accidentally promoting imported text into formulas. Select and verify a maintained parser for the actual file formats; this guide does not supply one.

## Acceptance and recovery scenarios

| Scenario | Expected observation |
| --- | --- |
| A date such as `03/04/2026` has no declared locale. | Review asks for the intended interpretation; it does not guess silently. |
| Values mix kilograms and pounds or currencies. | The mapping makes conversions explicit and preserves the originals and conversion basis. |
| A quoted field contains a newline, a very long value, or malformed input. | The parser either handles the supported case correctly or reports a bounded, located error. |
| A duplicate match is ambiguous. | No record is silently overwritten; candidate matches and the chosen policy are inspectable. |
| A mapping changes after row corrections. | Affected corrections are identified before recomputation, with a way to retain the prior draft. |
| A partial commit loses its reply. | The original receipt is recoverable and accepted rows are not duplicated on retry. |
| Another editor changes a destination record during review. | The stale update is rejected or reconciled under the declared policy without losing corrections. |
| The person requests undo after external effects. | The page describes a compensating action and its limits rather than promising erasure. |

This guide is an explained extension of record-projection and reviewed-evidence reasoning. Record real task adaptations and service-boundary results before promoting its evidence level.
