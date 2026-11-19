# First clean native and browser composition

The exact source tuple below passed the independent consuming fixture on
2026-11-19. This is a historical checkpoint, before the maintained captured paging
and read-scope extensions. It does not qualify a later source tuple.

| Component | Exact source | Public archive SHA-256 |
| --- | --- | --- |
| Contrib consumer | `f00743b2321f1aaca006073007bd8e6f549f5660` | Source tree `9b75813eb256d9cebace6c0013eded71838529be` |
| Tendriller core | `46f19e6590713f8eb100e41811e28253cbadc63e` | `53778dc0b4e71226394bfc46189ac405926cd03b8c01937c900b122a431013e1` |
| Chronolog peer session | `f0b71005577dec3704f2363ddde3a78ad0eb0000` | `c33c152ea26a980ee12139e59fa08c89f5714e06e3e9eb3d254cfbf336edcc5f` |

All three sources reported `dirty: false`. The [composition record](composition-f00743b.json)
preserves the source trees, report hashes, engine identity, runtime, topology,
observations and individual measured samples. The [successful workflow](https://github.com/werg/tendriller-contrib/actions/runs/44586793682)
ran job `135781829454`. Its evidence artifact `14559989744` has ZIP SHA-256
`f1c1c703aaceff8329b4d1a7d26e83fa9392dac975cb06a31d20adce3c8dec60`.

## Observed behavior

All 26 native gates passed: eight independently retained signing profiles,
32 real attached views, authority and origin attribution, exclusive claim races,
raw-writer guards, immutable operation lineage, independent review policies,
scoped live runs, cancellation acknowledgment, generation fencing, explicit
rebind, original operations after store reopen, independent drafts and references.

The two authored browser layouts passed against the same public archives and
actual SQLite/WASM/OPFS storage. Chromium `158.0.8127.18` exercised both `auto`
selection and explicitly `elected` ownership. Both selected the fenced dedicated
Worker required by this synchronous OPFS profile. A forced SharedWorker request
was rejected with `OWNER_STORAGE_UNSUPPORTED` before opening storage.

Both browser journeys exercised addressed requests, exclusive claims,
cross-view conversation updates, unsent draft and focus/selection preservation,
same-view reload with a new endpoint incarnation, explicit responsibility
transfer, accepted result and synthesis, suspend/resume, detach isolation, and
retained signer/history/operation recovery after owner exit. The WASM binary
SHA-256 was `684323b9d886dd758d1839f32412101a5c1c964885310395a0a40991336cb8eb`.

## Measured local scale

The native topology used one Linux Node `v24.22.3` process, eight local retained
stores, authenticated in-process coordinator-centered links and four MessagePort
attachments per signer. Each signer had member data authority and control
administration; only the coordinator had schema and collaboration administration.

| Measurement | Samples | Median | 95th percentile |
| --- | ---: | ---: | ---: |
| Command start through selected-history applied result | 23 | 774.04 ms | 1671.26 ms |
| Explicit all-link synchronization boundary | 8 | 313.29 ms | 886.43 ms |
| Concurrent view queries | 32 | 1811.56 ms | 2049.71 ms |
| Retained store and session reopen | 1 | 29.96 ms | 29.96 ms |

The complete native journey took 32.59 seconds. Peak process RSS was
314,322,944 bytes; sampled heap use peaked at 84,887,272 bytes. A noisy endpoint
hit its stream quota while its sibling continued querying. The public API did
not expose a signal-drop counter, so that value remains `null`. These observations
establish a bounded local composition, without a performance budget or claim
about Internet latency.

No physical phone, deployed host/relay, external model/provider, conversational
resumption or exactly-once external effect was qualified by this run.
