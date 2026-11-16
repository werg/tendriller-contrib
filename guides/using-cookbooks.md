# Use a cookbook to make a task-specific plan

A cookbook transfers decisions and checks. It does not choose your root element,
CSS, navigation, rendering library, file organization, application namespace, or
state schema. A useful page may be one file, nested pages, a framework build, a
canvas, a dense workspace, or a compact form within core's serving contract.

If the task is easier to name than the technical decision, start with the
[application journeys](use-cases.md). Each route offers a focused first version,
useful extensions, and a failure rehearsal. Select its relevant guides; a route
does not require reading or installing every linked approach.

1. Inspect the person's task, existing files, service capabilities, and constraints.
2. Browse the generated summaries and read only relevant guides. Follow related
   links when they resolve a decision; they are not executable dependencies.
3. Choose or reject approaches. Record consequential tradeoffs in a brief Markdown
   working plan, including at least one plausible alternative.
4. Design the information and interaction structure around the task. Treat example
   constants, markup, state paths, and layouts as choices to reconsider.
5. Implement page-owned source through the current public core contract. Install a
   trusted extension only deliberately, after reviewing its authority and policy.
   If a general correctness or developer-experience gap blocks the design, improve
   core and its public API, then revise the recipe to use that guarantee.
6. Exercise the selected failure cases and actual platform guarantees. Distinguish
   fixture/browser evidence from service authorization and transaction evidence.
7. Preserve useful provenance, assumptions, and material deviations for future work.

## Read the strength of a statement

A **platform invariant**, such as retaining a protected command's original generation
on retry, survives any layout choice. A **conditional requirement**, such as private
records for private responses, applies when you choose that branch. An **example
choice**, such as a five-hundred-point display model or a one-step guide, can change.

Do not load the entire collection into an agent context, install a component graph,
or activate a named workflow just because a guide links to it. A copied snippet is
source you own and adapt. Exact publication identity covers the final files; it does
not lock editable source to the cookbook's bytes.

The platform is unreleased and its architecture can change. Use a cookbook to
identify useful guarantees, not to justify recurring application workarounds.
See [the core improvement guidance](contributing.md#improve-core-when-a-cookbook-exposes-a-platform-gap)
for coordinating a platform fix with its examples and verification.

Start with [the smallest useful page](../cookbooks/publish-smallest-page/COOKBOOK.md)
and [choosing a data model](../cookbooks/choose-data-model/COOKBOOK.md). Use the
[core public entry](https://github.com/werg/tendriller/blob/62f15021e77812e58533aa816cd24698aa70cfc8/agent.md) for exact
operations, authentication, and current limits.

## Reviewed core target

The API examples in this expansion were reviewed against
[Tendriller `62f15021e778`](https://github.com/werg/tendriller/tree/62f15021e77812e58533aa816cd24698aa70cfc8),
implemented in [core PR #34](https://github.com/werg/tendriller/pull/34). This target
includes conditional shared-state transactions, coherent state snapshots, durable
timer commands, sensor cancellation, and durable browser receipt settlement.

Use built and deployed artifacts that contain these APIs before adapting the new
examples. A source link or an open pull request does not establish that a running
service has them. Follow the core operational requirements for the target's fresh
storage baseline; preserve a deliberate distinction between reviewed source and
an exercised deployment. Older source hashes retained in individual guides record
historical provenance and evidence.
