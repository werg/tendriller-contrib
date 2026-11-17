# G3 independent fresh-consumer review

**Verdict: the bounded business workflow passed through the public application tools after two setup interruptions.** The successful third attempt completed 24 requests and exited with code 0. The consumer wrote no application protocol, retry queue, retry loop, or recovery loop, and did not call `takeover`. Enrollment and the fault/reopen environment were provided; this result does not qualify end-to-end setup without assistance.

## Evidence and scope

The complete machine-readable record is the attempt3 `report.json`, originally at `/workspace/scratch/f3460a050d13/qualification/fresh-agent-6bf1871c-attempt3/report.json`. Its SHA-256 is `dcd5a9468e87fad3621e24dce96fd19318cda29e1a5d9648ce93a4cc6ec9f3ed`. References below use request IDs inside `exercise.trace`; fixture-only observations are explicitly identified by their report fields.

The consumer read only the packed README, public peer-session tool/session/recovery declarations, and the public README section “Content and local agent tools” before execution. It discovered application names and argument shapes through `list` and `describe`. It did not inspect runtime, protocol, tests, harness, fixture implementation, or other agents' code/reasoning, and did not edit those files. Public `operation` output was inspected as application evidence; signed attempt contents were not constructed or interpreted as a protocol.

| Provenance | Value |
| --- | --- |
| Package | `@chronolog/peer-session@0.0.0-g6bf1871c-sql` |
| Supplied package source commit | `6bf1871c599ef924f60c48cf0909b15ba4914ba5` |
| Package's recorded source tree | `80eddac31756d8b359f3c28bd11f768ed2c7695e`, `sourceDirty: false` |
| Independently observed package SHA-256 | `c309a9dc46a1b1406378147f4a9faced8b629989c49f15c9886232104b9f3275` |
| Successful fixture's recorded consumer source | `6cccfac57d16b79007e8ed1b34328b70e7263f53`, `dirty: false` |
| Successful fixture's recorded source tree | `f3636b4ea2f1fd6b72678b731e6b7194fd3312a2` |
| Runtime observed and recorded | Node.js `v24.22.1`, Linux x64 |
| Successful fixture elapsed time | `2026-11-17T15:27:53.794Z` to `2026-11-17T15:30:10.371Z`: **136.577 seconds** |
| Public request/response trace span | `2026-11-17T15:28:16.222Z` to `2026-11-17T15:30:10.320Z`: **114.098 seconds** |

The package hash matched the supplied value. Fixture source provenance and fault/reopen facts come from the permitted record, not an independent source audit. From the first startup at 15:23:33 UTC to successful completion was approximately 6 minutes 37 seconds, including the setup interruptions below; documentation review preceded that interval.

## Observed workflow

| Requests | Action and exact observation |
| --- | --- |
| 1–3 | `list` exposed the tool schemas. `describe` reported SQL capability, a ready follower, `finality: false`, and `automaticExternalEffects: false`. The coherent `board` query showed `review` open and unclaimed, `locked` open and claimed by another author, and no messages. |
| 4–5 | Guarded `postMessage` for `agent-note-1` returned the fixture error `EXERCISE_TRANSPORT_REPLY_LOST` with outcome `unknown; inspect the original operation identity`. Public inspection then returned **`needsReapply`**, `previous: null`, and a different selected generation. It did not return an acknowledged accepted result for the original operation. |
| 6–8 | `changes` using the original query revision returned `kind: recovery`, **`resetRequired: true`**, and the actual notice. `recoveries` returned that retained notice with **`unknownLoss: true`** and the original operation listed as `needsReapply`. A coherent reread confirmed no message in the selected view. |
| 9–12 | The consumer explicitly invoked `reapply` with `originalOperationId: agent-note-1`, new `operationId: agent-note-2`, current captured revision, and the same message ID/text. It initially returned `saved`. `wait` returned `applied`, `outcome: accepted`, sequence **1**. `operation` exposed `reapplyOf` equal to the original attempt ID. The next board query contained exactly one `Ready for review` message, from `agent-note-2`. |
| 13–15 | Guarded `finishTask` for `locked`, operation `agent-wrong-author-1`, initially returned `saved`. `wait` returned **`status: applied`, `outcome: rejected`, `rejectionCode: assert:claim_required`**, sequence **2**. The next coherent board query still showed `locked` open under its original author. |
| 16–18 | Guarded `claimTask` for `review`, operation `agent-claim-1`, returned `saved`, then `wait` returned `applied`, `accepted`, sequence **3**. A fresh query showed `review` open and claimed by the consumer's authenticated identity. |
| 19 | Guarded `finishTask` for `review`, operation `agent-finish-1`, returned `saved` with the finish attempt ID below. The fixture then emitted `reopened` with the same device identity. |
| 20–23 | After reopening, `operation`, `wait`, and one explicit `retry` of **the original finish identity** returned `applied`, `accepted`, sequence **4**, with the same attempt ID. A second `operation` inspection matched the entire first post-reopen inspection object, including the opaque saved attempt. The `wait` and `retry` result objects were equal. |
| 24 | The final coherent board showed `review` **done** by the consumer identity, `locked` **open** under the other author, and exactly one replacement `Ready for review` message. The selected generation remained at sequence **4** after the retry. The fixture emitted `complete`, `requests: 24`, and exited 0. |

