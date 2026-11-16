---
id: "schedule-shared-resources"
title: "Reserve shared resources without double booking"
summary: "Guide people from availability to a confirmed reservation with explicit holds, time interpretation, capacity, and authoritative conflict checks."
group: "Guide and coordinate work"
tags: ["scheduling", "resources", "concurrency"]
choices: ["Advisory availability versus authoritative reservation", "Exclusive resources versus capacity and tentative holds", "Local-time intent versus exact instants and recurring exceptions"]
related: ["review-exact-proposal", "reconcile-concurrent-edits", "plan-time-and-deadlines"]
sources: ["https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/PROTOCOL.md", "https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/BROWSER_API.md"]
capabilities: []
evidence: "explained"
---

# Reserve shared resources without double booking

Use this for a meeting room, shared instrument, equipment checkout, or another resource whose availability must be coordinated. A read-only availability board is simpler when reservations occur in another authoritative system. If this page owns reservations, it needs an explicit trusted policy or authoritative external integration. Core does not install a booking engine, holds, capacity accounting, or conflict resolution by default.

## Follow the reservation journey

A person booking a workshop instrument should be able to choose a resource, understand its constraints, inspect available times, propose a slot, review the exact request, and receive a confirmed result. The result should be usable later for changes, cancellation, or arrival/check-in when those features are relevant. A colored cell on a calendar is not a reservation receipt.

Start with resource purpose, location, capacity or exclusivity, available hours, required setup/cleanup time, and who may reserve it. Show the timezone beside the chosen date and interval. Offer a keyboard-operable list of slots alongside a calendar grid, with readable labels for unavailable periods and selected times. Do not depend on dragging or color alone.

Availability is a snapshot. Display when it was checked, allow refresh, and keep the person's proposed interval when another reservation takes the slot. Offer nearby alternatives only after explaining the conflict; do not silently move a confirmed choice to a different resource or time.

## Define the resource policy before implementing controls

| Decision | Example choice | Consequence |
| --- | --- | --- |
| Capacity | One exclusive instrument. | Any overlapping active reservation conflicts. |
| Shared capacity | A room with a bounded seat count. | The authoritative check sums overlapping admitted quantities. |
| Buffers | Setup and cleanup extend occupancy. | Conflict checks use occupied intervals, not only visible appointment times. |
| Holds | A short tentative hold while completing review. | Server expiry and concurrent claims need explicit policy. |
| Cancellation | Release capacity when the authorized operation commits. | Local removal from a calendar does not free the resource. |
| Recurrence | Explicit instances with reviewed exceptions. | One successful occurrence does not imply the entire series was booked. |
| Approval | A request waits for a designated approver. | Pending and confirmed occupancy need separate rules. |

Prefer no holds and no recurrence for an initial simple resource if direct confirmation meets the task. Holds help only when people need time to complete a meaningful review; they also create expiry and fairness problems. Limit duration, quantity, pending holds, and booking horizon according to the actual application policy, and expose the relevant constraints before submission.

## Treat time as reviewed intent

Store the intended local date/time and its named timezone when that is part of the person's meaning, together with the resolved instants used for conflict checks. A timezone offset alone cannot represent future seasonal changes. Detect nonexistent or ambiguous local times and ask the person to choose a valid interpretation rather than silently shifting the appointment.

An illustrative occupancy rule is a half-open interval `[start, end)`, where one booking ending exactly when another begins does not overlap unless buffers apply. State the adopted rule explicitly and require `end > start`. For capacity, evaluate overlap across every boundary within the proposed interval; checking only its start can miss a later collision.

Choose recurrence semantics deliberately. “Every Tuesday at 09:00 in this location” differs from repeating an elapsed number of hours. Preview affected occurrences, exceptions, resource changes, and known conflicts. Bound expansion and decide whether booking the series is atomic or per occurrence. Make partial success visible.

## Put the guarantee at the authority boundary

The trusted operation must recheck current actor permission, resource policy, capacity, active holds/reservations, interval validity, and applicable revisions/generations as one authoritative decision. Reading availability in the browser and then appending a reservation is vulnerable to concurrent writers. A locally disabled slot is only a usability hint.

Use a stable request identity and immutable reviewed payload so a lost reply can be reconciled without creating a second reservation. Bind it to the exact resource, interval, quantity, and reviewed terms. A stale task generation or changed policy requires a fresh review, not automatic rebinding. A resource label is not authority and may change without changing its identity.

For an external calendar or booking service, treat that service's result as authoritative and document its actual conflict/idempotency behavior. Tendriller can display and coordinate the experience, but its shared state cannot guarantee exclusivity in a separate system. If the integration cannot enforce exclusivity, call the page advisory and require final confirmation at the authority.

## Make pending states actionable

Distinguish selecting, checking availability, held, awaiting approval, submitting, confirmed, expired, rejected, and uncertain when the policy supports them. A hold countdown is a local display of a server-owned expiry, not the authority itself. On resume or reconnect, refresh its status; a suspended tab's timer must not extend the hold.

A confirmation receipt should name the reservation identity, resource, exact interval/timezone, quantity, current status, and allowed change/cancel actions. Avoid exposing another person's private booking details when only occupancy is needed. Notifications should carry the minimum useful information and their own delivery state; confirmation does not depend on a person reading a notification unless the policy explicitly requires it.

Changing a reservation requires checking the new interval and releasing/replacing the old one under a defined transaction or external policy. Do not cancel the old slot first and then discover the new slot was unavailable unless that risk is an explicit reviewed behavior. Cancellation is an authoritative operation with its own receipt and race with completion, check-in, or other lifecycle events.

## Recover from races without losing the proposal

If a slot is taken during review, preserve the original choice and show why confirmation failed. Let the person refresh alternatives and deliberately submit a new request. If the confirmation response is lost, reconcile the original request before offering another Book action. A page reload should restore the pending/confirmed distinction, not infer success from a cached selected cell.

For offline use, allow a local proposed booking if useful, but label it as unconfirmed. Do not promise that a queued request reserves capacity. Reauthorize and recheck the current resource policy on return. Revoking access may hide private details while preserving an appropriate non-sensitive outcome receipt.

## Verify the reservation guarantee

| Scenario | Expected observation |
| --- | --- |
| Two clients confirm the same exclusive interval | The authority accepts only the allowed reservation; the loser keeps a reviewable proposal. |
| Capacity fills midway through an interval | The full interval check detects the conflict. |
| Adjacent bookings include setup buffers | Occupancy follows the declared boundary/buffer policy. |
| A hold expires while the tab is suspended | Resume shows the authoritative expiry and does not extend it locally. |
| Confirmation succeeds but the reply is lost | Reconciliation returns the original reservation without duplication. |
| A time falls in a seasonal clock ambiguity | The interface requires a clear valid interpretation before confirmation. |
| A recurring series has one conflict | Atomic or partial behavior matches the preview, with per-occurrence outcomes. |
| Change races with another booking | The old and new occupancy follow the real transaction policy without a hidden gap or double booking. |

Only actual trusted-host or external-service concurrency checks can establish the booking guarantee. A fixture calendar can exercise the user experience but cannot prove exclusivity.
