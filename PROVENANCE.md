# Source provenance

This repository extracts optional code from [werg/tendriller](https://github.com/werg/tendriller) at commit `7f2dd1035bb075c0637f625316b7ae7f77c1099a` (merged PR #8, 2026-11-15).

`distribution/source-map.json` records the original path of each extracted file and its new owner. The original repository history remains intact. Changes here redesign the pre-release contract and do not provide compatibility with earlier prototypes.

The upstream repository did not include a project license file at this commit. This extraction does not assign a new license. Third-party packages retain their own licenses; distribution builds copy license notices beside bundled dependencies and embed the notices of every bundled third-party package in standalone scripts.

Maintainer: [werg](https://github.com/werg). Core requirements are declared in `core.lock.json` and each artifact manifest. Experimental perception adapters require an explicitly declared local engine asset set and are excluded from the default catalog.