All five mutating calls copied the latest applicable coherent query revision without alteration: request pairs **4←3, 9←8, 13←12, 16←15, and 19←18**. Comparing those JSON objects in the retained trace confirmed equality. No application request was malformed; the only error response was the deliberately suppressed message reply (23 result responses, one fixture error response).

### Exact identities and outcomes

| Item | Exact value |
| --- | --- |
| Consumer author | `8b15a01f3cb6faeb08efcd33b67fb7c21dfbdd5870bacccdc0ff074c3c6f8e3e` |
| Other author | `b4520de95d961aac0f341d3902199d6bed4ca71827196ef9c911fbec6c25d2d0` |
| Original generation | `a6547dadedaee25361d9844ab58198836a3549cc2d40d3a7466961d7b5bf0555` |
| Selected generation | `2b89f4874b6f8728b7c4308df6597f2e8e4803cb9cc7e9f6e8879a5e3b6fcfeb` |
| Original message attempt (`agent-note-1`) | `645968c8a463135e9c9e871c0c96cfebbfc8f674d6efaf41f425355f29dcd64b` |
| Replacement attempt (`agent-note-2`) | `c66f152b6085b7cb5efb1f729686ca6bcb9f2c4b531b1fbdc645186f6a0eded2` |
| Finish attempt (`agent-finish-1`) | `86173307487c11226733bab3e56e4e4bb9350c28d69c3fa231243e8d8528141a` |
| Reopened storage identity, fixture record | `d32113d9-eae7-4f6a-bf2a-f12adb3067aa` |
| Final revision root | `3a8d90a5a518b5eabaf01e22121625c211d33067216ae399f20d8d32149c3237` |

The message text was exactly `Ready for review`; both original and replacement used `messageId: review-ready`. Public inspection of the replacement showed `reapplyOf: 645968c8a463135e9c9e871c0c96cfebbfc8f674d6efaf41f425355f29dcd64b` (request 11). The replacement was a deliberately new command, not an exact retry of excluded work.

The fixture record says the original command persisted at the former coordinator before its reply was suppressed and that coordinator was removed (`exercise.fault`). The consumer-facing result was uncertain and later `needsReapply`; the report does not convert that uncertainty into a previously observed acceptance. The recovery notice adopted the former generation through sequence 3 and preserved `unknownLoss: true` (requests 6–7).

The fixture record shows identical device/storage identities and applied finish states before and after reopen, with no plaintext keys supplied on reopen (`exercise.reopen`). Direct consumer evidence shows the same finish attempt ID before reopen (request 19) and afterward (20–23). Full inspected attempt objects were compared only on the two sides of the **post-reopen retry**; this run did not issue a full pre-reopen attempt inspection.

## Setup interruptions and assistance

