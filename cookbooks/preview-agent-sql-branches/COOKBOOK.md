---
id: "preview-agent-sql-branches"
title: "Preview AI agent edits with zero-copy SQL branches"
summary: "Let agents fork a Merkle-paged chronolog-db in O(1), compute exact row diffs, and submit guarded proposals humans can approve with one click."
group: "Coordinate state"
tags: ["sql", "branching", "agents", "workflow", "diff"]
choices: ["Direct agent writes vs human-reviewed Data PRs", "Automatic based_on_row guards on proposed updates", "Time-travel inspection with queryAsOf and audit logs"]
capabilities: []
evidence: "explained"
related: ["guard-crdt-assumptions", "choose-data-model", "evolve-live-schema-and-reducers"]
sources: ["https://github.com/werg/tendriller/blob/f637d182075b5b734dd3c216a0fa3eed78f6d2e1/docs/tutorial/shared/helpers/proposals.mjs"]
---

# Preview AI agent edits with zero-copy SQL branches

Users want AI agents to reconcile invoices, tidy inventory, or reorganize schedules — without risking silent corruption of live tables. Because `chronolog-db` stores SQLite as a Merkle tree of immutable 4 KiB pages, an agent can branch the entire database in O(1) memory, run mutations locally, compute an exact row-level diff, and hand the human a 1-click review card.

## 1. Agent proposes edits in an isolated branch

Use `proposeSqlBranch` from `shared/helpers/proposals.mjs`:

```js
import { proposeSqlBranch } from '../../shared/helpers/proposals.mjs';

await proposeSqlBranch(session, {
  sqlTopic: 'db',
  workflowTopic: 'proposals',
  title: 'Reconcile Q4 warehouse counts',
  mutate(branch) {
    branch.exec('UPDATE items SET qty = ? WHERE id = ?', [40, 'sku-1']);
    branch.exec('INSERT INTO items (id, name, qty) VALUES (?, ?, ?)', ['sku-2', 'Tea', 15]);
  },
});
```

The live database stays completely untouched. `branch.toProposal({ withRowGuards: true })` walks only the changed 4 KiB Merkle pages, computes exact `inserted` / `updated` / `deleted` row diffs, and attaches `based_on_row` preconditions automatically.

## 2. Human previews and approves in one click

Render pending proposals with `renderProposalCard` from `shared/ui/proposal-card.mjs`:
- Shows a calm summary (*"2 changes (+1 / ~1 / -0)"*) with an expandable diff preview.
- Clicking **Approve & apply** records the workflow approval and commits the SQL statements with `afterOps: [approveOp.id]`.
- If a human edited one of the same rows while reviewing, the `based_on_row` guard catches the race and routes it cleanly into `_chronolog_conflicts` instead of overwriting the human's work.

## 3. Combine with time-travel and cryptographic audit blame

Enable `auditTables: ['items']` during `migrate` to record `actor()`, `op_id()`, `op_time()`, and before/after JSON snapshots in `_chronolog_audit`, and inspect any historical revision with `session.queryAsOf('db', { sql }, { opId | atTimestampMs })`.
