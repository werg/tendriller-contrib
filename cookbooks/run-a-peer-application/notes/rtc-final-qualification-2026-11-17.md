# Final RTC qualification at `84e22999`

The final authored Chronolog revision passed the full application/membership
workflow, browser/native WebRTC and native HTTPS resident gates, quality suite,
and container chaos suite. All four preserved runtime reports identify the same
clean tested PR merge. This is the qualification after the application fixture's
admission-clock correction; earlier reports retain their original scope.

## Exact source and reports

| Source | Recorded identity |
| --- | --- |
| Authored Chronolog branch head | `84e229991657a577257dcee91906227b87f98bdd` |
| Clean PR merge actually tested | `e866e1176a000b1a67bc4a4aff758af37c1fecd3` |
| Verified main parent | `abeb8f1aa8a2ab5f3331ef75aa0967c00cd099a6` |
| Clean contrib recipe checkout | `7291598b566090d7893a209075861d57c29b1217` |
| Clean Tendriller artifact source | `4d63f48c9a0f8e9765fe4d90541d67648fa20340` |
| Browser and native runtime | Chromium `158.0.8127.18`; Node `v24.22.2`; `werift@0.27.0` |

GitHub's commit object confirms the tested merge's two parents are the recorded
main and authored branch heads. Exact public package, recipe, Worker, page and
WASM hashes remain in the raw reports and summaries:

- Application/v2: [raw](evidence/2026-11-17-43985189434-application.json),
  [strict summary](evidence/2026-11-17-43985189434-application-summary.json).
- Thin membership/v2: [raw](evidence/2026-11-17-43985189434-membership.json),
  [checked summary](evidence/2026-11-17-43985189434-membership-summary.json).
- Browser/native RTC/v1: [raw](evidence/2026-11-17-43985189674-webrtc.json),
  [strict summary](evidence/2026-11-17-43985189674-webrtc-summary.json).
- Native HTTPS resident/v1: [raw](evidence/2026-11-17-43985189674-resident-webrtc.json),
  [checked summary](evidence/2026-11-17-43985189674-resident-webrtc-summary.json).

The existing application, membership and WebRTC validators accepted these
reports without changes. The resident report passed the focused check of its
six expected scenarios, exact recipe identity, authorization, original final
outcome, signed records and unchanged introduction counters. Additional checks
verified all four source identities, membership introduction byte totals, and
all six application admission windows. Raw reports are exact copies; archive
sizes and hashes were checked independently. Report validation checks declared
observations, while the linked workflows supply execution provenance.

