# Finish deployment qualification

The implementation and reproducible local/CI gates live in
[Chronolog #1](https://github.com/werg/chronolog-db/pull/1),
[Tendriller #35](https://github.com/werg/tendriller/pull/35) and
[contrib #13](https://github.com/werg/tendriller-contrib/pull/13).
The four deployment issues remain open until their observations come from the
actual deployment. This handoff names the inputs, commands and evidence needed
to finish them. Exact passing revisions and unaltered reports belong in the
qualification notes; a command or test's presence is not a passing result.

## Keep the architecture simple

The [peer network contract](peer-network.md) defines the current WebRTC target:
bounded introduction, explicit participant operations, peer-owned application
traffic and no implicit hosted socket or health poll in a peer page. Keep cold
load/participant costs separate from the warm application interval.

The administrator approves small signed roster and epoch operations. Cloudflare
hosts it by default; its portable implementation does not need application SQL
or application payloads. Members create their own signing and reader key pairs.
The administrator retains the membership state and key material needed to wrap
authorized epoch keys to approved reader public keys. A member's private key is
not uploaded as part of enrollment.

One receipt ledger carries small signed descriptors, inline membership controls
and signed author-time closure markers. Full peers fetch the hash-committed
application envelopes and derive execution order from signed author timestamps
and deterministic tie-breakers. The native finality authority certifies inclusion
and a closed author-time frontier; receipt positions do not choose application
conflict winners. The membership administrator decides roster permissions at the
proved control boundaries. These responsibilities can have different hosts
without inventing another application command log.

Retaining a descriptor proves which bytes were committed, not that a usable copy
of those bytes still exists. A storage or routing failure must not silently
create a new signer, overwrite an original operation, grant membership, or
fabricate a final application rejection.

## Reproduce the available gates first

Use exact clean source commits and paired public SDK/runtime/engine packages.
Keep every output directory new. The wrappers preserve source and artifact
identities; build-only output explicitly leaves runtime scenarios unexecuted.

| Gate | Entry point | Scope and runbook |
| --- | --- | --- |
| Standing resident HTTPS introduction | In Chronolog: `node --import tsx tools/test-resident-webrtc.ts --contrib ... --output ...` | Exact native resident task recipe, real TLS verification, origin/admission/read-grant refusal, authenticated native/native RTC and listener/task shutdown. [Resident service gate](../checks/README.md#qualify-the-standing-native-https-service). |
| Browser/native WebRTC after introduction closes | `npm run test:peer-webrtc -- --chronolog ... --output ...` | Actual Chromium/OPFS Worker and native Werift adapter; bidirectional authenticated records, exact history and detached-payload digests after the loopback offer/answer host closes. [RTC gate](../checks/README.md#qualify-the-browsernative-webrtc-transport). The fixture does not qualify the packaged Tendriller host. |
| Task/chat over WebRTC with packaged host introduction | `npm run test:peer-application -- --chronolog ... --tendriller-runtime ... --tendriller-engine ... --wasm ... --output ...` | Actual native authority, two independent Chromium/OPFS peers and packaged workerd rendezvous with synthetic page sessions. RTC reconnect/catch-up, original state/outcome comparison and warm work after introduction stops. [Route runbook](https://github.com/werg/chronolog-db/blob/feat/portable-peer-core/docs/route-qualification.md). |
| Fresh device and thin administrator | `npm run test:peer-membership -- --chronolog ... --tendriller-artifacts ... --wasm ... --output ...` | Actual packaged workerd provider, native peer and Chromium device; enrollment, certified grants/keys, detached-body readiness, revocation and restart. [Membership gate](../checks/README.md#qualify-thin-cloudflare-membership-separately). |
| Native traffic and retained storage | In Chronolog: `node --import tsx tools/membership-cost.ts --output ...` | Actual signed requests and durable stores; independent body-size/count workloads and membership lifecycle. [Cost guide](measuring-application-costs.md). |
| Authority loss and restore | In Chronolog: `node --import tsx tools/authority-recovery.ts --output ...` | Separate real processes, SIGKILL at commit boundaries, same-store fencing, retry, complete backup/restore and stale-lineage refusal. [Recovery runbook](https://github.com/werg/chronolog-db/blob/feat/portable-peer-core/docs/authority-recovery.md). |
| Browser storage and authorization | Chronolog Browser peer qualification workflow; focused commands in the runbook | Real Chromium/OPFS ownership, explicit identity creation, metadata/storage-loss refusal, bounded actual quota fixture and publisher negative cases. [Device runbook](https://github.com/werg/chronolog-db/blob/feat/portable-peer-core/docs/device-boundary-qualification.md). |

The author-time finality change requires new source-pinned qualification. Earlier
receipt-order reports remain historical: they do not qualify closure recovery,
timestamp admission, closure traffic, or the revised reset-versus-stale-edit
scenario. Record the future-admission window, cutoff lag, closure interval and
polling cadence in route and cost reports. The native authority backup must
retain its closure history as well as its certified receipt prefix.

The browser workflow runs independent gates even if an earlier gate fails. Its
overall result still fails. Read each report's status and scenario list; a later
passing scenario does not turn an earlier failure into a successful workflow.

## Required external setting and evidence

| Issue | What must be supplied | Work to perform | Evidence that finishes the boundary |
| --- | --- | --- | --- |
| [#14: production routes](https://github.com/werg/tendriller-contrib/issues/14) | Deployed public host, actual identity provider, reachable native agent, TLS/DNS configuration, and home Wi-Fi, mobile hotspot and restrictive corporate networks | Repeat identical task/chat histories over every supported direct/fallback path. Exercise cold join, warm catch-up, real suspension, disconnect, native restart, slow readers and a warm direct session while host services are stopped. | Exact topology including tunnels/relays; supported/unsupported routes; actual wire/provider bytes; establishment and catch-up times; whole-browser/Worker/native memory; queue behavior; identical signed records, permissions and outcomes; zero hosted application-state writes; selected production route and fallback. |
| [#15: complete cost comparison](https://github.com/werg/tendriller-contrib/issues/15) | Matched hosted/peer deployments, Cloudflare analytics/account access, monthly allowance baseline, native and relay/tunnel/blob/backup providers | Run the same trace, idle intervals, faults and retention window for hosted, peer-direct and peer-relayed cases. Observe the hosted WebSocket hibernation behavior. Include capture/blob reads and restore, not only metadata. | Raw provider usage and queries, dated prices and account allocations, native/browser resources, time-integrated retention, history growth, independent blob copies and backup lag. Feed the supplied calculator; retain unknown totals where any required meter is absent. |
| [#16: deployed durability](https://github.com/werg/tendriller-contrib/issues/16) | Disposable infrastructure matching the actual persistent volume/daemon/secret store, cross-host fencing controls, independent latest acknowledged prefix, backup/export rights and a secure administrator transfer procedure | Rehearse process and volume/power failures, full-state restore and loss of the newest disk. Verify old-owner fencing. Separately restore or move the Cloudflare administrator with only one active root store. | Actual deployment/storage versions and guarantees, independently verified continuity floor, backup age/lag, complete store/key inventory, exact retry outcomes, live peer reads during outage, descriptor versus payload availability, and an explicit continue-lineage or new-lineage decision. |
| [#17: deployed device/privacy boundaries](https://github.com/werg/tendriller-contrib/issues/17) | Real separately enrolled browser/OS devices, actual owner/participant authentication, authorized private-data fixtures, storage-pressure controls and key-management access | Repeat the membership/revocation/negative cases through production authentication; exercise real suspension, default-storage exhaustion, selective loss, clearing, isolated profiles, recovery UX and retained/future epoch policy. Audit actual private-agent data flows. | Deployed version and account/device identity fingerprints, logs with private values excluded, original-operation continuity, explicit fresh enrollment after key loss, private-data exclusion, revoked future access and observed browser-specific recovery limits. |

### Limits that need explicit observations

- Historical local direct WSS proves its recorded route can carry the real
  protocol. A new browser/native WebRTC run must name its own source, runtime,
  selected candidate route and results. Neither loopback route establishes
  public reachability through NAT, a corporate policy or a mobile network.
- The historical relay fixture used the actual packaged engine, but its local TLS bridge
  supplies a synthetic page session. Test production cookie/origin/login and
  participant authorization on the deployed host.
- Frame counters exclude transport overhead. Count RTC signaling separately
  from data-channel bytes and distinguish direct candidate pairs from TURN.
  Sampled queue sizes,
  page metric snapshots and one process's RSS are not a whole-device peak or a
  queue-saturation qualification.
- A deliberately small browser Storage Bucket can produce a bounded real OPFS
  quota failure. That storage/checkpoint/journal result does not establish quota
  exhaustion at the public peer's default bucket, outbound-publication behavior
  under that pressure, disk-full behavior, OS eviction or other browsers. A CDP
  reported quota alone must not be accepted as evidence that writes failed.
- SQLite's same-file writer fence does not fence copied volumes on independent
  hosts. A retained local certificate helps detect partial loss; it cannot
  detect a rollback that removes every newer copy of evidence. Keep independently
  verified acknowledged inclusion and closure evidence outside the restored
  disk, and validate the complete retained closure history during recovery.
- No second-durable-copy-before-acknowledgment contract, automatic failover,
  generic Cloudflare-to-native administrator export/import command, or erasure
  of plaintext already read by a revoked device is claimed. If such a promise
  becomes a product requirement, define and qualify that contract separately.

## Order the deployment session

1. Record the exact authored and tested commits, package hashes, deployed
   versions, browser/OS/native versions, accounts, network paths and role owners.
   Use public fingerprints in shared evidence; keep credentials, databases and
   private keys in protected operator storage.
2. Confirm a usable independent backup and continuity floor before the loss
   rehearsal. Use disposable deployment data and the real storage configuration.
3. Establish real enrollment and authorized key delivery, then qualify network
   routes and application equivalence. Carry the same trace into cost runs.
4. Execute the storage/restart/loss drills and real browser pressure/eviction
   cases. Record observed absence and refusal explicitly; do not repair away a
   failed case before preserving its evidence.
5. Export usage after the provider's analytics delay, preserving units, windows,
   query filters, shared allocations and missing-data flags. Calculate only from
   those measurements and the matching pricebook.
6. Attach immutable sanitized reports, trace hashes, commands, pass/fail results
   and limits to the relevant issue. Close a checklist item only for the setting
   actually exercised; leave unsupported or unmeasured cases explicit.

The current workspace and CI can run the implementation gates and publish their
evidence. They do not provide production Cloudflare credentials, real identity
provider accounts, physical home/mobile/corporate networks, deployed volume
attachment/power-loss controls, private production agent data, or billing and
backup exports. Those inputs are the concrete handoff for the remaining issues.
