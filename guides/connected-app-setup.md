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
interaction. Keep the starter's `connection.mjs` owner-facing connection component
and browser pairing helper together. They retain this browser's signer, show the
normal owner review, resume after approval and bound retries to the page lifetime.
Do not replace that flow with a collection of setup buttons, invent an identity
fallback or poll the host while an enrolled app is idle. The low-level ownership
specimens in this collection assume an already enrolled profile; they do not
replace first-visit enrollment.

Select the state model before configuring its immutable definition.
The [capability map](https://github.com/werg/tendriller/blob/master/docs/CAPABILITIES.md),
[application patterns](https://github.com/werg/tendriller/blob/master/docs/APP_PATTERNS.md)
and [reviewed media guide](https://github.com/werg/tendriller/blob/master/docs/AI_INPUT.md)
help choose those public primitives. A static preview checks authored UI; it
does not prove an application is connected.

## Prepare the ready page before the owner's review

Check that the execution environment can run the required native participant
and retain its private store. After a successful creation preflight, follow the
selected host's implemented setup route. Current core supplies account-bound
setup through `prepare_tendril_setup`, `inspect_tendril_setup` and bounded
`list_tendril_setups`, using the connector's existing configured and granted `tendrils:create` scope. The same public `/api/setup` boundary is available through `@tendriller/core/setup`; existing grants gain no implicit rights.
The starter's `setup:prepare` saves one private credential and operation before
printing public arguments; the host derives the verified owner and accepts only
the credential commitment. `setup:finish` combines the exact ready receipt with
that original private credential. Inspect the original operation after a lost
reply; do not create another intent or switch routes as a retry.

When the selected host supports only the explicit email route, or that route is deliberately chosen for a new application, it needs the
actual owner's verified email. An opaque connector profile ID does not reveal
that email, grant ownership or substitute for a missing configured/granted
scope. Source changes do not upgrade an installed tool catalog. Report that
specific boundary rather than silently broadening consent.

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
| Browser device enrollment | The browser proves possession; the native owner stages the exact signed proposal; the owner reviews its key, rights and retained history before normal control commitment. | The enrolled browser connects, observes a command and reopens the same identity and retained work. |

A successful sign-in in the person's browser does not authenticate an agent's
separate browser session. Inspect the actual session being used; when it needs
login, let the owner complete that sign-in there. Reuse the saved application,
device store and operation references after each checkpoint instead of creating
a second page or signer when a review is delayed.

Core's [session bootstrap](https://github.com/werg/tendriller/blob/master/docs/SESSION_BOOTSTRAP.md)
and [MCP agent guide](https://github.com/werg/tendriller/blob/master/docs/MCP_AGENT_GUIDE.md)
describe account-bound setup and reviewed device pairing. Use them through the
selected host's matching guide and complete release. A missing endpoint, incompatible
storage or absent release remains an explicit upgrade boundary; this guide does not
establish deployment.

For ordinary browser pairing, start the retained native peer before review.
The browser saves one public request and proves possession using its own key.
The same native owner saves the intent, durably pauses command ordering and
stages the complete signed control proposal before approval. On the service
origin, the owner reviews its fingerprint, account, application, origins, narrow
rights, generation, retained prefix and proposal digest. The normal selector
rechecks current authority and account access before committing that exact
proposal. Neither the host nor the browser receives the native signer.

The starter's native pairing window is at most ten minutes, with idle checks
backing off to thirty seconds. Browser checks are explicit, including a single check on returning from
review; requests are not automatically renewed. Closing a window or process
does not clear a durable ordering pause. Reopen the same participant and inspect
the original request after an uncertain reply. Exact receipt reconciliation or
a verified terminal request with no committed transition can release the pause;
deleting local records or silently rebasing the proposal cannot. Keep `pending`, `approved`, `committing` and `committed` distinct; a later revoked grant stays revoked on retry. Pairing status
alone is not a successful application connection.

Keep the native peer or assistant running through preparation, owner review,
commitment and independent receipt verification. The single-pass `npm run pair`
command is a deliberate inspection/retry step while that resident owner is
stopped; it does not wait for human approval or the later verification pass.
If it prepares or submits a proposal, restart the same retained native owner to
finish or reconcile that request before application ordering can resume.

If a setup reference is lost, the current core owner view at `/dashboard/setups`
lists bounded retained operations, and its page-specific view inspects the
original allocation. These views require the active owner's service session and
remain read-only after connector revocation. They expose no replacement secret.
Preserve the original private checkpoint and use an actually available reviewed
recovery route when authority is missing.

For a claimed page whose setup credential expires or is lost, the core guide's
[same-app continuation](https://github.com/werg/tendriller/blob/master/docs/BUILD_AN_APP.md#continue-the-same-app-after-setup-credential-expiry-or-loss)
uses an owner-approved **Add agent** binding and the starter's `host:adopt`
command. Confirm that the selected host supports this route before submitting
the private one-use code. Keep the original application identity, descriptor,
device store and setup operation; host delegation grants no new device membership
or assistant consent. An uncertain redemption needs inspection of that named
binding and renewed owner approval, never an automatic second submission.

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

## Keep application traffic direct when possible

Use the selected host’s `/docs/PEER_CONNECTIONS.md` and the maintained native and browser owner helpers. They share one direct-first policy and automatic encrypted relay fallback. Native RTC is part of the standard session package; browser RTC runs in an attached page with the protocol owner retained in its Worker. Do not add a second discovery/retry loop or silently disable the direct opener. Verify a real command or transfer and actual direct traffic; retain relay fallback for devices or networks that cannot connect directly.
