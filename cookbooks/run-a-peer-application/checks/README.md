# Task-board and conversation specimens

## Peer-generation qualification

The [independent peer-generation gate](../notes/peer-generation-qualification.md)
defines the new tolerant-recovery consumer contract. Run `npm run test:peer-generation -- --artifact /exact/session.tgz --output /new/evidence`
for the independent packed native/events session exercise. Its topology and
portable-control counters are explicit in the report. The evidence validator
and synthetic tests remain separate from runtime qualification. The resident/browser
checks below exercise explicitly finalized chronological profiles and retain
their own original guarantees and source pins.


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
It also copies `scoped-state.mjs`, the optional
[captured-generation reset recipe](../notes/scoped-json-state.md). The task/chat
pages do not import that extra schema automatically; the paired native check and
an application that chooses the recipe consume the same built program module.

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
4. Connect portable synchronization through the public WebRTC framed transport;
   the resident native authority supplies inclusion and author-time closure
   evidence. Every replica derives the same chronological execution order. Use
   the configured resident HTTPS endpoint for one bounded offer/answer, then
   close introduction resources and authenticate the Chronolog peer over the
   data channel. The page owns RTC negotiation and
   synchronously transfers both untouched reliable/live data channels to the
   exclusive replica Worker, which owns framing, authentication and replication. The
   [public resident connection recipe](../snippets/connect-resident-worker.mjs)
   keeps this handoff separate from membership and application ownership. The
   native [resident task](../snippets/serve-resident-webrtc.mjs) starts its HTTPS
   listener independently of page visits. Coordinated Tendriller rendezvous is
   a separate optional path requiring both peers to join the attempt.
5. Install the public signal client with
   `tendril.signals.install(client.signals)` independently of the durable backend.
   The page consumes `tendril.signals.send()` and `subscribe()`; it does not import
   a deployment-specific signal object or implement another Worker RPC bridge.
   The namespace's `available` flag reports whether a channel is installed.
   Grant/session/sequence/expiry validation belongs to the channel. Signals can
   also be installed on a page with no durable application backend.

Export `applicationReady`, a promise for successful durable initialization. Install
the independent signal binding before returning from module evaluation and run
connect/catch-up/membership-finality work inside that promise, without awaiting
it at the module top level. The page starts its live subscription immediately;
only durable controls await `applicationReady`. A rejected readiness promise
becomes a visible durable initialization error and does not suppress live
observation. This is the specimen's bootstrap contract, not another outbox or
an alternate application writer.

The [peer network contract](../notes/peer-network.md) specifies ownership,
connection lifetime and the warm host-independence assertions. The WSS/relay
reports below qualify their exact historical routes; they are not WebRTC
measurements. Updated runtime evidence must identify both actual RTC
implementations and the observed ICE route.

Application callers only retain operation references and draft snapshots in
local storage. The actual signed program and retry state live in Chronolog's
durable proposal outbox. After reload the page queries
`backend.operations.get(operationId)`; it does not manufacture a fresh command to
redeliver old intent. A locally saved reference with no backend operation remains
an unsent/reviewable draft, rather than a claim of successful preparation.

The receipt list distinguishes an unresolved lookup from an observed missing
operation. **Check original status** reads that same operation ID and can restart
its status subscription without authoring anything. After review, a reference
with an observed missing operation can be removed from the device's list; active
submission, unresolved lookup, queued and provisional work cannot. Removing a
reference does not cancel backend work. This lets a failed preparation release
its local review slot without silently throwing away a prepared proposal.

Message normalization and editor recovery use different captured values: the
payload contains trimmed message content, while completion compares the exact
original editor text before clearing it. Leading/trailing whitespace does not
leave an already submitted draft behind, and a later edit still survives.

## Prepare the actual application

