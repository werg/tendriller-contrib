# Keep a reset from reviving an older edit

Use this application recipe when resetting a shared JSON value must invalidate
edits prepared against its previous generation. For example, a team can clear an
inspection's shared notes while an offline device still holds a prepared edit.
The old edit must remain visibly rejected when it arrives. An edit already
accepted before the reset must still return its original receipt on exact retry,
without applying that old value again.

The [executable builders](../checks/shared/scoped-state.mjs) use the same public
`program`, `sqlStatement` and `emit` functions supplied to the page builder.
They construct ordinary SQL-plus-event programs. The selected backend owns signing,
durable preparation, delivery, final outcomes and operation identity; the recipe has no
additional command queue or authority.

## Schema, inputs and ownership

`initializeScopedState({ scope, value = null })` creates `app_scoped_state` and
one initial scope at generation `0`. Run it once under the application's signed
SQL schema administrator and wait for final acceptance before using the table.
The schema belongs to this example; an application can place the same guard in
its own tables. A second scope or shared collective ownership requires an
explicit application schema/ownership decision, as for the task-board rows.

| Builder | Captured inputs | Atomic effect |
| --- | --- | --- |
| `initializeScopedState` | Nonempty scope ID of at most 128 characters; bounded JSON value | Create the example table, insert generation `0` and emit `scope.initialized`. |
| `setScopedState` | Exact scope, safe nonnegative integer `expectedGeneration`, bounded JSON value | Assert that scope/generation still exists, replace `value_json`, emit `state.set`. |
| `rotateScopedState` | Exact scope, safe nonnegative integer `expectedGeneration`, replacement JSON value (default `null`) | Assert the old generation, advance to `expectedGeneration + 1`, replace the value and emit `scope.rotated`. |

Events use topic `scoped-state`. The writer needs SQL and that event topic, plus
the ordinary row permissions. Reading a scope does not grant permission to reset
or update it. Choose who owns the control row explicitly; a generic SQL writer
with ownership can author other SQL, so this recipe is not an authorization
sandbox around untrusted application code.

The public `emit` helper validates and snapshots the JSON value. SQL stores the
same snapshot serialized as text; the effective event carries that snapshot as
JSON. Unsupported values such as `undefined`, accessors or non-finite numbers
fail before authoring. The selected core's canonical event/program bounds still
apply. Initialization, updates and resets remain subject to the group's normal
deterministic SQL profile.

## Capture once, then submit one original operation

Build the complete page graph with the normal
[explicit artifact command](../checks/README.md#build-a-complete-page-graph).
The generated `scoped-state.mjs` imports the generated public application bundle.
An adapted page can then use:

```js
import { setScopedState, rotateScopedState } from './scoped-state.mjs';

const backend = await tendril.application.ready();
const scope = 'inspection-notes';
const view = await backend.readView({ view: 'final' });
let capturedGeneration;
try {
  const result = await view.query(
    'SELECT generation FROM app_scoped_state WHERE scope = ?', [scope]);
  if (result.truncated || result.rows.length !== 1) throw Error('Scope unavailable');
  const raw = result.rows[0][0];
  if (typeof raw !== 'number' && typeof raw !== 'bigint') throw Error('Invalid generation');
  capturedGeneration = Number(raw);
  if (!Number.isSafeInteger(capturedGeneration) || capturedGeneration < 0) {
    throw Error('Generation cannot be represented by this application');
  }
} finally {
  await view.release();
}

const operationId = crypto.randomUUID();
const original = setScopedState({
  scope, expectedGeneration: capturedGeneration, value: { note: 'Reviewed' },
});
const prepared = await backend.submit(original, { operationId });

// After a lost reply, retain the original identity and reviewed program.
// Never replace capturedGeneration with a newer value to make a retry pass.
const sameOperation = await backend.submit(original, { operationId });
```

The returned application receipt describes durable preparation, not necessarily
final acceptance. Follow `backend.operations.subscribe({ operationId, signal })`
or look up that same ID after reload. A final `rejected` status preserves the
original intent for review; a deliberate new edit gets a new operation ID and a
newly reviewed generation. Do not automatically turn that rejection into a new
write. Keep the original editor snapshot until its completion condition is met.

A reset is another explicit durable operation:

```js
const reset = rotateScopedState({
  scope, expectedGeneration: capturedGeneration, value: null,
});
await backend.submit(reset, { operationId: crypto.randomUUID() });
```

If another reset wins first, this reset also fails its captured-generation guard.
Generation numbers only increase; the builder has no caller-selected replacement
generation. The schema and SQL guard bound the generation to safe nonnegative integers,
and the builder refuses a rotation at the maximum. Exhaustion requires an explicit
new scope/lineage decision rather than wrapping to an old generation. A reset
changes the current value; it does not erase retained history or previously read
content.

## Decisive checks

The paired core qualification consumes the **built module** through its public
application adapter, so the test runs these authored programs instead of copying
their SQL into another fixture. Its acceptance cases are:

1. Initialize generation `0`, accept one edit, and retain that original operation.
2. Prepare an edit using generation `0`, then order a reset to generation `1`
   before delivering the older edit. The older edit has a final
   `assert:scope_generation_changed` rejection, with no state mutation or
   effective `state.set` event.
3. Retry the already accepted original after the reset. Its proposal and outcome
   remain original; the generation-`1` value is unchanged.
4. Try to refresh the generation under that original operation ID. Exact intent
   conflict must refuse the change rather than accepting a rewritten retry.

Keep the command, module digest and observed result with the next qualification
report. The earlier `a3797d5` application report predates this recipe and is not
evidence that these new cases ran. No production deployment is needed to exercise
these SQL/outbox invariants with the actual native materializer.
