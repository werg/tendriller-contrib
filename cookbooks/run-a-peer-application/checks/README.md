# Qualify one public peer application session

All current checks consume the same `@chronolog/peer-session` API for device
ownership, commands, coherent queries, live signals, operation inspection,
replication and recovery. Native and browser adapters own different storage and
transports. SQL adds deterministic execution to that session; it does not add
another command API or journal. The host is a control participant with a filtered
transport, not an application replica or a per-command service.

Supply exact packed artifacts. A sibling source checkout, private fixture import,
new retry queue or copied Worker/RTC lifecycle is not an independent consumer.
The runners freeze their fixture bytes, install into a fresh directory and record
source commits/trees, cleanliness, archive hashes and dependency locks. Use a new
output directory for every run. `--allow-dirty` marks development evidence and
never turns it into clean release qualification.

## Native events and real RTC

The conversation definition in
[`peer-conversation.mjs`](../snippets/peer-conversation.mjs) runs through the same
session in both checks:

```sh
npm run test:peer-generation -- \
  --artifact /exact/chronolog-peer-session.tgz \
  --output /new/direct-evidence

npm run test:peer-generation -- \
  --artifact /exact/chronolog-peer-session-with-native-rtc.tgz \
  --transport native-rtc --output /new/native-rtc-evidence
```

Both execute original signed encrypted attempts in independent stores. The
scenario loses a reply after durable acceptance, retries the exact operation,
blocks the control host, removes the coordinator's usable store, recovers an
older complete prefix, joins a fresh peer, isolates the returning abandoned
branch, deliberately reapplies reviewed intent, rejects excluded ancestry in a
third generation, and reopens the same durable identity.

The session attaches its explicit control participant without I/O and verifies
the published definition. A second fault loses a persisted takeover response;
the maintained recovery journal retries the identical signed request and
receives the original selection and recovery notice. The fixture does not
implement another transition queue or recovery policy.

The same independent scenario keeps a fourth peer offline with a complete G1
prefix while G3 adopts a later G2 body. Learning newer authority cannot expose a
partial application view. The session identifies the retained G1 ancestor and
recovers through its normal transition journal, preserving the exact expected
generation and ancestor proof after a lost control reply. An empty peer cannot
propose a reset, and a planned handover cannot use this incomplete-view fallback.
A fresh peer replays the recovered prefix; explicit control then protects a new
command with a recovery floor. Both the owned recovery API and the host reject
an otherwise valid prefix below that floor. The fixture supplies transport
faults and signed control changes; it supplies no alternate recovery policy.

The explicit lost-reply and ancestry faults use public connection primitives.
The ordinary lifecycle then runs through `session.participate`: it discovers and
authenticates peers, continues commands with the host blocked, waits reconnect
grace before an eligible takeover, and requires the exact displayed approval
when a cold observer has no verified freshness. The fixture supplies only bounded
byte delivery or SDP introduction; it has no recovery or retry policy.

The portable fixture exposes `discovery.notifications({ signal })` as an async iterable of
`{ type: 'ready' }` and `{ type: 'changed' }`. Each subscriber gets `ready` first;
peer-map advertisements, storage-identity changes and withdrawals invalidate its
snapshot. Unconsumed changes coalesce, identical advertisements stay quiet, and
aborting its signal or returning the iterator retires the listener and unblocks a
pending read. There is no advertisement interval, TTL expiry or fallback scan.

On 2026-11-20, the actual direct portable gate passed from clean contrib source
`b469d4d329d67abd06e87e6e8ed55c855d42c4ad` against clean Chronolog source
`1e4e8406499f3aff0da988046103d0900ca2bd42`, using archive SHA-256
`4a6fa65ca813e29592b63c833ea78536e766c8332c6917207a5be7315f525601`.
The empty-directory public-package consumer exercised the notification method
through the real kernel constructor, automatic connections, exact lost-reply
retry, 33 commands with the control host blocked and unchanged control traffic,
reconnect grace, protected-floor recovery and explicitly reviewed recovery for
unknown freshness. The requested evidence directory is
`/home/werg/.local/share/tendriller/contrib-push-discovery-1e4`, containing
`report.json` and the validated `summary.json`. This run qualifies native
in-process delivery; RTC, browser and hosted qualification remain separate.
Historical qualification reports below keep their original source identities.

