# Historical scoped-reset recipe

The earlier SQL-plus-event reset example and its finality-based adapter are
preserved at their [exact source snapshot](https://github.com/werg/tendriller-contrib/blob/11c445e4d25e7b8ca415f3327c8049fcadc9f547/cookbooks/run-a-peer-application/notes/scoped-json-state.md).
Its [reviewed native evidence](qualification-review-43957113710.md) retains its
original execution order and guarantees. The obsolete adapter and copied page
implementation are not maintained in the current tree.

The domain principle still applies to the [common session](../COOKBOOK.md): keep
an application-owned revision on resettable data, capture that revision while
reading, and assert it in the same program that changes the value. A stale
command rejects atomically. An exact retry retains its original signed attempt
and guards; deliberately changing intent creates a new operation.

An application-owned reset revision is separate from a protocol generation.
Selected-history recovery can abandon an ordinary reset together with its data
tail. Security-sensitive permission, ownership and schema changes instead need
monotonic control or protected administrative transitions. Do not treat a domain
reset guard as a recovery floor or authorization policy.

Use the [shared task-board definition](../snippets/peer-task-board.mjs) and
[current SQL qualification](../checks/README.md#sql-and-guarded-domain-commands)
for the maintained guarded-command API and coherent recovery behavior.
