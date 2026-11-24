---
id: "search-and-filter-collections"
title: "Search and filter a growing collection"
summary: "Make query scope, filtering, ordering, and selection understandable as results grow, change, or become unavailable."
group: "Design everyday interactions"
tags: ["search", "collections", "navigation"]
choices: ["Local filtering or an authorized indexed query", "Stable ordering and snapshot versus live results", "Visible-page selection versus every matching record"]
capabilities: []
evidence: "explained"
related: ["reconcile-concurrent-edits", "separate-evidence-interpretation", "triage-incoming-work"]
sources: ["https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/STREAMS.md"]
---

# Search and filter a growing collection

Use this when a person needs to find, inspect, and act on items in a growing notebook, inventory, task list, or evidence collection. The result should make it clear what was searched, why items match, and what an action will affect. For a dozen stable items, a simple text filter may be enough. A dedicated index, query language, and saved-view system add maintenance cost and should solve a real retrieval problem.

Consider an inspection notebook with observations from several sites. The user wants unresolved temperature findings from the current month, then wants to inspect one and return to the same place in the results. A search box without scope, stable ordering, or preserved navigation will make that ordinary journey frustrating.

## Design the find-and-return journey

1. **Start with a useful view.** Show a named scope such as “Current inspection” or “All retained observations I can access,” a default order, and the relevant freshness or coverage limit.
2. **Express a query.** Offer a clear text field and a small number of meaningful filters. Use explicit labels for date ranges, statuses, and source types rather than an unexplained row of icons.
3. **Run and explain.** Show loading separately from an empty result. Keep the last result visible with a stale indicator if that helps continuity, without presenting it as the answer to the new query.
4. **Inspect.** Display identifying context, the matching field or excerpt where useful, and a route to the exact record. Treat all excerpts as untrusted text.
5. **Return.** Restore the query, filters, order, page/cursor, and useful scroll anchor. If the record has disappeared, explain why the old location cannot be restored exactly.
6. **Select and act.** Name the selection scope before a bulk action. Review consequential mutations against current authorized records.
7. **Save or share a view.** Save query semantics and display preferences, not an accidental promise that today's result set is permanent. Check authority again when another person opens it.

The same query can have a compact stacked phone layout and a wide table with several sortable columns. Keep semantics consistent without imposing the same visual density.

## Define query meaning before adding controls

| Choice | A simple starting policy | Alternative and consequence |
| --- | --- | --- |
| Text matching | Case-insensitive text matching over named fields. | Tokenization, accents, stemming, fuzzy matching, or semantic retrieval require their own explanation and evaluation. |
| Multiple filters | AND between categories; a declared rule within a multi-select category. | OR can broaden results unexpectedly unless the interface makes it visible. |
| Date range | Clearly named field and explicit inclusive/exclusive boundary. | Acquisition and upload dates answer different questions. |
| Default order | Relevant date plus a stable ID tie-breaker. | Relevance ranking needs a reproducible explanation and can change as an index changes. |
| Unknown values | A separate “Not recorded” option. | Treating unknown as false or zero can hide relevant records. |
| Live updates | Freeze the inspected result set and offer a refresh notice. | Live insertion is useful for monitoring but can move targets during interaction. |

Show active filters as removable controls and offer a reliable “Clear filters.” A “No results” state should distinguish a restrictive query, no data in scope, unavailable data, and a failed search. Suggest removing a filter or checking scope without silently broadening the search.

Do not imply that a partial local cache is a complete search index. If only recent retained records are loaded, state that coverage and provide an explicit way to request more where supported. The [selected application history and retained coverage](../../guides/application-primitives.md) can have gaps after retention or recovery; an empty local filter is not proof that an event never existed.

## Choose where the search runs

Local filtering works for a bounded authorized dataset and can remain responsive offline. It must disclose its coverage and avoid retaining data longer than the access policy permits. A server-side index helps larger collections and consistent pagination, but the application must implement or select it deliberately. Core streams and shared state do not automatically supply an arbitrary full-text or vector search service.

