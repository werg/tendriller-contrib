import assert from 'node:assert/strict';
import { chromium } from 'playwright';

/** The actual packed host renders every response; routing only supplies its synthetic account. */
export async function openReleaseBrowser({ bridge, config, executablePath, directory }) {
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext({ viewport: { width: 1100, height: 800 }, serviceWorkers: 'block' });
  const base = new URL(config.base), requests = [], failures = [];
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
      failures.push(`Unexpected external page request: ${url.href}`); await route.abort(); return;
    }
    const relative = url.pathname.slice(base.pathname.length) + url.search;
    const target = relative.startsWith('_tendril/peers/') ? `${bridge}/api/${relative.slice('_tendril/'.length)}` : `${bridge}/page/${relative}`;
    requests.push({ method: request.method(), path: relative });
    try {
      const response = await fetch(target, { method: request.method(), signal: AbortSignal.timeout(30_000) });
      const headers = Object.fromEntries(response.headers);
      delete headers['transfer-encoding']; delete headers.connection;
      await route.fulfill({ status: response.status, headers, body: Buffer.from(await response.arrayBuffer()) });
    } catch (error) { failures.push(error.message); await route.abort(); }
  });
  const page = await context.newPage();
  page.on('pageerror', error => failures.push(error.message));
  const ready = async () => {
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true' || document.documentElement.dataset.failed === 'true', undefined, { timeout: 30_000 });
    assert.equal(await page.locator('#error').textContent(), '');
  };
  await page.goto(base.href); await ready();
  const draft = 'An unsent draft remains mine while code changes.';
  await page.locator('#draft').fill(draft);
  const before = { release: await page.locator('html').getAttribute('data-release'), version: await page.locator('#version').textContent() };
  return {
    async applyAvailable(releaseId) {
      assert.equal(await page.locator('html').getAttribute('data-release'), before.release);
      assert.equal(await page.locator('#draft').inputValue(), draft);
      await page.locator('#check-update').click();
      await page.waitForFunction(id => document.documentElement.dataset.offered === id, releaseId, { timeout: 30_000 });
      assert.equal(await page.locator('#draft').inputValue(), draft);
      await page.locator('#load-lazy').click();
      await page.locator('#lazy-version').filter({ hasText: before.version }).waitFor();
      await page.locator('#defer-update').click();
      assert.match(await page.locator('#update-status').textContent(), /Update deferred/u);
      assert.equal(await page.locator('html').getAttribute('data-release'), before.release);
      await page.screenshot({ path: `${directory}/release-deferred.png`, fullPage: true });
      await Promise.all([page.waitForURL(url => url.pathname.includes(`_publications/${releaseId}/`)), page.locator('#apply-update').click()]);
      await ready();
      assert.equal(await page.locator('html').getAttribute('data-release'), releaseId);
      assert.equal(await page.locator('#draft').inputValue(), draft);
      await page.locator('#load-lazy').click();
      const version = await page.locator('#version').textContent();
      await page.locator('#lazy-version').filter({ hasText: version }).waitFor();
      assert.notEqual(version, before.version);
      await page.screenshot({ path: `${directory}/release-applied.png`, fullPage: true });
      assert.deepEqual(failures, []);
      return { browser: browser.version(), before, after: { release: releaseId, version },
        draftPreserved: true, explicitApply: true, explicitDefer: true, oldLazyModule: before.version, newLazyModule: version,
        noAutomaticReload: true, verifiedObserver: true, actualInjectedRuntime: true, requests,
        authentication: 'The loopback fixture supplies its synthetic authenticated account; no deployed browser credential is claimed.' };
    },
    async close() { await context.close(); await browser.close(); },
  };
}
