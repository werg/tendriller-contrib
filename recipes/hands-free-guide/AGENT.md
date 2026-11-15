# Hands-free guide

Keep the guide definition separate from guide_progress. Steps have stable IDs; completed checkpoints and current step are shared. Never advance a step solely because speech recognition guessed a command. Ask for evidence when it will clarify progress.

## Prepare the page

Scaffold this recipe through the released CLI so all assets are declared and pinned.
Check `GET /api/service` for contract 2 and sessions interface/schema `1`.
An authorized controller must explicitly call `sessions.activate` with
`data:{"scope":"guide"}` before initial protected state publication. Capture the
returned authoritative `sessions:guide` generation through `GET A/scopes`.
Page data cannot activate server modules.

## Commands and replies

Use `POST A/workflows/sessions/<operation>` with
`{cid,scope:"sessions:guide",expected_generations:{"sessions:guide":"captured-token"},data}`.
The page uses the matching `TendrilWorkflows` adapter. A command ID and generation
are captured before work starts and reused on acknowledgement loss. Do not replace
an old generation with the newest one on retry.

Application event data is opaque. For protected agent results, carry the validated
event envelope's generation context into `PATCH A/state {cid,scope,expected_generations,ops}`.
If it is stale, retain or report the result for explicit review; never overwrite
the new session. Reading an application `session_id` cannot establish authority.

## Archive and recovery

`archivePreview` returns current counts and revisions. After the owner reviews the
concrete reset, call `archive` with that review, its captured generation and a stable
command ID. The server atomically stores the archive, pins referenced attachments,
resets only the selected scope and rotates its generation. A failed concurrency
or quota check leaves work unchanged. Archive downloads are private to owner/controller.

Use `archives`, `archiveGet` and `archiveDelete` explicitly. The page's archive UI
preserves unfinished drafts and blocks reset until queued work/captures are resolved.
Preview scenarios exercise presentation; real service tests own privacy and atomicity.
