# Task-board and conversation specimens

These are two page-owned adaptations of the same application decisions:

- `board.html` puts shared tasks and conversation alongside each other.
- `compact.html` uses a single-column task list, expandable agent results and a
  bounded conversation area for a small display.

Both consume the selected public `tendril.application` backend. They do not
implement a database, sign records, infer permission from a relay, enqueue a
second command copy, or dispatch tools from a UI reducer.

## Build a complete page graph

Supply the exact browser-safe public application bundle built by the paired
Chronolog change. It exports `program`, `sqlStatement` and `emit`. Supply a
deployment directory containing the real `bootstrap.mjs` and every module,
Worker, WASM and other asset that bootstrap uses.

```sh
node cookbooks/run-a-peer-application/checks/build-pages.mjs \
  --public-module /artifacts/public-application.mjs \
  --deployment /deployment/peer-bootstrap \
  --output /artifacts/inspection-pages
```

The output contains both HTML entries, shared page-owned source, the exact public
bundle and complete supplied deployment assets. Its manifest records content
digests. Build into an empty directory, publish the entire graph, and select
either `board.html` or `compact.html` as the page entry. The tool does not fill in
missing runtime modules or replace a failed deployment with fixture state.

`deployment/bootstrap.mjs` has this explicit responsibility:

1. Start/reopen the real browser peer through the public runtime and acquire its
   exclusive OPFS ownership. Use its persisted signing identity and group/profile.
2. Establish current application enrollment and historical access. A host account
   or transport endpoint is not the application grant.
3. Bind its public Chronolog adapter with
   `tendril.application.install(createChronologApplicationBackend({ id, replica, sql }))`
   from `@chronolog/transport-tendriller`, using the
   same immutable backend ID selected when the host page was created. The page
   awaits `tendril.application.ready()`.
4. Connect portable synchronization through the selected public framed transport;
   the resident native authority supplies coordinated order. A preexisting cold
   bootstrap can still use hosting services.
5. Export `signals`, either an authorized public `EphemeralChannel` instance or
   `null`. Grant/session/sequence/expiry validation belongs to that channel.

Application callers only retain operation references and draft snapshots in
local storage. The actual signed program and retry state live in Chronolog's
durable proposal outbox. After reload the page queries
`backend.operations.get(operationId)`; it does not manufacture a fresh command to
redeliver old intent. A locally saved reference with no backend operation remains
an unsent/reviewable draft, rather than a claim of successful preparation.

## Prepare the actual application

The mixed profile expects a `tasks` table with `id TEXT PRIMARY KEY`,
`title TEXT NOT NULL`, `claimed_by TEXT`, and `status TEXT NOT NULL` restricted to
the application's `open`/`done` vocabulary. Create it through a real authorized
SQL program. Seed shared rows under a real collective and have writers accept
that membership. A table created by one signer does not automatically let other
writers modify its rows. The sample claim asserts availability, updates
`claimed_by` from `chronolog_actor()`, and emits `task.claimed` atomically.

Install one designated resident worker for `job-requests` intents whose
`type` is `job.requested` and `kind` is `summarize-task`. It consumes final intent
through the public worker service and journals dispatch state. Its handler returns
`type: 'job.completed'` or `type: 'job.failed'`, `version: 1`, with the original
`jobId`, `taskId`, and a bounded `text`. Set its `resultTopic` to `job-results`.
The service records the actual `effect.completed` envelope, including
`originEventId` and the handler's `result`. The UI joins the result to that
originating request event; a duplicate display `jobId` cannot merge effects.
Browser writer grants include `job-requests`; only the trusted worker may write
`job-results`. Selecting a handler is a trusted deployment decision; a JSON event
cannot install a workflow or grant tool authority.

For the event-only variation, select a genuine event-only execution profile and
an adapter without the `sql` capability. The page omits the task section and
never calls `query`. It remains a durable conversation view, not a full verifier
of a mixed group's SQL results.

The page rebuilds a bounded projection from each pinned read handle. It is a
deliberately small initial implementation, with no persistent projection cache.
Only editor drafts and operation references persist locally. Its event
subscription is a wake-up path for replacement views, not a worker's handled
cursor. A larger application should consume the public atomic projection
checkpoint helper instead of inventing a second receipt protocol.

## Run focused checks

`npm run check` runs the deterministic page/model checks. They verify bounded
pure projection, stable identities, typed SQL result interpretation, captured
SQL/event coherence, empty-filter scan progress, release on failure/cancellation,
reference immutability, and draft preservation. The small read-handle fixtures
establish page behavior only; they do not prove SQL execution, storage atomicity,
signatures, authorization or peer finality.

