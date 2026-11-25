# Set up a browser-first application on the selected service

Use this entry for a new Tendriller application or an assistant connection. Core
owns runnable setup and public packages; this collection helps choose guarantees
and recognize completion. A cookbook or source checkout does not choose the
person's deployment or certify its installed release.

## Discover the selected service first

Keep the exact origin supplied by the person or returned as `serviceOrigin` by
the selected connector. Use it for discovery, readiness, setup, saved handles,
owner sign-in and assistant access. Never switch deployments because creation is
paused or an installation fails.

Start at `/api/service` and `/.well-known/tendriller.json` on that origin. In MCP,
call `tendril_guide` with `topic: "start"` when available; otherwise follow the
returned same-origin setup/build links. An empty application list is not evidence
that the connector is missing or that creation is permitted.

**Before new-app downloads or installation**, read `/api/readiness`. Use the
current guide's `describeReadiness` and `requireCreationReady` helpers. Require
schema version 1, the exact selected `serviceOrigin`, `mode: "open"` and
`creation.available: true`. Compare release/runtime identities with the service
descriptor and advertised composition. Do not follow a redirect to another host.

| Observation | Next action |
| --- | --- |
| Open creation and matching identities | Follow this service's build guide and immutable release; creation rechecks admission. |
| Paused or read-only creation | Stop setup and report `creation.nextAction`; retain existing work. |
| Missing, unavailable or unsupported readiness | Stop and name the missing prerequisite; do not optimistically create or install. |
| Existing application | Resume retained device identity, keys and local state first; refresh authority/discovery in the background. A new-creation pause alone does not disable it. |