The mixed profile expects a `tasks` table with `id TEXT PRIMARY KEY`,
`title TEXT NOT NULL`, `claimed_by TEXT`, and `status TEXT NOT NULL` restricted to
the application's `open`/`done` vocabulary. Create it through a real authorized
SQL program. Seed shared rows under a real collective and have writers accept
that membership. A table created by one signer does not automatically let other
writers modify its rows. The sample claim asserts availability, updates
`claimed_by` from `chronolog_actor()`, and emits `task.claimed` atomically.
The summary action first reads a final claim before preparing its dependent
intent; a provisional claim in the optional local view cannot start agent work.
Its program retains the ownership assertion for deterministic execution.
Chronolog owns author-clock advancement. The page never constructs a timestamp
or refreshes a captured guard to make a dependent action fit the protocol.

Install one designated resident worker for `job-requests` intents whose
`type` is `job.requested` and `kind` is `summarize-task`. It consumes final intent
through the public worker service and journals dispatch state. Its handler returns
`type: 'job.completed'` or `type: 'job.failed'`, `version: 1`, with the original
`jobId`, `taskId`, and a bounded `text`. Set its `resultTopic` to `job-results`.
The service records the actual `effect.completed` envelope, including
`originEventId` and the handler's `result`. The UI joins the result to that
originating request event; a duplicate display `jobId` cannot merge effects.
Browser writer grants include `job-requests`; only the trusted worker may write
`job-results`. These are explicit writer `program` rights: the page needs SQL
plus `conversation`, `tasks` and `job-requests`, while the result publisher can
use `sql: false` with `topics: ['job-results']`. Reader permission is independent.
Selecting a handler is a trusted deployment decision; a JSON event cannot
install a workflow or grant tool authority.

The runnable handler reads shared final task data and formats a bounded response;
it has no private tool or provider. A replacement handler with private files,
email, account data or provider credentials must authorize the authenticated
`event.origin` and the requested resource before using those powers. A final
event and an allowed publication topic do not establish that policy. The public
worker preserves the origin through retries and checkpoint recovery.

The projection recognizes handler `summarize-task`, version `1`, and validates
its bounded job, task, origin-event and effect identities. A topic grant permits
JSON publication without guaranteeing this application's payload schema. A
malformed or unsupported message/job record is counted as omitted while later
valid records remain visible. Conflicting job results cannot replace another
intent. SQL schema or captured-revision failures still reject the whole read;
those indicate that the requested coherent view is unavailable.

For the event-only variation, select a genuine event-only execution profile and
an adapter without the `sql` capability. The page omits the task section and
never calls `query`. It remains a durable conversation view, not a full verifier
of a mixed group's SQL results.

The page rebuilds a bounded projection from each pinned read handle. It is a
deliberately small initial implementation, with no persistent projection cache.
Only editor drafts and operation references persist locally. Its event history
is read through that captured handle. Its `backend.changes({ view, signal })`
subscription receives the current revision and coalesced invalidations for the
selected local/final view; it does not consume durable events merely to wake the
renderer. A SQL-only change, a provisional rebase or a finality-only transition
can refresh the UI. A larger durable projection should use the public atomic
projection checkpoint helper instead of inventing a second receipt protocol.

Operation progress is `queued`, `provisional` or `final`; its separate outcome
is `accepted` or `rejected`. Both final outcomes stop the status subscription.
The message projection retains authenticated `event.origin` separately from
the JSON payload. Job projections keep the requester's `requestOrigin` distinct
from the result publisher's `resultOrigin`. Payload labels cannot impersonate
an owner or effect worker. For a timer-derived request, its event origin is the
scheduler; `configurationOrigin` is lineage asserted by that scheduler, whose
authority must be established or checked against the retained source event.

Typing uses `signals.subscribe({ topics: ['typing'], mode: 'latest' })`; distinct
transient messages use the channel's default FIFO policy. The page-owned
`shared/typing.mjs` tracks each author/session separately, removes only the sender
that clears or expires, bounds the visible set, and clears its timer/view when
the subscription ends. It does not reconstruct expired typing on reconnect.
The send path emits a best-effort clear on submit or an emptied editor; failure
does not change the durable message's outcome. The deterministic typing checks
exercise those display lifetimes independently of transport authorization.

