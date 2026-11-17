# Compact membership and resident recovery at `89aee742`

The compact control protocol excludes application descriptors and bodies from
participant administration. The public resident recipe recovers an authenticated
Worker connection while retaining its original operations. Clean-source CI
qualified both boundaries on 2026-11-17. This note covers native membership and
direct browser/native RTC; qualification of the rebuilt packaged Tendriller host
remains a separate integration step.

## Implementation and exact sources

Chronolog's [signed-inclusion-v2 proof contract](https://github.com/werg/chronolog-db/blob/89aee742709d33af5dcbc27241b1e241ab6c063b/docs/membership-control-proofs.md)
commits the complete finalized control count and root in each signed closure.
The administrator verifies that projection and a bounded checkpoint. Full peers
verify the original complete receipt history and recompute the projection.
Governance and application receipt progress have separate cursors; adding
application work does not add retained administrative controls. The thin
administrator trusts the genesis-pinned authority to commit the complete
projection; auditing a signed omission requires the full receipt history.

The qualified [browser recipe](https://github.com/werg/tendriller-contrib/blob/15053301742f617f8b07c4b403d495c8b57a6ea1/cookbooks/run-a-peer-application/snippets/connect-resident-worker.mjs) delegates
retry and cancellation to Chronolog's session supervisor. It transfers the
data channel synchronously, waits for Worker authentication, fences stale
attachments and retires both transport and Worker lifetimes on failure. The
[resident task](https://github.com/werg/tendriller-contrib/blob/15053301742f617f8b07c4b403d495c8b57a6ea1/cookbooks/run-a-peer-application/snippets/serve-resident-webrtc.mjs) delegates HTTPS and
shutdown ownership to Chronolog's Node-only resident listener. A healthy
supervisor has no retry timer, host heartbeat or discovery poll.

| Source identity | Exact value |
| --- | --- |
| Authored Chronolog head | `89aee742709d33af5dcbc27241b1e241ab6c063b` |
| Clean PR merge actually tested | `289ca401c61fa177a43989bc806202723223ad43` |
| Main parent | `abeb8f1aa8a2ab5f3331ef75aa0967c00cd099a6` |
| Shared authored/tested tree | `ddcb3143bf1d751fd8ee674175b46a2ba55aa3ca` |
| Clean contrib recipe and validator source | `15053301742f617f8b07c4b403d495c8b57a6ea1` |
| Runtime | Node `v24.22.2`; Chromium `158.0.8127.18`; `werift@0.27.0` |

GitHub's [merge commit](https://github.com/werg/chronolog-db/commit/289ca401c61fa177a43989bc806202723223ad43)
confirms both parents and the identical source tree. The native measurement
used Linux x64, signed loopback HTTP, persistent SQLite stores and actual
DoltLite, with separate administrator/authority identities in one process.

## Preserved execution evidence

| Execution | Preserved raw report and summary |
| --- | --- |
| [RTC workflow `44044904155`](https://github.com/werg/chronolog-db/actions/runs/44044904155), job `133908082727`: 44 transport tests and six browser scenarios | [RTC/v2 raw](evidence/2026-11-17-44044904155-webrtc.json), [strict summary](evidence/2026-11-17-44044904155-webrtc-summary.json) |
| Same workflow: six native HTTPS resident scenarios | [Resident/v1 raw](evidence/2026-11-17-44044904155-resident-webrtc.json), [checked summary](evidence/2026-11-17-44044904155-resident-webrtc-summary.json) |
| [Quality workflow `44044904221`](https://github.com/werg/chronolog-db/actions/runs/44044904221), job `133908082866`: native cost measurement | [Cost/v2 raw](evidence/2026-11-17-44044904221-membership-cost.json), [strict summary](evidence/2026-11-17-44044904221-membership-cost-summary.json) |

The RTC and cost reports passed the existing contrib v2 validators unchanged.
The resident report passed a focused check of the exact producer's six
scenarios, source and recipe identities, authorization, final outcome, signed
records, and unchanged introduction counters. Contrib has no separate resident
report validator. Validation checks recorded observations; the workflows provide
execution provenance. All six linked files are unchanged copies of the downloaded
raw reports or their already validated summaries. Historical evidence is intact.

| Downloaded archive | Artifact, size and SHA-256 |
| --- | --- |
| `webrtc-44044904155-1` | `14310987617`; 11,168 bytes; `8c2c2f277cef9596e9168f2e38e3467809ffeb4d8bebe2474acf1909d57312d4` |
| `membership-cost-44044904221-1` | `14310908619`; 6,487 bytes; `28101646fc84636649b50a50a344333772ba2edccfdadf8f39bffae0ea2d5a65` |

| Raw report | SHA-256 |
| --- | --- |
| Browser/native RTC | `7f67d816a8f2ee9a362b38ac4acbbea8d7e53e49aba88d220ad20c8b8301ef0c` |
| Native HTTPS resident | `5fb11beeb790a5a0608b74c95e76ad6ad7815ed8a6e2e32a7718b8b330278188` |
| Native membership cost | `dfebae56af4bd6db21ed1fbfcf095f2c104f481e4f4f0c0aa35a5fd3b674fdbd` |

Archive sizes and hashes match GitHub metadata. The two public recipe hashes
independently match the pinned contrib files. Emitted build graphs include the
core resident helper and supervisor. Executable bundles are absent from the
archive, so their report hashes remain producer-recorded.

## Administrative work follows controls

The native runner explicitly synchronizes the administrator after each workload.
Its three independent application workloads produced:

| Phase | Candidates | Native detached envelope bytes | Receipt coverage | Verified controls | HTTP response bytes | Administrator retained value bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Four small | 4 | 2,628 | 29 | 1 | 1,160 | 6,092 |
| Four large | 4 | 789,052 | 47 | 1 | 1,160 | 6,092 |
| Eight small | 8 | 5,240 | 81 | 1 | 1,160 | 6,092 |

Each phase transferred **zero application descriptor or body bytes** to the
administrator, received one closure checkpoint, and performed one logical
checkpoint put of 2,443 bytes. The explicit sync still has a request and durable
write; larger application bodies and more candidates add no administrative
control entries in these observations.

All twelve phases passed, including lost approval reply, administrator reopen,
exact/conflicting decision retries, writer and reader revocation, rotation and
future-epoch data. The complete run made 34 membership requests with 19,785
request and 44,405 response body bytes. It finished with seven verified controls
covering receipt 126 and checkpoint 127. Application descriptor/body traffic
remained zero. Administrative storage recorded 81 logical puts, 155,567 written
value bytes and 26,722 retained value bytes. Participant decisions and key wraps
still contribute governance work and storage.

## Authenticated recovery and host independence

The browser gate interrupts the Worker's authenticated peer session while the
Window retains RTC ownership. The actual public recipe recovers in **323.753 ms**
and retries the original operation with the same proposal, final decision,
order key and authored records. Exactly two introductions each use one POST and
close signaling. Both selected ICE pairs are measured **direct**, with local
`prflx` and remote `host` candidates. The single handler termination is attributed
to the injected `WEBRTC_CONNECTION_ENDED`; no handler failure is left unattributed.

After the combined page/introduction listener stops, all host counters remain
unchanged and application requests remain zero. New original browser/native
operations reach accepted finality over RTC. The peers exchange 14,096 browser
and 538,464 native logical payload bytes, deliver an intact 524,325-byte detached
body, and converge on four original signed records with matching history hashes.
Four SDP descriptions for initial connection and recovery total 2,309 bytes;
the two introduction POSTs total 1,393 request and 1,362 response JSON body bytes.

The separate native resident gate verifies HTTPS with a trusted generated
certificate, admission/origin refusal and rejection of an ungranted reader.
The authorized cold connection uses one POST with 681-byte request and response
bodies. Original signed-history exchange changes no introduction counters.
Task shutdown, cancellation before listening and occupied-port cleanup all pass.

## Limits and next integration boundary

These fixtures use loopback networks. Their direct ICE observations do not
establish public NAT reachability, TURN interoperability or mobile suspension
behavior. Peer counters exclude framing headers, credit messages and
IP/UDP/DTLS/SCTP overhead. Native process CPU/RSS combine both roles; logical
puts and file sizes are not billed provider units. No backup or second durable
blob copy was measured. The cost summary retains `providerCosts: null` and
`hostedPeerSavings: null`.

The rebuilt packaged Tendriller page host, inline bootstrap, current membership
artifact and complete browser enrollment/reopen flow need their own exact-source
integration evidence. The results above do not substitute for that gate or the
[deployment qualification](deployment-qualification-handoff.md).
