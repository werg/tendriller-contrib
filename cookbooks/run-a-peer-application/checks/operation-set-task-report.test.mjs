import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePeerTaskReport } from './operation-set-task-report.mjs';
import { syntheticTaskReport } from './operation-set-report-fixtures.mjs';
test('SQL schema accepts the synthetic validator fixture, not runtime evidence',()=>{assert.equal(validatePeerTaskReport(syntheticTaskReport()).protocol,'chronolog-crdt-v1');});
for(const [name,change] of [
 ['unrevised provisional claim',r=>{r.claims.after='accepted';}],['not independent writers',r=>{r.claims.independentProvisional=['accepted','rejected'];}],
 ['no late earlier DDL',r=>{r.schema.before='accepted';}],['schema not ordinary authored transaction',r=>{r.schema.ordinaryTransaction=false;}],
 ['partial DDL rollback',r=>{r.schema.rollback='accepted';}],['rollback leaked events',r=>{r.schema.rollbackEvents=1;}],['unauthorized cross-object drop',r=>{r.schema.unauthorizedDrop='accepted';}],
 ['stale schema query hidden',r=>{r.schema.staleQueryError=false;}],['uncaptured schema',r=>{r.schema.capturedSchemaCoherent=false;}],['no real engine',r=>{delete r.sqlEngine;}],
 ['tool retry not exact',r=>{r.tools.exactRetry=false;}],['reload lost state',r=>{r.reload.after='b'.repeat(64);}],
])test(`SQL schema rejects ${name}`,()=>{const report=syntheticTaskReport();change(report);assert.throws(()=>validatePeerTaskReport(report));});
for(const [name,change] of [['WASM parity merely labeled',r=>{r.sqlParity.actualWasm=false;}],['different native/WASM outcomes',r=>{r.sqlParity.outcomesWasm='b'.repeat(64);}],['WASM reload lost state',r=>{r.sqlParity.wasmReload='b'.repeat(64);}]])test(`SQL schema rejects ${name}`,()=>{const report=syntheticTaskReport();change(report);assert.throws(()=>validatePeerTaskReport(report));});
