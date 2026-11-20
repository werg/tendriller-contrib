# Use a cookbook to make a task-specific plan

A cookbook transfers decisions and checks. It does not choose your root element,
CSS, navigation, rendering library, file organization, application namespace, or
state schema. A useful page may be one file, nested pages, a framework build, a
canvas, a dense workspace, or a compact form within core's serving contract.

If the task is easier to name than the technical decision, start with the
[application journeys](use-cases.md). Each route offers a focused first version,
useful extensions, and a failure rehearsal. Select its relevant guides; a route
does not require reading or installing every linked approach.

## Reuse working source before adapting the interaction

Start with [connected-app setup](connected-app-setup.md) to select the exact host,
check creation readiness before installation, and verify its immutable first-app
release composition. Follow that host's current core guide for the native session,
browser Worker, enrollment and signed publication. Source changes do not prove
that a selected deployment serves the required endpoint or artifact; report the
specific missing host/release capability instead of rebuilding unrelated sources.

Reuse the starter's account-setup and reviewed-pairing helpers when that exact
host/release supplies them. Keep the setup credential private, prepare the full
native pairing proposal before owner review, and preserve its durable ordering
pause while the result is uncertain. A finite helper window does not promise
an always-running participant or automatic recovery from lost private storage.

From that starter, actually import or adapt `helpers/live-view.mjs`,
`helpers/operation-view.mjs` and, when needed, `helpers/reviewed-input.mjs` as
described in [Application patterns](https://github.com/werg/tendriller/blob/master/docs/APP_PATTERNS.md).
The [media guide](https://github.com/werg/tendriller/blob/master/docs/AI_INPUT.md)
supplies the camera/voice controllers and explicit native inference example.
Record the modules used and the behavior changed for the task. Keep the real
session as their state owner; a new REST/SSE service or persistence layer needs
its own concrete requirement.

The result is the working hosted application and connected participant, with
verified cross-device work, reopening and a publication receipt. Source files
and cookbook reading support that result; neither establishes it on its own.

## Adapt and verify

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
[current core public entry](https://github.com/werg/tendriller/blob/master/agent.md) for exact
operations, authentication, and current limits.

## Current references versus historical provenance

For runnable commands and supported paths, use the [current core CLI](https://github.com/werg/tendriller/blob/master/docs/tools/CLI.md), [tool artifacts](https://github.com/werg/tendriller/blob/master/docs/tools/ARTIFACTS.md), and [preview guide](https://github.com/werg/tendriller/blob/master/docs/tools/PREVIEW.md). In a release archive, commands live under `bin/`; `tools/cli/bin/` is a source-checkout path. Published releases provide `manifest.json` and `SHA256SUMS`, not `tools-manifest.json`. Cookbook `sources:` URLs are immutable **historical provenance**, often referencing files moved out of contrib; they are not instructions to fetch those paths from current `main`.

## Reviewed core target (historical)

The API examples in this expansion were reviewed against
[Tendriller `7668af407fd0`](https://github.com/werg/tendriller/tree/7668af4ae59ae7dced87eba999bd040836f9fc06),
implemented in [core PR #34](https://github.com/werg/tendriller/pull/34). This historical target is not the current source of installation instructions. It
includes conditional shared-state transactions, coherent state snapshots, durable
timer commands, sensor cancellation, and durable browser receipt settlement.

Use built and deployed artifacts that contain these APIs before adapting the new
examples. A source link or an open pull request does not establish that a running
service has them. Follow the core operational requirements for the target's fresh
storage baseline; preserve a deliberate distinction between reviewed source and
an exercised deployment. Older source hashes retained in individual guides record
historical provenance and evidence.
