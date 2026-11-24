---
id: "complete-accessible-interactions"
title: "Make the complete interaction accessible"
summary: "Preserve keyboard operation, focus, understandable status, and equivalent task paths from first use through errors, recovery, and completion."
group: "Design everyday interactions"
tags: ["accessibility", "interaction", "recovery"]
choices: ["Native controls or justified custom interaction", "Status announcements versus deliberate focus changes", "Equivalent task outcomes across input and display needs"]
capabilities: []
evidence: "explained"
related: ["adapt-without-losing-work", "discover-capabilities", "build-correctable-forms"]
sources: ["https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/BROWSER_API.md", "https://github.com/werg/tendriller/blob/7668af4ae59ae7dced87eba999bd040836f9fc06/docs/CAPTURES.md"]
---

# Make the complete interaction accessible

Use this when building any interaction a person must be able to finish: submit an inspection note, compare alternatives, review evidence, or stop a live sensor. Accessibility belongs to the entire journey, including waiting, errors, interruption, and completion. A labelled button on the happy path does not establish that the task remains usable after a rejected upload or a changed page.

Start with a concrete outcome and a simple interaction. An ordinary form, a readable result, and explicit buttons often need less custom behavior than a draggable dashboard. Custom widgets can be appropriate when their interaction materially helps the task; their keyboard, focus, and announcement behavior becomes application work to design and verify.

## Map the complete task before choosing widgets

For an evidence report, list the actions: understand the request, enter a note, choose optional media, inspect it, correct a problem, submit, distinguish delivery from response, and continue after a late rejection. For each action, ask whether a person can discover its purpose, operate it, understand the result, and recover without relying on one sensory or motor channel.

| Task need | Useful baseline | Alternative to verify |
| --- | --- | --- |
| Enter information | Labelled native input and visible instructions. | File/text route when camera, voice, or drawing is unsuitable. |
| Choose or reorder items | Buttons, list, or select controls. | Dragging with equivalent move/select operations. |
| Understand a chart/image | Description, values, and meaningful source labels. | Optional visual exploration that preserves the same conclusions. |
| Notice a change | Text status and appropriate programmatic announcement. | Optional sound/haptic cue with independent control. |
| Correct and retry | Specific errors, preserved input, and reachable controls. | An explanation when the original operation cannot be retried. |

The baseline should complete the same task. “Please use another device” is not an equivalent input route when a short typed report would suffice. Where an alternative provides different evidence, state that difference honestly.

## Choose native semantics and purposeful labels

Use native controls for their intended actions and ordinary headings, lists, and form structure to explain the page. A control's accessible name should identify the action and, when necessary, its target: “Remove photo of upper hinge” is clearer than several unrelated buttons all called “Remove.” Keep visible instructions near the point of use; placeholders disappear during editing and are poor substitutes for persistent labels.

W3C's [forms guidance](https://www.w3.org/WAI/tutorials/forms/) explains labels, grouped controls, instructions, and accessible feedback. Apply those semantics to the authored page rather than assuming the headless runtime supplies a complete interface. The [public browser contract](https://github.com/werg/tendriller/blob/master/docs/BROWSER_API.md) leaves conversation presentation and domain interaction to the page.

Keep custom interactions small and justified. A reorderable list may expose Move up/Move down and a position announcement. A freehand drawing can offer a description or file route for the underlying communication task. W3C's [keyboard explanation](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) distinguishes path-dependent drawing from ordinary actions that should have keyboard operation.

## Treat focus as part of task state

Choose a logical reading and tab order that follows the work. Show a persistent, visible focus indication; do not remove it for visual tidiness. W3C's [focus guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible) explains why the current keyboard target must remain identifiable.

When opening a dialog or focused review route, place focus at a useful starting point, provide a clear exit, and restore it to the invoking control when that control still exists. If an item was deleted, choose a sensible neighboring item or collection heading. A popup must not strand focus behind an overlay or trap the person without an escape action.

Do not move focus for every agent reply, autosave, chart update, or queue acknowledgement. Preserve focus, selection, and draft text across ordinary rerenders. For an intentional major transition, such as opening a submitted report, focus a meaningful heading or result. The [continuity guide](../adapt-without-losing-work/COOKBOOK.md) covers retaining identity through page changes.

## Announce meaning, not every event

Show and programmatically expose concise statuses such as “Saved on this device,” “Waiting to send,” “Accepted; awaiting reply,” and “Not sent; review required.” Those states represent different guarantees. An accepted event is not an agent completion receipt.

W3C's [status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) describes communicating updates without taking focus. Use an appropriate status/live region for meaningful changes and reserve urgent interruption for conditions that warrant it. Avoid announcing each byte, sensor sample, or keystroke. Coalesce progress updates and keep a readable status history when a transient message would disappear before it can be understood.

After a failed submit, provide a text error summary with links to affected fields and field-level guidance. Choose a deliberate focus policy for that explicit action. A late network rejection while the person edits a new draft should announce the rejected earlier submission and preserve both pieces of work; it should not unexpectedly move their cursor.

## Support the actual viewing and input conditions

Test increased text size, narrow viewports, zoom, and long labels. W3C's [reflow explanation](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) describes preserving information and function at a width equivalent to 320 CSS pixels, with specific exceptions for inherently two-dimensional content. Essential controls and explanatory text still need a usable layout around a map or diagram.

Use text or shape as well as color for status. Choose legible contrast and visible selected/error states. Respect reduced-motion preferences by removing nonessential animation and providing static status. A task's progress should not depend on watching a transient animation, hearing a tone, hovering precisely, or making a timed sequence of key presses.

Give live media and sensors an obvious stop action that works with keyboard and remains available during network failure. Provide controls independent of the input being sensed: voice should not be required to stop voice, nor motion to stop motion. Avoid hiding essential actions below fixed panels when the on-screen keyboard or zoom reduces usable space.

## Verify a real journey and record its boundary

Choose the exact authored files and a representative task. Run it keyboard-only from initial load through an error and successful completion. Then use a screen reader/browser pairing, zoom/reflow conditions, and reduced motion. Automated checks can find some issues, but they do not establish understandable focus order, correct recovery, or a usable alternative task path.

| Scenario | Expected observation |
| --- | --- |
| Denied optional sensor | The non-sensor route finishes the task. |
| Error in several fields | Errors identify fields in text and are reachable without losing values. |
| Late reply while typing | New content is discoverable without stealing focus. |
| Remove a focused item | Focus moves to a meaningful surviving target. |
| Zoom or narrow screen during review | Evidence context and all actions remain available. |
| Stop during preparation or upload | The requested local activity stops and status explains remaining delivery work. |

Record tested assistive technology, browser, device, files, and scenarios. This explained guide is an adaptation plan; following it is not a claim of full accessibility conformance or a substitute for testing with people who use the interaction.
