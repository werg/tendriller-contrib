# Finish deployment qualification

The [current qualification inventory](peer-generation-qualification.md) and
[machine-readable manifest](peer-generation-release-manifest.json) identify
passing artifacts for `peer-generation-v1`. Those reports establish their exact
local and CI settings. Issues [#14](https://github.com/werg/tendriller-contrib/issues/14),
[#15](https://github.com/werg/tendriller-contrib/issues/15),
[#16](https://github.com/werg/tendriller-contrib/issues/16) and
[#17](https://github.com/werg/tendriller-contrib/issues/17) require observations
from actual deployments. Their older descriptions and reports preserve the
earlier fixed-authority design; use the current contract below when executing
their outstanding deployment goals.

The [architecture completion matrix](architecture-completion.md) separately
tracks implementation work for release publication, projections, effects and
timers. Completing that code does not supply network, device or provider
measurements. Missing deployment inputs do not prevent implementing and testing
the portable mechanisms.

## Qualify the implemented contract

Chronolog owns the authenticated selected application history, command journal,
coherent SQL/event views, identity, keyring, peer communication and explicit
recovery. An eligible peer coordinates one generation. `applied()` reports its
execution result; `shared()` reports independent complete coverage. Recovery may
adopt an earlier complete prefix and abandon recent applied work. An old branch
does not merge back when its device returns.

Tendriller hosts a constrained participant: account integration, compact signed
control, discovery and publication. It does not need application SQL, ordinary
command envelopes or private history keys. Enrolled devices create their own
signing and reader keys. Authorized live peers exchange encrypted key packages;
account login and a successful host request alone do not establish application
membership or permission to decrypt history.

Publication authority is independent of application read/write/coordinator
rights. Public code assets have their own signed release manifest and activation
history. Hosting an approved public release does not grant access to private
attachments. A deliberately selected earlier page release does not roll back
application data, protected controls or external effects.

Keep role and transport separate in the report. HTTP, WebRTC and a local process
connection can carry different permitted protocol messages, but the verified
capability determines what a participant may do. A healthy peer connection must
continue ordinary commands, queries, signals and content while host endpoints
are unavailable. If both the coordinator and control selector are unavailable,
preserve drafts and exact attempts while waiting to select another generation.

## Reuse the current public gates

Run only the gate needed to qualify a changed artifact or a new setting. Use an
exact clean source revision, public archives and a new output directory. Existing
green reports need no repetition merely because documentation changes.

| Gate | Entry point | What its result establishes |
| --- | --- | --- |
| Independent native events or guarded SQL | `npm run test:peer-generation -- --artifact /exact/session.tgz --domain conversation` (or `tasks`) `--output /new/evidence` | Separate owned stores, real signed attempts, deterministic domain behavior, earlier-prefix recovery, linked reapplication and durable reopen. Tasks require the SQL-native archive. |
| Actual native WebRTC | The same command with `--transport native-rtc` and the native-RTC archive | Authenticated ICE/DTLS/SCTP and peer-only warm work in the recorded network topology. |
| Actual packaged Tendriller host | `node cookbooks/run-a-peer-application/checks/run-peer-generation-host.mjs` with the exact session, SDK and engine artifacts documented in [the runner guide](../checks/README.md) | Public workerd controls/rendezvous and actual native RTC with synthetic fixture accounts; production identity remains separate. |
| Actual browser events or SQL | `npm run test:peer-browser -- --artifact /exact/session.tgz --domain conversation` (or `tasks`) `--output /new/evidence` | Dedicated Worker/OPFS, maintained public bootstrap and host bridge, actual browser/native RTC, coherent recovery and reopen. Tasks require the combined SQL-native/SQL-browser archive. |
| Fresh implementation from public APIs | [Independent task consumer](../checks/fresh-peer-task/README.md) | The recorded domain implementation, API interventions and developer experience. Its direct transport does not qualify physical RTC. |

The public runner reports identify their engine and package hashes, fixture
source, selected topology and actual scenario results. A build, a simulated
transport or an unexecuted command cannot replace a runtime report.

## Supply deployment inputs and record observations

| Issue | Required setting | Work and evidence |
| --- | --- | --- |
| [#14: production routes](https://github.com/werg/tendriller-contrib/issues/14) | Public host with actual identity provider, reachable native participant, TLS/DNS and home Wi-Fi, mobile hotspot and restrictive corporate networks | Repeat the same guarded task/chat trace over supported direct and relay paths. Record selected ICE candidates, TURN/tunnel/provider hops, actual bytes, establishment/catch-up time, whole-device resources, bounded queues, cold join, suspension, reconnect, native restart and warm operation with host services stopped. Select a supported route and practical fallback from observations. |
| [#15: comparable cost](https://github.com/werg/tendriller-contrib/issues/15) | Matched hosted and peer deployments, provider analytics/billing access, account allowances and the actual relay/storage/backup providers | Use the same trace, idle time, faults and retention window. Observe actual hosted hibernation. Separate control, signaling, public release assets, private peer content and relay traffic. Include native CPU/disk/network, browser replay/memory, retained bytes, backup lag and guarantee differences. Preserve raw usage, query windows and dated prices; unknown meters stay unknown. |
| [#16: deployed durability](https://github.com/werg/tendriller-contrib/issues/16) | Disposable infrastructure with the intended persistent volumes, secrets, cross-host fencing and independent retained history/control evidence | Exercise process loss, interrupted writes, volume/power loss, ordinary reopen and loss of the newest copy. Inspect usable complete prefixes and select recovery explicitly. Record abandoned/unknown work, original-attempt continuity and protected control floors. Recover the control/publisher store separately from peer history and private content; never copy one root identity into two active independent stores. |
| [#17: deployed devices and privacy](https://github.com/werg/tendriller-contrib/issues/17) | Separately enrolled real browser/OS devices, actual owner/participant authentication, authorized private fixtures and storage-pressure controls | Exercise live enrollment/key exchange, role scope, revocation/rotation, late responses, default-bucket quota, clearing/eviction, isolated profiles and recovery UX. Verify loss of keys causes explicit fresh enrollment, not silent identity replacement. Audit private-agent and attachment flows; hosting public assets must not reveal private history keys or bodies. |

The five-minute recovery-age objective requires a suitable independent peer and
an observed interval long enough to measure it. Record the retained prefix age,
peer availability, disconnect duration and selected recovery base. A short test,
two tabs sharing one owner or a heartbeat does not establish that objective.

## Preserve the limits of each observation

Logical frame counters exclude WebRTC, SCTP, DTLS and IP overhead. Separate
signaling from data-channel traffic, cold startup from the warm interval, and
direct candidates from TURN. Whole-browser/Worker/native peaks need measurements
at their actual boundaries; a page metric snapshot is not a whole-device peak.

A small test Storage Bucket can demonstrate an actual bounded OPFS quota failure.
It does not qualify the default bucket, OS eviction or another browser. Abruptly
terminating a Worker after a durable result is observed does not exercise a
mid-write crash. Record where each failure was injected and what survived.

Independent coverage is a statement about a complete retained prefix at the
time of the observation. It is not universal second-copy durability or a promise
that every applied edit survives later recovery. A release manifest, history
descriptor or content reference likewise does not prove its bytes remain
available. Record public asset retention and private content availability
separately.

Application recovery cannot undo an external effect. A worker must retain its
dispatch journal across selected-history resets, reconcile uncertain provider
results and preserve completed intent identities. A code rollback cannot erase
that journal. If an action requires its prerequisite history to survive, enforce
the protected recovery floor and report unavailable if that prerequisite is
missing.

## Execute the deployment session

1. Record exact source commits, public archive and engine hashes, deployed
   versions, browser/OS/runtime, accounts, roles, network paths and provider
   settings. Shared evidence uses public fingerprints; credentials, private keys
   and databases stay in protected operator storage.
2. Establish independently verified backups and retained control/history
   evidence before destructive drills. Use disposable deployment data and the
   actual storage configuration.
3. Verify enrollment, current roles and authorized peer key exchange. Run the
   same trace for route, recovery and cost observations, including publication
   and ordinary collaboration during host outages.
4. Preserve failed cases before repairing them. Record exact attempts,
   selected/abandoned ancestry, protected controls, incomplete content and
   explicit refusal states.
5. Export usage after provider analytics have caught up. Keep units, windows,
   filters, shared allocations, prices and missing meters explicit.
6. Attach immutable sanitized reports, commands and pass/fail boundaries to the
   relevant issue. Close only the settings actually exercised.

The workspace and CI can build the implementations and run reproducible public
artifact gates. They do not supply production account credentials, physical
home/mobile/corporate networks, deployed volume or power controls, private
production fixtures, or provider billing/backup exports. Those are the concrete
remaining inputs for deployed qualification.
