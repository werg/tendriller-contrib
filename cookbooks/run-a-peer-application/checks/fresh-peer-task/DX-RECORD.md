# Fresh peer task developer experience record

## Study boundary

- Started: **2026-11-17 13:38:19 UTC**.
- Initial project: an empty directory, `fresh-peer-task`.
- Initial reference: the public `@chronolog/peer-session` README only.
- Installation and runtime inputs: awaiting clean packed peer-session and Tendriller SDK artifacts plus the supplied real local Tendriller Worker endpoint, application ID, and synthetic owner token.
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
| First useful applied task command | Pending | Pending |

## Infrastructure/application code

Both archives installed with `npm install --ignore-scripts --omit=peer --offline --no-audit --no-fund`. Two packages were added; no installation script or optional native RTC dependency was required.

Artifact identities:

- Initial peer session: `@chronolog/peer-session@0.0.0-g3187d9df-rtc-sql-wasm`; archive SHA-256 `84f7542e1db04b0be3e325b9b37c35764e65ec138241a593a60661acd0283eaf`.
- Before the first successful hosted run, upgraded to clean `@chronolog/peer-session@0.0.0-gfe752b7f-rtc-sql-wasm`; archive SHA-256 `45d4a1f328ace4f51545f1ab6fdc17061f3461005d60548996564a44093cf77c`. Only its public README and declarations were inspected. This version adds a complete shared-SQL example and public `OWNER_FOR_KEY_SQL`; the application now uses that helper in place of the supported literal owner subquery. Existing device stores were retained. The doc fix does not retroactively erase the original coaching intervention.
- Tendriller: `@tendriller/core@0.3.0-rc.9`; archive SHA-256 `71cc9b1c32f34531a650e3eeb04eeec15158106c7187c01f601d72177f5d6614`.
- Runtime: Node `v24.22.1` on the supplied Linux environment.

No authority, key exchange, RPC, custom transport, or retry infrastructure has been written. `connectApplications` owns local transport. The SDK owns hosted requests. The application has only a hosted-request observation wrapper and a bounded test observation loop.

The application was implemented before endpoint handoff. `task-definition.mjs` declares the SQL schema, two commands, and two queries. `task-flow.mjs` drives the independent-device study and writes timestamped JSON-line observations. Both passed `node --check` before runtime execution.

## Coaching requested or received

- Root task setup supplied the study scope and runtime inputs; that is study setup, not application guidance.
- Requested SQL authoring coaching after inspecting the packed README and public declarations: how to bind the `Uint8Array` `APPLICATION_COLLECTIVE_ID` into the documented integer `chronolog_owner` column, and whether a supported SQL assertion function has a documented signature. No implementation was inspected. The package exposes no complete public SQL task example.
- **One implementation-coaching intervention received:** root confirmed the documentation gap, supplied `SELECT id FROM chronolog_principals WHERE key = ?` for the owner binding and `SELECT chronolog_assert(condition, 'code')` before mutation for an atomic domain guard. Root also pointed to the existing public ownership documentation; only its indicated "Who am I, and who owns this row?" section was read. That section discusses another profile's higher-level API, so no other APIs from that page were used.
- Reported that `connectApplications` has no public fault-injection option. Root instructed this consumer to use discarded/cancelled application result observation and explicitly avoid claiming wire-reply loss. No custom framed transport was written. This study therefore qualifies exact retry after observation loss, with actual wire-loss qualification remaining outside its scope.

## API mistakes

- None yet.

## Infrastructure interruptions

- First run (`evidence/run-1.jsonl`) explicitly created three device stores, then failed before any hosted response with `TypeError: fetch failed`. A direct read-only request to the supplied `/testing/traffic` URL confirmed `ECONNREFUSED 127.0.0.1:37537`.
- The study will reuse those same device identities with explicit setup resume when the endpoint is reachable. The failure handler was improved to retain nested error causes. No device store was deleted or silently replaced.
- **One infrastructure-coaching intervention received:** root and the endpoint operator diagnosed isolated network namespaces for separate shell invocations. The Worker was alive but unreachable from a separately invoked consumer. The operator will launch this independently authored consumer as a child in the same invocation as the real Worker and capture its raw output. No application/protocol code is changed by the operator, and this consumer does not inspect the fixture implementation.

## Recovery mistakes

- None yet.

## Raw evidence

Pending execution. Evidence will preserve command output and structured application observations without publishing the supplied owner token.
