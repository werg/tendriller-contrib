# Fresh peer task developer experience record

## Outcome

**The final complete run passed with exit code 0** using the clean `fe752b7f` packed native SQL package and the actual local Tendriller Worker control API. `evidence/run-3.jsonl` records the complete flow in **21.209 seconds**, including explicit device creation and final cached reopen. The first useful command in that final run took **7.455 seconds**. The earliest useful command during the study occurred in run-2 after **17m 32.247s total fresh-agent elapsed**, or **5.709 seconds of that process's run timer**.

This is an independent consumer study with disclosed coaching and retained failures. It is not a zero-coaching claim, an Internet/WebRTC test, a browser test, or an actual wire-reply-loss test. The deliberately lost result was an application observation; exact durable retry was verified afterward.

## Study boundary

- Started: **2026-11-17 13:38:19 UTC**.
- Initial project: an empty directory, `fresh-peer-task`.
- Initial reference: the public `@chronolog/peer-session` README only.
- Installation and runtime inputs: clean packed peer-session and Tendriller SDK artifacts plus a supplied actual local Tendriller Worker endpoint, application ID, and synthetic owner token; all arrived after the study began.
- Allowed: installed public package entry points, declarations, public documentation, and supported public APIs.
- Excluded: implementation source, private fixtures, existing consumer scripts, another agent's consumer, authority signing, custom key exchange, custom RPC maps, and custom retry outboxes.
- Transport scope: public `connectApplications` may exercise independent native stores locally. This study does not qualify Internet or WebRTC routing.

## Intended application

A small shared task board. Authorized members create a task and deliberately complete it using an expected task revision. Queries return the current task rows from one coherent view. A stale expected revision is a domain rejection; a stale application revision is also tested where the public API supports it.

Planned exercise:

1. Explicitly create two independent device stores and create/enroll their application membership.
2. Discover/describe the application and query its task state.
3. Submit a guarded command and inspect its applied outcome.
4. Deliberately lose an observation of an applied command, retry the same operation, and verify no duplicate intent.
5. Retain a prefix on a surviving device, let the original coordinator produce a suffix, and select recovery from the retained prefix.
6. Reread a coherent recovered view, inspect the abandoned operation under its original author's identity, and explicitly reapply it using the surviving device.
7. Close/reopen owned stores without create flags, verifying that the device identity and durable operation records survive.

## Initial documentation observations

- The README provides a complete event command example and documents the intended lifecycle, recovery, retry, reapplication, and local transport semantics.
- Native SQL is supported through `/sql-native`, but the README does not show a SQL application definition or a SQL command program. Inspecting packed public types may resolve this without coaching.
- Enrollment is described as an administrator grant to the device's public key. The README does not show the concrete grant API. Inspecting the packed SDK's public declarations may resolve this without coaching.
- The study will stop at concrete unsupported steps rather than implement protocol glue.

## Timing

| Milestone | UTC | Elapsed since start |
| --- | --- | --- |
| Read public README | 2026-11-17 13:38:19 | 0 |
| SDK artifact received and hash verified | 2026-11-17 13:39:19 | 1m 00s |
| Peer-session artifact received and hash verified | 2026-11-17 13:40:01 | 1m 42s |
| Offline install completed | approximately 2026-11-17 13:41 | approximately 3m |
| Host inputs received; first run started | 2026-11-17 13:44:43.682 | 6m 24.682s |
| Same-namespace real-Worker run started | 2026-11-17 13:55:45.592 | 17m 26.592s |
| First useful applied task command marker | 2026-11-17 13:55:51.247 | **17m 32.247s** |
| All domain/recovery/adapter stages completed | 2026-11-17 13:56:02.140 | 17m 43.140s |
| Targeted cached reopen continuation passed | 2026-11-17 13:57:52.993 | 19m 33.993s |
| Final complete run started with a separate explicit test population | 2026-11-17 14:01:06.574 | 22m 47.574s |
| Final complete run passed | 2026-11-17 14:01:27.773 | **23m 08.773s** |

The first useful command took **5.709 seconds from the successful process run timer**. Total fresh-agent elapsed time includes artifact handoffs, the documentation gap, coding, the inaccessible separate-network-namespace endpoint, infrastructure correction, the final package upgrade, and fixture startup. It is not represented as five seconds of total onboarding.

## Infrastructure/application code

