---
id: "adapt-without-losing-work"
title: "Adapt an interface without losing work"
summary: "Choose ordinary DOM, framework state, or declarative rendering while preserving drafts, focus, and stable task identity."
group: "Keep work dependable"
tags: ["adaptation", "accessibility", "drafts"]
choices: ["Ordinary DOM, framework state, or a narrow declarative model", "Logical identity versus task/question identity", "In-place reconciliation or a deliberate disruptive update"]
capabilities: []
evidence: "explained"
related: ["reconcile-concurrent-edits", "publish-coherent-updates", "capture-reviewed-evidence"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/ui.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/ui-schema.json", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/adaptive-checkin/index.html", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/test/continuity.spec.ts"]
---

# Adapt an interface without losing work

Use interface adaptation when an agent changes a page as the task evolves. The goal is to improve the person's next action while retaining work they are doing now. A new layout does not justify deleting an unsent draft, selection, drawing, or pending submission.

## Choose the structure for this task

Ordinary DOM code is often enough for a small form. A framework can make complex state transitions easier to maintain. A declarative block model can be useful when a narrowly defined family of fields is edited repeatedly, but it creates a schema and renderer to own. The retired eleven-block, forty-block-bound model was an example; it is not the cookbook format or a core requirement.

Keep stable logical IDs independent of array position, labels, and CSS selectors. Distinguish field identity from task identity: a field named “answer” in a new question should not silently receive the old question's draft. Decide what can be reconciled in place, what needs confirmation, and what must remain as a separately recoverable draft.

## Preserve interaction state deliberately

Separate application domain state, local edit buffers, pending command snapshots, and view state. Preserve focus, selection/caret, scroll position, and canvas work where the logical object remains the same. Do not restore focus to a removed or hidden control. Announce important changes without repeatedly interrupting typing.

A publication update is different from an in-page render. Use the public publication lifecycle and decide when unsent work is safely preserved before changing versions. An accepted server update does not prove the browser is displaying it, and a rendered reply acknowledgement does not prove the person read it.

## Adapt and verify

Start from the person's actual input methods: keyboard, pointer, touch, voice, zoom, reduced motion, and readable density. Avoid a universal UI vocabulary. Test updating a label during typing, moving a field, removing the active field, changing the question, replacing a drawing surface, and receiving a late rejection. Verify keyboard traversal, a narrow viewport, zoom, and a text alternative for visual controls. A static screenshot cannot establish continuity.
