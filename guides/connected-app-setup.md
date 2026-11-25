# Set up a connected application on the selected service

Use this entry when a person asks for a new Tendriller page or wants an existing
page connected to an assistant. Core owns the runnable setup procedure and its
public packages. This guide explains how to select that procedure and recognize
its checkpoints; cookbook specimens and historical qualification reports do not
choose a deployment or an installation baseline.

## Discover the selected host before doing setup work

Keep the exact origin supplied by the person or returned as `serviceOrigin` by
the selected connector. Use that origin for discovery, readiness, creation,
saved handles, owner sign-in and assistant access. A production example in a
source document does not choose the user's host. If the connector supplies no
origin, establish its configured origin before creating an application. Never
switch deployments because creation is paused or an installation step fails.

In MCP, call `tendril_guide` with `topic: "start"` when that tool is available.
Profile, application-list and guide responses advertise the host identity and
setup links. An empty `list_tendrils` means the account has no assistant-connected
applications; it does not imply that the plugin is missing or that creation is
available.

An older installed tool catalog can omit `tendril_guide`. Follow the returned
`setup.startHere`, `setup.buildGuide` or `setup.discoveryUrl` on the same origin.
The public discovery path is `/.well-known/tendriller.json`; it links to the
host's MCP workflow, build guide, service contract, readiness and release
artifacts. Refresh the installed catalog when possible, but a missing guide tool
does not require selecting another host or abandoning the workspace-agent route
below.

Before downloading packages, installing dependencies or requesting an owner's
email for a **new** application, read the selected host's `/api/readiness` and
`/api/service`. Use the current core guide's validation or its public
`describeReadiness` and `requireCreationReady` helpers. The readiness response
must have schema version 1, the exact selected `serviceOrigin`, `mode: "open"`
and `creation.available: true`. Compare the release and runtime identity with
the service descriptor and advertised composition as the guide requires.
Do not follow a descriptor redirect to a different origin.

| Observation | Next step |
| --- | --- |
| Creation is available and identities agree | Follow this host's build guide and matching release. Creation will check current admission again. |
| `creation_paused` or `read_only` | Stop new-app setup and report `creation.nextAction`; retain any existing work. |
| Missing readiness, network failure, unavailable service or invalid identity | Report the unavailable or incompatible host; do not assume creation is safe to try. |
| A saved application already exists | Resume its retained identity and inspect its current permissions, participants and write availability. A new-creation pause alone does not disable existing applications. |