Both archives installed with `npm install --ignore-scripts --omit=peer --offline --no-audit --no-fund`. Two packages were added; no installation script or optional native RTC dependency was required.

Artifact identities:

- Initial peer session: `@chronolog/peer-session@0.0.0-g3187d9df-rtc-sql-wasm`; archive SHA-256 `84f7542e1db04b0be3e325b9b37c35764e65ec138241a593a60661acd0283eaf`.
- Before the first successful hosted run, upgraded to clean `@chronolog/peer-session@0.0.0-gfe752b7f-rtc-sql-wasm`; archive SHA-256 `45d4a1f328ace4f51545f1ab6fdc17061f3461005d60548996564a44093cf77c`. Only its public README and declarations were inspected. This version adds a complete shared-SQL example and public `OWNER_FOR_KEY_SQL`; the application now uses that helper in place of the supported literal owner subquery. Existing device stores were retained. The doc fix does not retroactively erase the original coaching intervention.
- Tendriller: `@tendriller/core@0.3.0-rc.9`; archive SHA-256 `71cc9b1c32f34531a650e3eeb04eeec15158106c7187c01f601d72177f5d6614`.
- Runtime: Node `v24.22.1` on the supplied Linux environment.

No authority, key exchange, RPC, custom transport, or retry infrastructure has been written. `connectApplications` owns local transport. The SDK owns hosted requests. The application has only a hosted-request observation wrapper and a bounded test observation loop.

The application was implemented before endpoint handoff. `task-definition.mjs` declares the SQL schema, two commands, and two queries. `task-flow.mjs` drives the independent-device study and writes timestamped JSON-line observations. Both passed `node --check` before runtime execution.

The final application definition is 68 lines. Its complete exercise, evidence, assertions, and lifecycle driver is 280 lines. The narrow diagnostic continuation is 95 lines. These counts include formatting and comments. SDK/transport/protocol infrastructure written by this consumer: **zero** signing implementations, key-exchange implementations, RPC maps, transport implementations, or retry queues. The ordinary harness code includes JSON logging, an SDK request-count wrapper, resource cleanup, a bounded observation loop, and assertions.

## Coaching requested or received

- Root task setup supplied the study scope and runtime inputs; that is study setup, not application guidance.
- Requested SQL authoring coaching after inspecting the packed README and public declarations: how to bind the `Uint8Array` `APPLICATION_COLLECTIVE_ID` into the documented integer `chronolog_owner` column, and whether a supported SQL assertion function has a documented signature. No implementation was inspected. The package exposes no complete public SQL task example.
- **One implementation-coaching intervention received:** root confirmed the documentation gap, supplied `SELECT id FROM chronolog_principals WHERE key = ?` for the owner binding and `SELECT chronolog_assert(condition, 'code')` before mutation for an atomic domain guard. Root also pointed to the existing public ownership documentation; only its indicated "Who am I, and who owns this row?" section was read. That section discusses another profile's higher-level API, so no other APIs from that page were used.
- Reported that `connectApplications` has no public fault-injection option. Root instructed this consumer to use discarded/cancelled application result observation and explicitly avoid claiming wire-reply loss. No custom framed transport was written. This study therefore qualifies exact retry after observation loss, with actual wire-loss qualification remaining outside its scope.

Coaching accounting: one semantic SQL/API intervention; one testing-scope direction about observation loss; one environment intervention about network namespaces. The maintainer's final artifact handoff supplied a public documentation/helper fix, and does not erase the original SQL intervention. The later fingerprint assertion was diagnosed and corrected independently without implementation coaching.

## API mistakes

- **One consumer evidence-assertion mistake:** the first full run used `SHA256(JSON.stringify(signedAttempt))` as an exact-copy check. Its final reopen assertion failed because JavaScript object property enumeration is not signed-attempt identity. The task itself had already completed guarded rejection, exact retry, rollback, foreign-author inspection, deliberate reapplication, and the Tendriller SQL query.
- This was diagnosed independently through supported cached reopen and inspection APIs. The original coordinator's independent persisted signed attempt and the surviving device's retained signed attempt were deeply equal, kept the exact attempt ID recorded before recovery, and retained the original signer. Reordering a deeply equal object's keys demonstrated that the JSON hash changes without any content change.
- `task-flow.mjs` now compares complete signed-attempt values with `assert.deepEqual` and logs the SDK's authenticated attempt IDs. `verify-reopen.mjs` preserves the narrow diagnostic and continuation. Its actual run passed with zero network calls, unchanged identities, matching SQL results, and preserved foreign intent and reapplication. The original failed full-run log is retained unchanged.

