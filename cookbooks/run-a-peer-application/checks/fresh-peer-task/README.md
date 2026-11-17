# Fresh guarded peer task study

This independent consumer builds a small shared SQL task board using the packed public Chronolog peer-session and Tendriller SDK interfaces. It was authored from an empty directory without reading implementation source, existing consumer scripts, private fixtures, or another consumer's work. The SQL owner binding and assertion syntax required one recorded coaching intervention; see `DX-RECORD.md`.

## Scope

- Three separate native device stores and SQL databases.
- Explicit first-time creation and member enrollment.
- Hosted application discovery and schema description through the Tendriller SDK.
- Shared tasks with an atomic expected-version guard and a transactionally emitted event.
- A cancelled application result observation, reconnect, and exact attempt retry.
- Takeover from a genuinely retained earlier prefix, coherent reread, and a stale event-cursor error.
- Inspection of another author's abandoned operation, followed by deliberate reapplication under a surviving device's own identity.
- A Tendriller application-backend SQL view.
- Close and cached reopen without create flags, a replacement identity, or a hosted request.

`connectApplications` is deliberately local. This program does not qualify Internet routing, WebRTC, browser execution, or actual wire reply loss.

## Run with supplied infrastructure

Requires the native SQL packed archive for the target platform, the packed Tendriller SDK, a compatible Node runtime, and a real Tendriller control endpoint for a **fresh, unconfigured peer application**.

```sh
npm install --ignore-scripts --omit=peer --no-save --package-lock=false --no-audit --no-fund \
  /path/to/chronolog-peer-session-preview.tgz \
  /path/to/tendriller-sdk.tgz
```

Create a private JSON configuration outside version control:

```json
{
  "api": "http://127.0.0.1:PORT/api/APPLICATION",
  "applicationId": "the-selected-application-id",
  "token": "the-supplied-synthetic-owner-token"
}
```

The API URL is the exact one supplied by the endpoint operator. Do not infer its route from the placeholder above. Then run:

```sh
TASK_HOST_CONFIG=/absolute/path/to/private-host-config.json \
  TASK_RUNTIME_DIR=./runtime/run-1 \
  npm start
```

Alternatively set `TENDRILLER_API`, `TENDRILLER_TOKEN`, and `TENDRILLER_APPLICATION_ID` directly. The program emits JSON lines to standard output and never logs the token. Use a fresh application and runtime directory for each full run: the study deliberately starts with explicit creation, then tests cached reopening at its end.

If endpoint bootstrap fails before the application exercise begins, set `TASK_RESUME_SETUP=1` and reuse the same runtime directory to resume those device identities and retry the exact pending application publication. This option is for retrying interrupted setup, not for rerunning a completed study against its old command IDs.

In this execution environment, separate shell tool invocations have isolated network namespaces. The infrastructure operator must start the Worker fixture and launch this consumer as its child in the same invocation. That is an infrastructure requirement of the study environment; the consumer still calls the actual public HTTP API through the SDK.

## Files

- `task-definition.mjs`: application schema, guarded commands, and queries.
- `task-flow.mjs`: executable study and raw observation emitter.
- `DX-RECORD.md`: timing, coaching, mistakes, and boundaries.
- `evidence/`: actual run output once the supplied endpoint is available.
