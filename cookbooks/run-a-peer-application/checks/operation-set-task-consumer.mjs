// Real native SQL engine, empty platform bootstrap, ordinary authored DDL.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { createApplicationSession, createLiveView, program, sqlStatement, emit, platformOp,
  GROUP_COLLECTIVE_ID, hexToBytes, bytesToHex, executionManifestArtifacts, createScopedApplicationTools } from '@chronolog/peer-session';
import { openNativeDevice } from '@chronolog/peer-session/native';
import { createSqlMaterializationRuntime } from '@chronolog/peer-session/sql';
import { createNativeSqlEngine } from '@chronolog/peer-session/sql-native';
import { createNodeWasmSqlEngine, loadNodeWasmEngine } from '@chronolog/peer-session/sql-wasm';
import { taskBoard, initializeTaskBoard } from './operation-set-task-definition.mjs';
import { createFixtureAuthority } from './operation-set-authority.mjs';
import { connectDirect } from './operation-set-participation.mjs';
const path = resolve(process.argv[2]), report = JSON.parse(await readFile(path, 'utf8'));
const directory = join(dirname(path), 'stores'); await mkdir(directory, { recursive: true });
const sessions = [], devices = [], links = [];
async function query(session) { const view = await session.readView(); try { return taskBoard.queries.board.read(view, {}); } finally { view.release(); } }
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
try {
  for (const name of ['root', 'member', 'wasm']) devices.push(await openNativeDevice({ path: join(directory, `${name}.sqlite`), create: true }));
  const applicationId = randomBytes(32).toString('hex'), key = new Uint8Array(randomBytes(32)), engine = createNativeSqlEngine();
  const manifest = bytesToHex((await executionManifestArtifacts(engine.executionManifest)).executionManifestDigest);
  const authority = await createFixtureAuthority({ applicationId, signer: devices[0].identity, devices, epochKey: key, executionManifestDigest: manifest });
  const open = async (device, name, cached = false) => {
    const session = await createApplicationSession({ device, definition: taskBoard,
      ...(cached ? { applicationId } : { authority, epochKeys: new Map([[0, key]]) }),
      createMaterializer: ({ rootPrincipal }) => createSqlMaterializationRuntime({ engine, rootPrincipal, path: join(directory, `${name}-sql.sqlite`), checkpointEvery: 1 }) });
    sessions.push(session); return session;
  };
  const a = await open(devices[0], 'a'), b = await open(devices[1], 'b');
  report.executionManifestDigest = manifest;
  const submit = async (session, operationId, authorTimestampMs, transaction) => {
    const operation = await session.submit({ operationId, authorTimestampMs, program: transaction });
    await operation.materialized(); return operation;
  };
  const command = async (session, name, input, operationId, authorTimestampMs) => {
    const operation = await session.command(name, input, { operationId, authorTimestampMs }); await operation.materialized(); return operation;
  };
  const init = await submit(a, 'schema-init', 10n, initializeTaskBoard);
  assert.equal((await init.materialized()).outcome, 'accepted');
  const grant = await submit(a, 'members', 11n, program(platformOp.setMembers(GROUP_COLLECTIVE_ID,
    [{ member: hexToBytes(b.identity.publicKey), role: 'member' }])));
  assert.equal((await grant.materialized()).outcome, 'accepted');
  let link = await connectDirect(a, b); links.push(link); await link.synchronize();
  const accepted = await submit(b, 'accept', 12n, program(platformOp.acceptMembership(GROUP_COLLECTIVE_ID)));
  assert.equal((await accepted.materialized()).outcome, 'accepted'); await link.synchronize();
  const created = await command(a, 'addTask', { taskId: 'race', title: 'Provisional claim race' }, 'add-race', 20n);
  assert.equal((await created.materialized()).outcome, 'accepted'); await link.synchronize(); await link.close();
  const [later, earlier] = await Promise.all([
    command(a, 'claimTask', { taskId: 'race' }, 'a-claim', 40n), command(b, 'claimTask', { taskId: 'race' }, 'b-claim', 30n),
  ]);
  const before = await later.materialized(); assert.equal(before.outcome, 'accepted'); assert.equal((await earlier.materialized()).outcome, 'accepted');
  const live = createLiveView(a, view => taskBoard.queries.board.read(view, {})); await live.ready();
  link = await connectDirect(a, b); links.push(link); await link.synchronize();
  const after = await later.materialized(); assert.equal(after.outcome, 'rejected');
  const aView = await query(a), bView = await query(b); assert.deepEqual(aView, bView);
  assert.equal(aView.tasks.find(row => row.id === 'race').claimedBy, b.identity.publicKey);
  assert.deepEqual((await live.refresh()).value, aView);
  report.claims = { independentProvisional: ['accepted', (await earlier.materialized()).outcome],
    revisedProposal: later.id, before: before.outcome, after: after.outcome, winner: b.identity.publicKey,
    stateDigests: [hash(aView), hash(bView)], reactiveDigest: hash(live.snapshot.value) };
  const wrong = await command(a, 'finishTask', { taskId: 'race' }, 'wrong-finish', 45n); assert.equal((await wrong.materialized()).outcome, 'rejected');
  await link.synchronize();
  // A local rejected write is revised after ordinary earlier DDL arrives.
  const insert = await submit(a, 'late-insert', 70n, program(sqlStatement("INSERT INTO late(id,value) VALUES(1,'ready')")));
  const rejected = await insert.materialized(); assert.equal(rejected.outcome, 'rejected');
  const captured = await a.readView();
  const create = await submit(a, 'late-create', 60n, program(sqlStatement('CREATE TABLE late(id INTEGER PRIMARY KEY,value TEXT)')));
  assert.equal((await create.materialized()).outcome, 'accepted'); assert.equal((await insert.materialized()).outcome, 'accepted');
  assert.throws(() => captured.query('SELECT * FROM late')); captured.release();
  const schemaLive = createLiveView(a, view => view.query('SELECT value FROM late').rows); await schemaLive.ready();
  const rollback = await submit(a, 'rollback', 80n, program(sqlStatement('CREATE TABLE rolled_back(id INTEGER PRIMARY KEY)'),
    sqlStatement("INSERT INTO late(id,value) VALUES(2,'rollback')"), emit('rollback', { ignored: true }), sqlStatement("SELECT chronolog_assert(0,'rollback')")));
  assert.equal((await rollback.materialized()).outcome, 'rejected');
  let view = await a.readView(); assert.deepEqual(view.query("SELECT name FROM sqlite_schema WHERE name='rolled_back'").rows, []);
  assert.deepEqual(view.query('SELECT value FROM late').rows, [['ready']]); assert.equal(view.readEvents({ topics: ['rollback'] }).events.length, 0); view.release();
  const denied = await submit(b, 'cross-object-drop', 90n, program(sqlStatement('DROP TABLE tasks')));
  assert.equal((await denied.materialized()).outcome, 'rejected');
  const alter = await submit(a, 'schema-alter', 100n, program(sqlStatement('ALTER TABLE late ADD COLUMN extra TEXT'), sqlStatement('CREATE INDEX late_value ON late(value)')));
  assert.equal((await alter.materialized()).outcome, 'accepted');
  const drop = await submit(a, 'schema-drop', 110n, program(sqlStatement('DROP TABLE late')));
  assert.equal((await drop.materialized()).outcome, 'accepted'); await assert.rejects(schemaLive.refresh());
  assert.ok(schemaLive.error); schemaLive.close();
  await link.synchronize();
  report.schema = { initializationProposal: init.id, ordinaryTransaction: true, before: rejected.outcome,
    after: (await insert.materialized()).outcome, rollback: (await rollback.materialized()).outcome,
    unauthorizedDrop: (await denied.materialized()).outcome, alter: (await alter.materialized()).outcome,
    drop: (await drop.materialized()).outcome, staleQueryError: true, capturedSchemaCoherent: true, rollbackEvents: 0 };
  // Public scoped tools remain usable without a peer or provider.
  await link.close();
  const tools = createScopedApplicationTools(a, { commands: ['postMessage'], queries: ['board'] });
  const request = { kind: 'command', name: 'postMessage', input: { messageId: 'tool', text: 'Offline public tool' }, operationId: 'tool-post' };
  const first = await tools.execute(request, { caller: 'qualification-agent' });
  const retry = await tools.execute({ kind: 'retry', operationId: 'tool-post' }, { caller: 'qualification-agent' });
  assert.deepEqual(first.operationReference, retry.operationReference);
  await tools.execute({ kind: 'wait', fact: 'materialized', operationId: 'tool-post' }, { caller: 'qualification-agent' });
  report.tools = { exactRetry: true, proposalId: first.operationReference.proposalId, callerScoped: true };
  const beforeReload = await query(a), identity = a.identity.publicKey; live.close(); await a.close();
  const reopenedDevice = await openNativeDevice({ path: join(directory, 'root.sqlite') }); devices.push(reopenedDevice);
  const reopened = await open(reopenedDevice, 'a', true), afterReload = await query(reopened);
  assert.equal(reopened.identity.publicKey, identity); assert.deepEqual(afterReload, beforeReload);
  assert.equal((await reopened.operations.get('late-insert').materialized()).outcome, 'accepted');
  report.reload = { identityBefore: identity, identityAfter: reopened.identity.publicKey, before: hash(beforeReload), after: hash(afterReload), cachedAuthority: true };
  const loaded = await loadNodeWasmEngine(fileURLToPath(new URL('./wasm/', import.meta.resolve('@chronolog/peer-session'))));
  const wasmEngine = createNodeWasmSqlEngine({ module: loaded.module, manifest: loaded.manifest });
  const wasmManifest = bytesToHex((await executionManifestArtifacts(wasmEngine.executionManifest)).executionManifestDigest);
  assert.equal(wasmManifest, manifest);
  let wasm = await createApplicationSession({ device: devices[2], definition: taskBoard, authority, epochKeys: new Map([[0,key]]),
    createMaterializer: ({rootPrincipal}) => createSqlMaterializationRuntime({engine:wasmEngine,rootPrincipal,path:join(directory,'wasm-sql.sqlite'),checkpointEvery:1}) });
  sessions.push(wasm); await wasm.mergeFacts(reopened.exportFacts());
  const wasmView = await query(wasm), nativeView = await query(reopened); assert.deepEqual(wasmView,nativeView);
  const outcomes = session => session.exportFacts().envelopes.map(envelope => { const inspected=session.operations.get(envelope.payload.proposalId).inspect();return [inspected.proposalId,inspected.materialized?.outcome,inspected.materialized?.rejectionCode]; }).sort((a,b)=>a[0].localeCompare(b[0]));
  assert.deepEqual(outcomes(wasm),outcomes(reopened));
  const wasmBefore=hash(wasmView),wasmIdentity=wasm.identity.publicKey;await wasm.close();
  const wasmDevice=await openNativeDevice({path:join(directory,'wasm.sqlite')});devices.push(wasmDevice);
  wasm=await createApplicationSession({device:wasmDevice,applicationId,definition:taskBoard,
    createMaterializer:({rootPrincipal})=>createSqlMaterializationRuntime({engine:wasmEngine,rootPrincipal,path:join(directory,'wasm-sql.sqlite')})});sessions.push(wasm);
  assert.equal(wasm.identity.publicKey,wasmIdentity);assert.equal(hash(await query(wasm)),wasmBefore);
  report.sqlParity={nativeManifest:manifest,wasmManifest,stateNative:hash(nativeView),stateWasm:wasmBefore,
    outcomesNative:hash(outcomes(reopened)),outcomesWasm:hash(outcomes(wasm)),wasmReload:hash(await query(wasm)),actualWasm:true,
    wasmSha256:loaded.manifest.wasmSha256,loaderSha256:loaded.manifest.loaderSha256};
  report.passed = true; report.stage = 'passed';
} catch (error) { report.passed = false; report.error = error.stack ?? String(error); throw error; }
finally { await Promise.allSettled(links.map(link => link.close())); await Promise.allSettled(sessions.map(session => session.close()));
  await Promise.allSettled(devices.map(device => device.close())); await writeFile(path, `${JSON.stringify(report, null, 2)}\n`); }
