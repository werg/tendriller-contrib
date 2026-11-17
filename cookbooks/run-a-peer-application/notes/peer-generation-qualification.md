# Qualify the peer-generation composition independently

`peer-generation-v1` has a different order and recovery contract from the
historical resident/finalized recipes. Their reports remain valid for their
recorded revisions; they do not qualify this profile.

The [evidence validator](../checks/peer-generation-report.mjs) defines the
independent package gate. Its [small synthetic tests](../checks/peer-generation-report.test.mjs)
check whether incomplete or contradictory evidence is refused. Passing those
tests is not evidence that a peer session, browser, network or deployment ran.

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

The manually dispatched `Independent peer-generation consumer` workflow builds
an exact Chronolog source revision and runs the same isolated public consumer.
It uploads its artifact, provenance, raw report and checked summary even when a
later assertion fails. Its existence is not a claim that CI has run.

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

No result in this note marks those additional gates passed. A preserved runtime
report and its exact public artifact pairing are required for each claim.
