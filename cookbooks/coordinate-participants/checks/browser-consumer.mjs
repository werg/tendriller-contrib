import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const reportPath = resolve(process.argv[2]), report = JSON.parse(await readFile(reportPath, 'utf8'));
const here = import.meta.dirname, site = join(here, 'site');
let browser, server;
try {
  await mkdir(site);
  const bundled = await build({ absWorkingDir: here, entryPoints: { app: 'source/page/app.mjs', worker: 'source/page/deployment/worker.mjs' },
    bundle: true, splitting: true, format: 'esm', platform: 'browser', target: 'es2022', outdir: site,
    outExtension: { '.js': '.mjs' }, metafile: true });
  assert.ok(Object.keys(bundled.metafile.inputs).some(path => path.includes('node_modules/@tendriller/core/collaboration/')));
  for (const name of ['board.html', 'discussion.html', 'style.css']) await cp(join(here, 'source/page', name), join(site, name));
  await cp(join(here, 'engine'), join(site, 'engine'), { recursive: true });
  server = createServer(async (request, response) => {
    try {
      const path = resolve(site, `.${new URL(request.url, 'http://localhost').pathname}`);
      if (!path.startsWith(site + sep)) { response.writeHead(404); response.end(); return; }
      const bytes = await readFile(path), type = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.wasm': 'application/wasm',
        '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.json': 'application/json' }[extname(path)] ?? 'application/octet-stream';
      response.writeHead(200, { 'content-type': type, 'cache-control': 'no-store',
        'cross-origin-opener-policy': 'same-origin', 'cross-origin-embedder-policy': 'require-corp' }); response.end(bytes);
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.COLLABORATION_CHROMIUM ? { executablePath: process.env.COLLABORATION_CHROMIUM } : {}) });
  report.runtime.browser = browser.version();
  for (const mode of ['shared', 'elected']) {
    const context = await browser.newContext({ viewport: { width: 1320, height: 1000 } });
    const board = await context.newPage(), discussion = await context.newPage(), errors = [];
    for (const page of [board, discussion]) { page.setDefaultTimeout(30_000); page.on('pageerror', error => errors.push(error.message)); }
    const profile = `authored-${mode}`, url = document => `${origin}/${document}?profile=${profile}&mode=${mode}`;
    const ready = async (page, entry) => {
      await page.goto(url(entry));
      await page.waitForFunction(() => document.querySelector('#status')?.dataset.state === 'ready');
      return page.evaluate(() => globalThis.fixtureReady);
    };
    const a = await ready(board, 'board.html'), b = await ready(discussion, 'discussion.html');
    assert.equal(a.deviceId, b.deviceId); assert.equal(a.endpoint.ownerInstanceId, b.endpoint.ownerInstanceId);
    assert.notEqual(a.endpoint.endpointIncarnation, b.endpoint.endpointIncarnation);
    assert.notEqual(a.endpoint.context.viewId, b.endpoint.context.viewId);
    await board.locator('#request-title').fill('Review this evidence'); await board.locator('#request-input').fill('The reviewed observation has a specific source.');
    await discussion.locator('#request-title').fill('Independent discussion draft');
    await board.locator('#request-submit').click();
    await board.locator('.task').waitFor();
    const taskId = await board.locator('.task').first().getAttribute('data-task-id');
    const card = page => page.locator(`.task[data-task-id="${taskId}"]`);
    await card(discussion).waitFor();
    assert.equal(await discussion.locator('#request-title').inputValue(), 'Independent discussion draft');
    await card(board).getByRole('button', { name: 'Claim this contribution' }).click();
    await card(board).locator('.contribution-form textarea').waitFor();
    await board.locator('#request-title').fill('Independent board draft');
    const contribution = card(board).locator('.contribution-form textarea');
    await contribution.fill('Unsent contribution survives another view.');
    await contribution.evaluate(element => { element.focus(); element.setSelectionRange(7, 19); });
    await card(discussion).getByRole('button', { name: 'Open conversation', exact: true }).click();
    await discussion.locator('#message').fill('A remote discussion update.'); await discussion.locator('#message-submit').click();
    await board.locator('#messages').getByText('A remote discussion update.', { exact: true }).waitFor();
    assert.equal(await contribution.inputValue(), 'Unsent contribution survives another view.');
    assert.deepEqual(await contribution.evaluate(element => ({ focused: document.activeElement === element,
      start: element.selectionStart, end: element.selectionEnd })), { focused: true, start: 7, end: 19 });
    assert.equal(await board.locator('#request-title').inputValue(), 'Independent board draft');
    const retained = await board.evaluate(() => globalThis.fixtureStore.pending().map(value => value.reference));
    assert.ok(retained.length >= 2);
    // In elected mode the first page hosts the dedicated owner. Reload a
    // follower here; owner termination is a separate recovery test below.
    const reloadedPage = mode === 'shared' ? board : discussion, oldAttachment = mode === 'shared' ? a : b;
    const localReferences = await reloadedPage.evaluate(() => globalThis.fixtureStore.pending().map(value => value.reference));
    await reloadedPage.reload(); await reloadedPage.waitForFunction(() => document.querySelector('#status')?.dataset.state === 'ready');
    const reopened = await reloadedPage.evaluate(() => globalThis.fixtureReady);
    assert.equal(reopened.deviceId, a.deviceId); assert.equal(reopened.endpoint.context.viewId, oldAttachment.endpoint.context.viewId);
    assert.notEqual(reopened.endpoint.endpointIncarnation, oldAttachment.endpoint.endpointIncarnation);
    assert.equal(await board.locator('#request-title').inputValue(), 'Independent board draft');
    assert.equal(await board.evaluate(id => globalThis.fixtureStore.readDraft(`result:${id}:review-1`).text, taskId), 'Unsent contribution survives another view.');
    assert.equal(await discussion.locator('#request-title').inputValue(), 'Independent discussion draft');
    assert.deepEqual(await reloadedPage.evaluate(() => globalThis.fixtureStore.pending().map(value => value.reference)), localReferences);
    // A new endpoint may review the draft; it cannot submit with a dead endpoint's
    // claim. Explicitly transfer and claim under the new incarnation first.
    const executor = reloadedPage;
    await card(executor).getByRole('button', { name: 'Restart this claim on this view' }).click();
    await card(executor).getByRole('button', { name: 'Claim this contribution' }).click();
    await card(executor).locator('.contribution-form textarea').fill('Accepted review with its current endpoint fence.');
    await card(executor).getByRole('button', { name: 'Submit reviewed result' }).click();
    await card(board).getByText('Contribution accepted', { exact: true }).waitFor();
    await card(board).locator('.synthesis-form textarea').fill('Reviewed synthesis based on the accepted contribution.');
    await card(board).getByRole('button', { name: 'Accept synthesis', exact: true }).click();
    await card(discussion).getByText(/Accepted synthesis/u).waitFor();
    const outcome = await board.evaluate(async id => (await globalThis.fixtureSession.query('collab.task', { taskId: id })).value, taskId);
    assert.equal(outcome.task.status, 'completed'); assert.equal(outcome.results.filter(value => value.disposition === 'accepted').length, 1);
    assert.equal(outcome.task.source.endpointId, a.endpoint.endpointId);
    assert.equal(outcome.claims[0].endpointIncarnation, reopened.endpoint.endpointIncarnation);
    await board.screenshot({ path: join(dirname(reportPath), `${mode}-board.png`), fullPage: true });
    await discussion.screenshot({ path: join(dirname(reportPath), `${mode}-discussion.png`), fullPage: true });
    await discussion.evaluate(() => globalThis.fixtureOwner.suspend()); await discussion.evaluate(() => globalThis.fixtureOwner.resume());
    assert.equal((await discussion.evaluate(() => globalThis.fixtureReady)).endpoint.endpointIncarnation,
      (mode === 'shared' ? b : reopened).endpoint.endpointIncarnation);
    await discussion.evaluate(() => globalThis.fixtureOwner.detach()); await discussion.close();
    assert.equal(await board.evaluate(async id => (await globalThis.fixtureSession.query('collab.task', { taskId: id })).value.task.status, taskId), 'completed');
    const survivor = await context.newPage(); survivor.setDefaultTimeout(30_000); const c = await ready(survivor, 'discussion.html');
    if (mode === 'elected') {
      await board.close(); await survivor.waitForFunction(() => globalThis.fixtureSession.status.phase === 'closed');
      await survivor.reload(); await survivor.waitForFunction(() => document.querySelector('#status')?.dataset.state === 'ready');
      const successor = await survivor.evaluate(() => globalThis.fixtureReady);
      assert.equal(successor.deviceId, a.deviceId); assert.notEqual(successor.endpoint.ownerInstanceId, c.endpoint.ownerInstanceId);
    } else {
      await board.close();
      assert.equal((await survivor.evaluate(() => globalThis.fixtureReady)).endpoint.ownerInstanceId, c.endpoint.ownerInstanceId);
    }
    const after = await survivor.evaluate(async ({ id, reference }) => ({ task: (await globalThis.fixtureSession.query('collab.task', { taskId: id })).value.task,
      operation: await globalThis.fixtureSession.operations.get(reference.operationId, { author: reference.author }) }), { id: taskId, reference: retained[0] });
    assert.equal(after.task.status, 'completed'); assert.equal(after.operation.status, 'applied');
    assert.deepEqual(errors, []);
    report.scenarios.push({ mode, realSqlWasm: true, twoDocuments: true, independentDrafts: true, remoteRepaintPreservedFocus: true,
      draftAndOperationAfterReload: true, addressedRequest: true, explicitEndpointReassignment: true,
      acceptedContributionAndSynthesis: true, suspendResume: true, detachIsolation: true, retainedAfterOwnerExit: true,
      signer: a.deviceId, sourceEndpoint: a.endpoint.endpointId, acceptedResultIds: outcome.task.aggregate.resultIds });
    await context.close(); console.log(`✓ authored ${mode} SQL views`);
  }
  report.passed = true;
} catch (error) { report.passed = false; report.error = error.stack ?? String(error); throw error; }
finally {
  await browser?.close();
  if (server?.listening) await new Promise(done => server.close(done));
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}
