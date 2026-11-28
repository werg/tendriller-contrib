# Contribute reasoning that another implementation can use

The canonical entry is `cookbooks/<stable-id>/COOKBOOK.md`. Only the stable ID,
title, and one-sentence summary are required. The frontmatter parser accepts
readable top-level string values and string arrays; use JSON quoting for punctuation
or arrays with complex values. This is deliberately not a general YAML execution
or configuration system. No aliases, executable tags, nested schema, or install graph
is needed.

```yaml
---
id: useful-outcome
title: A useful outcome
summary: Explain when this approach helps and what must be decided.
tags: [evidence, review]
---
```

Optional metadata includes `group`, `tags`, `choices` (two or three consequential
decisions), `capabilities`, `related` (cookbook IDs), `sources` (exact historical
revision URLs), and `evidence`. Keep authoritative descriptions here; the reading
catalog, gallery, agent summaries, README index, and prompts are generated from it.

## Write for adaptation

Explain applicability and when a simpler approach wins. Compare alternatives with
reasons, then offer a practical adaptable plan. Distinguish platform invariants,
conditional requirements, and example choices. Include failure scenarios with
expected observations. Those questions matter; a rigid heading template does not.

Put explanation before snippets. State a snippet's inputs, outputs, units,
assumptions, lifecycle, and failure behavior. Keep large derivations or selected
verification specimens in linked `notes/`, `snippets/`, or `checks/` folders when useful.
These folders organize content; they do not prescribe the reader's application.

A larger specimen should exercise a decision or guarantee, not become the default
page download. Do not export a stable mount API, add a global component namespace,
or require a universal data model. For pilots and difficult architectural patterns,
show two meaningfully different layouts with shared semantic checks.

## Develop the whole user experience

Anchor a guide in a recognizable task and follow the person from first use through
completion, correction, and a later return. Describe what the person sees, what
they can do next, and which result confirms progress. Distinguish an empty state,
an unsent draft, pending work, a confirmed result, and unavailable or stale data
where those states change the task. A successful transport request alone is not
a useful completion message.

Offer a focused first version and explain which richer features earn their cost.
Use concrete choices such as single-item versus batch review, intentional versus
automatic advancement, or local versus shared preferences. Describe keyboard and
non-sensor alternatives, error correction, and the limits of undo when relevant.
Follow data through capture, review, storage, sharing, export, and removal only as
far as the particular task requires; keep authority at the actual service boundary.

Verification scenarios should name the starting condition, the action or failure,
and the observable result. Proposed scenarios remain a plan until exercised and
recorded under the evidence guidance. A fuller guide need not add executable code,
prescribe a screen layout, or claim features that core does not supply.

## Improve core when a cookbook exposes a platform gap

Treat difficult adaptations as feedback on Tendriller itself. If several tasks
need the same durable command queue, atomic state check, cancellation boundary,
or recovery guarantee, implement the general primitive in `werg/tendriller` and
update the recipes to use it. Do not preserve the current unreleased architecture
by teaching every page to repair the same limitation.

Separate that primitive from domain policy. Core can make a conditional state
change atomic; the application still decides which transition is appropriate,
and its trusted boundary enforces any additional authorization. Core can retain
one timer command across retries; the task still decides when a reminder helps.
When the distinction is unclear, use the concrete user journey and failure case
to choose the smallest coherent abstraction, including a revised existing API.

Coordinate the core and contrib changes through linked pull requests. Verify the
contract, all affected callers, and the actual authority boundary before citing
the new guarantee. Pin explanatory references to the tested core commit and keep
the cookbook's evidence label scoped to the adaptation actually exercised. Real
browser or external-service limits should remain explicit; they are different
from platform gaps we can fix.

## Stay inside the current platform contract

A guide teaches one protocol. Application order is the signed author timestamp,
signing key and stable `opId`; no coordinator, selected history, generation,
recovery transition, migration path or compatibility reader exists to describe.
Name the four independent facts (stored, materialized and revisable, peer-retained,
finalized) rather than "saved" or "synced", treat `open` as the default `$admission`
history policy, and describe schema, `$seals`, and `$admission` changes as ordinary
authorized transactions. Explain that a late earlier operation can revise outcomes and that
a sealed admission frontier can exclude late-delivered original intent without
retimestamping it. Preserve operation ID, author time and signed bytes on retry.
One account-level agent (one credential and signing key) maintains many granted
pages; its optional program carries control traffic only. `npm run check` rejects
retired API names only in the peer-application specimens; keep all prose equally current.

## Review and maintain

Compare the new decision with existing guides and consolidate repeated reasoning.
Preserve source attribution and qualify empirical claims. Record failed adaptations
when they explain an important assumption. Use the smallest meaningful check:
metadata/links for prose, numerical cases for algorithms, browser interactions for
UI continuity, and the actual host for authorization or transactions.

Run `npm run build` after editing metadata, then `npm run check`. Generated files
must match the source. See [evidence](evidence.md) before changing a label. No new
license is granted by contributing to an unlicensed source; see
[provenance and terms](../PROVENANCE.md).