The paired Chronolog qualification CLI builds and exercises both complete pages
with the **packaged** Tendriller runtime, two independent OPFS SQL Workers, real
signed range/evidence synchronization and a native authority. The native worker
runs the provider-free `examples/resident-agent.ts` task-summary handler. A
loopback bootstrap explicitly grants the two fixture identities; deployment
enrollment and public-network routing are separate qualification work.

```sh
npm run test:peer-application -- \
  --chronolog /exact/chronolog-checkout \
  --tendriller-runtime /exact/tendriller-runtime-package \
  --wasm /exact/chronolog-wasm-artifacts \
  --output /new/inspection-evidence
```

The Chronolog checkout must have its pinned dependencies, native engine and
Playwright Chromium installed. `--tendriller-runtime` identifies the extracted
public package containing `package.json` and `assets/kernel.mjs`. The CLI uses
only that package's assets, and the contrib wrapper invokes the core's public
qualification command without importing its implementation. `--browser` selects
an explicit Chromium executable. `--build-only` checks the complete asset graph;
its report explicitly says browser scenarios were **not run**.

The runner preserves the supplied source heads and dirty-state flags, runtime
and WASM digests, bundle metadata, complete specimen manifest, browser version,
per-scenario checks and two screenshots. A failure writes `passed: false` before
exiting nonzero. The local build produced the complete graph; local Chromium
launch was blocked by `socket() failed: Operation not permitted`. No browser
success is inferred from that build. The paired core CI runs the actual gate.

Qualification covers these observations:

| Scenario | Page observation |
| --- | --- |
| Two writers claim the same task | One final claimant; the losing operation is rejected with its draft retained. |
| Message submit response is delayed while new text is typed | Original message receives its receipt; new text remains in the editor. |
| Final status arrives before the original submit reply | A delayed queued receipt cannot regress the observed final result. |
| Reload after the proposal is durably prepared | Same operation identity/result, without a second message or claim. |
| Finality changes but task rows do not | Receipt changes from provisional to final. |
| Replay the UI or reopen a device | No additional worker/provider invocation from the reducer. |
| Read while a revision changes | Task rows and conversation appear as one captured replacement. |
| Disable Cloudflare application writes | Tasks, messages, worker results and recovery continue through peers. |
| Use event-only profile | Conversation works with no SQL engine or task query. |
| Remove the signal grant or expire a signal | Typing disappears without becoming durable history. |

Record the exact source heads, public bundle digest, native engine/WASM identity,
browser version and per-scenario outcome. A screenshot or fixture-only browser
run must not be promoted to that evidence. Network routing, real provider
idempotency and measured costs remain separate
[qualification work](../notes/implementation-and-qualification.md).

## Qualify thin Cloudflare membership separately

The [revised membership target](../notes/thin-membership-administration.md)
has a separate gate because the two-layout application fixture pregrants its
devices. The membership gate consumes the built public SDK and engine packages,
runs their default membership provider in the real workerd test harness, and
connects an actual Chromium/OPFS device to a separate native SQL peer.

```sh
npm run test:peer-membership -- \
  --chronolog /exact/chronolog-checkout \
  --tendriller-artifacts /exact/tendriller-public-dist \
  --wasm /exact/chronolog-wasm-artifacts \
  --output /new/membership-evidence
```

The artifact directory must contain exactly one SDK tarball and one engine
tarball from the paired revision. The runner installs them into an isolated
consumer, uses their public testing and membership APIs, and preserves their
hashes. It does not inject a roster provider or import the host's private source.
`--build-only` records an artifact/bundle build and explicitly leaves workerd and
browser scenarios unrun.

The gate is intended to demonstrate device-created keys, account-bound signed
requests, owner approval, certified control-history verification, authorized key
delivery, then peer payload catch-up. It separately exercises a lost approval
reply, real Durable Object eviction, exact retry, direct-path writer revocation,
browser Worker replacement and future-epoch reader removal. Native SQL queries
verify that the signed schema administrator is a group admin and the Cloudflare
membership root is not a group member. The schema choice belongs to signed
genesis; a local materializer override would make replicas disagree.

Encoded descriptor/control traffic and detached application bytes have separate
counters. Equal candidate counts with substantially different SQL payload sizes
must still deliver zero application envelope bytes to the administrator. Keep
the observed byte report, source/artifact identities and per-stage outcomes.
This gate is **pending qualification** until its exact complete report is
recorded. A passing native-only subtest or compiled Worker does not establish
the Cloudflare/browser result. Even a complete local workerd run leaves actual
deployed authentication, public-network routes and provider costs to issues
[#14](https://github.com/werg/tendriller-contrib/issues/14) through
[#17](https://github.com/werg/tendriller-contrib/issues/17).