| Passed workflow | Job | Observed checks |
| --- | --- | --- |
| [Full browser qualification `43985189434`](https://github.com/werg/chronolog-db/actions/runs/43985189434) | `133716841310` | All stages passed, including 12 application checks, 10 membership checks and six native/WASM comparison cases. |
| [Direct RTC qualification `43985189674`](https://github.com/werg/chronolog-db/actions/runs/43985189674) | `133711511756` | 25 focused unit checks, five actual browser/native checks and six actual native HTTPS resident checks. |
| [Quality `43985189581`](https://github.com/werg/chronolog-db/actions/runs/43985189581) | `133711534533` | 907 tests passed; six WASM-only cases skipped here and exercised by the full workflow. Lint, documentation, types, coverage, native recovery, membership cost, build, Linux/macOS conformance and digest comparison passed. |
| [Container chaos `43985189443`](https://github.com/werg/chronolog-db/actions/runs/43985189443) | `133711538863` | Complete workflow passed. |

| Downloaded archive | Exact artifact and SHA-256 |
| --- | --- |
| Full browser evidence | `14286267325`, `browser-peer-43985189434-1`, 367,772 bytes; `d1b29eb4c4667fb6068e76f434241d93b41ca4c23c3a0a7cf5a19d9df6853c50` |
| Direct RTC evidence | `14285147660`, `webrtc-43985189674-1`, 10,234 bytes; `9225501b70a02aad70661379d1d7c6f2a41473dafb496ddbc6af2ff13c9bf490` |

| Preserved raw report | SHA-256 |
| --- | --- |
| Application | `03ea99945b77b06cf71cb7d6aff3703c5f43dadf5db2a3ee9e0e9800e6f3055f` |
| Membership | `66ae338f6b65d0ed5c9c7ac262a3bb6f5cdbed8e9f2af8cfc8c11372c9e73bf3` |
| Browser/native RTC | `d3054c9ca540393fc062b455a8d4c8ca3601bc16fc4684651ba14d7f58938f6c` |
| Native HTTPS resident | `db4d8b9142bbabc967dd6f609d6bcd4ad1ac5645e1cfd0cec0f9091f1480fe8a` |

## Application progress without host participation

Two independent Chromium/OPFS Workers and a native SQL/finality peer passed all
task/chat scenarios, including competing claims, rejected SQL guards, one
resident effect, ephemeral typing, delayed reply, abrupt Worker reopen and
reconnection with original history. The fixture uses the packaged Tendriller
rendezvous for explicit coordinated introductions and pregrants its identities.

| Application observation | Recorded result |
| --- | ---: |
| Host application requests / writes | 0 / 0 |
| Resident effect dispatches | 1 |
| Matching signed records / final order entries at all three replicas | 19 / 18 |
| Additional logical RTC bytes during host outage | 61,961 |
| Reconnection attachment | 330.7 ms |
| Application string bytes fetched after reconnect | 786,432 bytes, or 768 KiB |
| Complete verification and replay during catch-up | 44.963 seconds |
| Largest sampled native queued-byte observation | 198,250 bytes |

The host listener was stopped and its sockets retired. Host and browser
signaling snapshots stayed exactly unchanged while new chat finalized over RTC.
Signed-record and capability digests, final ordering, and the original accepted
and rejected operations matched after reconnect. No page or RTC-session failure
was reported by the application scenario.

The acceptance fixtures now hold the injected native finality clock until each
original proposal is included, then release it before final-outcome waits.
Browser timestamps and signed proposal identities remain unchanged. All six
recorded admission windows completed within their 25-second bound, taking
0.114–3.336 seconds. This separates the intended acceptance/recovery assertions
from the earlier one-second fixture race; it does not claim arbitrary offline
timestamps can be admitted after finality has closed them.

## Membership and direct resident connections

All ten live-enrollment checks passed, including account-bound approval,
lost-reply recovery with actual Durable Object eviction, fresh OPFS history,
writer and reader revocation, abrupt Worker recovery, administrator restart,
and a newly keyed reader while the removed account remained denied.

| Membership observation | Recorded result |
| --- | ---: |
| Application-envelope bytes delivered to administrator | 0 |
| Unexpected administrator application requests | 0 |
| Membership HTTP requests | 39 |
| Membership request / response body bytes | 23,847 / 153,878 |
| Native inbound / outbound logical peer-frame bytes | 545,604 / 3,220,891 |
| Direct introductions / complete SDP descriptions | 3 / 6 |
| Introduction request / response JSON body bytes | 2,091 / 2,043 |
| SDP UTF-8 bytes | 3,465 |

Each introduction made one POST and closed signaling. The initial device,
writer-revocation reconnect and new reader attached in 332, 278 and 304 ms.
Explicit first-device and new-reader replay took 13.320 and 26.930 seconds; the
scenario completed at 210.514 seconds. The native snapshot retains three
accepted connections and `failed: 2`, with zero pending and one active before
teardown. The report does not attribute those terminal errors; the ten passed
assertions do not establish an error-free connection lifecycle.

The separate direct browser/native gate transferred a 524,325-byte detached
body after closing its HTTP introduction listener, with 13,672 browser and
538,073 native logical payload bytes sent after closure, matching history and
payload hashes, and the original accepted retry without another authored
record. Its two SDP descriptions totaled 1,155 bytes. The exact native HTTPS
resident recipe passed admission/origin and missing-reader-grant refusal, one
cold authorized connection, original signed-history exchange without further
introduction, shutdown, immediate cancellation and occupied-port cleanup.

## Measurement scope

These results use actual Chromium, OPFS, workerd and native RTC on loopback with
synthetic host accounts. Peer counters measure logical authenticated frame
payloads, excluding framing headers, credits and SCTP/DTLS/IP overhead. HTTP
JSON bodies and SDP text are separate boundaries; queue peaks are sampled.
The administrator still checks descriptor/control history during participant
operations, so this is not sparse-proof verification or constant-cost
membership. Deployed authentication, public NAT/TURN reachability, physical
device suspension, independent storage durability and provider billing remain
the separate [deployment qualification](deployment-qualification-handoff.md).
