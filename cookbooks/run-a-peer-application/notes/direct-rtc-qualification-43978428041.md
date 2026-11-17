# Direct introduction and resident lifecycle qualification

[Chronolog workflow 43978428041](https://github.com/werg/chronolog-db/actions/runs/43978428041)
passed the standing native HTTPS task's six runtime checks and the actual
Chromium/native RTC gate's five checks on 2026-11-16. This source pairing uses
the public direct HTTP signaling client and resident offer handler. The separate
native gate bundles and runs the exact contrib HTTPS resident-task recipe.

The preserved reports are exact copies from the workflow artifact:

- [Browser/native raw report](evidence/2026-11-16-43978428041-webrtc.json) and
  [validated summary](evidence/2026-11-16-43978428041-webrtc-summary.json).
- [Native HTTPS task raw report](evidence/2026-11-16-43978428041-resident-webrtc.json)
  and [checked summary](evidence/2026-11-16-43978428041-resident-webrtc-summary.json).

The earlier [fixture-only RTC run](webrtc-qualification-43976651713.md) remains
unchanged under its own source identity. Its success was not promoted into
evidence for the later public HTTP handler or resident recipe.

## Exact tested pairing

| Item | Identity |
| --- | --- |
| Authored Chronolog PR head | `0508be9103598b4a9928493f874119c13dda3291` |
| Clean synthetic PR merge actually tested | `8d6ec01ce4b5dc901317dcb625e913239b8cbcfe` |
| Main parent of that merge | `abeb8f1aa8a2ab5f3331ef75aa0967c00cd099a6` |
| Exact contrib recipe checkout | `7291598b566090d7893a209075861d57c29b1217` |
| Runtime | Node `v24.22.2`, Chromium `158.0.8127.18`, `werift@0.27.0` |
| Workflow job | `133688321684` |
| Archive | Artifact `14282706239`, `webrtc-43978428041-1`, 10,240 bytes |
| Archive SHA-256 | `1a5c7297e78abc6fe1b6342a10b987788418361008faf8e105b56bb5667d1983` |
| Browser raw report SHA-256 | `2664c7e495d18f45e1e6440b799abcb70095c64f632de67da4349f856741700f` |
| Resident raw report SHA-256 | `26d76098ed330444fb4b8b01074f667ea9dd125f01c808a2d403358ce4bdc41d` |
| Resident recipe SHA-256 | `b34d09f13844d4b5a44b2215965a2b67a7c9feb39fe4d7ad2689250386ef33e8` |
| Produced resident bundle SHA-256 | `960dec9256aa884327d7b2a05d3d4d660191fad729f4e203594ecfd0fff672ec` |

The archive digest was checked before recording these reports, and the copied
raw bytes were compared with the extracted files. GitHub's commit metadata
confirms the tested merge's two parents. Both source checkouts report
`dirty: false`. The resident recipe digest also matches the preserved source.
Subsequent documentation and validator commits do not alter the tested recipe.

## Standing HTTPS resident: actual cold contact and cleanup

The native gate starts the independently running `AgentApplication` task with
its own HTTPS listener. Its client verifies the generated loopback certificate
through the trusted CA input; no TLS verification is disabled.

The six passing runtime checks cover:

1. Exact routing, allowed-origin enforcement and introduction admission. An
   unapproved browser origin is rejected before admission or RTC allocation.
2. An admitted caller whose signing key has no reader grant. It receives no
   authenticated application history even though its HTTPS introduction was
   allowed.
3. A legitimate cold client using one direct POST and the real daemon
   `context.connectPeer` authentication and replication path.
4. Original signed records and an accepted final native operation after the
   introduction closes, with no additional HTTPS introduction work.
5. Task cancellation disposing the HTTPS listener, authenticated RTC session,
   tracked connections and external abort listeners.
6. Immediate cancellation before listening, and an occupied-port startup
   failure, both cleaning up without a late listener or retained abort handler.

The authorized connection exchanged 681 request-body bytes and 681 response-body
bytes in its one introduction request. All resident counters remained identical
through the application operation: six total HTTP requests, two offers, one
accepted peer, three admission/origin refusals and one deliberately failed
ungranted peer. That deliberate negative case explains `failed: 1`; it is not an
unexplained runtime failure. Both retained original records were delivered over
RTC. The authorized session's cumulative logical frame counters were 9,634 bytes
sent and 11,236 bytes received, including its authentication and range work.

## Browser Worker: application progress with introduction stopped

The Chromium gate uses the public HTTP offer/answer client and native handler
on loopback. Its browser transfers the untouched data channel into the exclusive
OPFS Worker, which owns framing, signing identity and authenticated replication.
After the HTTP listener stops, both peers author accepted final operations,
exchange a detached body, retry the original browser operation and converge on
the same original signed records and final events.

| Observed boundary | Result |
| --- | ---: |
| Complete SDP descriptions | 2 |
| SDP UTF-8 bytes | 1,155 |
| Additional signaling messages after introduction closes | 0 |
| Browser logical frame bytes sent after host shutdown | 13,672 |
| Native logical frame bytes sent after host shutdown | 538,073 |
| Detached payload delivered after shutdown | 524,325 bytes |
| Retained records at each peer | 3: one browser-authored, two native-authored |
| New browser-authored records from exact retry | 0 |

Both signed-history digests are
`930de8498c8521fa54daf4813af0bf8c1750ff7834c2e61d77440827cd9d4630`.
The expected and received payload digest is
`17fc7a9268bf0346c1069a0c01adedadd5e0f2dabe2503c7d40b5b9a4c0c9d7a`.
The fixture had served four requests, 697 request-body bytes and 561,999
response-body bytes including initial assets. Every recorded counter stayed
unchanged after listener shutdown, and application requests to that host were
zero. The browser retry preserved its proposal, deterministic order and immutable
accepted decision without authoring another record; later observation revisions
and timestamps remain visible in the raw report.

## Measurement scope

Peer byte counters measure logical authenticated frame payloads, excluding RTC
packet headers and credits plus IP/UDP/DTLS/SCTP overhead. The native session's
cumulative counters and the browser gate's post-shutdown deltas measure different
intervals and must not be added into a provider traffic estimate.

These two runs establish the tested direct introduction primitives, native
resident composition, actual Worker transfer and host-independent RTC exchange
on loopback. They do not establish mixed SQL/task behavior through packaged
Tendriller rendezvous, fresh-device Cloudflare enrollment/revocation, deployed
certificate provisioning and login, public NAT reachability, TURN interoperability
or provider costs. Those remain separately reported qualifications under their
own exact source and artifact identities.
