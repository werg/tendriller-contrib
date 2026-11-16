---
id: "explore-what-if-scenarios"
title: "Explore assumptions with what-if scenarios"
summary: "Build a bounded model with an inspectable baseline, comparable scenarios, sensitivity checks, and explicit uncertainty."
group: "Decide and act"
tags: ["scenarios", "models", "uncertainty"]
choices: ["Simple calculator or a scenario workspace", "Fixed baseline versus changing model and source data", "Sensitivity ranges versus unsupported predictive certainty"]
capabilities: []
evidence: "explained"
related: ["compare-options", "present-live-measurements", "review-exact-proposal"]
sources: ["https://github.com/werg/tendriller/blob/111bde967a1831fb16a33201acc5c67b624fd360/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/111bde967a1831fb16a33201acc5c67b624fd360/agent.md"]
---

# Explore assumptions with what-if scenarios

Use a what-if tool when a person can make a better decision by changing explicit assumptions: estimating event capacity, exploring a project schedule, or comparing resource plans. The useful output is a conditional result with an understandable explanation. If one arithmetic calculation answers the question, a small calculator and worked example may be enough. A scenario workspace earns its complexity when several plausible alternatives need comparison and revision.

This is a proposed application pattern, not a validated forecasting model. Choose a domain whose relationships you can justify, document its limits, and use known reference cases before interpreting attractive charts as evidence.

## Start with a modest model

For an event-planning example, suppose a room has a known capacity and the planner wants to explore attendance and session grouping. A deliberately simple model might calculate `groups = ceil(attendees / seats_per_group)`, subject to a room-capacity constraint. It does not predict who will attend, model fire regulations, or decide accessibility needs. Those facts and constraints must come from appropriate sources and the actual task.

Write the model in ordinary language before adding controls: inputs, units, valid ranges, dependencies, output meaning, and assumptions left out. Separate observed facts from estimates and user preferences. A capacity observed from an approved source is not the same kind of input as an estimated attendance rate.

## A complete exploration journey

1. **Frame the question.** State the decision the tool informs and the actions it does not take automatically. Show the model's purpose and important limits near the result.
2. **Establish a baseline.** Load a named, versioned set of assumptions and source values. Let the person inspect and correct those inputs before exploring alternatives.
3. **Change one assumption.** Provide a labeled control with units, a meaningful valid range, and exact numeric entry. Explain why a value is invalid rather than silently clamping it.
4. **Explain the effect.** Show the result, the change from baseline, and which relationship caused the change. Preserve useful intermediate values when they make the result understandable.
5. **Save a scenario.** Give it a name and record its complete input set, model version, and source identities. A name alone cannot reproduce it.
6. **Compare.** Show a small set of scenarios with consistent units and clearly different assumptions. Let the person return to baseline at any time.
7. **Probe uncertainty.** Vary uncertain inputs through plausible ranges and examine whether the preferred decision changes.
8. **Decide or export.** Save the chosen assumptions and reasoning. If an external action follows, prepare a separate reviewed proposal; moving a slider is not authorization to execute it.

## Keep model, inputs, and view distinct

| Layer | What it contains | Why the separation matters |
| --- | --- | --- |
| Model definition | Equations/rules, version, domain, constraints | A formula change can invalidate comparisons even when input labels are unchanged. |
| Evidence inputs | Measured or sourced values, units, date, uncertainty | Updating a source should not silently rewrite historical scenarios. |
| Scenario assumptions | Deliberate values and choices | They remain distinguishable from observed facts. |
| Computed outputs | Results and diagnostics for an exact model/input identity | A late computation cannot overwrite a different scenario. |
| Presentation | Chart scale, selected output, expanded explanation | Reformatting should not mutate a saved scenario. |

Use stable input IDs and explicit conversions. Preserve raw inputs where needed for audit, then convert in one documented place. For currency, units, or time, record the basis of any conversion rather than attaching the same label to incomparable numbers. Bound calculations and reject nonfinite or nonsensical values before showing a confident result.

A saved scenario can remain immutable or have explicit revisions. An unsaved exploration should be visibly a draft. If another person updates the shared baseline, offer a comparison and a deliberate rebase; do not silently carry an old scenario onto a new formula or dataset. Store only data whose sharing policy matches the chosen state or authorized storage mechanism.

## Choose controls that reflect the model

Sliders make trends easy to explore, but exact entry is useful for reproduction and keyboard access. A dropdown is clearer for a discrete policy choice. A constraint can disable an impossible combination with an explanation, or let the user inspect it as an explicitly invalid scenario; never display it as a feasible plan.

Show discontinuities honestly. In the illustrative group-count model, moving from twenty to twenty-one attendees with ten seats per group changes the group count from two to three. A smooth interpolated curve would obscure the threshold. Distinguish rounding for display from rounding used in the actual calculation and show enough precision to explain differences without implying unsupported accuracy.

For expensive computation, keep a stable baseline while calculating and associate the response with the exact scenario/model identity. Cancellation is useful, but a cancelled or slow old result must not become the newest answer. Expose failure, invalid input, computation pending, and completed result as distinct states.

## Make sensitivity useful instead of decorative

Start with one-at-a-time changes to find assumptions that matter. Then test plausible combinations where inputs are related. Independent sliders can create impossible worlds: an increased participant count may require different staffing or space. Explain such dependencies and whether they are enforced, estimated, or deliberately omitted.

A low/high range is not automatically a statistical confidence interval. Label it as a chosen scenario range unless a justified probabilistic model establishes another interpretation. If the result depends on a threshold, find the smallest change that crosses it and explain the practical consequence. A sensitivity table can be more useful than a colorful three-dimensional chart.

Compare scenarios under the same model and source basis. When that is impossible, mark the changed basis and avoid claiming that the output difference is caused only by the user-adjusted assumption. Preserve a note about why each scenario was saved and what evidence would make it obsolete.

## Useful features and deliberate limits

A “Reset to baseline” action, duplicate scenario, named comparison, and compact export cover many needs. A large scenario library needs search, ownership, retention, and a way to archive obsolete models. Add those only when repeated use requires them. Avoid pretending that an unconstrained text prompt defines a validated simulator; an agent-generated formula needs review just like manually authored model code.

Provide a text result and an accessible input/output table alongside charts. Use consistent axis units, label the baseline, and allow keyboard operation without dragging. Announce a settled result rather than every intermediate slider update. Keep explanatory assumptions visible at the moment someone copies or exports a result.

## Verify with known and adversarial cases

| Scenario | Expected observation |
| --- | --- |
| Run a simple case that can be calculated by hand. | Outputs and intermediate values match the declared model. |
| Enter zero, a negative value, an extreme value, or a missing required input. | The result follows a documented boundary or gives a specific validation error. |
| Cross a discontinuity or capacity constraint. | The threshold and infeasibility are visible; the chart does not smooth them away. |
| Restore baseline after several changes. | All relevant assumptions return, not only the visible slider values. |
| A slow result arrives after model or scenario changes. | It remains attached to the old identity and does not replace the current answer. |
| Update source data used by an old scenario. | Historical inputs remain recoverable and a deliberate recalculation is offered. |
| Compare uncertainty ranges. | The display does not call them probability intervals without a justified model. |
| Export and reproduce the scenario elsewhere. | Model version, inputs, units, sources, and assumptions explain the result. |

Before calling the approach broadly useful, adapt it to at least two meaningfully different tasks and record where assumptions fail. The evidence label remains explained until named numerical or interaction checks are actually run and documented.
