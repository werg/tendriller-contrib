---
id: "publish-smallest-page"
title: "Publish the smallest useful page"
summary: "Start with ordinary authored files and one useful event/reply loop, then add structure only when the task needs it."
group: "Guide and coordinate work"
tags: ["publishing", "plain-files", "first-page"]
choices: ["One file, modules, or nested pages", "Event/reply interaction or a dashboard without conversation", "Exact authored assets and a verified receiver"]
capabilities: []
evidence: "explained"
related: ["connect-resuming-agent", "publish-coherent-updates", "test-adaptive-page"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/examples/first-page/index.html", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/examples/first-page/run.mjs"]
---

# Publish the smallest useful page

Use this as the first implementation path when the person needs a focused page. Begin with one HTML file and ordinary CSS/JavaScript if that serves the task. Multiple files, nested pages, or a framework are valid choices when they improve clarity; no contrib manifest, component graph, or universal application schema is required.

## Establish the useful loop

Decide what the page lets the person do, what event or instruction reaches the agent, and how a response appears. The public headless browser API supplies state, events, streams, durable commands, captures, and publication lifecycle. The page owns its DOM and interaction model. A conversation surface is optional and can be inline, separate, or absent for a dashboard.

When an agent conversation is involved, connect and verify an actual receiver before promising immediate replies. An open socket or successful HTTP request proves transport, not that the correct host conversation resumes. Store administrative handles privately; publish only intended page files and the user-facing URL.

## Adapt the plan

1. Create the smallest useful interaction and an accessible text result.
2. Use the current public core contract for typed operations and stable command outcomes. Keep new drafts separate from pending sends.
3. Pack the actual authored file or directory using core's publishing tool. Missing files are errors, not material to be silently fetched from a catalog.
4. Preview those exact files with explicit fixtures, then test the live receiver and service boundary that fixtures cannot prove.
5. Check publication health and open the intended page as the actual role. Add modules or nested pages only when the task benefits.

A cookbook is reading material. Copying a snippet creates editable application source; it does not require retaining a Tendriller mount API or matching upstream bytes. Publication hashes describe the final authored files.

## Verify

Publish a file with no contrib metadata. Send an input, disconnect/retry it, and observe the original outcome. Test a rejected operation without losing new text. Remove an authored dependency and confirm preview and publication both reveal the omission. Try a nested relative asset and a page update while a draft exists. Do not confuse successful rendering with verified agent delivery.
