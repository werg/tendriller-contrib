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

An older installed tool catalog can omit `tendril_guide`. Follow the returned
`setup.startHere`, `setup.buildGuide` or `setup.discoveryUrl` on the same origin.
The public discovery path is `/.well-known/tendriller.json`; it links to the
host's MCP workflow, build guide, service contract, readiness and release
artifacts. Refresh the installed catalog when possible, but a missing guide tool
does not require selecting another host or abandoning the workspace-agent route
below.

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

Reuse the starter's actual browser Worker and shared helpers (`shared/helpers/…`)
when adapting the interaction. Keep the starter's `connection.mjs` owner-facing
connection component and its browser bootstrap/provisioning helpers together. They
retain this browser's signer, show honest progress while its own key proof, any
owner review and key import complete, resume after a reload and bound retries to
the page lifetime. Do not replace that flow with a collection of setup buttons,
invent an identity fallback or poll the host while an initialized app is idle. The
low-level ownership specimens in this collection assume an already initialized
profile; they do not replace first-visit enrollment. Retained profiles reopen local
state before background host access; a cold browser needs real enrollment and key
provisioning.

Choose an event or ordinary-SQL state model and an explicit finality/availability
policy. Ordinary apps default to no finality. Engine manifests pin execution
semantics, not the application schema. Initial application DDL is an ordinary
authored transaction; later authorized DDL and grants use that same flow.

## Register the workspace agent and prepare the ready page

A Tendriller kit is an **agent workspace**: one agent credential (`ta_…`) and one
shared signing key serve any number of pages, with one install and one
`pages/<slug>/` source folder per page. A single page is a workspace with one
page. The agent is not a per-page identity. Check that the execution environment
can run Node 24 and retain the private `.tendriller/` folder, then register the
agent once, choosing the route the selected host supports. The intended route is:

**register the agent once → create the page → choose policy → publish signed UI →
owner sign-in → initialize browser locally → author and replicate → verify**.

| Route | Use when | Result |
| --- | --- | --- |
| `npx tendril workspace key`, MCP `register_agent` with exactly the printed public `name` and `publicKey`, then `npx tendril workspace adopt --credential FILE` | An account-linked MCP connector with `tendrils:create` is configured and granted | An agent under the linked account; the host derives the owner, so no email is needed |
| `npx tendril workspace init --service ORIGIN --owner EMAIL` | The actual owner's verified login email is known and no account-linked creation exists | An unclaimed agent; the owner claims it, and every page it created, by signing in to any one of them |
| **Dashboard → Your agents → Add agent**, then `npx tendril workspace join --service ORIGIN --code CODE` | A signed-in owner invites a new agent | An agent under that account; the single-use code expires in ten minutes and is a credential |

The workspace retains the signing key before the registration request;
`workspace adopt` retains the returned credential. An opaque connector profile ID
does not reveal an owner's email, grant ownership or substitute for a missing
configured/granted scope. Report that specific boundary rather than silently
broadening consent. Source changes do not upgrade an installed tool catalog.
`workspace init` is refused when the folder already has an agent. A lost
registration reply is not reconstructed: preserve the key and inspect the
account's agents before registering again. Re-registering the same name rotates
its token, so adopt the newest result and account for interruption of existing
control connections; never allocate a replacement agent, key or page.

Then create the page with `npm run page:new -- <slug>`. The creating agent is
granted it automatically; an existing page needs the owner's explicit grant (a
checkbox per agent on the dashboard, or the page's **Add people & devices → An
agent** tab) followed by `npx tendril page grant <slug> <page-id>`. Agents never
receive account-wide access implicitly, and the grant is not an application
device or assistant permission.

Keep preparing without waiting for a "claimed" reply: initialize with
`npm run init -- <slug>`, configure the application and finality policy, build and
publish the first signed UI with `npm run deploy -- <slug>` (or
`npx tendril --page <slug> publish pages/<slug>/dist`), and prepare any optional
tool-access proposal. The agent program is not needed for any of this. Then give
the owner the ready page URL and any permission-review URL. Do not publish an
empty shell merely to get a claim link.

Owner sign-in claims the prepared agent and its pages. Browser enrollment and
assistant access are separate grants: the agent token is a host credential, not a
device signer, and an assistant account connection is not a browser's application
membership. Keep the credential, the shared signing key and private device
stores out of published files; `tendriller.json` holds no secret and
`.tendriller/` stays private and gitignored. Cookbooks cannot grant permissions
or replace them with payload labels.

