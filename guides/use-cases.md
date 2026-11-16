# Choose a complete application journey

Start with the result a person needs, then read the few cookbooks that resolve the
hard decisions. These routes are application briefs: they connect a first useful
experience to richer features and a meaningful failure rehearsal. They are reading
choices, not installation bundles, required dependencies, or promises that a service
has an optional capability enabled.

For every route, inspect the existing page and the current
[public core contract](https://github.com/werg/tendriller/blob/dc3ca11c21dda979e295b53e1db0a53b6773b4bc/agent.md).
Choose a small first version, record a plausible alternative, and identify which
results require a real host or device check. Preserve the separation between a
local draft, a queued command, an accepted service result, and completed outside
work. A user-visible completion message should name the result it actually proves.

## Find a starting point

| The person wants to… | Start here | Add when the task needs it |
| --- | --- | --- |
| Submit an intake, request, or survey accurately | [Correctable forms](../cookbooks/build-correctable-forms/COOKBOOK.md) | [Accessibility](../cookbooks/complete-accessible-interactions/COOKBOOK.md), [reviewed imports](../cookbooks/import-for-review/COOKBOOK.md) |
| Finish an inspection with evidence and exceptions | [Field inspection](../cookbooks/document-a-field-inspection/COOKBOOK.md) | [Reviewed capture](../cookbooks/capture-reviewed-evidence/COOKBOOK.md), [offline work](../cookbooks/work-offline-and-reconnect/COOKBOOK.md) |
| Run a private workshop round and share a summary | [Private responses](../cookbooks/collect-private-responses/COOKBOOK.md) | [Checkpoints](../cookbooks/guide-explicit-checkpoints/COOKBOOK.md), [coordinated devices](../cookbooks/coordinate-devices/COOKBOOK.md) |
| Work through an inbox with colleagues | [Queue triage](../cookbooks/triage-incoming-work/COOKBOOK.md) | [Search and filters](../cookbooks/search-and-filter-collections/COOKBOOK.md), [responsibility handoffs](../cookbooks/hand-off-responsibility/COOKBOOK.md) |
| Write, review, and publish a shared document | [Versioned feedback](../cookbooks/write-with-versioned-feedback/COOKBOOK.md) | [Undo and revisions](../cookbooks/undo-and-revise-work/COOKBOOK.md), [exact proposal review](../cookbooks/review-exact-proposal/COOKBOOK.md) |
| Make a choice and understand what could change it | [Option comparison](../cookbooks/compare-options/COOKBOOK.md) | [What-if scenarios](../cookbooks/explore-what-if-scenarios/COOKBOOK.md), [evidence and interpretation](../cookbooks/separate-evidence-interpretation/COOKBOOK.md) |
| Reserve a room, instrument, or shared slot | [Shared resources](../cookbooks/schedule-shared-resources/COOKBOOK.md) | [Time and deadlines](../cookbooks/plan-time-and-deadlines/COOKBOOK.md), [concurrent edits](../cookbooks/reconcile-concurrent-edits/COOKBOOK.md) |
| Follow a routine or return to a learning goal | [Routines](../cookbooks/track-habits-and-routines/COOKBOOK.md) or [practice and feedback](../cookbooks/guide-practice-and-feedback/COOKBOOK.md) | [Interruption choices](../cookbooks/choose-interruptions/COOKBOOK.md), [localization](../cookbooks/localize-an-interaction/COOKBOOK.md) |
| Run a measurement and keep an honest record | [Measurement experiment](../cookbooks/run-measurement-experiment/COOKBOOK.md) | [Live measurements](../cookbooks/present-live-measurements/COOKBOOK.md), [bounded telemetry](../cookbooks/ingest-bounded-telemetry/COOKBOOK.md) |
| Notice a meaningful change without constant attention | [Change detection](../cookbooks/detect-meaningful-changes/COOKBOOK.md) | [Instrument protocols](../cookbooks/connect-instrument/COOKBOOK.md), [visual changes](../cookbooks/notice-visual-changes/COOKBOOK.md) |
| Operate a job across a phone, display, and agent | [Device coordination](../cookbooks/coordinate-devices/COOKBOOK.md) | [Long-running work](../cookbooks/observe-long-running-process/COOKBOOK.md), [resuming agents](../cookbooks/connect-resuming-agent/COOKBOOK.md) |
| Keep a private case notebook portable and recoverable | [Sensitive information](../cookbooks/manage-sensitive-data/COOKBOOK.md) | [Data ownership](../cookbooks/choose-data-model/COOKBOOK.md), [export and restore](../cookbooks/export-and-restore-work/COOKBOOK.md) |
| Review and apply a change to many items | [Reviewed batch actions](../cookbooks/run-reviewed-batch-actions/COOKBOOK.md) | [Exact proposal review](../cookbooks/review-exact-proposal/COOKBOOK.md), [outdated-work recovery](../cookbooks/recover-outdated-work/COOKBOOK.md) |
| Start with a small page that can grow without losing work | [Smallest useful page](../cookbooks/publish-smallest-page/COOKBOOK.md) | [Adaptive interfaces](../cookbooks/adapt-without-losing-work/COOKBOOK.md), [coherent publication](../cookbooks/publish-coherent-updates/COOKBOOK.md) |

## 1. An intake that ends in a useful receipt

Imagine a repair request with contact details, a problem description, and optional
photos. Begin with labeled fields, a visible draft, a review screen, and a receipt
that identifies the submitted version. Show which fields need correction and keep
the person's text when submission fails. A short ordinary form is preferable to a
wizard when the questions are few and understandable together.

Add conditional questions only when earlier answers change what is needed; explain
what happens to answers when a branch disappears. An imported spreadsheet needs a
mapping preview and row-level correction. Save the submitted snapshot separately
from typing begun while it is pending. Rehearse a late rejection, an attachment
failure, and keyboard-only correction: each must leave a clear next action and an
accurate indication of what has reached the recipient.

## 2. A field inspection with a defensible closeout

A site walk starts with the correct asset, checklist revision, and inspection ID.
The inspector records observations, marks exceptions, takes only useful evidence,
and reviews a completion report. Make **not inspected**, **not applicable**, and
**passed** different observations. A sensor reading or uploaded photograph must not
silently complete a human checkpoint.

Begin with manual observations and a few reviewed photos. Add annotations, route
progress, or voice notes only when they improve the actual field task. Keep evidence
attached to its original location or item even if the checklist is reordered.
Rehearse loss of connectivity midway, a replaced image, and an unresolved exception
at closeout. The report should identify missing evidence and pending uploads, and
the person should be able to save or recover local work within the stated storage
limits. An accepted upload alone is not a signed-off inspection.

## 3. A private workshop with a deliberate public result

Use three distinct experiences: participants answer privately, a facilitator reviews
the round, and a display presents only a released aggregate. Start with a single
text prompt and a clear submission receipt. Let participants distinguish their
current draft from the answer the facilitator can actually see.

Add rounds, assignments, corrections, and larger displays when needed. Decide in
advance how late answers and small groups affect the meaning and privacy of a
summary. A named role in page state is not authorization: the selected trusted
policy must enforce the private projections. Rehearse two facilitators attempting
to publish different versions and a participant returning after access changes.
The released view should have an exact reviewed version, and hidden private text
must never enter shared state or an unreviewed export.

## 4. An inbox that supports follow-through

A maintenance team receives reports, identifies duplicates, assigns responsibility,
and follows each report to a meaningful resolution. Start with a stable item list,
an inspectable detail view, and explicit **unassigned**, **claimed**, **blocked**,
and **resolved** states. Sorting a row or hiding it with a filter must not change
its ownership or completion.

Add saved views, bulk classification, snoozing, and escalation only with clear
semantics. Keep an offered transfer separate from the next person's acceptance;
someone remains responsible while it is unresolved. Rehearse concurrent claims,
an item changing while selected, and a snoozed item becoming due. The UI should
explain a lost claim, retain the operator's draft, and make deferred work findable.
A shared editable list is enough if the team does not need an authoritative claim
or scheduling policy; do not imply it supplies those guarantees automatically.

## 5. A document that can survive review

A project brief moves from a private draft to a reviewable revision and then to a
deliberately published version. Begin with an editable draft, a saved-revision
indicator, and comments bound to the text or revision they actually reviewed.
Distinguish a proposed change from an accepted change and an accepted change from
publication.

Add side-by-side revision comparison, suggested edits, reviewer resolution, and
structured approval when those decisions matter. If a passage disappears, show
its comment as orphaned or needing reassociation instead of attaching it to
unrelated new text. Rehearse a reviewer acting on an old revision, overlapping
edits, and an undo after another person's change. Preserve the historical review
and let the author choose a new explicit revision; never silently overwrite later
work to make the older proposal fit.

## 6. A decision with visible assumptions

For an equipment or venue choice, first identify hard requirements, preferences,
units, and evidence dates. Start with a compact comparison and a recorded rationale.
Unknown price or availability is an unknown, not a zero. Save the decision's
evidence and assumptions so a later reader can understand it.

Add scenario exploration when a changing attendance count, budget, or usage rate
could overturn the choice. Keep a named baseline, constrain inputs to meaningful
ranges, and show where a result is sensitive. A narrative comparison is preferable
when qualitative judgment dominates. Rehearse a missing critical value, a conflict
between sources, and a model revision after a decision. The old result stays
reproducible, the new evidence is visible, and the page can honestly conclude that
more information is needed rather than always naming a winner.

## 7. A reservation with an authoritative answer

A shared instrument or meeting room needs an availability view, an exact requested
interval, and a confirmation that identifies the resource and applicable time zone.
Begin with one resource and simple capacity. Label browsing availability as a view
of current information, not a guaranteed reservation.

Add tentative holds, repeat bookings, waitlists, or capacity pools only after
choosing an authoritative policy for each. A single server-side decision must
enforce conflicts; two browsers checking a shared list cannot establish exclusive
ownership. Rehearse simultaneous requests, a hold expiring during review, a lost
confirmation reply, and a daylight-saving transition. The person sees a confirmed,
rejected, or uncertain outcome and can reconcile the original intent. Cancellation
or moving a booking needs its own receipt and must not secretly create two active
reservations.

## 8. A routine or learning loop that welcomes a return

For a recurring administrative routine, start with an intention, today's explicit
observation, and a modest history. For learning, start with an attempt, useful
feedback, and a chance to try again. Choose the appropriate guide rather than
forcing practice quality and task completion into the same success metric.

Add hints, reflections, skips, corrected observations, and reminders with a clear
purpose. Preserve the distinction between **not recorded**, **skipped**, and
**completed**. Explain the day boundary and what travel or a changed time zone
does to the record. Rehearse a missed week, a duplicate observation, a changed
exercise, and disabled notifications. The person should be able to resume without
invented failures or misleading mastery claims. The reminder record must distinguish
scheduled work, delivery attempts, and what the person actually acknowledged.

## 9. An experiment with a useful final record

For a small bench experiment, name the question, source, units, calibration, run,
sampling budget, and stopping rule before collecting. Start with a readable live
value, bounded history, a run control, and an export whose time range is explicit.
Keep the experimental record separate from the chart's temporary display buffer.

Add multiple channels, transforms, annotations, and comparison runs deliberately.
An independently running collector is appropriate when acquisition must continue
without the page; it has its own health and spool policy. Rehearse a retention gap,
an instrument reconnect, a reset device clock, and a late sample after run closeout.
Charts should expose gaps and preserve units. The final record should explain its
coverage, rejected samples, and interpretation choices instead of making a smooth
plot stand in for complete evidence.

## 10. An observer that interrupts for a reason

An observer may notice a changing instrument value, altered scene, motion event,
or arrival condition. Begin with the task's definition of a meaningful change and
the cost of a false alarm or missed event. Let the person rehearse against an
explicit baseline before enabling a consequential reaction.

Use simple thresholds, hysteresis, dwell, and cooldown where they are enough;
select a perception engine only when semantic recognition is needed. Offer a
manual observation route and a visible stop control. Rehearse noise near a
threshold, a long sampling gap, a changed camera reference, and interruption during
calibration. A proposed event should retain the relevant source and detector
version. Keep detection, user acknowledgement, agent wake, and an external action
separate so one noisy input cannot masquerade as completed work.

## 11. A remote operator who can intervene and recover

A desktop shows job progress while a phone offers focused controls or evidence
capture. Start with one task identity, explicit device purposes, trustworthy
freshness, and a verified agent receiver if conversation is needed. Joining a
device should visibly confirm arrival at the right task and role.

Add handoff briefing, attention requests, cancellation, and recovery views as the
job becomes more complex. Preserve local drafts when a page update or device
transfer occurs. Rehearse a disconnected display, an agent restart, and completion
racing with cancellation. A command being received is different from the remote
job stopping; present both facts. Each consumer's handled checkpoint must follow
successful effects, while chart position and reading progress remain independent
view state.

## 12. A portable private notebook

A case notebook combines original observations, evidence references, interpretations,
and follow-up work. Begin by deciding who can read each kind of information and
where it is authoritative. Keep private originals separate from reviewed shared
summaries, and make the difference visible during export.

Add redaction review, versioned export, backup inspection, and restore only with
clear coverage and retention rules. Copying a blob ID into state does not by itself
make an archive; a restored reference must still resolve to the intended bytes
under current access. Rehearse a missing attachment, an unsupported export version,
a conflicting restore, and revoked access to cached information. Show what can be
recovered, what is excluded, and what removal actually affects. A trusted private
store is necessary when ordinary page readers must not see the same records.

## 13. A batch operation with understandable partial results

A reviewer selects many records for a change. Start with an exact selection,
per-item impact preview, and a receipt for each attempted effect. Decide whether
the selection means the currently visible page, explicit IDs, or all results from
a versioned query; a live filter must not silently redefine approved work.

Add bounded concurrency, pause, cancellation, and retry only after defining their
effects on started and unstarted items. Rehearse one rejected item, a lost reply,
and a changed record after approval. Preserve confirmed outcomes and reconcile
uncertain ones using their original identities. Do not rerun the entire batch to
discover which actions succeeded. If the task requires all-or-nothing behavior,
verify an actual transaction supplies it rather than calling a browser loop
atomic.

## 14. A small page that grows coherently

Start with one useful interaction and an accessible text result. A single authored
HTML file is a good choice when it keeps the task clear; modules, nested pages,
or a framework become useful when actual complexity justifies them. Establish
owner access and a working receiver before promising conversational responses.

As the page grows, preserve stable task identity, focus, draft ownership, and
visible recovery controls. Translate the complete journey, including errors and
receipts, and format values without changing their underlying meaning. Rehearse
a narrow viewport, keyboard use, a changed language, a publication with a missing
dependency, and an update arriving during typing. Publish the complete authored
asset graph and confirm the intended visible page loads it. Existing tabs and
newly published files may have different valid publication identities.

## Turn a route into an adaptation plan

Write a short task-specific plan with the person, desired result, first useful
version, important data and authority decisions, and one plausible rejected
alternative. Choose only the failure rehearsals that could materially change
that task's result. The [adaptation loop](using-cookbooks.md) explains how to move
from reading to page-owned source; [testing an adaptive page](../cookbooks/test-adaptive-page/COOKBOOK.md)
helps select the smallest meaningful check.

These briefs and the expanded feature choices are explained designs. Existing
executable evidence remains attached to its exact source and artifact record in
[pilot verification](pilot-checks.md); reading a new route does not extend those
claims. Record real adaptations, including failures and rejected features, so
future cookbook improvements are based on observed use.