The direct run uses an in-process implementation of the public framed transport
interface. The RTC run uses the public raw native connection composition and
real ICE/DTLS/SCTP. Its explicit
loopback candidate and one-off in-process SDP mailbox do not qualify network
interface discovery, Internet reachability, deployed WSS fallback or deployed discovery. Both
record their exact measurement boundary rather than calling a loopback result a
deployment test.

### Durable derived views

The conversation definition also exports the pure `conversationCounts` reducer.
The consumer registers it through `session.project(...)`; Chronolog owns the
checkpoint that binds state to its event filter, reducer version and selected
history. Repeated reads process only newly relevant events. The independent
scenario checks that an unchanged read and same-generation reopen run no reducer,
that an excluded suffix produces an explicit recovery reset, and that changing
the reducer version rebuilds the view. State and cursor are never saved separately
by the application. A reducer must not dispatch external effects because recovery
or a version change may execute it again.

### Measure complete-prefix freshness

The owned participation exercise applies a fixed burst of 32 commands with 1 KiB
of text each while the host is blocked. Each command waits only for `applied()`.
After the burst, one `shared()` observation captures the survivor's signed
retention of the exact complete prefix in a different storage owner. The fixture
then closes the coordinator and measures automatic takeover after reconnect
grace with a local monotonic clock.

Reports retain workload size, completion times, the actual retention receipt,
independent storage identities, adopted point, time to usable recovery and known
lost commands. The initial five-minute freshness target is checked against the
last command's observed apply time. This short burst qualifies only its recorded
workload and topology. It does not establish a five-minute loss bound during a
partition, sustained mobile operation or device suspension; those remain G4.

## SQL and guarded domain commands

The [task-board definition](../snippets/peer-task-board.mjs) adds SQL guards and
relational state to the same application/session contract:

```sh
npm run test:peer-generation -- \
  --artifact /exact/chronolog-peer-session-with-sql.tgz \
  --domain tasks --output /new/sql-evidence
```

The public `/sql` entry prepares and opens the same application with an explicit engine capability. `prepareSqlApplication` takes the engine needed to prepare its signed schema and execution manifest. `openSqlApplication` takes a `createEngine` callback which Chronolog calls only for real data demand; a browser deployment imports `/sql-browser` inside that callback. `/sql-native` supplies `createNativeSqlEngine` for the same composition. Neither introduces another command API.

This archive includes the exact patched native engine and records its manifest
and patch digest. Two members race to claim a task; exactly one complete program
succeeds. Another signer cannot complete the winner's task. SQL, messages and
outcomes recover coherently to an older prefix, preserve adopted identities,
expose abandoned attempts, and permit explicit guarded reapplication. A member
continues after the creator closes, then reopens without replacing identity,
keys or state. This native gate does not establish WASM equivalence.

## Browser ownership and application UI

```sh
npm run test:peer-browser -- \
  --artifact /exact/chronolog-peer-session-with-native-rtc.tgz \
  --chromium /path/to/chromium --output /new/browser-evidence
```

The isolated consumer installs declared Playwright/esbuild tools and imports
only public browser entries. One Worker immediately owns the protocol and
identity, retained in small IndexedDB metadata transactions. Real data demand
loads the durable component, OPFS, keyring and attempt journal inside that same
Worker. `connectApplicationWorker` exposes the same
commands and queries to the page. The page's `serveWorkerWebRtcConnections`
supplies RTC mechanics; the Worker calls `openWorkerWebRtcConnection`, owns the
raw frames and authenticates its peer through the session. The page copies
neither protocol lifecycle nor request maps.
The Worker attaches the same session-owned control participant over the shared
envelope; fixture HTTP hosts the public registry without introducing separate
application/read and generation/select APIs.

