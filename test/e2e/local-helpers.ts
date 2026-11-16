import { expect, request, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { scaffold, componentAssets } from '../../tools/cli/lib/assets.mjs';
import { pack, guessType } from '../../tools/cli/lib/pack.mjs';
import { publishFiles } from '../../tools/cli/lib/publications.mjs';
import { assertService } from '../../tools/cli/lib/service.mjs';

// This suite consumes an explicitly started service with test identity fixtures.
// The service may be local or remote; no core checkout or private imports exist.
export const SERVICE = process.env.TENDRILLER_E2E_SERVICE || 'https://service.localhost:8790';
export const OWNER = process.env.TENDRILLER_E2E_OWNER || 'owner@example.test';
export const OWNER_TOKEN = process.env.TENDRILLER_E2E_OWNER_TOKEN || 'tendriller-local-e2e-session';
export const OTHER_TOKEN = process.env.TENDRILLER_E2E_OTHER_TOKEN || 'tendriller-local-e2e-other-session';
const serviceUrl = new URL(SERVICE);
let nextIp = 1;
let localRequest: Promise<APIRequestContext> | undefined;
export function requester() { return localRequest ??= request.newContext({ ignoreHTTPSErrors: true }); }
export type Handle = { id: string; page_url: string; api: string; token: string };
export type CommandMetadata = { cid: string; scope?: string; expected_generations: Record<string, string> };

export async function verifyService(requirements = { contract: 3, workflows: {} }) {
  const result = await (await requester()).get(new URL('/api/service', SERVICE).href);
  expect(result.ok(), await result.text()).toBe(true);
  return assertService(await result.json(), requirements);
}
export async function createPage(owner = OWNER): Promise<Handle> {
  await verifyService();
  const result = await (await requester()).post(`${SERVICE}/api/tendrils`, {
    headers: { 'CF-Connecting-IP': `198.18.0.${nextIp++}` }, data: { owner, name: 'Contrib E2E page' },
  });
  expect(result.status(), await result.text()).toBe(201);
  return result.json();
}
export async function agent(h: Handle, path = '', method = 'GET', body?: unknown) {
  const result = await (await requester()).fetch(`${h.api}${path}`, {
    method, headers: { Authorization: `Bearer ${h.token}` }, data: body,
  });
  const raw = await result.text();
  let data: any; try { data = JSON.parse(raw); } catch { data = raw; }
  return { status: result.status(), data };
}
function publicationApi(h: Handle) {
  const json = async (path: string, method = 'GET', body?: unknown) => {
    const result = await agent(h, path, method, body);
    expect(result.status, JSON.stringify(result.data)).toBeGreaterThanOrEqual(200);
    expect(result.status, JSON.stringify(result.data)).toBeLessThan(300);
    return result.data;
  };
  return {
    get: (path: string) => json(path),
    post: (path: string, body: unknown) => json(path, 'POST', body),
    raw: async (path: string, options: { method?: string; body?: Buffer; headers?: Record<string, string> }) => {
      const response = await (await requester()).fetch(h.api + path, {
        method: options.method || 'GET', headers: { Authorization: `Bearer ${h.token}`, ...options.headers }, data: options.body,
      });
      const bytes = await response.body();
      expect(response.ok(), bytes.toString('utf8')).toBe(true);
      return new Response(bytes, { status: response.status() });
    },
  };
}
export async function capturedGuards(h: Handle, scope?: string): Promise<CommandMetadata> {
  if (!scope) return { cid: randomUUID(), expected_generations: {} };
  const id = `sessions:${scope}`;
  const result = await agent(h, '/scopes');
  expect(result.status).toBe(200);
  const current = result.data.scopes.find((value: any) => value.id === id && !value.retired);
  expect(current, `Activate ${id} before composing commands`).toBeTruthy();
  return { cid: randomUUID(), scope: id, expected_generations: { [id]: current.generation } };
}
export async function workflowCommand(h: Handle, operation: string, data: unknown = {}, scope?: string, metadata?: CommandMetadata) {
  return agent(h, `/workflows/sessions/${encodeURIComponent(operation)}`, 'POST', { ...(metadata || await capturedGuards(h, scope)), data });
}
export async function activate(h: Handle, scope: string) {
  const result = await workflowCommand(h, 'activate', { scope });
  expect(result.status, JSON.stringify(result.data)).toBe(200);
  return result.data.scope;
}
export async function pageWorkflow(context: BrowserContext, h: Handle, operation: string, data: unknown = {}, metadata?: CommandMetadata) {
  const base = localPageUrl(h);
  return context.request.post(`${base}_tendril/workflows/sessions/${encodeURIComponent(operation)}`, {
    headers: { Origin: new URL(base).origin }, data: { ...(metadata || { cid: randomUUID(), expected_generations: {} }), data },
  });
}
async function holdListener(h: Handle) {
  void agent(h, '/events?after=0&wait=25').catch(() => {});
  await expect.poll(async () => (await agent(h)).data.presence.state).toBe('listening');
}
export async function publish(h: Handle, body: string, components: string[] = []) {
  await holdListener(h);
  const files = new Map<string, Buffer>();
  files.set('index.html', Buffer.from(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>E2E</title></head><body>${body}</body></html>`));
  for (const asset of componentAssets(components)) files.set(asset.path, asset.bytes);
  const enumeration = { entry: 'index.html', files: [...files].map(([path, bytes]) => ({
    path, bytes, type: guessType(path), sha256: createHash('sha256').update(bytes).digest('hex'), size: bytes.length,
  })) };
  return publishFiles(publicationApi(h), enumeration);
}
export async function publishRecipe(h: Handle, name: string, scope: string) {
  const temp = mkdtempSync(join(tmpdir(), 'tendriller-e2e-'));
  try {
    const directory = join(temp, 'page'), selected = scaffold(name, directory);
    await verifyService(selected.requires);
    await activate(h, scope);
    await holdListener(h);
    return publishFiles(publicationApi(h), pack(directory));
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
export function localPageUrl(h: Handle): string {
  const url = new URL(h.page_url); url.port = serviceUrl.port; return url.href;
}
export async function signInFixture(context: BrowserContext, token = OWNER_TOKEN) {
  await context.addCookies([{ name: '__Host-tendriller', value: token, domain: serviceUrl.hostname, path: '/', secure: true, httpOnly: true, sameSite: 'Lax' }]);
}
export async function claim(context: BrowserContext, h: Handle) {
  const initial = await context.request.get(localPageUrl(h), { maxRedirects: 0 });
  expect(initial.status()).toBe(302);
  const auth = await context.request.get(initial.headers().location, { maxRedirects: 0 });
  if (auth.status() !== 303) return auth;
  const redeem = new URL(auth.headers().location); redeem.port = serviceUrl.port;
  const session = await context.request.get(redeem.href, { maxRedirects: 0 });
  expect(session.status()).toBe(303); return session;
}
export async function openClaimed(page: Page, h: Handle) {
  await claim(page.context(), h); await page.goto(localPageUrl(h));
  await page.waitForFunction(() => (window as any).tendril?.connected === true, { timeout: 15_000 });
}
export async function deletePage(h: Handle) { await agent(h, '', 'DELETE'); }
