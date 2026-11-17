# Finish deployment qualification of the common session

The [public-session gates](../checks/README.md) exercise native events, SQL,
browser ownership, RTC and the hosted participant through one command/query,
operation, replication and recovery API. Different transports and capabilities
do not select a second application stack. A passing local gate qualifies only
its exact source, archives and observed environment.

The earlier resident deployment runbook remains available at its
[recorded source snapshot](https://github.com/werg/tendriller-contrib/blob/11c445e4d25e7b8ca415f3327c8049fcadc9f547/cookbooks/run-a-peer-application/notes/deployment-qualification-handoff.md).
Its permanent authority, author-time closure and backup assumptions are not the
current deployment contract.

## Deployment contract

Ordinary commands, coherent reads, live signals and background replication run
between application peers. The active coordinator is a temporary authorized
role. A signed host selection changes that role and can adopt an older complete
prefix. A returning excluded branch stays inspectable and requires deliberate
reapplication; no disconnected history merges automatically.

Tendriller participates through the same Chronolog protocol using a restricted
control transport. Its interests include monotonic membership and generation
controls, authenticated code/page publication, bounded discovery and ephemeral
introductions. Its default transport rejects application database traffic,
content replication and live UI signals. Cached verified controls keep the
current generation usable during a control outage while its peer transport remains available. Direct connections can survive a complete host outage; WebSocket relay connections depend on that relay and consume its bandwidth. If the coordinator and host
both disappear, keep exact saved intent while selecting a successor waits.

Application code and page assets use signed publication revisions. Those
revisions are independent of database generation recovery and retain their
application/definition/execution bindings. A server receipt does not authorize
changed code semantics or impersonate a participant.

Security controls and protected recovery floors remain monotonic even when an
ordinary data suffix is abandoned. Irreversible work needs an explicitly
configured protected-action capability or durable external-action service;
ordinary applied events do not provide that guarantee.

## Reproduce the independent gates

| Boundary | Command with explicit archives | What it establishes |
| --- | --- | --- |
| Native session and recovery | `npm run test:peer-generation -- --artifact ... --output ...` | Original attempts, exact retry, host-blocked work, complete-prefix recovery, abandoned evidence, repeated-generation ancestry and identity-preserving reopen. |
| Native RTC | Add `--transport native-rtc` | The same scenario over real authenticated loopback ICE/DTLS/SCTP after SDP introduction retires. |
| Native SQL | Add `--domain tasks` with a SQL-enabled archive | Guarded competing claims, shared ownership, SQL/events/outcome recovery and continued work after the creator closes. |
| Browser/native | `npm run test:peer-browser -- --artifact ... --output ...` | Actual Worker/OPFS identity and journal ownership, key enrollment, two-channel RTC, UI recovery and interrupted content. |
| Hosted participant | `npm run test:peer-host -- --artifact ... --artifacts ... --output ...` | Actual workerd controls and rendezvous, selective protocol routing, signed served code publication/restart, peer recovery and zero hosted traffic during ordinary direct commands. |
| Native WebSocket fallback | Add `--transport websocket` to the hosted runner, using a plain or SQL archive | The same application scenario after forced direct failure, actual Workerd relay frames, owned reconnect, independent live/history sockets and explicit relay bytes. |
| Browser WebSocket | Add `--transport websocket --browser` to the hosted runner | The same Worker/OPFS, UI, content interruption and recovery scenario over Worker-owned WebSocket connections to the actual relay. |

Use clean exact source commits, new output directories and the public artifacts
emitted from those commits. Preserve failures as well as successes. A runner's
existence, synthetic report-validator test or successful bundle build does not
establish that its runtime scenarios ran.

## Required deployed observations

| Workstream | Required setting | Evidence to retain |
| --- | --- | --- |
| [Production routes](https://github.com/werg/tendriller-contrib/issues/14) | Actual deployed host/authentication; separate browser/native devices on home Wi-Fi, mobile and restrictive networks; direct WebRTC plus authenticated WSS relay fallback. | Cold join, reconnect, suspension, direct/relayed route, retired introduction, peer traffic during host outage, actual wire bytes, time to usable state and bounded queues. |
| [Cost](https://github.com/werg/tendriller-contrib/issues/15) | Matched application workload, provider analytics/account allocation and device/relay/storage measurements. | Hosted requests and bytes before/after ordinary commands; idle/discovery/control/publication costs; peer CPU/memory/storage/network and relevant battery behavior; relay costs separately; unknown meters explicitly unknown. |
| [Recovery](https://github.com/werg/tendriller-contrib/issues/16) | Disposable deployment data, independently retained prefixes, real peer storage loss and durable hosted control continuity. | Coordinator/store removal; older complete survivor adoption; fresh peer reconstruction; known abandoned work and unknown loss; returning old-branch quarantine; exact takeover retry; protected-floor refusal; host restart without stale selection or a new root. |
| [Device/privacy boundaries](https://github.com/werg/tendriller-contrib/issues/17) | Independently enrolled real devices, actual authorization, storage pressure and controlled key loss. | Grant/revocation transitions, current permissions after data recovery, encrypted key delivery, no server data-reader privilege by implication, same-device reopen, missing-store refusal, second-tab behavior, real browser suspension/eviction and denied private-data access. |

Measure the initial five-minute recovery-freshness objective with a named
workload and another usable peer. Record the adopted state age, replication
coverage, known excluded work and time to recover. A long partition or loss of
all copies can exceed that objective or leave data unavailable. Do not report a
universal bound from advertised head metadata or heartbeat timestamps.

## Keep measurements precise

- A control advertisement is a hint, not authority or proof of complete retention.
  A metadata-only head cannot seed recovery; repair its holes or choose an earlier
  complete point.
- RTC application-frame counters exclude transport overhead. Distinguish direct
  candidate pairs from WebSocket relay delivery and count SDP separately. Record ciphertext relay ingress/egress and test relay availability independently of control HTTP. Loopback does not qualify
  public NAT traversal or restrictive-network policy.
- Two tabs sharing one storage owner are one data copy. A small test bucket does
  not establish default-bucket exhaustion or operating-system eviction behavior.
- Use actual authenticated accounts for deployed enrollment. Synthetic workerd
  accounts cannot establish production cookies, origins or identity-provider setup.
- Hosted control restoration must preserve selected generations, control history
  and protected floors. Application recovery may abandon a recent data tail;
  it must not restore broader permissions or reinterpret an excluded suffix.
- Optional archive, relay and protected-action services need their own declared
  guarantees and measurements. Their cost is not silently included in the light
  default, and their absence never triggers another application backend.

## Execute and record

1. Record source commits/trees, clean flags, package/control/engine digests,
   deployed versions, browser/OS/native versions, topology and role ownership.
2. Establish real enrollment, authorized key delivery and bounded discovery.
   Verify publication author/signatures and actual served asset bytes.
3. Establish direct peers, then block host access during a fixed command, read, signal and replication workload. Repeat with forced direct failure and the WSS relay, blocking control HTTP separately. Record every hosted request/body counter, relay ingress/egress and actual peer traffic. Cut the relay and observe the existing session's bounded reconnect and unchanged saved attempts.
4. Remove the coordinator and its newest store. Recover from another complete
   peer, return the old branch, inspect abandoned work and explicitly reapply one
   suitable intent under current guards. Repeat across three generations.
5. Exercise restrictive controls, host/coordinator joint outage, no usable source,
   storage pressure, device restart and optional stronger boundaries separately.
6. Export provider usage for the same workload/window, with units, query filters,
   shared allocations and missing-data flags. Preserve immutable sanitized raw
   reports, commands, scenario results and limits for each issue.

These deployment gates remain open until those settings are actually exercised.
Local runtime results do not imply production authentication, physical network
coverage, provider cost or a recovery-age guarantee.
