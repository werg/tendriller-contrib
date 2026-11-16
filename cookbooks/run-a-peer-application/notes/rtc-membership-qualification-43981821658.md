# Fresh-device membership over RTC

The thin membership/v2 scenario passed all ten checks in
[workflow 43981821658](https://github.com/werg/chronolog-db/actions/runs/43981821658).
It exercised actual Chromium/OPFS devices, the packaged Cloudflare administrator
inside workerd, and a separate native SQL/finality peer. Device history moved
through authenticated WebRTC. The administrator received zero detached
application-envelope bytes.

This is a passed membership scenario within a workflow whose application step
failed separately. The application failure was a correctly rejected
`FINALITY_TIMESTAMP_CLOSED` proposal in the delayed-reply fixture: its one-second
cutoff advanced before the intended browser message was included. That fixture
timing is being corrected and requires another complete application run. The
earlier [passed application and current quick gates](rtc-application-qualification-2026-11-16.md)
retain their own source pairings; this note does not claim one combined passing
workflow for all of them.

## Exact reports and provenance

- [Raw membership/v2 report](evidence/2026-11-16-43981821658-membership.json).
- [Checked membership summary](evidence/2026-11-16-43981821658-membership-summary.json).

The existing membership validator accepted the actual report without changing
its acceptance conditions. An additional check compared the three introduction
body counts with their aggregate native counters. The only validator edit in
this evidence checkpoint corrects the descriptive name of the second
introduction: it is a reconnect after writer revocation, not a new connection
during Worker replacement. The required count remains three.

| Item | Exact identity |
| --- | --- |
| Workflow and job | `43981821658` / `133700291664` |
| Authored Chronolog branch head | `c3a7fd40df93d4e17f614a0c9ffa57e1e5959b01` |
| Clean PR merge actually tested | `f58ace9850d9733f0e8ad2b2865285fab46a2c72` |
| Verified main parent | `abeb8f1aa8a2ab5f3331ef75aa0967c00cd099a6` |
| Clean Tendriller artifact source | `4d63f48c9a0f8e9765fe4d90541d67648fa20340` |
| Runtime | Chromium `158.0.8127.18`; native `werift@0.27.0` |
| Shared artifact | `14285215056`, `browser-peer-43981821658-1`, 339,628 bytes |
| Archive SHA-256 | `b18aa5fd583720b8d07e95d70c1e32ef5b5393be0ade594c5357633171a4f8a6` |
| Raw membership report SHA-256 | `70f8ddb5c8133f517bb6d2598259fc9081ab6bfdcfc89d44c88e56240e240133` |
| Public SDK archive SHA-256 | `b95aa9785c44a4c97e16a087d6761e294acc6ebe1ee8e406837a1248d2109f19` |
| Public engine archive SHA-256 | `0c260b5f5ebd6d76dd44b1c7d785a957d6514aa9dffaa70dd8bd122342b3f5b0` |
| Actual Worker bundle SHA-256 | `2bf9928d6424e76591b23fa90c4125f1d33c5371193bb0c19e31a3e3e1f4b238` |
| Actual page bundle SHA-256 | `3fd56ccc8e99834a2ed670e05703a4b1858f6843bf463f116f08062c532bfc5b` |

The tested merge's parents were verified through GitHub, including the recorded
branch head. Both source checkouts report `dirty: false`. The downloaded archive
size and digest were independently checked, and the raw report is an exact byte
copy. The summary records its raw hash, measured topology, all ten check names,
traffic, RTC snapshots and phase timings. It does not authenticate the report
by itself; execution provenance comes from the linked workflow and artifact.

## Exercised ownership and recovery

The host keeps its durable membership root and account-bound requests. It
contacts the native membership endpoint for signed descriptors, inline controls
and retained certificates. The native peer owns application SQL and the pinned
finality service. Its schema administrator is a group administrator; the
Cloudflare membership root is not an application group member.

For application exchange, the Window makes one direct offer/answer request to
the native resident and transfers the untouched channel to the exclusive Worker.
The Worker authenticates the peer and owns OPFS history, keys and replay.
Introduction admission does not replace the Chronolog reader grant.

| Completed check | Observed boundary |
| --- | --- |
| Independent public builds | Pinned SDK/engine and actual browser page/Worker artifacts. |
| Separate host administrator and native authority | Durable membership-only root; independent application schema and finality. |
| Small/large application workloads | Detached bodies remain on full peers while descriptor traffic tracks candidates. |
| Lost approval and host eviction | Account ownership stays bound; an exact approved decision survives a lost reply and actual Durable Object eviction. |
| First fresh OPFS device | Verifies approval and historical key controls, authenticates over RTC and retrieves detached history. |
| Writer revocation | A direct peer-path operation is rejected after writer revocation; an earlier accepted exact retry keeps its original proposal. |
| Abrupt Worker replacement | Reopens the same OPFS identity, grants and original accepted/rejected operations. |
| Reader revocation | Rotates the future epoch; the removed reader lacks the new key and cannot read the later event. |
| Administrator restart | Restores root, certified prefix, revoked roster, epoch decisions and exact action receipts; only new closure entries are permitted. |
| New reader after restart | A differently keyed, reader-only device receives historical epochs `0`, `1` and `2`, reaches ready, and reads the later event while the removed account stays denied. |

The three measured RTC introductions are initial enrollment, reconnect after
writer revocation, and the new reader after administrator restart. Each used
one POST and retired signaling. Worker replacement separately tested durable
local recovery; it did not introduce a fourth RTC connection.

## Measured traffic

| Boundary across the complete scenario | Recorded amount |
| --- | ---: |
| Native membership HTTP requests | 39 |
| Membership request-body bytes | 23,847 |
| Membership response-body bytes | 161,314 |
| Application-envelope bytes delivered to the administrator | 0 |
| Unexpected administrator application requests | 0 |
| Native inbound logical peer-frame bytes | 575,305 |
| Native outbound logical peer-frame bytes | 3,257,143 |
| Direct RTC introduction requests | 3 |
| Complete SDP descriptions | 6 |
| SDP UTF-8 bytes | 3,463 |
| Introduction JSON request-body bytes | 2,089 |
| Introduction JSON response-body bytes | 2,043 |

The three browser request bodies were 696, 696 and 697 bytes; each response body
was 681 bytes. They sum exactly to the native introduction counters. The native
snapshot records three accepted connections, zero pending connections and one
active connection before final teardown. It also records `failed: 2`. This
source report does not identify those terminal errors, so they remain recorded
without being relabeled as expected or as an error-free connection lifecycle.

The early workload comparison isolates application payload size from candidate
count:

| Workload | Candidate proposals | Encoded candidate descriptors | Detached application envelopes |
| --- | ---: | ---: | ---: |
| Small | 4 | 568 bytes | 2,668 bytes |
| Large | 4 | 576 bytes | 789,092 bytes |
| More small proposals | 8 | 1,136 bytes | 5,320 bytes |

The administrator still verifies descriptor/control history during participant
operations. This result demonstrates exclusion of detached application bodies,
not a sparse membership proof or constant cost as history and participant
counts grow. Candidate/control and closure byte counters overlap the enclosing
HTTP messages and must not be added again to estimate provider traffic.

## Timing and scope

Initial RTC attachment took 360 ms; reconnect after writer revocation took
292 ms; the later new reader's attachment took 312 ms. Explicit history sync
took 18.685 seconds for the first fresh device and 39.247 seconds for the later
reader. These sync calls include verification and local replay, not just network
transfer. The full recorded scenario reached its completed phase 268.381 seconds
after the runner's timing origin, within the 420-second aggregate budget. The
host-process watchdog was 540 seconds. Individual transport/authentication and
request deadlines remain independently bounded.

The peer counters measure logical authenticated RTC frame payloads. They exclude
framing headers, credit messages and SCTP/DTLS/IP overhead. SDP text and HTTP JSON
body counters have distinct named boundaries, and HTTP headers are excluded.
This local workerd/native/Chromium test uses synthetic authenticated accounts.
It does not measure production Cloudflare billing, deployed identity-provider
behavior, public NAT, TURN, physical device suspension or independent storage
recovery. The [deployment handoff](deployment-qualification-handoff.md) retains
those separate qualifications.
