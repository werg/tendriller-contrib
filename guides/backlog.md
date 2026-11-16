# Curate new knowledge from actual adaptations

The collection now includes complete user journeys, standard application decisions,
and [application briefs](use-cases.md) that connect them. An explained design is a
useful starting point; the next improvement should reveal what happened when a
person adapted it. Avoid creating a second lightly differentiated guide for the
same decision or relabeling a proposed scenario as an observed result.

The next useful evidence should come from real adaptations:

| Published direction | Evidence needed next |
| --- | --- |
| [What-if scenarios](../cookbooks/explore-what-if-scenarios/COOKBOOK.md) and [comparison](../cookbooks/compare-options/COOKBOOK.md) | Two unrelated tasks with declared assumptions, known reference cases, and sensitivity checks; document when a score or model made the choice less clear. |
| [Accessible interactions](../cookbooks/complete-accessible-interactions/COOKBOOK.md), [forms](../cookbooks/build-correctable-forms/COOKBOOK.md), and [localization](../cookbooks/localize-an-interaction/COOKBOOK.md) | Complete tasks, including errors and return visits, with representative input methods, assistive technology, language, and locale needs. |
| [Offline work](../cookbooks/work-offline-and-reconnect/COOKBOOK.md) and [portable recovery](../cookbooks/export-and-restore-work/COOKBOOK.md) | Actual saved-publication cold starts, storage pressure, partial evidence, and interrupted restore in the stated browser and authority context. |
| [Shared reservations](../cookbooks/schedule-shared-resources/COOKBOOK.md), [handoffs](../cookbooks/hand-off-responsibility/COOKBOOK.md), and [batch actions](../cookbooks/run-reviewed-batch-actions/COOKBOOK.md) | Core's conditional `state.apply` batches exercised with competing actors, lost replies, and reloads. Separately verify required permission and business policies at their trusted boundary, and uncertain external outcomes at the service that owns them. |
| [Field inspections](../cookbooks/document-a-field-inspection/COOKBOOK.md) and [evidence review](../cookbooks/capture-reviewed-evidence/COOKBOOK.md) | A real correction, conflicting source, or inaccessible capture path that changes the workflow; preserve the observation and rejected alternative. |
| [Routines](../cookbooks/track-habits-and-routines/COOKBOOK.md) and [practice](../cookbooks/guide-practice-and-feedback/COOKBOOK.md) | Return visits, missed observations, corrections, changing goals, and whether feedback helps people act without overstating progress. |
| [Application structure](../cookbooks/publish-smallest-page/COOKBOOK.md) and [coherent updates](../cookbooks/publish-coherent-updates/COOKBOOK.md) | Different implementations showing when one file, modules, nested pages, or a framework improves maintainability and preserves active work. |

Rank contributions by repeated decision cost, evidence available, usefulness across
tasks, and maintenance burden. A failed adaptation that explains an assumption can
be more useful than another polished default screen. These are editorial candidates,
not deferred required platform mechanisms or promises to add software features.
