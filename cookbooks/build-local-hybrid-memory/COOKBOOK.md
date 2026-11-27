---
id: "build-local-hybrid-memory"
title: "Build local-first encrypted AI memory and hybrid search"
summary: "Combine chronolog-db FTS5 full-text search, sqlite-vec vector similarity, and write RLS inside Merkle-paged CAS for zero-infrastructure offline semantic search."
group: "Make sense of information"
tags: ["search", "memory", "sqlite-vec", "fts5", "ai", "sql"]
choices: ["Deterministic local embeddings vs agent-supplied external vectors", "Hybrid RRF fusion vs keyword-only or semantic-only ranking", "Author-owned RLS vs shared collaborative memory grants"]
capabilities: []
evidence: "explained"
related: ["search-and-filter-collections", "choose-data-model", "run-a-peer-application"]
sources: ["https://github.com/werg/tendriller/blob/7b963a6085d8e5c57054f3045b2540328336420d/docs/STATE_MODELS.md"]
---

# Build local-first encrypted AI memory and hybrid search

With Chronolog's `chronolog-db` (`sqlite-cas.wasm` compiled with both **FTS5** and **`sqlite-vec`**), an application or AI assistant does not need a hosted vector database or separate search cluster. Full-text indexes (`CREATE VIRTUAL TABLE ... USING fts5(...)`) and vector indexes (`CREATE VIRTUAL TABLE ... USING vec0(embedding float[D])`) live inside the exact same encrypted, 4 KiB Merkle-paged CAS database that syncs peer-to-peer across browsers, local agents, and opt-in Hosted MCP.

## Choose an embedding strategy honestly

1. **Deterministic local hashing embeddings (`embedTextLocal`):** The starter helper `shared/helpers/hybrid-memory.mjs` produces L2-normalized word-token + character-trigram vectors with zero external APIs, zero model downloads, and bit-exact determinism across browsers, Node, and Cloudflare Workers.
2. **Agent or local-model enrichment (`upsertEmbedding`):** When higher-precision semantic recall matters, let a local agent (Ollama, OpenAI, or browser WebGPU model) compute semantic vectors and write them back via a normal signed transaction. Keep the `embed_model` column visible so people know which notes are locally indexed vs model-enriched.

## Keep FTS5, `sqlite-vec`, and base tables atomic

Always update `memories`, `memories_fts`, and `memories_vec` in the same `chronolog/sql` transaction so an interrupted write or late-arriving operation never leaves stale search entries behind. Assign a deterministic `row_seq` column to join `vec0`'s integer `rowid` back to your stable string `id`, and delete any prior `memories_vec` row before inserting on upsert.

## Fuse rankings with Reciprocal Rank Fusion (RRF)

Combine BM25 lexical hits (`bm25(memories_fts)`) and `sqlite-vec` nearest-neighbor distances with RRF (`1 / (60 + lexRank) + 1 / (60 + vecRank)`). Quote user search tokens safely before passing them to `MATCH` so punctuation or operators never throw SQLite syntax errors, and offer an explicit mode selector (**Hybrid**, **Keyword**, **Semantic**) so users can inspect why a result matched.

## Protect memory integrity with `chronolog/rls`

Install Postgres-style write RLS triggers (`NEW.author = actor()`, `OLD.author = actor() OR EXISTS (SELECT 1 FROM memory_grants WHERE grantee = actor())`) so every contributor or specialist agent can add memories without overwriting someone else's notes unless explicitly granted.

## Verify

1. Initialize the `knowledge` starter template and insert several notes offline.
2. Verify hybrid, keyword-only, and semantic-only queries return deterministic rankings, and that punctuation-heavy queries (`c++: "foo-bar"*`) never error.
3. Have a second non-granted writer attempt to edit or delete the first author's memory and confirm `rls_denied:memories:update` / `rls_denied:memories:delete`.
4. Replay the same operations in out-of-order author-time sequence across two independent peers and verify identical `dbRoot` hashes.
