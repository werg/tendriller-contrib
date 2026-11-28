---
id: "choose-page-governance"
title: "Choose page governance and public access honestly"
summary: "Select between default private OAuth E2EE, on-log org-group rules, zero-OAuth public read/write, M-of-N multisig, or custom $admission reducers—and surface clear security UX whenever a page is not private."
group: "Keep work dependable"
tags: ["authority", "governance", "public", "multisig", "privacy", "admission"]
choices: ["Private E2EE (attestedAdmission) vs unencrypted public (openAdmission)", "Public read-only vs open-contribution write rules (chronolog/rls)", "Single-owner attestation vs M-of-N multisigAdmission or custom createAdmission({ authorize, verify, admit })"]
capabilities: []
evidence: "explained"
related: ["choose-data-model", "collect-private-responses", "manage-sensitive-data", "run-a-peer-application", "seal-rules-and-enforce-invariants", "encrypt-rows-and-scale-group-keys"]
sources: ["https://github.com/werg/tendriller/blob/7b963a6085d8e5c57054f3045b2540328336420d/docs/MEMBERSHIP.md", "https://github.com/werg/tendriller/blob/7b963a6085d8e5c57054f3045b2540328336420d/session/admission.mjs"]
---

# Choose page governance and public access honestly

Most people assume a Tendriller page is private, sign-in protected, and end-to-end encrypted—because that is the default (`attestedAdmission` in `chronolog/admission` with `privateLog: true`). Chronolog unifies per-operation authorization (`authorize`), cross-topic semantic post-conditions (`verify`), live signals, org-group rules (`admission.groupPolicy`), and optional history admission (`admit`) into `$admission`, unlocking zero-OAuth public pages, embeddable dashboards, open community boards, and M-of-N multisig governance. Whenever a page departs from that private default, make its actual privacy and write model unmistakable in the interface.

## Compare the four governance models

| Model | `privateLog` | Visitor sign-in | Who governs membership | When to choose it |
| --- | --- | --- | --- | --- |
| **`attestedAdmission` (default)** | `true` (E2EE) | GitHub or Google OAuth + 1-RTT host attestation (with `pqWrapKey`) | Owner & admitted administrators (+ on-log `groupPolicy` org rules) | Personal tools, family pages, private team workspaces. |
| **`openAdmission` (read-only)** | `false` (plaintext) | None for readers | Listed `admins` & writers | Public status boards, shared portfolios, embeddable interactive microsites, live event schedules. |
| **`openAdmission` (open-write)** | `false` (plaintext) | None for readers or writers | Listed `admins` (`setOpen`, `setAdmin`, `vouchAuthor`, `setAntiSpam`) | Open guestbooks, public polls, collaborative community boards—paired with `chronolog/rls` write predicates! |
| **`multisigAdmission` / custom `createAdmission`** | `true` or `false` | Optional / key-based (Ed25519 or WebAuthn P-256 via `crypto@2`) | `M`-of-`N` signers (`propose` / `approve`) or custom `{ authorize, verify, admit }` | Shared treasuries, high-assurance team logs, passkey-gated spaces, or cross-topic invariant enforcement. |

## Make deviations from private E2EE visible

Never let a visitor type personal or confidential information into an unencrypted `openAdmission` page under the impression that it is private. Use the starter's `mountGovernanceBanner` helper (`shared/helpers/governance.mjs`)—or an equivalent clear notice—so that:

- Standard private E2EE pages stay calm and clutter-free — UNLESS an opt-in Hosted MCP assistant is active, in which case `mountGovernanceBanner` displays an honest notice reminding the user that keys are unsealed strictly in RAM during `/mcp` requests and can be revoked anytime.
- Public read-only pages clearly indicate **Public · Read-only (unencrypted)** and explain that anyone with the URL can view and sync peer-to-peer without signing in (with blind mailbox hydration even while the creator is offline).
- Public open-write pages display a prominent warning badge (**Public · Open contributions**) reminding visitors not to enter private secrets, keep author-owned SQL guards (`NEW.author = actor()` / `OLD.author = actor()`) active, and allow admins to mute/block abusive keys (`blockAuthor` / `unblockAuthor`) or require vouching (`setAntiSpam({ requireVouch: true })`).
- Multisig pages surface the active `M-of-N` threshold and any pending proposals awaiting co-signatures. Use `mountMultisigPanel({ root, session, peers, identity, wrapKey })` for 1-click signed join requests with a deterministic 6-digit out-of-band `verificationCode(logId, publicKey, wrapKey)` (`482-917`) and 1-click `approveMultisigAndSeal` co-signing.

## On-log org-group rules & high-privacy `$keys.policy`

- **On-log org-group policy (`$admission.admission.groupPolicy.rules`):** For team pages, canonical organization/team admission rules live directly on-log in `$admission` so blind hosts and full replicas enforce identical rules and derive D1 webhook indexes from the signed log.
- **Metadata-hardened private spaces:** Pair private `$admission` with `$keys.policy` (`minSuite: 'hpke-xwing-aes256gcm'` for hybrid post-quantum X-Wing, `hideEnvelopeAuthor: true` + `paddingBucketBytes` for anonymous padded envelopes verified via `mailboxVerifyKeys`, and `distribution: 'tree'` for $O(\log N)$ Key-Tagged TreeKEM). See [Compartmentalize secrets with Private Vaults, SQL RLS crypto, TreeKEM, and anonymous envelopes](../encrypt-rows-and-scale-group-keys/COOKBOOK.md).

## Keep host-level administration isolated

Opening a page with `openAdmission` (`openRead: true`) allows anonymous browsers to load page files and sync the public Chronolog log peer-to-peer, but it must **never** expose owner management (`_tendril/manage`), Hosted MCP (`_tendril/mcp/*`), outbound OAuth connections (`_tendril/connections/*`), or organization group rules (`_tendril/groups/*`). Keep those endpoints strictly authenticated and owner-gated (`403` for anonymous `openPublic` callers).

## Pair open-write with `chronolog/rls`

On an `openWrite: true` public page, any anonymous visitor generates a local Ed25519 key pair in their browser and signs their own operations. Inside a `chronolog/sql` database topic, use Postgres-style write RLS (`chronolog/rls`) so each visitor can only edit or delete their own contributions (`OLD.author = actor()`) while admins retain moderation rights. If an open board needs to freeze contributions, an admin can switch it to read-only instantaneously with a single signed `$admission` operation (`setOpen({ openRead: true, openWrite: false })`).

## Verify

1. Open a public read-only page in an incognito browser (no OAuth cookie): verify it loads immediately, reaches `phase: 'admitted'` with `canWrite: false`, syncs existing public operations peer-to-peer, and rejects unauthorized writes deterministically.
2. Verify `_tendril/manage`, `_tendril/mcp/grants`, `_tendril/connections`, and `_tendril/groups` return `403` for the anonymous visitor.
3. Open a public open-write page: verify the warning banner is visible, two anonymous tabs converge P2P, and RLS prevents Tab B from modifying Tab A's rows.
4. On a `multisigAdmission` (2-of-2) page: verify a single signer's `propose` does not execute until the second signer's `approve` arrives, and that cancellation works before threshold is met.
