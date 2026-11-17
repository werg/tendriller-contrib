# Browser/native WebRTC after the fixture host stops

[Chronolog workflow 43976651713](https://github.com/werg/chronolog-db/actions/runs/43976651713)
passed all five actual browser/native RTC assertions on 2026-11-16. The browser
transferred its untouched data channel into an exclusive OPFS Worker, exchanged
authenticated Chronolog history with native Werift, and completed new application
operations after the loopback introduction/page host had stopped.

The [raw report](evidence/2026-11-16-43976651713-webrtc.json) is an exact byte copy
from the downloaded workflow artifact. The
[derived summary](evidence/2026-11-16-43976651713-webrtc-summary.json) passed the
strict contrib [RTC evidence validator](https://github.com/werg/tendriller-contrib/blob/11c445e4d25e7b8ca415f3327c8049fcadc9f547/cookbooks/run-a-peer-application/checks/webrtc-report.mjs). It preserves
the raw report hash, actual source/runtime identities, original operations and
the precise scope of the observations.

## Exact source and artifact

| Item | Identity |
| --- | --- |
| Authored Chronolog PR head | `a14ac3a3126b0afa6bbbaf59ac07d7e316416f4a` |
| Clean PR merge actually tested | `0f2730d14349d32f496a25427c52b1e6c72e2cd4` |
| Browser | Chromium `158.0.8127.18` |
| Native process | Node `v24.22.2`, `werift@0.27.0` |
| Archive | Artifact `14280449825` |
| Archive SHA-256 | `8c55207bc1477e37a925fd34e24fd7ab4715020ef1546571a464b65d9f3e62b0` |
| Raw report SHA-256 | `7644ffd618457d9b461231ec3975524dbb19fe7b2a2e9a4e91641964f16c6ee4` |
| Contrib validator revision | `6b43171f1b4aedf42cd13604c4363cc4a59865ed` |

The downloaded archive was verified against the workflow artifact digest before
extraction. The checked-in raw report was compared byte-for-byte with the
extracted report. The tested core checkout records `dirty: false`. Contrib
documentation added after this run does not change that tested source identity.

## What ran

| Observation | Recorded result |
| --- | ---: |
| Complete SDP descriptions | 2 |
| SDP UTF-8 bytes | 1,154 |
| Additional signaling messages after introduction closes | 0 |
| Browser logical peer frame bytes sent after host shutdown | 13,672 |
| Native logical peer frame bytes sent after host shutdown | 538,073 |
| Detached payload delivered after host shutdown | 524,325 bytes |
| Browser-authored records retained at each peer | 1 |
| Native-authored records retained at each peer | 2 |
| Total records retained at each peer | 3 |
| Final accepted original operations | 2 |
| New authored records from exact browser retry | 0 |

Both signed-history digests are
`e983b04f7ae8c9791bab0191ed6005a2326db9ae2b7b0ae3a82efb357b775961`.
The detached payload's expected and received digests both equal
`17fc7a9268bf0346c1069a0c01adedadd5e0f2dabe2503c7d40b5b9a4c0c9d7a`.
The report preserves all original record IDs and both final event transactions.

The fixture host had served four requests, 647 request-body bytes and 555,491
response-body bytes, including initial assets and introduction. Every recorded
host counter was unchanged after shutdown; hosted application requests were
zero. The peer frame counters measure logical payload bytes. They exclude RTC
packet headers, credit messages and IP/UDP/DTLS/SCTP overhead; these are not
provider-billed network counters.

The browser retry kept its original proposal/transaction identity, deterministic
order key, admissibility and accepted final decision. Its observation time and
replica revisions advanced after the separate native operation. Those fields
describe the observing replica, so the validator preserves them without
requiring them to remain equal. The browser's authored-record list stayed
identical before and after retry.

## Scope of this evidence

This run used a loopback HTTP offer/answer fixture and loopback UDP RTC with
explicit native interface selection. It establishes actual browser Worker
ownership, browser/native interoperability, original final operations, intact
detached bytes and retained history after that fixture host stops.

It does not exercise the newly added public direct-HTTPS offer handler, the
native resident task recipe, packaged Tendriller rendezvous, mixed SQL/task
application behavior, deployed login, public NAT connectivity, TURN or provider
billing. Those paths require their own runs under their exact source and artifact
identities. Later public-handler qualification will be recorded separately; this
raw report remains unchanged and is not relabeled as that evidence.
