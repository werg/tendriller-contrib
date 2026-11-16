# Tendriller cookbook reading index

Inspect the task and existing files first. Select only relevant guides; related links are optional reading, not dependencies. Explain consequential choices and a plausible rejected alternative. Implement page-owned source through the public core contract. Reading a guide installs nothing.

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
- [Observe long-running work and enable intervention](cookbooks/observe-long-running-process/COOKBOOK.md) — Separate freshness, progress, failures, and intervention from the agent conversation that may come and go.
- [Review an exact proposal before acting](cookbooks/review-exact-proposal/COOKBOOK.md) — Bind approval to immutable content and an explicit version, expiry, and execution policy.

### Guide and coordinate work

- [Choose when to interrupt](cookbooks/choose-interruptions/COOKBOOK.md) — Match quiet telemetry, agent wake, local cues, timers, and notifications to a meaningful decision point.
- [Collect private responses and publish a reviewed aggregate](cookbooks/collect-private-responses/COOKBOOK.md) — Keep answers and assignments private while giving a facilitator an explicit, versioned path to shared results.
- [Coordinate views and attention across devices](cookbooks/coordinate-devices/COOKBOOK.md) — Assign useful device purposes while keeping authority, freshness, focus, and completion receipts distinct.
- [Guide a task with explicit checkpoints](cookbooks/guide-explicit-checkpoints/COOKBOOK.md) — Separate task definition from progress, and choose intentional completion, resume, and replanning behavior.
- [Join or transfer a page across devices](cookbooks/join-across-devices/COOKBOOK.md) — Choose role-aware links and a usable transfer method without turning device purpose into authority.
- [Publish the smallest useful page](cookbooks/publish-smallest-page/COOKBOOK.md) — Start with ordinary authored files and one useful event/reply loop, then add structure only when the task needs it.

### Keep work dependable

- [Adapt an interface without losing work](cookbooks/adapt-without-losing-work/COOKBOOK.md) — Choose ordinary DOM, framework state, or declarative rendering while preserving drafts, focus, and stable task identity.
- [Choose state, events, streams, drafts, or private records](cookbooks/choose-data-model/COOKBOOK.md) — Match authority, ordering, lifetime, and privacy to each kind of information instead of putting everything in shared state.
- [Connect an agent that actually resumes](cookbooks/connect-resuming-agent/COOKBOOK.md) — Choose and verify a host receiver that wakes the intended conversation and acknowledges only handled work.
- [Ingest telemetry with a bounded budget](cookbooks/ingest-bounded-telemetry/COOKBOOK.md) — Choose acquisition and spool behavior while making backpressure, retention, and data loss explicit.
- [Keep an active task usable](cookbooks/keep-task-active/COOKBOOK.md) — Choose foreground wake lock and interruption behavior without promising background execution.
- [Publish coherent page updates](cookbooks/publish-coherent-updates/COOKBOOK.md) — Keep authored assets, runtime identity, nested paths, and draft-aware updates consistent within one target system.
- [Maintain a shared editable collection](cookbooks/reconcile-concurrent-edits/COOKBOOK.md) — Choose stable identities and explicit conflict behavior for additions, edits, ordering, and deletion.
- [Recover from queued, repeated, and outdated work](cookbooks/recover-outdated-work/COOKBOOK.md) — Keep original command meaning across interruption and distinguish retry from a new, deliberately reviewed action.
- [Resume across devices and agent sessions](cookbooks/resume-across-sessions/COOKBOOK.md) — Keep task context, consumer progress, view checkpoints, and device focus separate so a handoff does not skip work.
- [Test an adaptive page honestly](cookbooks/test-adaptive-page/COOKBOOK.md) — Use exact authored files and explicit fixtures, then verify authority and transactions at the real service boundary.

### Make sense of information

- [Present live measurements honestly](cookbooks/present-live-measurements/COOKBOOK.md) — Choose a bounded data model, rendering approach, and recovery policy without hiding gaps or mixing runs.
- [Run a bounded measurement experiment](cookbooks/run-measurement-experiment/COOKBOOK.md) — Choose acquisition, aggregation, intervention, and export policies before treating a dashboard as an experimental record.
- [Turn messy records into useful signals](cookbooks/turn-records-into-signals/COOKBOOK.md) — Project fields, preserve units, and bound flattening without silently changing the meaning of a source record.

See [evidence](guides/evidence.md), [contribution guidance](guides/contributing.md), and [core public entry](https://github.com/werg/tendriller/blob/master/agent.md).
