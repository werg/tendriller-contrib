# Choose application primitives by their guarantees

**Implementation status:** `peer-generation-v1` is the adopted target for new
peer applications. The encrypted replica, public session/native/browser entries,
framed network transport and maintained RTC composition are implemented as a
preview; qualification is in progress. `operation.applied()` returns an accepted
or rejected result at a specific generation and sequence. Explicit recovery may
abandon a recent suffix, including previously applied work. This profile has no
`final()` wait or irreversible-finality capability. The [peer application preview](../cookbooks/run-a-peer-application/COOKBOOK.md)
uses the public APIs alongside an independent consumer; using those APIs
requires an explicitly supplied matching `@chronolog/peer-session` archive.
The [historical implementation guide](finalized-peer-applications.md) records the
older packages' immutable-prefix guarantee and its original evidence. Their
checks do not qualify generation recovery or add finality to the new profile.

The preserved package report uses separate native/events stores over an in-process
link with dirty-source provenance. Maintained RTC code and its independent
consumer now exist, but their exact-archive result, browser behavior and deployed
Internet readiness require separate evidence. No declaration or method name
promotes that earlier run to those qualifications.

Start with the recovery contract. A live cursor can disappear. A submitted
message can be retained by peers yet disappear from the selected application
history after recovery. A resource reservation needs a guarded transaction.
External work needs a journal and an explicit policy for recovery and uncertain outcomes.

## Choose the smallest sufficient mechanism

| Need | Use | Recovery meaning |
| --- | --- | --- |
| A value useful only on this device | Local state or a draft | The application chooses whether it survives reload. |
| Information that may expire or be replaced | Live signals | No offline outbox, retained history or completion guarantee. Reconnect with fresh observations. |
| Shared conversation or recorded observations | Peer application events | Exact signed attempts and deterministic replay; a selected recovery may abandon a recent suffix. |
| A conditional shared state transition | One SQL/event program | Assertions, mutations and effective events succeed or fail together in the selected order. |
| Administration that must not be rolled back | Signed control transition or protected administrative action | Monotonic permissions and recovery floors survive application-tail loss. |
| Irreversible external work | An explicitly configured protected action or durable external-action service | Preserve the action's prerequisites, stable identity, authorization, provider idempotency and reconciliation independently of a lossy application tail. |

Use the [signal guide](../cookbooks/share-live-signals/COOKBOOK.md) for typing,
presence, cursors, readings, previews and disposable progress. An events-only
application needs no SQL engine. Add SQL when assertions and relational updates
make the domain simpler. Neither an agent nor a native process makes SQL or
strong finality necessary.

## Follow the authenticated selected history

The peer-first design uses `peer-generation-v1`: an authorized coordinating peer
orders commands during one session generation. Other peers retain the original
signed attempts, verify delegated order and replay it independently. The
coordinator is a temporary role. The creator and a native process are ordinary
participants with explicit capabilities.

Cloudflare publishes assets and supplies discovery, enrollment and occasional
control/generation transitions. A healthy current generation keeps working with
all host endpoints unavailable. Ordinary commands, queries, signals and peer
replication have no hosted request, append, certificate or backup-acknowledgement
requirement. If both the coordinator and control host are unavailable, keep
local drafts and wait to select a new generation.

A recovery can adopt an earlier **complete prefix of the currently selected
history**. Recent work outside that ancestry becomes abandoned. It remains
inspectable and may be deliberately reapplied as a new attempt. A returning old
branch never silently merges. If G2 excluded G1 positions 81–100, G3 cannot
readopt them merely because an old peer returns with valid signatures.

This profile is the adopted target composition. Implementation and independent
qualification are in progress. Its evidence gate defines required checks;
the recipe and reports identify which exact public packages and runtime scenarios
actually pass.
The [historical implementation guide](finalized-peer-applications.md) preserves
the earlier chronological implementation and its source-specific evidence. It is
not a prerequisite for ordinary applications. The adopted model has one selected
history and explicit recovery; stronger settlement is a separately declared
capability.

An application uses one backend and authenticated selected history. A lost peer
never triggers an automatic hosted fallback. Existing certificates and author
timestamps retain their original meanings; they are not a way to fabricate
generation ordering.

## Keep authority roles separate

| Role | Decision it owns | What that role does not grant |
| --- | --- | --- |
| Author/device | Signs an immutable attempt under its current grants | Another person's identity or unrestricted application access |
| Data owner or team collective | Data and domain permissions | Sequencing or recovery authority by implication |
| Schema/control administrator | Protected schema, permission and key changes | Permission to impersonate application authors |
| Coordinating peer | Order within its selected generation | Row ownership, author grants or permanent authority |
| Recovery requester | May initiate a policy-permitted transition | Eligibility for an arbitrary peer or adoption of an excluded branch |
| Hosted control selector | Authenticated atomic selection and monotonic controls | SQL execution proof or permanent survival of ordinary edits |
| Replica | Retains and verifies usable history | Permission to write, coordinate or discard another participant's work |
| Effect worker | Performs authorized work and reconciles it across recovery | Authority derived from payload claims or permission to repeat a completed effect |