## Infrastructure interruptions

- First run (`evidence/run-1.jsonl`) explicitly created three device stores, then failed before any hosted response with `TypeError: fetch failed`. A direct read-only request to the supplied `/testing/traffic` URL confirmed `ECONNREFUSED 127.0.0.1:37537`.
- Run-2 reused those same device identities with explicit setup resume when the endpoint was reachable. The failure handler was improved to retain nested error causes. No device store was deleted or silently replaced.
- **One infrastructure-coaching intervention received:** root and the endpoint operator diagnosed isolated network namespaces for separate shell invocations. The Worker was alive but unreachable from a separately invoked consumer. The operator launched this independently authored consumer as a child in the same invocation as the real Worker and captured its raw output. No application/protocol code was changed by the operator, and this consumer did not inspect the fixture implementation.
- Run-3 deliberately used a new application ID and a separate `runtime/run-3` directory for a clean verification of the corrected full script. Its three devices were explicitly created. The original `runtime/run-1` population and its successful cached-reopen continuation remain preserved. Identity was not replaced during any ordinary reopen.

## Recovery mistakes

- None observed. A third device retained the actual complete prefix at sequence 3 before the original coordinator produced sequence 4. The observer retained sequence 4 and therefore could inspect the original author's abandoned operation after the third device's takeover. No invented or manually rewritten recovery point was used.

## Raw evidence

- `evidence/run-1.jsonl`: initial infrastructure failure after device creation.
- `evidence/run-2.jsonl`: first hosted run, preserving its final consumer assertion failure.
- `evidence/reopen-continuation.jsonl`: successful targeted completion and diagnosis, using the same preserved stores with all network calls forbidden.
- `evidence/artifacts.json`: independently computed archive hashes, installed package versions, public clean-source provenance, and native runtime/platform.
- `evidence/run-3.jsonl`: complete final run, including `study.passed`, exit code 0 from the operator's execution record, and all final device/operation assertions.

No owner token, device store, private signing key, application epoch key, or native database is included in the published evidence.

## Observed domain results

- Explicit setup resumed all three original device identities after the endpoint interruption.
- Bob and Carol opened in `awaiting-keys` and joined through public local connections without application key-exchange code.
- The public Tendriller SDK called the supplied actual local Worker and returned the declared application and directory. The directory had no advertised routes, as this was an explicitly local transport study.
- Task creation was accepted at sequence 1. Completing it at the wrong version was an ordered rejection at sequence 2 with `assert:task_not_open_at_version`; the task stayed open and emitted no completion event.
- Cancelling an applied-result waiter left the disconnected intent saved. Reconnect and explicit retry retained its original signed attempt and produced one creation event at sequence 3. This is lost observation, not actual wire loss.
- Carol selected her retained sequence-3 prefix. Alice's accepted sequence-4 completion was abandoned. The recovered board showed the task open, and the stale event cursor raised `RecoveredViewError`. Recovery reported `unknownLoss: true`.
- Bob inspected Alice's signed abandoned attempt and deliberately reapplied the completion under Bob's identity. The new attempt's `reapplyOf` was Alice's original attempt ID. Only Bob's completion event appeared in the selected view.
- Bob's SQL rows, device identity, storage identity, current applied attempt, and retained original foreign attempt survived cached reopening with zero network calls.

The final run repeated every stage successfully. Its trace records 13 public control/discovery HTTP requests across bootstrap, joining, metadata lookup, and explicit takeover. Final cached reopen made zero hosted requests. The final board contained `launch-checklist` as `done` at version 2 and `reply-observation` as `open` at version 1. Exactly one selected completion event belonged to Bob's deliberate reapplication; Alice's abandoned completion did not reappear in the selected view.

## Publication checkpoints

- `0e8197fd0f03ee834fc2f2fc07af702f351a0d7c`: authored exercise and first infrastructure failure.
- `b82b2e70d6baa6f9be3ef5634c24efbdacd37a02`: unchanged first hosted run, its raw assertion failure, and host execution provenance.
- `6fcd9bf94fde98713667e4a1676100bcc4223a68`: corrected signed-content equality assertions and successful targeted cached reopen proof.
