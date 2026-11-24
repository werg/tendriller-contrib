# Tendriller cookbooks

Find an approach for what you want to build, understand the consequential choices,
and adapt it to the person and task. This collection contributes reasoning—not a
component library, complete starter catalog, or application schema.

## Build a workspace with people and independent agents

Start with [Coordinate people, views and agent runs](cookbooks/coordinate-participants/COOKBOOK.md)
for a shared application with several tabs, devices or agents. Its board and
discussion views consume the maintained optional `@tendriller/core/collaboration`
module: one session owner per retained browser profile, independent local drafts,
addressed requests, exclusive claims, frozen contribution slots, guarded synthesis
and explicit recovery. The reference includes browser owner/bootstrap templates
and an independent six-signer [public-artifact conformance runner](cookbooks/coordinate-participants/checks/README.md).

The reference's native evidence and the browser owner's qualification are
separate records. An agent's label, a connected route and active reasoning are
separate facts. Choose explicit claim and completion policies before starting
external work; shared data does not make that work exactly once.

## Build and reuse the native first app

For an app request, start with [connected-app setup](guides/connected-app-setup.md).
Use the origin returned by the selected connector or supplied by the person.
Call `tendril_guide` when available; if the installed catalog omits it, follow the
same-origin setup links from discovery. Before new-app downloads or installation,
check `/api/readiness` and the service descriptor. A paused or unverified host
stops creation; it does not justify switching to another deployment.

