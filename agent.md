# Tendriller cookbook reading index

Inspect the task and existing files first. Select only relevant guides; related links are optional reading, not dependencies. Explain consequential choices and a plausible rejected alternative. Implement page-owned source through the public core contract. Reading a guide installs nothing.

For application architecture, start with [primitives and roles](guides/application-primitives.md): local state, ephemeral signals, durable events, transactions and final effects have different guarantees. Choose signals for live information that can be lost, and keep membership, schema, finality and effect permissions distinct. Use application.changes for current views, events.subscribe for durable work, and authenticated event.origin for attribution. Operation progress and outcome are separate: only final acceptance releases dependent work; Chronolog owns causal timestamps.

Start from an [application journey](guides/use-cases.md) when the user names an outcome rather than a technical decision. Follow the person through first use, correction, completion, and return; preserve the evidence boundary of every claimed check.

### Choose inputs and algorithms

- [Choose a voice interaction](cookbooks/choose-voice-interaction/COOKBOOK.md) — Compare typed input, push-to-talk, energy detection, and explicit wake engines with consent and reliable stop behavior.
- [Connect an instrument and interpret its protocol](cookbooks/connect-instrument/COOKBOOK.md) — Separate permission, packet framing, command policy, and bounded telemetry from a task-specific hardware interface.
- [Detect meaningful changes cheaply](cookbooks/detect-meaningful-changes/COOKBOOK.md) — Choose baseline, hysteresis, debounce, and cooldown according to the cost of false triggers and missed events.
- [Discover capabilities and design around them](cookbooks/discover-capabilities/COOKBOOK.md) — Distinguish API presence from usable permission and offer a task-completing alternative before requesting access.
- [Follow location changes and route progress](cookbooks/follow-location-progress/COOKBOOK.md) — Filter uncertain fixes, choose arrival semantics, and keep a route usable when foreground location stops.
- [Turn noisy motion into useful events](cookbooks/interpret-motion/COOKBOOK.md) — Calibrate simple motion heuristics and describe their uncertainty before treating an event as progress.
- [Notice meaningful visual changes](cookbooks/notice-visual-changes/COOKBOOK.md) — Choose reference frames, thresholds, and sampling budgets for a task where a changed scene matters.
- [Add local perception with an explicit engine](cookbooks/select-local-perception/COOKBOOK.md) — Choose model assets, confidence rules, coordinate conventions, and evaluation for optional pose, object, or text recognition.

### Collect evidence

- [Annotate a particular image or frame](cookbooks/annotate-a-frame/COOKBOOK.md) — Keep coordinates, identity, and transforms coherent when evidence is resized or replaced.
- [Ask a question about reviewed evidence](cookbooks/ask-about-evidence/COOKBOOK.md) — Bind questions and replies to specific sources and distinguish observation from interpretation.
- [Capture rendered evidence](cookbooks/capture-rendered-evidence/COOKBOOK.md) — Choose between DOM rendering, browser capture, and underlying source data, and review what the capture leaves out.
- [Capture, review, and send evidence](cookbooks/capture-reviewed-evidence/COOKBOOK.md) — Design permission, review, durable submission, and recovery around evidence the person actually intends to send.
- [Collect and discuss a sketch](cookbooks/collect-sketch/COOKBOOK.md) — Choose a drawing model, preserve local work, and submit a reviewed snapshot with meaningful context.
- [Import information for review](cookbooks/import-for-review/COOKBOOK.md) — Turn pasted or uploaded data into a correctable model with preserved originals and explicit partial acceptance.
- [Keep evidence and interpretation separate](cookbooks/separate-evidence-interpretation/COOKBOOK.md) — Preserve original observations while allowing conclusions, labels, and explanations to evolve.

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
- [Share live signals without recording history](cookbooks/share-live-signals/COOKBOOK.md) — Send typing, presence, cursors, progress and transient messages through a bounded live channel with explicit expiry and delivery policy.
- [Track routines without misleading progress](cookbooks/track-habits-and-routines/COOKBOOK.md) — Separate recurring intentions from observed completion, skips, corrections, reminders, and explicit day-boundary rules.
- [Triage an incoming queue without losing work](cookbooks/triage-incoming-work/COOKBOOK.md) — Turn incoming items into owned, prioritized work with explicit duplicate, snooze, escalation, and resolution policies.

