import { test, expect } from "@playwright/test";
import { fakeSpeech, load, calls } from "./helpers";

test("optional wakeword requires explicit tap and sends only a post-wake command", async ({ page }) => {
  await fakeSpeech(page);
  await load(page, "wakeword");
  await page.evaluate(() => {
    document.body.innerHTML = '<div id="handsfree"></div>';
    (window as any).__handsfree = (window as any).tendrilSnippets.wakeword.mount("#handsfree", { phrases: ["Hey Kitchen"] });
  });
  await expect(page.getByRole("button", { name: "Start hands-free" })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__sr.starts)).toBe(0);
  await page.getByRole("button", { name: "Start hands-free" }).click();
  await page.evaluate(() => (window as any).__sr.last.say("The kitchen is busy"));
  expect((await calls(page)).send).toHaveLength(0);
  await page.evaluate(() => (window as any).__sr.last.say("Hey Kitchen, add eggs"));
  await expect.poll(async () => (await calls(page)).send).toHaveLength(1);
  expect((await calls(page)).send[0]).toMatchObject({ data: { type: "utterance", text: "add eggs", via: "wakeword" }, wake: true });
  await page.getByRole("button", { name: "Stop hands-free" }).click();
  expect(await page.evaluate(() => (window as any).__handsfree.button.getAttribute("aria-pressed"))).toBe("false");
});

test("backgrounded optional wakeword stops and needs another explicit tap on return", async ({ page }) => {
  await fakeSpeech(page);
  await load(page, "wakeword");
  await page.evaluate(() => {
    document.body.innerHTML = '<div id="handsfree"></div>';
    (window as any).__handsfree = (window as any).tendrilSnippets.wakeword.mount("#handsfree");
  });
  await page.getByRole("button", { name: "Start hands-free" }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("button", { name: "Start hands-free" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("status")).toContainText("Tap Start hands-free again");
  const before = await page.evaluate(() => (window as any).__sr.starts);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(await page.evaluate(() => (window as any).__sr.starts)).toBe(before);
});

test("delivery errors and denied permissions are reported, not shown as sent", async ({ page }) => {
  await fakeSpeech(page);
  await load(page, "wakeword");
  await page.evaluate(() => {
    document.body.innerHTML = '<div id="handsfree"></div>';
    (window as any).tendril.send = async () => ({ error: { message: "Device not authorized" } });
    (window as any).__handsfree = (window as any).tendrilSnippets.wakeword.mount("#handsfree");
  });
  await page.getByRole("button", { name: "Start hands-free" }).click();
  await page.evaluate(() => (window as any).__sr.last.say("Hey Tendril, close the window"));
  await expect(page.getByRole("status")).toContainText("Could not send: Device not authorized");
  await page.evaluate(() => (window as any).__sr.last.onerror({ error: "not-allowed" }));
  await expect(page.getByRole("button", { name: "Start hands-free" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("status")).toContainText("permission was denied");
});
