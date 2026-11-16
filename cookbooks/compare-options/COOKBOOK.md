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

Use a comparison workspace when someone must choose among alternatives with several meaningful criteria: selecting equipment, planning a venue, or comparing implementation approaches. The finished experience should help the person understand why a choice fits and what would change it. A short narrative is enough when one constraint dominates; interactive scoring earns its complexity only when exploring assumptions improves the decision.

## Begin with the decision, not the chart

For a team choosing a workshop venue, first state the decision date, number of people, required access, and budget. Separate requirements such as capacity or a necessary access feature from preferences such as shorter travel. An option that fails a requirement should not win by accumulating preference points elsewhere.

Ask which evidence could change the choice and stop collecting irrelevant detail. Keep a small, understandable initial comparison, then allow inspection of sources and uncertainty. A venue's capacity may be known, its total price provisional, and its availability unconfirmed. Those are different states, not three ordinary numbers awaiting a score.

## A complete decision journey

1. **Frame.** Show the decision question, owner, deadline, and current assumptions. Let the person correct the brief before ranking options.
2. **Collect.** Add alternatives with stable IDs, evidence links, observation dates, units, and explicit unknowns. Preserve source values before deriving normalized scores.
3. **Screen.** Apply hard constraints and explain each failure. Keep excluded options inspectable so the person can correct a mistaken constraint or value.
4. **Compare.** Present a compact table of the criteria that matter. Expand a cell to inspect a source, uncertainty, or conflicting observation.
5. **Explore.** Change preferences in a reversible scenario. Show which rankings change and why; keep the baseline available.
6. **Decide.** Save the chosen option with the criteria, evidence revisions, assumptions, and rationale used at that moment. “Undecided” and “Need more evidence” are legitimate outcomes.
7. **Act.** If booking, purchasing, or publishing needs a separate authorized action, prepare it through [exact proposal review](../review-exact-proposal/COOKBOOK.md). Selecting a row alone need not execute anything.
8. **Revisit.** When evidence changes, flag the affected decision for review. Do not silently replace its historical rationale with today's values.

## Choose the representation and calculation

| Approach | Choose it when | Consequence to explain |
| --- | --- | --- |
| Comparison table | Exact values, units, and missing evidence matter. | Wide tables need a focused or stacked view on a phone. |
| Small multiples | A pattern is easier to see than to describe. | Use comparable axes where comparison depends on them and retain exact text values. |
| Narrative tradeoff | Qualitative criteria dominate or the choice is small. | Link each conclusion to evidence; avoid hiding contradictory facts. |
| Interactive weights | Preferences are uncertain and scenarios change the answer. | Explain scales, direction, normalization, and treatment of unknowns. |

If using a weighted score, define each transformed criterion before combining it. For example, a proposed illustrative model is `score(option) = sum(weight[i] * utility[i])` after eligibility checks, with nonnegative weights summing to one and utilities on a declared common scale. This is an application choice, not an objective measure of quality. State whether a high raw value is good or bad and why the utility mapping makes sense.

Missing data is not zero. Options include withholding the total, showing a plausible range, or asking for the missing fact. Renormalizing over each option's known criteria can reward an option merely because its weaknesses are unknown; if chosen, show coverage and the consequence. Never mix price currencies, units, time periods, or tax assumptions without an explicit conversion basis.

Prefer fixed, meaningful scales when available. Normalizing against the current minimum and maximum means adding an extreme option can change everyone else's score without changing any facts. Show that sensitivity if relative normalization is appropriate. A tie or a narrow range of scores can be a reason to gather information rather than display a confident winner.

## Make uncertainty inspectable

Keep raw observation, source identity, observation time, interpretation, and derived value separate. If two sources disagree, present the conflict and the selected working value with a reason. A confidence label should explain its basis; a decorative percentage can mislead as easily as an unexplained score.

Provide a “What would change this recommendation?” panel. In the venue example, a higher confirmed price, a changed attendance count, or inaccessible transport could overturn the choice. Vary one consequential assumption at a time, then inspect combinations that are plausible together. Avoid presenting impossible combinations as ordinary alternatives. Keep each scenario's assumptions identifiable so another person can reproduce the comparison.

Save comparison drafts separately from the reviewed decision. An asynchronous agent update should not move a selected row under the pointer or silently change the values about to be approved. Mark changed cells and require a fresh review when the selection depends on their changed meaning. Stable option and criterion IDs keep notes attached after sorting or relabeling.

## Useful features and boundaries

A shortlist, favorite, and final decision mean different things; label them distinctly. Allow an option to be excluded with a reason and restored without re-entry. Offer a compact decision export with the evidence dates, unresolved items, and calculation policy. Exporting a pretty ranking alone loses the basis for future review.

Make every weight adjustable with a keyboard and show its numeric value. Provide a reset to the saved baseline and an understandable result when all preferences are zero. Announce a changed recommendation sparingly; continuous slider motion should not flood assistive output. Use words or symbols alongside color for eligibility and uncertainty, and keep essential differences visible without hover.

## Check the decision, not merely the arithmetic

| Scenario | Expected observation |
| --- | --- |
| One option violates a hard constraint but has excellent preference scores. | It remains ineligible with the exact failed requirement shown. |
| A critical value is unknown or two sources conflict. | The uncertainty remains visible; no fabricated zero or silently selected source appears. |
| Add an extreme outlier or remove an option. | Any normalization change is explained; stable-scale scores remain unchanged. |
| Set every weight to zero or one criterion to its extreme. | The result is defined, inspectable, and reversible to the baseline. |
| A source changes after selection. | The saved decision retains its prior evidence and the current view flags a review need. |
| Sort, filter, or use the phone layout. | Selection, notes, and evidence remain attached to the correct option IDs. |
| Export the decision and rebuild it from the record. | Units, assumptions, missing facts, and the rationale are sufficient to understand the choice. |

Apply the approach to unrelated decisions before claiming broad usefulness. This guide remains an explained extension of measurement and proposal-review reasoning; it does not establish field effectiveness or the validity of a particular scoring model.