A native participant is optional. Do not make its executable, private store or
reachability a prerequisite for ordinary browser reads or durable writes. A
separately hosted application backend needs a concrete feature requirement;
Tendriller is not the application database.

If the explicit email route is deliberately selected and supported, use the
actual owner's verified address with their authorization. Never silently broaden
consent or switch routes to work around an installed catalog.

Code publication is independent of data ownership: its authorized publisher may
prepare the UI before the first browser creates the data root. A host credential,
device data grant, finalizer role, SQL permission and publication right are not
interchangeable.

## Initialize and provision browsers explicitly

| Checkpoint | What it establishes | What it does not establish |
| --- | --- | --- |
| Agent registration and page grant | The agent credential can create, publish to and open the page. | The browser device has its own retained signer and an application grant. |
| Owner sign-in and claim | The intended authenticated account owns the already-prepared page. | Application encryption keys, an enrolled browser or a running agent. |
| Device-key proof | The account/origin-bound browser proves possession of its retained device identity; epoch commitment is inside the signed proof. | Possession of an existing application's private epoch keys. |
| Explicit data grant and key provisioning | An authorized reader provisions the enrolled recipient through a recipient-encrypted package, validated against authenticated key commitments. | SQL namespace/object privileges, finality or publication rights. |
| Assistant permission review | The account approves the displayed queries, commands and optional events. | That the agent program is running, an adapter is online, a tool provider works or this conversation can wake later. |

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
Inspect the actual session being used; when it needs login, let the owner complete
that sign-in there. A delayed review does not justify a second application, agent
or signer. Reuse the saved workspace, device stores and operation references after
each checkpoint.

