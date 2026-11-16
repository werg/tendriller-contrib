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
   `tendril.application.install(createTendrillerApplicationBackend(...))` using the
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

Install one designated resident worker for `jobs` intents whose
`type` is `job.requested` and `kind` is `summarize-task`. It consumes final intent
through the public worker service, journals dispatch state, and emits `jobs`
events of `type: 'job.completed'` or `type: 'job.failed'`, `version: 1`, with the
original `jobId`, `taskId`, and a bounded `text` result. The UI only renders those
records. Selecting a handler is a trusted deployment decision; a JSON event
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

The paired public runtime integration must additionally exercise both complete
pages in Chromium with a native authority, independent writer identities, actual
SQL/OPFS and public adapters. Check the following:

| Scenario | Page observation |
| --- | --- |
| Two writers claim the same task | One final claimant; the losing operation is rejected with its draft retained. |
| Message submit response is delayed while new text is typed | Original message receives its receipt; new text remains in the editor. |
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
