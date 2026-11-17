# Qualify the peer-generation composition independently

`peer-generation-v1` has a different order and recovery contract from the
historical resident/finalized recipes. Their reports remain valid for their
recorded revisions; they do not qualify this profile.

The [evidence validator](../checks/peer-generation-report.mjs) defines the
independent package gate. Its [small synthetic tests](../checks/peer-generation-report.test.mjs)
check whether incomplete or contradictory evidence is refused. Passing those
tests is not evidence that a peer session, browser, network or deployment ran.

## Structured release inventory

The [release qualification manifest](peer-generation-release-manifest.json)
records exact Chronolog, Tendriller and consumer commits/trees, clean-source
flags, archive hashes, native/WASM identities, storage formats and implemented
operating limits. It treats each runtime gate separately. Its current
`releaseReady: false` records unqualified deployed operating conditions. Complete
browser SQL recovery now has its own passing exact-source report; local runtime
results do not qualify deployed networks, provider cost or a recovery-age bound.

| Gate | Recorded result | Scope |
| --- | --- | --- |
| Core/session regression at `3187d9df` | Producer reported 149 passing tests; original log unavailable | Kept separate from independently preserved acceptance evidence. |
| Native/WASM conformance at `3187d9df` | Seven tests passed in the [preserved CI stage](evidence/2026-11-17-peer-native-wasm-3187d9df-stage.log) | Actual engine replay/recovery under Node. The overall job later failed at browser bundle isolation. |
| Browser events at `572fded7` | Passed | Actual Chromium, Worker/OPFS, RTC, content, selected-prefix recovery and reopen. |
| Workerd/native RTC at `572fded7` + Tendriller `2e8200a3` | Passed | Actual public host control/rendezvous routes and measured host-blocked commands. |
| Native task domain at `fe752b7f` | Passed | Real SQL/event guards, shared creator departure, recovery, linked reapply and reopen. |
| Fresh consumer at `fe752b7f` + Tendriller `2e8200a3` | Passed with recorded coaching | Independent domain source, canonical bootstrap and actual Worker controls; native stores use local direct transport. |
| Complete browser SQL at `76129c3c` + consumer `1a63e2a` | Passed | Actual guarded forms, same-view claim race, host-blocked work, partial-content restart, earlier-prefix recovery, fresh replay and graceful/abrupt Worker reopen. |
| Deployed networks, TURN, cost and five-minute freshness | Not executed/measured | No release-wide green status is inferred. |

## Fresh public-API exercise

A fresh agent received only the packed public artifacts, their public docs and
an empty authenticated local host fixture. It authored its own guarded task
definition and workflow without reading the implementation, core fixtures or
this cookbook's other consumers. The
[complete independent exercise](../checks/fresh-peer-task/README.md),
[DX record](../checks/fresh-peer-task/DX-RECORD.md),
[raw successful run](../checks/fresh-peer-task/evidence/run-3.jsonl) and
[summary](../checks/fresh-peer-task/evidence/summary.json) are preserved with the
failed attempts and exact artifact hashes.

The full run used clean Chronolog `fe752b7f`, clean Tendriller `2e8200a3`, and the
clean fixture/consumer checkpoint `6fcd9bf`. Its three independent native stores
ran in one process through public `connectApplications`; actual compact control
HTTP ran through the packed Tendriller Worker. It published and discovered its
schema, rejected a stale SQL guard without partial rows/events, retried an exact
saved attempt after cancelling a result observation, and recovered prefix 3
from previous head 4 after closing the original coordinator. Another author
inspected the abandoned signed attempt and deliberately reapplied it with a new
identity and link. The same selected SQL view and both applied/abandoned outcomes
survived reopening the original device, with zero hosted requests during reopen.

The final process reached its first useful command in **7.455 seconds** and
finished in **21.209 seconds**. The earliest useful command in the preceding run
occurred after **5.709 process seconds**, **17 minutes 32.247 seconds** from the
study start. Total study-to-green time was **23 minutes 8.773 seconds**, including
reading, infrastructure and correction. These are different measurements.

