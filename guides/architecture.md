# A collection of adaptable cookbooks

The maintainer's 16 November 2026 design replaces the unreleased component and
starter catalog with reusable reasoning. This is a direct replacement with no
compatibility APIs, old-format readers, state migration, or legacy fixture support.

The canonical contribution is `cookbooks/<stable-id>/COOKBOOK.md`. Only `id`,
`title`, and `summary` are required metadata. A guide explains applicability,
consequential choices, an adaptable implementation plan, required guarantees,
and concrete verification scenarios. Related guides are reading links, never an
installation graph. Copying a snippet makes it application-owned source.

Contrib owns prose, small examples, deliberate trusted reference implementations,
editorial generation, and adaptation checks. Core owns the browser/service
contract and optional CLI, preview, host bridges, and collector software. The
default core has no application workflow installed and depends on no contrib
release. Checks may consume public core artifacts in one direction.

Extract useful knowledge from every component, recipe, example, and operational
guide before removing obsolete product surfaces. Three pilots—live measurements,
reviewed capture, and private facilitation—must transfer their guarantees to
different application layouts. Metadata, reading catalog, gallery, prompts,
README, archives, and CI must describe the same target collection.

Publication integrity describes actual authored bytes; provenance is advisory
history, not a requirement to preserve source-byte equality. Keep attribution
and third-party notices. Existing source terms are unchanged; do not infer or
grant a new license.

Implementation is checkpointed in small commits and coordinated with
`werg/tendriller`.
