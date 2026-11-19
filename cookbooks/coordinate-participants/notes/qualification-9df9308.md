# Qualified native, browser and transport composition

The exact implementation tuple below passed the independent consuming gates on
2026-11-19: 31 native collaboration observations, 16 actual browser observations
in each of two ownership modes, and all seven existing peer transport/domain
gates. The browser and native collaboration reports were bound to the same public
archive bytes. The transport assembler independently bound its archive variants
and hosted participant to the same source tuple.

This note and the retained evidence were committed after the observed runs. The
tested Contrib implementation is `9df93084d2e56947ca6bc13691306ae0217cf63c`;
a later documentation commit is not silently substituted for that revision.
The [earlier clean checkpoint](qualification-f00743b.md) remains historical.

## Exact sources and public artifacts

| Repository | Source commit | Source tree |
| --- | --- | --- |
| Contrib consumer | `9df93084d2e56947ca6bc13691306ae0217cf63c` | `52b323db32f3b3e35526c26ab1e09253243e525a` |
| Tendriller core | `888e05f0fd7c5a51b580396b2aeb7b20ae771d98` | `0d9a33e96d01160f1710c789b6a73d4328993ccc` |
| Chronolog peer session | `d3efeb6d75ac24bb9b44899f27d6940475ab55e9` | `401597877f5f28dd9b24d721e20b238647ff48bf` |

All three sources report `dirty: false`. The consumers install the public
archives into fresh directories, validate their provenance and import declared
exports. They do not resolve sibling source checkouts as dependencies.

| Public archive | Version | SHA-256 |
| --- | --- | --- |
| Core SDK | `0.3.0-rc.10` | `a477f9a84f635b81d175f130ef951508cf1d68ad5a2f91ba6a6d9763ea7526cb` |
| Hosted engine | `0.3.0-rc.10` | `1d87d8d92e56bd7f1547e9ffde1006b632beaf94fe5b560fba9205309b25b94d` |
| Peer session, events | `0.0.0-gd3efeb6d` | `6fda9c4dea513c831a38c6bd890e75f284419112d274f7a95b05cf3b5132c801` |
| Peer session, native RTC | `0.0.0-gd3efeb6d-rtc` | `905ac464fb1a99cb00418363b1c44dfc6b8a80b774c6b0de481de83320940cf7` |
| Peer session, native SQL | `0.0.0-gd3efeb6d-sql` | `421c44be3c5f84d3576cb8a71a0b48026753eb6ce61f3eb0537f22fce1992a19` |
| Peer session, native and browser SQL | `0.0.0-gd3efeb6d-sql-wasm` | `ac36b21a99bf8e27a4dd48804fc768b4a0d31e95dfc8397a811c904b72eb932e` |

The SQL profile uses patched Doltlite `0.11.29`, SQLite Vec `0.1.9`, and the
`tx-id-v8` Chronolog patch profile. Its patch digest is
`5eab7980053e68d3e6749d6011cc145d361649d678b1823735c00ac1a96e5fa2`.
The actual browser engine was built with pinned Emscripten `4.0.20`; its WASM
SHA-256 is `684323b9d886dd758d1839f32412101a5c1c964885310395a0a40991336cb8eb`. The manifests retain the full engine source,
patch, binary and toolchain identities.

Core's host archive separately identifies its embedded control verifier as clean
source `d625546c70343a23e435fbfbcb398c40a6d0f69f`, tree
`81b8a717a949bd0a02cd70159889861c234c2906`, with host storage schema revision
`9`. That embedded identity is preserved verbatim; it is not relabeled as the
peer-session runtime source.

## Executed gates