1. **First attempt — fixture import blocker.** At `2026-11-17 15:23:33 UTC`, the supplied command in `fresh-agent-6bf1871c/consumer` exited 1 before readiness or any application request. The diagnostic identified `peer-generation-participation.mjs:4` and reported: `SyntaxError: The requested module '@chronolog/peer-session' does not provide an export named 'createFramedPeerConnectionPair'`. The consumer reported it without opening or repairing source. The preparer supplied a new fixture directory and reported switching to the documented embedded connection. This is a fixture setup failure, not a passed product step.
2. **Second attempt — consumer process setup error.** At `2026-11-17 15:25:35 UTC`, the corrected fixture in `fresh-agent-6bf1871c-attempt2/consumer` reached readiness for device `214ee205644580bd224807e62a37299fae286619a402e8e4891be6fda854bc0e`, then exited 1 with `The agent stopped before completing the declared business workflow`. The consumer had omitted a persistent PTY, so stdin closed before any request. This is the consumer's invocation error, not a package defect. The preparer supplied a clean third directory to avoid reseeding the existing database.
3. **Third attempt — successful run.** The consumer used `tty: true`, cwd `/workspace/scratch/f3460a050d13/qualification/fresh-agent-6bf1871c-attempt3/consumer`, and command `node peer-generation-agent-harness.mjs /workspace/scratch/f3460a050d13/qualification/fresh-agent-6bf1871c-attempt3/report.json`. It reached readiness and completed the workflow above.

The preparer supplied enrollment, signed schema, a persistent device, the bounded task, reserved operation IDs, deterministic fault/reopen actions, and the raw trace. The consumer was told to use the public tools, not call takeover, and inspect/retry the finish identity after reopen. After third-attempt readiness, no coaching or implementation repair was needed to form or interpret the 24 application requests.

The initially supplied public documentation path `chronolog-db/docs/packages/peer-session/README.md` did not exist; filename discovery found `chronolog-db/packages/peer-session/README.md`. This was a task-routing correction.

## Developer experience and limits

The public README plus discovered schemas were sufficient to complete the supplied workflow. No runtime application blocker remained after the interactive session was ready. In particular, `originalOperationId` and the full `basedOn` shape were discoverable, so the consumer did not have to infer parameter names or assemble signed data. Copying a captured revision and using one `retry` tool call were ordinary application actions; there was no second outbox or handwritten recovery policy. No application profile, compatibility mode, or migration option was selected.

Two details require care from a fresh consumer: `saved` is only the first command observation, and `applied` can carry a rejected domain outcome. The excluded message's exact state was `needsReapply`, although it appeared in the recovery notice's `abandoned` collection. The documented state distinctions were enough to proceed correctly. The full `operation` output also includes substantial opaque signed data; a compact inspection option could improve readability, but this did not block the task.

This run qualifies the supplied enrolled, native SQL/conversation workflow and its public observability. It does not prove independently retained `shared` coverage: `describe` advertised the capability, but no coverage wait was exercised. Applied acceptance is not irreversible finality. No conclusion is made about an unknown loss bound, external effects, independent enrollment, browser/Worker execution, public network routing, or unexercised lifecycle boundaries. The two setup interruptions remain part of the fresh-consumer record; this is not a zero-assistance installation result.

## Final artifact repeat — core 08ee9f2a (learned flow)

**Repeat result: passed the same bounded workflow on the final artifact.** This was requested to bind a public-tools transcript to the final package checkpoint. The consumer had already learned the API and fixture flow during the initial study above. It is a repeat verification, not a new first-time consumer study, and does not replace or relabel the initial evidence or its two zero-request startup failures.

The consumer independently verified the final archive hash, then used the same public JSON-lines tools without opening implementation or harness source. The process used `tty: true`, cwd `/workspace/scratch/f3460a050d13/qualification/final-agent-08ee9f2a/consumer`, and command `node peer-generation-agent-harness.mjs /workspace/scratch/f3460a050d13/qualification/final-agent-08ee9f2a/report.json`. It started successfully on this attempt, emitted `complete` after 24 requests, and exited 0. The preparer supplied the new enrolled fixture and the instruction to repeat the same task; there was no additional runtime intervention.

