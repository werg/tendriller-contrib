# Thin membership administration and detached payloads

This is the revised deployment target for the paired
[Tendriller #35](https://github.com/werg/tendriller/pull/35) and
[Chronolog #1](https://github.com/werg/chronolog-db/pull/1) work. Implementation and
qualification are in progress. The earlier task-board pilot establishes SQL,
event, worker and recovery behavior; it does **not** establish the membership
placement or bandwidth properties described here.

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
| Cloudflare membership administrator | Signed descriptor history, ordering evidence, small capability/epoch records and durable membership decisions | Enrollment, grants, revocations and key distribution under the group policy |
| Native application authority and full replica | Descriptor history, ordering evidence and required detached application envelopes | Coordinated ordering, application SQL/events and designated resident services |
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

## Order small descriptors and fetch payloads through peers

Replace opaque, payload-sized log entries with canonical typed descriptors.
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

## Required measured gates

All rows below are **pending** until an exact source/artifact pair, command and
observed report are attached. Test names or an implementation checklist do not
constitute a passing result.

| ID | Scenario | Required observation |
| --- | --- | --- |
| ADMIN-01 | Start the public Cloudflare membership composition with a separate native full peer. | Root identity and roster survive host restart; no application materializer or SQL engine is loaded by the administrator. |
| ADMIN-02 | Enroll a device that generated its own keys after genesis. | Signed request and exact approval lead to independently verified activation, authorized keys and full application readiness, in that order. |
| ADMIN-03 | Order histories with equal candidate counts but substantially different payload sizes. | Administrator receives zero application envelope bytes and makes zero application body fetches. Descriptor/inline-control byte totals are recorded separately from full-peer payload traffic. |
| ADMIN-04 | Drop an approval response after durable commit and restart the host. | Same request/operation returns the original grant and proposal; conflicting content is refused and no duplicate membership mutation appears. |
| ADMIN-05 | Revoke a writer, retain its host session and send a fresh proposal directly to the native peer. | Application admission rejects the new operation after verified activation; original accepted retries remain original. |
| ADMIN-06 | Revoke a reader, rotate the epoch and publish new application data. | Retained members receive authorized future keys; the removed device cannot decrypt the new epoch. Previously obtained data is not claimed erased. |
| ADMIN-07 | Withhold, corrupt, duplicate and reorder detached application envelopes. | Exact hash/length/type/group checks prevent substitution; full replicas stop before unresolved application inputs and recover from a valid source without duplicate outcomes. |
| ADMIN-08 | Deliver roster changes after large or unavailable application bodies. | Thin administration verifies the roster from descriptors and inline control records; full application peers retain their stricter applied-data frontier. |
| ADMIN-09 | Reopen both browser OPFS and administrator storage with an in-flight enrollment. | Device identity, approved scope, original operation and membership state are retained; no new identity or broadened grant is invented. |
| ADMIN-10 | Run both task-board layouts after real enrollment and after the detached format change. | Existing SQL/event atomicity, coherent views, worker results, draft preservation and exact retry checks still pass through public artifacts. |

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
administrator was also a full SQL reader. Neither result proves ADMIN-01 through
ADMIN-09. Preserve those reports as application and bridge regressions rather
than relabeling their scope.

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
  administrator identity/roster recovery separately from native ordering and
  payload storage recovery. No implicit role or lineage takeover.
- [#17](https://github.com/werg/tendriller-contrib/issues/17): qualify live deployed
  enrollment, host-session independence, writer and reader revocation, epoch
  delivery, OPFS reopen and private-data exclusion.

No deployment issue is closed by this target document or by the earlier pilot.
