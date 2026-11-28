---
id: "evolve-live-schema-and-reducers"
title: "Evolve live schemas, RLS rules, and ES Module reducers without redeploys"
summary: "Author declarative reducers with defineReducer, dry-run upgrades and simulate edits before signing, hot-publish to $reducers, and lock finalized rules irreversibly with $seals."
group: "Keep work dependable"
tags: ["schema", "reducers", "sql", "rls", "evolution", "seals", "simulate"]
choices: ["Admin SQL migrations vs non-admin user-owned dynamic tables", "Hot-evolving $reducers vs selective kernel-enforced $seals", "Pre-flight session.simulate() and dryRunReducerModule before signing"]
capabilities: []
evidence: "explained"
related: ["choose-data-model", "run-a-peer-application", "publish-coherent-updates", "seal-rules-and-enforce-invariants"]
sources: ["https://github.com/werg/tendriller/blob/7b963a6085d8e5c57054f3045b2540328336420d/docs/STATE_MODELS.md"]
---

# Evolve live schemas, RLS rules, and ES Module reducers without redeploys

In Chronolog, application logic and database schema live directly inside the log. Administrators and authorized agents can add columns, create tables, update Postgres-style write RLS predicates, or bind brand-new hash-pinned ES Module reducers in `$reducers` via ordinary signed operations. Every connected browser, local agent, and opt-in Hosted MCP Worker picks up the evolution deterministically at the exact canonical author timestamp.

## Author clean reducers with `defineReducer`, `ctx.can()`, and `ctx.reject()`

Prefer `defineReducer` (`chronolog/reducer`) for JSON/KV topics and `defineSqlReducer` (`chronolog/sqlite-helpers`) or `chronolog/sql` for SQL topics:
- Inputs (`state`, `tx`, `ctx.config`, `ctx.topic()`) are deep-frozen per invocation so accidental mutation cannot leak.
- Check capabilities monotonically via `ctx.can('writer')` / `ctx.can('scope', tx.author, { scope })` on top of fail-closed `$admission.authorize()`.
- Reject domain-invalid requests cleanly with `ctx.reject('code', 'detail')` so callers distinguish intentional business rejections from unexpected `reducer:crash` bugs.

## Always dry-run candidate reducers and simulate edits first

- **Dry-run module upgrades:** Before publishing any custom ES Module to `$reducers`, run `dryRunReducerModule` (from `shared/helpers/live-evolution.mjs`) or `dryRunReducerUpgrade` (`@chronolog/peer-session/kernel`) in an ephemeral in-memory QuickJS-NG + SQLite-CAS sandbox to verify syntax, exports, imports, and sample execution.
- **Simulate live transactions:** Use `session.simulate({ updates })` (or `tendril simulate`) to preview any command, migration, or RLS policy change against live state—including `$seals` and `$admission.verify()`—without signing or mutating the log.

## Lock finished rules selectively with kernel-enforced `$seals`

Instead of freezing all of `$reducers` forever at genesis, you can iterate freely during early rollout and then lock individual topics or subtrees permanently via `$seals` (`session.seal({ reducers: ['ledger'], paths: [{ topic: '$admission', path: 'schedule', mode: 'append-only' }] })`). See [Seal immutable rules, verify cross-topic invariants, and preview edits with `simulate()`](../seal-rules-and-enforce-invariants/COOKBOOK.md).

## Separate admin migrations from personal user tables

- **Admin migrations (`evolveSqlSchema` / `tendril sql migrate-file`):** Use `action: 'migrate'` with optimistic `expectedSchemaVersion` checks and atomic `policies` updates so tables and their write-RLS triggers change together.
- **User-owned dynamic tables (`runPersonalDdl`):** When `allowUserDdl` is enabled on a `chronolog/sql` topic, any authorized writer can create, index, alter, and drop their own scratch or tracking tables—automatically tracked in `_rls_table_owners` so they can never alter or drop another party's table.

## Surface live schema changes reactively

Never hard-code assumptions that a table's columns are immutable forever. Subscribe to session changes and re-query `{ kind: 'schema' }` (or mount `shared/ui/schema-explorer.mjs`) so newly added columns, tables, and `$reducers` bindings appear immediately without losing local unsent drafts.

## Verify

1. Pass syntactically broken reducer JS into `dryRunReducerModule` and verify it throws `REDUCER_DRYRUN_FAILED` without touching the live log.
2. Publish a valid new ES Module topic reducer live via `publishReducerModule` (or `tendril reducers publish`), preview a write with `session.simulate()`, submit an operation to the new topic, and verify a second peer converges on the exact same state without any UI redeploy.
3. Run a live `ALTER TABLE` + RLS update via `evolveSqlSchema`, then have a non-admin writer create a personal table and confirm they cannot drop an admin-owned table.