### Keep work dependable

- [Adapt an interface without losing work](cookbooks/adapt-without-losing-work/COOKBOOK.md) — Choose ordinary DOM, framework state, or declarative rendering while preserving drafts, focus, and stable task identity.
- [Choose the right home for application data](cookbooks/choose-data-model/COOKBOOK.md) — Match authority, ordering, lifetime, and privacy to each kind of information instead of putting everything in shared state.
- [Connect an agent that actually resumes](cookbooks/connect-resuming-agent/COOKBOOK.md) — Choose and verify a host receiver that wakes the intended conversation and acknowledges only handled work.
- [Export, inspect, and restore portable work](cookbooks/export-and-restore-work/COOKBOOK.md) — Make exports explicit about their contents and limits, then preview identity mappings and conflicts before restoring reviewed work.
- [Ingest telemetry with a bounded budget](cookbooks/ingest-bounded-telemetry/COOKBOOK.md) — Choose acquisition and spool behavior while making backpressure, retention, and data loss explicit.
- [Keep an active task usable](cookbooks/keep-task-active/COOKBOOK.md) — Choose foreground wake lock and interruption behavior without promising background execution.
- [Give people control over sensitive information](cookbooks/manage-sensitive-data/COOKBOOK.md) — Minimize collection, keep private and shared representations distinct, and make redaction, export, retention, and deletion reflect actual authority.
- [Publish coherent page updates](cookbooks/publish-coherent-updates/COOKBOOK.md) — Keep authored assets, runtime identity, nested paths, and draft-aware updates consistent within one target system.
- [Maintain a shared editable collection](cookbooks/reconcile-concurrent-edits/COOKBOOK.md) — Choose stable identities and explicit conflict behavior for additions, edits, ordering, and deletion.
- [Recover from queued, repeated, and outdated work](cookbooks/recover-outdated-work/COOKBOOK.md) — Keep original command meaning across interruption and distinguish retry from a new, deliberately reviewed action.
- [Resume across devices and agent sessions](cookbooks/resume-across-sessions/COOKBOOK.md) — Keep task context, consumer progress, view checkpoints, and device focus separate so a handoff does not skip work.
- [Run a shared application with a resident agent](cookbooks/run-a-peer-application/COOKBOOK.md) — Use one verified SQL and event history for shared tasks, conversation, and agent work while keeping drafts, transient signals, and external effects distinct.
- [Test an adaptive page honestly](cookbooks/test-adaptive-page/COOKBOOK.md) — Use exact authored files and explicit fixtures, then verify authority and transactions at the real service boundary.
- [Keep a task useful offline and reconnect deliberately](cookbooks/work-offline-and-reconnect/COOKBOOK.md) — Prepare the exact page for offline use, preserve local drafts and pending intent, and reconcile current authority and task context on return.

### Make sense of information

- [Present live measurements honestly](cookbooks/present-live-measurements/COOKBOOK.md) — Choose a bounded data model, rendering approach, and recovery policy without hiding gaps or mixing runs.
- [Run a bounded measurement experiment](cookbooks/run-measurement-experiment/COOKBOOK.md) — Choose acquisition, aggregation, intervention, and export policies before treating a dashboard as an experimental record.
- [Turn messy records into useful signals](cookbooks/turn-records-into-signals/COOKBOOK.md) — Project fields, preserve units, and bound flattening without silently changing the meaning of a source record.

See [evidence](guides/evidence.md), [contribution guidance](guides/contributing.md), and [core public entry](https://github.com/werg/tendriller/blob/master/agent.md).