Core's [session bootstrap](https://github.com/werg/tendriller/blob/master/docs/SESSION_BOOTSTRAP.md),
[multi-page agents design](https://github.com/werg/tendriller/blob/master/docs/MULTI_PAGE_AGENTS.md)
and [MCP agent guide](https://github.com/werg/tendriller/blob/master/docs/MCP_AGENT_GUIDE.md)
describe workspace registration and explicit provisioning. Use them through the
selected host's matching guide and complete release. A missing endpoint,
incompatible storage or absent release remains an explicit upgrade boundary; this
guide does not establish deployment.

### Run one optional agent program for every page

`npm run agent` (`tendril agent run`) is the workspace's one optional long-running
native session owner. It keeps one control-only hub connection for setup notices,
discovery, invitations and WebRTC rendezvous (and the optional assistant adapter
stream) of every granted page, and opens one Chronolog session per page it has
been provisioned for, each with its own device store signed by the shared key.
Application sync data keeps direct per-page connections. Other commands are short
invocations that attach to it: `tendril --page <slug> <command>`. Start it only
when native participation, control notices or an agent tool is wanted; browser
Save, reload and offline work never need it. A separate assistant worker or
host-delivery bridge has its own supervised lifetime. The native owner may stay
connected when that worker is stopped; it must not advertise the worker's request
topics or renew its listening state.

The agent's shared key joins a page's data session only through explicit steps:
the owner's browser creates an account-bound challenge for that exact key, then
`npm run sign-enrollment`, `provisioning-request` and `import-provisioning` run
natively, and the owner reviews the exact rights and fingerprint before an
authorized device wraps the epoch key to that recipient. No step pauses
application ordering or selects history, and an initialized browser keeps saving
while it waits. A host token alone never grants data access, and there is no
shortcut that bypasses owner review.

### Continue after a lost credential or device

`.tendriller/agent/` (credential and shared signer) and
`.tendriller/pages/<page-id>/` (device store, descriptor, signed publication and
provisioning intents) are the workspace's private checkpoint. Restore them from a verified
checkpoint; there is no reissue of a lost key and no converter from older
projects. If only the token is lost or revoked, the owner can add the agent again
from **Dashboard → Your agents → Add agent** and `workspace join` a fresh folder.
Page access follows the signed application grants of the key, so a new key also
needs explicit signed enrollment and recipient-bound key provisioning through
surviving authorized devices. Core's
[continuation guide](https://github.com/werg/tendriller/blob/master/docs/BUILD_AN_APP.md#continue-after-a-lost-credential-or-device)
is authoritative; confirm that the selected host supports each route. Keep the
original page identity, descriptor and device stores.


For a lost, revoked or expired agent credential (a dashboard join code lasts ten
minutes), use only an owner-approved route from the selected service's
troubleshooting guide. A host credential or grant is not new data membership or
assistant consent. Never retry an uncertain registration by automatically issuing
another secret, and never create another page to work around a credential problem.

## Qualify conversation delivery during setup

When the requested result includes unattended replies in an existing conversation,
read the selected service's `/docs/CONVERSATION_DELIVERY.md` (or
`tendril_guide` topic `conversation` when advertised) before promising wake.
Use the [maintained source guide](https://github.com/werg/tendriller/blob/master/docs/CONVERSATION_DELIVERY.md)
to distinguish available mechanisms from features deployed by that host.

For Codex, inspect the installed CLI and the intended thread's store/daemon.
Plain `codex queue --thread UUID --message TEXT --resume` submits to an existing
thread but waits while a turn is running. A receiver required to inject incoming
requests must inspect current thread state and use `turn/steer` with the observed
active turn ID; queue/resume handles idle or unloaded state. Steering supplies
input at the next applicable continuation boundary, not an interruption of a
running tool. Preserve explicitly interrupted state and normal host approvals.

These mechanisms require the correct existing thread and daemon/store; an
arbitrary ChatGPT conversation identifier is not interchangeable. A successful
steer or queue admission is not a receipt or answer. Queue resume can still fail
with a warning; retain uncertainty and inspect the original admission instead
of silently queueing a second notice after a timeout.
A one-shot Tendriller waiter, MCP catch-up read or inbox card supplies no such
admission mechanism on its own.

Retain one configured workspace conversation for all its pages when that is the
person's intent. Keep the thread binding private, preserve page/history/request
identity and serialize receiver dispatch without waiting for a running turn to
finish. Verify an incoming request is injected into that same active Codex turn,
then verify idle wake and a second request after the answering turn ends. A
notice merely queued until completion fails the active case. If the installed host
cannot perform that route, show the missing capability and preserve requests
for manual continuation. Reauthentication, host admission failure and worker
exit need distinct actionable statuses; a native-owner heartbeat cannot hide them.

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

If an assistant round trip was requested, verify an authorized query or command
through its adapter and keep the original operation identity through an uncertain
response (`npx tendril --page <slug> operation ID`). Name an uncompleted browser,
account or permission step precisely; file generation alone is not that
observation.

## State actual lifetimes and limits

State which browser tabs, Workers and optional processes must stay open for live
synchronization, an assistant or finality progress, where `.tendriller/` persists
and how it is resumed. They are not required to save local work. A page does not
host a resident native participant or reasoning process, and browser suspension
does not promise future execution. On-demand MCP tools can work without automatic
future chat turns.

Read a private checkpoint before promising resume. It should retain the
workspace location, agent identity (`.tendriller/agent/`), every page's device
store, exact pending operation references and installed composition. Keep it
outside authored files, public archives and version control; never open one
retained signer/store through two independent simultaneous owners. A preview also
needs a reachable route; a local URL alone is not delivery to the person.

MCP and page residency do not establish a supported future wake or handoff into an
existing conversation. Promise unattended responses only after the selected
host's supported wake route passes the
[two-probe rehearsal](../cookbooks/connect-resuming-agent/COOKBOOK.md); otherwise
provide the honest on-demand/manual path from
[assistant connection choices](../cookbooks/connect-chatgpt/COOKBOOK.md).

In the pinned starter the optional assistant adapter runs inside the same agent
program (`npm run assistant:prepare` proposes the declared capabilities); the
hosted MCP route is separate and evolving, so confirm what the selected host
supports. A CLI or page attachment detaches from the owner and must not shut down
sibling clients; stopping the program closes every page owner. Optional event
forwarding is an explicit reviewed choice, separate from ordinary queries and
commands. It creates neither a subscription nor a future chat turn.

Historical source pins and evidence labels retain their original scope. They
neither certify these setup contracts nor substitute for deployment, account,
browser or conversation checks on the selected host.

## Keep application traffic direct when possible

Use the selected host's `/docs/PEER_CONNECTIONS.md` and the maintained native and browser owner helpers. They share one direct-first policy and automatic encrypted relay fallback. Native RTC is part of the standard session package; browser RTC runs in an attached page with the protocol owner retained in its Worker. Do not add a second discovery/retry loop or silently disable the direct opener. Verify real traffic and actual direct traffic; retain relay fallback for devices or networks that cannot connect directly. Historical receipts retain their historical scope; qualify this protocol and exact release graph independently.
