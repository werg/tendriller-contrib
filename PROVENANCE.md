# Source provenance and reuse terms

This collection extracts reusable reasoning from
[werg/tendriller-contrib at 6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce](https://github.com/werg/tendriller-contrib/tree/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce)
and the source revisions named in each cookbook. The original optional-code
extraction came from [werg/tendriller at 7f2dd1035bb075c0637f625316b7ae7f77c1099a](https://github.com/werg/tendriller/tree/7f2dd1035bb075c0637f625316b7ae7f77c1099a).

The [complete conversion inventory](guides/source-inventory.json) records a target
responsibility or deletion decision for every tracked file in the contrib baseline.
The generated [source map](distribution/source-map.json) records only the origins
that the current cookbooks actually cite. Historical links are evidence, not
supported products or an obligation to preserve old APIs and state.

## What is retained

The prose preserves design decisions, algorithm semantics, failure cases, and
relevant assumptions. New small algorithm snippets and verification specimens
identify their source reasoning in their guide. They are application-owned examples
when copied and adapted; they do not create a stable UI export or dependency graph.
Operational tools and their retained third-party notices belong to core. Retired
vendored UI libraries and screenshots are not redistributed by this collection.

## Terms

The source repository did not include a project license granting broad reuse at
the reviewed extraction. This work does not invent or assign one. Copyright and
existing source terms remain with their holders; references to historical source do
not grant additional rights. Any deliberately selected third-party dependency keeps
its own license and required notices. A maintainer license decision is still needed
before advertising new broad reuse rights.

Maintainer: [werg](https://github.com/werg). Evidence labels describe actual review
or checks, not a license grant or a promise of device support.
