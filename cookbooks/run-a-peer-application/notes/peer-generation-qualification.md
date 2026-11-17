# Qualify the common application session independently

## Application contract and plan scope

The implementation follows one public session, command/query/event API,
operation journal and authenticated replication model. Browser and native
runtimes supply explicit storage, transport and SQL engine capabilities. The
host is a light participant with a dedicated filtered transport for controls,
discovery, invitations and signed code publication. Ordinary application commands
and their required bodies remain on established peer connections.

The user's subsequent instructions supersede the plan's migration and parallel
profile provisions: this is pre-release software, with no compatibility aliases,
legacy-profile preservation or migration layer. Historical reports retain their
original factual scope; their retired runtimes are not another supported
application composition. Signed wire format versions remain protocol evidence,
not application selectors.

`session.participate` owns bounded discovery, authentication, connection attempts,
replication, reconnect grace and recovery choice. The Tendriller
`createPeerIntroductions` adapter supplies delivery only. Its advertisements
contain peer/storage identities and routes; grants and usable history are
verified by the session. The application does not implement a parallel
coordinator policy or command queue.

## WebSocket transport contract

The accepted relay path is direct WebRTC with authenticated WebSocket fallback;
TURN is no longer a required qualification path. Both feed one bounded peer
connection and the same authenticated encrypted application channel. The server
keeps its restricted control-participant role; its separately authorized relay
forwards opaque application frames without storing or executing their contents.
Relayed application traffic does consume server bandwidth and depends on relay
availability. Historical zero-host-data observations below apply to direct paths.

The seven-gate composition below adds native and browser relay gates to the five original gates. They reuse the same application and Worker scenarios, exercise actual Workerd relay sockets through real loopback WebSockets, and separate blocked control HTTP from relay byte counters. Native evidence exercises automatic fallback; browser evidence exercises the actual Worker relay transport through explicit test connections. Deployed authentication, real WSS networks and provider/device cost remain separate observations.

## Qualified seven-gate composition: `2209cd27`

