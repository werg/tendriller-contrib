# Evidence for the assistant connection cookbook

This guide's overall evidence label is **explained** because an actual
ChatGPT-subscribed conversation has not been shown receiving and returning a
live production request. Component tests establish narrower claims.

## Exercised components

| Source | Checks observed | Scope |
| --- | --- | --- |
| Tendriller `0d9eff5d4e196313996c8c6cc77a130d2de1cf81`, kitchen fixture | Five deterministic/operation tests plus one actual native integration test | Canonical and stale response projection, conflicts, requester cancellation, expiry presentation, metadata-only egress, exact operation resumption, two-device request/answer, retry and store reopen |
| Tendriller `0876ac445e47ded9a73df54515925ed1fdbe4e60`, widget | Five bridge/resource tests | Portable initialization before optional compatibility fallback, explicit message action, source/origin checks, denied-message non-retry, bounded host timeout, identifier-only prompt and self-contained resource |

The native run used the public events-only Chronolog package built from
`d014879ecb29714e80311d6101cfa8973953d5c4`, tree
`6290e0ed634992a69956fb8eebbf1ab2058a33b9`. Archive SHA-256:
`673a6ecdf6c6741721efbb250f711f3acf7fa9784624ad5bcbf6596e5a00996c`.
It uses signed synthetic authority, two real native stores and the public
in-process transport. It does not qualify Internet RTC, deployed relay, mobile
browser storage or a live OpenAI service.

The kitchen's browser source composes the existing public bootstrap and is
syntax-checked. The widget is bundled with esbuild and its self-contained
resource is checked; its host tests use a simulated postMessage host. Neither
test result alone establishes that a real ChatGPT client rendered the card.

## Still required for a live acceptance record

Record the deployed origin and exact source, OAuth issuer/resource and successful
account linking, the owner's explicit consent, the enrolled bridge's verified
grant, a selected-history request, the exact subscription callback's signed
challenge, an acknowledged event, the subscribed chat's run, the subsequent
signed reply command and the page's updated query.

Also record revocation, expired subscriptions, no peers, bridge restart,
duplicate deliveries, uncertain command retry, selected-generation recovery and
a late response to an earlier step. Do not replace these observations with a
mocked callback, a release artifact, or a screenshot of an HTML preview.

Current platform references checked on 19 November 2026:

- [OpenAI MCP Events](https://developers.openai.com/plugins/build/mcp-events)
- [MCP resource authentication](https://developers.openai.com/plugins/build/auth)
- [MCP Apps UI](https://developers.openai.com/plugins/build/chatgpt-ui)
- [Portable message request type](https://apps.extensions.modelcontextprotocol.io/api/interfaces/app.McpUiMessageRequest.html)
- [Workspace Agent trigger API](https://developers.openai.com/workspace-agents/trigger-runs)

These references establish the documented routes. Deployment availability and
client behavior need their own live evidence.
