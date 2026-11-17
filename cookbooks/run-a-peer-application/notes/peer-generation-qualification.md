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

## Current exact package checkpoint: `ae9d95de`

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
A successful exact-source CI browser lane and all its companion gates are
required for that manifest. Internet/TURN, deployed authentication, sustained
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
| G0 — Executable authenticated order and recovery | One public runtime executes signed selected order. Shared verification fences grants, excluded ancestry and recovery floors; actual SQL checks original-signer authorization. Core security/quality and dedicated native/WASM CI pass. | These exact-source results do not qualify arbitrary future engine artifacts or every deployed failure condition. |
| G1 — Remove hosted steady-state commands | Native, actual workerd/native RTC and real Chromium gates pass host-blocked work. The host enforces its participant facet policy; required ordinary application-body bytes stay off its transport. | Deployed routes, TURN and provider traffic/cost require direct measurement. |
| G2 — Recover with accepted recent loss | Explicit fault cases preserve adopted identities and inspectable excluded attempts across repeated generations. The maintained controller independently passes discovery, grace, automatic takeover and exact approval for unknown freshness. The `482c4a4c` direct/RTC lanes measure a 32-command, 1,024-byte two-peer burst, retain all its accepted commands, and recover below the five-minute target. | That bounded local workload does not qualify sustained workloads, device availability or the deployed network envelope. No universal maximum loss is claimed. |
| G3 — Independent developer/agent experience | Empty-directory consumers use public archives and one journal. Actual SQL, host and Chromium gates pass. A fresh agent completes the bounded public-tools business workflow and a final-artifact repeat preserves its results. | The agent received fixture-owned installation/enrollment. A fresh agent independently performing the full install/create-enroll/deployed-discovery setup remains unqualified. The recorded assistance must remain visible. |
| G4 — Real network, cost and operating envelope | Reports expose measured runtime, byte and source boundaries; cost calculations preserve unknown measurements. | Deployed login, home/mobile/restrictive networks, TURN, suspension, churn, quota, large content, battery, backup and provider billing remain unqualified. |

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
