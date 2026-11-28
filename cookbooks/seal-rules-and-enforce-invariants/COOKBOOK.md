---
id: "seal-rules-and-enforce-invariants"
title: "Seal immutable rules, verify cross-topic invariants, and preview edits with simulate()"
summary: "Write self-describing reducers with defineReducer, enforce global cross-topic invariants via $admission.verify(), lock finalized rules forever with kernel-enforced $seals, verify WebAuthn P-256 proofs, and dry-run mutations with session.simulate()."
group: "Keep work dependable"
tags: ["seals", "immutability", "invariants", "admission", "reducers", "simulate", "webauthn"]
choices: ["Mutable $reducers vs selective kernel-enforced $seals (frozen / append-only)", "Per-topic ctx.can() attenuation vs cross-topic $admission.verify(before, after) post-conditions", "Ed25519 device signers vs WebAuthn P-256 (crypto@2) hardware/passkey proofs"]
capabilities: []
evidence: "explained"
related: ["evolve-live-schema-and-reducers", "choose-page-governance", "combine-crdt-and-finality", "guard-crdt-assumptions"]
sources: ["https://github.com/werg/chronolog/blob/a320a63969c6006cb6adb331f07e8dd70903a82e/docs/CRDT_CONTRACT.md", "https://github.com/werg/chronolog/blob/a320a63969c6006cb6adb331f07e8dd70903a82e/packages/materializer/src/std/seals.ts"]
---

# Seal immutable rules, verify cross-topic invariants, and preview edits with `simulate()`

In an evolving local-first app, you want freedom to iterate early—and ironclad guarantees once rules, payout curves, or audit trails are finalized. Chronolog pairs five deterministic VM primitives so you never have to choose between an all-or-nothing frozen log and fragile ad-hoc checks.

## 1. Author self-describing reducers with `defineReducer`, `ctx.can()`, and `ctx.reject()`

Use `defineReducer` from `chronolog/reducer` to get automatic JSON-schema validation, monotonic capability/scope checks on top of fail-closed `$admission.authorize()`, and auto-generated `describe()` schemas for MCP and CLI tools. Inputs (`state`, `tx`, `ctx.config`, `ctx.topic()`) are deep-frozen per invocation, and `ctx.reject(code, detail)` cleanly separates intentional domain rejections from unexpected `reducer:crash` exceptions:

```js
import { defineReducer } from 'chronolog/reducer';

export default defineReducer({
  initialState: { entries: [] },
  commands: {
    append: {
      requiredCapability: 'writer',
      input: {
        type: 'object',
        required: ['note'],
        properties: { note: { type: 'string', minLength: 1 } },
        additionalProperties: false,
      },
      run(state, input, tx, ctx) {
        if (!ctx.can('scope', tx.author, { scope: 'journal:write' }) && !ctx.can('administrator')) {
          ctx.reject('scope_required', 'journal:write scope is required');
        }
        return {
          state: { entries: [...state.entries, { id: tx.opId, note: input.note, at: tx.authorTimestampMs }] },
          events: [{ topic: 'journal.appended', payload: { id: tx.opId } }],
        };
      },
    },
  },
  queries: {
    default: (state) => state.entries,
  },
});
```

## 2. Enforce cross-topic semantic post-conditions with `$admission.verify()`

When an invariant spans multiple topics (for example, every treasury disbursement in `ledger` must produce a matching entry in `audit`, or total allocated budgets across `teams` must never exceed `treasury.cap`), export `verify(before, after, tx, ctx)` from your `$admission` reducer (`createAdmission({ authorize, verify, admit })`). `TopicKernel` evaluates `verify()` over the read-only `before` and candidate `after` topic snapshots before committing; returning `false` or `{ ok: false, code }` rolls back the entire atomic multi-topic operation.

## 3. Lock finalized rules irreversibly with kernel-enforced `$seals`

Instead of freezing all of `$reducers` at genesis, lock only what must never change using `$seals` (`chronolog/seals` `monotonicSeals`). `TopicKernel` enforces monotonicity and seal checks directly before every commit (even on conflict handlers):
- **Pin individual topic reducers (+ transitive imports):** `reducers[topic] = true` locks that topic's resolved module CAS hash, transitive `$reducers.imports`, export name, config, and builtins forever while leaving other topics evolvable.
- **Lock JSON subtrees as `frozen` or `append-only`:** `paths[topic][dotPath] = 'frozen' | 'append-only'` prevents mutation or truncation of critical state—for example locking `$admission.schedule` as `append-only` while keeping `$admission.members` mutable, or freezing a tournament's rules table before play begins.

```js
// Irreversibly pin the 'ledger' reducer and lock $admission.schedule to append-only
await (await session.seal({
  reducers: ['ledger'],
  paths: [
    { topic: '$admission', path: 'schedule', mode: 'append-only' },
    { topic: 'config', path: 'payoutCurve', mode: 'frozen' },
  ],
})).materialized();
```

By default, sealing any JSON path on topic `T` also seals `reducers[T]` so an admin cannot bypass a path lock by swapping the reducer (override explicitly with `allowMutableReducer: true` only when intended). Once your seal configuration itself is complete, you can even seal `$seals` itself.

## 4. Verify WebAuthn P-256 passkeys and HMAC proofs inside reducers (`crypto@2`)

`chronolog:crypto` (`crypto@2`) exposes deterministic `verifyP256(publicKeyHex, messageBytes, signatureHex)` (accepting both DER and 64-byte compact signatures) and `hmacSha256(keyHex, messageBytes)` inside QuickJS-NG reducers—making hardware passkey approvals, FIDO2/WebAuthn step-up checks, and signed voucher verification 100% deterministic across browsers, Node, and blind hosts.

## 5. Preview mutations safely with `session.simulate()`

Before signing a risky migration, complex multi-topic update, or user form submission, run `session.simulate({ updates })` (or `tendril simulate`). It runs the exact `$admission.authorize()`, reducer, SQL RLS, `$seals`, and `$admission.verify()` pipeline against live state without signing or writing anything to the log:

```js
const preview = await session.simulate({
  updates: [{ topic: 'ledger', input: { action: 'transfer', from: 'ops', to: 'vendor', amount: 500 } }],
});
if (!preview.ok) {
  showValidationError(preview.rejectionCode, preview.rejectionDetail);
}
```

## Verify

1. Call `session.simulate()` with an invalid payload and confirm it returns `{ ok: false, rejectionCode }` with zero new operations stored.
2. Seal a topic reducer and an `append-only` JSON path with `session.seal()`, then verify attempts to swap the reducer (or any transitive `$reducers.imports` helper), weaken the seal, or truncate the path are rejected by `TopicKernel` with `seal:reducer_locked` / `seal:path_frozen`.
3. Add a `$admission.verify()` invariant and confirm a multi-topic transaction violating it rolls back all topics atomically.
