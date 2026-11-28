---
id: "remix-and-snapshot-apps"
title: "Export portable app blueprints, remix pages, and schedule optional history admission"
summary: "Clone a page's code, hash-pinned $reducers, $seals templates, and SQL schema into a fresh isolated encrypted log with zero private data copied, and opt into $admission history policies when needed."
group: "Keep work dependable"
tags: ["blueprint", "remix", "fork", "finality", "admission", "snapshots"]
choices: ["Portable PageBlueprint export vs one-click host Remix", "Copying schema DDL + RLS rules without copying private rows", "Keeping open admission vs scheduling signed-frontier, threshold-quorum, or member-quorum admission"]
capabilities: []
evidence: "explained"
related: ["export-and-restore-work", "guide-explicit-checkpoints", "publish-coherent-updates", "combine-crdt-and-finality"]
sources: ["https://github.com/werg/tendriller/blob/7b963a6085d8e5c57054f3045b2540328336420d/docs/AUTHORITY_AND_PUBLICATIONS.md"]
---

# Export portable app blueprints, remix pages, and schedule optional history admission

Because every Chronolog app is defined by hash-pinned ES Modules in `$reducers`, declarative SQL DDL + write-RLS policies in `chronolog-db`, `$admission` / `$seals` structure, and content-addressed UI files in `$publications`, any page can be packaged as a **secret-free `PageBlueprint`** (`tendriller-page-blueprint/v1`) or forked with one click into a brand-new, completely isolated encrypted log.

## Separate application structure from private user data

A `PageBlueprint` (`@tendriller/core/blueprint`) and the host's one-click **Remix** (`POST /dashboard/t/:id/remix`) strictly preserve the privacy boundary:
- **Copied:** `$reducers` bindings + public CAS module bytes (verified by SHA-256), `sqlite_master` DDL + write-RLS policies (when requested), `$admission` / `$seals` structural templates, and current public `$publications` files (with `configuration.json` rewritten to the fresh `applicationId` and `page_url`).
- **Never copied:** table rows, Private Capability Vault keys, encrypted operation envelopes, public operation logs or mailbox state, epoch keys, device signing keys, invite links, or agent grants.

Every remixed page starts with a brand-new random `salt`, `logId`, and epoch 0 key generated locally on the remixer's device.

## Make optional `$admission` history policies explicit and honest

Ordinary offline-first Tendriller pages default to `open` history admission so disconnected devices never lose valid offline work. High-assurance apps (ledgers, shared approvals, auditable publications) can opt into `signed-frontier`, `threshold-quorum`, `member-quorum`, `optimistic-challenge`, `merkle-anchor`, or `pinned-checkpoint` admission at any time via `$admission` (`tendril admission schedule` or `shared/helpers/finality-view.mjs`). Always require explicit user consent before scheduling or closing a frontier, explaining that genuinely offline operations first delivered behind a sealed frontier may be excluded while remaining inspectable.

## Verify

1. Export a `PageBlueprint` from a populated SQL + custom-reducer session and verify the JSON contains exact reducer modules, table DDL, and RLS rules—and zero private rows, vaults, or keys.
2. Instantiate a fresh log via `createGenesisFromBlueprint` and confirm it has a distinct `logId` and `epoch0Key`, applies `initialMigrations`, and accepts fresh operations.
3. Trigger `POST /dashboard/t/:id/remix` on an owned page and an `open_readers` public page, verifying `configuration.json` targets the new page ID and zero envelopes/links/grants are copied; confirm a non-owner cannot remix another user's private page (`403`).
4. Schedule `signed-frontier` admission via CLI `admission schedule` and verify `$admission.schedule` transitions monotonically from `open` to `signed-frontier`.
