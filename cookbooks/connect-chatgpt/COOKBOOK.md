---
id: "connect-chatgpt"
title: "Connect an application to an assistant and choose a fallback"
summary: "Keep application state in Chronolog while combining authorized tools, subscribed events, an explicit widget action, and resumable local-agent routes."
group: "Coordinate people and tools"
tags: ["assistant", "chatgpt", "mcp", "events", "consent", "recovery"]
choices: ["On-demand tools or subscribed background help", "Enrolled remote reader or local participant", "Explicit widget handoff or separate workspace agent"]
capabilities: []
evidence: "explained"
related: ["run-a-peer-application", "manage-sensitive-data", "recover-outdated-work", "resume-across-sessions", "review-exact-proposal", "share-live-signals"]
sources: ["https://github.com/werg/tendriller/tree/0d9eff5d4e196313996c8c6cc77a130d2de1cf81/integrations/chatgpt/examples/kitchen", "https://github.com/werg/tendriller/tree/0876ac445e47ded9a73df54515925ed1fdbe4e60/integrations/chatgpt/widget", "https://github.com/werg/tendriller/blob/d9f05c91581095e845452bceca3af8873d5857de/docs/SESSION_BOOTSTRAP.md", "https://github.com/werg/chronolog-db/blob/d014879ecb29714e80311d6101cfa8973953d5c4/packages/peer-session/src/tools.ts"]
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
evidence remains **explained**: the [test record](notes/evidence.md) distinguishes
exercised local components from an unverified live subscribed-chat round trip.

## Choose the route by the desired interaction

| Route | What the person can do | What must be available | Limitation to display |
| --- | --- | --- | --- |
| Remote MCP tools | Ask the current chat to inspect state and return an authorized response | Account linking, connection consent, a running enrolled reader/writer, declared tool allowlists | A successful tool connection does not provide background chat wake |
| MCP Events subscription | Ask a supported Work chat or dot to watch a selected application's help requests | The tool prerequisites plus an active verified callback, finite lifetime and durable delivery journal | Delivery is asynchronous; webhook acceptance does not prove an answer |
| Mounted MCP Apps card | Refresh a request and deliberately press **Send this to ChatGPT** | A compatible mounted host, allowed tool calls and message capability | Closing or hiding the card removes any availability assumption |
| Native CLI / JSON-lines participant | Let an implementing agent query and command the application directly | Public session archive, its own enrolled device, reachable peers and retained local storage | A temporary process stops when its environment ends |
| Manual reference handoff | Copy application/request identifiers into a connected assistant chat | A retained request and a later authorized tool-capable chat | The person initiates the turn; copied identifiers grant no access |
| Workspace Agent API trigger | Route a request to a deliberately configured published workspace agent | Separate agent access token, agent ID, explicit egress policy and response write-back tool | This is a separate workspace-agent conversation, not arbitrary ordinary-chat injection |
| Local voice, photo or realtime input | Draft or analyze explicitly captured input before creating a domain request | Device consent and the application's selected sensor/provider route | Continuous media should use its own transport and budget, not event webhooks |

