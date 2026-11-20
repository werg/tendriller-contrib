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
does not require registering an independent agent or selecting another host.

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

Reuse the starter's actual session, browser Worker and helpers when adapting the
interaction. Select the state model before configuring its immutable definition.
The [capability map](https://github.com/werg/tendriller/blob/master/docs/CAPABILITIES.md),
[application patterns](https://github.com/werg/tendriller/blob/master/docs/APP_PATTERNS.md)
and [reviewed media guide](https://github.com/werg/tendriller/blob/master/docs/AI_INPUT.md)
help choose those public primitives. A static preview checks authored UI; it
does not prove an application is connected.

## Prepare the ready page before the owner's review

Check that the execution environment can run the required native participant
and retain its private store. After a successful creation preflight, use the
selected host's account-bound setup when the connected client has the currently
granted `tendrils:create` scope. Core's `prepare_tendril_setup` and
`inspect_tendril_setup` tools, `/api/setup` operations and `@tendriller/core/setup`
SDK derive the intended owner from the authenticated account and its verified
identity. No owner email or account ID is supplied by the implementing agent.
Existing grants do not acquire a new scope automatically.

Before calling prepare, use the starter's setup-intent command or the SDK's
`createSetupIntent` with private durable storage. Retain the operation ID,
complete request and generated setup credential locally; send only the public
request and credential commitment. After a lost response, inspect that same
operation. Combine its ready metadata with the original local credential to
reconstruct the same handle. A full ledger, lost credential or
`reconciliation_required` result needs its stated recovery action; do not create
another page, mint another secret or discard an uncertain operation.

The existing email-based route remains available when it is explicitly selected
or account-bound setup is unavailable at the host. It needs the actual owner's
verified email. An opaque connector profile ID does not reveal that email or
grant authority to claim the page. Report a missing API or scope precisely;
do not expand consent or switch hosts to bypass that boundary.

Create once and retain its private setup handle. Configure the application,
initialize its native session, build and publish the first signed UI, prepare
any assistant-access proposal, and start the participant before giving the owner
the ready page and permission-review URLs. Do not pause implementation for a
“claimed” reply or publish an empty shell merely to get a claim link.

Owner sign-in retains the prepared authority and code. Browser device enrollment
and assistant access are separate reviewed grants. A host token is not a device
signer; an assistant account connection is not a browser's application membership.
Keep credentials and private stores out of published files. Use the current
host's actual enrollment and consent procedures; cookbooks cannot grant those
permissions or replace them with payload labels.

### Keep the three approval checkpoints distinct

| Checkpoint | What it establishes | What still needs evidence |
| --- | --- | --- |
| Owner sign-in and claim | The intended account owns the already-prepared page. | The browser device has its own retained signer and an approved application grant. |
| Assistant permission review | The account approves the displayed queries, commands and optional events. | The native participant is running, its adapter is online and a requested tool round trip succeeds. |
| Browser device enrollment | The browser proves possession, the owner reviews its exact key and rights, and the retained native administrator commits the signed transition. | The enrolled browser connects, observes a command and reopens the same identity and retained work. |

A successful sign-in in the person's browser does not authenticate an agent's
separate browser session. Inspect the actual session being used; when it needs
login, let the owner complete that sign-in there. Reuse the saved application,
device store and operation references after each checkpoint instead of creating
a second page or signer when a review is delayed.

Core's [account-bound setup and reviewed pairing implementation](https://github.com/werg/tendriller/blob/master/docs/ONBOARDING_PROTOCOL_FOLLOWUPS.md)
records the APIs and acceptance evidence added in
[core PR #68](https://github.com/werg/tendriller/pull/68). Source implementation
does not establish that a selected host has deployed that composition. Follow
its verified release and report an unavailable interface as an upgrade boundary.

With the matching first-app starter, **Set up this browser** opens the retained
device in a fenced Worker and saves a request ID before networking. The
`@tendriller/core/pairing` client obtains an authenticated challenge and submits
the device's proof. The challenge binds the exact service and page origins,
application, account, key, read/write rights, selected generation and ten-minute
expiry. The private key remains in the browser's retained device storage.

The returned review URL opens on the service origin. The owner reviews the
displayed fingerprint and rights there, using a one-use session-bound form.
Approval waits for the existing native coordinator/administrator; it does not
itself enroll the browser. Keep `npm run peer` running, or use the starter's
one-shot `npm run pair` while that native owner is stopped. The participant saves
the exact signed attempt before submitting it through the existing control
transition. It adds only the reviewed reader/writer grant and account binding.

Keep the same request, browser key and signed attempt through delayed review,
reload or a lost response. Refresh its status to distinguish `pending`,
`approved`, `committing` and `committed`. An expired, denied or stale request
requires an explicit new request and review for the same device. Revocation and
`reconciliation_required` never trigger automatic re-enrollment. Show connected
only after the committed device performs a real application query or command.

## Verify the connected result and state its lifetime

Verify the signed publication receipt, a real browser command observed by the
native participant, an authorized assistant query/command when requested, and
retained work after reopening. Keep the original operation identity through an
uncertain response and inspect its receipt before retrying. Name an uncompleted
browser, account or permission step precisely; file generation alone is not that
observation.

State which participant remains running, where its private state persists and
how it is resumed. A hosted page does not host a resident native peer or an agent
reasoning process. On-demand MCP tools can work without automatic future chat
turns. Promise unattended replies only after the actual host's supported wake
path passes the [two-probe rehearsal](../cookbooks/connect-resuming-agent/COOKBOOK.md).
Otherwise expose the on-demand or manual handoff described in
[assistant connection choices](../cookbooks/connect-chatgpt/COOKBOOK.md).

Verify a private checkpoint exists and can be read before promising resume. It
must preserve the setup handle, device store, exact pending operation references
and installed composition; report the actual storage and process lifetime of
the execution environment. Keep the checkpoint outside authored UI, public
archives and version control, and do not copy it into a second simultaneous
store owner. A preview requires a working preview route in that environment;
a local URL alone does not make the page reachable by the person.

With the current starter, the assistant adapter runs on the same owned native
participant. Close the owned supervisor when that process stops; a CLI or page
attachment detaches from the owner and must not shut down sibling clients.
Optional event forwarding is an explicit reviewed choice, separate from ordinary
queries and commands. It creates neither a subscription nor a future chat turn,
and it does not keep the native process alive after its environment ends.

Historical source pins and evidence labels below retain their original scope.
They neither certify these newer setup contracts nor substitute for deployment,
account, browser or conversation checks on the selected host.
