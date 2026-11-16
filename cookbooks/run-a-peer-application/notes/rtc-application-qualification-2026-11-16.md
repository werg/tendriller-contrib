# RTC application and resident qualification

The task/chat application passed all twelve checks in
[workflow 43980256890](https://github.com/werg/chronolog-db/actions/runs/43980256890).
It used two independent Chromium/OPFS replicas, a separate native SQL/finality
peer, the exact contrib recipes and the packaged Tendriller rendezvous. The
later [quick workflow 43981821705](https://github.com/werg/chronolog-db/actions/runs/43981821705)
passed five browser/native RTC checks and six native HTTPS resident-task checks
after the peer deadline correction.

These are separate source pairings and qualifications. The thin membership
scenario in the first workflow failed. The later source's full workflow has
reported an application-step failure; its shared artifact was not yet available
for diagnosis, and the thin membership step was still running when this
checkpoint was recorded. Neither the earlier application pass nor the later
quick pass is reported as a combined current-source qualification.

## Preserved observations

- [Application raw report](evidence/2026-11-16-43980256890-application.json) and
  [strict validated summary](evidence/2026-11-16-43980256890-application-summary.json).
- [Later browser/native RTC raw report](evidence/2026-11-16-43981821705-webrtc.json)
  and [strict validated summary](evidence/2026-11-16-43981821705-webrtc-summary.json).
- [Later native HTTPS resident raw report](evidence/2026-11-16-43981821705-resident-webrtc.json)
  and [checked summary](evidence/2026-11-16-43981821705-resident-webrtc-summary.json).

The existing application/v2 and WebRTC/v1 validators accepted these runtime
reports without changes to their acceptance conditions. The native report was
checked against its six expected scenarios, exact clean source and recipe
identity, one authorized introduction, unchanged introduction counters during
application work, original accepted final outcome and two retained signed
records. These checks examine the recorded observations; the workflow supplies
the actual execution evidence. Raw files are byte-for-byte copies of the
downloaded artifact contents. Archive digests were checked independently.

## Exact source and artifact identities

| Item | Task/chat application | Later browser and resident quick gates |
| --- | --- | --- |
| Workflow | `43980256890` | `43981821705` |
| Job | `133695201939` | `133699941446` |
| Authored Chronolog head | `c76789fd7ad0b00e577dce32496f6a043035fe06` | `c3a7fd40df93d4e17f614a0c9ffa57e1e5959b01` |
| Clean checkout actually tested | `d3f31d0bb131494b749df3ab6f76d54f09111a5f` | `f58ace9850d9733f0e8ad2b2865285fab46a2c72` |
| Clean contrib recipe checkout | `7291598b566090d7893a209075861d57c29b1217` | `7291598b566090d7893a209075861d57c29b1217` |
| Tendriller source | `4d63f48c9a0f8e9765fe4d90541d67648fa20340` | No packaged Tendriller host in these gates |
| Artifact | `14282413966`, `browser-peer-43980256890-1` | `14282239022`, `webrtc-43981821705-1` |
| Archive SHA-256 | `aad5e051ce9e2d498d2448aaa4326e1aad549e3b1da3dcdb3ff38eb6d8febb33` | `7a4c0f1d3dda5c3a06fa0d519e6ffad9ac1548056295a249f34d9e0fb3966eec` |

The application and quick reports identify clean synthetic PR merges, rather
than claiming the authored branch head was the checkout. Both merges' parents
were verified through GitHub: main `abeb8f1aa8a2ab5f3331ef75aa0967c00cd099a6`
and their respective recorded `c76789fd` or `c3a7fd40` branch head. Both browser runs used Chromium
`158.0.8127.18`. The quick runtime records Node `v24.22.2` and `werift@0.27.0`.

| Preserved raw report | SHA-256 |
| --- | --- |
| Application/v2 | `cc9c89629684b9e4a592a93efafe5a45a0fa2f675e80d55b9ad5bbc13b5dfe49` |
| Later browser RTC/v1 | `db979ca970f6965813b3523aa1c1f6f79b61fbd5557a099fb327d189626ac2cd` |
| Later native resident/v1 | `78070aac0c99cce29c0512d5f83dd8a9dfab6ebc2c5548526193fba94c5ca024` |

The application report retains all eight public runtime/recipe/bundle/WASM
digests and its specimen manifest. Its engine SHA-256 is
`325f3269817099a9b600b40a97bd081f5d5e5078de0dd79670093468ed4b62b9`.
The later native gate's exact HTTPS recipe SHA-256 is
`b34d09f13844d4b5a44b2215965a2b67a7c9feb39fe4d7ad2689250386ef33e8`,
matching the preserved source. Its produced bundle SHA-256 is
`960dec9256aa884327d7b2a05d3d4d660191fad729f4e203594ecfd0fff672ec`.

## Actual task/chat behavior over RTC

The application scenario uses the explicit coordinated host introduction
specimen: both browser and native halves join the same bounded workerd
rendezvous. The host retires its signaling sockets after the complete offer and
answer. Signed records, detached bodies, finality evidence and ephemeral typing
then move over authenticated RTC channels owned by the browser Workers and
native peer. Its synthetic page sessions and loopback TLS bridge remain part of
the declared topology. Browser grants are provisioned by the fixture; live
participant approval remains a separate thin membership qualification.

The twelve checks cover the complete asset graph and captured-generation scope
recipe; two independently signed replicas; ephemeral typing without durable
events; disconnected competing task claims ordered by author time; a rejected
SQL guard with no effective intent; one resident effect dispatch; a delayed
durable reply that preserves newer typing; Worker termination before reply
delivery; reopening both layouts; retired signaling; new chat finalized while
the host listener is stopped; and signed-history catch-up after another RTC
introduction.

| Observation | Result |
| --- | ---: |
| Host application requests | 0 |
| Host application writes | 0 |
| Resident effect dispatches | 1 |
| Original signed records at each of three replicas | 19 |
| Final application order length at each replica | 18 |
| Host sockets during the warm outage | 0 |
| RTC logical bytes before the outage operation | 1,183,719 |
| RTC logical bytes after the outage operation | 1,253,470 |
| Additional RTC logical bytes during that operation | 69,751 |
| Reconnection attachment time | 314.5 ms |
| Declared application string bytes in catch-up | 786,432 bytes, or 768 KiB |
| Complete catch-up time | 50.016 seconds |
| Largest sampled native queued-byte observation | 198,250 bytes |

The host was recorded unavailable throughout the outage interval. Host and
browser signaling snapshots were exactly equal before and after the new final
chat operation. The recorded host snapshot stayed at six introductions, 4,382
sent JSON bytes and 5,226 received JSON bytes, with no active sockets. The
scenario then reopened the introduction listener for the later reconnect.

Both browser replicas and the native peer have signed-record digest
`rauDPJxldt27MjCkm2yEOueUkpEH8k6fZRnxsB14eFo` and capability digest
`gZZjh6LsWdSuAk2X4iwdmMPmXYuw5HI-0b1WyEBSEnY`. The original accepted and
rejected operation identities and terminal outcomes are preserved exactly
across interruption. The failed task claim remains `assert:task_unavailable`.
The separate captured-generation check rejects the stale edit and the accepted
exact retry adds zero records.

Catch-up contains four programs, each with sixteen 12 KiB event strings. Its
reported elapsed time includes transfer, verification and replay; it is not a
network throughput benchmark. The queue observation is sampled every 10 ms,
not a measured worst-case memory peak. The configured RTC queue limit remains
4 MiB, with separate bounded-framing tests covering saturation.

## Later public direct introduction and resident lifecycle

The later quick gates use the current `c3a7fd40` source, including separate
authentication, dispatch, response-inactivity and hard request-lifetime bounds.
They exercise the default direct resident introduction primitives independently
of the coordinated task/chat fixture.

The browser gate transfers its RTCDataChannel into the exclusive OPFS Worker,
closes the public HTTP introduction listener, authors accepted final operations
on both sides, transfers a detached body, retries the original browser operation
and compares complete signed history. It exchanged two SDP descriptions totaling
1,153 UTF-8 bytes. After host shutdown the browser sent 13,672 and the native
peer sent 538,073 logical frame bytes. The 524,325-byte detached body matched its
expected SHA-256. Both peers retained the same three original signed records;
the browser retry authored none. All host counters remained unchanged, with
zero application requests and zero new signaling messages.

The native gate bundles the exact standing HTTPS resident task. Its six checks
verify route/origin/admission refusal, an admitted signing key without a reader
grant, one authorized cold connection through `context.connectPeer`, original
accepted history without another introduction, task shutdown, immediate abort
before listening and occupied-port startup cleanup. TLS verifies the generated
loopback certificate. The authorized introduction used one POST with 681 request
and 681 response body bytes. All resident introduction counters stayed unchanged
during application work. The report's one failed peer is the intentional
admitted-but-ungranted negative case.

## Remaining qualification at this checkpoint

The `c76789fd` thin membership report declares `passed: false`; it completed nine
named checks and failed before the final fresh-device recovery result. The
enrollment readiness, revocation and administrator-restart requirements remain
part of that separate gate. The current-source full workflow
[43981821658](https://github.com/werg/chronolog-db/actions/runs/43981821658) has
reported an application-step failure while its thin membership step is still
running. Its shared artifact was not yet available when this note was recorded;
the failure's cause has not been examined. No cause or current-source application
success is inferred from the earlier passed report or the separate quick gate.

All peer-byte counters here measure logical authenticated frame payloads.
They exclude RTC framing headers and credit messages plus IP/UDP/DTLS/SCTP
overhead; SDP JSON and SDP text counters have their separately declared bounds.
These are loopback measurements with explicit fixture accounts. They do not
establish deployed identity-provider behavior, public NAT reachability, TURN
interoperability, real device suspension, independent blob durability or provider
billing. The [deployment handoff](deployment-qualification-handoff.md) retains
those separate operational qualifications.
