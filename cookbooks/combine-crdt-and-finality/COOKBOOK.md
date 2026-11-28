---
id: "combine-crdt-and-finality"
title: "Combine offline CRDT speed with Pending-to-Confirmed admission and agent allowances"
summary: "Keep authoring instant offline while settling contentious claims via opt-in $admission history policies and giving autonomous agents hard offline spending quotas."
group: "Coordinate state"
tags: ["finality", "admission", "crdt", "ledger", "allowances", "agents", "consensus"]
choices: ["Provisional CRDT writes with Pending -> Confirmed badges", "Offline Escrow CRDT quotas via chronolog/ledger", "Graduated decentralization from open to signed-frontier, threshold-quorum, member-quorum, or pinned-checkpoint"]
capabilities: []
evidence: "explained"
related: ["guard-crdt-assumptions", "choose-page-governance", "work-offline-and-reconnect", "seal-rules-and-enforce-invariants"]
sources: ["https://github.com/werg/tendriller/blob/f637d182075b5b734dd3c216a0fa3eed78f6d2e1/docs/tutorial/shared/helpers/finality-ux.mjs"]
---

# Combine offline CRDT speed with Pending-to-Confirmed admission and agent allowances

Because Chronolog separates canonical ordering (`(authorTimestampMs, author, opId)`) from optional history admission (`$admission.schedule` and `$admission.admit()`), you never have to choose between responsive offline authoring and strict settlement guarantees.

## 1. Calm Pending -> Confirmed UX

Ordinary notes and comments stay `open` (pure offline CRDT). For contentious claims like room bookings, equipment checkouts, or payouts, schedule a `$admission` history policy (`signed-frontier`, `threshold-quorum`, `member-quorum`, `optimistic-challenge`, `merkle-anchor`, or surgical `pinned-checkpoint` + local `pinnedFrontier` descent) and render each record's status with `describeOpSettlement` from `shared/helpers/finality-ux.mjs`:

- **Saved locally** (`local`) → authored offline.
- **Pending confirmation** (`synced`) → replicated, waiting for the closed-time frontier to pass.
- **Confirmed** (`finalized`) → sealed by verified admission evidence; late backdated claims before that frontier are excluded.
- **Needs attention** (`excluded`) → lost an offline race; pair with `_chronolog_conflicts` so an agent offers a 1-click alternative.
- **Witness conflict detected** (`equivocated`) → self-evidencing cryptographic fraud proof caught a dishonest signer (`(await session.admission.status()).equivocations` or `session.admissionStatus(opId)`).

## 2. Offline Agent Allowances (Escrow CRDTs)

When multiple autonomous agents or offline kiosks draw from one shared budget or stock pool, use `chronolog/ledger` allowances via `shared/helpers/allowances.mjs`:

```js
import { grantAgentAllowance, spendAgentAllowance } from '../../shared/helpers/allowances.mjs';

// Human reserves a $20 allowance for @research-agent
await grantAgentAllowance(adminSession, {
  fromAccount: 'treasury',
  grantee: agentPublicKey,
  amount: 2000,
});

// Agent spends completely offline up to $20 with zero consensus per spend
await spendAgentAllowance(agentSession, {
  allowanceId,
  toAccount: 'api-vendor',
  amount: 450,
  memo: 'Search batch',
});
```

Each agent can act offline with mathematical no-overspend guarantees and request a top-up only when its local allowance runs low.
