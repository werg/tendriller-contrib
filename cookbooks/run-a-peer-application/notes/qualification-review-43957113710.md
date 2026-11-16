# Qualification after the implementation review

[Chronolog browser workflow 43957113710](https://github.com/werg/chronolog-db/actions/runs/43957113710)
passed in full on 2026-11-16 after integrating the advanced upstream bases,
review fixes and rebuilt public artifacts. This is a new source/artifact pairing.
The earlier [application](evidence/2026-11-16-application-pilot.json) and
[thin-membership](evidence/2026-11-16-thin-membership.json) reports remain unchanged
and retain their original `a3797d5` specimen and `5cfa0444` authored core pins.

The new raw reports are exact copies of the workflow artifact:

- [Application pilot](evidence/2026-11-16-43957113710-application-pilot.json):
  nine checks, consisting of the build check, one native scope/reset qualification
  and seven browser/runtime assertions. Both task/chat layouts ran through the
  selected public backend; one resident effect dispatched and no host application
  writes occurred.
- [Thin membership](evidence/2026-11-16-43957113710-thin-membership.json):
  seven runtime assertions plus the independent package/bundle/import check.
  The actual default Cloudflare provider ran in workerd, with a separate native
  authority and a fresh independently keyed Chromium/OPFS device.

Both reports say `passed: true`, record Chromium `158.0.8127.18` and contain no
page errors. Workerd uses synthetic authenticated accounts. These results do not
establish deployed Cloudflare authentication, public-network routes, provider
cost or operational storage-loss recovery.

## Exact pairing and preserved archive

| Item | Identity |
| --- | --- |
| Authored Chronolog PR head | `1b5b8f26c0e36c7cff3534d4ae465eaa57154c9c` |
| Clean PR merge actually tested | `3780499f18435a8eddfa3dcecf511ca908e57087` |
| Public Tendriller SDK/runtime/engine source | `283f210c1fb9dc2c1d27e9bbd9e8813234a40a70` |
| Embedded portable membership source | `cc18d15ed5b5580b386fb2fc3e986afab935c7de` |
| Tested contrib pages, builders and wrappers | `8449017159b2657a2b0d9bde398322dac78ee2d1` |
| Browser job | `133614643346` |
| Archive | Artifact `14273111973`, `browser-peer-43957113710-1`, 348,673 bytes |
| Archive SHA-256 | `0be4f8fdbad4bfb47b0db0cc8c35528f62c27cdc1ebe178807ca476c95ca7d48` |
| Application report SHA-256 | `d0e7fc3d14284b16aadd62b8d0c9f322a7c65ab16e8150712302a72ef7f140bd` |
| Thin report SHA-256 | `da6830b716e78a13a72ac97057c1e1cb6c979e975adf9da756c48f44a513056c` |

The reports independently record clean checkout states for the actual merge,
contrib and Tendriller sources. The embedded membership provenance has a clean
source and 56 audited runtime inputs. Its inventory excludes the application
materializer, native SQLite/SSB runtime and full node executor.

Chronolog `764a57d12f564e54577ed5e022a9fd132436671e` is the public-artifact repin
checkpoint underneath the authored head; it is not a Tendriller source revision.
The later authored Chronolog commit contains documentation. Future documentation
commits in this repository do not change the tested contrib pin above.

| Artifact component | SHA-256 |
| --- | --- |
| Public SDK tarball | `5983608ad4e3315b87b490e03fe11a86be74f82e9f830931c2062215cb5bc219` |
| Public engine tarball | `bb9039154d67dc0e21d65d3d2cd712834fa276c824b6f32ddc59c6edcee41607` |
| Packaged runtime kernel | `c795e788c146e6a0abd4511fff9f931abb34346993fd80d9aff1bd5cf00704be` |
| Public application module | `997058cd67a36137f360284f0ae11c4ba1b373a36380ec27f9359049bd04b841` |
| Built contrib scope module | `149bda33913a3afc6e0e06bc1c0e16a2d2c80acfc18d4e97f26ae71c63787aa2` |
| Complete specimen manifest | `4d51dd5ee310267212180b552546ec3f512571ccb8ac8bd07205acfde32ff25b` |
| SQL WASM | `0c106a6a89a4c44d10ed679fbc817d7dd0beb6600469fc0d2a8a65499183fa81` |
| WASM manifest | `eb2d9a21be7803cea662afccbf4af46e936b45ab529a0300bf3ba47c63eb11ad` |
| Membership module | `8b2852638142746acde2af4ed9f09e7f178850458751ab371d0f5bb5df9e46b7` |
| Membership declarations | `cedf89a6012591a4f6044b692b2eb8fac9bf28797a8fd30a4f845603c16d6a61` |

The raw thin report additionally records the browser Worker and public membership
API bundle hashes. The artifact retains engine provenance, bundle inventories,
host results and screenshots. The downloaded archive was checked against the
workflow's reported SHA-256 before extraction; copied report bytes were compared
with those extracted files.

## The captured-generation acceptance case now runs

The [scoped JSON recipe](scoped-json-state.md) uses ordinary SQL/emit programs.
The [native qualification helper](https://github.com/werg/chronolog-db/blob/1b5b8f26c0e36c7cff3534d4ae465eaa57154c9c/tools/lib/application-scope.ts)
imports its exact built module through the public application adapter. It pauses
automatic authority ordering so an edit is durably authored before a separately
authored reset is ordered first. It then delivers the old edit without rewriting
its captured generation.

Observed results in `diagnostics.scopeReset` are:

| Observation | Result |
| --- | --- |
| Final generation | `1` |
| Stale edit | Final `assert:scope_generation_changed` rejection, retaining its original proposal |
| Effective events | `3`: initialization, the accepted earlier edit and reset; none from the stale edit |
| Exact accepted retry after reset | Original proposal and outcome; zero new records |
| Changed generation under the accepted operation ID | Refused as an operation conflict by the same passing helper |
| Current value after both retry attempts | The generation-1 reset value remains unchanged |

This closes the local implementation gap represented by P2P-04. It neither adds
a compatibility conversion nor moves an authoritative guard back to Cloudflare.
The application captures its guard once; the backend preserves original signed
intent and its result.

## Application behavior and timings

The seven browser/runtime assertions cover independent OPFS identities and one
team-owned task; authorized typing expiry without a durable event; disconnected
competing claims with one final winner; SQL-guard suppression of losing job intent;
one scoped final worker result; delayed response and abrupt Worker recovery; and
rebuilding both layouts without redispatch or host application writes. The raw
check list gives the exact grouping.

The application fixture deliberately pregrants its two identities. Live device
creation and Cloudflare approval remain the separate thin-membership scenario.
The same updated page sources include the focused review fixes for malformed
domain records, absent operation references and exact editor snapshots. Their
targeted behavior has 24-test collection coverage; this browser run establishes
the recorded public-runtime task/chat scenarios rather than inventing additional
browser assertions for each model case.

| Recorded elapsed observation | Milliseconds |
| --- | ---: |
| Browser reaches final rejected-job status | 7,671 |
| Native resident worker result | 256 |
| First browser applies the worker result | 11,398 |
| Second browser applies the worker result | 13,695 |

The runner observes passive public finality/applied-event progress before its
short automatic DOM assertions; it does not manually refresh the page to make
the assertions pass. These are one CI run's observations, not a production
latency contract.

## Thin membership and measured traffic

The gate again exercised durable membership-only root ownership and separate
native schema/ordering ownership; device-created keys and account-bound requests;
owner review and verified active controls/HPKE keys before application readiness;
lost approval reply plus real Durable Object eviction and exact retry; direct
native-path writer rejection while host login survives; abrupt OPFS Worker
replacement; and removal of future reader access without claiming erasure of
already decrypted history. The ADMIN scenario boundaries in the
[architecture guide](thin-membership-administration.md#acceptance-map-and-remaining-boundaries)
remain applicable.

| Workload | Candidates | SQL string bytes each | Descriptor bytes | Detached signed-envelope bytes |
| --- | ---: | ---: | ---: | ---: |
| Small | 4 | 16 | 568 | 2,668 |
| Large | 4 | 196,608 | 576 | 789,092 |
| More small | 8 | 16 | 1,136 | 5,320 |

At equal candidate count, the large payloads change descriptor sizes by eight
encoded bytes while the detached envelopes grow substantially. Doubling the
small candidate count doubles descriptor bytes. Thin administration still has
history-dependent metadata and storage work.

| Complete scenario counter | Bytes or count |
| --- | ---: |
| Signed membership requests | 21 |
| Membership request bodies | 13,115 bytes |
| Membership response bodies | 26,251 bytes |
| Descriptor transfers, including repeated ranges | 33 |
| Candidate descriptors | 2,706 bytes |
| Inline control descriptors | 9,552 bytes |
| Inline signed control envelopes, already included in the preceding row | 7,504 bytes |
| Application envelopes received by administrator | **0 bytes** |
| Unexpected administrator endpoint requests | **0** |
| Full-peer framed inbound traffic | 57,120 bytes |
| Full-peer framed outbound traffic | 1,655,712 bytes |

Control envelopes must not be added again to their containing descriptor totals.
Response bytes also contain framing, ordered evidence and certificates. Full-peer
traffic includes synchronization overhead and repeated transfers. These counters
measure the actual loopback boundaries; they are not unique retained storage,
Internet throughput, relay billing or Cloudflare savings estimates.

## Related gates and remaining work

The same browser workflow passed six actual native/WASM conformance tests,
seven SQL-free checks, eight SQL/OPFS checks and five public enrolled-bridge checks.
[Quality 43957113773](https://github.com/werg/chronolog-db/actions/runs/43957113773)
passed 772 tests across 128 files; its six WASM skips are exercised by the actual
WASM gate above. It includes nine native SSB tests and matching Linux/macOS
semantic digest `224e7ee7691e7cbe579478171c9493c8d543870398f4eedfe8cd7611f579150e`.
[Chaos 43957113669](https://github.com/werg/chronolog-db/actions/runs/43957113669)
passed healed convergence with three nodes and six SSB links: 79 of 82
publications completed, with three local failures during fault injection.

Tendriller's [public-service run 43956487412](https://github.com/werg/tendriller/actions/runs/43956487412)
passed its 801 checks and public-package consumption on Node 22/24. The Node 24
browser suites passed 87 cases; their one speech skip is covered by the passing
[real-model speech workflow 43956487562](https://github.com/werg/tendriller/actions/runs/43956487562).
Contrib `8449017` independently passed
[collection 43954503588](https://github.com/werg/tendriller-contrib/actions/runs/43954503588)
and [public-artifact integration 43954503785](https://github.com/werg/tendriller-contrib/actions/runs/43954503785),
including 24 collection/model tests, 56 reading entries, existing independent
browser adaptations and three actual-host trusted-reference tests.

Reproduce the paired gates with the explicit
[application and membership commands](../checks/README.md); the raw reports retain
the actual invocation. Start from the exact checkouts and build their public
artifacts rather than combining packages from another run.

Deployment issues [#14](https://github.com/werg/tendriller-contrib/issues/14),
[#15](https://github.com/werg/tendriller-contrib/issues/15),
[#16](https://github.com/werg/tendriller-contrib/issues/16) and
[#17](https://github.com/werg/tendriller-contrib/issues/17) stay open. Public
home/mobile/corporate routes, measured provider costs and retained storage,
operational disk-loss/backup recovery, and real authentication/privacy operations
still require their stated deployed evidence. This requalification does not close
those gates or imply a production deployment.