Use the host's advertised immutable first-app release and verify its complete
composition. Prepare and publish the first version before asking for owner
sign-in; do not wait for a “claimed” reply. Existing apps resume their retained
participant and use the actual permission-review route. Keep the starter's
session/Worker composition and adapt its
[live-view, operation and review helpers](https://github.com/werg/tendriller/blob/master/docs/APP_PATTERNS.md).
For camera/file, voice or optional inference, follow the [reviewed media flow](https://github.com/werg/tendriller/blob/master/docs/AI_INPUT.md)
and adapt its supplied `media/` modules. These are editable application files,
not new contrib exports. Reading a cookbook alone does not integrate them.

Deliver the hosted page with its authorized session connected, a command observed
by the other participant, retained work after reopening, and the signed publication
receipt. State which process remains running and how to resume it. On-demand
tools and automatic future chat turns require separate verification. Then use the
relevant cookbook to refine the task's choices and failure checks. Historical
specimens below keep their recorded scope; this pointer does not revive them.

## Browse the cookbooks

Start with the [hosted cookbook gallery](https://cookbooks.tendriller.dev/),
[browsable source index](index.html), [agent reading index](agent.md), or
[plain reading catalog](catalog.json). The canonical guide is
`cookbooks/<stable-id>/COOKBOOK.md`; a guide can stand alone with only an ID, title,
and summary as metadata. Reading it installs nothing.

The gallery is served as Cloudflare Workers static assets on the Tendriller
domain. To publish a reviewed `main` commit, run `npm ci`, `npm run check`,
`npm run build`, then `npx wrangler deploy --config wrangler.jsonc`. Publish
from a clean checkout so `dist/manifest.json` records the exact source commit
with `source_dirty: false`. Check `https://cookbooks.tendriller.dev/catalog.json`
with both a browser and Python's default `urllib` user agent after deployment.

Your page owns its HTML, CSS, JavaScript, state vocabulary, and interaction model.
Copied snippets become editable application source. Core owns the public runtime,
service guarantees, and optional [session, publishing, and preview tools](https://github.com/werg/tendriller/tree/master/tools).
The default core installs no application workflow. Deliberately selected trusted
references live beside the cookbook that explains their policy.

For application architecture, start with
[application primitives and roles](guides/application-primitives.md). Every
application uses one public Chronolog session, command/query/event API and
operation journal. Native and browser peers supply storage, transport and engine
capabilities. The host is a filtered control/publication participant: membership,
recovery selections and signed page code use Chronolog envelopes; ordinary
application work travels between peers.

`applied()` reports execution in the selected history; `shared()` separately
observes retained coverage on another peer. Explicit recovery may abandon a
recent suffix, including previously applied work. Irreversible external work
requires an explicitly configured protected checkpoint or durable external-action
service. These stronger guarantees are capabilities of the same application
model, not alternative profile-selected runtimes.

The [peer application cookbook](cookbooks/run-a-peer-application/COOKBOOK.md)
uses the public API directly; its [checks guide](cookbooks/run-a-peer-application/checks/README.md)
documents the independent packed-artifact qualification runners. Executable examples
require an explicitly supplied matching `@chronolog/peer-session` archive.

[Live signals](cookbooks/share-live-signals/COOKBOOK.md) cover typing, presence,
cursors, progress and transient messages without a database. The
[standalone composition check](cookbooks/share-live-signals/checks/README.md)
uses the public signal module for live readings and token previews.
Authenticated provenance, application authorization and recovery-aware journals
govern agent work; irreversible actions have a separate declared guarantee.

## Use the collection

Read [the adaptation loop](guides/using-cookbooks.md), choose only relevant guides,
and write a short plan explaining important choices and an alternative you rejected.
Preserve the referenced platform guarantees, then verify the failure cases that
matter for the implementation. Example markup, paths, parameters, and layouts are
choices. Publication integrity describes the actual final files, not source-snippet
byte equality.

## Start with a complete use case

The [application journeys](guides/use-cases.md) connect a small first version to
richer features and a concrete failure rehearsal. Choose a route for an intake
form, field inspection, private workshop, team inbox, document review, comparison,
resource reservation, routine or learning loop, experiment, change observer,
remote operator console, portable notebook, batch operation, or growing page.

Each route explains what a useful completion looks like and points to the few
guides that resolve its important decisions. Read only the approaches the task
needs. Cookbooks include user journeys, feature tradeoffs, data and authority
boundaries, correction and recovery paths, and scenarios with expected outcomes.

## Browse by outcome

<!-- cookbook-index:start -->
### Choose inputs and algorithms

- [Choose a voice interaction](cookbooks/choose-voice-interaction/COOKBOOK.md) *(runnable snippets)* — Compare typed input, push-to-talk, energy detection, and explicit wake engines with consent and reliable stop behavior.
- [Connect an instrument and interpret its protocol](cookbooks/connect-instrument/COOKBOOK.md) *(runnable snippets)* — Separate permission, packet framing, command policy, and bounded telemetry from a task-specific hardware interface.
- [Detect meaningful changes cheaply](cookbooks/detect-meaningful-changes/COOKBOOK.md) — Choose baseline, hysteresis, debounce, and cooldown according to the cost of false triggers and missed events.
- [Discover capabilities and design around them](cookbooks/discover-capabilities/COOKBOOK.md) *(runnable snippets)* — Distinguish API presence from usable permission and offer a task-completing alternative before requesting access.
- [Follow location changes and route progress](cookbooks/follow-location-progress/COOKBOOK.md) *(runnable snippets)* — Filter uncertain fixes, choose arrival semantics, and keep a route usable when foreground location stops.
- [Turn noisy motion into useful events](cookbooks/interpret-motion/COOKBOOK.md) *(runnable snippets)* — Calibrate simple motion heuristics and describe their uncertainty before treating an event as progress.
- [Notice meaningful visual changes](cookbooks/notice-visual-changes/COOKBOOK.md) — Choose reference frames, thresholds, and sampling budgets for a task where a changed scene matters.
- [Add local perception with an explicit engine](cookbooks/select-local-perception/COOKBOOK.md) — Choose model assets, confidence rules, coordinate conventions, and evaluation for optional pose, object, or text recognition.

### Collect evidence

- [Annotate a particular image or frame](cookbooks/annotate-a-frame/COOKBOOK.md) — Keep coordinates, identity, and transforms coherent when evidence is resized or replaced.
- [Ask a question about reviewed evidence](cookbooks/ask-about-evidence/COOKBOOK.md) — Bind questions and replies to specific sources and distinguish observation from interpretation.
- [Capture rendered evidence](cookbooks/capture-rendered-evidence/COOKBOOK.md) — Choose between DOM rendering, browser capture, and underlying source data, and review what the capture leaves out.
- [Capture, review, and send evidence](cookbooks/capture-reviewed-evidence/COOKBOOK.md) *(runnable snippets)* — Design permission, review, durable submission, and recovery around evidence the person actually intends to send.
- [Collect and discuss a sketch](cookbooks/collect-sketch/COOKBOOK.md) — Choose a drawing model, preserve local work, and submit a reviewed snapshot with meaningful context.
- [Import information for review](cookbooks/import-for-review/COOKBOOK.md) — Turn pasted or uploaded data into a correctable model with preserved originals and explicit partial acceptance.
- [Keep evidence and interpretation separate](cookbooks/separate-evidence-interpretation/COOKBOOK.md) — Preserve original observations while allowing conclusions, labels, and explanations to evolve.

### Coordinate people and tools

- [Connect an application to an assistant and choose a fallback](cookbooks/connect-chatgpt/COOKBOOK.md) — Keep application state in Chronolog while combining account-linked tools, subscribed events, explicit widget actions, and retained deployment or local-agent routes.
- [Coordinate people, views and independent agents](cookbooks/coordinate-participants/COOKBOOK.md) *(runnable snippets)* — Use one session owner per signing profile, explicitly addressed interactions and guarded contribution slots to coordinate several people, devices, views and agent runs.

### Decide and act

- [Build a comparison and decision workspace](cookbooks/compare-options/COOKBOOK.md) — Make criteria, units, provenance, and uncertainty inspectable instead of disguising assumptions behind a single score.
- [Explore assumptions with what-if scenarios](cookbooks/explore-what-if-scenarios/COOKBOOK.md) — Build a bounded model with an inspectable baseline, comparable scenarios, sensitivity checks, and explicit uncertainty.
- [Observe long-running work and enable intervention](cookbooks/observe-long-running-process/COOKBOOK.md) — Separate freshness, progress, failures, and intervention from the agent conversation that may come and go.
- [Review an exact proposal before acting](cookbooks/review-exact-proposal/COOKBOOK.md) — Bind approval to immutable content and an explicit version, expiry, and execution policy.
- [Review and execute a batch with clear partial outcomes](cookbooks/run-reviewed-batch-actions/COOKBOOK.md) — Freeze the selected work, preview per-item effects, and expose bounded execution, cancellation, retries, and uncertain outcomes without hiding partial completion.

### Design everyday interactions

- [Build forms people can complete and correct](cookbooks/build-correctable-forms/COOKBOOK.md) — Choose progressive fields, validation, saved drafts, review, and submission recovery that preserve meaning and user-entered work.
- [Make the complete interaction accessible](cookbooks/complete-accessible-interactions/COOKBOOK.md) — Preserve keyboard operation, focus, understandable status, and equivalent task paths from first use through errors, recovery, and completion.
- [Localize language, numbers, and direction coherently](cookbooks/localize-an-interaction/COOKBOOK.md) — Keep language, locale, time zone, source values, plural messages, and bidirectional layout consistent without losing drafts or changing meaning.
- [Search and filter a growing collection](cookbooks/search-and-filter-collections/COOKBOOK.md) — Make query scope, filtering, ordering, and selection understandable as results grow, change, or become unavailable.
- [Undo and revise work without changing its meaning](cookbooks/undo-and-revise-work/COOKBOOK.md) — Choose local undo, revision history, guarded reversal, or explicit compensation according to what changed and who may have acted on it.
- [Write and review a document across revisions](cookbooks/write-with-versioned-feedback/COOKBOOK.md) — Keep drafts, anchored feedback, suggested changes, reviewer decisions, and publication tied to the document versions they concern.

### Guide and coordinate work

- [Choose when to interrupt](cookbooks/choose-interruptions/COOKBOOK.md) — Match quiet telemetry, agent wake, local cues, timers, and notifications to a meaningful decision point.
- [Collect private responses and publish a reviewed aggregate](cookbooks/collect-private-responses/COOKBOOK.md) — Keep answers and assignments private while giving a facilitator an explicit, versioned path to shared results.
- [Coordinate views and attention across devices](cookbooks/coordinate-devices/COOKBOOK.md) — Assign useful device purposes while keeping authority, freshness, focus, and completion receipts distinct.
- [Complete a field inspection with reviewable evidence](cookbooks/document-a-field-inspection/COOKBOOK.md) — Combine a versioned checklist, measurements, annotated evidence, exceptions, offline draft recovery, and a reviewed handover report.
- [Guide a task with explicit checkpoints](cookbooks/guide-explicit-checkpoints/COOKBOOK.md) — Separate task definition from progress, and choose intentional completion, resume, and replanning behavior.
- [Guide practice with useful feedback](cookbooks/guide-practice-and-feedback/COOKBOOK.md) — Make attempts, hints, scoring, reflection, and return sessions transparent without confusing assistance or activity with demonstrated mastery.
- [Hand off responsibility with a clear acceptance](cookbooks/hand-off-responsibility/COOKBOOK.md) — Transfer task context and unresolved work through an explicit offer and acceptance without confusing assignment, access, or completion.
- [Join or transfer a page across devices](cookbooks/join-across-devices/COOKBOOK.md) — Choose role-aware links and a usable transfer method without turning device purpose into authority.
- [Plan work across time zones and deadlines](cookbooks/plan-time-and-deadlines/COOKBOOK.md) — Distinguish dates, timed commitments, and recurring intent while making overdue work, rescheduling, and real reminder delivery understandable.
- [Publish the smallest useful page](cookbooks/publish-smallest-page/COOKBOOK.md) — Start with ordinary authored files and one useful event/reply loop, then add structure only when the task needs it.
- [Reserve shared resources without double booking](cookbooks/schedule-shared-resources/COOKBOOK.md) — Guide people from availability to a confirmed reservation with explicit holds, time interpretation, capacity, and authoritative conflict checks.
- [Share live signals without recording history](cookbooks/share-live-signals/COOKBOOK.md) *(runnable snippets)* — Send typing, presence, cursors, progress and transient messages through a bounded live channel with explicit expiry and delivery policy.
- [Track routines without misleading progress](cookbooks/track-habits-and-routines/COOKBOOK.md) — Separate recurring intentions from observed completion, skips, corrections, reminders, and explicit day-boundary rules.
- [Triage an incoming queue without losing work](cookbooks/triage-incoming-work/COOKBOOK.md) — Turn incoming items into owned, prioritized work with explicit duplicate, snooze, escalation, and resolution policies.

### Keep work dependable

- [Adapt an interface without losing work](cookbooks/adapt-without-losing-work/COOKBOOK.md) — Choose ordinary DOM, framework state, or declarative rendering while preserving drafts, focus, and stable task identity.
- [Choose the right home for application data](cookbooks/choose-data-model/COOKBOOK.md) — Match authority, ordering, lifetime, and privacy to each kind of information instead of putting everything in shared state.
- [Connect an agent that actually resumes](cookbooks/connect-resuming-agent/COOKBOOK.md) — Choose and verify a host receiver that wakes the intended conversation and acknowledges only handled work.
- [Export, inspect, and restore portable work](cookbooks/export-and-restore-work/COOKBOOK.md) — Make exports explicit about their contents and limits, then preview identity mappings and conflicts before restoring reviewed work.
- [Ingest telemetry with a bounded budget](cookbooks/ingest-bounded-telemetry/COOKBOOK.md) *(runnable snippets)* — Choose acquisition and spool behavior while making backpressure, retention, and data loss explicit.
- [Keep an active task usable](cookbooks/keep-task-active/COOKBOOK.md) — Choose foreground wake lock and interruption behavior without promising background execution.
- [Give people control over sensitive information](cookbooks/manage-sensitive-data/COOKBOOK.md) — Minimize collection, keep private and shared representations distinct, and make redaction, export, retention, and deletion reflect actual authority.
- [Publish coherent page updates](cookbooks/publish-coherent-updates/COOKBOOK.md) — Keep authored assets, runtime identity, nested paths, and draft-aware updates consistent within one target system.
- [Maintain a shared editable collection](cookbooks/reconcile-concurrent-edits/COOKBOOK.md) — Choose stable identities and explicit conflict behavior for additions, edits, ordering, and deletion.
- [Recover from queued, repeated, and outdated work](cookbooks/recover-outdated-work/COOKBOOK.md) — Keep original command meaning across interruption and distinguish retry from a new, deliberately reviewed action.
- [Report live page errors and diagnostics to your agent](cookbooks/report-page-diagnostics/COOKBOOK.md) *(runnable snippets)* — Capture boot-to-runtime browser errors in a redacted ring buffer and stream live diagnostics over ephemeral signals.
- [Resume across devices and agent sessions](cookbooks/resume-across-sessions/COOKBOOK.md) — Keep task context, consumer progress, view checkpoints, and device focus separate so a handoff does not skip work.
- [Build a peer application with explicit recovery](cookbooks/run-a-peer-application/COOKBOOK.md) *(runnable snippets)* — Use replaceable coordinating peers, coherent views and exact attempts for shared conversation and guarded work, with explicit recovery and deliberate reapplication.
- [Test an adaptive page honestly](cookbooks/test-adaptive-page/COOKBOOK.md) — Use exact authored files and explicit fixtures, then verify authority and transactions at the real service boundary.
- [Keep a task useful offline and reconnect deliberately](cookbooks/work-offline-and-reconnect/COOKBOOK.md) — Prepare the exact page for offline use, preserve local drafts and pending intent, and reconcile current authority and task context on return.

### Make sense of information

- [Present live measurements honestly](cookbooks/present-live-measurements/COOKBOOK.md) *(runnable snippets)* — Choose a bounded data model, rendering approach, and recovery policy without hiding gaps or mixing runs.
- [Run a bounded measurement experiment](cookbooks/run-measurement-experiment/COOKBOOK.md) — Choose acquisition, aggregation, intervention, and export policies before treating a dashboard as an experimental record.
- [Turn messy records into useful signals](cookbooks/turn-records-into-signals/COOKBOOK.md) — Project fields, preserve units, and bound flattening without silently changing the meaning of a source record.
<!-- cookbook-index:end -->

## Contribute and verify

See [contribution guidance](guides/contributing.md) and [evidence levels](guides/evidence.md).
Useful failures and rejected alternatives are valuable contributions.

```sh
npm ci
npm run check
npm run build
```

The ordinary check is local and content-focused: metadata, reading links, generated
output, and deterministic snippet checks. It needs no service or
contrib/core release synchronization. `dist/` contains a content-only site snapshot
and an archive manifest. See [validation](guides/validation.md) for browser and
hosted qualification using explicitly supplied public core artifacts.

[Source provenance and terms](PROVENANCE.md) remain explicit. This refactor grants
no new license and makes no compatibility promise for retired product surfaces.
