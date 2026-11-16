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

The follow-up simplification separates portable membership administration from
native application inclusion/finality and execution. Cloudflare is the default
administrator host; certified application descriptors commit detached payloads,
while small capability and epoch records remain inline. The
[thin-administration evidence and measured gates](thin-membership-administration.md)
record a complete passing packaged workerd/native/Chromium run. Earlier passing
application checks retain their original scope. The new gate separately proves
zero administrator application-envelope traffic, live host-reviewed device
enrollment and writer/reader revocation; deployed qualification remains open.

The [deployment handoff](deployment-qualification-handoff.md) maps issues
#14–#17 to the executable route, measurement, recovery and device gates, and to
the concrete infrastructure and evidence required outside those gates. The
[native cost review](membership-cost-review-2026-11-16.md) preserves the actual
before/after administrator write measurements and their source boundaries.

## Author-time finality follow-up

Replicas always execute included proposals in signed author-time order with the
protocol's deterministic tie-breakers. The replaceable finality provider chooses
inclusion and certifies a closed author-time frontier. Retained closure markers
make earlier admission boundaries recoverable; log positions only enumerate
receipt bytes. Later first-inclusion at or below a closed frontier is late and
cannot change the final prefix. Previously included exact retries retain their
original identity and result.

The recorded runs below predate this change. In particular, their scope-reset
fixture deliberately used receipt order to put a reset before an earlier
authored edit. With chronological execution, an earlier edit included before
closure runs before the reset and is then cleared. A stale-generation rejection
needs an edit that executes after the reset; late-inclusion rejection is a
separate case. New source/artifact qualification must establish these cases
without relabeling the historical reports.

## Earlier recorded implementation evidence

