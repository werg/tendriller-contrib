import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const reportPath = resolve(process.argv[2]), report = JSON.parse(await readFile(reportPath, 'utf8'));
const here = import.meta.dirname, site = join(here, 'site');
let browser, server, activePages = [];
report.diagnostics = { httpErrors: [], browser: [] };
const diagnostic = (kind, value) => { report.diagnostics[kind].push(value); if (report.diagnostics[kind].length > 80) report.diagnostics[kind].shift(); };
try {
  await mkdir(site);
  const bundled = await build({ absWorkingDir: here, entryPoints: { app: 'source/page/app.mjs', worker: 'source/page/deployment/worker.mjs' },
    bundle: true, splitting: true, format: 'esm', platform: 'browser', target: 'es2022', outdir: site,
    outExtension: { '.js': '.mjs' }, metafile: true });
  // Prove both installed public owners are bundled without depending on the
  // SDK's private directory layout or accepting the domain client alone.
  const coreRoot = join(here, 'node_modules/@tendriller/core');
  const core = JSON.parse(await readFile(join(coreRoot, 'package.json'), 'utf8'));
  const inputs = new Set(Object.keys(bundled.metafile.inputs).map(path => resolve(here, path)));
  for (const name of ['./browser-owner', './worker-owner']) {
    const target = core.exports[name]?.import;
    assert.ok(typeof target === 'string' && target.startsWith('./') && !target.split('/').includes('..'),
      `Installed SDK must declare an import target for ${name}`);
    assert.ok(inputs.has(resolve(coreRoot, target)), `Browser bundle omits the installed public ${name}`);
  }
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
    } catch (error) { diagnostic('httpErrors', { url: request.url, message: error.message }); response.writeHead(404); response.end(); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.COLLABORATION_CHROMIUM ? { executablePath: process.env.COLLABORATION_CHROMIUM } : {}) });
  report.runtime.browser = browser.version();
  for (const mode of ['auto', 'elected']) for (const viewportWidth of [1320,320]) {
    const context = await browser.newContext({ viewport: { width: viewportWidth, height: 1000 } });
    context.on('console', message => { if (['error', 'warning'].includes(message.type())) diagnostic('browser', { mode, type: message.type(), text: message.text(), location: message.location() }); });
    context.on('requestfailed', request => diagnostic('browser', { mode, type: 'requestfailed', url: request.url(), error: request.failure() }));
    const board = await context.newPage(), discussion = await context.newPage(), errors = [];
    activePages = [board, discussion];
    for (const page of [board, discussion]) { page.setDefaultTimeout(30_000); page.on('pageerror', error => errors.push(error.message)); }
    const profile = `authored-${mode}-${viewportWidth}`, url = document => `${origin}/${document}?profile=${profile}&mode=${mode}`;
    const ready = async (page, entry) => {
      await page.goto(url(entry));
      try {
        await page.waitForFunction(() => ['ready', 'error'].includes(document.querySelector('#status')?.dataset.state));
        const status = await page.locator('#status').evaluate(element => ({ state: element.dataset.state, text: element.textContent }));
        assert.equal(status.state, 'ready', `${mode} ${entry}: ${status.text}`);
        return await page.evaluate(() => globalThis.fixtureReady);
      } catch (error) {
        const details = { mode, entry, message: error.message, pageErrors: errors.slice(),
          status: await page.locator('#status').textContent().catch(() => null),
          dom: await page.locator('body').innerText().catch(() => null) };
        report.diagnostics.bootstrap = details; console.error(JSON.stringify(details, null, 2));
        await page.screenshot({ path: join(dirname(reportPath), `${mode}-${viewportWidth}-bootstrap-failed.png`), fullPage: true }).catch(() => undefined);
        throw error;
      }
    };
    const a = await ready(board, 'board.html'), b = await ready(discussion, 'discussion.html');
    assert.equal(a.ownerMode, 'elected'); assert.equal(b.ownerMode, 'elected');
    assert.equal(await board.evaluate(() => globalThis.fixtureSharedStorageRejection), 'OWNER_STORAGE_UNSUPPORTED');
    assert.equal(await discussion.evaluate(() => globalThis.fixtureSharedStorageRejection), 'OWNER_STORAGE_UNSUPPORTED');
    assert.equal(a.deviceId, b.deviceId); assert.equal(a.endpoint.ownerInstanceId, b.endpoint.ownerInstanceId);
    assert.notEqual(a.endpoint.endpointIncarnation, b.endpoint.endpointIncarnation);
    assert.notEqual(a.endpoint.context.viewId, b.endpoint.context.viewId);
    await board.locator('#recipient').selectOption(a.deviceId);
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
    // A failed repaint must not switch the message destination behind the UI.
    const previousThread = await board.locator('#thread-title').textContent();
    const beforeFailedPaint = await board.evaluate(() => globalThis.fixtureStore.pending().length);
    await board.evaluate(() => {
      globalThis.fixtureOriginalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function(key) {
        if (key.includes(':draft:result')) throw Error('Injected draft read failure');
        return globalThis.fixtureOriginalGetItem.call(this, key);
      };
    });
    await board.locator('#workspace-conversation').click();
    await board.waitForFunction(() => document.querySelector('#status').textContent.includes('Injected draft read failure'));
    assert.equal(await board.locator('#message-submit').isDisabled(), true);
    assert.equal(await board.locator('#thread-title').textContent(), previousThread);
    await board.evaluate(() => document.querySelector('#message-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(await board.evaluate(() => globalThis.fixtureStore.pending().length), beforeFailedPaint);
    await board.evaluate(() => { Storage.prototype.getItem = globalThis.fixtureOriginalGetItem; });
    await board.locator('#refresh-workspace').click();
    await board.waitForFunction(() => !document.querySelector('#message-submit').disabled);
    await card(board).getByRole('button', { name: /^(Open conversation|Selected conversation)$/ }).click();
    await board.waitForFunction(title => document.querySelector('#thread-title').textContent === title, previousThread);
    // Selecting an already selected conversation keeps its title throughout the
    // asynchronous read. Wait for the handler's final, visible focus action
    // before starting the independent remote-update preservation measurement.
    await board.waitForFunction(() => document.activeElement === document.querySelector('#message'));
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
    // Both supported SQL selections use the fenced dedicated owner. Reload a
    // follower here; owner termination is a separate recovery test below.
    const reloadedPage = discussion, oldAttachment = b;
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
    await context.setOffline(true);
    let offlineObservation;
    try {
      offlineObservation=await board.evaluate(async()=>{
        const operation=await globalThis.fixtureClient.message({threadId:'offline-proof',text:'Saved with all network access disabled',messageId:'offline-proof'});
        const stored=operation.stored;await operation.materialized({timeoutMs:30_000});const inspection=await operation.inspect();
        let finalityError;try{await operation.finalized({timeoutMs:1000});}catch(error){finalityError=error.code??error.message;}
        return{stored,inspection,finalityError};
      });
    } finally {await context.setOffline(false);}
    assert.equal(offlineObservation.stored,true);assert.equal(offlineObservation.inspection.materialized.outcome,'accepted');assert.equal(offlineObservation.inspection.finalized,false);
    assert.equal(offlineObservation.finalityError,'FINALITY_UNSUPPORTED');assert.match(offlineObservation.inspection.materialized.revision.digest,/^[a-f0-9]{64}$/u);
    assert.equal(offlineObservation.inspection.materialized.revision.view,'local');
    // Grow the actual authored workspace through public commands. A continuation
    // stays on its captured revision while another document writes new work.
    const createRequests = async (page, ids) => page.evaluate(async ids => {
      for (const id of ids) {
        const signer = globalThis.fixtureSession.identity.publicKey;
        const operation = await globalThis.fixtureClient.request({ interactionId: id, kind: 'reviewEvidence', title: `Paged ${id}`,
          input: { text: 'Evidence for paging.' }, context: { source: 'browser-qualification' },
          target: { kind: 'signer', deviceId: signer }, responsePolicy: 'one',
          slots: [{ slotId: 'review', eligibleSigners: [signer], label: 'Review' }] });
        const result = await operation.materialized({ signal: AbortSignal.timeout(30_000) });
        if (result.outcome !== 'accepted') throw Error(JSON.stringify(result));
      }
    }, ids);
    await createRequests(discussion, Array.from({ length: 9 }, (_, index) => `page-task-${index}`));
    await board.waitForFunction(() => document.querySelector('#task-page').textContent.includes('8 of 10 requests'));
    await board.locator('#tasks-next').click();
    await board.waitForFunction(() => document.querySelector('#task-page').textContent.startsWith('Page 2'));
    const heldTaskPage = await board.locator('#task-page').textContent();
    const heldTaskIds = await board.locator('.task').evaluateAll(cards => cards.map(card => card.dataset.taskId));
    await createRequests(discussion, ['page-task-after-capture']);
    await board.locator('#shared-updates').waitFor({ state: 'visible' });
    assert.equal(await board.locator('#task-page').textContent(), heldTaskPage);
    assert.deepEqual(await board.locator('.task').evaluateAll(cards => cards.map(card => card.dataset.taskId)), heldTaskIds);
    assert.ok(heldTaskIds.includes(taskId), 'The selected request stays available outside the current task page');
    await board.locator('#refresh-workspace').click();
    await board.waitForFunction(() => document.querySelector('#task-page').textContent.includes('8 of 11 requests'));
    assert.equal(await board.locator('#request-title').inputValue(), 'Independent board draft');
    await board.locator('#message').fill('Unsent message while browsing retained conversation.');
    const postMessages = async (page, messages) => page.evaluate(async ({ taskId, messages }) => {
      for (const text of messages) {
        const operation = await globalThis.fixtureClient.message({ threadId: taskId, messageId: crypto.randomUUID(), text });
        const result = await operation.materialized({ signal: AbortSignal.timeout(30_000) });
        if (result.outcome !== 'accepted') throw Error(JSON.stringify(result));
      }
    }, { taskId, messages });
    await postMessages(discussion, Array.from({ length: 17 }, (_, index) => `Retained conversation ${index}`));
    await board.waitForFunction(() => document.querySelector('#thread-page').textContent.includes('16 of 18 messages'));
    await board.locator('#thread-next').click();
    await board.waitForFunction(() => document.querySelector('#thread-page').textContent.startsWith('Page 2'));
    const heldThreadPage = await board.locator('#thread-page').textContent();
    await postMessages(discussion, ['Message after captured conversation']);
    await board.locator('#shared-updates').waitFor({ state: 'visible' });
    assert.equal(await board.locator('#thread-page').textContent(), heldThreadPage);
    assert.equal(await board.locator('#messages').getByText('Message after captured conversation', { exact: true }).count(), 0);
    await board.locator('#refresh-workspace').click();
    await board.waitForFunction(() => document.querySelector('#thread-page').textContent.includes('16 of 19 messages'));
    await board.locator('#thread-next').click();
    await board.locator('#messages').getByText('Message after captured conversation', { exact: true }).waitFor();
    assert.equal(await board.locator('#message').inputValue(), 'Unsent message while browsing retained conversation.');
    await board.screenshot({ path: join(dirname(reportPath), `${mode}-${viewportWidth}-board.png`), fullPage: true });
    await discussion.screenshot({ path: join(dirname(reportPath), `${mode}-${viewportWidth}-discussion.png`), fullPage: true });
    await discussion.evaluate(() => globalThis.fixtureOwner.suspend()); await discussion.evaluate(() => globalThis.fixtureOwner.resume());
    assert.equal((await discussion.evaluate(() => globalThis.fixtureReady)).endpoint.endpointIncarnation,
      reopened.endpoint.endpointIncarnation);
    await discussion.evaluate(() => globalThis.fixtureOwner.detach()); await discussion.close();
    assert.equal(await board.evaluate(async id => (await globalThis.fixtureSession.query('collab.task', { taskId: id })).value.task.status, taskId), 'completed');
    const survivor = await context.newPage(); survivor.setDefaultTimeout(30_000); const c = await ready(survivor, 'discussion.html');
    // Physical owner loss is distinct from an individual RPC deadline. A finite
    // call started within the 15s silence window can retain its own 30s budget.
    // UI observers remain active; passive waits never supply this protection.
    const ownerExitFence = await survivor.evaluate(() => {
      if (!('boundedRequest' in globalThis.fixtureSession)) throw Error('CONTRACT_INCOMPATIBLE: boundedRequest is required');
      const sample = () => ({ at: performance.now(), phase: globalThis.fixtureSession.status.phase,
        boundedRequest: globalThis.fixtureSession.boundedRequest });
      globalThis.fixtureOwnerFence = { samples: [], dropped: 0 };
      return { publicBoundedRequest: true, livenessTimeoutMs: 15_000, requestTimeoutMs: 30_000,
        observationTimeoutMs: 45_000, clockOrigin: performance.timeOrigin, beforeClose: sample() };
    });
    (report.ownerExitFences ??= []).push(ownerExitFence);
    await board.close();
    ownerExitFence.afterClose = await survivor.evaluate(() => ({ at: performance.now(),
      phase: globalThis.fixtureSession.status.phase, boundedRequest: globalThis.fixtureSession.boundedRequest }));
    try {
      await survivor.waitForFunction(() => {
        const trace = globalThis.fixtureOwnerFence;
        const sample = { at: performance.now(), phase: globalThis.fixtureSession.status.phase,
          boundedRequest: globalThis.fixtureSession.boundedRequest };
        const previous = trace.samples.at(-1);
        if (!previous || sample.phase !== previous.phase || sample.at - previous.at >= 1000 ||
            sample.boundedRequest?.startedAt !== previous.boundedRequest?.startedAt) {
          trace.samples.push(sample); if (trace.samples.length > 64) { trace.samples.shift(); trace.dropped++; }
        }
        if (sample.phase !== 'closed') return false;
        trace.closedAt = sample.at; return true;
      }, undefined, { timeout: ownerExitFence.observationTimeoutMs });
    } finally {
      Object.assign(ownerExitFence, await survivor.evaluate(() => globalThis.fixtureOwnerFence));
    }
    await survivor.reload(); await survivor.waitForFunction(() => document.querySelector('#status')?.dataset.state === 'ready');
    const successor = await survivor.evaluate(() => globalThis.fixtureReady);
    assert.equal(successor.deviceId, a.deviceId); assert.notEqual(successor.endpoint.ownerInstanceId, c.endpoint.ownerInstanceId);
    const after = await survivor.evaluate(async ({ id, reference }) => ({ task: (await globalThis.fixtureSession.query('collab.task', { taskId: id })).value.task,
      operation: await (await globalThis.fixtureSession.operations.get(reference.proposalId)).inspect() }), { id: taskId, reference: retained[0] });
    assert.equal(after.task.status, 'completed'); assert.equal(after.operation.stored,true);assert.equal(after.operation.materialized.outcome,'accepted');
    assert.deepEqual(errors, []);
    report.scenarios.push({ mode, viewportWidth, offlineLocalSubmission:true, provisionalNotFinal:true, operationSetRevision:true,ownerMode: a.ownerMode, sharedStorageUnsupported: true, capabilityRouteObserved: true, realSqlWasm: true, twoDocuments: true, independentDrafts: true, remoteRepaintPreservedFocus: true,
      draftAndOperationAfterReload: true, addressedRequest: true, explicitEndpointReassignment: true,
      acceptedContributionAndSynthesis: true, suspendResume: true, detachIsolation: true, retainedAfterOwnerExit: true,
      boundedTaskPages: true, stableThreadPages: true, paginationPreservedDrafts: true,
      ownerExitFence, signer: a.deviceId, sourceEndpoint: a.endpoint.endpointId, acceptedResultIds: outcome.task.aggregate.resultIds });
    await context.close(); console.log(`✓ authored ${mode} SQL views`);
  }
  report.passed = true;
} catch (error) {
  report.passed = false; report.error = error.stack ?? String(error);
  report.diagnostics.pages = await Promise.all(activePages.filter(page => !page.isClosed()).map(async page => ({
    path: new URL(page.url()).pathname,
    text: await page.locator('body').innerText().catch(() => null),
    state: await page.evaluate(async () => ({
      selectedDraft: globalThis.fixtureStore?.readDraft(),
      snapshot: await globalThis.fixtureClient?.snapshot(),
    })).catch(cause => ({ error: cause.message })),
  })));
  console.error(JSON.stringify(report.diagnostics.pages));
  throw error;
}
finally {
  try {
    await browser?.close();
  } finally {
    try {
      if (server?.listening) await new Promise(done => server.close(done));
    } finally {
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    }
  }
}
