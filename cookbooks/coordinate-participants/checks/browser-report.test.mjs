import assert from 'node:assert/strict';
import test from 'node:test';
import { browserGates, validateBrowserReport } from './browser-report.mjs';

function fixture() {
  return { format: 'tendriller-collaboration-authored-browser/v1', passed: true, error: null,
    source: { commit: 'a'.repeat(40), tree: 'b'.repeat(40), dirty: false },
    artifacts: ['@chronolog/authority','@chronolog/peer-session', '@tendriller/core'].map(name => ({ name, sha256: 'c'.repeat(64),
      sourceCommit: 'd'.repeat(40), sourceTree: 'e'.repeat(40), sourceDirty: false })),
    fixtures: Array.from({ length: 9 }, (_, index) => ({ path: `fixture-${index}`, sha256: 'f'.repeat(64) })),
    publicBoundary: { siblingSourceImports: 0, applicationRetryQueues: 0, applicationOwnerProtocols: 0 },
    runtime: { browser: 'synthetic-validator-input', dependencies: { playwright: '1.65.0', esbuild: '0.28.2' } },
    wasm: { toolchain: 'emscripten-4.0.20', sha256: '1'.repeat(64), manifest: { wasmSha256: '1'.repeat(64) } },
    scenarios: ['auto', 'elected'].flatMap(mode => [1320,320].map(viewportWidth=>({ mode, viewportWidth, ownerMode: 'elected', ...Object.fromEntries(browserGates.map(name => [name, true])),
      ownerExitFence: { publicBoundedRequest: true, livenessTimeoutMs: 15_000, requestTimeoutMs: 30_000,
        observationTimeoutMs: 45_000, clockOrigin: 100_000, beforeClose: { at: 100, phase: 'ready', boundedRequest: null },
        afterClose: { at: 101, phase: 'ready', boundedRequest: null }, closedAt: 30_102, dropped: 0,
        samples: [{ at: 110, phase: 'ready', boundedRequest: { startedAt: 109, deadline: 30_109 } },
          { at: 30_102, phase: 'closed', boundedRequest: null }] },
      signer: '2'.repeat(64), acceptedResultIds: ['accepted-contribution'] }))),
    claims: { physicalDeviceQualified: false, deployedHostQualified: false, conversationalResumeQualified: false, exactlyOnceExternalEffects: false } };
}

test('browser evidence needs supported SQL capability selection and every authored-view observation', () => {
  assert.equal(validateBrowserReport(fixture()).scenarios.length, 4);
  for (const mutate of [
    report => { report.scenarios[0].remoteRepaintPreservedFocus = false; },
    report => { report.scenarios[1].realSqlWasm = false; },
    report => { report.scenarios[1].mode = 'shared'; },
    report => { report.scenarios[0].ownerMode = 'shared'; },
    report => { report.scenarios[0].sharedStorageUnsupported = false; },
    report => { report.scenarios[0].stableThreadPages = false; },
    report => {report.scenarios[0].offlineLocalSubmission=false;},
    report => {report.scenarios[0].provisionalNotFinal=false;},
    report => {report.scenarios[0].viewportWidth=800;},
    report => {report.format='tendriller-collaboration-browser/v1';},
    report => { report.scenarios[0].acceptedResultIds = []; },
    report => { report.wasm.manifest.wasmSha256 = '3'.repeat(64); },
    report => { report.source.dirty = true; },
    report => { report.claims.physicalDeviceQualified = true; },
    report => { report.claims.conversationalResumeQualified = true; },
  ]) { const report = fixture(); mutate(report); assert.throws(() => validateBrowserReport(report)); }
});

test('physical owner fencing needs measured bounded grace without changing RPC budgets', () => {
  for (const mutate of [
    fence => { fence.observationTimeoutMs = 60_000; },
    fence => { fence.requestTimeoutMs = 45_000; },
    fence => { fence.closedAt = fence.afterClose.at + 45_001; },
    fence => { fence.samples[0].boundedRequest.deadline = 60_109; },
    fence => { fence.samples[0].boundedRequest.startedAt = NaN; },
    fence => { fence.samples.at(-1).phase = 'ready'; },
    fence => { fence.publicBoundedRequest = false; },
  ]) { const report = fixture(); mutate(report.scenarios[0].ownerExitFence); assert.throws(() => validateBrowserReport(report)); }
  assert.equal(validateBrowserReport(fixture()).scenarios.length, 4);
});
