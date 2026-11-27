---
id: "store-lazy-peer-media"
title: "Store rich media lazily over P2P without bloating host storage"
summary: "Use Chronolog's unified session.content pipe for encrypted or public chunked blobs pulled on demand from peers, alongside peer-backed $publications history."
group: "Collect evidence"
tags: ["media", "content", "p2p", "blobs", "publications"]
choices: ["Private epoch-encrypted blobs vs public hash-addressed blobs", "Keyed-convergent deduplication vs randomized per-upload nonces", "Peer-backed history recovery when the host prunes older R2 versions"]
capabilities: []
evidence: "explained"
related: ["capture-reviewed-evidence", "choose-data-model", "publish-coherent-updates"]
sources: ["https://github.com/werg/tendriller/blob/7b963a6085d8e5c57054f3045b2540328336420d/session/publication-blobs.mjs"]
---

# Store rich media lazily over P2P without bloating host storage

Never stuff photos, PDFs, audio recordings, or large attachments into eager CAS or JSON operation payloads. Chronolog provides a unified lazy-pull blob pipe (`session.content.put` / `session.content.get`) that chunks and encrypts private blobs under your log's epoch key (with optional keyed-convergent deduplication) or addresses public blobs by raw SHA-256 hash. Only a tiny JSON reference (`MediaRef`) enters your `chronolog-db` row or note; peers fetch the actual bytes on demand when a user views or downloads the item.

## Match visibility to the log's privacy boundary

- **Private logs (`privateLog: true`, default):** Use `putMedia(session, file, { visibility: 'private', deduplicate: true })` (from `shared/helpers/lazy-media.mjs`). Chunks are encrypted with your current epoch key and can only be decrypted by admitted readers.
- **Public logs (`privateLog: false`):** Use `visibility: 'public'` so any anonymous reader can verify and fetch chunks by SHA-256 hash. Always label public attachments honestly in the UI.
- **Streaming, local LRU cache budgets & agent auto-pinning:** For large audio/video files, stream chunk-by-chunk with `session.content.putStream(chunks, { totalBytes })` and `session.content.readStream(ref)` without buffering the whole file in RAM. Pin critical assets with `session.content.pin(ref)` and bound local IndexedDB/OPFS growth with `session.content.pruneCache({ maxBytes })` (inspectable via `session.content.stats()`). Running `tendril agent run` automatically pins recent `session.content` references (`attachAgentContentPinner`) under a bounded budget so mobile uploads stay recoverable after the phone goes offline.
- **LRU URL cleanup:** Use `createMediaUrlCache(session, { maxEntries: 64 })` to manage `blob:` ObjectURLs and deterministically call `URL.revokeObjectURL` on eviction or teardown.

## Peer-backed `$publications` version history, SW P2P recovery & rollbacks

The Tendriller host keeps a short rolling 3-version R2 HTTP cache for fast cold loads, while every signed release manifest stays forever in `$publications`. Connected agents and browsers seed published assets into `session.content` via `retainPublicationBlobs` (pinned by default). Call `wireServiceWorkerP2pRecovery({ runtime, session })` so the page Service Worker automatically recovers host-pruned (`404`/`410`) publication assets from connected peers with SHA-256 verification, or recover manually with `tendril publication-recover <rev> [dir]` and roll back cleanly via a signed `$publications` `rollback` operation.

## Verify

1. Store a private encrypted attachment on Peer A via `putMedia`, pass only the compact `MediaRef` to Peer B, and verify Peer B lazily pulls the verified bytes over `session.content` without touching host R2 storage.
2. Upload identical bytes twice with `deduplicate: true` and verify matching content identifiers.
3. Publish multiple `$publications` revisions, verify `publication-history` lists every release, and execute a signed `rollback` operation.
