# Evidence for the assistant connection cookbook

This guide's overall evidence label is **explained** because an actual
ChatGPT-subscribed conversation has not been shown receiving and returning a
live production request. The implemented service has a tested local native/MCP
round trip, an actual packed host-to-Node account contract and a qualified
release build. The alternate Workspace Agent adapter has synthetic-provider
tests. These results do not establish a human upstream login, a public service
installation or a deployed OpenAI conversation.

## Review follow-up release

Core revision [`14f1543`](https://github.com/werg/tendriller/commit/14f15432bbc5055b91b4bbf8909af51315bbd2b7)
passed [the exact-source release gate](https://github.com/werg/tendriller/actions/runs/44523608997)
with 180 native-enabled integration tests, zero skips, and the packed
Worker-to-Node account test. Download the [release bundle](https://github.com/werg/tendriller/actions/runs/44523608997/artifacts/14529895568)
and [qualification logs](https://github.com/werg/tendriller/actions/runs/44523608997/artifacts/14529940523)
for that revision. It adds callback revalidation at TLS connect, login handoff
without unauthenticated journal reservations, and verified export of released
operation references. It qualifies the separate Node bridge. The sections below
retain the original release evidence.


## Tested core source and release artifacts

The combined implementation is pinned to Tendriller
[`9d62a7ffadf7b9b64ffb6615a2d2647377ff737f`](https://github.com/werg/tendriller/tree/9d62a7ffadf7b9b64ffb6615a2d2647377ff737f/integrations/chatgpt),
the source proposed in [core PR #61](https://github.com/werg/tendriller/pull/61).
The [exact-source integration run](https://github.com/werg/tendriller/actions/runs/44518721328)
completed the full clean release builder on 19 November 2026. Its
[qualified deployment job](https://github.com/werg/tendriller/actions/runs/44518721328/job/135541453432)
passed **175 integration tests, zero failures and zero skips**, using the actual
public native package. It also passed the actual packed Worker/Node account
contract gate and runtime import check before sealing **447 release files**.
The emitted result explicitly records `liveChatGptVerified: false`.

A separate local clean build at the same core and Chronolog sources also passed
those gates with 175 tests, zero skips and 447 sealed files. Its manifest records
Node 24.22.3, npm 11.9.0 and pnpm 10.12.4 on Linux x64, and its host report records
all 12 account-contract phases as passed. This corroborates the build procedure;
it does not claim byte-identical artifacts across toolchains.

| Artifact from that exact run | Size | Purpose |
| --- | --- | --- |
| [tendriller-chatgpt-release](https://github.com/werg/tendriller/actions/runs/44518721328/artifacts/14527855129) | 16,662,878 bytes | Public runtime, exact package archives, minimal bridge template, `RELEASE.json` and `qualification/host-account.json` |
| [chatgpt-integration-qualification](https://github.com/werg/tendriller/actions/runs/44518721328/artifacts/14526333293) | 13,304 bytes | Build logs, native integration output and packed host/account report |

GitHub reports these SHA-256 digests for the downloadable artifact ZIPs:

- Release: `ad04b6c473ca4a52d1bd6719c41a54bada5a9d38cb1b97a0ebf3355ae19a23c3`.
- Qualification: `98e19964a6f91c0f1166db2e0c6826d74b755d4b05f76055f258971193714429`.

These are ZIP digests, not the hashes of the individual SDK/native archives.
`RELEASE.json` contains the actual archive hashes, source cleanliness, toolchain,
qualification results and file hashes. Keep that manifest and the qualification
reports with any retained copy; hosted artifacts have retention limits.

The events-only Chronolog package was built from
`d014879ecb29714e80311d6101cfa8973953d5c4`, tree
`6290e0ed634992a69956fb8eebbf1ab2058a33b9`. The exact release manifest identifies
this build's bytes. Rebuilds must record their actual archive hashes rather than
reuse a digest from an earlier local build.

The [service README](https://github.com/werg/tendriller/blob/9d62a7ffadf7b9b64ffb6615a2d2647377ff737f/integrations/chatgpt/README.md#tests-and-exact-native-artifact)
and [deployment guide](https://github.com/werg/tendriller/blob/9d62a7ffadf7b9b64ffb6615a2d2647377ff737f/integrations/chatgpt/deploy/README.md)
give the build and installation commands. The
[integration workflow](https://github.com/werg/tendriller/blob/9d62a7ffadf7b9b64ffb6615a2d2647377ff737f/.github/workflows/chatgpt-integration.yml)
checks out the exact source head, builds the pinned public packages under Node
24, refuses failed/skipped qualification and uploads the release and logs.
These release gates use no production credentials or remote deployment.

The separate GitHub checks also finished successfully at this exact core source:
[Public service](https://github.com/werg/tendriller/actions/runs/44518721220)
(Node 22.15, Node 24, browser and package jobs),
[onboarding](https://github.com/werg/tendriller/actions/runs/44518721019), and
[speech](https://github.com/werg/tendriller/actions/runs/44518721136). The first
Node 24 attempt exhausted an existing media-inference test's 300-`setImmediate`
observation bound after approximately 4 ms. The same file passed in isolation,
and the failed job passed when rerun on unchanged code; no product or test change
was made for that retry. These checks add repository regression evidence, not a
live deployment or conversation acceptance.

## Exercised implementation and precise limits

| Implemented path at the pinned core revision | Checks observed | Evidence boundary |
| --- | --- | --- |
| Native kitchen through authenticated MCP and durable events | Two real native stores and signed attempts; JWT verification, account isolation and consent; signed subscription challenges and filtered delivery; authorized response command, exact retry and store reopen | The JWKS host and callback receiver are injected, and test code supplies the reply text. No live ChatGPT model runs. |
| Kitchen version 2, operation client and recovery display | Original step-event binding, canonical/stale/conflicting responses, bounded query views, validation before retention, atomic pending-slot reservation, exact acknowledgment, deliberate terminal release, immutable setup records and reviewed enrollment replacements | Signed author timestamps are advisory; the append-only projection is not an atomic mutable-state guard. The browser page is not qualified by a live multi-device browser run. |
| OAuth, consent and durable outbox | Generated-key cryptographic token checks, current ownership/consent isolation, bounded requests, signed challenge/delivery, encrypted restart, queued-retry revocation, recovery, leases and late acceptance | A real OAuth provider, public HTTPS resource, subscriber callback and production retention must be accepted separately. |
| Included account host and Node management | Actual packed Worker, exported migrations, PKCE token exchange, JWT/introspection, exact account/grant checks, one-use browser handoff, owner-selected consent, encrypted reopen, refresh, logout and revocation | Initial host browser accounts/sessions are synthetic and transport is fixed-origin injected Miniflare. No upstream GitHub/Google login, native device or browser rendering is qualified by this gate. |
| Deployment preparation and staging | Exact private configuration, none/basic secret separation, strict settings, release/staged byte integrity, injected readiness/cancellation and a coherent native bridge database backup excluding creator/bootstrap secrets | Tests do not start systemd/Caddy, configure DNS/TLS or prove actual public host/native online readiness. |
| Lifecycle and publication adapters | Actual public SDK requests and native signing against a synthetic signed host; approval and reviewed-release boundaries | Human claim/sign-in, a live owner approval and production publication remain unobserved. |
| Portable assistance widget | MCP Apps initialization, explicit message action, optional legacy fallback, source/origin checks, denied/uncertain-message non-retry, bounded host timeout and self-contained resource | Tests use a simulated postMessage host. They do not establish rendering or follow-up behavior in a real ChatGPT client. |
| Published Workspace Agent adapter | Fixed API contract with injected transport; durable-before-send intent, issuer/subject/source isolation, quota refusal, concurrency leases, exact uncertain retry, selected-source recheck after asynchronous consent, synchronous final generation fence, revocation/recovery, late receipt preservation and run-status validation | No real external trigger or production token is used. Provider completion alone does not prove a Tendriller answer. |

The [aggregate native test](https://github.com/werg/tendriller/blob/9d62a7ffadf7b9b64ffb6615a2d2647377ff737f/integrations/chatgpt/test/integration-native.test.mjs)
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

The [Workspace adapter documentation](https://github.com/werg/tendriller/blob/9d62a7ffadf7b9b64ffb6615a2d2647377ff737f/integrations/chatgpt/WORKSPACE_AGENT.md)
defines the separate configured conversation, minimal identifier payload,
retained operation identity and explicit write-back requirement. Its provider
transport tests establish the adapter's behavior under specified responses;
they do not measure provider idempotency retention or published-channel
availability.

The [packed host/account gate](https://github.com/werg/tendriller/blob/9d62a7ffadf7b9b64ffb6615a2d2647377ff737f/scripts/test-chatgpt-host.mjs)
loads the actual public engine archive into Miniflare, applies both exported
account migrations, creates and claims a real page through host routes, then
composes the real Node account adapter and connection-management handlers.
It exercises code/PKCE exchange, live exact-grant introspection, the one-use
management handoff, owner-selected query/command/event consent, encrypted state
reopen, cross-account refusal, refresh, exact-grant revocation, host logout,
verified-email changes and account suspension. Its report binds both clean
sources and the exact engine archive digest. The initial host account/session
is deliberately synthetic; it never calls GitHub, Google or ChatGPT.

The [deployment note](deployment.md) distinguishes these test contracts from
actual host/native readiness and a live assistant turn. The release includes
private-configuration preparation, dedicated-device staging and offline/online
preflight tooling. Having those tools or passing injected readiness cases does
not establish a running Linux service, public HTTPS or human account consent.

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
