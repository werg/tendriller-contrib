---
id: "connect-chatgpt"
title: "Connect an application to an assistant and choose a fallback"
summary: "Keep application state in Chronolog while combining account-linked tools, subscribed events, explicit widget actions, and retained deployment or local-agent routes."
group: "Coordinate people and tools"
tags: ["assistant", "chatgpt", "mcp", "events", "consent", "recovery", "deployment"]
choices: ["On-demand tools or subscribed background help", "Enrolled remote reader or local participant", "Explicit widget handoff or separate workspace agent"]
capabilities: []
evidence: "explained"
related: ["run-a-peer-application", "manage-sensitive-data", "recover-outdated-work", "resume-across-sessions", "review-exact-proposal", "share-live-signals"]
sources: ["https://github.com/werg/tendriller/blob/149ec6572992955f33fff995a2f7e69f1c3e7059/docs/CHATGPT_INTEGRATION.md", "https://github.com/werg/tendriller/tree/149ec6572992955f33fff995a2f7e69f1c3e7059/integrations/chatgpt/examples/kitchen", "https://github.com/werg/tendriller/tree/149ec6572992955f33fff995a2f7e69f1c3e7059/integrations/chatgpt/widget", "https://github.com/werg/tendriller/blob/149ec6572992955f33fff995a2f7e69f1c3e7059/integrations/chatgpt/WORKSPACE_AGENT.md", "https://github.com/werg/tendriller/blob/149ec6572992955f33fff995a2f7e69f1c3e7059/docs/SESSION_BOOTSTRAP.md", "https://github.com/werg/tendriller/blob/149ec6572992955f33fff995a2f7e69f1c3e7059/docs/INTEGRATION_OAUTH.md", "https://github.com/werg/tendriller/blob/149ec6572992955f33fff995a2f7e69f1c3e7059/docs/CLOUDFLARE_ASSISTANT.md", "https://github.com/werg/tendriller/blob/149ec6572992955f33fff995a2f7e69f1c3e7059/integrations/chatgpt/config.host-account.example.mjs", "https://github.com/werg/tendriller/blob/149ec6572992955f33fff995a2f7e69f1c3e7059/scripts/test-chatgpt-host.mjs", "https://github.com/werg/chronolog-db/blob/d014879ecb29714e80311d6101cfa8973953d5c4/packages/peer-session/src/tools.ts"]
---

# Connect an application to an assistant and choose a fallback

A person asks for help from their kitchen page. The request belongs to the
shared application, the assistant reads current context, and the answer returns
beside the original question. The person should still understand the status if
the chat cannot wake automatically, the remote participant disappears, or a
recovery excludes the operation.

