# Evidence for the assistant connection cookbook

This guide's overall evidence label is **explained** because an actual
ChatGPT-subscribed conversation has not been shown receiving and returning a
live production request. The implemented service has a tested local native/MCP
round trip, and the alternate Workspace Agent adapter has synthetic-provider
tests. Those results do not establish live account linking or a deployed
OpenAI conversation.

## Tested core source and artifact

The aggregate implementation is pinned to Tendriller
[`61682a11f341449252e78b36443985c0583b5a9b`](https://github.com/werg/tendriller/tree/61682a11f341449252e78b36443985c0583b5a9b/integrations/chatgpt),
the source proposed in [core PR #61](https://github.com/werg/tendriller/pull/61).
With `CHRONOLOG_SESSION_PACKAGE` set to the extracted public package,
`npm run test:chatgpt` passed **112 tests, zero failures and zero skips**.
The independent [hosted integration run](https://github.com/werg/tendriller/actions/runs/44501972372)
also passed all 112 tests at that exact core revision with native cases enabled.

The native run used the public events-only Chronolog package built from
`d014879ecb29714e80311d6101cfa8973953d5c4`, tree
`6290e0ed634992a69956fb8eebbf1ab2058a33b9`. Archive SHA-256:
`673a6ecdf6c6741721efbb250f711f3acf7fa9784624ad5bcbf6596e5a00996c`.
This identifies the local archive used; each rebuild should record its own
actual hash and provenance.

The [service README](https://github.com/werg/tendriller/blob/61682a11f341449252e78b36443985c0583b5a9b/integrations/chatgpt/README.md#tests-and-exact-native-artifact)
gives the build and test commands. The added
[integration workflow](https://github.com/werg/tendriller/blob/61682a11f341449252e78b36443985c0583b5a9b/.github/workflows/chatgpt-integration.yml)
builds the pinned archive under Node 24, enables the native cases, and retains
test logs, archive hash and provenance. The integration gate uses no production
credentials or remote deployment.

## Exercised implementation and precise limits

| Implemented path at the pinned core revision | Checks observed | Evidence boundary |
| --- | --- | --- |
| Native kitchen through authenticated MCP and durable events | Two real native stores and signed attempts; JWT verification, account isolation and consent; signed subscription challenges and filtered delivery; authorized response command, exact retry and store reopen | The JWKS host and callback receiver are injected, and test code supplies the reply text. No live ChatGPT model runs. |
| Kitchen domain, operation client and recovery display | Canonical response correlation, stale/conflicting facts, requester cancellation, advisory expiry, metadata-only egress, retained operation identity and coherent selected-history views | Signed author timestamps are advisory; the append-only projection is not an atomic mutable-state guard. The browser page is not qualified by a live multi-device browser run. |
| OAuth, consent and durable outbox | Generated-key cryptographic token checks, current ownership/consent isolation, bounded requests, signed challenge/delivery, encrypted restart, queued-retry revocation, recovery, leases and late acceptance | A real OAuth provider, public HTTPS resource, subscriber callback and production retention must be accepted separately. |
| Lifecycle and publication adapters | Actual public SDK requests and native signing against a synthetic signed host; approval and reviewed-release boundaries | Human claim/sign-in, a live owner approval and production publication remain unobserved. |
| Portable assistance widget | MCP Apps initialization, explicit message action, optional legacy fallback, source/origin checks, denied/uncertain-message non-retry, bounded host timeout and self-contained resource | Tests use a simulated postMessage host. They do not establish rendering or follow-up behavior in a real ChatGPT client. |
| Published Workspace Agent adapter | Fixed API contract with injected transport; durable-before-send intent, issuer/subject/source isolation, quota refusal, concurrency leases, exact uncertain retry, revocation/recovery, late receipt preservation and run-status validation | No real external trigger or production token is used. Provider completion alone does not prove a Tendriller answer. |

The [aggregate native test](https://github.com/werg/tendriller/blob/61682a11f341449252e78b36443985c0583b5a9b/integrations/chatgpt/test/integration-native.test.mjs)
starts with a native `requestAssistance` command on one peer. The bridge on the
other peer reads the selected event, and the encrypted delivery journal records
the observation cursor and matching subscription job. A synthetic callback
independently verifies the webhook signature. Its acceptance is reported while
the application still has no answer. The test then uses authenticated MCP to
submit `reply_to_assistance`, observes the native answer on the first peer, and
retries the original operation without creating another signed attempt. Delivery
store reopen retains receipts and avoids another send; native store reopen
retains the canonical answer. Cross-account and scope failures are tested before
protected access or callback delivery.

This uses signed synthetic authority, real native storage and cryptography,
and the public encrypted in-process transport. It does not qualify Internet RTC,
a deployed relay, mobile browser storage, public HTTPS or a live OpenAI service.
The kitchen browser source composes the public bootstrap and is syntax-checked.
The widget is bundled with esbuild and its self-contained resource is checked.

The [Workspace adapter documentation](https://github.com/werg/tendriller/blob/61682a11f341449252e78b36443985c0583b5a9b/integrations/chatgpt/WORKSPACE_AGENT.md)
defines the separate configured conversation, minimal identifier payload,
retained operation identity and explicit write-back requirement. Its provider
transport tests establish the adapter's behavior under specified responses;
they do not measure provider idempotency retention or published-channel
availability.

## Still required for a live acceptance record

Record the deployed origin and exact source, OAuth issuer/resource and successful
account linking, the owner's explicit consent, the enrolled bridge's verified
grant, a selected-history request, the exact subscription callback's signed
challenge, an acknowledged event, the subscribed chat's run, the subsequent
signed reply command and the page's updated query.

For the Workspace alternative, record the deliberately configured published
channel, consented trigger, returned conversation/run receipt, the agent's
authorized MCP read and write-back, and the native page's observed answer.
Do not treat a `completed` provider run as that answer. Qualify the widget in the
actual target host with an explicit user click, including unsupported capability
and uncertain-message behavior.

Also record revocation, expired subscriptions, no peers, bridge restart,
duplicate deliveries, uncertain command retry, selected-generation recovery and
a late response to an earlier step in the deployed environment. Do not replace
these observations with a mocked callback, a release artifact, or a screenshot
of an HTML preview.

Current platform references checked on 19 November 2026:

- [OpenAI MCP Events](https://developers.openai.com/plugins/build/mcp-events)
- [MCP resource authentication](https://developers.openai.com/plugins/build/auth)
- [MCP Apps UI](https://developers.openai.com/plugins/build/chatgpt-ui)
- [Portable message request type](https://apps.extensions.modelcontextprotocol.io/api/interfaces/app.McpUiMessageRequest.html)
- [Workspace Agent trigger API](https://developers.openai.com/workspace-agents/trigger-runs)

These references establish the documented routes. Deployment availability and
client behavior need their own live evidence.
