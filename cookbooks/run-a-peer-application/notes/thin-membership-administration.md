# Thin membership administration and detached payloads

This records the implemented boundary and its measured qualification for the paired
[Tendriller #35](https://github.com/werg/tendriller/pull/35) and
[Chronolog #1](https://github.com/werg/chronolog-db/pull/1) work. On 2026-11-16 the
complete packaged Cloudflare/native/browser gate passed, including live enrollment,
restart, revocation and measured exclusion of application payloads from the
administrator. The actual Worker runs in a local workerd harness with synthetic
authenticated accounts. Deployed Cloudflare authentication, public-network routes,
provider cost and operational recovery remain separate qualification work.

The measurements below describe the earlier receipt-order implementation. The
current follow-up keeps application execution in deterministic signed author-time
order and gives the native provider only inclusion and closed-frontier duties.
Signed closure markers now accompany receipt descriptors; fresh artifact-bound
qualification is required for that change. Historical reports remain unchanged.

## Put membership administration on Cloudflare by default

The portable administrator owns the root membership identity, durable enrollment
decisions and roster changes. Its default host is Cloudflare. A native resident
peer owns the selected coordinated application authority, retains application
payloads and runs the application materializer and effect workers. Browsers are
full application replicas with their own device identities, authorized keys and
local storage. These are separate responsibilities even when a deployment places
more than one of them in the same process.

| Participant | Retains and verifies | Executes or authorizes |
| --- | --- | --- |
| Cloudflare membership administrator | Signed descriptor history, inclusion/closure evidence, small capability/epoch records and durable membership decisions | Enrollment, grants, revocations and key distribution at proved author-time boundaries |
| Native finality provider and full replica | Descriptor history, inclusion/closure evidence and required detached application envelopes | Inclusion and closed-frontier certificates; canonical application replay and designated resident services |
| Authorized browser full replica | The same required application history and its own durable device operations | Local application execution, coherent reads and authorized signed changes |
| Relay or payload source | The explicitly configured bytes and transport state | Transport and exact content retrieval; no implied membership or finality authority |

Membership authority must not silently grant the administrator application reader
or writer rights. Any retained key material and distribution policy must be
explicit. A host login identifies a person to the host; signed device requests,
approved capabilities and their verified activation establish group access.
Application SQL team invitations are a separate feature and cannot substitute
for this process.

The administrator uses durable metadata storage. A Cloudflare SQLite-backed
Durable Object can supply that storage without loading or executing the
**application** SQL engine. Tests must distinguish those two uses of SQL.

Signed genesis selects the initial application schema administrator separately
from the membership root. Every full replica initializes its SQL ownership model
from that same signed schema key. The native schema owner can create application
tables without making the Cloudflare root an application writer, group member or
SQL executor. A fixture-specific local root override is not a valid substitute.

## Certify small descriptors and fetch payloads through peers

The implementation replaces opaque, payload-sized log entries with canonical typed descriptors.
Each application candidate commits its exact signed envelope hash and length,
group, record type and epoch. Small signed capability and epoch envelopes travel
inline, so an administrator can verify membership history without downloading
application candidates. Full replicas fetch detached application envelopes from
their authorized peer path and verify them against the committed descriptor
before using them.

This is a clean prerelease format change. Do not add old/new envelope conversion,
parallel histories or a second page-owned proposal queue. Existing public
application operations keep their meaning: one durable signed operation, exact
retry, one ordered history and one application result.

Descriptor verification and ordering are distinct from payload availability and
application execution. An administrator can advance its verified roster across
an application descriptor without interpreting its SQL or event contents. A full
replica missing the corresponding body, decryption key or execution support must
not label that application prefix applied final, emit its events or advance a
processed event cursor beyond the unresolved input. It can continue to show its
previous coherent applied view while identifying the blocked progress.

Detached transaction envelopes are also distinct from photos or capture bytes.
The existing [file/capture metadata recipe](../COOKBOOK.md#adapt-the-executable-specimen)
still needs its upload receipt and retention policy. Ordering a descriptor, or
committing blob metadata, does not establish another durable payload copy.

## Exercise live membership through the public boundary

The qualification fixture must construct the actual portable administrator on
the public Cloudflare host composition, with a durable root identity and store.
The native authority is a separate participant. Devices create their own keys;
they are not pregranted in genesis and do not receive a fixture's raw epoch key.

The enrollment flow is observable as separate steps: device request, host review,
durable signed approval, ordered and verified capability activation, authorized
key delivery, payload catch-up, then application readiness. A successful approval
HTTP response alone is insufficient. The browser must verify the approved scope
and history before it reports readiness.

Revocation must be exercised through the same public administrator. A writer's
new direct-to-native proposal must fail after its revocation becomes effective,
even while its host login remains valid. A previously accepted exact retry keeps
its original result. A replacement grant does not revive intent signed against
an older revoked grant. Reader removal rotates future access as defined by the
epoch protocol; it cannot erase plaintext or keys already held by that device.

An approval reply can be lost after durable commit. Restarting the administrator
and retrying the same operation must return the original decision and proposal,
without a new grant or accidental widening of rights. Changing the reviewed
request under that operation ID must fail explicitly. Portability uses the same
administrator core and identity/history contract in another supported host; it
does not imply automatic failover or two simultaneously active root stores.

## Latest qualification after review

The [new source/artifact pairing](qualification-review-43957113710.md) passed in
[workflow 43957113710](https://github.com/werg/chronolog-db/actions/runs/43957113710),
using public Tendriller source `283f210c`, membership `cc18d15e` and contrib
`8449017`. It retains seven thin runtime assertions plus the build/import audit,
zero administrator application-envelope bytes and separately measured full-peer
traffic. The updated application pilot has nine checks, including the exact built
scope/reset recipe through the native public adapter. The new note and separate
raw reports preserve the actual clean tested merge, package hashes, measurements
and limits. They do not replace the initial evidence below.

## Recorded public-artifact qualification

[Browser workflow 43940378818](https://github.com/werg/chronolog-db/actions/runs/43940378818)
passed the initial complete gate. The [unaltered thin-membership report](evidence/2026-11-16-thin-membership.json)
records seven runtime assertions plus the independent package/bundle build check,
Chromium `158.0.8127.18`, no page errors and `passed: true`. The separate
[two-layout application report](evidence/2026-11-16-application-pilot.json) in the
same run passed eight checks, with one resident effect dispatch and zero host
application writes.

| Provenance | Exact identity |
| --- | --- |
| Chronolog authored PR head | `5cfa04440029c24d4313e7b8e88e593952180adb` |
| Clean tested PR merge | `43efd510001c2608bc1e28ee4c7d100cb34c773b` |
| Tendriller public SDK, runtime and engine source | `43cac4e75b0bbe1e422f4879b7249d6db5988440` |
| Embedded portable membership source | `46b72ebc1c69f71b4cabab744ef19c6a4e50dfec` |
| Contrib pages and runner wrapper | `a3797d528d3bbbc649cda637e1e465105ea86c1c` |
| SDK tarball SHA-256 | `24f3da2394a151e97e368e1129b8e4ab725cdff0bfca62d858d4ca8e1e3a9042` |
| Engine tarball SHA-256 | `6e8915ca86b788105c0e40c92d0cd610559c596fe76957f6c1f26fcd3e516832` |
| CI archive | Artifact `14262634338`, SHA-256 `910ac51584c70818dcbf93c945a0766abc01ecaa16c168f80b7cf6810e2b877d` |

The report also retains the exact browser bundle, SQL WASM, manifest and portable
membership module/declaration hashes. Its membership import inventory excludes
the application materializer, native SQLite/SSB runtime and full node executor.
The engine's public provenance export is checked before the scenario starts.
The native SQL view independently verifies one native schema administrator and
zero application group memberships for the Cloudflare root.

Reproduce with the [public qualification command](../checks/README.md#qualify-thin-cloudflare-membership-separately).
The recorded command runs `tools/thin-membership-pilot.ts` against the built
Tendriller `dist` tarballs and the independently built SQL WASM assets. The
contrib wrapper invokes that core command; it supplies no replacement provider.

### Encoded byte measurements

These totals are actual canonical descriptor and signed encrypted envelope
lengths for the named candidates. The requested payload sizes are SQL string
values; envelope totals also include the rest of each signed program.

| Workload | Candidates | SQL payload per candidate | Descriptor bytes | Detached envelope bytes |
| --- | ---: | ---: | ---: | ---: |
| Small | 4 | 16 bytes | 568 | 2,668 |
| Large | 4 | 196,608 bytes | 576 | 789,092 |
| More small | 8 | 16 bytes | 1,136 | 5,320 |

Increasing body size at the same candidate count changed descriptor traffic by
only eight bytes, from the encoded length fields. Doubling the small candidate
count doubled descriptor bytes. The complete scenario made 21 signed membership
requests: 13,115 request bytes and 26,251 response bytes. It transferred 2,706
candidate-descriptor bytes and 9,552 inline-control-descriptor bytes; the latter
already includes 7,504 inline signed envelope bytes and must not be double-counted.
The remaining response bytes contain framing, ordering evidence and certificates.
Repeated range transfer is included in these session totals.

The administrator received **zero application envelope bytes**, with **zero
unexpected administrator endpoint requests**. The authenticated full-peer path
separately transferred 57,444 inbound and 1,657,484 outbound framed bytes. Those
counts include synchronization overhead and repeated ranges; they are not unique
payload sizes or provider billing. Retained storage size, production relay cost,
Internet latency and NAT behavior were not measured by this fixture.

### Acceptance map and remaining boundaries

| ID | Scenario | Observed evidence and limit |
| --- | --- | --- |
| ADMIN-01 | Default public Cloudflare composition with a separate native full peer. | Passed actual workerd provider, real Durable Object restart and durable root/roster recovery; bundle audit excludes the application engine. This is not a deployed Cloudflare service. |
| ADMIN-02 | Device-created identity after genesis and live approval. | Passed account-bound signed request, approval, independently verified active grants and HPKE keys, then authenticated detached-body catch-up and application readiness. No raw epoch key or pregrant is injected. |
| ADMIN-03 | Equal candidate counts with very different body sizes; double count with fixed size. | Passed both measurements above, zero administrator application envelopes and no body endpoint requests. Public-network cost and retained-storage measurements remain issue #15. |
| ADMIN-04 | Lose the committed approval response and restart the host. | Passed original signed approval and capability IDs after actual Durable Object eviction; a changed decision under the same operation ID is refused. The native integration also drops the native append response. |
| ADMIN-05 | Revoke writer while host login remains valid; submit directly to native. | Passed final `WRITER_UNAUTHORIZED` rejection and unchanged proposal identity for an earlier accepted exact retry. |
| ADMIN-06 | Revoke reader and rotate future access. | Passed active-reader removal, refusal of its host history route, known future epoch with no device key, and native publication using its retained authorized future key. Previously held keys/plaintext are not erased. |
| ADMIN-07 | Withheld, corrupt, duplicated or reordered bodies. | Actual host/browser gate proves missing-body blocking and later authenticated recovery. Separate codec/core tests reject length, digest, type, group and epoch substitution. This run is not a deployed-route corruption/reordering fault campaign; issue #14 retains that work. |
| ADMIN-08 | Roster changes after large or unavailable application bodies. | Passed activation and authorized key receipt while the browser application frontier is explicitly blocked on detached payloads; thin administration progresses using descriptors/inline controls. |
| ADMIN-09 | Restart durable host and browser state. | Passed host restart after lost approval response and abrupt browser Worker replacement after accepted/rejected operations, retaining identity, grants and exact receipts. Production storage loss and every enrollment crash boundary remain separate recovery qualifications. |
| ADMIN-10 | Existing two task-board layouts after the detached-format change. | The initial eight application checks passed against the pins above. The [new pairing](qualification-review-43957113710.md) passes nine checks, adding native scope/reset qualification. The layouts' two identities are explicitly pregranted; fresh-device Cloudflare enrollment remains the separate thin fixture. |

Record encoded transport bytes, not JSON character counts or estimates. The
report should identify candidate count and envelope size distribution, descriptor
bytes, capability/epoch bytes, administrator application-payload bytes and fetch
attempts, full-peer payload bytes by route, retained storage bytes and restart
results. Include the administrator bundle's module inventory or import audit.
An empty counter is useful only when the actual fetch/transport boundary is
instrumented; a fake roster or an unconnected stub cannot prove exclusion.

Use two independent measurements: hold the number of candidates constant while
increasing body sizes, and hold body sizes constant while increasing the number
of candidates. The first exposes accidental payload transfer; the second records
the expected descriptor-history growth. “Thin” does not mean zero traffic or
constant storage for an unbounded retained history.

## Keep evidence and deployment claims separate

The earlier application pilot used a native root administrator and pregranted
browser identities. The public bridge pilot exercised live enrollment, but its
administrator was also a full SQL reader. Neither earlier result proves the new
membership placement. Preserve those reports as application and bridge
regressions rather than relabeling their scope.

A test against the built Worker in a local workerd harness establishes that host
composition. A real deployed Cloudflare run separately establishes the chosen
service configuration, login, networking and persistence behavior. Record the
deployed version and operational limits before claiming production qualification.

The existing deployment issues remain the tracking surface:

- [#14](https://github.com/werg/tendriller-contrib/issues/14): measure descriptor,
  inline-control and detached-payload routes separately, including cold join,
  interruption and direct/fallback behavior on real networks.
- [#15](https://github.com/werg/tendriller-contrib/issues/15): compare Cloudflare
  membership metadata cost with full-peer payload transfer, replay and storage;
  publish usage and current pricing separately.
- [#16](https://github.com/werg/tendriller-contrib/issues/16): rehearse durable
  administrator identity/roster recovery separately from native finality and
  payload storage recovery. No implicit role or lineage takeover.
- [#17](https://github.com/werg/tendriller-contrib/issues/17): qualify live deployed
  enrollment, host-session independence, writer and reader revocation, epoch
  delivery, OPFS reopen and private-data exclusion.

No deployment issue is closed by the local workerd/native/Chromium qualification.
