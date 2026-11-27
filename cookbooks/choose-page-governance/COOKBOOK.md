---
id: "choose-page-governance"
title: "Choose page governance and public access honestly"
summary: "Select between default private OAuth E2EE, zero-OAuth public read/write, M-of-N multisig, or custom $permissions reducers—and surface clear security UX whenever a page is not private."
group: "Keep work dependable"
tags: ["authority", "governance", "public", "multisig", "privacy"]
choices: ["Private E2EE (attestedMembers) vs unencrypted public (openMembers)", "Public read-only vs open-contribution write rules (chronolog/rls)", "Single-owner attestation vs M-of-N multisigMembers or custom $permissions"]
capabilities: []
evidence: "explained"
related: ["choose-data-model", "collect-private-responses", "manage-sensitive-data", "run-a-peer-application"]
sources: ["https://github.com/werg/tendriller/blob/7b963a6085d8e5c57054f3045b2540328336420d/docs/MEMBERSHIP.md", "https://github.com/werg/tendriller/blob/7b963a6085d8e5c57054f3045b2540328336420d/session/admission.mjs"]
---

# Choose page governance and public access honestly

Most people assume a Tendriller page is private, sign-in protected, and end-to-end encrypted—because that is the default (`attestedMembers` with `privateLog: true`). Chronolog v2 lets any page choose its `$permissions` ES Module reducer a-la-carte at genesis, unlocking zero-OAuth public pages, embeddable dashboards, open community boards, and M-of-N multisig governance. Whenever a page departs from that private default, make its actual privacy and write model unmistakable in the interface.

## Compare the four governance models

| Model | `privateLog` | Visitor sign-in | Who governs membership | When to choose it |
| --- | --- | --- | --- | --- |
| **`attestedMembers` (default)** | `true` (E2EE) | GitHub or Google OAuth + host attestation | Owner & admitted administrators | Personal tools, family pages, private team workspaces. |
| **`openMembers` (read-only)** | `false` (plaintext) | None for readers | Listed `admins` & writers | Public status boards, shared portfolios, embeddable interactive microsites, live event schedules. |
| **`openMembers` (open-write)** | `false` (plaintext) | None for readers or writers | Listed `admins` (`setOpen`, `setAdmin`) | Open guestbooks, public polls, collaborative community boards—paired with `chronolog/rls` write predicates! |
| **`multisigMembers` / custom** | `true` or `false` | Optional / key-based | `M`-of-`N` signers (`propose` / `approve`) or custom ES Module | Shared treasuries, high-assurance team logs, or domain-specific admission rules. |

## Make deviations from private E2EE visible

Never let a visitor type personal or confidential information into an unencrypted `openMembers` page under the impression that it is private. Use the starter's `mountGovernanceBanner` helper (`shared/helpers/governance.mjs`)—or an equivalent clear notice—so that:

- Standard private E2EE pages stay calm and clutter-free — UNLESS an opt-in Hosted MCP assistant is active, in which case `mountGovernanceBanner` displays an honest notice reminding the user that keys are unsealed strictly in RAM during `/mcp` requests and can be revoked anytime.
- Public read-only pages clearly indicate **Public · Read-only (unencrypted)** and explain that anyone with the URL can view and sync peer-to-peer without signing in (with blind mailbox hydration even while the creator is offline).
- Public open-write pages display a prominent warning badge (**Public · Open contributions**) reminding visitors not to enter private secrets, keep author-owned SQL guards (`NEW.author = actor()` / `OLD.author = actor()`) active, and allow admins to mute/block abusive keys (`blockAuthor` / `unblockAuthor`) — immediately rejecting future writes and purging blocked authors from the host mailbox.
- Multisig pages surface the active `M-of-N` threshold and any pending proposals awaiting co-signatures. Use `mountMultisigPanel({ root, session, peers, identity, wrapKey })` for 1-click signed join requests with a deterministic 6-digit out-of-band `verificationCode(logId, publicKey, wrapKey)` (`482-917`) and 1-click `approveMultisigAndSeal` co-signing.

## Keep host-level administration isolated

Opening a page with `openMembers` (`openRead: true`) allows anonymous browsers to load page files and sync the public Chronolog log peer-to-peer, but it must **never** expose owner management (`_tendril/manage`), Hosted MCP (`_tendril/mcp/*`), outbound OAuth connections (`_tendril/connections/*`), or organization group rules (`_tendril/groups/*`). Keep those endpoints strictly authenticated and owner-gated (`403` for anonymous `openPublic` callers).

## Pair open-write with `chronolog/rls`

On an `openWrite: true` public page, any anonymous visitor generates a local Ed25519 key pair in their browser and signs their own operations. Inside a `chronolog/sql` database topic, use Postgres-style write RLS (`chronolog/rls`) so each visitor can only edit or delete their own contributions (`OLD.author = actor()`) while admins retain moderation rights. If an open board needs to freeze contributions, an admin can switch it to read-only instantaneously with a single signed `$permissions` operation (`setOpen({ openRead: true, openWrite: false })`).

## Verify

1. Open a public read-only page in an incognito browser (no OAuth cookie): verify it loads immediately, reaches `phase: 'admitted'` with `canWrite: false`, syncs existing public operations peer-to-peer, and rejects unauthorized writes deterministically.
2. Verify `_tendril/manage`, `_tendril/mcp/grants`, `_tendril/connections`, and `_tendril/groups` return `403` for the anonymous visitor.
3. Open a public open-write page: verify the warning banner is visible, two anonymous tabs converge P2P, and RLS prevents Tab B from modifying Tab A's rows.
4. On a `multisigMembers` (2-of-2) page: verify a single signer's `propose` does not execute until the second signer's `approve` arrives, and that cancellation works before threshold is met.
