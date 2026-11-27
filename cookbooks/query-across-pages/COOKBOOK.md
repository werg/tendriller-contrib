---
id: "query-across-pages"
title: "Federate queries across multiple pages from Hosted MCP or a local agent"
summary: "Introspect live chronolog-db schemas and run parallel read-only SQL or declared queries across several pages with strict per-page capability isolation."
group: "Coordinate people and tools"
tags: ["mcp", "multi-page", "federation", "sql", "agents"]
choices: ["Hosted MCP query_multiple_applications vs local workspace queryMultipleSessions", "Live schema introspection via describe_application vs hardcoded query assumptions", "Per-page error isolation without hiding missing pages"]
capabilities: []
evidence: "explained"
related: ["connect-chatgpt", "coordinate-participants", "build-local-hybrid-memory"]
sources: ["https://github.com/werg/tendriller/blob/7b963a6085d8e5c57054f3045b2540328336420d/docs/MULTI_PAGE_AGENTS.md"]
---

# Federate queries across multiple pages from Hosted MCP or a local agent

Users naturally keep separate Tendriller pages for separate privacy boundaries (for example, a personal knowledge base, a family kitchen list, and a team project tracker). With Chronolog's RAM-only Hosted MCP engine and multi-page local workspaces, an assistant can inspect live `chronolog-db` schemas and fan out read-only queries across up to 8 pages in parallel while keeping each page's encryption keys, membership, and read permissions strictly isolated.

## Inspect live schemas before querying

Call `describe_application` on an opted-in page first. Because Hosted MCP hydrates directly from `$reducers` with static QuickJS-NG + `sqlite-cas.wasm`, `describe_application` returns:
- Live non-control `$reducers` topic bindings (including recently hot-added topics),
- Automatic `sqlSchemas` (`tables`, `columns`, `policies`, `schemaVersion`) for every `chronolog/sql` topic, and
- `permissionsSummary` (`openReaders`, `openWriters`, `memberCount`).

## Fan out read-only queries safely

- **Hosted MCP (`/mcp`):** Call `query_multiple_applications` with up to 8 `{ applicationId, sql?, query?, input?, topic? }` targets belonging to the same OAuth grant, or call `query_sql` (and `/v1/apps/:appId/sql`) for a single page. Every SQL query executes under SQLite's `readonly` authorizer and respects per-page `caps.read` settings.
- **Local workspace agent:** Use `queryMultipleSessions` (`shared/helpers/multi-page.mjs`) to attach to several granted pages concurrently and merge results with explicit per-page revision digests and isolated errors.

## Keep failures and privacy boundaries visible

Never merge cross-page rows silently without labeling which page each result came from, and never suppress a page that failed to load or lacked read permission (`ok: false`). Writing cross-page aggregates back into a target page always remains an explicit, reviewed signed operation on the destination page.

## Verify

1. Opt two pages into Hosted MCP under one OAuth grant and call `describe_application`—verify `sqlSchemas` lists live tables and columns directly from `$reducers`.
2. Call `query_sql` with a `SELECT` (succeeds) and with an `INSERT`/`DROP TABLE` (rejected with `sql_read_only`).
3. Call `query_multiple_applications` targeting both opted-in pages plus one unauthorized `applicationId`—verify the two authorized pages succeed in parallel while the unauthorized target fails cleanly in isolation.
