import assert from 'node:assert/strict';

export const browserGates = Object.freeze(['realSqlWasm', 'twoDocuments', 'independentDrafts', 'remoteRepaintPreservedFocus',
  'draftAndOperationAfterReload', 'addressedRequest', 'explicitEndpointReassignment', 'acceptedContributionAndSynthesis',
  'suspendResume', 'detachIsolation', 'retainedAfterOwnerExit']);

export function validateBrowserReport(report, { allowDirty = false } = {}) {
  const hex = (value, length) => assert.match(value ?? '', new RegExp(`^[a-f0-9]{${length}}$`, 'u'));
  assert.equal(report.format, 'tendriller-collaboration-browser/v1');
  assert.equal(report.passed, true); assert.equal(report.error, null);
  hex(report.source.commit, 40); hex(report.source.tree, 40);
  if (!allowDirty) assert.equal(report.source.dirty, false);
  assert.deepEqual(report.artifacts.map(value => value.name).sort(), ['@chronolog/peer-session', '@tendriller/core']);
  for (const artifact of report.artifacts) {
    hex(artifact.sha256, 64); hex(artifact.sourceCommit, 40); hex(artifact.sourceTree, 40);
    if (!allowDirty) assert.equal(artifact.sourceDirty, false);
  }
  assert.ok(report.fixtures.length >= 8);
  for (const fixture of report.fixtures) hex(fixture.sha256, 64);
  assert.equal(report.publicBoundary.siblingSourceImports, 0);
  assert.equal(report.publicBoundary.applicationRetryQueues, 0);
  assert.equal(report.publicBoundary.applicationOwnerProtocols, 0);
  assert.equal(report.runtime.dependencies.playwright, '1.65.0'); assert.equal(report.runtime.dependencies.esbuild, '0.28.2');
  assert.ok(typeof report.runtime.browser === 'string' && report.runtime.browser.length > 0);
  assert.equal(report.wasm.toolchain, 'emscripten-4.0.20'); hex(report.wasm.sha256, 64);
  assert.equal(report.wasm.manifest.wasmSha256, report.wasm.sha256);
  assert.deepEqual(report.scenarios.map(value => value.mode).sort(), ['elected', 'shared']);
  for (const scenario of report.scenarios) {
    for (const gate of browserGates) assert.equal(scenario[gate], true, `Missing ${scenario.mode} browser observation: ${gate}`);
    hex(scenario.signer, 64); assert.ok(scenario.acceptedResultIds.length > 0);
  }
  assert.equal(report.claims.physicalDeviceQualified, false);
  assert.equal(report.claims.deployedHostQualified, false);
  assert.equal(report.claims.conversationalResumeQualified, false);
  assert.equal(report.claims.exactlyOnceExternalEffects, false);
  return { format: 'tendriller-collaboration-browser-summary/v1', source: report.source, artifacts: report.artifacts,
    runtime: report.runtime, wasm: report.wasm, scenarios: report.scenarios, claims: report.claims };
}