The record identifies one SQL ownership API coaching intervention, one explicit
local-transport scope direction and one environment intervention: the isolated
command processes required the consumer and host to share one command network
namespace. The agent independently corrected its own order-sensitive JSON
fingerprint assertion. Full signed-object equality across two stores and a
zero-fetch cached-reopen continuation established that no operation changed.
The failed run is retained as failed. This is a coached public-API usability
exercise, not an unaided pass, physical wire-loss test or browser/network gate.

## Implemented operating limits

The current profile retains at most **4,096 ordered records** and **64 MiB of
serialized history**, including retained abandoned work. Limits fail explicitly;
they do not silently delete a required recovery prefix. Network history travels
in bounded pages of at most 32 commands within 1 MiB frames. The owned session
permits eight held coherent read views; the page facade permits 64 pending calls
and 16 pulled streams. Read views and streams must be released when no longer
needed.

Content uses encrypted 64 KiB chunks and an implemented 128 MiB object ceiling.
The preserved browser run measured 32,768-byte and 131,095-byte objects, including
partial transfer and reopen. It did not qualify operation at the ceiling.
Native storage defaults to a 256 MiB byte-store quota and exclusive SQLite
WAL/FULL ownership. Browser identity/history storage uses one Worker with OPFS
and an exclusive Web Lock; SQL adds its verified engine pool. Exact record formats
and engine hashes are in the manifest. These are prerelease formats with no
migration or compatibility promise.

## Preserved development run

The [2026-11-17 development report](evidence/2026-11-17-peer-generation-preview-report.json)
and its [checked summary](evidence/2026-11-17-peer-generation-preview-summary.json)
record a successful independent native/events execution using the packed public
session. They cover exact retry after a lost reply, two commands with the portable
control port blocked, recovery from sequence 6 to a retained prefix at sequence 4,
a fresh peer replay, returning old-branch isolation, deliberate linked reapplication,
a third-generation ancestry check, and reopening the same durable device.

Both source checkouts were dirty in that run. Its package archive SHA-256 is
`f8dffca220e8b0aaa57e0e3e616cda48ab7cd2922fada6750afbbcf89c3c49c1`.
This preserves the observed development result; it does not qualify a clean
release artifact, actual HTTP control routes, physical WebRTC, browser storage,
deployed networks, or a recovery-age bound. Those scopes need their own execution.

The `Independent peer-generation consumer` workflow builds an exact pinned
Chronolog source revision and runs the same isolated public consumer through both
direct session links and the maintained native RTC composition. A manual run can
select another exact source revision.
It uploads its artifact, provenance, raw report and checked summary even when a
later assertion fails. Its existence is not a claim that CI has run.

## Preserved native RTC development run

The [native RTC report](evidence/2026-11-17-peer-generation-rtc-preview-report.json)
and [checked summary](evidence/2026-11-17-peer-generation-rtc-preview-summary.json)
record the full recovery scenario on four actual authenticated ICE/DTLS/SCTP
connections. The package came from clean Chronolog
`5fbc7b182e461e12100c8bc339c5f9f2431bdeb6`; its archive SHA-256 is
`6e1d65697dd7ab17419f9cc03982fc43d3c4ee73a2f0adafb0eeaa82681837af`.
The consumer recorded its uncommitted explicit-loopback fixture change as dirty.

Two commands completed while the portable control boundary was blocked. Reliable
application-frame traffic increased by 32,009 logical bytes; the retired
introduction stayed at two SDP descriptions and 1,137 bytes. Live typing arrived
without appending history. The run retained the lost-reply operation, recovered
sequence 6 to prefix 4, replayed on a fresh peer, preserved abandoned evidence,
linked a deliberate reapplication, rejected ancestor-tail resurrection in the
third generation, and reopened the original durable identity.

Each observed route selected host candidates. The fixture explicitly supplies
loopback candidates and disables interface enumeration through public native
options. It does not exercise network-interface discovery, Internet reachability,
TURN, browser ownership, Tendriller HTTP, deployed login or provider billing.
The byte boundary excludes RTC/SCTP/DTLS/IP overhead. This development report is
preserved separately from later clean-consumer or hosted/browser qualification.

