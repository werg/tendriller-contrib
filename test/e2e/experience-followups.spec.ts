import { test, expect } from "@playwright/test";
import { agent, capturedGuards, claim, createPage, deletePage, localPageUrl, openClaimed, pageWorkflow, publishRecipe, signInFixture, OTHER_TOKEN } from "./local-helpers";

test("private participant tasks and feedback cross real authenticated browser sessions", async ({ page, context, browser }) => {
  const h = await createPage(), guestContext = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    await publishRecipe(h, "facilitated-session", "facilitation");
    await signInFixture(context); await openClaimed(page, h);
    const invite = await agent(h, "/links", "POST", { role: "guest" }); expect(invite.status).toBe(201);
    const guestHandle = { ...h, page_url: invite.data.url };
    await signInFixture(guestContext, OTHER_TOKEN);
    const invitation = await claim(guestContext, guestHandle);
    expect(invitation.status()).toBe(200);
    const nonce = (await invitation.text()).match(/name="nonce" value="([^"]+)"/)?.[1];
    expect(nonce).toBeTruthy();
    expect((await guestContext.request.post(invitation.url(), { headers: { Origin: new URL(invitation.url()).origin }, form: { nonce: nonce! }, maxRedirects: 0 })).status()).toBe(200);
    const base = `${localPageUrl(h)}_tendril/`;
    const pending = await (await context.request.get(`${base}guests`)).json();
    expect(pending.guests).toHaveLength(1);
    const participant = pending.guests[0];
    expect((await context.request.post(`${base}guests/${participant.account_id}/${participant.link_id}/approve`, { headers: { Origin: new URL(base).origin } })).status()).toBe(200);
    const guestPage = await guestContext.newPage(); await openClaimed(guestPage, guestHandle);
    await page.getByRole("button", { name: "Refresh participants and tasks" }).click();
    await page.locator("#assignment-participant").selectOption(participant.account_id);
    await page.locator("#assignment-title").fill("Be the observer");
    await page.locator("#assignment-prompt").fill("Look for a quiet place and describe what you notice.");
    await page.getByRole("button", { name: "Assign privately", exact: true }).click();
    await expect(page.locator("#assignment-status")).toContainText("Task assigned privately");
    await guestPage.getByRole("button", { name: "Refresh my tasks" }).click();
    await expect(guestPage.locator("#my-tasks")).toContainText("Be the observer");
    await expect(page.locator("#my-tasks")).not.toContainText("Be the observer");
    await guestPage.locator("#my-tasks textarea").fill("The room is quiet beside the window.");
    await guestPage.getByRole("button", { name: "Send task answer" }).click();
    await expect(guestPage.locator("#task-status")).toContainText("Task answer saved privately");
    await page.getByRole("button", { name: "Refresh participants and tasks" }).click();
    await expect(page.locator("#assignment-list")).toContainText("quiet beside the window");
    await page.locator("#assignment-list textarea").fill("Use that observation as your starting point.");
    await page.getByRole("button", { name: "Save private feedback" }).click();
    await expect(page.locator("#assignment-status")).toContainText("Private task updated");
    await guestPage.getByRole("button", { name: "Refresh my tasks" }).click();
    await expect(guestPage.locator("#my-tasks")).toContainText("Use that observation as your starting point");
    await guestPage.reload(); await expect(guestPage.locator("#my-tasks textarea")).toHaveValue("The room is quiet beside the window.");
    expect(JSON.stringify((await agent(h, "/state")).data)).not.toContain("quiet beside the window");
    expect(JSON.stringify((await agent(h, "/events?after=0")).data)).not.toContain("starting point");
    const captured = await capturedGuards(h, "facilitation");
    const preview = await (await pageWorkflow(context, h, "archivePreview", { scope: "facilitation" }, { ...captured, cid: crypto.randomUUID() })).json();
    const response = await pageWorkflow(context, h, "archive", {
      scope: "facilitation", title: "Our first session", expected_state_revision: preview.state_revision,
      expected_interaction_revision: preview.interaction_revision,
    }, captured);
    expect(response.status()).toBe(200); const archived = await response.json();
    expect(archived.archive.responses[0].answer).toBe("The room is quiet beside the window.");
    await expect(guestPage.locator("#my-tasks")).not.toContainText("Be the observer");
    expect((await pageWorkflow(guestContext, guestHandle, "archiveGet", { id: archived.archive.id })).status()).toBe(403);
  } finally { await guestContext.close(); await deletePage(h); }
});