Before showing the data view, the same scenario verifies a cold participant's
control exchange, signed code publication and served code digest, plus live
signals in both directions. Browser requests are matched to the exact archive's
module graph; neither the data implementation nor OPFS adapter may be fetched
before demand. Actual Window and Worker platform calls must show no OPFS access,
file writer, synchronous handle or Web Lock. Two concurrent first enrollments
must obtain one stable identity and close without opening data.

Three concurrent conversation queries then share one durable opening and the
already connected peer. The gate requires one storage lock, one OPFS root,
the same identity and no additional Worker. A second participant or a browser
without OPFS may start the protocol; its first data read must refuse the data
ownership or missing capability. Closing an unused participant must preserve an
existing data owner's lock, and closing the active owner must release it.

Board and compact layouts submit domain commands, preserve unsent drafts across
replacement and recovery, inspect original attempts and deliberately reapply
reviewed work. The check also exercises a newly granted reader acquiring keys,
host-blocked commands/signals/encrypted content, second-tab ownership, missing
storage refusal, graceful and abrupt Worker reopening, interrupted content
transfer, fresh-peer replay and coherent captured views.

Build complete authored page graphs through
[`build-peer-pages.mjs`](build-peer-pages.mjs) and the
[owned-session page guide](../notes/peer-session-pages.md). A real deployment must
supply its enrollment and discovery configuration. A successful UI or bundle
build is not evidence that those services ran.

## The actual hosted control participant

```sh
node cookbooks/run-a-peer-application/checks/run-peer-generation-host.mjs \
  --artifact /exact/chronolog-peer-session-with-native-rtc.tgz \
  --artifacts /exact/tendriller-dist --output /new/hosted-evidence
```

The Tendriller directory must contain its provenance manifest and exactly one
matching SDK and engine archive. The runner checks their hashes and source
identities, installs an independent consumer, then starts real workerd through
`@tendriller/engine/testing`. Synthetic authenticated test accounts make this a
runtime integration check; they do not qualify deployed login.

Bootstrap, membership controls, definition reads and generation selection travel
through `chronolog-participant-v1` at `peers/participant`. The public control
transport filters `database.submit`, `content.chunk` and `ephemeral.signal`
before HTTP. The fixture bypasses that client filter with valid peer envelopes
and requires the host to reject them too. This demonstrates selective
participation in the same protocol.

The publication facet publishes a signed HTML/module graph and verifies actual
served code. The owned session saves the exact signed publication before a
deliberately lost persisted response; retry preserves that identity and selected
version. Tampered bytes, a
administrator without publisher authority and a stale predecessor fail. A second
signed revision updates HTML and code while retaining the original immutable
version. Restarting the Durable Object preserves the publication and served
bytes without changing application authority.

A bounded test bridge carries compact controls, publication checks and short
SDP introductions between Node and workerd. The ordinary application connection
uses authenticated peer RTC. After introduction, the test blocks hosted access
and requires complete Worker HTTP/body/SDP counters and bridge counters to stay
unchanged while real peer application bytes increase. Live signals do not append
history. WebSocket relay traffic uses a separate gate with explicit host byte measurements and control-only outage scope.

The maintained `createPeerIntroductions` adapter also supplies actual hosted
discovery, invitation listeners and rendezvous to `session.participate`.
Advertisements contain only peer/storage identities and routes. The session
checks grants and usable retained history itself. The gate exercises the same
automatic and explicitly reviewed recoveries as the portable/native lane and
requires every owned introduction socket to close.

On 2026-11-20, `test:peer-host -- --transport websocket` passed from clean contrib
source `0f45b4d54794a3c9bd007893df46f32265f57547` against the exact SDK and engine
archives from clean core `722d6725fc5d659f77f844642f523125f1ef271c` and the clean
`1e4e8406499f3aff0da988046103d0900ca2bd42` session archive recorded above. The
bridge used the public `createPeerDiscoveryWatcher` over the actual workerd
`page.discoverySocket(peerId)`, delivered notification iteration to the SDK,
and observed three discovery subscriptions; watcher shutdown assertions passed.
Discovery advertisements carry no TTL or renewal fields. Both companion
workflows now default to that same immutable source pair.

