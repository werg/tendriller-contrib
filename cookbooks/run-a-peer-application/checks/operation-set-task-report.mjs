import assert from 'node:assert/strict';
import { hex, validateReportBoundary } from './operation-set-report.mjs';
export function validatePeerTaskReport(report) {
  validateReportBoundary(report, 'operation-set-consumer/v1'); assert.equal(report.topology, 'independent-packed-tasks');
  const claims = report.claims; assert.deepEqual(claims?.independentProvisional, ['accepted', 'accepted']);
  hex(claims.revisedProposal); assert.equal(claims.before, 'accepted'); assert.equal(claims.after, 'rejected'); hex(claims.winner);
  assert.equal(claims.stateDigests.length, 2); hex(claims.stateDigests[0]); assert.equal(claims.stateDigests[1], claims.stateDigests[0]);
  assert.equal(claims.reactiveDigest, claims.stateDigests[0]);
  const schema = report.schema; hex(schema?.initializationProposal); assert.equal(schema.ordinaryTransaction, true);
  assert.equal(schema.before, 'rejected'); assert.equal(schema.after, 'accepted'); assert.equal(schema.rollback, 'rejected');
  assert.equal(schema.unauthorizedDrop, 'rejected'); assert.equal(schema.alter, 'accepted'); assert.equal(schema.drop, 'accepted');
  assert.equal(schema.staleQueryError, true); assert.equal(schema.capturedSchemaCoherent, true); assert.equal(schema.rollbackEvents, 0);
  assert.equal(report.tools?.exactRetry, true); assert.equal(report.tools.callerScoped, true); hex(report.tools.proposalId);
  const reload = report.reload; hex(reload?.identityBefore); assert.equal(reload.identityAfter, reload.identityBefore);
  hex(reload.before); assert.equal(reload.after, reload.before); assert.equal(reload.cachedAuthority, true);
  assert.ok(report.sqlEngine, 'Record actual packed native engine provenance');
  const parity=report.sqlParity;assert.equal(parity?.actualWasm,true);hex(parity.nativeManifest);assert.equal(parity.wasmManifest,parity.nativeManifest);
  for(const field of ['stateNative','stateWasm','outcomesNative','outcomesWasm','wasmReload','wasmSha256','loaderSha256'])hex(parity[field]);
  assert.equal(parity.stateWasm,parity.stateNative);assert.equal(parity.outcomesWasm,parity.outcomesNative);assert.equal(parity.wasmReload,parity.stateNative);
  return { format: 'operation-set-sql-summary/v1', protocol: report.protocol, artifacts: report.artifacts,
    executionManifestDigest: report.executionManifestDigest, schema, claims,
    limitations: ['Provisional contested claims are revisable and cannot authorize irreversible effects.', 'Native SQL alone does not qualify browser WASM parity.'] };
}