OpenAI documents Events for supported Work/dot surfaces and webhook delivery.
Use [the current Events documentation](https://developers.openai.com/plugins/build/mcp-events)
when configuring a live subscriber. The target chat chooses its subscription;
an anonymized session label is not a conversation-write credential. Test the
actual client and surface before describing unattended ordinary-chat wake as a
supported feature.

New cards should use `_meta.ui.resourceUri`, the MCP Apps initialization
handshake and `ui/message`. The legacy `window.openai` aliases are compatibility
options, discovered at runtime. An external kitchen browser tab does not have
the chat's widget bridge. See [MCP Apps UI](https://developers.openai.com/plugins/build/chatgpt-ui)
and [its current message type](https://apps.extensions.modelcontextprotocol.io/api/interfaces/app.McpUiMessageRequest.html).
An accepted message is not an observed answer; a timeout must not trigger a
second message through a different bridge.

The [Workspace Agent trigger API](https://developers.openai.com/workspace-agents/trigger-runs)
supports a configured agent, a stable `conversation_key` and idempotency keys.
An accepted run is separate from completion, and its answer is not currently
retrievable through that API. Have the configured agent call the authorized
write-back tool. Keep this route's credential and conversation identity separate
from MCP Events subscriptions.

## Put the trust boundaries in the implementation

The ordinary Tendriller host remains the filtered participant for account
access, signed controls, publication and peer introductions. It is not an
application execution engine or private history reader. Run the optional remote
integration as an explicitly enrolled native participant with its own signer
and persistent device store. Reuse the public native bootstrap and the existing
direct/relay introductions; do not add another coordinator-election policy.

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

Use an OAuth authorization provider that meets the deployed MCP resource's
requirements, including authorization code, PKCE S256, issuer and resource
binding. Verify every request and recheck consent/grants before queries,
commands and outbound delivery. Existing upstream account-login tokens are not
automatically MCP access tokens. Follow [OpenAI authentication guidance](https://developers.openai.com/plugins/build/auth)
and the integration's configuration documentation for the exact resource.

## Adapt the connected kitchen specimen

The [core kitchen source](https://github.com/werg/tendriller/tree/0d9eff5d4e196313996c8c6cc77a130d2de1cf81/integrations/chatgpt/examples/kitchen)
includes a real public-session bootstrap, browser Worker, page, signed release
build, dedicated bridge-device setup, declared commands and deterministic
queries. It is a new application definition. Republishing a UI does not change
an already configured immutable domain.

Provision early: create the page, give the person the actual claim URL, wait for
their own sign-in, configure the definition/authority and initial generation,
publish the signed UI, enroll the verified browser key, and retain the native
process. Enroll the separate bridge reader/writer after explicit consent. The
bridge is not a coordinator or publisher by default, so retain an authorized
coordinating peer too. Do not run two processes against one native device store.

The specimen follows this user-visible sequence:

1. The person selects a cooking step and writes a question. Typed input works
   without sensors. The browser retains the operation reference before its first
   command call, then submits `requestAssistance` using that original ID.
2. A coherent selected-history read produces the request event. The allowlisted
   projection emits a small `assistant.help_requested` notification containing
   the request identifier and category. It omits the question and media.
3. A matching active subscription receives one signed envelope. The journal
   persists its source identity, revision, delivery ID and retry state alongside
   the observation cursor. It reports a receiver acknowledgment separately.
4. The assistant calls `get_assistance_status`, checks the request event,
   context, step, expiry and conflicts, then submits `reply_to_assistance` with a
   caller-owned stable operation ID. This becomes a normal signed application
   command from the enrolled bridge.
5. The page sees `session.changes()`, rereads the selected history and displays
   the correlated answer. A changed step remains visibly stale. The person can
   inspect conflicts; no response automatically changes stock or buys anything.
6. If no subscriber is active, the request remains visible and the person can
   copy its reference into a tool-capable chat. A later response uses the same
   query and signed-command route.

The events-only specimen keeps append-only request and response facts. Its
query chooses a canonical matching response and reports additional or stale
facts; it does not claim an atomic mutable-state guard. Author timestamps are
signed statements about that author's clock, not trusted wall-clock deadlines.
For stock updates or hard policy checks, use [a suitable state model](../choose-data-model/COOKBOOK.md)
and real transaction guards. A read followed by a command can race.

## Give implementing agents precise workarounds

| Observed problem | Keep intact | Useful next route or action |
| --- | --- | --- |
| The agent sandbox cannot resolve the page host | Original host handle and selected service origin | Use the connected remote MCP route; otherwise resume the participant in an environment that can reach the host |
| Native RTC is unavailable | Chronolog authentication and participant transport | Use the maintained encrypted relay fallback; do not invent another data endpoint |
| OAuth is unlinked or expired | Existing app state and device identity | Relink that account; use an already authorized local participant if appropriate |
| The bridge is not enrolled, or its grant was revoked | The explicit owner decision | Obtain verified enrollment or restore permitted access; do not borrow a browser signer |
| No retained authorized peer has the selected history | The pending request and original operation ID | Restore a retained participant; show offline/unavailable rather than claiming delivery |
| No active Events subscription, or unsupported client | The application request | Use on-demand tools, the mounted card, or the manual reference handoff |
| A webhook was accepted but no answer appeared | Delivery ID and application request | Inspect callback receipt and current request; an asynchronous assistant run may still be pending |
| A command timed out | Exact saved input, operation ID and signed attempt | Inspect the original operation, then retry it exactly; do not generate a new domain attempt |
| Recovery excluded the source request or reply | Delivery journal and loss/recovery evidence | Reread selected history, display the loss, and require deliberate reapplication if still wanted |
| An answer refers to an earlier cooking step | Original request and response provenance | Keep the response labeled stale; ask again only as a new deliberate task |
| The card is unmounted or message outcome is uncertain | Existing conversation and request | Use normal tool calls or inspect the chat before sending another message |
| Publisher authority is absent | Prepared assets and review intent | Ask the existing enrolled publisher to sign the exact release |

The native fallback can use the existing public
`createApplicationTools(session)` or `serveApplicationToolLines(...)` facade,
which exposes declared query, command, operation, wait and exact-retry semantics.
Do not copy every local tool into the remote model allowlist: explicit takeover,
recovery, reapplication, role management and publication have separate trust
requirements. A tool listing is a capability description, not a grant.

For the remote service, the implementation's entry point is
`node integrations/chatgpt/run.mjs --config /private/integration.config.mjs`.
The private module supplies its HTTPS resource and trusted OAuth issuer/JWKS,
encrypted delivery-store configuration, allowed application session factories,
and verified account/owner authorization adapters. Consult
[the integration guide](https://github.com/werg/tendriller/blob/chatgpt/bidirectional-integration-20261119/docs/CHATGPT_INTEGRATION.md)
for the current configuration. Do not replace a missing owner adapter with an
always-true function or put private handles, store keys or signers in the page.

## Verify the whole journey and its failures

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
works. Keep the [evidence record](notes/evidence.md) scoped to what was observed.