The [core source guide](https://github.com/werg/tendriller/blob/master/docs/BUILD_AN_APP.md)
and [MCP source workflow](https://github.com/werg/tendriller/blob/master/docs/MCP_AGENT_GUIDE.md)
explain the maintained contract. Source changes and open pull requests do not
establish what the selected service has deployed. A missing endpoint or artifact
is a specific host/release upgrade boundary to report.

## Use one qualified release composition

For a new first app, use the immutable first-app release advertised by the host's
discovery document under `firstApp.release`. Its versioned archive carries the
starter and matching SDK, tools and Chronolog session packages. Follow the core
guide to verify the release manifest, composition identity and component hashes
against the host **before installing**. Retain that provenance and the generated
package lock with the application.

The mutable `/downloads/tendriller-first-app.tgz` source archive is useful for
inspection; it does not establish that separately acquired same-version packages
form the same tested composition. If the complete advertised release is missing
or incompatible, report the missing release. Ordinary app setup should not
reconstruct Chronolog from source or combine artifacts from unrelated checkouts.
Source builds and explicitly supplied archives remain useful for deliberate core
development and the separate qualification runners in this repository.

Reuse the starter's actual browser Worker and shared helpers (`shared/helpers/…`)
when adapting the interaction. Keep the starter's `connection.mjs` owner-facing
connection component and browser pairing helper together. They retain this
browser's signer, show progress while the agent program completes enrollment,
resume after a reload and bound retries to the page lifetime. Do not replace that
flow with a collection of setup buttons, invent an identity fallback or poll the
host while an enrolled app is idle. The low-level ownership specimens in this
collection assume an already enrolled profile; they do not replace first-visit
enrollment.

Select the state model before configuring its immutable definition.
The [capability map](https://github.com/werg/tendriller/blob/master/docs/CAPABILITIES.md),
[application patterns](https://github.com/werg/tendriller/blob/master/docs/APP_PATTERNS.md)
and [reviewed media guide](https://github.com/werg/tendriller/blob/master/docs/AI_INPUT.md)
help choose those public primitives. A static preview checks authored UI; it
does not prove an application is connected.

## Register the workspace agent and prepare the ready page

A Tendriller kit is an **agent workspace**: one agent credential (`ta_…`) and one
shared signing key serve any number of pages, with one install and one
`pages/<slug>/` source folder per page. A single page is a workspace with one
page. Check that the execution environment can run Node 24 and retain the
private `.tendriller/` folder, then register the agent once, choosing the route
the selected host supports:

| Route | Use when | Result |
| --- | --- | --- |
| `npx tendril workspace key`, MCP `register_agent`, then `npx tendril workspace adopt --credential FILE` | An account-linked MCP connector with `tendrils:create` is configured and granted | An agent under the linked account; the host derives the owner, so no email is needed |
| `npx tendril workspace init --service ORIGIN --owner EMAIL` | The actual owner's verified login email is known and no account-linked creation exists | An unclaimed agent; the owner claims it, and every page it created, by signing in to any one of them |
| **Dashboard → Your agents → Add agent**, then `npx tendril workspace join --service ORIGIN --code CODE` | A signed-in owner invites a new agent | An agent under that account; the single-use code expires in ten minutes and is a credential |

An opaque connector profile ID does not reveal an owner's email, grant ownership
or substitute for a missing configured/granted scope. Report that specific
boundary rather than silently broadening consent. Source changes do not upgrade
an installed tool catalog. `workspace init` is refused when the folder already
has an agent, and a lost registration reply is not reconstructed: inspect the
account's agents before registering again.

Then create the page with `npm run page:new -- <slug>`. The creating agent is
granted it automatically; an existing page needs the owner's explicit grant (a
checkbox per agent on the dashboard, or the page's **Add people & devices → An
agent** tab) followed by `npx tendril page grant <slug> <page-id>`. Agents never
receive account-wide access implicitly, and the grant is not an application
device or assistant permission.

Keep preparing without waiting for a "claimed" reply: initialize with
`npm run init -- <slug>`, configure the application, build and publish the first
signed UI with `npm run deploy -- <slug>` (or
`npx tendril --page <slug> publish pages/<slug>/dist`), prepare any
assistant-access proposal, and start the agent program. Then give the owner the
ready page URL and any permission-review URL. Do not publish an empty shell
merely to get a claim link.

Owner sign-in claims the prepared agent and its pages. Browser enrollment and
assistant access are separate grants: the agent token is a host credential, not a
device signer, and an assistant account connection is not a browser's application
membership. Keep the credential, the shared signing key and private device
stores out of published files; `tendriller.json` holds no secret and
`.tendriller/` stays private and gitignored. Cookbooks cannot grant permissions
or replace them with payload labels.

### Keep the checkpoints distinct

| Checkpoint | What it establishes | What still needs evidence |
| --- | --- | --- |
| Agent registration and page grant | The agent credential can create, publish to and open the page. | The browser device has its own retained signer and an application grant. |
| Owner sign-in and claim | The intended account owns the already-prepared page. | The browser device is enrolled and connected. |
| Assistant permission review | The account approves the displayed queries, commands and optional events. | The agent program is running, its adapter is online and a requested tool round trip succeeds. |
| Browser device enrollment | The browser proves possession with its own key; the agent program stages the exact signed proposal and the host approves it automatically for the signed-in owner or an admitted guest. There is no owner approval screen. | The enrolled browser connects, observes a command and reopens the same identity and retained work. |

A successful sign-in in the person's browser does not authenticate an agent's
separate browser session. Inspect the actual session being used; when it needs
login, let the owner complete that sign-in there. Reuse the saved workspace,
device stores and operation references after each checkpoint instead of creating
a second agent, page or signer when something is delayed.

Core's [session bootstrap](https://github.com/werg/tendriller/blob/master/docs/SESSION_BOOTSTRAP.md),
[multi-page agents design](https://github.com/werg/tendriller/blob/master/docs/MULTI_PAGE_AGENTS.md)
and [MCP agent guide](https://github.com/werg/tendriller/blob/master/docs/MCP_AGENT_GUIDE.md)
describe workspace registration and browser pairing. Use them through the
selected host's matching guide and complete release. A missing endpoint,
incompatible storage or absent release remains an explicit upgrade boundary; this
guide does not establish deployment.

### Run one agent program for every page

`npm run agent` (`tendril agent run`) is the long-running native session owner.
It keeps one hub connection for setup notices, discovery, invitations, WebRTC
rendezvous and assistant adapter streams of every granted, initialized page, and
opens one Chronolog session per page with its own device store signed by the
shared key. Application sync data keeps direct per-page connections. Other
commands are short invocations that attach to it: `tendril --page <slug> <command>`.
Start it before the owner opens the page and keep it running while browsers write.
A separate assistant worker or host-delivery bridge has its own supervised
lifetime. The native owner may stay connected when that worker is stopped; it
must not advertise the worker's request topics or renew its listening state.

Browser pairing is processed automatically by that program. The browser saves one
public request and proves possession of its own key; the page's owner durably
pauses command ordering and stages the complete signed control proposal; the
host verifies it against the proved key, account and current authority and
approves it for the signed-in owner or an admitted guest; the program commits the
approved transition after the server rechecks account access. The page shows
progress ("Setting up this browser…", "Finishing setup…") and connects by itself.
Neither the host nor the browser receives the shared signer.

Individual pairing requests expire after ten minutes; an unattended page renews
one request automatically per visit and then waits for an explicit action. Stopping
the agent program does not clear a durable ordering pause. Restart the same
program and inspect the original request after an uncertain reply: exact receipt
reconciliation or a verified terminal request with no committed transition can
release the pause; deleting local records or silently rebasing the proposal
cannot. Keep `pending`, `approved`, `committing` and `committed` distinct; a later
revoked grant stays revoked on retry. Pairing status alone is not a successful
application connection. `npm run enroll -- <slug> PUBLIC_KEY` is a deliberate
manual administration route and needs the agent program stopped, because it owns
every page device store.

### Continue after a lost credential or device

`.tendriller/agent/` (credential and shared signer) and
`.tendriller/pages/<page-id>/` (device store, descriptor, setup and pairing
records) are the workspace's private checkpoint. Restore them from a verified
checkpoint; there is no reissue of a lost key and no converter from older
projects. If only the token is lost or revoked, the owner can add the agent again
from **Dashboard → Your agents → Add agent** and `workspace join` a fresh folder.
Page access follows the signed application grants of the key, so a new key also
needs explicit signed enrollment or recovery through surviving authorized
devices. Core's
[continuation guide](https://github.com/werg/tendriller/blob/master/docs/BUILD_AN_APP.md#continue-after-a-lost-credential-or-device)
is authoritative; confirm that the selected host supports each route. Keep the
original page identity, descriptor and device stores.

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

## Verify the connected result and state its lifetime

Verify the signed publication receipt, a real browser command observed by the
page's owner in the agent program, an authorized assistant query/command when
requested, and retained work after reopening. Keep the original operation
identity through an uncertain response and inspect its receipt before retrying
(`npx tendril --page <slug> operation ID`). Name an uncompleted browser, account
or permission step precisely; file generation alone is not that observation.

State that the agent program stays running for live synchronization and assistant
calls, where `.tendriller/` persists and how it is resumed. Saving in the browser
does not need it. A hosted page does not host a resident agent program or an agent
reasoning process. On-demand MCP tools can work without automatic future chat
turns. Promise unattended replies only after the actual host's supported wake
path passes the [two-probe rehearsal](../cookbooks/connect-resuming-agent/COOKBOOK.md).
Otherwise expose the on-demand or manual handoff described in
[assistant connection choices](../cookbooks/connect-chatgpt/COOKBOOK.md).

Verify a private checkpoint exists and can be read before promising resume. It
must preserve `.tendriller/agent/`, every page's device store, exact pending
operation references and the installed composition; report the actual storage and
process lifetime of the execution environment. Keep the checkpoint outside
authored UI, public archives and version control, and do not copy it into a
second simultaneous store owner. A preview requires a working preview route in
that environment; a local URL alone does not make the page reachable by the
person.

With the current starter, the assistant adapter runs inside the same agent
program (`npm run assistant:prepare` proposes the declared capabilities). A CLI
or page attachment detaches from the owner and must not shut down sibling
clients; stopping the program closes every page owner. Optional event forwarding
is an explicit reviewed choice, separate from ordinary queries and commands. It
creates neither a subscription nor a future chat turn, and it does not keep the
program alive after its environment ends.

Historical source pins and evidence labels below retain their original scope.
They neither certify these newer setup contracts nor substitute for deployment,
account, browser or conversation checks on the selected host.

## Keep application traffic direct when possible

Use the selected host’s `/docs/PEER_CONNECTIONS.md` and the maintained native and browser owner helpers. They share one direct-first policy and automatic encrypted relay fallback. Native RTC is part of the standard session package; browser RTC runs in an attached page with the protocol owner retained in its Worker. Do not add a second discovery/retry loop or silently disable the direct opener. Verify a real command or transfer and actual direct traffic; retain relay fallback for devices or networks that cannot connect directly.
