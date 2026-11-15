# Approval remote

Prepare a bounded proposal with title, summary and structured proposal. Execute only the exact approved record, and record its result with the current expected_version. A revised proposal requires fresh owner approval.

## Prepare the page

Scaffold this recipe through the released CLI so all assets are declared and pinned.
Check `GET /api/service` for contract 2 and sessions interface/schema `1`.
An authorized controller must explicitly call `sessions.activate` with
`data:{"scope":"decisions"}` before initial protected state publication. Capture the
returned authoritative `sessions:decisions` generation through `GET A/scopes`.
Page data cannot activate server modules.

## Commands and replies

Use `POST A/workflows/sessions/<operation>` with
`{cid,scope:"sessions:decisions",expected_generations:{"sessions:decisions":"captured-token"},data}`.
The page uses the matching `TendrilWorkflows` adapter. A command ID and generation
are captured before work starts and reused on acknowledgement loss. Do not replace
an old generation with the newest one on retry.

Application event data is opaque. For protected agent results, carry the validated
event envelope's generation context into `PATCH A/state {cid,scope,expected_generations,ops}`.
If it is stale, retain or report the result for explicit review; never overwrite
the new session. Reading an application `session_id` cannot establish authority.

Use `decisionCreate`, `decisions`, `decisionUpdate` and owner-only `decisionRespond`. Record revision checks belong in `data.expected_version`; generation checks remain outside data. Re-read the approved record before external effects and deduplicate those effects by decision ID/version.

## Archive and recovery

`archivePreview` returns current counts and revisions. After the owner reviews the
concrete reset, call `archive` with that review, its captured generation and a stable
command ID. The server atomically stores the archive, pins referenced attachments,
resets only the selected scope and rotates its generation. A failed concurrency
or quota check leaves work unchanged. Archive downloads are private to owner/controller.

Use `archives`, `archiveGet` and `archiveDelete` explicitly. The page's archive UI
preserves unfinished drafts and blocks reset until queued work/captures are resolved.
Preview scenarios exercise presentation; real service tests own privacy and atomicity.
