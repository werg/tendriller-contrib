# Choose application primitives by their guarantees

**Application contract:** one public Chronolog session owns commands, queries,
events, replication and the operation journal. Native and browser runtimes use
that contract with explicit storage, transport and engine capabilities. There is
no application profile selector or separate hosted data implementation.
`operation.applied()` returns an accepted or rejected result at a selected
history position. Recovery may abandon a recent suffix, including previously
applied work; the current session exposes no `final()` wait.

The [peer application cookbook](../cookbooks/run-a-peer-application/COOKBOOK.md)
uses packed public artifacts directly; its
[checks guide](../cookbooks/run-a-peer-application/checks/README.md) documents the
native RTC, SQL, hosted, and browser qualification runners. Deployed operating limits
need their own observations. An implementation or method name alone does not
establish those qualifications.

Start with the recovery contract. A live cursor can disappear. A submitted
message can be retained by peers yet disappear from the selected application
history after recovery. A resource reservation needs a guarded transaction.
External work needs a journal and an explicit policy for recovery and uncertain outcomes.

## Coordinate several participants through public modules

Use the maintained optional `@tendriller/core/collaboration` module and the
[multi-participant reference](../cookbooks/coordinate-participants/COOKBOOK.md)
when a workspace needs addressed conversation, exclusive execution or specialist
contributions. Chronolog owns the retained session, authenticated attempts,
operation journal and attached endpoints. Core owns reusable interaction,
claim/result guards, participant and receipt models, and browser owner
composition. Contrib supplies the review policy, authored views and executable
consumer; it adds no owner election, retry queue or authority protocol.

One browser profile has one live owner and many independently allocated views.
The retained signer is distinct from its owner instance, attached endpoint,
document and run. A view detaches its own observers without closing siblings.
Per-view drafts and references survive independently, while each saved operation
keeps its original application, authenticated author and operation ID.

A request names its target, response policy and fixed contribution slots. A
guarded claim binds a claimant, run, endpoint incarnation, claim epoch, task
version and selected generation. Handoff and recovery invalidate old execution
authority; late output remains inspectable evidence. Cancellation requested,
execution stopped, result accepted and synthesis accepted are distinct states.
Observed history changes never grant authority to execute a tool. Before an
irreversible action, apply the separately configured external-action guarantee.

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

Opening the session starts its authenticated protocol participant. Identity,
membership, control exchange, code publication and live signals use the same
verified authority without opening application data. The first command, query,
content request or durable observation loads the session's one data component.
In the browser, small identity/control metadata uses IndexedDB; OPFS, its
exclusive lock and any SQL/WASM engine wait for that data demand. Inspecting
status or subscribing to status changes does not initialize the database.

Protocol authorization belongs to the participant. The database consumes that
verified authority and enforces the command's execution and domain guards.
Database failure can make data operations unavailable while the authenticated
control and live connection remain usable.

## Follow the authenticated selected history

An authorized coordinating peer orders commands during one session generation. Other peers retain the original
signed attempts, verify delegated order and replay it independently. The
coordinator is a temporary role. The creator and a native process are ordinary
participants with explicit capabilities.

Cloudflare publishes assets and supplies discovery, enrollment and occasional
control/generation transitions. Established direct peer connections keep a
healthy current generation working while host endpoints are unavailable.
WebSocket-relayed connections require the host's relay and consume its bandwidth;
blocking control HTTP and blocking relay delivery are distinct faults. Ordinary
commands and replication require no hosted append, certificate or backup
acknowledgement. If both the coordinator and control host are unavailable, keep
local drafts and wait to select a new generation.

A recovery can adopt an earlier **complete prefix of the currently selected
history**. Recent work outside that ancestry becomes abandoned. It remains
inspectable and may be deliberately reapplied as a new attempt. A returning old
branch never silently merges. If G2 excluded G1 positions 81–100, G3 cannot
readopt them merely because an old peer returns with valid signatures.

The public runtime and independent consumers exercise this selected-history
contract. Stronger settlement is a separately declared capability. The evidence
record states which exact package and runtime scenarios have run, without
promoting local results to browser or deployment readiness.

All participants use one public session, command/query vocabulary and journal.
Storage, transport and declared capability policies supply different roles; they
do not introduce incompatible application stacks. A lost peer never triggers an
automatic hosted fallback. Signed protocol format versions identify verified wire data; they do not select
a different application API or turn author timestamps into generation order.

## One protocol with participant-specific interests

All participants use the same bounded Chronolog envelope. Transports declare
which facets and actions they carry; routing interest never grants application
authority. The public session owns one journal and coherent view regardless of
whether the participant runs in a browser, native process or hosted adapter.

| Exchange | Facet | Default hosted participation |
| --- | --- | --- |
| Membership, keys policy and generation selection | Control | Small signed monotonic records; verify each role through the shared authority rules. |
| Application definition, page HTML and code assets | Publication | Authorized signed revision and exact asset hashes; publication does not rewrite database history or executable semantics. |
| Available routes and compact recovery hints | Discovery | Authenticated, expiring and coalesced; hints are not grants or retained-history proof. |
| Invitations and connection introductions | Ephemeral | Only declared introduction actions; short lifetime and bounded traffic. |
| Typing, cursors and other live UI signals | Ephemeral | Peer transport; filtered before hosted delivery and rejected at host ingress. |
| Commands, ordered history and retention coverage | Database | Peer transport; no mandatory hosted append, body, acknowledgement or certificate. |
| Retained attachments and content chunks | Content | Peer transport by default; explicit providers may add separately qualified retention. |

The control transport checks its interests before HTTP and validates scoped
responses. The host checks the same rules at ingress. Adding a stronger service
changes an explicit capability and transport policy within the common session;
it does not introduce another command API, outbox or incompatible replay path.

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

Reserve `final` for an explicitly supported irrevocable-settlement capability.
Do not alias a final wait to `applied()` or expose an unsupported wait that never resolves.

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
