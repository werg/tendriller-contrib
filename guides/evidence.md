# Evidence is a claim with a boundary

| Label | What it establishes | What it does not establish |
| --- | --- | --- |
| Explained | The decision guide and cited source reasoning have been reviewed. | Execution, real-device accuracy, or a tested deployment. |
| Exercised | Named deterministic, browser, or host scenarios passed against recorded artifacts. | Every browser/device or an unrelated application policy. |
| Used | A real adaptation informed a documented revision. | General success outside its recorded conditions. |

A guide without an evidence field is indexed as “not recorded.” Only ID, title, and
summary are mandatory metadata. Do not promote a source review to exercised, or a
fixture screenshot to live privacy/transaction evidence.

An exercised guide can also describe new, unexercised feature choices. Identify
those additions as proposed adaptations and keep the recorded scenarios attached
to their exact artifacts. Expanding the prose does not expand the evidence scope.
Historical guide counts and test results describe their recorded source snapshot;
use a fresh check to report the current collection.

For executable checks, record the command, exact public core artifact identity or
revision, scenario scope, observed outcome, and known limits. A tested pairing is
one reproducible observation, not a synchronized release requirement for prose.
See [capability validation](validation.md) for separating local fixture checks from
hosted authority checks.

Proposed algorithms must be identified as proposals. Example constants carry their
assumptions and should be reconsidered for a new task. External host features and
browser support can change; verify the actual environment before claiming them.

Evidence should guide maintenance: revise a stale claim, expand a failed scenario,
consolidate duplicate entries, or retire an approach whose assumptions no longer hold.