All seven public consumers, the strict composition assembler and artifact upload
passed in [core CI run 44151716927](https://github.com/werg/chronolog-db/actions/runs/44151716927),
job `134281576851`. The unchanged
[composition](evidence/2026-11-17-ci-composition-2209cd27/composition.json) and
[origin/provenance index](evidence/2026-11-17-ci-composition-2209cd27/origin.json)
bind the complete result to these clean sources:

| Source | Qualified commit | Verified tree |
| --- | --- | --- |
| Chronolog actual CI merge | `2209cd271ef3661d24ea3421f665146c2f8c76fc` | `ac8bf1387d3601d20eb4b18391f8fb556d21bff8` |
| Chronolog branch head | `73ffcad9cb74a924e94862e71ef01a00b456b9ca` | The same exact tree as the CI merge |
| Tendriller | `50810422bfa1003ae5690eda32c8e71ecaf31e72` | `838202323b42442b3cb6cc31873d33573d9d4bdc` |
| Independent consumer | `03c601b4ca744af34ab197149d1b795e1bb38250` | `144cde06ecd7a2ad385394eddd93c792e638f42e` |

| Gate | Actual observed boundary | Raw evidence |
| --- | --- | --- |
| Native events | Public session, exact retry, projections, inherited recovery and owned participation | [Report](evidence/2026-11-17-ci-composition-2209cd27/native-events/report.json) |
| Native RTC | The same scenario over actual loopback RTC and common encrypted peer channels | [Report](evidence/2026-11-17-ci-composition-2209cd27/native-rtc/report.json) |
| Browser RTC | Real Chromium Worker/OPFS ownership, key enrollment, UI, content interruption and recovery | [Report](evidence/2026-11-17-ci-composition-2209cd27/browser-worker/report.json) |
| Native SQL | Actual native engine, transactional task guards, shared session and recovery | [Report](evidence/2026-11-17-ci-composition-2209cd27/native-sql/report.json) |
| Hosted participant | Actual Workerd controls, filtering, signed HTML/code publication, restart and direct peer traffic | [Report](evidence/2026-11-17-ci-composition-2209cd27/hosted-participant/report.json) |
| Native relay | Forced direct failure, automatic WebSocket relay selection and session-owned cut/reconnect | [Report](evidence/2026-11-17-ci-composition-2209cd27/hosted-websocket-relay/report.json) |
| Browser relay | Actual Worker-owned WebSockets, the same OPFS/UI/content/recovery/reopen scenario, explicit transport fault fixtures | [Report](evidence/2026-11-17-ci-composition-2209cd27/browser-websocket-relay/report.json) |

The browser relay gate does not independently exercise the introductions
fallback policy; the native relay gate supplies that observation. Both browser
gates used Chromium `158.0.8127.18`. Relayed sockets stayed in the dedicated
Worker, while the page held no private keys or application transport owner.
Browser controls remain the declared portable HTTP fixture; the separate hosted
participant gate exercises Tendriller's actual control transport.

The native relay run recorded seven explicit peer pairs, 36 relay socket
upgrades, 1,799,043 sent and 1,775,299 received relay payload bytes. The existing
participation owner reconnected after a physical relay cut in the same
generation. Its retained 32-command, 1,024-byte workload lost no known command,
with 383 ms of observed adopted-prefix age and 3.434 seconds to recovery.
The browser relay run recorded four peer pairs, 16 relay socket upgrades,
655,628 sent and 646,639 received payload bytes. It retained 32,768 content bytes
in the ordinary workload and completed the larger interrupted-content scenario
after reopening. Both runs observed actual reliable and live binary traffic and
zero matches for the declared private markers at the raw relay boundary. These
are complete-scenario payload totals, not comparable per-command prices,
IP/TCP/TLS wire counters or provider billing measurements.

This source also includes the shared participation-owner correction: discovery
waits for an already owned incoming coordinator opening, and recovery rechecks
coordinator health/opening before a proposal or selection. A pending bounded
connection cannot be discarded merely because the recovery grace elapsed while
direct establishment was progressing toward relay fallback. The maintained
controller remains the only owner of attempts and recovery policy.

The complete downloaded artifact was verified as 9,349,316 bytes with SHA-256
`b23f8a7991912d924ba63ff756a7406d3c94fbd669cc6cf7e1155f226ecc670e`.
All seven report hashes match the unchanged composition, whose SHA-256 is
`c1d5fc57086db4d044842f3b7173fd2e29f5ba3fcb542a62b11f79dbf0e97998`.
Local reassembly reproduced that manifest exactly. Verification covered 107
files in the RTC archive, 138 in the SQL archive and all seven engine files,
plus the SDK/runtime/engine archive digests and embedded control provenance.

Core verification job `134281605688` passed typecheck, lint, build and public
artifact checks: 572 tests passed and six were skipped in the general run,
with 91.93% statement, 86.02% branch and 90.45% function coverage. The six skips
are the `wasm-conformance.test.ts` cases; all six engine comparisons passed in
[the dedicated native/WASM run 44151716443](https://github.com/werg/chronolog-db/actions/runs/44151716443).
Linux conformance passed. At this evidence checkpoint macOS conformance job
`134281605713` is still queued, so the complete Quality workflow is not claimed
green. Engine-level WASM comparisons do not establish a complete browser
SQL/WASM application with OPFS; these browser consumers use the events runtime.

Deployed login, WSS over real home/mobile/restrictive networks, sustained
suspension/churn/quota, large-content operating limits, device/provider costs and
an unassisted install/create-enroll/discovery study remain outside this local
composition. No existing baseline or failed preview is relabeled as one of its
seven successful reports.

## Local WebSocket relay checkpoint: `3d31e101`

The native relay runner and its actual Workerd test passed using clean
Chronolog `3d31e101627ec58b9bf98552c05bdedbd45abbd1`, Tendriller
`50810422bfa1003ae5690eda32c8e71ecaf31e72`, and consumer
`a3368d4c79b2dba2fd529156480ee60c0fa7f119`. The
[raw report](evidence/2026-11-17-websocket-local-3d31e101/relay/report.json),
[validated summary](evidence/2026-11-17-websocket-local-3d31e101/relay/summary.json)
and [origin/provenance index](evidence/2026-11-17-websocket-local-3d31e101/origin.json)
preserve the actual byte and source boundaries.

Seven explicitly connected peer pairs and the owned participation controller
attempted direct delivery 18 times before selecting the WebSocket relay. The
host observed 36 relay socket upgrades, 1,778,808 sent payload bytes and
1,756,018 received payload bytes across the complete scenario. Those totals
include relay protocol and encrypted application frames; they are not provider
billing meters or per-command wire costs. Reliable lanes observed 1,016 sends
and 1,011 receives; the disposable signal observed one send and one receive on
separate endpoints. No declared private command/live/content marker appeared in
raw relay frames.

The same public scenario applied commands, delivered live typing, retained
22,528 content bytes, reused durable projections, recovered a complete ancestor,
rejected protected-floor violations and preserved exact signed retries. During
the two-command control outage, control requests remained 47→47; during the
owned 32-command, 1,024-byte burst they remained 134→134. Relay transit continued
and is explicitly included in the delivery boundary. Cutting relay links led
the existing participation owner to reopen its connection in the same generation,
without a replacement identity or another command queue. Subsequent coordinator
loss adopted the complete observed burst with zero known lost commands,
2.249 seconds of observed adopted-prefix age and 3.758 seconds to recovery.

The earlier [failed raw report](evidence/2026-11-17-websocket-local-3d31e101/failed-relay/report.json)
remains unchanged. Its application scenario completed, but its validator
incorrectly required one live socket to both send and receive. One-way delivery
has separate sender and receiver sockets. The corrected validator still requires
observed ingress and egress for each lane, and the clean rerun above passed.

A separate [direct feature smoke](evidence/2026-11-17-websocket-local-3d31e101/direct/report.json)
passed on consumer `3853ac9756001020a4cf1889a3a440002810e4b4` with the same
Chronolog feature archive. These different consumer checkpoints are preserved
individually; they are not combined into a seven-gate composition. The new
browser relay fixtures also bundle against the public archives, but a bundle is
not Chromium runtime evidence. Deployed WSS, authentication, real network
conditions and provider/device costs remain unqualified here.

## Qualified direct composition: `e82163de`

All five public-package consumers, the strict composition assembler and artifact
upload passed in [core CI run 44126997819](https://github.com/werg/chronolog-db/actions/runs/44126997819).
This checkpoint includes inherited-ancestor recovery, current-role admission
before journaling a new selection, protected recovery floors, author-scoped
operation tools and the host's durable control-owner check. The exact emitted
[composition](evidence/2026-11-17-ci-composition-e82163de/composition.json)
and [origin record](evidence/2026-11-17-ci-composition-e82163de/origin.json)
bind the following retained inputs:

| Gate | Passing report | Observed contract |
| --- | --- | --- |
| Native events | [Direct](evidence/2026-11-17-ci-composition-e82163de/direct/report.json) | Common session, durable projections, exact retry, inherited ancestry and protected-floor rejection. |
| Native RTC | [Native RTC](evidence/2026-11-17-ci-composition-e82163de/native-rtc/report.json) | The same application/recovery checks through actual native ICE/DTLS/SCTP. |
| Browser Worker | [Chromium/OPFS](evidence/2026-11-17-ci-composition-e82163de/browser/report.json) | Actual dedicated Worker ownership, OPFS/Web Locks, peer data exchange, fresh replay and graceful/abrupt reopen. |
| Native SQL | [Guarded tasks](evidence/2026-11-17-ci-composition-e82163de/native-sql/report.json), [public archive boundary](evidence/2026-11-17-ci-composition-e82163de/native-sql/public-boundary-report.json) | Actual patched native engine, original-author transactional guards, coherent SQL/events recovery and durable identity. |
| Hosted participant | [Actual workerd/native RTC](evidence/2026-11-17-ci-composition-e82163de/hosted/report.json) | Public host transport, signed code publication, explicit publisher permission, inherited recovery and local/raw-host floor enforcement. |

### Exact sources and retrieved bytes

The workflow head is Chronolog
`c562a997517e5c420e51c08dc962a639a2889d19`. The actual clean checkout and
packed source is PR merge `e82163dee1d79ce70c566ca6db60fa95d403cda4`.
Both have exactly the same tree,
`e5e58418398b572d36686838537ad74c9bfc7f9f`. Every consumer records clean
contrib `1d46947b2f86a5cbbb2c95b3e358b343768d5aa8`, tree
`9c222fe3993f2a080627a1fecd97a6da2f448b96`. The hosted lane records clean
Tendriller `ed2509358c01a2a1a7c9db7691f4775347bb27c0`, tree
`ee38b3c2bea94d9b88032003219ecd773d69dfb1`.

GitHub artifact `application-44126997819-1`, ID `14346919661`, was downloaded
and its 9,079,086 bytes verified against ZIP SHA-256
`773c89628db722427ce76457633c45d02bbf0faa83111e61a4683f0356a1a9e7`.
The unmodified `1d46947b` validators reproduce all five summaries and the
emitted composition exactly. Its SHA-256 is
`f8adc65ee011ef82da57e06bc58ae77144989520fee3a7cce75c94e9c3d755b4`.

| Downloaded package | Verified archive SHA-256 |
| --- | --- |
| Chronolog RTC | `45cd5b492800813e99b6ecb8d00b5f904df67a50d3a2bdd7df209949a5116661` |
| Chronolog native SQL | `6009ddd84c29e08412d082a6623e19907ff53cc5351997ea9cbb1b587803a468` |
| Tendriller SDK | `613f87f98e0170a19f0c6874be00f01de87192b8c9f636c6c1222bf1b365fffe` |
| Tendriller engine | `8c3d5aa8510611d2af2340037a053d0dd28c02dbb00b04fed06370f68ec4a1e3` |
| Tendriller runtime | `2c10cde3226c90b84c071730b55a272cd1a0b6ce2388cc57f9fff0a9437bb2d2` |

All 99 RTC and 130 SQL file digests were checked directly against the downloaded
archives, including the actual native engine binary. All three host archive
digests and the engine's seven named file digests were checked as well. Retained
[RTC](evidence/2026-11-17-ci-composition-e82163de/provenance/session-rtc.json),
[SQL](evidence/2026-11-17-ci-composition-e82163de/provenance/session-sql.json),
[host release](evidence/2026-11-17-ci-composition-e82163de/provenance/host.json),
[host engine](evidence/2026-11-17-ci-composition-e82163de/provenance/host-engine.json)
and [embedded verifier](evidence/2026-11-17-ci-composition-e82163de/provenance/embedded-control.json)
provenance preserves their distinct source and content identities.

### Inherited recovery and protected authority

The direct, RTC and hosted scenarios begin with selected generation 2 and a
survivor that has only the complete inherited generation-0 prefix at sequence 4.
They reject an empty survivor and refuse incomplete-view reads. Preparing a
recovery proposal does not publish a usable view, and the incomplete survivor
cannot turn this into a planned handover. Generation 3 then adopts the exact
verified ancestor. The inherited operation keeps its original author, attempt
identity and accepted outcome; excluded suffix work stays absent. Fresh replay
matches the retained digest, and commands resume on the selected successor.

A deliberately lost persisted selection reply retries the identical saved
request and returns the same selected generation. Recovery still reports
`unknownLoss: true` where unseen abandoned work cannot be counted. After a
protected floor is established, both the local recovery API and the raw host
refuse the older prefix. The rejected local proposal leaves its transition
journal unchanged and does not expose an incomplete view.

The current-role guard runs before saving or sending a new selection intent.
It can first read the latest signed authority from the host; this is not a
claim that transition preparation makes no host request. The ordinary command
path remains separately measured below.

The [earlier `adc477e7`/`10f53f11` failure](evidence/2026-11-17-ancestor-baseline-10f53f11-report.json)
is preserved as the baseline that stopped at the incomplete-prefix check. This
new passing source exercises the subsequent inherited-ancestor and floor cases;
the older reports and their weaker fixture identity are not relabeled.

### Bounded workload, browser and quality results

Each events lane applies 32 commands with 1,024-byte text through ordinary
`applied()` completion, then makes one coverage observation from an independent
store. All 32 original-author outcomes survive the selected takeover:

| Exact CI workload | Prefix age at disconnect | Takeover readiness | Known lost commands |
| --- | --- | --- | --- |
| Direct events | 154.07 ms | 360.32 ms | 0 |
| Native RTC | 157.37 ms | 356.25 ms | 0 |
| Actual hosted participant | 153.29 ms | 427.54 ms | 0 |

These separate bounded CI runs satisfy the declared 300,000 ms target for that
workload. They are neither a controlled transport-performance comparison nor a
universal maximum loss guarantee. Unknown freshness still requires explicit
approval. During the hosted controller's blocked-host window, bridge requests
remain 129 and body bytes remain 55,577; Worker HTTP requests remain 90 and body
bytes remain 44,461. Invitation/rendezvous counters are unchanged and required
host application-body bytes remain zero. The actual workerd scenario passes
1/1, with 12.59 s test time and 13.87 s total duration.

Chromium 158.0.8127.18 runs the actual dedicated Worker and OPFS with exclusive
Web Locks. The browser gate checks peer commands/signals/content, exact operation
identity, fresh replay and graceful/abrupt Worker reopen. It remains distinct
from native SQL and from the separate native/WASM engine comparison.

The [quality verification job](https://github.com/werg/chronolog-db/actions/runs/44126997574/job/134193516356)
passed 542 tests with 6 ordinary-suite WASM skips, across 63 passed files and 1
skipped file. Coverage is 91.74% statements, 85.87% branches and 90.26%
functions. The complete [quality workflow](https://github.com/werg/chronolog-db/actions/runs/44126997574)
also passed Linux and macOS conformance and the portable digest comparison.
The [dedicated native/WASM run](https://github.com/werg/chronolog-db/actions/runs/44126997621)
passed all 6 actual comparisons, separately accounting for those skips.

This is a complete exact-source local public-package composition. Deployed
authentication, Internet/home/mobile/restrictive networks and TURN, sustained
suspension/quota, browser SQL integration, provider/device cost and unassisted
fresh-agent installation/enrollment remain the separate acceptance boundaries
listed below.

## Separate contrib CI composition: `5581a475`

All five independent public-package gates and strict composition assembly passed
again after the recovery-authority admission change, in
[contrib CI run 44126931363](https://github.com/werg/tendriller-contrib/actions/runs/44126931363).
The exact [contrib CI manifest](evidence/2026-11-17-ci-composition-5581a475/composition.json)
has SHA-256
`717f92a2b064332eae85f43819c456bb9dd7f0d40eda5afb584c43ae55822879`.
Its [origin record](evidence/2026-11-17-ci-composition-5581a475/origin.json)
identifies the successful composition job, all six artifact IDs and GitHub's
archive digests. The downloaded manifest ZIP matched its recorded digest;
the five original raw-report bundles remain in the linked CI artifacts.

| Component | Exact clean source | Source tree |
| --- | --- | --- |
| Chronolog runtime | `5581a475946c363c47211194016c72f21ecb45c4` | `63897c75083dabf152f2e88401a55919918bbb19` |
| Tendriller host | `ed2509358c01a2a1a7c9db7691f4775347bb27c0` | `ee38b3c2bea94d9b88032003219ecd773d69dfb1` |
| CI consumer checkout | `2e3b4f49925fa4c733fbd8a7ad445cc22c400a36` | `9c222fe3993f2a080627a1fecd97a6da2f448b96` |

The consumer merge checkout has the same tree as branch pin
`1d46947b2f86a5cbbb2c95b3e358b343768d5aa8`. That workflow explicitly pins the
runtime and host sources above. Direct events, native RTC, browser Worker,
native SQL and the actual hosted participant all passed, as did strict assembly
job `134195404613`. The manifest retains each checked summary and exact raw
report hash without duplicating another complete raw-report set in this
repository. No independent local reassembly is claimed for this latest run.
The separately retained `f5e01684` reports and fresh-agent study below remain
scoped to their recorded source and artifact identities.

## Earlier complete ancestor-recovery composition: `f5e01684`

All five independent gates and the strict composition job passed in
[contrib CI run 44126101769](https://github.com/werg/tendriller-contrib/actions/runs/44126101769).
The exact [composition manifest](evidence/2026-11-17-ci-composition-f5e01684/composition.json)
and [origin record](evidence/2026-11-17-ci-composition-f5e01684/origin.json) retain
the complete source, package, content, browser, report and GitHub artifact
identities. All six downloaded artifact ZIPs matched GitHub's recorded size and
SHA-256. Reassembling the five raw reports with the unchanged strict validator
reproduced the successful remote manifest exactly, including SHA-256
`5d7790f14b20336f6dfe80eb96acbfdf8f030640d2b0178bffbb22b0603db8d7`.

| Component | Exact clean source | Source tree |
| --- | --- | --- |
| Chronolog runtime | `f5e016843ce062e27aa56445ca74f15f046ecb2a` | `86ada86a6fed8080c8f2d78f01e010ae7f929eec` |
| Tendriller host | `ed2509358c01a2a1a7c9db7691f4775347bb27c0` | `ee38b3c2bea94d9b88032003219ecd773d69dfb1` |
| CI consumer checkout | `91b341716c22a04d279fbc5a86fd5e2e9db9dd1e` | `96bc5cccd795fa216c465abb417c7d2f7c5f7dfc` |

The consumer checkout is GitHub's pull-request merge for branch commit
`80997ea96d00a59d3c376c9157cba78cefdb1cfc`; both have the same complete tree.
Later source changes require separate qualification and do not inherit this
checkpoint. The source revision of a later documentation or workflow-only
commit is not substituted into these observed runtime reports.

| Gate | Exact passing raw evidence |
| --- | --- |
| Native events | [Direct](evidence/2026-11-17-ci-composition-f5e01684/direct/report.json) |
| Native RTC | [Authenticated native RTC](evidence/2026-11-17-ci-composition-f5e01684/native-rtc/report.json) |
| Browser Worker | [Chromium/OPFS](evidence/2026-11-17-ci-composition-f5e01684/browser/report.json) |
| Native SQL | [Guarded SQL tasks](evidence/2026-11-17-ci-composition-f5e01684/native-sql/report.json) |
| Hosted participant | [Actual workerd/native RTC](evidence/2026-11-17-ci-composition-f5e01684/hosted/report.json) |

The direct, RTC and hosted scenarios now retain a complete four-command G1
ancestor on an isolated survivor while G3 selects a G2 body that survivor lacks.
Reading the incomplete current view is refused. Inspecting a recovery point
returns the complete G1 ancestor without publishing a partial view; an empty
peer and planned handover remain ineligible. The session saves a takeover
against the actual G3 selection, loses its first persisted response, and retries
the identical signed request to recover one G4 selection. Its restored view and
original operation identity match the retained ancestor, and a fresh peer
replays the same state. Previously excluded suffixes remain absent.

The recovered coordinator then applies a new command and explicitly advances
the control recovery floor to that command. A peer missing the protected body
cannot recover below the floor: both its owned recovery API and a raw signed
request to the control participant are refused. The rejected local request
does not enter its transition journal. The ordinary participation controller
then resumes, performs the host-blocked workload and completes its automatic
and explicitly approved recoveries above that floor.

| Observed workload | Burst apply time | Complete-prefix age at coordinator loss | Time to usable takeover | Known lost workload commands |
| --- | --- | --- | --- | --- |
| CI direct events | 858.41 ms | 96.15 ms | 296.75 ms | 0 |
| CI native RTC | 1,044.55 ms | 183.00 ms | 387.87 ms | 0 |
| CI hosted controls/native RTC | 981.05 ms | 146.45 ms | 285.58 ms | 0 |
| Separate local direct run | 8,231.19 ms | 737.08 ms | 1,572.40 ms | 0 |

Each workload contains 32 commands with 1,024-byte text, waits for ordinary
`applied()` completion, and observes independent retention once after the burst.
Host traffic remains unchanged during the measured outage windows. These are
observations of distinct local runs, not a controlled performance comparison or
a universal loss guarantee. The five-minute target remains limited to the
declared workload and measured retained prefix.

The [separate local direct report](evidence/2026-11-17-final-direct-f5e01684-report.json)
and [checked summary](evidence/2026-11-17-final-direct-f5e01684-summary.json) use
the same clean runtime source and branch consumer `80997ea`. Its SQL-capable
archive SHA-256 is
`bf35d116b5b7f6e0efbbe73c1d80e20fc5800bf5b81c799b96486f3c4b40ac5c`;
the CI SQL archive is
`2d8355323713f88614b85ff1a9080e664ae31f4709e7e38cca467cb3abb00e86`.
Comparing the verified content manifests finds exactly one differing file:
`engine/build/Release/doltlite.node`, with local digest
`291e75ef09c0e07482f2a2f6030eaf588127c62db1d4444cd914f60ea43e27e2`
and CI digest
`cca093a1ca607b5d8478515f04ae27c03893af0a91ce91a9c566c6aa4fe961d4`.
All other packaged content hashes match. These are recorded as separate exact
native artifacts; no local report is substituted into the CI composition.

The same gates retain public projection recovery from six messages to four,
checkpoint reopen without reducer replay, deliberate definition reset, guarded
SQL recovery, and explicit publisher permission independent of administration.
The real browser is Chromium 158.0.8127.18 with a dedicated Worker, OPFS and
exclusive Web Locks. Hosted signed HTML/JavaScript publication, retry identity
and restart survive, while ordinary database bodies, private content and live
signals are filtered at both client and server ingress.

Deployed authentication, Internet/home/mobile/restrictive network and TURN
conditions, sustained suspension/quota pressure, browser SQL/WASM equivalence,
provider/device costs and a production recovery envelope remain unqualified.
### Fresh independent agent exercise

A new agent with no prior exercise context completed the supplied-enrollment
business workflow in 23 public requests. Its recorded interval was
16:30:13–16:31:55 UTC, 102 seconds; it first observed an accepted applied result
49 seconds after starting. The [raw transcript](evidence/2026-11-17-fresh-agent-f5e01684-report.json),
[independent review](evidence/2026-11-17-fresh-agent-f5e01684-review.json) and
[transcript cross-check](evidence/2026-11-17-fresh-agent-f5e01684-validation.json)
are retained separately from the scripted five-gate composition.

The agent used only the installed public README, the documented business task,
and returned tool schemas/results. It wrote no product or fixture code, created
no extra infrastructure, reported no recovery mistakes, and needed no follow-up
coaching. It inspected the uncertain original as `needsReapply` with
`previous: null`, observed the real reset and `unknownLoss: true` notice, and
deliberately reapplied the message under a new linked identity. It confirmed
the other author's task remained locked, claimed/completed its own review using
fresh captured query guards, and inspected, waited for and exactly retried the
same accepted finish identity after device reopen. The original uncertain
message is not counted as an observed accepted result.

The maintained harness's completion assertions passed; an independent check of
the raw transcript also verified all five query guards, linked reapplication,
the rejected wrong-author command, retained device/store identities, exact
finish retry and final business state. There is no separate maintained agent
report-validator executable, so the cross-check does not claim to be one.

This study uses clean runtime `f5e01684`, clean consumer `80997ea`, and the local
SQL archive `bf35d116...` described above. Installation, enrollment, the task
definition, native SQL engine and transport delivery were supplied. The result
qualifies independent public business-tool use within that scope; it does not
establish independently configured deployment, qualify later runtime changes,
or replace the distinct CI SQL binary in the composition manifest.

## Earlier completed CI composition checkpoint: `10f53f11`

All five independent public-package gates, the strict composition assembler,
and artifact upload passed in
[core CI run 44123123517](https://github.com/werg/chronolog-db/actions/runs/44123123517).
The exact emitted [composition](evidence/2026-11-17-ci-composition-10f53f11/composition.json)
and [origin record](evidence/2026-11-17-ci-composition-10f53f11/origin.json)
are retained with the raw reports and package provenance:

| Gate | Exact passing raw report |
| --- | --- |
| Native events | [Direct](evidence/2026-11-17-ci-composition-10f53f11/direct/report.json) |
| Native RTC | [Native RTC](evidence/2026-11-17-ci-composition-10f53f11/native-rtc/report.json) |
| Browser Worker | [Chromium/OPFS](evidence/2026-11-17-ci-composition-10f53f11/browser/report.json) |
| Native SQL | [Guarded tasks](evidence/2026-11-17-ci-composition-10f53f11/native-sql/report.json), [public archive boundary](evidence/2026-11-17-ci-composition-10f53f11/native-sql/public-boundary-report.json) |
| Hosted participant | [Actual workerd/native RTC](evidence/2026-11-17-ci-composition-10f53f11/hosted/report.json) |

The workflow head is Chronolog
`c4e4b72e59f62395473991de1788d1eee1aea50f`. Its actual clean pull-request
checkout and packed source is `10f53f11fdd78452bed473f2921499a2dde706cf`.
Both commits have exactly the same tree,
`388b8e09a9de77f74cd098eb64057e91bc0fd42d`; the merge identity is retained
instead of relabeling its artifacts. Every report uses clean contrib
`564f257aafeaaf4a86e457408000f4241f9e5dbb`, tree
`223308b7dd70ac3e305ab0e6a9665cafef8b4164`, and the hosted lane uses clean
Tendriller `56f758ce9a0b5556e61462b4444995147d1b4533`, tree
`38b20056517d12eb2a12fd84e4971d77ba2ad0b3`.

The downloaded CI artifact is `application-44123123517-1`, ID `14345493696`.
Its 417,599 bytes match GitHub's advertised ZIP SHA-256,
`9108064d2d4a3f64e41842774c48ae952bef685a43047cd5bc2ff46ad97e0f42`.
The unchanged `564f257a` validators reproduce all five checked summaries and
the emitted composition exactly. The composition SHA-256 is
`02b2e0e316635bda9f1c2b5e7a50ca3b0e5295ec3e9b29b66628a7cb4ebbcbe6`.
No synthetic result or modified assertion is substituted for a missing lane.

The [RTC provenance](evidence/2026-11-17-ci-composition-10f53f11/provenance/session-rtc.json)
and [SQL provenance](evidence/2026-11-17-ci-composition-10f53f11/provenance/session-sql.json)
match the installed-package digests recorded by the consumers. The downloaded
RTC archive and all 99 named packed-file digests were independently verified.
The ZIP retains SQL provenance and passing reports, but does not contain the
SQL archive; its archive/content verification was performed in CI. The
[host provenance](evidence/2026-11-17-ci-composition-10f53f11/provenance/host.json)
and [installed host evidence](evidence/2026-11-17-ci-composition-10f53f11/hosted/artifacts.json)
bind the actual public packages, schema revision and embedded verifier.

The events lanes each retain the declared 32-command, 1,024-byte burst through
ordinary applied completion and one subsequent coverage observation. Their
complete host counters remain unchanged during the outage workload, and all
original-author outcomes survive the selected takeover:

| Exact CI workload | Prefix age at disconnect | Takeover readiness | Known lost commands |
| --- | --- | --- | --- |
| Direct events | 82.32 ms | 295.97 ms | 0 |
| Native RTC | 107.37 ms | 296.35 ms | 0 |
| Actual hosted participant | 120.44 ms | 366.71 ms | 0 |

These are separate bounded local runs, not a controlled transport-performance
comparison or a universal loss guarantee. Unknown freshness still requires
explicit approval. Chromium 158.0.8127.18 executes the actual dedicated Worker,
OPFS and exclusive Web Lock composition, including fresh replay and
graceful/abrupt reopen. SQL runs against the actual patched native engine;
code publication uses the filtered host participant and explicit publisher
permission.

The same workflow head also passed the
[quality verification job](https://github.com/werg/chronolog-db/actions/runs/44123123740/job/134179586200):
524 tests passed, 6 WASM tests were skipped in that ordinary suite, and 62 files
passed with 1 skipped. Coverage was 91.60% statements and 85.64% branches.
The complete [quality workflow](https://github.com/werg/chronolog-db/actions/runs/44123123740)
also passed Linux and macOS conformance and the portable digest comparison.
The separate [native/WASM run](https://github.com/werg/chronolog-db/actions/runs/44123123484)
passed all 6 actual comparisons; ordinary-suite skips do not supply equivalence
evidence.

Later contrib commit `adc477e7` adds explicit inherited-ancestor recovery and
protected-prefix-floor scenarios. Those assertions are not part of the
`564f257a` fixture tested here and are qualified separately; this completed
checkpoint does not establish every later plan acceptance condition. The
unassisted fresh-agent setup and deployed network/cost boundaries below also
remain explicit.

The [supplemental failed baseline](evidence/2026-11-17-ancestor-baseline-10f53f11-report.json)
and its [process log](evidence/2026-11-17-ancestor-baseline-10f53f11-log.txt)
run clean `adc477e7a9b5770fc882a4ca2d2ccd96615a2a32` against the exact
downloaded `10f53f11` RTC archive named above. That run stops at the first
incomplete-prefix recovery check: it receives `PEER_RECOVERING` where the new
scenario requires `PEER_RECOVERY_PREFIX_INCOMPLETE`. The raw report records
`passed: false`. Its later inherited-ancestor and protected-floor assertions
were not reached, so this failed baseline is not presented as execution of
those subsequent cases. The later runtime correction and its passing
qualification require their own source-specific evidence.

## Earlier complete CI composition checkpoint: `ae9d95de`

All five independent public-package gates passed in
[GitHub Actions run 44121043353](https://github.com/werg/tendriller-contrib/actions/runs/44121043353).
The unchanged strict composition assembler then passed against those five raw
reports, downloaded from that one run with each GitHub artifact ZIP digest
verified. The exact [composition manifest](evidence/2026-11-17-ci-composition-ae9d95de/composition.json)
and [origin record](evidence/2026-11-17-ci-composition-ae9d95de/origin.json) retain
all package/content digests, source identities, runtime versions, report hashes,
artifact IDs and the limits of the result.

| Required gate | Retained passing raw report |
| --- | --- |
| Native events | [Direct report](evidence/2026-11-17-ci-composition-ae9d95de/direct/report.json) |
| Native RTC | [RTC report](evidence/2026-11-17-ci-composition-ae9d95de/native-rtc/report.json) |
| Browser Worker | [Browser report](evidence/2026-11-17-ci-composition-ae9d95de/browser/report.json) |
| Native SQL | [SQL report](evidence/2026-11-17-ci-composition-ae9d95de/native-sql/report.json) |
| Hosted participant | [Hosted report](evidence/2026-11-17-ci-composition-ae9d95de/hosted/report.json) |

The package source is Chronolog `ae9d95def049e309c53657944b3f8ad4a7fe4126`;
the host source is Tendriller `56f758ce9a0b5556e61462b4444995147d1b4533`.
The CI checkout is the clean contrib pull-request merge
`3b43d2109dfbfaa9de7a3ac5f38ccd42b4a75d2c`, tree
`09ff97b74f9e522fbb37ff159f02bf8ed337b96f`, which is identical to the
`a4a4cdff2903c7b06c32a0f6302f1b4663ba5be4` branch tree. These reports are not
mixed with the separate local attempts below. Chromium 158.0.8127.18 ran the
actual dedicated Worker with OPFS and exclusive Web Locks; page-owned private
keys remained zero, and graceful/abrupt Worker reopen retained device/store
identity and durable operations.

The remote aggregation job initially failed before invoking the validator
because its runner lacked `rg`. Reassembling the downloaded reports uses the
unchanged validator and all five exact reports; no claim is based on a modified
assertion or a synthetic browser. Workflow report discovery now uses standard
`find` with null-delimited paths, removing that incidental tool dependency.
The complete composition remains a local public-artifact qualification: deployed
authentication, real network/TURN conditions, sustained suspension/quota,
browser SQL/WASM, device/provider cost and an unassisted fresh-agent exercise
are explicitly unqualified. Later runtime changes need their own exact-source
qualification and do not inherit this checkpoint automatically.

## Supplemental local package checkpoint: `ae9d95de`

Four independent local lanes now pass with clean Chronolog source
`ae9d95def049e309c53657944b3f8ad4a7fe4126`, tree
`4928f8f8c1240a16a5ddc5b091f16bcfab79b7ef`, and clean contrib source
`6e6b3359d57e5cb8354ce97b79d34aa320b27019`, tree
`7c6a8fb7ae73537b88dc644746ab6cc9df933463`. This source includes the owned
projection API, explicit publisher permission and captured-view/range-storage
work. The actual hosted gate uses clean Tendriller
`56f758ce9a0b5556e61462b4444995147d1b4533`, tree
`38b20056517d12eb2a12fd84e4971d77ba2ad0b3`.

| Lane | Result | Exact retained evidence |
| --- | --- | --- |
| Direct events | Passed | [Raw report](evidence/2026-11-17-composition-direct-ae9d95de-report.json), [checked summary](evidence/2026-11-17-composition-direct-ae9d95de-summary.json) |
| Native RTC | Passed | [Raw report](evidence/2026-11-17-composition-rtc-ae9d95de-report.json), [checked summary](evidence/2026-11-17-composition-rtc-ae9d95de-summary.json) |
| Native SQL | Passed | [Raw report](evidence/2026-11-17-composition-sql-ae9d95de-report.json), [checked summary](evidence/2026-11-17-composition-sql-ae9d95de-summary.json) |
| Actual hosted participant | Passed | [Raw report](evidence/2026-11-17-composition-hosted-ae9d95de-report.json), [checked summary](evidence/2026-11-17-composition-hosted-ae9d95de-summary.json) |
| Local Chromium attempt | Blocked before application startup | [Raw failed report](evidence/2026-11-17-composition-browser-ae9d95de-blocked-report.json) |

The RTC archive SHA-256 is
`930e3726bbac2b6f742c0bd49101863c2917ac41b47ff0532e64ff5a94f20fe9`.
The SQL archive SHA-256 is
`d5043d3a46db642702432fadf097a3f14a2b06bee17251d8788da497f16257b3`;
the direct events lane uses that same archive without selecting its SQL engine.
The host SDK archive is
`613f87f98e0170a19f0c6874be00f01de87192b8c9f636c6c1222bf1b365fffe`;
the engine archive is
`263ea187057ae7f749cd2970e592225750eaa4286b859fb9e6cc4c36d66746a6`.
Installed content digests are verified and retained in the reports. The engine
records storage schema revision 9 and embeds the clean portable verifier at
`f62b8bdcc80918dbf7a1af376bc0450df8c590cb`, with its exact source tree and hashes.

The three events lanes exercise the same 32-command burst, with 1,024-byte text
per command, ordinary `applied()` completion and a single post-burst retention
observation from an independent store. They then remove the coordinator and
verify the selected successor retains every original-author operation.

| Observed workload | Burst apply time | Complete-prefix age at coordinator loss | Time to usable takeover | Known lost workload commands |
| --- | --- | --- | --- | --- |
| Direct events | 7,770.78 ms | 468.99 ms | 474.11 ms | 0 |
| Native RTC | 10,103.83 ms | 962.89 ms | 1,472.18 ms | 0 |
| Hosted controls with native RTC | 4,697.71 ms | 503.79 ms | 717.68 ms | 0 |

All three record zero host request growth during both the explicit two-command
outage scenario and the controller-owned 33-command outage window. The actual
host also records unchanged complete Worker HTTP, invitation, rendezvous and
body-byte counters. Required hosted application-body bytes remain zero.
The different timings are observations of separate local runs, not a controlled
performance comparison or a claim about production networks. The five-minute
target applies only to the declared workload; unknown freshness still requires
review and no universal loss bound is asserted.

The public projection gate moves from six old-branch messages to four selected
messages at recovery, emits an explicit reset, persists/reopens its checkpoint,
and invokes no reducer on unchanged reads or same-generation reopen. Changing
the reducer version triggers an explicit definition reset. The SQL gate recovers
from a seven-command head to a three-command prefix with coherent SQL/events,
original-author guards, deliberate reapplication and stable identity after
reopen. Neither projection callbacks nor applied events dispatch irreversible
external effects.

Hosted publication verifies an administrator **without** publisher permission
cannot release code, while the explicitly granted publisher can. The session
retains exact release identity across a lost persisted response; altered bytes,
stale selection and unauthorized publication fail. Served signed HTML/JavaScript
and the selected release survive Durable Object restart. Client filtering and
raw ingress both reject ordinary database, private-content and live-signal
updates; the host never obtains application reader authority from hosting code.

The local browser attempt used the same clean RTC package and clean contrib
`7ee29dbbaa78808422ccbbd23b086200944b4e17`. Package installation and public import
checks completed, then Chromium 156.0.8078.79 failed its process-singleton Unix
socket with `EPERM` before a page or Worker could run. That is preserved as a
failed attempt, not browser evidence. Earlier direct/RTC attempts at `7ee29db`
reached the new recovery workload but queried coordinator-authored operations
under the follower's default identity. The test correction in `6e6b335` supplies
the original author explicitly; all four successful runs above use that
committed correction and new output directories.

The strict five-gate composition assembler is wired into contrib CI. The
reported local checkpoint is Chronolog `ae9d95de` and Tendriller `56f758ce`;
the subsequent workflow pin selects core `28c74d6`, including the shared cursor
bound and Worker projection-handle lifetime fixes, for a new exact-source run.
The assembler revalidates raw evidence and refuses incomplete, dirty or
mixed-source compositions. No complete local
manifest is emitted because this environment could not run the browser gate.
The separate complete CI checkpoint above supplies its own browser lane and
all companion gates. Internet/TURN, deployed authentication, sustained
suspension/quota, browser SQL/WASM and provider/device cost remain separate
qualification boundaries.

## Earlier projection and measured-recovery checkpoint: `482c4a4c`

The combined source changes are qualified separately from the earlier
`08ee9f2a` evidence below. Four clean local lanes passed with Chronolog source
`482c4a4c079345d990bd4d97e42cb947dec6778a`, tree
`13887c218aa76862a41a8f4fe03584b39b41d4d5`, and isolated contrib source
`6e6b3359d57e5cb8354ce97b79d34aa320b27019`, tree
`7c6a8fb7ae73537b88dc644746ab6cc9df933463`.

| Lane | Preserved evidence | Newly exercised behavior |
| --- | --- | --- |
| Direct events | [Raw report](evidence/2026-11-17-combined-direct-482c4a4c-report.json), [checked summary](evidence/2026-11-17-combined-direct-482c4a4c-summary.json) | Owned projection reuse, selected-history reset, durable checkpoint reopen, definition-version reset, and the measured retained workload. |
| Native RTC | [Raw report](evidence/2026-11-17-combined-rtc-482c4a4c-report.json), [checked summary](evidence/2026-11-17-combined-rtc-482c4a4c-summary.json) | The same application/projection/recovery checks over real native ICE/DTLS/SCTP, with explicit loopback candidates. |
| Native SQL | [Raw report](evidence/2026-11-17-combined-sql-482c4a4c-report.json), [checked summary](evidence/2026-11-17-combined-sql-482c4a4c-summary.json) | Guarded claims and original-author rejection, coherent SQL/event recovery, deliberate reapplication, and identity-preserving durable reopen on the actual patched engine. |
| Actual hosted participant | [Raw report](evidence/2026-11-17-combined-hosted-482c4a4c-56f758ce-report.json), [checked summary](evidence/2026-11-17-combined-hosted-482c4a4c-56f758ce-summary.json) | Real workerd/HTTP/introductions/native RTC, signed code delivery, distinct publisher authorization, owned projections and the measured retained workload. |

The RTC archive SHA-256 is
`f69d7704e656f5986ce7dbbe03bb07ce9a5286f0bba1c29fc6736fa07136dd9f`.
The native SQL archive SHA-256 is
`d95fcac236368dd7228f65cb688de6ea9217f27c848df34dc7a14bb67076a83c`;
the direct events lane uses those same bytes without selecting SQL. Each report
also records and verifies the installed package provenance and content digests.

The direct, RTC and hosted events lanes submit 32 commands with 1,024-byte text payloads through
ordinary `applied()` completion while the host is blocked. A single coverage
wait after the burst observes another peer's signed retained receipt and
independent storage identity. After coordinator loss, the selected takeover
adopts that exact prefix and all 32 original-author outcomes remain accepted.
No per-command shared wait is added to the application path.

| Measured two-peer workload | Last-applied prefix age at disconnect | Takeover readiness after disconnect | Known lost workload commands |
| --- | --- | --- | --- |
| Direct events | 177.37 ms | 3,554.59 ms | 0 |
| Native RTC | 368.47 ms | 2,107.38 ms | 0 |
| Actual hosted participant | 8,073.64 ms | 10,089.85 ms | 0 |

All three runs honor the configured 150 ms reconnect grace and remain below the
300,000 ms target for this declared burst. These observations establish a
bounded local workload result, not a universal loss limit, a sustained workload
envelope, or a measurement of Internet/device availability. The cold-observer
case still requires explicit approval when freshness is unknown.

The hosted lane used clean Tendriller
`56f758ce9a0b5556e61462b4444995147d1b4533`, tree
`38b20056517d12eb2a12fd84e4971d77ba2ad0b3`. Its SDK archive SHA-256 is
`613f87f98e0170a19f0c6874be00f01de87192b8c9f636c6c1222bf1b365fffe`;
the engine archive SHA-256 is
`263ea187057ae7f749cd2970e592225750eaa4286b859fb9e6cc4c36d66746a6`.
The installed engine provenance binds storage schema revision 9 and the clean
embedded verifier `f62b8bdcc80918dbf7a1af376bc0450df8c590cb`, tree
`0ac0d4d1710c2d4e76a128ca9d328b7a37a41015`.

Actual code publication succeeds for the signed publisher and rejects the
administrator without a publisher grant. The publishing fixture device also
has administrator permission; this independent run does not itself test a
publisher-only device. It additionally checks exact publication retry after a
lost persisted reply, byte tampering, stale-head rejection, retained prior
assets, authored HTML and selected code surviving a host restart.

During the hosted controller workload, bridge requests stayed at 106 and body
bytes at 41,335; Worker HTTP requests stayed at 74 and body bytes at 33,006.
The complete invitation/rendezvous counters were unchanged, and required host
application-body bytes remained zero. Owned introduction listeners closed on
shutdown. The workerd run passed 1/1, with 81.86 s in the scenario and 99.66 s
total duration.

Real Chromium and the exact five-gate composition manifest remain pending for
this source pairing. The earlier all-green CI below is retained with its own
identities and does not qualify these newer sources.

## Earlier clean `08ee9f2a` runtime evidence

All four local lanes below used Chronolog source
`08ee9f2ab4a75f3b3396a9af2b420813e1d05f8c`, tree
`e57a4edb0df84ebfe69f70c3ba83b2e3878bed76`, and the isolated contrib checkout
`5512b5c6de3d02b1ee250f19c1349057f2a6d9bd`. Both source captures were clean.
The hosted lane additionally used clean Tendriller source
`bfe9daf89305fccc20ed008ce498f9746527e52e`, tree
`d10aee2484b791fbb09dc10cc3d26f0639ffa97a`.

| Lane | Preserved evidence | Observed boundary |
| --- | --- | --- |
| Portable peers | [Raw report](evidence/2026-11-17-owned-participation-portable-08ee9f2a-report.json), [checked summary](evidence/2026-11-17-owned-participation-portable-08ee9f2a-summary.json) | Independent native stores, real authenticated session behavior, in-process framed delivery and a portable control participant. |
| Native RTC | [Raw report](evidence/2026-11-17-owned-participation-rtc-08ee9f2a-report.json), [checked summary](evidence/2026-11-17-owned-participation-rtc-08ee9f2a-summary.json) | Real ICE/DTLS/SCTP with explicit loopback candidates and bounded test SDP delivery; the maintained session owns the connections and recovery. |
| Native SQL | [Raw report](evidence/2026-11-17-owned-participation-sql-08ee9f2a-report.json), [checked summary](evidence/2026-11-17-owned-participation-sql-08ee9f2a-summary.json) | Actual patched native engine through common `prepareSqlApplication`/`openSqlApplication`, transactional author guards, coherent SQL/events recovery and durable reopen. |
| Actual hosted participant | [Raw report](evidence/2026-11-17-owned-participation-hosted-08ee9f2a-report.json), [checked summary](evidence/2026-11-17-owned-participation-hosted-08ee9f2a-summary.json) | Installed public Tendriller SDK/engine in local workerd, synthetic authenticated accounts, real HTTP/invitation/rendezvous delivery, native RTC and served signed HTML/JavaScript. |

The raw reports record source trees, fixture digests, runtime versions,
dependency lock integrity and artifact hashes. Checked summaries hash their
exact raw inputs. The portable lane used the SQL-capable archive but opened the
same events application without selecting the optional SQL engine.

| Packed artifact | SHA-256 |
| --- | --- |
| Chronolog native RTC at `08ee9f2a` | `c645a2284ca96a23ae89689449d03b9ac1b8d7005426a5cd56c7bbc196b56b79` |
| Chronolog native SQL at `08ee9f2a` | `d691daa96083aaa6e286b474312b6530f6c715577baa337db32849745b0a6388` |
| Tendriller SDK at `bfe9daf8` | `77bd7daa69b7d45a3fffda747c34c5b6cf949b90b59efb01345eb8121aae4acd` |
| Tendriller engine at `bfe9daf8` | `62b05719bde82e1ddb5c85d985e2ac24a85ff53c1f7cbb6b62aa30f849415b99` |

The explicit transport-fault portion recovers the original saved operation after
a lost reply, applies two commands with the host blocked, recovers from sequence
6 through a complete prefix at 4, reconstructs a fresh peer, excludes a returning
branch across a third generation, links a reviewed reapplication and reopens the
original signing identity. Control attachment performs no I/O. A lost persisted
selection reply retries the identical signed request and returns its recorded
recovery notice.

The subsequent ordinary lifecycle uses `session.participate`. It establishes
authenticated connections, applies another host-independent command and waits
the configured 150 ms reconnect grace before an eligible automatic takeover.
Observed intervals were 1,050 ms in the portable run, 768 ms over native RTC and
1,242 ms with the actual host. Each run configured a 300,000 ms freshness budget;
those short local intervals do not establish a five-minute workload target.

A deliberately cold observer then receives verified history without a prior
coordinator-age observation. Its controller reports `freshness-unknown` with
`ageMs: null`, leaves authority unchanged until review, refuses an unrelated
proposal ID, and resumes work only after the displayed proposal is approved.
The evidence validator requires these observations and closed transport
ownership. Fault-delivery code supplies no freshness heuristic or recovery loop.

In the hosted controller workload, bridge requests stayed at 104 and bridge body
bytes at 40,840. Worker HTTP requests stayed at 72 and body bytes at 32,511;
all invitation/rendezvous counters were also unchanged. Required hosted
application-body bytes remained zero. The complete before/after objects are
preserved, including invitation listeners that were live during the workload
and then explicitly closed during owner shutdown. The workerd test passed 1/1,
with 73.64 s in the scenario and 79.24 s total test-run duration.

The same hosted run verifies actual authored HTML/JavaScript, signed publication
hashes, identity-preserving retry after a persisted reply is lost, rejection of
altered bytes, unauthorized authors and stale heads, retention of prior code,
and survival of the selected publication across host restart. Database,
content and live-signal updates are filtered before HTTP and independently
refused at raw host ingress.

## Earlier CI and browser checkpoint

The completed earlier CI source is Chronolog
`26958effbc40a4881db66e1bd879558d106a02d5`, with contrib runtime fixtures
`fdeac2da9d9893907c110efac8b0caa9c9c5279a` and Tendriller
`bfe9daf89305fccc20ed008ce498f9746527e52e`. The later core commits contain
documentation, CI pins and a handover-test readiness correction; the runtime
implementation is the one packed from `08ee9f2a` above. CI still built and tested
its own exact source artifacts; the local archives are not relabeled as CI builds.

| Earlier exact-source CI run | Result and scope |
| --- | --- |
| [Quality and conformance](https://github.com/werg/chronolog-db/actions/runs/44116962939) | Passed: 504 tests, 6 WASM tests skipped in the ordinary suite; 61 files passed and 1 skipped. Coverage was 91.46% statements and 85.37% branches. Build/artifact gates and Linux/macOS conformance/digest jobs passed. |
| [Dedicated native/WASM comparison](https://github.com/werg/chronolog-db/actions/runs/44116962911) | Passed: 6/6 actual native/WASM tests. The ordinary-suite skips are not used as equivalence evidence. |
| [Independent public consumers](https://github.com/werg/chronolog-db/actions/runs/44116962947) | Passed all four explicit steps: native RTC, guarded SQL, real Chromium and actual hosted participant. |

The final Chromium lane consumes the exact page assets including the shared
broader-recovery choice component. It exercises the public page facade, real
Worker-owned OPFS and RTC, second-owner/second-tab refusal, unsupported-storage
refusal, new-reader key enrollment, commands/signals/content with the host
blocked, fresh-peer replay, and graceful/abrupt Worker reopen. The page handles
RTC mechanics through `serveWorkerWebRtcConnections`; the Worker opens raw
connections through `openWorkerWebRtcConnection` and authenticates them through
its owned session.

Captured immutable views remain readable after a successor is selected. Using
an old-generation cursor on a newly captured current view requires an explicit
reset. The browser test checks those separate behaviors rather than treating an
old captured view as a mutable current view.

The approval component's focused tests separately verify unknown freshness,
exact proposal-ID submission, changed proposals during an outstanding approval,
visible rejection, and observer retirement on page shutdown. The browser lane
does not claim a deployed older-than-budget user study simply because that
component is present in the tested asset graph.

Earlier local Chromium attempts failed at its singleton socket before any page
ran, and the HTTP e2e runner failed before tests when Wrangler could not enumerate
network interfaces. Those were environment blocks, not passes. The later actual
Chromium CI above supplies browser execution evidence without rewriting those
earlier observations.

## Independent agent business workflow

The [independent review](evidence/2026-11-17-fresh-agent-review.md) and
[initial raw transcript](evidence/2026-11-17-fresh-agent-6bf1871c-report.json)
record a fresh agent using only packed public documentation/declarations and
the public JSON-lines tools. The initial successful study used clean Chronolog
`6bf1871c599ef924f60c48cf0909b15ba4914ba5` and clean contrib
`6cccfac57d16b79007e8ed1b34328b70e7263f53`.

The agent completed 24 public requests: discover the application, query a
coherent board, submit a revision-guarded message, inspect the uncertain original
as `needsReapply`, observe a recovery reset with a real `unknownLoss: true`
notice, deliberately create a linked replacement, observe a wrong-author SQL
rejection, claim and finish its own task, and inspect/wait/retry the same finished
identity after durable reopen. The final board retained one replacement message,
the completed owned task and the other author's still-open task. The fixture
elapsed time was 136.577 s; recorded tool-call time was 114.098 s.

The review preserves two startup failures before any application request: our
fixture initially named a non-exported transport helper, and the reviewer first
launched the corrected interactive process with closed non-PTY stdin. It records
the repairs, supplied command/cwd, business task and reserved operation IDs.
These are assistance and infrastructure observations, not evidence of
independent setup without coaching.

The [final-artifact repeat](evidence/2026-11-17-agent-repeat-08ee9f2a-report.json)
used clean `08ee9f2a`/`5512b5c6`, completed the same 24 requests, and took
123.920 s overall with 108.321 s in the recorded trace. Schemas matched the first
study. The reviewer explicitly labels this a learned-flow repeat rather than
another first-time usability study.

The fixture installed dependencies and supplied enrolled peers, the signed
definition/schema, authorized keys and a tool process. Therefore these studies
qualify the independent business workflow with provided enrollment. They do not
claim that a fresh agent independently installed, created/enrolled and deployed
the entire composition. Automated fresh-directory setup, actual-host tests and
browser ownership are separately exercised; the remaining fresh-agent setup
study is not erased by combining their results.

## Implementation-plan gates

| Plan gate | Implemented and observed | Remaining acceptance boundary |
| --- | --- | --- |
| G0 — Executable authenticated order and recovery | One public runtime executes signed selected order. The `2209cd27` composition verifies the common encrypted channel across RTC/WebSocket and complete inherited-ancestor recovery, exact saved selection retry, unchanged inherited operation identity and local/raw-host protected-floor rejection. Actual SQL checks original-signer authorization; core quality and dedicated native/WASM CI pass. | These exact-source results do not qualify arbitrary future engine artifacts or every deployed failure condition. |
| G1 — Remove hosted steady-state commands | The `2209cd27` direct gates pass host-blocked work. The host enforces its control participant facet policy. Native automatic WebSocket fallback and actual browser Worker relay gates pass with explicit positive relay byte traffic; control HTTP remains separate. | Deployed direct/WSS relay routes and provider traffic/cost require measurement. The direct zero-host-byte result does not apply to relay transit. |
| G2 — Recover with accepted recent loss | Explicit fault cases preserve adopted identities and inspectable excluded attempts across repeated generations. The maintained controller independently passes discovery, grace, automatic takeover and exact approval for unknown freshness. The `2209cd27` direct/RTC/hosted/relay lanes retain every command in the declared 32-command, 1,024-byte burst and recover below the five-minute target. Inherited recovery still refuses a prefix below a protected floor. | That bounded local workload does not qualify sustained workloads, device availability or the deployed network envelope. No universal maximum loss is claimed. |
| G3 — Independent developer/agent experience | Empty-directory consumers use public archives and one journal. The exact `2209cd27` SQL, host, direct Chromium and browser relay gates pass. The separately preserved earlier fresh-agent study completes its bounded public-tools business workflow, with a learned-flow repeat on its stated source checkpoint. | The agent received fixture-owned installation/enrollment. A fresh agent independently performing the full install/create-enroll/deployed-discovery setup remains unqualified; the earlier study is not relabeled as a fresh study on later artifacts. The recorded assistance must remain visible. |
| G4 — Real network, cost and operating envelope | Reports expose measured runtime, byte and source boundaries; cost calculations preserve unknown measurements. | Deployed login, home/mobile/restrictive networks, WSS relay fallback, suspension, churn, quota, large content, battery, backup and provider billing remain unqualified. |

## Public consumer and evidence boundary

Install the supplied public archive in a fresh directory with lifecycle scripts
disabled. Import only public entries. Fault injection may interrupt actual
transport/control boundaries, but commands, exact retry, coherent views,
participation and recovery must remain in the maintained session. A private core
fixture import, copied policy/RPC stack or second application queue does not
qualify an independent consumer.

The [runtime validator](../checks/peer-generation-report.mjs) and
[browser validator](../checks/peer-generation-browser-report.mjs) require the
recorded observations. Their synthetic tests establish rejection of incomplete
or contradictory evidence; they do not themselves prove runtime execution.
Each raw report keeps its own exact identity. A later commit is a new pairing,
and a configured workflow is not evidence that its jobs passed.

Measure recovery freshness under a named workload with another usable peer.
Report adopted-state age, known abandoned work and unknown loss separately.
A heartbeat cannot establish a universal maximum. Provider comparisons require
equivalent outcomes and stated retention/settlement guarantees; see
[measurement guidance](measuring-application-costs.md).

## Earlier source-specific evidence

The earlier clean `d70939f5` checkpoints remain available as
[native RTC](evidence/2026-11-17-common-session-native-d70939f5-report.json),
[native SQL](evidence/2026-11-17-common-session-sql-d70939f5-report.json), and
[hosted d709/fa2](evidence/2026-11-17-common-session-hosted-d70939f5-fa2eb612-report.json)
reports. They predate the maintained participation-controller qualification.
The [hosted095/d252 report](evidence/2026-11-17-common-session-hosted-095a04cf-d252a1e1-report.json)
preserves the earlier actual-host pairing separately.

The [dirty portable development report](evidence/2026-11-17-peer-generation-preview-report.json),
[partially dirty RTC report](evidence/2026-11-17-peer-generation-rtc-preview-report.json),
and [earlier clean RTC report](evidence/2026-11-17-peer-generation-rtc-clean-report.json)
retain their original provenance and limits. They neither qualify later sources
nor require preserving obsolete runtime code or compatibility paths.