[The reviewed implementation's qualification](qualification-review-43957113710.md)
passed in [browser workflow 43957113710](https://github.com/werg/chronolog-db/actions/runs/43957113710).
It tested clean Chronolog merge `3780499f18435a8eddfa3dcecf511ca908e57087` for authored
head `1b5b8f26c0e36c7cff3534d4ae465eaa57154c9c`, public Tendriller source
`283f210c1fb9dc2c1d27e9bbd9e8813234a40a70`, embedded membership
`cc18d15ed5b5580b386fb2fc3e986afab935c7de` and contrib `8449017159b2657a2b0d9bde398322dac78ee2d1`.
New, separate raw reports record nine application checks (build, native scope/reset
and seven browser/runtime assertions) and seven thin-membership runtime assertions
plus the build/import audit. The same run passed six actual-WASM tests, SQL-free
OPFS, SQL/OPFS recovery and the public enrolled bridge. The note preserves exact
hashes, scope results, byte measurements, supporting quality/chaos results and limits.

### Initial recorded pairing, preserved unchanged

[Chronolog browser run 43940378818](https://github.com/werg/chronolog-db/actions/runs/43940378818)
passed on authored head `5cfa04440029c24d4313e7b8e88e593952180adb`, tested clean merge
`43efd510001c2608bc1e28ee4c7d100cb34c773b`. It consumed Tendriller source
`43cac4e75b0bbe1e422f4879b7249d6db5988440`, embedded portable membership source
`46b72ebc1c69f71b4cabab744ef19c6a4e50dfec`, and contrib specimens
`a3797d528d3bbbc649cda637e1e465105ea86c1c`. The immutable
[thin-membership report](evidence/2026-11-16-thin-membership.json) preserves all
seven runtime checks plus the build/import audit, package hashes and measured
transport bytes. The separate [application report](evidence/2026-11-16-application-pilot.json)
records eight checks, one final-intent dispatch and zero host application writes.

The same browser workflow passed the real native/WASM comparison, SQL-free OPFS,
mixed SQL/OPFS recovery and public enrollment/peer bridge gates.
[Quality run 43940378562](https://github.com/werg/chronolog-db/actions/runs/43940378562)
passed 682 tests, with four actual-WASM tests exercised separately by the browser
workflow, plus Linux/macOS deterministic digest comparison.
[Container chaos 43940378716](https://github.com/werg/chronolog-db/actions/runs/43940378716)
passed its healed-convergence scenario. These establish the named local and CI
boundaries, not a deployed authority-loss or public-network contract.

Tendriller's [public-service run 43938435186](https://github.com/werg/tendriller/actions/runs/43938435186)
passed its Node 22/24 checks, including 780 tests, public-package consumption and
the actual browser gate. Contrib's
[collection run 43936379719](https://github.com/werg/tendriller-contrib/actions/runs/43936379719)
verified 56 reading entries and 19 tests at the specimen pin; its
[public-artifact run 43936379799](https://github.com/werg/tendriller-contrib/actions/runs/43936379799)
also passed the existing independent browser adaptations and three actual-host
privacy checks. Neither older contrib workflow runs the new cross-repository
thin-membership scenario; that evidence belongs to the Chronolog run above.

### Focused specimen review after that pairing

The recorded `a3797d5` pages and unaltered reports remain the historical baseline.
A later review found and fixed three page-level recovery gaps through the same
public interfaces:

- Accepted JSON on an authorized topic can still violate the page's application
  vocabulary. The reducer now skips and counts unsupported/malformed message or
  job records, preserving later valid content; it validates handler/version and
  original job/task identity. SQL schema and captured-revision errors still fail
  the coherent read. The reducer's version marker changes for adaptations that
  cache its shape; this specimen itself rebuilds from captured history.
- A reference saved before failed durable preparation could occupy one of the
  100 review slots forever. A passive **Check original status** action reuses the
  original operation ID and resumes its subscription. An observed missing
  operation can be reviewed away; active, unresolved, queued and provisional
  operations remain protected. Removing a local reference does not cancel work.
- Trimming message content previously prevented completion from recognizing the
  original whitespace-bearing editor draft. Submission now captures payload
  content and the exact editor snapshot separately, clearing only the unchanged
  original and preserving later typing.

Focused deterministic checks reproduce those cases; the collection now passes
24 tests and still has 56 reading entries. Those checks establish page/model
behavior. The separate latest qualification above runs the updated pages through
the real public runtime without relabeling the original reports or inventing
browser assertions for every model case. The new
[scoped JSON reset recipe](scoped-json-state.md) also closes P2P-04 through the
exact built programs and actual native public adapter. Deployed acceptance
boundaries below remain unchanged.

## Work ownership and dependencies

| Work item | Owner | Depends on | Acceptance evidence |
| --- | --- | --- | --- |
| Versioned SQL/platform/emit program and canonical bounds | Chronolog protocol | Existing signed proposal core | Canonical round trips; oversized, malformed and unauthorized steps rejected |
| Event-only execution profile | Chronolog core | Program and profile binding | Publish, replay, finality and reopen without loading SQL |
| Mixed SQL/event application | Chronolog materializer | Program and admission | One SQL failure leaves no partial rows or effective events |
| Native fixed finality provider | Chronolog records/native runtime | Portable store and inclusion/closure verifier | Atomic exact deduplication, retained closures, restart and conflict refusal; execution order stays canonical |
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
| Typed descriptors and detached application envelopes | Chronolog protocol and peer transport | Canonical hashes, signed records and retained inclusion/closure evidence | Exact envelope binding; missing/corrupt bodies block full application progress without blocking roster verification |
| Portable thin membership administrator | Chronolog administrator core and Tendriller Cloudflare composition | Durable root identity, inline capability/epoch history and public membership provider | Live device enrollment, exact decision retry/restart and revocation without application payload downloads or application SQL |
| Membership placement qualification | Public host/peer fixtures and contrib evidence | Independent administrator, native authority and browser replicas | Passing actual workerd/native/fresh-browser gate, encoded-byte counters and exact artifacts; ADMIN map distinguishes the two pregranted layouts and remaining deployed faults/recovery |

The [file/capture metadata recipe](https://github.com/werg/chronolog-db/blob/feat/portable-peer-core/examples/blob-metadata.ts)
adds an application-owned SQL/emit schema over the existing host uploader. It
stages exact upload receipts, binds path revisions, and distinguishes completed
upload/retention evidence from unknown additional copies. Its native integration
checks final metadata, stale-guard rollback and exact retries. Deployment byte
availability and backup evidence remain in issue #17; this recipe does not close it.

## Decisive correctness scenarios

The following are separate assertions, not a single generic “P2P works” test.

| ID | Starting condition and action | Required observation | Appropriate boundary |
| --- | --- | --- | --- |
| P2P-01 | An event-only group publishes and reopens. | Same effective final events; no SQL adapter loaded. | Native and browser public runtime |
| P2P-02 | A mixed program updates a row, emits, then fails an assertion. | No partial row and no effective domain event; rejection remains auditable. | Actual deterministic engine |
| P2P-03 | Lose the submission response and restart. | Original proposal, position and accepted/rejected outcome; changed contents under the ID conflict. | Actual durable store and authority |
| P2P-04 | Include an earlier authored edit and later reset before closure; separately author a stale-generation edit after that reset. | Earlier edit runs before reset; stale later edit rejects atomically; exact retry retains its original receipt. | Exact built recipe through the native public adapter; earlier receipt-order report is historical |
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
Report small descriptor/inline-control traffic separately from detached
application payload traffic. Prove the default Cloudflare administrator does not
fetch application bodies during live join and catch-up.

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
Include the administrator's retained metadata and control traffic, and vary
candidate count independently from payload size. Moving payload bytes off the
administrator is a measured property, not a reason to omit relay or storage cost.

### Rehearse authority storage loss and recovery

Tracking: [contrib #16](https://github.com/werg/tendriller-contrib/issues/16).

Document the persistent volume and single-writer fencing configuration. Exercise
ordinary restart and a consistent full restore. Separately simulate loss of the
only up-to-date disk. Establish whether continuity can be proven or a new lineage
is required, and record the known backup lag at the last acknowledgment.

Never resume the old history from an unproven stale backup or copy one authority
key into two active stores. If immediate disk-loss survival is a product promise,
specify and test a second-durable-copy acknowledgment contract before making it.
Rehearse the Cloudflare administrator's root identity and roster recovery as a
separate responsibility from native finality and payload recovery. Restoring one
role does not establish the other's continuity.

### Qualify device and privacy boundaries

Tracking: [contrib #17](https://github.com/werg/tendriller-contrib/issues/17).

Exercise fresh browser enrollment, historical-key approval, OPFS reopen,
exclusive Worker ownership, revocation and late responses, quota exhaustion,
private agent data exclusion, and publish-only collectors. Review the actual
deployed host login and application enrollment independently. Synthetic identities
and topic filters do not prove production authentication or confidentiality.
Use devices enrolled after genesis through the default Cloudflare provider.
Exercise a revoked writer's direct native path while its host session remains
valid, and reader removal followed by future-epoch key rotation. Do not infer
membership readiness from an HTTP approval or an application SQL team invitation.

## Deliberately separate future work

Compaction/retention deletion, archive manifests, automatic authority failover,
quorum durability, dynamic validator or issuer sets, per-topic private histories,
full meshes, DHT/global discovery, arbitrary-code consensus, and a general broker
framework are not prerequisites for this first profile. Add them only when a
measured need supplies concrete proof, recovery and operational requirements.
