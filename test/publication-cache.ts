import type { Page } from '@playwright/test';

// Wait through the browser's standard Cache API for the published graph. No
// cache-name or service-worker implementation dependency is part of this helper.
export async function savedForOffline(page: Page) {
  await page.waitForFunction(async () => {
    if (!navigator.serviceWorker.controller) return false;
    const publication = (window as any).__TENDRIL__?.publication;
    if (!publication) return false;
    const base = new URL(publication.base, location.origin);
    const runtime = new URL(publication.runtime.base, location.origin);
    const manifest = await caches.match(new URL('manifest.json', runtime).href);
    if (!manifest) return false;
    const assets = (await manifest.json()).assets;
    const urls = [...publication.assets.map((asset: any) => new URL(asset.path, base).href), ...assets.map((asset: any) => new URL(asset.path, runtime).href)];
    return (await Promise.all(urls.map(url => caches.match(url)))).every(Boolean);
  }, null, { timeout: 20000 });
}
export function cachedPageAsset(page: Page, path: string) {
  return page.evaluate(async path => {
    const response = await caches.match(new URL(path, document.baseURI).href);
    return response ? response.text() : null;
  }, path);
}