| Repeat provenance and timing | Exact value |
| --- | --- |
| Package version | `0.0.0-g08ee9f2a-sql` |
| Package source commit | `08ee9f2ab4a75f3b3396a9af2b420813e1d05f8c` |
| Package recorded source tree | `e57a4edb0df84ebfe69f70c3ba83b2e3878bed76`, `sourceDirty: false` |
| Independently observed SQL archive SHA-256 | `d691daa96083aaa6e286b474312b6530f6c715577baa337db32849745b0a6388` |
| Recorded consumer fixture commit | `5512b5c6de3d02b1ee250f19c1349057f2a6d9bd` |
| Recorded consumer fixture tree | `73fb745985e352c5d5d5fc7896434a28b098a9db`, `dirty: false` |
| Machine-readable repeat record | `/workspace/scratch/f3460a050d13/qualification/final-agent-08ee9f2a/report.json` |
| Repeat record SHA-256 | `5761b1202b595a5e79f817dfa7ea64640e149034fefa69fa56d8225ec5479c6b` |
| Fixture elapsed | `2026-11-17T15:34:10.435Z` to `2026-11-17T15:36:14.355Z`: **123.920 seconds** |
| Public trace elapsed | `2026-11-17T15:34:25.450Z` to `2026-11-17T15:36:13.771Z`: **108.321 seconds** |

The repeat's complete `list` result was equal as a JSON object to the initial study's tool schemas. Request IDs 1–24 followed the same documented actions in the table above, with new fixture identities and revisions. The observed results were:

- **Requests 4–8:** deliberately lost reply; original `agent-note-1` inspected as `needsReapply`, `previous: null`; `changes` returned a recovery notice with `resetRequired: true`; `recoveries` retained `unknownLoss: true`; the coherent reread had no messages. Original attempt ID: `4f950933847a8efa1975fda885f619fc5f8454df6f57305ce726f11d9539c649`.
- **Requests 9–12:** explicit new-ID reapplication returned `saved`, then applied/accepted at sequence 1. Public inspection linked it to the exact original attempt through `reapplyOf`; the board contained one `Ready for review` message.
- **Requests 13–18:** wrong-author finish was applied/rejected with `assert:claim_required` at sequence 2; the locked task remained open. The consumer's claim of `review` applied/accepted at sequence 3 and appeared under the consumer identity in a fresh query.
- **Requests 19–23:** finish returned `saved`, the fixture emitted `reopened`, and inspection/wait/retry preserved the same applied/accepted finish attempt at sequence 4. Inspection objects 20 and 23 were equal; result objects 21 and 22 were equal. The fixture also recorded unchanged device/storage identities and finish states across reopen.
- **Request 24:** `review` was done by `1c8b8989cdaaa70e7584191deac9a20ec196cf050328f9bd4529e1952f96739e`; `locked` remained open under `e857ef0d4bd5dcd0899d6ffb6a67f6889c5528714209b02c8200f401aaab62e7`; exactly one `Ready for review` message remained, from `agent-note-2` and `messageId: review-ready`. The final selected revision stayed at sequence 4 after retry.

| Repeat operation | Attempt ID | Applied sequence | Outcome |
| --- | --- | --- | --- |
| `agent-note-2` | `97063a84fcd9557b2acd856977b0c1724d31d5bb8d4be8ecb8e648a667fe57be` | 1 | accepted |
| `agent-wrong-author-1` | `13b77660b34ecb1f831e4507303a908858133e2cbe8da5e3803ee97d7019069a` | 2 | rejected / `assert:claim_required` |
| `agent-claim-1` | `8fb2ae49a399dfeb208b9d45a1419d1d77ae4d5d83803e4f3b79299338143afe` | 3 | accepted |
| `agent-finish-1` | `e7cf82931481575f073b53c5ad56603c63c2084ab76bce3de421b7887f7880d9` | 4 | accepted |

The repeat moved from generation `b852304f439ae44aacd9519533337c50235878a3b84eee2e1111bdf5d7b2ffe0` to `bbc0904070e983ca2ff6564e2a4adfa4607fbdf0bbc58a509c3deb4390703818`. Its final root was `a5446cb176f314c9fa5bcca96f6d8d259b52283f4f83c437adb8066d673e8f72`; its reopened storage ID was `41bd18cd-88fe-4a44-b330-cb61ba0f82b0`.

All five `basedOn` revisions again matched their captured queries exactly (4←3, 9←8, 13←12, 16←15, 19←18). There were 23 result responses and one intentional fixture error, with no malformed request, takeover call, application retry queue, or consumer recovery loop. The initial study's limits still apply: this verifies the supplied enrolled native workflow, not independently retained shared coverage, irreversible finality, unknown loss bounds, or untested platforms and lifecycle boundaries.