In this composition, Chronolog owns shared authority verification; Tendriller
hosts the control participant and provides account integration. Discovery advertisements, account
login, connection success and possession of the newest database are not authority
evidence. Application code does not decide which old branch becomes current.

Keep original authenticated event origin attached to projections and agent work.
A payload's `author`, `role` or `instruction` property is domain data. It cannot
replace the verified signer, grant private tools or impersonate a missing device.
A stable application/team identity must outlive the creating device.

## Distinguish completion from recovery

These are distinct observations, not a required ladder of protocol stages.
`operation.applied()` waits for execution in the selected history;
`operation.shared()` separately observes retained coverage on another peer.
Neither promises that an operation survives a later permitted recovery.

| Observation | What it establishes |
| --- | --- |
| Saved | The exact attempt is durably recorded locally with its original generation and guards. |
| Waiting | The original attempt is retained; no current execution outcome is known. |
| Applied accepted | The selected sequence executed the complete program successfully at a stated position. |
| Applied rejected | That execution rejected the complete program; no partial mutation or effective event escaped. |
| Shared | A named independent peer retained a complete usable prefix; reachability may change. |
| Abandoned | Recovery excluded the original attempt from the selected ancestry. Its evidence is retained. |

Reserve `final` for a profile that actually provides irrevocable settlement.
Do not alias a final wait to `applied()` or leave it pending in this profile.

Applied outcomes are stable while their position remains in the selected
ancestry. Inherited attempts keep their original identity and outcome. An
excluded attempt does not become a normal rejection and does not silently get
a new admission generation.

A timeout or cancelled waiter says nothing about command completion. Recover a
lost reply by looking up or retrying the same operation. Reusing its ID with new
payload, guards or definition version is a conflict. A deliberate reapplication
uses current state and permissions, a new operation ID, and a link to the
abandoned intent. There is one journal, owned by Chronolog; a cookbook, host MCP
or UI must not add another command outbox.

## Read and change one coherent view

A captured view binds SQL, events, outcomes and revision to one selected history.
Use it when reading the preconditions for a command. Include business guards in
the program: a revision token identifies what was observed but cannot prove the
business condition still holds.

A generation change between reading and preparation either preserves the
captured position as inherited ancestry or produces an explicit reread/reapply
result. The session owns that decision. Do not refresh stale guards inside an
exact retry.

Within a generation, update projections incrementally. At recovery, reuse only
state within the adopted prefix and publish one coherent replacement. Never
combine old SQL with new-generation events. Change consumers must handle an
explicit recovery/reset; the selected history is not an eternally append-only
stream. A coalesced UI notification is not a durable worker acknowledgement.

Draft text, focus and original operation references remain local interaction
state. A redraw or recovery must not overwrite newer typing. Automatic replay
is deterministic execution, not user Undo and not permission to invoke a tool.

## Make recovery honest

Prefer the freshest complete usable peer state on the selected ancestry. Metadata
alone, a SQL cache, a heartbeat or a large sequence number does not establish
completeness. Missing bodies inside a candidate prefix must be repaired or the
candidate must choose an earlier complete point. Two tabs sharing one storage
owner are one copy.

Five minutes is the initial measured freshness objective with another suitable
peer available. It is not an unconditional maximum loss. A long partition or a
single remaining copy can leave much more work exposed. Show the adopted base,
known abandoned range and unknown loss explicitly. If no usable state survives,
report unavailable; never silently create a new empty application.

Revocation, key changes and protected administrative transitions follow a
monotonic control chain. Rollback of application data cannot widen access or
remove a protected recovery floor. A remote snapshot signature authenticates
its producer's claim; it does not by itself prove correct SQL execution.

## Keep external effects explicit

An applied event cannot by itself authorize an irreversible email, payment or
external deletion. Recovery can abandon its business preconditions. A dispatch
journal and provider idempotency prevent some duplicate calls but cannot make
those abandoned preconditions true.

Select a stronger boundary explicitly: a durable external-action service, or a
protected checkpoint covering the complete prerequisite program and dependencies.
Keep stable effect identities, authorization and reconciliation for uncertain
calls. Do not automatically redispatch after a generation change. If a required
protected prefix is unavailable, report that action unavailable while ordinary
collaboration continues.

The existing `FinalEventSource` adapter requires immutable accepted-event history
and must not consume generation-applied events. Reversible computation and
replaceable caches may instead use an explicit recovery-aware rerun policy.

## Give an implementing agent a short contract

1. Choose signals-only, events-only, or SQL/events according to domain needs.
2. Use the unified selected-history contract and state its explicit recovery exception.
3. Establish device identity and explicit author, coordinator and recovery rights.
4. Use the public session for query, command, operation inspection and recovery.
5. Preserve exact attempts across lost replies; deliberately review reapplication.
6. Use an explicit stronger boundary for irreversible work; keep reversible computation recovery-aware.
7. Qualify the packed composition against host outage, coordinator loss, returning
   old branches and close/reopen without replacing device identity.

The [peer application cookbook](../cookbooks/run-a-peer-application/COOKBOOK.md)
connects these choices to executable consumers. Its evidence distinguishes a
model, independent package exercise, real browser/native run and deployed network
measurement. A successful build cannot stand in for the next level.