## Run focused checks

`npm run check` runs the deterministic page/model checks. They verify bounded
pure projection, stable identities, typed SQL result interpretation, captured
SQL/event coherence, empty-filter scan progress, release on failure/cancellation,
reference immutability, and draft preservation. The small read-handle fixtures
establish page behavior only; they do not prove SQL execution, storage atomicity,
signatures, authorization or peer finality.

The paired Chronolog qualification CLI builds and exercises both complete pages
with the **packaged** Tendriller runtime, two independent OPFS SQL Workers, real
browser/native RTC channels, signed range/evidence synchronization and a native
authority. The native worker runs the provider-free
`examples/resident-agent.ts` task-summary handler. A
loopback bootstrap explicitly grants the two fixture identities; deployment
enrollment and public-network routing are separate qualification work.

```sh
npm run test:peer-application -- \
  --chronolog /exact/chronolog-checkout \
  --tendriller-runtime /exact/tendriller-runtime-package \
  --tendriller-engine /exact/tendriller-engine-package \
  --wasm /exact/chronolog-wasm-artifacts \
  --output /new/inspection-evidence
```

The Chronolog checkout must have its pinned dependencies, native engine and
Playwright Chromium installed. `--tendriller-runtime` identifies the extracted
public package containing `package.json` and `assets/kernel.mjs`. The CLI uses
only that package's assets, and the contrib wrapper invokes the core's public
qualification command without importing its implementation. `--tendriller-engine`
identifies the extracted public engine package from the same source. It enables
the actual packaged-workerd rendezvous. This explicitly coordinated specimen
starts both halves of each introduction; the default cold resident connection
uses the separate HTTPS recipe above. Both layouts exchange application bytes
over WebRTC with the native adapter. The runner retires introduction, interrupts
and reconnects peers, compares original records/capabilities/outcomes, and records
host introduction separately from RTC data-channel bytes. Its local TLS bridge
supplies a synthetic authenticated page session; it does not establish production
login or Internet reachability. The
[route qualification runbook](https://github.com/werg/chronolog-db/blob/feat/portable-peer-core/docs/route-qualification.md)
defines the counters and limits. `--browser` selects
an explicit Chromium executable. `--build-only` checks the complete asset graph;
its report explicitly says browser scenarios were **not run**.

The [deployment handoff](../notes/deployment-qualification-handoff.md) lists the
actual networks, services, permissions and device/storage evidence still needed
for issues #14–#17, with executable local/CI entry points kept separate.

The runner preserves the supplied source heads and dirty-state flags, runtime
and WASM digests, bundle metadata, complete specimen manifest, browser version,
per-scenario checks and two screenshots. A failure writes `passed: false` before
exiting nonzero. A passing build does not imply that a runtime scenario ran.
Preserve the new raw RTC report under its exact source/artifact pairing; older
WSS and relay reports below remain historical evidence for those routes.

Successful runtime invocations validate the current `chronolog-application-pilot/v3`
report before accepting it. Required observations include both independent RTC
replicas, the packaged runtime and host digests, the exact introduction recipe
and bundle, zero application requests, retired introduction sockets, warm work
while the host listener is stopped, matching signed history/capability/finality
state, and unchanged original accepted/rejected operations after reconnect.
Native session history spans the full run; page reloads restart browser session
history, so their session counts need not match.
Version 3 requires the orthogonal operation contract: every terminal operation
has `status: 'final'` and an `accepted` or `rejected` outcome. Earlier version 2
reports remain historical evidence for their exact sources.

To validate an existing raw run and preserve its SHA-256 with a derived summary:

```sh
node cookbooks/run-a-peer-application/checks/application-report.mjs \
  --report /new/peer-application-evidence/report.json \
  --output /new/peer-application-summary.json
```

The validator checks recorded observations, not report authenticity. Its tests
use synthetic inputs and do not qualify browser execution. Peer byte counters
measure logical authenticated frame payloads; RTC packet headers, credit
messages and IP/UDP/DTLS/SCTP overhead are excluded. Host SDP JSON envelopes are
counted separately, and these byte counters are not provider billing exports.

The [final RTC qualification](../notes/rtc-final-qualification-2026-11-17.md)
passed all twelve task/chat checks and all ten fresh-device membership checks
at the clean `84e22999` source pairing, after correcting the acceptance
fixtures' admission-clock control. Its application used the packaged host, two
browser replicas and a native authority. The same tested source passed the
direct browser/native and native HTTPS resident gates. Exact raw reports and
checked summaries preserve each outcome; earlier source reports keep their
original observations and scope.

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
| Stop introduction during warm RTC work | Original application work continues between authenticated peers with no additional host introduction traffic. |
| Reconnect and fetch large detached bodies | Same complete signed history and original outcomes, with bounded RTC queues and separate host/data counters. |

## Qualify the browser/native WebRTC transport

The peer transport gate runs actual Chromium, an exclusive browser OPFS Worker
and Chronolog's native Werift adapter. Its current runner uses the public direct
HTTP signaling client and resident offer handler on loopback, closes that
introduction listener, then exchanges authenticated records
and detached bodies through the RTC data channel. The fixture is independent
of the packaged Tendriller server; complete peer-page host quiescence needs the
separate [warm-host assertions](../notes/peer-network.md#prove-the-intended-load-boundary).

```sh
npm run test:peer-webrtc -- \
  --chronolog /exact/chronolog-checkout \
  --output /new/webrtc-evidence
```

The exact Chronolog checkout must have its pinned dependencies, native engine
and Playwright Chromium installed. `--browser /exact/chromium` selects an
explicit executable. `--build-only` builds fixture assets and leaves the
runtime scenarios unexecuted. The output directory must be new. The wrapper
invokes the core's public qualification command; it imports no private core
implementation and propagates a failed or interrupted run.

A successful runtime invocation also validates `report.json`: exact source
commit and dirty state, actual browser/native versions, two introduction
messages, disposed signaling, zero subsequent signaling, positive bidirectional
RTC traffic, matching signed-history digests, retained records authored by both
peers, matching detached-payload digests, unchanged complete fixture-host counters
and original accepted final outcomes preserved through exact retry without
authoring another record. Retry compares proposal identity, deterministic order
and the immutable decision; later observation timestamps and replica revisions
remain in the raw report and may advance. Unknown counters cannot become zero,
and a WSS report or build-only result cannot be promoted to RTC evidence. These
report checks verify the observations recorded by the real runner; their small
Node tests use explicitly synthetic inputs and are not transport qualification.

To preserve a derived summary of an existing raw report:

```sh
node cookbooks/run-a-peer-application/checks/webrtc-report.mjs \
  --report /exact/webrtc-evidence/report.json \
  --output /new/webrtc-summary.json
```

The summary hashes the exact raw input and retains its topology and limitations.
It does not infer a direct ICE route, real participant authentication, provider
cost or a deployed-network success rate. Preserve the raw report alongside the
summary and the actual source/artifact pairing.

The [first actual RTC run](../notes/webrtc-qualification-43976651713.md) preserves
five passing assertions, the raw report and its validated summary. It exercised
the loopback offer/answer fixture; it does not qualify later public HTTP endpoint
or resident-task code under a newer source identity.
The [subsequent direct-introduction run](../notes/direct-rtc-qualification-43978428041.md)
separately passed all five Chromium/public-HTTP RTC assertions and six native
HTTPS resident-task checks under exact clean source and recipe pins.
The [later deadline-corrected quick run](../notes/rtc-application-qualification-2026-11-16.md#later-public-direct-introduction-and-resident-lifecycle)
preserves another five browser and six resident passes at the recorded
`c3a7fd40` source, separately from the earlier task/chat source pairing.
The [final qualification](../notes/rtc-final-qualification-2026-11-17.md) passes
those gates and the full application/membership workflow at the same clean
tested `84e22999` source pairing.

Record the exact source heads, public bundle digest, native engine/WASM identity,
browser version and per-scenario outcome. A screenshot or fixture-only browser
run must not be promoted to that evidence. Network routing, real provider
idempotency and measured costs remain separate
[qualification work](../notes/implementation-and-qualification.md).

## Qualify the standing native HTTPS service

The [resident task recipe](../snippets/serve-resident-webrtc.mjs) starts a real
HTTPS offer listener through the daemon's existing resident-task lifecycle. The
paired Chronolog gate bundles that exact supplied recipe through public RTC
exports and connects an independently keyed native client to the actual
`context.connectPeer` implementation:

```sh
# Run from the exact Chronolog checkout.
node --import tsx tools/test-resident-webrtc.ts \
  --contrib /exact/tendriller-contrib-checkout \
  --output /new/resident-https-evidence
```

The gate verifies TLS using the generated loopback certificate; it does not
disable certificate checks. It exercises path/origin/admission refusal, a
caller admitted to HTTPS but denied application history by its missing reader
grant, an authorized cold RTC connection, original signed records after the
introduction closes, task shutdown, immediate cancellation before listening and
occupied-port startup failure. Both peer data and original finality come from
the real native implementation. This is native/native evidence; browser Worker
handoff remains the separate browser gate.

Preserve `report.json`, its exact source and recipe/bundle digests, and the
bundle inventory. The default route must not rely on a fixture starting a native
Tendriller rendezvous behind the scenes. Public DNS, certificate provisioning,
network reachability, TURN and deployment admission policy remain outside the
loopback test.

## Qualify thin Cloudflare membership separately

The [cost measurement guide](../notes/measuring-application-costs.md) adds an
executable native traffic/storage workload, separately dated pricing inputs and
a coverage-aware calculator. It preserves unmeasured provider usage as unknown
and does not infer savings from descriptor bytes.

The [revised membership target](../notes/thin-membership-administration.md)
has a separate gate because the two-layout application fixture pregrants its
devices. The membership gate consumes the built public SDK and engine packages,
runs their default membership provider in the real workerd test harness, and
connects an actual Chromium/OPFS device to a separate native SQL peer.
The current `chronolog-thin-membership/v3` runner uses a direct native HTTP
offer/answer endpoint and Worker-owned RTC for application history, while
participant operations continue through the packaged Cloudflare administrator.
Its compact control proof authenticates completeness and activation cutoffs
without transferring intervening application descriptors to that administrator.

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

The gate exercises device-created keys, account-bound signed
requests, owner approval, certified control-history verification, authorized key
delivery, then peer payload catch-up. It separately exercises a lost approval
reply, real Durable Object eviction, exact retry, direct-path writer revocation,
browser Worker replacement and future-epoch reader removal. Native SQL queries
verify that the signed schema administrator is a group admin and the Cloudflare
membership root is not a group member. The schema choice belongs to signed
genesis; a local materializer override would make replicas disagree.

Encoded descriptor/control traffic and detached application bytes have separate
counters. Equal candidate counts with substantially different SQL payload sizes
must deliver zero application descriptor and envelope bytes to the administrator.
The control commitment remains unchanged across application-only workloads,
while separately reported application receipt coverage advances. Keep
the observed byte report, source/artifact identities and per-stage outcomes.
The v3 RTC peer counters measure logical frame payloads, excluding transport
headers and credits. Native introduction JSON request/response bytes, description
counts and SDP bytes remain separately named counters. Do not compare them with
the HTTP application-stream byte boundaries of the historical v1 reports below
as though they measured the same transport.
Successful wrapper runs require the v2 runtime report, actual browser/native
RTC observations for all three introductions, retired signaling and complete
separate administrator/application counters. The small
[membership report validator](membership-report.mjs) checks those recorded
observations; its synthetic tests are not an enrollment qualification.
The [final RTC qualification](../notes/rtc-final-qualification-2026-11-17.md)
passed all ten membership checks alongside all twelve application checks at
the same recorded `84e22999` source. Its three introductions cover enrollment,
reconnect after writer revocation and a newly keyed reader after administrator
restart; Worker replacement is a separate durable recovery assertion. Exact raw
reports, checked summaries and archive hashes are preserved. The earlier
[membership pass at `c3a7fd40`](../notes/rtc-membership-qualification-43981821658.md)
retains its separate scope: that workflow's application step failed its
closed-timestamp fixture case.
The initial complete gate passed in
[CI run 43940378818](https://github.com/werg/chronolog-db/actions/runs/43940378818):
seven runtime assertions plus the public-package/bundle check in actual workerd
and Chromium `158.0.8127.18`. The
[recorded evidence](../notes/thin-membership-administration.md#recorded-public-artifact-qualification)
preserves the unaltered report, exact source/artifact hashes, measured bytes and
each acceptance boundary. The separate two-layout pilot also passed eight
checks with one effect dispatch and zero host application writes. Its identities
remain explicitly pregranted, while the thin fixture enrolls a fresh device.
The [reviewed pairing](../notes/qualification-review-43957113710.md) subsequently
passed the full workflow with contrib `8449017`, rebuilt public artifacts and
integrated upstream bases. Its separate raw reports contain nine application
checks (build, native scope/reset and seven browser/runtime assertions), plus
the same seven thin runtime assertions and build/import check. They preserve
new timings and byte counts rather than replacing the initial observations.
Actual deployed authentication, public-network routes and provider costs remain in issues
[#14](https://github.com/werg/tendriller-contrib/issues/14) through
[#17](https://github.com/werg/tendriller-contrib/issues/17).

## Review changes after the recorded browser pairing

The preserved browser reports remain attached to contrib `a3797d5` and their
recorded core/artifact pins. A subsequent specimen review updated the reducer's
version marker, per-event domain validation and a bounded omission count so one
accepted malformed payload cannot make the whole board unreadable. Focused Node
checks exercise malformed/future payloads followed by valid records, handler and
job identity validation, and the distinction from a failing SQL/revision read.
Those focused checks do not relabel the earlier browser run. The separate
[review qualification](../notes/qualification-review-43957113710.md) records the
updated pages' actual public-runtime scenarios and their exact artifact pairing.
This specimen has no persistent projection cache; an adaptation that adds one
must bind its checkpoint to the reducer version before reusing cached state.
The same focused review covers normalization versus the original editor snapshot,
observed-missing reference removal at the review-list limit, and refusal to
discard unresolved, actively submitted, queued or provisional operations. The
page's recheck action only uses the existing public operation lookup/subscription.

### Public resident recovery gate

The current WebRTC report is `chronolog-webrtc-qualification/v2`. Its runner
bundles the exact supplied contrib `connect-resident-worker` recipe and records
both its source and emitted bundle digests. A browser Worker authors an original
operation, the connection is interrupted, and the public supervisor establishes
one new direct introduction and waits for authenticated attachment. Exact retry
must keep the original proposal, final decision and authored record identities.
The report attributes the injected connection termination and records the actual
selected ICE candidate types, including `unknown` when unavailable.

Only then does the runner stop the page/introduction listener and exercise the
existing finality, detached-body integrity, full signed-history convergence and
original-retry assertions. No host or introduction counters may increase during
that phase. A historical v1 report cannot qualify the new recovery contract.
