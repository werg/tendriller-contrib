---
id: "guard-crdt-assumptions"
title: "Guard CRDT edits with causal and row assumptions"
summary: "Attach signed causal dependencies (afterOps, requiresRejected) and ergonomic SQL row guards (based_on_row, row_matches) so offline edits self-heal or surface cleanly in a conflict inbox."
group: "Coordinate state"
tags: ["crdt", "assumptions", "preconditions", "sql", "conflicts"]
choices: ["Causal afterOps dependencies vs row-level based_on_row guards", "Automatic fallback actions with requiresRejected", "Silent reject vs first-class _chronolog_conflicts inbox"]
capabilities: []
evidence: "explained"
related: ["choose-data-model", "reconcile-concurrent-edits", "preview-agent-sql-branches"]
sources: ["https://github.com/werg/chronolog/blob/9df55f0358482a71308cf3b1f235429d66b39a3b/packages/peer-session/src/assumptions.test.ts"]
---

# Guard CRDT edits with causal and row assumptions

In an offline-first CRDT log, a transaction authored on one device can arrive after an earlier edit made elsewhere. Rather than blindly applying an approval or update on top of stale context, declare the exact assumptions the transaction relies on right inside the signed operation.

## 1. Causal operation dependencies (`afterOps` and `requiresRejected`)

- **`afterOps: [opId]`**: The operation only applies if every listed preceding operation was accepted in canonical timestamp order. `session.command` automatically clamps `authorTimestampMs` past referenced operations so clock skew never orders a child before its parent.
  - If the parent has not arrived yet, the child evaluates deterministically to `assumption:missing_op` without stalling unrelated work — and automatically heals to `accepted` the instant the parent arrives.
  - If a late earlier edit invalidates the parent, every dependent child cascades cleanly to `assumption:dependency_rejected`.
- **`requiresRejected: [opId]`**: Pair an optimistic claim with a deterministic fallback (for example, automatically booking a 2:30 PM slot if your offline 2:00 PM claim loses a race).

## 2. Ergonomic SQL row guards (`stampTables`, `based_on_row`, `row_matches`)

Opt tables into automatic `_last_op_id` stamping during `migrate`:

```js
await session.command('db:migrate', {
  statements: ['CREATE TABLE invoices (id TEXT PRIMARY KEY, total INTEGER, status TEXT, _last_op_id TEXT)'],
  stampTables: ['invoices'],
});
```

Then guard updates with one line:

```js
await session.command('db:exec', {
  preconditions: [
    { kind: 'based_on_row', table: 'invoices', where: { id: 'inv-1' }, lastOpId: row._last_op_id },
  ],
  sql: 'UPDATE invoices SET status = ? WHERE id = ?',
  params: ['approved', 'inv-1'],
  onPreconditionFailed: 'record_conflict',
});
```

## 3. Capture unmet offline intent in `_chronolog_conflicts`

Pass `onAssumptionFailed: 'record_conflict'` (or `onPreconditionFailed: 'record_conflict'` in `chronolog/sql`) so lost races are preserved in `_chronolog_conflicts` instead of vanishing. Query unresolved items with `session.query('db', { kind: 'conflicts' })` (or `listUnresolvedConflicts` from `shared/helpers/finality-ux.mjs`) so the UI or an AI agent can offer a 1-click alternative.
