---
id: "run-a-peer-application"
title: "Build a local-first peer application"
summary: "Author durable signed operations independently, merge operation sets, and derive coherent revisable event or SQL views with explicitly optional finality."
group: "Keep work dependable"
tags: ["peers", "events", "sql", "offline", "finality"]
choices: ["Events or permissioned SQL", "Provisional reads or configured finality", "Local durability and independent peer retention"]
capabilities: []
evidence: "explained"
related: ["choose-data-model", "reconcile-concurrent-edits", "recover-outdated-work", "resume-across-sessions", "observe-long-running-process", "manage-sensitive-data", "publish-coherent-updates"]
---

# Build a local-first peer application

Use the public `@chronolog/peer-session` composition for browser and native
participants. Each authorized author durably stores their signed transaction
without another participant, application server, or finalizer. Replicas union
immutable authenticated operations and derive their own application views.

The only application order is signed author timestamp, signing public-key bytes,
and stable proposal-ID bytes. Delivery order is not application order. Earlier
operations arriving later can revise a previously displayed SQL outcome, remove
its effective events, change schema, or reorder a list. A provisional successful
claim is not globally exclusive authority for irreversible external work.

The [application primitive guide](../../guides/application-primitives.md) explains
the independent guarantees. The [multi-participant reference](../coordinate-participants/COOKBOOK.md)
adds conversation, attachment ownership, and claim/result domain primitives.
These examples remain independently installed public consumers, not another
application database or production connection manager.

## Choose the data model and finality policy

| Need | Starting point | Important boundary |
| --- | --- | --- |
| Typing, cursors, disposable progress | [Live signals](../share-live-signals/COOKBOOK.md) | No durable history or finality. |
| Durable conversation or observations | [Conversation definition](snippets/peer-conversation.mjs) | Lazy event materialization; no SQL engine required. |
| Guarded tasks or schema/data programs | [Task-board definition](snippets/peer-task-board.mjs) | Explicit compatible SQL engine factory; atomic permissioned SQL and emits. |

Ordinary offline-first applications choose `{ kind: 'none' }`. Local authoring and
provisional reads do not depend on a provider. `operation.finalized()` explicitly
rejects as unsupported under this policy; it never reports fake finality.

Applications that need admission or closed-time evidence explicitly configure
signed-frontier or fixed-validator finality. Browser and native actors use the
same verified proof contract. Unavailable finality does not block durable local
writes. A genuinely offline operation first seen behind a sealed time frontier
can be excluded. Keep its original ID, timestamp, and signed intent inspectable;
do not silently change its time or submit a replacement. Finality neither
promises retention nor makes an external effect exactly once.

## Separate device, host, and application permissions

1. Explicitly create or resume the real device store. A missing or busy device
   must not silently become a new identity. Use `identity.publicKey` as the public
   signing identity, not a device-ID alias.
2. Supply a verified signed descriptor and membership bundle, including its epoch
   key commitment. Creation of a host page alone supplies none of these data keys.
3. On first enrollment, the authenticated browser proves its own device key and
   creates or receives its actual private data keys. Additional devices explicitly
   call `createProvisioningRequest`, `exportProvisioning`, and `importProvisioning`
   under their session's `provisioning` API. Enrollment is not key invention.
4. Reopen retained identity, cached authority, and local data before remote
   refresh or discovery. Keep private handles, signing identities, and epoch keys
   outside authored assets. An offline reload needs the actual immutable asset
   graph cached, not a cosmetic readiness label.
5. Treat publication authority, data reading/writing, application administration,
   retention evidence, and finalizer eligibility as separate permissions.

`createApplicationSession({ device, definition, authority?, applicationId?,
epochKeys?, createMaterializer? })` is the sole session entry. Events use its lazy
default materializer. SQL supplies the explicit factory from the public `/sql`
entry and the appropriate native or browser engine capability.

There is no fixed application schema in a definition. Submit
`initializeTaskBoard` as a normal authorized transaction, then submit permitted
`CREATE`, `ALTER`, `DROP`, indexes, views, triggers, grants, and data changes through
the same author-time replay path. Do not reorder DDL ahead of its signed time.
Engine manifests pin deterministic execution, not an immutable database schema.

## Observe four independent facts

- **Stored locally:** command/submission resolves after exact signed storage is
  durable. The ordinary Save action depends on local signing and storage, not
  network readiness.
- **Materialized locally:** `operation.materialized()` observes a current
  accepted or rejected outcome at a coherent revision. This can change.
- **Retained by peers:** `operation.retained()` observes authenticated availability
  evidence from independent named stores. It is not finality.
- **Finalized:** `operation.finalized()` observes verified configured evidence
  after bodies, keys, and replay are available.

Inspect all these facts rather than collapsing them into one success label.
Repeat the exact original command with the same operation ID after an uncertain
reply. The session owns its durable journal; an application must not build a
second retry queue or regenerate signed time on retry.

## Render snapshots, preserve local drafts

The [page specimen](checks/peer-ui/board.html) and compact layout render coherent
materialized snapshots plus separate local view state. `createLiveView`
invalidation re-derives lists, counts, and details. It does not append transport
arrivals to another mutable UI database. Stable proposal IDs preserve selection
and links while earlier facts revise the view. Unsent text and keyboard focus
remain local. Schema invalidation exposes an explicit view error without
corrupting state or disabling unrelated offline authoring.

Production host discovery, RTC/relay retry and transport lifetime belong to the
public host `participateApplication` composition. The independent qualification
fixtures use explicit framed topology and `session.connectPeer`; their SDP
mailbox and deliberate cuts are test infrastructure, not an alternative lifecycle.

## Qualify the exact artifact graph

Follow the [checks guide](checks/README.md). The runners install exact archives in
empty directories with scripts disabled, verify their hashes and clean source,
record fixture/dependency identities, and exercise actual native RTC, Chromium
Worker/OPFS, Workerd relay, native/browser WASM SQL, content transfer, restart,
offline writers, exact retries, revisable outcomes, and optional finality.

The current CRDT report formats are new. Historical reports cannot qualify them,
and passing synthetic validator unit tests is not runtime qualification. Release
readiness requires fresh successful raw reports for all composition gates. An
installed package, static preview, or renamed historical report is insufficient.

Keep participating pages or native processes open for live synchronization. They
are not required to save local work. A configured finality actor must be available
to advance its frontier; its absence does not prevent local provisional writes.
No page residency promise implies wake-up of an existing assistant conversation.
