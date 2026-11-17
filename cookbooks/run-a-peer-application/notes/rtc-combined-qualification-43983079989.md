# Combined RTC application and membership qualification

[Workflow 43983079989](https://github.com/werg/chronolog-db/actions/runs/43983079989)
completed successfully with all twelve application checks and all ten thin
membership checks at the same clean Chronolog source. The application continued
finalizing chat while its host listener was stopped. The membership scenario
enrolled fresh browser devices, exercised revocation and recovery, and delivered
zero detached application-envelope bytes to the Cloudflare administrator.

This record preserves that actual execution. It does not relabel the earlier
[closed-timestamp fixture failure](rtc-membership-qualification-43981821658.md)
as a pass. The accepted-case fixture's one-second admission-clock race remains
an identified issue in this source; a successful run does not prove that race
has been corrected. Later fixture or transport changes require their own source
pairing and qualification.

## Exact reports and provenance

- [Application/v2 raw report](evidence/2026-11-17-43983079989-application.json) and
  [strict validated summary](evidence/2026-11-17-43983079989-application-summary.json).
- [Thin membership/v2 raw report](evidence/2026-11-17-43983079989-membership.json) and
  [checked summary](evidence/2026-11-17-43983079989-membership-summary.json).

Both reports passed the existing validators without changes to acceptance
conditions. Additional checks required the same exact clean source, twelve and
ten completed checks respectively, and equality between the three browser
introduction body counts and the native aggregate counters. These checks
validate recorded observations; the linked workflow supplies the execution
evidence. The raw files are exact byte copies of the downloaded artifact.

| Item | Exact identity |
| --- | --- |
| Workflow and job | `43983079989` / `133705028714` |
| Authored Chronolog branch head | `264e753cfcd689a9572fb7f9a3aafb49e2e4bb5c` |
| Clean PR merge actually tested | `733f215893b30b0990d3f27e5df91b76a441a396` |
| Verified main parent | `abeb8f1aa8a2ab5f3331ef75aa0967c00cd099a6` |
| Clean contrib recipe checkout | `7291598b566090d7893a209075861d57c29b1217` |
| Clean Tendriller artifact source | `4d63f48c9a0f8e9765fe4d90541d67648fa20340` |
| Browser and native RTC implementation | Chromium `158.0.8127.18`; `werift@0.27.0` |
| Shared artifact | `14285306456`, `browser-peer-43983079989-1`, 367,257 bytes |
| Archive SHA-256 | `aeba5f1293ab5cf42a0c10caa6f7baf364afb5bf90f5ed6d270cefde04ea5c42` |
| Application report SHA-256 | `a0615e3bd59b6c92cacbdc6a18b234c2ee8290325b84a31ac2387a9c76d28552` |
| Membership report SHA-256 | `513810e209ec63684af2060ccc32636423ff5c8d90367fda3093e025fb40c5ec` |

The GitHub commit object confirms that the tested merge has the recorded main
and authored branch heads as its two parents. All recorded source checkouts are
clean. The archive size and SHA-256 and both raw report hashes were independently
checked. The application began at `2026-11-16T23:57:39.166Z`; membership began at
`2026-11-16T23:59:48.145Z` and completed after midnight. The evidence files are
dated when preserved, November 17 UTC. The raw reports and summaries retain the
exact public package, Worker, page, recipe and WASM digests.

## Task/chat application with the host stopped

The two independently keyed Chromium/OPFS Workers and native SQL/finality peer
used the packaged Tendriller rendezvous for explicitly coordinated introductions.
Both halves joined each attempt, and the host retired its signaling sockets.
Application history, detached bodies, finality and ephemeral typing then moved
over authenticated RTC. This scenario pregrants its browser identities; live
enrollment is exercised by the separate membership scenario below.

All twelve checks passed, including competing task claims, a rejected SQL guard,
one native effect dispatch, typing expiry, delayed-reply draft preservation,
Worker termination and durable reopen, warm operation with the host listener
stopped, and original-history recovery after a fresh RTC introduction.

| Application observation | Recorded result |
| --- | ---: |
| Host application requests / writes | 0 / 0 |
| Resident effect dispatches | 1 |
| Original signed records at each of three replicas | 19 |
| Final application order length at each replica | 18 |
| Host sockets during warm outage | 0 |
| Logical RTC bytes before / after the outage operation | 1,035,937 / 1,088,346 |
| Additional logical RTC bytes while host unavailable | 52,409 |
| Reconnection attachment time | 318.0 ms |
| Application string bytes fetched during catch-up | 786,432 bytes, or 768 KiB |
| Complete catch-up time | 38.313 seconds |
| Largest sampled native queued-byte observation | 198,250 bytes |

The host and browser signaling snapshots were exactly unchanged during the
outage operation, with the host marked unavailable. Both browser replicas and
the native peer retained the same signed-record and capability digests and the
same final order. The original accepted and rejected operation identities and
outcomes were unchanged after reconnect. The report contains no page errors or
failed RTC sessions. Catch-up timing includes verification and local replay;
queue observations are sampled and do not claim a worst-case memory bound.

## Fresh-device enrollment and recovery

The membership scenario used the packaged workerd administrator and a separate
native application peer. Browser Windows introduced themselves directly to the
native HTTP offer endpoint, then transferred untouched RTC channels to their
exclusive Workers. All ten checks passed: public artifact builds, independent
membership/application authority, workload byte separation, account-bound
approval and lost-reply recovery, fresh OPFS history retrieval, writer
revocation and exact retry, abrupt Worker replacement, future-key reader
revocation, durable administrator restart, and a newly keyed reader after that
restart while the removed account remained denied.

| Membership observation across the complete scenario | Recorded amount |
| --- | ---: |
| Native membership HTTP requests | 37 |
| Membership request / response body bytes | 23,011 / 148,998 |
| Application-envelope bytes delivered to administrator | 0 |
| Unexpected administrator application requests | 0 |
| Native inbound / outbound logical peer-frame bytes | 524,375 / 2,998,808 |
| Direct RTC introductions | 3 |
| Complete SDP descriptions / SDP UTF-8 bytes | 6 / 3,463 |
| Introduction JSON request / response body bytes | 2,089 / 2,043 |

The three introductions cover initial enrollment, reconnect after writer
revocation and the newly keyed reader after administrator restart. Each used
one POST and closed its signaling resources. Worker replacement separately
reopened local OPFS history without adding an introduction. Attachment took
299, 273 and 288 ms; explicit first-device and new-reader history sync took
11.619 and 23.304 seconds. The completed phase was recorded 183.880 seconds
after the runner's timing origin, within the 420-second scenario budget.

The native snapshot retains `accepted: 3`, `pending: 0`, `active: 1` before
teardown, and `failed: 2`. This report provides no terminal-error attribution for
the latter counter. The pass covers the ten named assertions and does not
establish an error-free connection lifecycle.

## Boundaries and remaining qualification

The paired reports establish the intended application/administrator separation
on loopback with actual Chromium, OPFS, workerd and native RTC. The membership
administrator still obtains and checks descriptor/control history during
participant operations; this is not sparse-proof verification or a claim of
constant membership cost. The application fixture's coordinated rendezvous is
distinct from the cold resident HTTPS path; the latter has its own
[browser and exact native-task evidence](rtc-application-qualification-2026-11-16.md#later-public-direct-introduction-and-resident-lifecycle).

Peer byte counters measure logical authenticated frame payloads, excluding
framing headers, credit messages and SCTP/DTLS/IP overhead. HTTP JSON bodies and
SDP text have separate counters, and descriptor/control counters overlap their
containing HTTP bodies. These numbers are not provider billing. Synthetic
authenticated accounts, loopback networking and generated TLS remain declared
fixture boundaries; deployed authentication, public NAT/TURN reachability,
physical device suspension and independent storage durability remain in the
[deployment handoff](deployment-qualification-handoff.md).