Start with the smallest route that supports the task, then expose the other
routes through capability discovery and clear failure messages. Reading this
cookbook grants no account, device or outbound-data permission. Its end-to-end
evidence remains **explained**: native/MCP round-trip checks do not substitute for
a live subscribed-chat deployment. See core's
[Cloudflare assistant setup](https://github.com/werg/tendriller/blob/master/docs/CLOUDFLARE_ASSISTANT.md)
and [ChatGPT integration guide](https://github.com/werg/tendriller/blob/master/docs/CHATGPT_INTEGRATION.md)
for the current hosted `/mcp` contracts.

For several people, tools or agents in one application, compose the gateway with
the [multi-participant reference](../coordinate-participants/COOKBOOK.md) and
core's maintained collaboration module. Keep an observed event, a delivered
wake, a claimed task, an active run and an accepted result separate. Authenticated
run bindings supply signer and endpoint identity; a payload's agent label or
conversation ID cannot grant access. Independent specialist agents need separate
enrolled signers or explicitly verified delegation, fixed contribution slots and
fenced claims before external I/O. A configured provider route can be available
without an active reasoning turn. Keep native-owner connectivity, actual
request-worker availability and conversation-host delivery separate. Match
presence to that worker's consumer/run and handled topics; only the worker's
own lifetime may renew it. The [resuming-agent cookbook](../connect-resuming-agent/COOKBOOK.md)
covers active Codex steering, idle queue/resume and the stopped-worker/native-owner-alive
test. Follow core's [conversation-delivery guide](https://github.com/werg/tendriller/blob/master/docs/CONVERSATION_DELIVERY.md)
through the selected service when commissioning a live route.

## Start with the current service guidance

Start with [connected-app setup](../../guides/connected-app-setup.md). For the
service's account-linked MCP, call `tendril_guide` with `topic: "start"` when it is
available. A stale installed catalog can omit the tool; use the returned
same-origin setup links or `/.well-known/tendriller.json` instead. Keep the
selected connector's `serviceOrigin` throughout, including staging.

For a new app, check `/api/readiness` before downloads or installation, then use
the host's build guide and immutable first-app release. Stop on paused or
unverified creation. Check native runtime and retained-process capabilities,
register the workspace agent and create the page, then prepare authority, the first signed UI and any assistant-access proposal
before asking the owner to sign in; do not stop to request a “claimed” reply.
The ready page and permission-review URL can be given together. Owner sign-in
claims the prepared agent and its pages; browser enrollment and assistant
consent remain explicit. For an existing app, request `topic: "connect"` and use that
participant's real permission-review URL. An empty `list_tendrils` lists no
assistant-connected apps; it does not imply a missing plugin or establish
creation availability. The core CLI's `guide --server ORIGIN` and public
discovery share the same navigation. Keep runnable setup procedures there.

The source-pinned Node integration examples and qualification notes below are
historical provenance only. They are not current installation instructions:
do not import or deploy their archived standalone server, adapter, or bridge
configuration. Use the current service guides and public controllers below.
Ordinary OAuth-client calls do not require registering another independent agent
binding.

## Choose the route by the desired interaction

| Route | What the person can do | What must be available | Limitation to display |
| --- | --- | --- | --- |
| Remote MCP tools | Ask the current chat to inspect state and return an authorized response | Account linking, connection consent, the configured integration's enrolled application participant and available retained history, declared tool allowlists | A successful tool connection does not provide background chat wake |
| MCP Events subscription | Ask a supported Work chat or dot to watch a selected application's help requests | The tool prerequisites plus an active verified callback, finite lifetime and durable delivery journal | Delivery is asynchronous; webhook acceptance does not prove an answer |
| Mounted MCP Apps card | Refresh a request and deliberately press **Send this to ChatGPT** | A compatible mounted host, allowed tool calls and message capability | Closing or hiding the card removes any availability assumption |
| Native CLI / JSON-lines participant | Let an implementing agent query and command the application directly | Public session archive, its own enrolled device, reachable peers and retained local storage | A temporary process stops when its environment ends |
| Codex thread receiver | Inject retained page work into the observed active turn, or queue/resume while idle | A compatible installed host, exact store/daemon/thread binding, one supervised receiver and observed active/idle rehearsals | Plain `codex queue` waits while a turn is busy. Steer/queue admission alone does not prove handling, receipt or answer; another server or per-page agent is not automatically the same conversation |
| Manual reference handoff | Copy application/request identifiers into a connected assistant chat | A retained request and a later authorized tool-capable chat | The person initiates the turn; copied identifiers grant no access |
| Workspace Agent API trigger | Route a request through the implemented adapter to a deliberately configured published workspace agent | Separate agent access token, published channel ID, explicit egress policy and response write-back tool | The configured agent has its own conversation; provider completion does not prove application write-back |
| Local voice, photo or realtime input | Draft or analyze explicitly captured input before creating a domain request | Device consent and the application's selected sensor/provider route | Continuous media should use its own transport and budget, not event webhooks |

OpenAI documents Events for supported Work/dot surfaces and webhook delivery.
Use [the current Events documentation](https://developers.openai.com/plugins/build/mcp-events)
when configuring a live subscriber. The target chat chooses its subscription;
an anonymized session label is not a conversation-write credential. Test the
actual client and surface before describing unattended ordinary-chat wake as a
supported feature.

Cards use `_meta.ui.resourceUri`, the MCP Apps initialization handshake and
`ui/message`. An external kitchen browser tab does not have the chat's widget
bridge; offer a manual reference handoff there. See [MCP Apps UI](https://developers.openai.com/plugins/build/chatgpt-ui)
and [its current message type](https://apps.extensions.modelcontextprotocol.io/api/interfaces/app.McpUiMessageRequest.html).
An accepted message is not an observed answer; a timeout must not trigger a
second message through a different bridge.

The [Workspace Agent trigger API](https://developers.openai.com/workspace-agents/trigger-runs)
supports a configured agent, a stable `conversation_key` and idempotency keys.
An accepted run is separate from completion, and its answer is not currently
retrievable through that API. Have the configured agent call the authorized
write-back tool. Keep this route's credential and conversation identity separate
from MCP Events subscriptions.

The [historical Workspace adapter](https://github.com/werg/tendriller/blob/149ec6572992955f33fff995a2f7e69f1c3e7059/integrations/chatgpt/WORKSPACE_AGENT.md)
implemented `trigger_workspace_agent` and `get_workspace_agent_run` with a
`workspaceAgent` configuration at that pinned source. These are historical
interface names, not tools promised by the current hosted endpoint. The design
checked account access, selected source and event consent, persisted the
caller-owned operation before sending, and sent static instructions with
identifiers rather than the question. Its conversation key was scoped to the
configured channel, exact issuer/subject and application. After asynchronous
authorization, it reread the selected source and checked the same source
revision synchronously immediately before provider egress. Already-started
external I/O cannot be retracted by a later revision of the materialized request. Exact retries retain
the original body and idempotency key. The bounded journal preserves accepted
receipts, including late receipts after a later revision, without treating them as a
current request or a signed application answer. Test this route with a real
published channel before promising unattended completion.

## Put the trust boundaries in the implementation

The ordinary Tendriller host remains the filtered participant for account
access, signed authority metadata, publication and peer introductions. It is not an
application execution engine or private history reader. Run the optional remote
integration as an explicitly enrolled native participant with its own signer
and persistent device store. Reuse the public native bootstrap and the existing
direct/relay introductions; do not add another ordering or coordinator policy.

Keep these decisions separate:

| Boundary | Required evidence |
| --- | --- |
| Account identity | A valid audience-bound OAuth access token or the explicitly configured local-only development route |
| Application access | A verified mapping to the existing owner/account authority; a URL or model-provided identifier is insufficient |
| Outbound consent | The owner-selected application, events, readable queries, permitted commands and expiration |
| Chronolog access | Current signed device grants, selected authority and the correct keys |
| Publication | Separate publisher authority and an exact signed release; prefer preparing for the existing publisher device |

An OAuth token cannot create a Chronolog writer or publisher. Likewise, a reader
grant does not authorize cloud egress. Current reader grants expose application
history to the reader; a filtered event projection is not a notification-only
cryptographic grant. Explain the reader's actual access before enrollment and
minimize what leaves it.

The Worker uses the existing Tendriller account as the authorization server.
It checks the exact OAuth grant and current owner, and serves the consent form
at `/connections` after GitHub or Google sign-in. Configure the intended OAuth
client on that service and use the participant's exact signed assistant proposal
for application access. Follow the current service guide for supported issuers
and configuration rather than a historical adapter.

The service requires authorization code, PKCE S256, issuer/resource binding and
current authorization checks. Existing upstream account-login tokens are not
automatically MCP access tokens. The supplied host supports predefined public
clients (`none`) and confidential clients (`client_secret_basic`); the exact
callback must come from the intended ChatGPT client. It does not provide dynamic
client registration or OIDC. If the chosen client requires unsupported capabilities,
choose a client supported by the selected service and its advertised MCP resource,
or use authorized on-demand tools or manual handoff to a supported client.
Preserve issuer, redirect, resource and device-authorization checks. Follow
[OpenAI authentication guidance](https://developers.openai.com/plugins/build/auth)
and the integration's configuration documentation for the exact resource.

## Deploy on the Tendriller Worker

Follow core's [Cloudflare assistant setup](https://github.com/werg/tendriller/blob/master/docs/CLOUDFLARE_ASSISTANT.md)
and [OAuth setup](https://github.com/werg/tendriller/blob/master/docs/INTEGRATION_OAUTH.md)
to enable the service's single account-linked `/mcp` endpoint and `/connections`
consent surface. Each page Durable Object owns its approved assistant connection,
event inbox, and encrypted delivery queue while application code and durable state
remain on the enrolled Chronolog participants. With no queued assistant work, the
hibernating participant socket adds no timer or idle polling.

Build the allowed native tool controller with `createScopedApplicationTools`
from `@chronolog/peer-session`, and pass it directly as `tools` to
`connectApplicationAssistant` from `@tendriller/core/assistant`. Its `execute`
method owns scoped query/command/operation execution. Keep the original operation
identity after an uncertain response; do not implement another dispatcher or
translate calls through a second tool facade.

For durable events, use Chronolog's `forwardSessionEvents` with the application's
durable checkpoint and projection. Supply
`createAssistantEventDelivery({ assistant, onSkipped })` as its delivery callback.
Chronolog owns read views, recovery, cancellation and checkpoint advancement;
Tendriller supplies host acknowledgement and retry. Record owner-declined
projections through `onSkipped` separately from delivered events. Advancing a
checkpoint follows successful callback completion, not merely a socket send.
The current assistant guide supplies connection setup. The delivery helper's
bounded retry budget can exhaust; a rejected delivery ends `forwardSessionEvents`.
Supervise that task with the application's stop signal and an explicit finite
backoff/retry policy, reopening from its unchanged durable checkpoint. Treat
`EVENT_FORWARDER_REVIEW_RECOVERY` separately: inspect the checkpoint and selected
history, apply the application's explicit recovery decision, then resume only
from a reviewed valid position. Never reset the cursor to skip uncertain work.
If the assistant closes with `startup_timeout` before its first connection opens,
create a new assistant with `connectApplicationAssistant` before reopening the
forwarder from that unchanged durable checkpoint. After its first connection,
the assistant reconnects without a deadline. Do not recreate it to bypass a
terminal `participant_replaced` or `approval_changed` disconnect; inspect the
current participant and approval first.
A failed batch may have delivered some events before checkpoint persistence;
restarted forwarding can repeat them. Receivers must deduplicate stable source
identities and proposal IDs, replacing or retracting by stable event identity
when a revision changes them, rather than assume exactly-once delivery.

In the published callback contract, `onSkipped` is synchronous: returning a
Promise does not make the helper await it. A synchronous durable recorder must
finish before returning. For asynchronous persistence, provide an outer delivery
callback that creates a per-invocation helper, captures its declined-event record
synchronously, awaits helper completion, then awaits the durable skipped-record
write before that outer callback resolves. Propagate write failure instead of
advancing the checkpoint; keep declined records distinct from delivered receipts.
Do not share a mutable capture across concurrent delivery invocations.

## Historical kitchen design (provenance only)

The [pinned kitchen source](https://github.com/werg/tendriller/tree/149ec6572992955f33fff995a2f7e69f1c3e7059/integrations/chatgpt/examples/kitchen)
records an older public-session/bootstrap and standalone integration. Its files,
bridge setup and enrollment commands are not current installation directions.
Do not import that archived infrastructure into a new app or use it as an OAuth
fallback. Start with the selected service's current build guide and use the
canonical scoped controller/event-delivery route above.

The pinned model's version 2 bound each request to the original
`cookingStepEventId` and the step ID from the same `kitchenContext` snapshot.
That is a useful domain invariant when implementing a similar current app:
retain the exact source event instead of substituting whichever step is current
when the request is ordered. The historical version number is not the version
of the current starter, and republishing UI alone does not change an immutable
domain definition.

The following sequence describes that historical design, not a runnable setup
procedure or a claim that its old tool names/configuration remain available.
Current application creation, publication, browser enrollment and assistant
consent follow the current service guides with their exact reviewed identities.

The specimen follows this user-visible sequence:

1. The person selects a cooking step and writes a question. Typed input works
   without sensors. Validation happens before retention. The browser reserves
   one durable pending slot under an exclusive Web Lock, then submits
   `requestAssistance` using that original operation ID. Another tab cannot
   overwrite the retained command.
2. A coherent materialized snapshot read produces the request event. The allowlisted
   projection emits a small `assistant.help_requested` notification containing
   the request identifier and category. It omits the question and media.
3. A matching active subscription receives one signed envelope. The journal
   persists its source identity, revision, delivery ID and retry state alongside
   the observation cursor. It reports a receiver acknowledgment separately.
4. The assistant calls `get_assistance_status`, checks the request event,
   context, step, expiry and conflicts, then submits `reply_to_assistance` with a
   caller-owned stable operation ID. This becomes a normal signed application
   command from the enrolled bridge.
5. The page sees `session.changes()`, rereads a coherent snapshot and displays
   the correlated answer. A changed step remains visibly stale. The person can
   inspect conflicts; no response automatically changes stock or buys anything.
6. If no subscriber is active, the request remains visible and the person can
   copy its reference into a tool-capable chat. A later response uses the same
   query and signed-command route.

The page reads the latest 20 compact request summaries and exposes a separate
`assistanceStatus` read for the full question and canonical answer, including an
older request entered by ID. Bounded reply/conflict lists retain counts and
truncation flags; omitted history is not silently resolved. For an operation excluded by a configured closed frontier, an explicit review can
release its pending slot while retaining the original reference. It never automatically submits replacement
work. A stale acknowledgment only clears the exact operation it inspected.
If the released-reference list is full, download it from **Released operation
references**, select that file to verify and clear its matching entries, then
retry the release. Newer entries remain. Keep the archive private.

The events-only specimen keeps append-only request and response facts. Its
query chooses a canonical matching response and reports additional or stale
facts; it does not claim an atomic mutable-state guard. Author timestamps are
signed statements about that author's clock, not trusted wall-clock deadlines.
For stock updates or hard policy checks, use [a suitable state model](../choose-data-model/COOKBOOK.md)
and real transaction guards. A read followed by a command can race.

## Give implementing agents precise workarounds

| Observed problem | Keep intact | Useful next route or action |
| --- | --- | --- |
| The installed catalog omits `tendril_guide` | The selected connector's service origin | Read its returned setup URL or public discovery on that same origin; refresh the catalog when possible |
| New creation is paused or readiness is unavailable | The selected service and any saved application handle | Stop new setup before installation and report the host's next action; inspect existing-app access separately |
| The advertised first-app composition is missing or mismatched | The host identity and exact artifact provenance | Request the matching qualified release; do not combine same-version packages from separate sources |
| The agent sandbox cannot resolve the page host | Original host handle and selected service origin | Use the connected remote MCP route; otherwise resume the participant in an environment that can reach the host |
| Native RTC is unavailable | Chronolog authentication and participant transport | Use the maintained encrypted relay fallback; do not invent another data endpoint |
| OAuth is unlinked or expired | Existing app state and device identity | Relink that account; use an already authorized local participant if appropriate |
| The intended client requires unsupported registration or identity features | Exact redirects, issuer/resource checks and current authority | Choose a client supported by the selected service and its exact advertised MCP resource; otherwise use authorized on-demand tools or manual handoff to a supported client. Preserve issuer, redirect, resource checks and device grants |
| Local preflight passes but online preflight fails | The private stores, signing keys and actual application mapping | Check the selected service's deployment readiness, approved assistant proposal, current enrollment and participant availability; local readiness does not prove remote readiness |
| The bridge is not enrolled, or its grant was revoked | The explicit owner decision | Obtain verified enrollment or restore permitted access; do not borrow a browser signer |
| No retained authorized peer has the operation | The pending request and original operation ID | The device keeps it stored locally. Restore a retained participant for peer delivery; show offline/unavailable rather than claiming delivery |
| No active Events subscription, or unsupported client | The application request | Use on-demand tools, the mounted card, or the manual reference handoff |
| A webhook was accepted but no answer appeared | Delivery ID and application request | Inspect callback receipt and current request; an asynchronous assistant run may still be pending |
| A command timed out | Exact saved input, operation ID and signed attempt | Inspect the original operation, then retry it exactly; do not generate a new domain attempt |
| Web Locks or durable browser storage are unavailable | The unsent question and any retained operation | Use a compatible browser or authorized native participant; do not bypass durable reservation before sending |
| A finality-excluded operation blocks the next request | Its signed proposal and original input | Explicitly review and release that terminal reference, then deliberately start new work if still needed |
| Enrollment became obsolete before it ever committed | The original signed request and current verified authority | Review a replacement with the exact key and grants, then approve its digest; do not silently replace a historical request |
| A closed frontier excluded the source request or reply | Delivery journal and exclusion evidence | Reread a coherent snapshot, display the exclusion, and require a deliberate new reviewed operation if still wanted; never silently retimestamp it |
| An answer refers to an earlier cooking step | Original request and response provenance | Keep the response labeled stale; ask again only as a new deliberate task |
| The card is unmounted or message outcome is uncertain | Existing conversation and request | Use normal tool calls or inspect the chat before sending another message |
| A Workspace trigger timed out or its run completed without a reply | Original operation, idempotency key and provider receipt | Inspect the configured receiver's retained run/delivery receipt and query current application status through authorized tools; retry only the original request when permitted and verify its write-back access. The hosted endpoint does not promise the historical adapter's run-inspection tool |
| The delivery or Workspace journal is full | Existing receipts and uncertain operation identities | Stop new triggers, reconcile retained work and deliberately archive reviewed records; do not silently discard deduplication evidence |
| Publisher authority is absent | Prepared assets and review intent | Ask the existing enrolled publisher to sign the exact release |

The native fallback can use the existing public
`createApplicationTools(session)` or `serveApplicationToolLines(...)` facade,
which exposes declared query, command, operation, wait and exact-retry semantics.
Do not copy every local tool into the remote model allowlist: finalizer signing,
role management, key provisioning and publication have separate trust
requirements. A tool listing is a capability description, not a grant.

For a custom application domain, use the current native bootstrap and hosted
assistant guide above with the selected service's exact OAuth resource. Keep
authorization checks, keys and device signers on their owning participant. The
historical standalone adapter is provenance, not an alternate installation path
for the current hosted contract.

## Verify the whole journey and its failures

The Worker integration tests exercise the actual page relay and a materialized
Chronolog snapshot through a read, an authenticated wake, signed callback
delivery, object eviction, retry with the original delivery ID, and a signed
reply observed by the page. The callback receiver supplies a scripted
response; keep live subscribed-chat runs recorded as separate evidence.

Exercise the application with two real devices before claiming a connected
result. Demonstrate a request, a read on the other device, the reply, reload,
retained operation inspection, a deliberately lost response, exact retry and
stale-step display. Check that the copied handoff works without the widget.

For the remote route, verify two accounts and two subscriptions with different
application filters; neither can read or receive the other's events. Check
revocation during a queued retry, expiry, invalid callback addresses, signed
challenge verification, stable retry IDs, recovery of the source event and
restart between cursor persistence and delivery. Receiver `2xx` is only a
receipt. Record the actual subscribed-chat run and resulting signed write-back
as separate evidence.

Report exact source commits and artifact hashes, the running process and its
lifetime, publication receipt, selected revision, operation identity and
delivery state. Log identifiers and status rather than private request text.
If a live prerequisite is missing, name it and offer the route above that still
works, keeping any test record scoped to what was actually observed.