The [collaboration workflow](https://github.com/werg/tendriller-contrib/actions/runs/44597905647)
ran job `135821122567`. Its native fixture exercised eight separately retained
signers and 32 real MessagePort attachments. The 31 named observations are kept in
the [collaboration composition](composition-9df9308.json), including:

- Independent signer authority, multiple attachments sharing an owner, endpoint and
  source attribution, malformed-port isolation and sibling survival after detach.
- Exclusive claim races, stale-fence rejection, fixed contribution slots, two
  independently executed review policies, accepted-result identities and explicit
  aggregate provenance.
- Raw signed SQL and DDL rejection, borrowed attempt-ID rejection, authenticated
  operation lineage, and malformed encoded JSON/duplicate-key/depth/nonfinite
  input rejection before those rows can poison public projections.
- Distinct messages whose thread/message tuples would collide under delimiter
  concatenation, idempotent identical retries and conflicting changed content.
- Captured query authority, bounded task/thread/result pages across newer writes,
  complete accepted-result summaries, cursor scope/revision rejection and cleanup
  after an independently failed reviewer read.
- Capacity recovery after a claim slot becomes free, followed by observer stop
  without closing the shared reliable network; generation fencing, explicit
  rebind, retained operation inspection after reopening, and independent drafts
  and pending-operation membership.

Both authored browser layouts ran in Chromium `158.0.8127.18` with the actual
SQLite/WASM/OPFS engine. Each `auto` and `elected` scenario passed all 16
observations: addressed work, an exclusive claim, remote updates preserving
unsent drafts and focused selection, reload retaining the view ID and original
full operation reference while changing endpoint incarnation, explicit endpoint
reassignment, an accepted contribution and final synthesis, suspend/resume,
detach isolation and retained history after the owner exits.

Each browser scenario also grew the workspace to eleven requests and nineteen
messages. It browsed bounded continuations across writes from the companion view,
refreshed explicitly and preserved local drafts. These counts describe the
authored interaction fixture; they are not a browser throughput benchmark.

Both SQL modes selected a fenced dedicated Worker because this synchronous OPFS
storage profile requires one. Forced SharedWorker selection rejected with
`OWNER_STORAGE_UNSUPPORTED` before opening storage. This qualifies automatic
capability selection and elected SQL ownership; it does not claim SQL storage
inside a SharedWorker. Core's separate event-profile fixture owns that boundary.

The [seven-route workflow](https://github.com/werg/tendriller-contrib/actions/runs/44597905623)
also passed every matrix entry and composition job `135822082456`:

| Gate | Job | Evidence artifact |
| --- | --- | --- |
| Direct authenticated events | `135821129468` | `14566581971` |
| Packed native RTC | `135821129118` | `14567106213` |
| Actual browser/native RTC | `135821129501` | `14566976837` |
| Native SQL task application | `135821129804` | `14566072893` |
| Actual local workerd hosted participant | `135821129703` | `14566862065` |
| Native WebSocket relay through local workerd | `135821129389` | `14566857042` |
| Browser WebSocket relay through local workerd | `135821130239` | `14567261152` |

Those fixtures retain their control-outage, selected-generation recovery,
original-operation and browser-retention observations. The browser relay uses a
bounded loopback bridge to the actual workerd WebSocket relay; it does not qualify
deployed WSS or public networks. The full [transport composition](peer-composition-9df9308.json.gz)
retains every original report digest, package provenance manifest, observed
boundary and limitation. Its statement that browser SQL is outside that older
transport fixture is scoped to that fixture; the separate collaboration
composition above supplies actual browser SQL evidence for this tuple.

## Measured bounded local scale

The native collaboration fixture ran one Linux Node `v24.22.2` process with
eight retained signing stores, authenticated in-process coordinator-centered
links, and four attached views per signer. Every signer had member data authority
and control administration; only the coordinator had schema and collaboration
administration. These explicit test grants are recorded per signer, not inferred
from participant labels or presence.

| Measurement | Samples | Median | 95th percentile |
| --- | ---: | ---: | ---: |
| Command start through selected-history applied result | 41 | 833.09 ms | 2999.69 ms |
| Explicit all-link synchronization boundary | 9 | 338.34 ms | 1943.16 ms |
| Concurrent view queries | 32 | 1554.92 ms | 1839.89 ms |
| Retained store and session reopen | 1 | 28.15 ms | 28.15 ms |

The complete native journey took 81.04 seconds. Peak process RSS
was 354,058,240 bytes; sampled heap use peaked at 90,205,176 bytes. The
composition preserves the individual samples, measurement definitions, CPU and
external-memory observations. Command timings include rejected commands through
their selected-history applied outcomes. The reopen value has only one sample.

A noisy endpoint hit its stream quota while its sibling continued querying.
The public API does not expose a signal transport-drop counter, so that value
remains `null`. This establishes the exercised eight-signer/32-attachment local
profile. It establishes no Internet latency, physical-device memory budget,
universal loss bound or production capacity promise; no arbitrary performance
budget is declared.

## Retained evidence and verification

| Evidence | Size | SHA-256 |
| --- | ---: | --- |
| Collaboration composition JSON | 15,983 bytes | `0744ca4a312b8b9f4795319f55aa9b045abc820838210c67dad8d06cb2a1d6bb` |
| Native report gzip, timestamp zero | 17,926 bytes | `6ab31549d166cf420d4426960fbc14475c6410999074c01f1f46d41e4fa4faa0` |
| Native report after decompression | 84,744 bytes | `2da72d05591c46dbc44367277b5882611185c92f855a2bb9f4f2c15a3ad8a0d7` |
| Browser report gzip, timestamp zero | 13,482 bytes | `882ffb6ef92706ce93718c15ff1bf5443f872f949d2f75e9531dfc9068ec2479` |
| Browser report after decompression | 60,786 bytes | `79a2af093c9937c54df8f67f16fa20d7a50924db86d465ca309d477c418e282e` |
| Transport composition gzip, timestamp zero | 178,253 bytes | `185fb455c32fb1ff10a3c057a4ed2824baa10ebc1b6ed725ddee081897a473b7` |
| Transport composition after decompression | 851,931 bytes | `9f66c1de09d5bd4dcbdd8556b7daae18f6d5ea0d4b1a79633a9ae4d8b65bb0ea` |

The original collaboration evidence artifact is `14567797435`, ZIP
SHA-256 `a2ed63461d70049bfe0e855efd1f0f5b3336960eb0aaf4012f8ca63faa42f834`. It contains the raw native/browser reports,
screenshots, dependency locks, exact public archives and browser engine assets.
The original qualified transport composition artifact is `14566946925`, ZIP
SHA-256 `af17103402b2dfc8a5ed09487e6cf6473c470c10c84bf240824d296ba82c22d4`.
The retained [native report](native-report-9df9308.json.gz) and
[browser report](browser-report-9df9308.json.gz) preserve every original observation
and allow the composition's raw-report hashes to be verified after CI artifacts
expire. Each gzip contains exact unmodified JSON extracted from its original
ZIP, compressed with an empty filename and `mtime=0`.

From the repository root, this command verifies the retained bytes and the common
source identity without requiring the temporary artifact download URLs:

```sh
python - <<'PY'
import gzip, hashlib, json
from pathlib import Path
notes = Path('cookbooks/coordinate-participants/notes')
packed = (notes / 'peer-composition-9df9308.json.gz').read_bytes()
assert hashlib.sha256(packed).hexdigest() == '185fb455c32fb1ff10a3c057a4ed2824baa10ebc1b6ed725ddee081897a473b7'
raw = gzip.decompress(packed)
assert hashlib.sha256(raw).hexdigest() == '9f66c1de09d5bd4dcbdd8556b7daae18f6d5ea0d4b1a79633a9ae4d8b65bb0ea'
peer = json.loads(raw)
collab_raw = (notes / 'composition-9df9308.json').read_bytes()
assert hashlib.sha256(collab_raw).hexdigest() == '0744ca4a312b8b9f4795319f55aa9b045abc820838210c67dad8d06cb2a1d6bb'
collab = json.loads(collab_raw)
for name, compressed_sha in {
    'native': '6ab31549d166cf420d4426960fbc14475c6410999074c01f1f46d41e4fa4faa0',
    'browser': '882ffb6ef92706ce93718c15ff1bf5443f872f949d2f75e9531dfc9068ec2479',
}.items():
    packed_report = (notes / f'{name}-report-9df9308.json.gz').read_bytes()
    assert hashlib.sha256(packed_report).hexdigest() == compressed_sha
    raw_report = gzip.decompress(packed_report)
    assert hashlib.sha256(raw_report).hexdigest() == collab['reports'][name]
    assert json.loads(raw_report)['source'] == collab['source']
sources = {item['repository']: item for item in peer['sources']}
assert sources['werg/tendriller-contrib'] == collab['source']
assert collab['source']['commit'] == '9df93084d2e56947ca6bc13691306ae0217cf63c'
assert all(item['dirty'] is False for item in sources.values())
assert len(peer['gates']) == 7 and len(collab['native']['checks']) == 31
assert len(collab['browser']['scenarios']) == 2
print('Exact retained source and evidence bytes verified.')
PY
```

This verifies evidence integrity; executing the workflows or the documented
[consumer commands](../checks/README.md) is the runtime qualification. Both
workflows pin full companion commits and check out the explicit Contrib head,
including the transport composition job.

## Acceptance that remains separate

The existing acceptance issues retain their deployed meaning:

- [#14: deployed networks](https://github.com/werg/tendriller-contrib/issues/14)
  covers direct, relay and public-network behavior on actual home, mobile and
  restrictive networks. Local RTC and loopback relay success do not close it.
- [#15: deployed resource and cost measurements](https://github.com/werg/tendriller-contrib/issues/15)
  covers real host, relay and storage use and cost. The local process timing/RSS
  samples above are not deployment or provider billing measurements.
- [#16: deployed store-loss and backup continuity](https://github.com/werg/tendriller-contrib/issues/16)
  requires an actual storage/backup rehearsal under the current selected-generation
  recovery rules. Historical fixed-authority failover wording is not the current
  recovery contract. Local loss and adopted-prefix fixtures do not substitute for
  that deployed rehearsal.
- [#17: actual devices](https://github.com/werg/tendriller-contrib/issues/17)
  covers real enrollment, storage behavior and privacy across devices. The native
  fixture's laptop/phone/provider role names describe retained signers, not
  physical hardware or external provider execution.

Provider conversational-wake acceptance is also separate. The runnable evidence
and clarity reviewers are independent local policies. Tool calls, event
subscriptions, a native process or an attached gateway do not establish that an
existing ChatGPT/provider conversation can be awakened. No external model call,
unassisted fresh-agent usability study, protected external effect or exactly-once
external outcome is qualified here. No production deployment or issue closure was
performed by these runs.