An indexed query must enforce authorization before returning matches, snippets, counts, or suggestions. Hiding forbidden rows after retrieval can still leak titles or totals. Query logs and saved searches can themselves contain sensitive text; decide whether they are recorded and who can read them.

Keep query state separate from domain records. Assign each asynchronous query an identity or generation so a slow response to an old query cannot replace the newest result. Cancellation can save work where the transport supports it, but ignoring stale results remains necessary. A cleared query should not be repopulated by a delayed success or error from the previous search.

## Keep ordering, paging, and selection stable

Use a deterministic tie-breaker when values are equal. Offset pages over a changing collection can repeat or skip rows; a snapshot or a server-supported cursor can provide better continuity. A cursor is meaningful only under the query, ordering, and authorization context that produced it. Do not reuse it after changing filters or assume a stream delivery cursor is an arbitrary search cursor.

For live results, consider a “New items available” banner that lets the person choose when to reflow the list. If automatic updates are necessary, preserve the selected record and focus by stable ID. A remote update should not cause a different row to occupy an imminent action target unnoticed.

Selection needs explicit scope: one item, checked visible items, all loaded items, or every match in an authorized query. “Select all” should state which. A bulk action against a live query can affect records added after selection; use an explicit reviewed set or server-side snapshot semantics where required. Display the count and meaningful exclusions before acting. Revalidate authority and revisions for mutations; a search result is not permission to modify it.

## Give companion views the same selection state

For a map beside a list, compute the route and filtered records once and render
both from those values. A map selection goes through the same navigation function
as a list selection; rendering either view must not write a second selection
store. Preserve the distinction between selected record and visible results
when filtering hides the selected item.

The core starter's list/detail is application-owned source. Adapt its existing
URL render/navigation path, or compose `mountInspector` with your own list and
route controller. Do not scrape private DOM nodes or add another backend query
to discover the active filter. One map does not require shared `onChange`,
`select`, placeholder or subscription APIs. Use the
[composition guidance](https://github.com/werg/tendriller/blob/master/docs/APP_PATTERNS.md#compose-a-map-or-another-companion-view)
and preserve unrelated URL parameters and independent `routeKey` instances.

Exercise deep links, Back/Forward and a fresh live snapshot at desktop and phone
widths. A long title must wrap without squeezing the Back control into multiple
lines, and a background refresh must not move focus out of the active editor.

## Add features that reduce retrieval effort

Saved views help repeated work; name their scope, filters, and ordering and provide edit/delete controls. A pinned view is not a frozen report. If sharing a view by URL, avoid embedding private text or credentials and verify that the receiving identity sees only its authorized scope.

Recent searches can be useful on a personal device but inappropriate on a shared kiosk. Highlighting matches helps scanning, provided exact source text remains available and markup is escaped. Keyboard users should be able to search, move through results, open an item, and return without losing context. Announce the settled result count sparingly instead of on every keystroke, and avoid moving focus when results arrive.

Export should name whether it contains selected items, loaded items, or the full query result and include query/time coverage. A displayed count is not proof that an export includes every record, especially when pagination or retention applies.

## Verify retrieval and action scope

| Scenario | Expected observation |
| --- | --- |
| A slow old query finishes after a newer one. | It cannot replace current results or current error state. |
| Filters produce no matches, while the backend is healthy. | The page explains active scope and offers deliberate recovery without changing the query silently. |
| Search fails or local history is incomplete. | Unavailability/coverage is distinct from “nothing exists.” |
| Equal sort values and concurrent insertions span pages. | The declared ordering/pagination policy prevents unexplained duplicates or omissions. |
| A selected record changes so it no longer matches. | Selection remains attributable and the page explains its changed visibility. |
| Select all, then new records arrive. | The action scope matches the reviewed selection policy, not an accidental larger set. |
| A role is revoked while a search is pending. | Late results, counts, and suggestions do not reveal forbidden data. |
| Open an item and return using a keyboard or narrow layout. | Query and useful position survive, with focus on a meaningful destination. |

This guide is explained design reasoning. Evaluate any chosen search algorithm against representative queries and verify authorization at the actual search boundary before claiming complete or private retrieval.
