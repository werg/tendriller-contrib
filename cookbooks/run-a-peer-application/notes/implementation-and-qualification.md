# Application-log implementation and qualification

This checklist accompanies [the approach](../COOKBOOK.md). It defines the work
across the two independent cores and this contribution repository. Items stay
open until an exact source/artifact pair and a passing scenario are recorded.
The guide's presence, a mocked transport, or a successful unit test does not
establish a production deployment.

Implementation continues in [Tendriller #35](https://github.com/werg/tendriller/pull/35)
and [Chronolog #1](https://github.com/werg/chronolog-db/pull/1). The starting heads are
`0200f3b7942d8aea7144c1764677a6e203e7716c` and
`8a918b824a3be79e7c3608412ec518208896a064`, respectively. Both products are
pre-release: replace prototype abstractions directly, with no compatibility
conversion, legacy import, old/new bidirectional mirror, or alternate hidden
authority.

## Work ownership and dependencies

| Work item | Owner | Depends on | Acceptance evidence |
| --- | --- | --- | --- |
| Versioned SQL/platform/emit program and canonical bounds | Chronolog protocol | Existing signed proposal core | Canonical round trips; oversized, malformed and unauthorized steps rejected |
| Event-only execution profile | Chronolog core | Program and profile binding | Publish, replay, finality and reopen without loading SQL |
| Mixed SQL/event application | Chronolog materializer | Program and admission | One SQL failure leaves no partial rows or effective events |
| Native fixed authority | Chronolog records/native runtime | Portable store and coordinated policy | Atomic exact deduplication, prefix commit, restart and conflict refusal |
| Durable final event reader | Chronolog core/RPC/client | Durable applied outcomes | Bounded complete transactions; empty-filter progress; no unresolved outcome skip |
| Revision-scoped coherent reads | Chronolog core/client | Final/local revision identity | SQL and events captured together; finality-only observer update |
| Projection checkpoint helper | Chronolog optional application layer | Durable reader | State/cursor atomicity, reducer-version invalidation, replay after failed save |
| Resident final-intent worker | Chronolog optional application layer | Durable reader and exact proposals | Dispatch journal, stable provider key, result replay, uncertain-effect recovery |
| Timer and cancellation semantics | Resident service/application | Worker and durable intent | Stable occurrence identities; cancellation at its defined boundary |
| Topic-scoped and ephemeral grants | Chronolog capabilities | Governed grants | Unauthorized topic/SQL/platform operations rejected; revoked old grant stays revoked |
| Signed publish-only ingress | Chronolog wire/core | Topic grants | Original signature/operation preserved through forwarding, without history keys |
| Selected application backend | Tendriller public contract/runtime | Small public interface | One write owner and one outbox; hosted and Chronolog implementations consume it |
| Framed connection/bootstrap and signals | Tendriller public contract + Chronolog adapter | Portable sync | Bounded queues, explicit expiry/domain, application authorization independent of host access |
| Task-board/chat application | Contrib | Built public artifacts | Shared conditional tasks, durable conversation/jobs, ephemeral typing, retained drafts |
| Independent package consumption | Both core release checks and contrib | Built artifacts | No private sibling imports; either core usable on its own |

## Decisive correctness scenarios

The following are separate assertions, not a single generic “P2P works” test.

| ID | Starting condition and action | Required observation | Appropriate boundary |
| --- | --- | --- | --- |
| P2P-01 | An event-only group publishes and reopens. | Same effective final events; no SQL adapter loaded. | Native and browser public runtime |
| P2P-02 | A mixed program updates a row, emits, then fails an assertion. | No partial row and no effective domain event; rejection remains auditable. | Actual deterministic engine |
| P2P-03 | Lose the submission response and restart. | Original proposal, position and accepted/rejected outcome; changed contents under the ID conflict. | Actual durable store and authority |
| P2P-04 | Reset an application scope before an older pending operation arrives. | Old operation stays rejected; a previously accepted exact retry returns its original receipt. | Selected authority transaction |
| P2P-05 | Finality changes without changing query rows. | Pending/final indicators update. | Client subscription and actual UI |
| P2P-06 | Two peers provisionally claim one task. | One final claim; stable losing-operation rejection; coherent replacement view and retained draft. | Two independent writers and real SQL |
| P2P-07 | Slow or restart an event consumer. | Bounded memory and no silent event loss; replay from its processed checkpoint. | Durable reader and consumer store |
| P2P-08 | Scan a long range with no matching topic. | Empty batches safely advance `scannedThrough`. | Durable event reader |
| P2P-09 | Crash during projection/checkpoint commit. | Both old state/cursor or both new state/cursor; no skipped processing. | Actual atomic consumer store |
| P2P-10 | Rebuild a UI projection or change reducer version. | No external tool call or notification; cache is rebuilt coherently. | Pure reducer and worker separation |
| P2P-11 | A limited publisher adds SQL/platform work or another topic. | Rejection without giving it history keys; signed author identity remains original. | Actual grant/wire admission |
| P2P-12 | Revoke and then regrant a writer. | Events follow policy activation; a new grant cannot revive old pending intent. | Governed native/browser peers |
| P2P-13 | Kill the authority around commit/acknowledgment. | Committed prefix recovers without conflicting position reuse; ambiguous infrastructure errors do not invent SQL rejection. | Abrupt process death and durable native storage |
| P2P-14 | Remove the authority. | Existing reads and certificate exchange continue; new coordinated finality waits. | Multi-peer integration |
| P2P-15 | Disable Cloudflare application-state writes. | Tasks, conversation, final-intent processing and recovery still work through peers. | Real browser/native pair and instrumented host routes |
| P2P-16 | Repeat the history over direct and relayed sessions. | Identical records, permissions and outcomes; route-specific byte accounting remains visible. | Actual connection adapters |
| P2P-17 | Consume independently packed public artifacts. | Neither core imports the other's private implementation. | External consumer build/test |
| P2P-18 | Change the event topic filter after saving a cursor. | Explicit mismatch or deliberate restart from an appropriate older point. | Durable reader |
| P2P-19 | Place an unresolved/missing transaction before matching events. | Scan stops before it; no fabricated rejection or progress beyond the durable anchor. | Record/application recovery |
| P2P-20 | Read during a local rebase or finality advance. | SQL and events belong to the same pinned view until release. | Revision-scoped read |
| P2P-21 | Provider acts, then worker crashes before result save. | Same idempotency key or explicit reconciliation; unsupported certainty remains unknown. | Worker journal and real/provider-specific test |
| P2P-22 | Replay a timer occurrence, cancel it, and restart. | Stable occurrence identity and the documented cancellation result, without duplicate dispatch. | Resident scheduler and effect journal |
| P2P-23 | Expire/reorder/replay transient signals. | Expired/stale frames are dropped and queues stay bounded; no durable cursor claim. | Peer signal protocol |
| P2P-24 | Commit blob metadata before a second copy exists. | Availability and backup lag remain explicit; metadata is not presented as a replicated-byte receipt. | Blob storage adapter |

## Deployment issues that require external evidence

The following tracked issues name the deliverables and completion criteria.
They remain open until deployed evidence is attached; local checks do not close
them.

### Qualify the browser/native production route

Tracking: [contrib #14](https://github.com/werg/tendriller-contrib/issues/14).

Compare the selected framed WSS baseline with direct WSS to a reachable agent or
browser/native WebRTC as the host permits. Use home Wi-Fi, a mobile hotspot, and a
restrictive corporate network. Include browser suspension, connection interruption,
agent restart, cold bootstrap, and a warm direct session with hosting unavailable.

Record the exact browsers/native runtime, network conditions, direct and relayed
**bytes**, connection establishment latency, catch-up throughput, peak memory,
bounded-queue behavior and failure recovery. Include tunnel/provider paths in the
route. A successful socket or a high native direct-connect percentage cannot
stand in for these measurements. Choose one production path and a practical
fallback from the results; adding all adapters is not a release prerequisite.

### Measure moved application work and remaining relay cost

Tracking: [contrib #15](https://github.com/werg/tendriller-contrib/issues/15).

Run paired workloads for shared table edits and a contested claim, chat with
ephemeral token progress, an agent intent/result with crash recovery, first-device
catch-up and reconnect, and a capture/blob transfer. Record Cloudflare active
duration, requests, storage row writes, retained bytes, and relay egress alongside
agent CPU/disk/network, browser memory/replay time, history growth and backup lag.

Use the current hosted backend's actual hibernation behavior as the baseline.
Record provider pricing and date separately from measured usage. Publish raw
measurements and the calculation; do not claim savings from moving SQL alone or
from assumed browser direct routing.

### Rehearse authority storage loss and recovery

Tracking: [contrib #16](https://github.com/werg/tendriller-contrib/issues/16).

Document the persistent volume and single-writer fencing configuration. Exercise
ordinary restart and a consistent full restore. Separately simulate loss of the
only up-to-date disk. Establish whether continuity can be proven or a new lineage
is required, and record the known backup lag at the last acknowledgment.

Never resume the old history from an unproven stale backup or copy one authority
key into two active stores. If immediate disk-loss survival is a product promise,
specify and test a second-durable-copy acknowledgment contract before making it.

### Qualify device and privacy boundaries

Tracking: [contrib #17](https://github.com/werg/tendriller-contrib/issues/17).

Exercise fresh browser enrollment, historical-key approval, OPFS reopen,
exclusive Worker ownership, revocation and late responses, quota exhaustion,
private agent data exclusion, and publish-only collectors. Review the actual
deployed host login and application enrollment independently. Synthetic identities
and topic filters do not prove production authentication or confidentiality.

## Deliberately separate future work

Compaction/retention deletion, archive manifests, automatic authority failover,
quorum durability, dynamic validator or issuer sets, per-topic private histories,
full meshes, DHT/global discovery, arbitrary-code consensus, and a general broker
framework are not prerequisites for this first profile. Add them only when a
measured need supplies concrete proof, recovery and operational requirements.