The [core build guide](https://github.com/werg/tendriller/blob/master/docs/BUILD_AN_APP.md)
and [MCP workflow](https://github.com/werg/tendriller/blob/master/docs/MCP_AGENT_GUIDE.md)
explain the source contract. Open pull requests and source changes do not establish
what the selected origin has deployed. Report a missing endpoint or release as a
specific upgrade boundary.

## Use one verified immutable composition

Use the discovery document's `firstApp.release`. Verify its manifest, composition
identity and every required archive hash before installation. Retain provenance
and the application lockfile. A mutable source-download URL or several packages
with the same version do not prove a qualified composition.

If the complete advertised release is unavailable, report that prerequisite.
Ordinary application setup must not rebuild Chronolog from sibling source trees,
combine unrelated archives or silently use registry latest. Deliberate core
qualification is separate and records its exact source/byte boundary.

Import and adapt the supplied browser Worker, local-owner, bootstrap, connection,
view and submission helpers. Do not invent another signer, store, command queue,
discovery loop or Worker lifecycle. Retained profiles reopen local state before
background host access; a cold browser needs real enrollment and key provisioning.

Choose an event or ordinary-SQL state model and an explicit finality/availability
policy. Ordinary apps default to no finality. Engine manifests pin execution
semantics, not the application schema. Initial application DDL is an ordinary
authored transaction; later authorized DDL and grants use that same flow.

## Prepare and publish before owner sign-in

The intended route is:

**create → choose policy → publish signed UI → owner sign-in → initialize browser
locally → author and replicate → verify**.

A native participant is optional. Do not make its executable, private store or
reachability a prerequisite for ordinary browser reads or durable writes. A
separately hosted application backend needs a concrete feature requirement;
Tendriller is not the application database.

For account-linked MCP, use `setup:prepare`, submit its public arguments to
`prepare_tendril_setup`, and pass the exact ready result to `setup:finish`. The
starter retains the original private credential and intent before the request;
the host derives the verified owner. After a lost reply use
`inspect_tendril_setup`, not a new allocation. Bounded setup listing is an
inspection mechanism, not permission to reconstruct missing secrets.

If the explicit email route is deliberately selected and supported, use the
actual owner's verified address with their authorization. An opaque connector
profile ID neither reveals it nor substitutes for missing scope. Never silently
broaden consent or switch routes to work around an installed catalog.

Create once, retain the private setup handle, configure the execution and finality
policy, and publish the first verified signed UI. Prepare optional assistant
access separately. Give the person the ready page URL without waiting for a
“claimed” reply; do not publish an empty shell just to obtain a claim link.

Code publication is independent of data ownership: its authorized publisher may
prepare the UI before the first browser creates the data root. A host credential,
device data grant, finalizer role, SQL permission and publication right are not
interchangeable.

## Initialize and provision browsers explicitly

| Checkpoint | What it establishes | What it does not establish |
| --- | --- | --- |
| Owner sign-in | The intended authenticated account owns the prepared page. | Application encryption keys or a running agent. |
| Device-key proof | The account/origin-bound browser proves possession of its retained device identity; epoch commitment is inside the signed proof. | Possession of an existing application's private epoch keys. |
| Explicit data grant and key provisioning | An authorized reader provisions the enrolled recipient through a recipient-encrypted package, validated against authenticated key commitments. | SQL namespace/object privileges, finality or publication rights. |
| Assistant consent | The account approves the displayed queries, commands and optional events. | That a tool provider is running, or that this conversation can wake later. |

The first authorized browser durably creates its identity and bootstrap key before
an uncertain enrollment response. It must reconcile the same signed intent after
reply loss. Additional devices require explicit authenticated key transfer;
creating an empty local store cannot invent absent keys or replace application
history. Retain request identities and private recipient agreement keys in the
owning device store across reload and retry.

Use the supplied owner review for independent reader/writer/administrator,
publisher and finalizer grants. Host membership metadata does not overwrite
application SQL membership or grants: those are ordinary authorized authored
transactions. Provisioning keeps raw encryption keys and signing keys outside the
host, authored assets, public URLs and repository.

No enrollment step pauses application ordering or chooses retained history.
Initialized devices continue authoring locally while another device awaits
approval or keys. A keyless browser can display the provisioning path, but must
not advertise Save readiness or fabricate an empty current application.

A sign-in in the person's browser does not sign in an agent's separate browser.
Let the owner complete their own authentication. A delayed review does not
justify a second application or signer. Follow the selected service's current
[session bootstrap](https://github.com/werg/tendriller/blob/master/docs/SESSION_BOOTSTRAP.md)
and troubleshooting next action.

For expired setup credentials, use only an actually supported same-application,
owner-approved continuation route. Preserve application identity, device storage
and original request. A host delegation is not new data membership or assistant
consent. Never retry uncertain redemption by automatically issuing another secret.

## Verify behavior, not just an HTML preview

Demonstrate all of the following with real participants:

- Verified signed publication of the exact delivered files.
- A browser operation stored and materialized locally with no native/agent process.
- Independent disconnected authoring, including authorized ordinary SQL DDL when
  SQL is selected; local views stay usable and Save is not connectivity-gated.
- Automatic convergence with another independent participant after reconnection,
  with late earlier facts correctly revising domain views and operation outcomes.
- Persistence after reload of identity, keys, local state and exact uncertain
  operations; no silently retimestamped retry.
- Honest independent stored, materialized, retained and configured-finality facts.
- If requested, an authorized assistant round trip and actual browser finality
  proof generation—not just a configured role or a connected socket.

Use reactively derived domain views, not a JSON editor or appended arrival log.
Keep unsent drafts, stable selection, keyboard focus and deep links while incoming
facts reorder rows or change schema. Exercise desktop and phone widths, Back,
empty/error/loading states and the second-pass flow matrix in core delivery.

Finality is optional admission/closed-time evidence, never an operation sorter.
If enabled, explain that unseen offline work first delivered behind a sealed
frontier can be excluded. Retain the original intent visibly; do not silently
retimestamp it. Missing finality cannot block ordinary local provisional work.

## State actual lifetimes and limits

State which browser tabs, Workers and optional processes must stay open for live
synchronization, an assistant or finality progress. They are not required to save
local work. A page does not host a resident native participant or reasoning
process, and browser suspension does not promise future execution.

Read a private checkpoint before promising resume. It should retain the setup
handle, device-store location, exact pending references and installed composition.
Keep it outside authored files, public archives and version control; never open
one retained signer/store through two independent simultaneous owners. A preview
also needs a reachable route; a local URL alone is not delivery to the person.

MCP and page residency do not establish a supported future wake or handoff into an
existing conversation. Promise unattended responses only after the selected
host's supported wake route passes the
[two-probe rehearsal](../cookbooks/connect-resuming-agent/COOKBOOK.md); otherwise
provide the honest on-demand/manual path from
[assistant connection choices](../cookbooks/connect-chatgpt/COOKBOOK.md).

For networking, use the selected service's `PEER_CONNECTIONS` guide and existing
native/browser transport helpers. Prefer direct RTC with authenticated relay
fallback and bounded backpressure. Verify real traffic and content transfer, not
just a connection indicator. A loopback test does not qualify Internet or mobile
reachability. Historical receipts retain their historical scope; qualify this
new protocol and exact release graph independently.
