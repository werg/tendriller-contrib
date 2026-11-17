# Application projections, effects and timers

The independent public-package gate passes with clean Chronolog source
`6afc600bb2931b67735209dc93c28696d29bde28` and clean consumer source
`6509200331289faef45fa5ce7f681a55a1ebd277`. The native SQL archive is
`chronolog-peer-session-6afc600b-sql.tgz`, SHA-256
`af031a29d480c9ce41fe923e0884fea7dfb4188ef7c7156af5c4d231fc325c75`.

The [raw report](evidence/peer-workers-6afc600-6509200-report.json) retains actual
operations, authenticated events, selected revisions, external receipts and
timer journals. Its [validated summary](evidence/peer-workers-6afc600-6509200-summary.json)
records the raw report hash. This is new worker evidence, separate from earlier
conversation/task/browser reports.

## What the gate executes

| Boundary | Observed behavior |
| --- | --- |
| Projection | A duplicate owner is refused. The same-generation checkpoint processes only new events. Recovery from position 6 to 2 replaces the derived state with the retained note, rejects the old cursor, and leaves an already captured view coherent. Reopen retains a complete old checkpoint until its replacement commits. |
| External work | A real loopback HTTP provider commits results to SQLite. One response is deliberately dropped after commit. Recovery and process-store reopen preserve completed and uncertain journals. The uncertain call is reconciled through GET without another POST. A forged payload author label cannot authorize a dispatch. |
| Reapplication | Explicitly restoring a removed notification intent retains its original logical effect identity and observed authenticated provenance. Restoring its result uses an ordinary linked application operation. Neither step repeats the provider action. |
| Timer race | An ordinary member cancels after the scheduler has captured and authorized the configuration. The firing command rejects atomically with `assert:timer_inactive_configuration`; it publishes no notification. A valid selected-prefix revision alone does not replace this SQL guard. |
| Timer lifetime | Reopen before the deadline preserves the schedule. A committed command with a lost callback reply resolves from the session's existing operation. Recovery from position 18 to 13 removes an excluded schedule while retaining the completed occurrence's abandoned operation. An explicit linked reapplication restores that occurrence without repeating its external effect. |
| Owned wake | The maintained scheduler runs its own clock wake and changes subscription. Closing settles the owner; reopening reconciles the same ordinary operation and finds one publication. No recipe polling loop or second application outbox is added. |
| Worker facade | A real Node Worker exclusively opens the existing device and SQL store. The public page-side facade drives a projection, observes new data and a recovery reset, then closes before native reopen. Device identity and the recovered projection digest survive the transfer. |

## Use the maintained components

The [notification definition](../snippets/peer-notifications.mjs) expresses notes,
notification intents, observed receipts and schedules as ordinary commands.
`createApplicationTimerPrograms` supplies shared SQL tables and schedule, cancel
and fire programs. The firing command also binds the actual signer to the
authenticated configuration author. Origin fields copied into input are checked
against stored provenance; a payload label is never authority.

`ApplicationProjection` runs over one coherent captured view and persists its
cursor and state together. It accepts a native session or the maintained Worker
facade. `ApplicationEffectWorker` runs inside the actual application owner so its
last authorization check and dispatch share that owner. Its independent journal
retains external facts across lossy history recovery. A provider idempotency key
is scoped to application, history, worker/version, verified author and explicit
logical intent. A repeated key with different content fails instead of silently
reusing a provider call.

`ApplicationTimerScheduler` keeps selected schedules rebuildable and occurrence
attempts durable. Its publish callback returns an ordinary command handle. Retry
uses the same operation; abandoned work requires explicit linked reapplication.
The [timer scenario](../checks/peer-generation-workers-timers.mjs) demonstrates
this boundary and the cancellation race using the shared SQL helpers.

```sh
node cookbooks/run-a-peer-application/checks/run-peer-generation.mjs \
  --artifact /exact/chronolog-peer-session-sql.tgz \
  --domain workers \
  --output /new/worker-evidence
```

The runner installs into an empty directory without workspace imports or install
scripts, verifies every recorded package digest, freezes each consumer file, and
requires actual runtime observations before writing a successful summary.

## Scope

This gate uses native SQL, direct authenticated peer transport, a real Node Worker
and a synthetic durable HTTP provider. It does not claim browser OPFS, deployed
RTC, production credentials or a real notification service. Timer timestamps are
eligible participant observations; an unavailable worker can act late. A global
trusted clock and exactly-once external delivery are not promised.

The completed/uncertain external journal belongs outside the lossy selected
application suffix. Recovery changes what the application currently displays; it
cannot undo an already performed outside action. Operators must supply the
provider's actual reconciliation or idempotency contract for their integration.
