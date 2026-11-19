import assert from 'node:assert/strict';
import test from 'node:test';
import { browserGates, validateBrowserReport } from './browser-report.mjs';

function fixture() {
  return { format: 'tendriller-collaboration-browser/v1', passed: true, error: null,
    source: { commit: 'a'.repeat(40), tree: 'b'.repeat(40), dirty: false },
    artifacts: ['@chronolog/peer-session', '@tendriller/core'].map(name => ({ name, sha256: 'c'.repeat(64),
      sourceCommit: 'd'.repeat(40), sourceTree: 'e'.repeat(40), sourceDirty: false })),
    fixtures: Array.from({ length: 9 }, (_, index) => ({ path: `fixture-${index}`, sha256: 'f'.repeat(64) })),
    publicBoundary: { siblingSourceImports: 0, applicationRetryQueues: 0, applicationOwnerProtocols: 0 },
    runtime: { browser: 'synthetic-validator-input', dependencies: { playwright: '1.65.0', esbuild: '0.28.2' } },
    wasm: { toolchain: 'emscripten-4.0.20', sha256: '1'.repeat(64), manifest: { wasmSha256: '1'.repeat(64) } },
    scenarios: ['shared', 'elected'].map(mode => ({ mode, ...Object.fromEntries(browserGates.map(name => [name, true])),
      signer: '2'.repeat(64), acceptedResultIds: ['accepted-contribution'] })),
    claims: { physicalDeviceQualified: false, deployedHostQualified: false, conversationalResumeQualified: false, exactlyOnceExternalEffects: false } };
}

test('browser evidence needs both actual ownership routes and every authored-view observation', () => {
  assert.equal(validateBrowserReport(fixture()).scenarios.length, 2);
  for (const mutate of [
    report => { report.scenarios[0].remoteRepaintPreservedFocus = false; },
    report => { report.scenarios[1].realSqlWasm = false; },
    report => { report.scenarios[1].mode = 'shared'; },
    report => { report.scenarios[0].acceptedResultIds = []; },
    report => { report.wasm.manifest.wasmSha256 = '3'.repeat(64); },
    report => { report.source.dirty = true; },
    report => { report.claims.physicalDeviceQualified = true; },
    report => { report.claims.conversationalResumeQualified = true; },
  ]) { const report = fixture(); mutate(report); assert.throws(() => validateBrowserReport(report)); }
});
