# Explicit session workflows

The optional `sessions` module owns the six first-party workflows. Core owns devices, timers, saved agent context, publication, streams, permissions and generic generation admission. See the [core protocol](https://github.com/werg/tendriller/blob/master/docs/PROTOCOL.md) for those platform guarantees.

## Select and activate a workflow

A deployment must explicitly install a pinned Worker artifact advertising `sessions` interface `1`, schema `1`. `GET /api/service` reports installed interfaces. Page state and event fields cannot install or activate server code.

An authorized controller invokes `POST A/workflows/sessions/activate` with `{cid,expected_generations:{},data:{scope:"notebook"}}`. `A` is the private handle's API base. Available scope names are `notebook`, `guide`, `workshop`, `experiment`, `decisions`, and `facilitation`; their authoritative IDs are `sessions:<name>`.

After activation, `GET A/scopes` returns the generation and protected bindings. Read these before composing work. Browser pages use the public `tendril.scopes.capture("sessions:notebook")` interface. Generations live outside shared application state; a field called `session_id` has no platform authority.

## One command shape

Every module operation is an explicit POST to `A/workflows/sessions/<operation>` for agents or the corresponding page route through `tendril.request`. The envelope is:

```json
{
  "cid": "stable-command-id",
  "scope": "sessions:notebook",
  "expected_generations": {"sessions:notebook": "captured-token"},
  "data": {"scope": "notebook", "title": "Morning observations"}
}
```

Capture and persist the command ID and generations before delivery. Retrying an acknowledgement loss must reuse the same command. A stale generation is an explicit rejection; do not silently substitute the newest generation into old work.

The browser adapter is a declared page asset:

```js
const sessions = TendrilWorkflows.create(tendril);
const captured = sessions.scope('notebook');
await sessions.send('notebook', {type:'notebook.observation', entry}, captured);
await sessions.capture('notebook', photo, {data:{type:'notebook.photo'}, ...captured});
```

Validated event context stays outside `data`. Agents carry that context into protected state writes. Event text, type names and application session fields are data, never proof of module validation or permission.

## Operations and access

| Operation | Purpose and caller |
| --- | --- |
| `activate` | Controller registers a workflow's authoritative scope bindings |
| `decisions` | Owner/controller reads proposals |
| `decisionCreate`, `decisionUpdate` | Controller prepares a proposal or records approved execution; record revisions are required |
| `decisionRespond` | Authenticated owner approves, rejects or requests revision of an exact proposal version |
| `responses`, `responseSubmit` | Participant reads or changes only their own private answers |
| `responsesAll` | Owner/controller reviews private answers deliberately |
| `assignments`, `assignmentsAll` | Participant reads their tasks; owner/controller reviews all tasks |
| `assignmentCreate`, `assignmentUpdate`, `participants` | Owner/controller assigns approved participant identities and private feedback |
| `archivePreview`, `archive`, `archives`, `archiveGet`, `archiveDelete` | Owner/controller reviews, creates, reads and explicitly removes private archives |

Private answers, assignments and feedback do not appear in shared state or public event payloads. The workflow emits bounded notices and keeps raw private content in authenticated module storage. Device targeting of ordinary conversation messages does not provide privacy.

Per-record `expected_revision` or `expected_version` checks complement the scope generation. They prevent overwriting another edit within the same generation. They do not replace the generation precondition.

## Archive and reset

Call `archivePreview` with `data:{scope:<name>}`. It returns counts, state/interaction revisions and the current generation. Present the concrete reset to the owner, keep their review metadata, then call `archive` using that original metadata and command ID.

Archive creation, private record capture, attachment retention, state reset and generation rotation occur in one local transaction. Post-commit notifications happen afterward. Retrying an accepted command returns its saved result instead of archiving twice. A quota or concurrency failure preserves the active work.

The guide preserves its definition and resets checkpoints. Other scopes reset only their owned state and records. A generation change removes stale queued optimism from the current session; unsent drafts remain available for explicit review. Scope rebinding, retirement and module replacement also invalidate captured work.

`TendrilSessionArchive.mount()` in `assets/workflows/session-archive.js` provides the optional owner review UI. It checks `tendril.pendingWork()` and application-provided draft guards before offering reset. Server checks remain authoritative.

## Examples and testing

The six recipes include explicit `tendril.json` requirements, complete asset closure, application data contracts and deterministic fixtures. Preview uses the released production runtime and explicit fixture responses. It does not implement workflow authorization or transactions.

Contrib unit tests cover module privacy, proposal immutability, scope reset, attachment retention and failure behavior. Core integration tests run the pinned module through the real admission/transaction host. Browser and portable suites cover presentation, input drafts, accessibility and normal offline behavior.