Evidence is in
`/home/werg/.local/share/tendriller/contrib-hosted-discovery-722-1e4-npm1121`,
including `host-artifacts.json`, the host dependency lock, and
`peers/{report,summary}.json`. The run used Node 24.0.1 and an isolated npm
11.21.3 installation; npm 11.3 failed during peer resolution before workerd
started. This qualifies the actual packed host with WebSocket transport,
control-only outage/reconnection, recovery and publication checks. Native RTC,
browser, deployed OAuth and Internet/provider behavior remain separate gates.

The repeated hosted qualification passed twice from clean contrib
`8217aea57dd706cdfae126e9ca933825612156c7`, consuming SDK/engine bytes downloaded
from the public `source-722d6725fc5d659f77f844642f523125f1ef271c` release.
`distribution/download-core-release.mjs` verifies manifest URLs, hashes, source,
composition, provenance and the Chronolog source before retaining those bytes;
companion workflows reuse them without a core checkout or rebuild. SQL/RTC
session variants still require their declared Chronolog capability builds.
The retained graph's composition is
`87ba18a4108436a4fdd03b169251430208e852329497ec090fd525c903d0618d`.

The fixture separates deliberate relay failure from the ordinary-command
measurement. The unchanged-traffic assertion remains exact. Reconnection waits
on actual old-connection aborts and replacement openings, verifies a coherent
read in the same generation, and requires both participant roles to be healthy.
Hosted startup declares a 30-second reconnect grace covering the two 15-second
discovery/connection opening budgets; both recovery observation deadlines allow
that grace plus a bounded 30-second response margin. No 3-second recovery SLA is
claimed by these later runs. Evidence is in
`/home/werg/.local/share/tendriller/contrib-hosted-8217aea-public-r1` and
`/home/werg/.local/share/tendriller/contrib-hosted-8217aea-public-r2`, each retaining
`peers/{report,summary}.json`, `host-artifacts.json` and its dependency lock.
Both runs applied 33 commands during the control-only outage with unchanged host
traffic, closed the old physical connections, observed a replacement opening,
and passed automatic and explicitly approved recovery. These are native
workerd/WebSocket checks; browser, RTC and deployed-provider evidence retain
their separate scope.

## Forced WebSocket relay and browser relay

Run the same application/recovery scenario with direct establishment deliberately
refused, using a plain or SQL session archive (no Werift capability is needed):

```sh
npm run test:peer-host -- \
  --artifact /exact/chronolog-peer-session.tgz \
  --artifacts /exact/tendriller-dist --transport websocket \
  --output /new/relay-evidence

npm run test:peer-host -- \
  --artifact /exact/chronolog-peer-session.tgz \
  --artifacts /exact/tendriller-dist --transport websocket --browser \
  --output /new/browser-relay-evidence
```

The native gate forces each direct opener to fail and lets the public host
adapter choose its relay within the existing participation owner. It cuts relay
links and observes the same generation reconnecting. The browser gate reuses the
entire Worker/OPFS, page UI, interrupted-content and recovery scenario, changing
only the byte-transport fixture. The page owns no WebSocket or private key.

Native and Chromium clients use real WebSocket sockets. A bounded loopback test
bridge forwards their unchanged protocol frames into actual authenticated
Workerd relay sockets. Reports state this boundary; it is not deployed WSS or
Internet qualification. The fixture scans declared private command/live markers
at the raw relay boundary and records actual binary traffic on both lanes.

Only control HTTP is blocked during ordinary relayed work. Host relay ingress and
egress must increase; ciphertext transit has a real availability and bandwidth
cost. This gate never imports the direct gate's zero-host-traffic claim. Both
transports use the same authenticated encrypted channel, operation journal,
replication, projections, content and recovery. TURN is not a required path.

