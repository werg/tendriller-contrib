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

The explicit lost-reply and ancestry faults use public connection primitives.
The ordinary lifecycle then runs through `session.participate`: it discovers and
authenticates peers, continues commands with the host blocked, waits reconnect
grace before an eligible takeover, and requires the exact displayed approval
when a cold observer has no verified freshness. The fixture supplies only bounded
byte delivery or SDP introduction; it has no recovery or retry policy.

The direct run uses an in-process implementation of the public framed transport
interface. The RTC run uses the public raw native connection composition and
real ICE/DTLS/SCTP. Its explicit
loopback candidate and one-off in-process SDP mailbox do not qualify network
interface discovery, Internet reachability, TURN or deployed discovery. Both
record their exact measurement boundary rather than calling a loopback result a
deployment test.

## SQL and guarded domain commands

The [task-board definition](../snippets/peer-task-board.mjs) adds SQL guards and
relational state to the same application/session contract:

```sh
npm run test:peer-generation -- \
  --artifact /exact/chronolog-peer-session-with-sql.tgz \
  --domain tasks --output /new/sql-evidence
```

The public `/sql` entry prepares and opens the same application with an explicit engine capability. `/sql-native` supplies `createNativeSqlEngine`; `/sql-browser` supplies a browser engine for that same composition. Neither introduces another command API.

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
only public browser entries. The Worker owns OPFS, identity, keyring, the attempt
journal and both RTC channels. `connectApplicationWorker` exposes the same
commands and queries to the page. The page's `serveWorkerWebRtcConnections`
supplies RTC mechanics; the Worker calls `openWorkerWebRtcConnection`, owns the
raw frames and authenticates its peer through the session. The page copies
neither protocol lifecycle nor request maps.
The Worker attaches the same session-owned control participant over the shared
envelope; fixture HTTP hosts the public registry without introducing separate
application/read and generation/select APIs.

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
history. TURN would be real data-plane traffic and must be measured separately.

The maintained `createPeerIntroductions` adapter also supplies actual hosted
discovery, invitation listeners and rendezvous to `session.participate`.
Advertisements contain only peer/storage identities and routes. The session
checks grants and usable retained history itself. The gate exercises the same
automatic and explicitly reviewed recoveries as the portable/native lane and
requires every owned introduction socket to close.

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
home/mobile/restrictive networks, TURN, suspension, quota pressure, large content,
recovery freshness and provider/device costs. Measure the initial five-minute
freshness objective under a stated workload with another usable peer; do not
infer a universal loss bound from a heartbeat or a local run.

Earlier resident/chronological reports remain evidence of their recorded source
snapshots in [the historical archive](../notes/finalized-resident-recipe.md).
Those source snapshots retain their former runners and connection snippets.
They are not maintained as an alternate current session API or deployment path.
