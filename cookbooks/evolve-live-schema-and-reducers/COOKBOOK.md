---
id: "evolve-live-schema-and-reducers"
title: "Evolve live schemas, RLS rules, and ES Module reducers without redeploys"
summary: "Dry-run and hot-publish hash-pinned QuickJS-NG reducers into $reducers, migrate chronolog-db schemas atomically, and let writers manage personal tables safely."
group: "Keep work dependable"
tags: ["schema", "reducers", "sql", "rls", "evolution"]
choices: ["Admin SQL migrations vs non-admin user-owned dynamic tables", "Hot-evolving $reducers vs frozenReducers", "Dry-run validation before signing live reducer updates"]
capabilities: []
evidence: "explained"
related: ["choose-data-model", "run-a-peer-application", "publish-coherent-updates"]
sources: ["https://github.com/werg/tendriller/blob/7b963a6085d8e5c57054f3045b2540328336420d/docs/STATE_MODELS.md"]
---

# Evolve live schemas, RLS rules, and ES Module reducers without redeploys

In Chronolog, application logic and database schema live directly inside the log. Administrators and authorized agents can add columns, create tables, update Postgres-style write RLS predicates, or bind brand-new hash-pinned ES Module reducers in `$reducers` via ordinary signed operations. Every connected browser, local agent, and opt-in Hosted MCP Worker picks up the evolution deterministically at the exact canonical author timestamp.

## Always dry-run candidate reducers first

A broken `$reducers` binding can stall a topic until another admin operation fixes it. Before publishing any custom ES Module to `$reducers`, run `dryRunReducerModule` (from `shared/helpers/live-evolution.mjs`) in an ephemeral in-memory QuickJS-NG + SQLite-CAS sandbox to verify syntax, exports, imports, and sample execution. Only after the dry-run passes should you seed the public CAS bytes and sign the `$reducers` operation.

## Separate admin migrations from personal user tables

- **Admin migrations (`evolveSqlSchema` / `tendril sql migrate-file`):** Use `action: 'migrate'` with optimistic `expectedSchemaVersion` checks and atomic `policies` updates so tables and their write-RLS triggers change together.
- **User-owned dynamic tables (`runPersonalDdl`):** When `allowUserDdl` is enabled on a `chronolog/sql` topic, any authorized writer can create, index, alter, and drop their own scratch or tracking tables—automatically tracked in `_rls_table_owners` so they can never alter or drop another party's table.

## Surface live schema changes reactively

Never hard-code assumptions that a table's columns are immutable forever. Subscribe to session changes and re-query `{ kind: 'schema' }` (or mount `shared/ui/schema-explorer.mjs`) so newly added columns, tables, and `$reducers` bindings appear immediately without losing local unsent drafts.

## Verify

1. Pass syntactically broken reducer JS into `dryRunReducerModule` and verify it throws `REDUCER_DRYRUN_FAILED` without touching the live log.
2. Publish a valid new ES Module topic reducer live via `publishReducerModule` (or `tendril reducers publish`), submit an operation to the new topic, and verify a second peer converges on the exact same state without any UI redeploy.
3. Run a live `ALTER TABLE` + RLS update via `evolveSqlSchema`, then have a non-admin writer create a personal table and confirm they cannot drop an admin-owned table.