## Independent agent business workflow

Prepare a fresh public-package tool process with the actual native SQL engine:

```sh
npm run test:peer-generation -- \
  --artifact /exact/chronolog-peer-session-with-sql.tgz \
  --domain agent --output /new/agent-evidence
```

The runner prints an isolated working directory and interactive command. Start
that command with stdin kept open, then send one JSON object per line using the
public `{id, tool, input, timeoutMs?}` format. `list` supplies the tool schemas.
The fixture provides enrolled peers, the task definition and transport delivery;
it does not perform the agent's business commands. The native peer and owning
session provide the same journal, guarded SQL execution and recovery as other
consumers. Every request/result is retained in the raw report.

The bounded exercise reserves `agent-note-1` for a lost-reply conversation
command and `agent-note-2` for its deliberate replacement containing
`Ready for review`. It reserves `agent-wrong-author-1` for refusing completion of
the other author's `locked` task, then `agent-claim-1` and `agent-finish-1` for
claiming/completing `review`. The fixture closes/reopens the device after accepted
finish. The agent must discover/query, capture revision guards, inspect the
uncertain original, observe a recovery reset, inspect actual notices, explicitly
reapply, and inspect/wait/retry the exact finished identity after reopen.

Record the supplied task, infrastructure, coaching, mistakes and elapsed time.
This exercise qualifies public business-tool use with provided enrollment.
Automated artifact installation and fixture-owned enrollment are separate from
a fresh agent independently configuring the full deployment; do not claim those
setup steps from the workflow transcript.

## Assemble the exact local composition

After all seven runners pass against the same clean Chronolog and contrib
revisions, collect their raw reports:

```sh
npm run check:peer-composition -- \
  --report /exact/direct/report.json \
  --report /exact/native-rtc/report.json \
  --report /exact/browser/report.json \
  --report /exact/native-sql/report.json \
  --report /exact/hosted/peers/report.json \
  --report /exact/relay/peers/report.json \
  --report /exact/browser-relay/peers/report.json \
  --output /new/composition.json
```

The assembler reruns every observation validator and rejects missing/failed
gates, dirty source, mixed source trees, contradictory execution manifests and
packages with the same version but different bytes. It records raw report
hashes, all three source identities, session archive variants and content hashes,
the native engine binary/patch/manifest, host storage schema, embedded portable
verifier identity, and the actual browser/runtime/topology observations. A newer
session-only commit can use an older unchanged verifier; both identities remain
explicit and their interoperability must pass the actual hosted gate.

CI emits this manifest only after native events, native RTC, browser Worker,
native SQL, actual workerd participant, native relay and browser relay jobs all succeed. It qualifies that
local public-artifact composition. The manifest explicitly leaves real network,
provider cost, browser SQL/WASM, optional stronger services and an unassisted
fresh-agent usability study outside that claim. No failed browser run or
historical result is silently replaced by a passing report from another source.

## Evidence and remaining qualification

The [qualification note](../notes/peer-generation-qualification.md) preserves
actual reports and separates their scopes. The report validators require the
observations above. Their synthetic tests prove only that missing or
contradictory evidence is rejected, not that the runtime scenarios passed.

Current consumers use `applied()` for execution and `shared()` for retained
coverage. Neither is irreversible finality. A protected action is an explicit
capability of the same session contract and must qualify its stronger boundary.
It is not an invitation to start a second resident application stack.

Real deployment qualification still needs actual enrollment and controls,
home/mobile/restrictive networks, deployed WSS fallback, suspension, quota pressure, large content,
recovery freshness and provider/device costs. Measure the initial five-minute
freshness objective under a stated workload with another usable peer; do not
infer a universal loss bound from a heartbeat or a local run.

Earlier resident/chronological reports remain evidence of their recorded source
snapshots in [the historical archive](../notes/finalized-resident-recipe.md).
Those source snapshots retain their former runners and connection snippets.
They are not maintained as an alternate current session API or deployment path.