## Clean native RTC pairing

The [clean-consumer report](evidence/2026-11-17-peer-generation-rtc-clean-report.json)
and [checked summary](evidence/2026-11-17-peer-generation-rtc-clean-summary.json)
repeat the complete native RTC scenario with both source checkouts clean:

- Chronolog: `784414c95e77f797083866f9c314c1ecd4183661`.
- Consumer: `8d308a6e5cfb12de4fe3eb6d7da6c2132407a039`.
- Session archive SHA-256: `79ab3c6ead93e539e90940fe13d74968a0173156e2d9ee1d7afe83f641b0b89c`.

That workflow run pinned the exact Chronolog source. The run verifies
native SQLite ownership, real loopback RTC, exact operation retry, selected-prefix
recovery and old-branch exclusion. Its portable-control boundary does not qualify
Tendriller HTTP or browser Worker ownership; those remain separate gates.

## Clean browser, Worker and OPFS pairing

The [unaltered browser report](evidence/2026-11-17-peer-generation-browser-clean-report.json)
and [checked summary](evidence/2026-11-17-peer-generation-browser-clean-summary.json)
come from the passing [independent workflow 44091858762](https://github.com/werg/tendriller-contrib/actions/runs/44091858762).
Its direct, native RTC and browser/native jobs all passed. This browser evidence
uses Chromium **158.0.8127.18**, four authenticated RTC connections, an owning
dedicated Worker and real OPFS storage with exclusive Web Locks.

| Input | Exact identity |
| --- | --- |
| Chronolog source | `572fded79a41d5aeda670d60f0e022d08b85c51a` |
| Chronolog tree | `aca326927f169c972f1af9a1581367e65fa8b5a6` |
| Public session archive SHA-256 | `0c40d7ecf5c010fcbc8014d5bfd135bf7018f2c2d30d7ad4161bd962dd46cb71` |
| Authored consumer | `004b8b26731c6fbe4f872e05ed074319f2467986` |
| Tested clean PR merge | `8d390fc5ae43175e201c46bdae2a1547c6a7ae86` |
| Tested consumer tree | `fd5ae204e03f09088de97d40e8143a49b42878f6` |
| Downloaded CI artifact | `14331178863`, 160,556 bytes |
| Downloaded ZIP SHA-256 | `5fe4c8dfbc2b4fa997bcf36a937df0719c8bbe4a39af0587ab74df00e75150e4` |
| Raw report SHA-256 | `d998f3e7b004167ca775cb1fd8866e071c545459660d716f7a7836fa99252c73` |

Both sources were clean. The downloaded ZIP digest was checked before extraction;
the report and summary are copied without modification. They retain dependency
integrities, fixture and bundled asset hashes, public import boundaries and
each connection's observed route.

The browser began without application keys and enrolled directly from a granted
peer. It refused a second Worker, a second tab, a page-owned storage attempt and
the fixture's deliberately unavailable OPFS capability. Cancelling an operation
wait preserved the saved attempt; reconnect applied that exact attempt. The
actual board and compact pages sent domain commands, retained an unsent draft
through page replacement, and exposed abandoned intent for confirmed reapplication.

While control HTTP was blocked, two commands applied, live typing arrived and
the browser retained and verified a 32,768-byte encrypted attachment. Control
requests stayed at **1**, signaling requests at **6**, and their request-body
counters stayed at **0** and **1,192 bytes** respectively. Logical authenticated
reliable traffic increased from **41,965 to 156,313 bytes**; the retired SDP
introduction stayed at two descriptions and 1,103 bytes. Live/content transfer
did not append application history. These are logical frame counts, excluding
RTC/SCTP/DTLS/IP overhead.

A separate 131,095-byte attachment was interrupted after 65,536 bytes. The partial
cache survived Worker replacement, refused a full-retention receipt and refused
an unavailable byte. Reconnection completed the content and produced a signed
retention receipt. The originating peer was then closed and its store removed
from usable recovery sources. The browser selected retained prefix **4** from
prior head **6**, exposed `needsReapply`, preserved the old captured view and
rejected its cursor against a new-generation view with `RecoveredViewError`.
Confirmed reapplication created a new operation linked to the old signed attempt.
A fresh keyless native peer enrolled from that browser and produced the same
selected-state digest. Graceful and abrupt Worker reopen retained device identity,
storage identity, keys, state and the observed durable operation.

This gate uses the events profile and a measured portable registry over loopback
HTTP. It does not claim actual Tendriller control routes, SQL, deployed login,
Internet routes, TURN, quota pressure, eviction, or interrupted-write crash
safety. Abrupt Worker termination occurred after an observed durable apply.
The [earlier blocked browser attempt](peer-browser-runtime-status.md) remains
unchanged at its original source and is not relabeled as a passing run.

## Clean Tendriller workerd and native RTC pairing

The [unaltered hosted report](evidence/2026-11-17-peer-generation-host-clean-report.json)
and [checked summary](evidence/2026-11-17-peer-generation-host-clean-summary.json)
record a separate passing actual-host execution. The test installed the public
Tendriller SDK and engine archives into an isolated workerd pool, used their
public testing surface with synthetic authenticated accounts, and introduced
four actual native RTC sessions through Tendriller's rendezvous routes. The
application imported only the packed public session; no sibling source or host
internals were used.

| Input | Exact identity |
| --- | --- |
| Consumer source | `004b8b26731c6fbe4f872e05ed074319f2467986` |
| Chronolog source | `572fded79a41d5aeda670d60f0e022d08b85c51a` |
| Session archive SHA-256 | `9dbcf32ba7ef88cdcf8c9f8aa1efad5e40b5395edcf783c15cf06a779eac8dde` |
| Tendriller source | `2e8200a33a47da4029a96b3699e23d2b1441f823` |
| SDK archive SHA-256 | `71cc9b1c32f34531a650e3eeb04eeec15158106c7187c01f601d72177f5d6614` |
| Engine archive SHA-256 | `05d6444114c2fdbef5dca5f8070c21d94c4407004854dca3e45a2ccc2f1f5468` |
| Raw report SHA-256 | `07667378f7704291f5b68c05d109ec03cd0cb99f2823815986c652f468b6b3c3` |

All three source identities were clean. The host supplied the immutable public
application definition and signed authority, and authenticated generation
selection. The native peers preserved the exact lost-reply operation, applied
two more commands while the host probe was blocked, and exchanged a live signal.

| Measured boundary during those commands | Before | After |
| --- | ---: | ---: |
| Test bridge requests | 19 | 19 |
| Test bridge request-body bytes | 5,061 | 5,061 |
| Actual Worker HTTP requests | 8 | 8 |
| Actual Worker request-body bytes | 2,117 | 2,117 |
| Rendezvous upgrades | 4 | 4 |
| Rendezvous sent / received bytes | 2,860 / 3,486 | 2,860 / 3,486 |
| Hosted application-body bytes | 0 | 0 |
| Authenticated reliable frame bytes | 24,027 | 60,762 |

Signaling retired before the ordinary workload. Each observed connection used
direct loopback host candidates. After removing the originating peer and its
store from usable sources, a survivor selected prefix **4** from prior head
**6**. A fresh peer reconstructed the same state; the returning old peer retained
its excluded evidence without replacing selected state. Deliberate reapplication
used a new linked attempt, a third generation did not resurrect the abandoned
suffix, and reopening retained the original device and operation state.

This proves the named workerd control/rendezvous routes with native loopback
peers. The bridge is test infrastructure, account authentication is synthetic,
and the scenario explicitly controls introductions and recovery faults. It does
not qualify deployed login, managed discovery/invitation lifecycle against a
deployed host, browser/Tendriller composition, Internet or TURN routes, provider
billing, or a five-minute loss bound. The browser pairing above has its own
separate portable-control boundary and archive hash.

## Public consumer boundary

The runtime consumer must install an explicitly supplied `@chronolog/peer-session`
archive in a new directory with a fresh offline package cache and lifecycle
scripts disabled. It imports only the public package and native entry. A fixture
may inject faults into its transport/control boundary, but the application uses
the maintained session for commands, exact retry, views and recovery. It may not
import core test fixtures, copy RPC/RTC lifecycle code or introduce another outbox.

Record archive SHA-256, package version, exact source commit/tree and observed
source cleanliness. The report names the consumer commit/tree separately. A
branch name is not an immutable source identity, and a clean consumer cannot
make a dirty package source clean.

## Required runtime observations

| Scenario | Required observation |
| --- | --- |
| Current-generation host outage | A real host probe fails while ordinary commands complete. Complete request counters stay unchanged; hosted application bodies remain zero. |
| Lost reply after persistence | The original operation, ordered receipt and record count survive exact retry. |
| Coordinator loss | Remove its process/store from usable recovery sources. Another peer adopts a complete earlier prefix. |
| Coherent recovery | SQL/events/outcomes switch together; a fresh peer reconstructs the same selected state. |
| Retained and abandoned work | Adopted operations keep their identities; the excluded suffix keeps its signed evidence and is visibly abandoned. |
| Returning old coordinator | Its old branch cannot replace selected state or admit old attempts into the successor. |
| Later takeover | A third generation cannot resurrect a suffix excluded by an earlier transition. |
| Deliberate reapplication | A new operation and attempt link the abandoned original and check current domain guards. |
| Reopen | The public native constructor reuses the stored signing identity and original operation state. |

The report format is `peer-generation-consumer/v1`. Its topology is
`independent-packed-peers`, explicitly an independent package/runtime exercise.
It does not imply physical RTC, browser storage, real login or deployed discovery.
The checked summary preserves those limitations and hashes the raw input.

## Additional gates

The [native guarded-task qualification](peer-task-qualification.md) now records
an all-clean run of the actual cookbook SQL domain against Chronolog
`c685d393e900828278ca401285fded2c17ab1753`. Transactional claim guards, mixed
SQL/event recovery, shared ownership after the creator closes, and keyring-backed
reopening passed. Its direct transport is separate from the RTC observations.

The [additional clean hosted report](evidence/2026-11-17-peer-generation-host-c685d393-report.json)
and [validated summary](evidence/2026-11-17-peer-generation-host-c685d393-summary.json)
pair that same Chronolog source with clean Tendriller
`e4939047ee1740fa494e51365af7e31d90c32f4c` and clean consumer
`004b8b26731c6fbe4f872e05ed074319f2467986`. The public archive includes both SQL
engines, but this hosted scenario uses the conversation events definition.
Actual workerd controls and rendezvous passed the full native RTC recovery gate,
including the roles assigned by the hosted rendezvous. The archive SHA-256 is
`231b25d53a7e4d7eb7d99b1f74d8233b9c4a24212dd00f326701598fa2417010`.
The exact host SDK/engine archive hashes and every installed dependency integrity
remain in the raw report. This additional result preserves the earlier pairings.

The portable authority/model gate must separately cover unauthorized recovery,
coordinator impersonation, missing bodies, continuity conflicts, restrictive
controls and protected floors. Production adapters must use that same verifier.

The browser/native gate must exercise real Worker ownership, second-tab behavior,
unsupported capabilities, interrupted transfer and authenticated RTC. The deployed
gate adds actual enrollment, home/mobile/restrictive networks, TURN, suspension,
quota pressure, large content and measured provider usage.

Measure the five-minute recovery-freshness objective under a named workload with
a second usable peer available. Report actual adopted-state age and unknown loss;
never turn an unmeasured heartbeat into a universal maximum. Compare provider cost
only for equivalent workloads with the different retention/finality guarantee
stated explicitly.

The clean browser pairing above supplies its explicitly named Worker, ownership,
content and recovery observations. Other scopes remain open until a preserved
runtime report and exact public artifact pairing support each claim. The
five-minute recovery-age objective is not measured by these short scenarios.
