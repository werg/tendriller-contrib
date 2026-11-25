# Cookbook capability validation

The catalog contains design guides. The checks below exercise shared capabilities that an implementation can use. Each application still needs tests for its own workflow, rules, devices and permissions.

| Scenario | Cookbook guides | Evidence and next acceptance check |
| --- | --- | --- |
| Shared checklist and scheduling with two people | `choose-data-model`, `coordinate-devices`, `guide-explicit-checkpoints`, `hand-off-responsibility`, `join-across-devices`, `plan-time-and-deadlines`, `reconcile-concurrent-edits`, `schedule-shared-resources`, `search-and-filter-collections`, `track-habits-and-routines`, `triage-incoming-work`, `undo-and-revise-work` | The guarded SQL package case races two claims, rejects the unauthorized finish, and checks a coherent view. Add application-specific collision tests for bookings, corrections and deadlines. |
| Recover work after a disconnect or device loss | `connect-resuming-agent`, `export-and-restore-work`, `keep-task-active`, `recover-outdated-work`, `resume-across-sessions`, `work-offline-and-reconnect`, `write-with-versioned-feedback` | Package tests check Worker restarts, reconnect, retained outcomes, abandoned operations, and reapply. Test restoring a real exported file separately from peer recovery. |
| Private forms and reviewed actions | `ask-about-evidence`, `build-correctable-forms`, `capture-reviewed-evidence`, `collect-private-responses`, `import-for-review`, `manage-sensitive-data`, `review-exact-proposal`, `run-reviewed-batch-actions`, `separate-evidence-interpretation` | Origin isolation, guarded commands and retained outcomes exercise the underlying boundaries. Verify the recipe's role matrix, exact displayed proposal, correction path, evidence deletion, and any external provider receipt before automating a real action. |
| Draft and accessibility continuity across updates | `adapt-without-losing-work`, `compare-options`, `complete-accessible-interactions`, `explore-what-if-scenarios`, `localize-an-interaction`, `publish-coherent-updates`, `publish-smallest-page`, `run-a-peer-application`, `test-adaptive-page` | Test automatic first publication, immutable reload and opening the latest version. Exercise draft, focus, keyboard and assistive technology behavior in each authored UI. |
| Live instrumentation, progress and previews | `connect-instrument`, `detect-meaningful-changes`, `ingest-bounded-telemetry`, `observe-long-running-process`, `present-live-measurements`, `run-measurement-experiment`, `share-live-signals`, `turn-records-into-signals` | The stream and signal specimens check gaps, bounds, coalescing and expiry. Qualify real instruments, browser permissions and drop/reconnect behavior with their actual input rates. |
| Mobile field inspection or a sports companion | `annotate-a-frame`, `capture-rendered-evidence`, `collect-sketch`, `discover-capabilities`, `document-a-field-inspection`, `follow-location-progress`, `interpret-motion`, `notice-visual-changes`, `select-local-perception` | Use mobile device checks for permissions, capture cancellation, threshold accuracy, offline evidence and resumed uploads. Headless browser fixtures can exercise UI logic with injected readings. |
| Hands-free help while cooking or doing maintenance | `choose-interruptions`, `choose-voice-interaction`, `guide-practice-and-feedback` | Core browser checks cover permission, transcript, speech and interruption. Qualify real microphone and speaker behavior, background restrictions and manual fallback on each target device. |

Use the seven-mode package workflow described in [peer application checks](../cookbooks/run-a-peer-application/checks/README.md) for exact source qualification. For deployed staging coverage, see the [core operations guide](https://github.com/werg/tendriller/blob/master/docs/OPERATIONS.md). Package and staging checks cover different failure modes.

## Qualify the selected composition before claiming these paths

The live-editor, scoped attach-publication, recovery-evidence and signal-counter
guidance requires packages that contain those APIs. Prose updates do not
qualify a new artifact or deployment.

For the selected candidate, retain exact core/session identities and test
immutable snapshot/save ordering, explicit publication permission and exact retry,
routine pairing plus divergent-history consumer recovery, and signed clock drops
while reliable commands continue. The maintained core and Chronolog suites own
those regressions; the independent package matrix checks their composed boundary.
A local `npm run check` here validates content and existing deterministic
specimens, not the new native/browser or hosted guarantees. Keep connected local
UX checks separate from production sign-in and physical-device evidence.
