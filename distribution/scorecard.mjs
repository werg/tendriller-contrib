// Honest qualification telemetry and cross-platform matrix generator (W12).
// Measures real local artifacts and workloads; never fabricates vendor cloud-agent results.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { collectorGates } from './qualification-status.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const verifyOnly = process.argv.includes('--verify-only');
const tendrillerRoot = process.env.TENDRILLER_ROOT ? resolve(process.env.TENDRILLER_ROOT) : resolve(root, '../tendriller');
const chronologRoot = process.env.CHRONOLOG_ROOT ? resolve(process.env.CHRONOLOG_ROOT) : resolve(root, '../chronolog-db');

const CLOUD_AGENT_PLATFORMS = [
  { id: 'meta-muse', name: 'Meta Muse', mode: 'outbound-https-mcp-or-polling-gateway' },
  { id: 'grok-bot-cursor-cloud', name: 'Grok Bot + Cursor Cloud Agent', mode: 'mcp-or-disposable-sandbox' },
  { id: 'openai-dots-codex-cloud', name: 'OpenAI Dots + Work / Codex Cloud + Desktop Bridge', mode: 'remote-mcp-or-desktop-ipc' },
  { id: 'claude-duet', name: 'Claude Duet', mode: 'remote-mcp-or-stdio-mcp' },
  { id: 'instinct', name: 'Instinct', mode: 'disposable-sandbox-and-handoff' },
];

const SCENARIOS = [
  'use_existing_app_via_connector',
  'create_and_run_events_app',
  'create_and_run_sql_app',
  'checkpoint_and_resume_across_replacement',
];

function fileSize(path) {
  return existsSync(path) ? statSync(path).size : null;
}

async function collectLocalTelemetry() {
  const telemetry = {
    recordedAt: new Date().toISOString(),
    host: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    },
    artifacts: {},
    benchmarks: {},
    gates: [],
  };

  const hasTendriller = existsSync(join(tendrillerRoot, 'dist/tendriller-sdk-0.3.0-rc.17.tgz'));
  if (!hasTendriller) {
    return { ...telemetry, gates: collectorGates(), note: 'Sibling tendriller build artifacts not present; no gates were executed.' };
  }

  const artifactsDir = join(tendrillerRoot, 'test/artifacts');
  const artifactFiles = existsSync(artifactsDir) ? readdirSync(artifactsDir) : [];
  const findArtifact = pattern => {
    const matches = artifactFiles.filter(name => pattern.test(name));
    // Multiple checkpoints are ambiguous; never label the first arbitrary one current.
    return matches.length === 1 ? join(artifactsDir, matches[0]) : '';
  };
  const coreTgz = join(tendrillerRoot, 'dist/tendriller-sdk-0.3.0-rc.17.tgz');
  const runtimeTgz = join(tendrillerRoot, 'dist/tendriller-runtime-0.3.0-rc.17.tgz');
  const toolsTgz = join(tendrillerRoot, 'dist/tendriller-tools-0.3.0-rc.17.tgz');
  const bootstrapScript = join(tendrillerRoot, 'scripts/tendriller-bootstrap.mjs');
  const fullSessionTgz = findArtifact(/^chronolog-peer-session-[a-f0-9]{8}\.tgz$/u);
  const relaySessionTgz = findArtifact(/^chronolog-peer-session-[a-f0-9]{8}-relay\.tgz$/u);
  const controlTgz = findArtifact(/^chronolog-peer-generation-control-[a-f0-9]{8}\.tgz$/u);
  const wasmBinaryPath = join(chronologRoot, 'artifacts/wasm/sqlite3.wasm');
  const wasmManifestPath = join(chronologRoot, 'artifacts/wasm/manifest.json');

  const coreBytes = fileSize(coreTgz);
  const runtimeBytes = fileSize(runtimeTgz);
  const toolsBytes = fileSize(toolsTgz);
  const bootstrapBytes = fileSize(bootstrapScript);
  const fullSessionBytes = fileSize(fullSessionTgz);
  const relaySessionBytes = fileSize(relaySessionTgz);
  const controlBytes = fileSize(controlTgz);
  const wasmBinaryBytes = fileSize(wasmBinaryPath);

  const total = (...values) => values.every(Number.isFinite) ? values.reduce((sum, value) => sum + value, 0) : null;
  telemetry.artifacts = {
    coreSdkBytes: coreBytes,
    runtimeBytes,
    toolsBytes,
    bootstrapScriptBytes: bootstrapBytes,
    chronologControlBytes: controlBytes,
    chronologSessionFullBytes: fullSessionBytes,
    chronologSessionRelayBytes: relaySessionBytes,
    chronologWasmSqlBinaryBytes: wasmBinaryBytes,
    chronologWasmManifestPresent: existsSync(wasmManifestPath),
    profileEventsRelayOnlyTotalBytes: total(coreBytes, runtimeBytes, relaySessionBytes),
    profileEventsFullTotalBytes: total(coreBytes, runtimeBytes, fullSessionBytes),
  };

  // Measure real local capability probe + nondestructive bootstrapper extraction time.
  const { probeCapabilities } = await import(pathToFileURL(join(tendrillerRoot, 'contract/transport-probe.mjs')).href);
  const { packTarGz } = await import(pathToFileURL(join(tendrillerRoot, 'contract/archive.mjs')).href);
  const { exportSqliteCheckpoint, restoreSqliteCheckpoint } = await import(pathToFileURL(join(tendrillerRoot, 'tools/cli/lib/handoff.mjs')).href);
  const { DatabaseSync } = await import('node:sqlite');

  const probeStart = performance.now();
  const probe = await probeCapabilities();
  const probeMs = Math.round((performance.now() - probeStart) * 100) / 100;

  const scratch = mkdtempSync(join(tmpdir(), 'tendriller-scorecard-'));
  let bootstrapExtractMs = null;
  let checkpointRecoveryPass = false;
  let peakRssMb = null;
  try {
    const sampleTgz = join(scratch, 'starter.tgz');
    const archiveBytes = packTarGz([
      { path: 'starter/index.html', data: '<!doctype html><title>Starter</title>' },
      { path: 'starter/page.mjs', data: 'export const ready = true;\n' },
    ]);
    writeFileSync(sampleTgz, archiveBytes);
    const dest = join(scratch, 'project');
    const bootStart = performance.now();
    execFileSync(process.execPath, [bootstrapScript, '--archive-file', sampleTgz, '--project', dest], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    bootstrapExtractMs = Math.round((performance.now() - bootStart) * 100) / 100;

    // Measure checkpoint export, retirement enforcement, and clean restore.
    const srcDb = join(scratch, 'src.sqlite');
    const dstDb = join(scratch, 'dst.sqlite');
    const db = new DatabaseSync(srcDb);
    db.exec('CREATE TABLE stored_bytes(key TEXT PRIMARY KEY, value BLOB NOT NULL)');
    db.prepare('INSERT INTO stored_bytes(key, value) VALUES(?, ?)').run('peer-session/device/v1', Buffer.from('verified-device-state'));
    db.close();
    const secret = 'e'.repeat(64);
    const cp = await exportSqliteCheckpoint({ devicePath: srcDb, outputPath: join(scratch, 'device.clcp'), secret, retireSource: true });
    let retiredBlocked = false;
    try {
      await exportSqliteCheckpoint({ devicePath: srcDb, outputPath: join(scratch, 'dup.clcp'), secret });
    } catch (error) {
      retiredBlocked = error?.code === 'DEVICE_RETIRED_BY_CHECKPOINT';
    }
    const restored = await restoreSqliteCheckpoint({ inputPath: cp.output, devicePath: dstDb, secret });
    checkpointRecoveryPass = retiredBlocked && restored.restoredEntries === 1;
    peakRssMb = Math.round((process.memoryUsage().rss / (1024 * 1024)) * 100) / 100;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  let chronologFastLane = null;
  if (process.argv.includes('--run-fast-tests') && existsSync(join(chronologRoot, 'tools/run-fast-tests.mjs'))) {
    const t0 = performance.now();
    const out = execFileSync(process.execPath, [join(chronologRoot, 'tools/run-fast-tests.mjs')], {
      cwd: chronologRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const durationSec = Math.round(((performance.now() - t0) / 1000) * 100) / 100;
    const match = out.match(/Test Files\s+(\d+)\s+passed/i);
    chronologFastLane = {
      durationSec,
      passedFiles: match ? Number(match[1]) : null,
    };
  }

  telemetry.benchmarks = {
    probeCapabilitiesMs: probeMs,
    probeRuntime: probe.runtime,
    probeIpc: probe.ipc,
    bootstrapVerifiedExtractMs: bootstrapExtractMs,
    checkpointRecoveryPassRate: checkpointRecoveryPass ? 1.0 : 0.0,
    measuredProcessRssMb: peakRssMb,
    chronologFastLane,
  };

  telemetry.gates = collectorGates({
    bootstrapVerifiedExtractMs: bootstrapExtractMs, probeCapabilitiesMs: probeMs,
    checkpointRecoveryPass, chronologFastLane,
  });

  return telemetry;
}

function buildMatrixDocument(telemetry) {
  const platforms = CLOUD_AGENT_PLATFORMS.map(platform => ({
    ...platform,
    scenarios: Object.fromEntries(SCENARIOS.map(scenario => [scenario, {
      status: 'pending_live_access',
      verifiedAt: null,
      notes: 'Not yet executed on live vendor cloud environment; do not fabricate.',
    }])),
  }));

  return {
    format: 'tendriller-qualification-matrix/v1',
    generatedAt: telemetry.recordedAt,
    qualificationScope: 'unqualified-local-measurements',
    localTelemetry: telemetry,
    cloudAgentPlatforms: platforms,
  };
}

function renderMarkdown(doc) {
  const t = doc.localTelemetry;
  const a = t.artifacts ?? {};
  const b = t.benchmarks ?? {};
  const kb = n => (typeof n === 'number' ? `${(n / 1024).toFixed(1)} KB` : 'n/a');
  const lines = [
    '# Tendriller Cross-Platform Qualification Matrix',
    '',
    `Generated: \`${doc.generatedAt}\` on \`${t.host.platform}/${t.host.arch}\` (\`Node ${t.host.nodeVersion}\`).`,
    '',
    '> Measurements describe only this collector run. Unexecuted gates are `not_executed`; synthetic fixture measurements do not qualify a public release, platform, deployment or live external agent. Use exact source/artifact-bound CI evidence for those claims.',
    '',
    '## Measured Local Artifact Footprint & Benchmarks',
    '',
    '| Metric | Measured Value | Target |',
    '| --- | --- | --- |',
    `| \`@tendriller/core\` SDK tarball | ${kb(a.coreSdkBytes)} | — |`,
    `| \`@tendriller/runtime\` tarball | ${kb(a.runtimeBytes)} | — |`,
    `| \`@tendriller/tools\` tarball | ${kb(a.toolsBytes)} | — |`,
    `| Standalone \`tendriller-bootstrap.mjs\` | ${kb(a.bootstrapScriptBytes)} | Zero-dependency single file |`,
    `| \`chronolog-peer-session\` (\`events-full\`) | ${kb(a.chronologSessionFullBytes)} | — |`,
    `| \`chronolog-peer-session\` (\`events-relay-only\`, zero \`werift\`) | ${kb(a.chronologSessionRelayBytes)} | Smaller / zero native RTC |`,
    `| Compiled DoltLite + \`sqlite-vec\` WASM binary (\`sqlite3.wasm\`) | ${kb(a.chronologWasmSqlBinaryBytes)} | Portable SQL without C++ compiler |`,
    `| Total \`events-relay-only\` core+runtime+session archive size | ${kb(a.profileEventsRelayOnlyTotalBytes)} | < 15 MB |`,
    `| Capability probe (\`probeCapabilities\`) | ${b.probeCapabilitiesMs ?? 'n/a'} ms | < 500 ms |`,
    `| Verified local bootstrap extract (\`tendriller-bootstrap.mjs\`) | ${b.bootstrapVerifiedExtractMs ?? 'n/a'} ms | < 15,000 ms |`,
    `| Encrypted checkpoint export + retire + restore pass rate | ${typeof b.checkpointRecoveryPassRate === 'number' ? (b.checkpointRecoveryPassRate * 100) + '%' : 'not measured'} | 100% |`,
    `| Measured Node process RSS (probe + SQLite checkpoint) | ${b.measuredProcessRssMb ?? 'n/a'} MB | < 150 MB |`,
    `| \`chronolog-db\` \`pnpm test:fast\` (${b.chronologFastLane?.passedFiles ?? 'n/a'} pure-JS test files) | ${b.chronologFastLane?.durationSec ?? 'n/a'} s | < 30 s target |`,
    '',
    '## Acceptance Gates (W1–W12)',
    '',
    '| # | Gate | Status | Observed Evidence |',
    '| --- | --- | --- | --- |',
    ...t.gates.map(g => `| ${g.id} | ${g.name} | \`${g.status}\` | ${g.evidence} |`),
    '',
    '## Target Cloud-Agent Qualification Surfaces',
    '',
    '| Platform | Primary Route | Existing App (Connector) | Create & Run Events App | Create & Run SQL App | Checkpoint & Resume |',
    '| --- | --- | --- | --- | --- | --- |',
    ...doc.cloudAgentPlatforms.map(p =>
      `| ${p.name} | \`${p.mode}\` | \`${p.scenarios.use_existing_app_via_connector.status}\` | \`${p.scenarios.create_and_run_events_app.status}\` | \`${p.scenarios.create_and_run_sql_app.status}\` | \`${p.scenarios.checkpoint_and_resume_across_replacement.status}\` |`
    ),
    '',
    'Collect optional local fixture measurements from explicit sibling checkouts. This does not run product qualification. Run heavy checks only on an approved remote runner:',
    '',
    '```sh',
    'node distribution/scorecard.mjs',
    '# Optional, explicit suite execution on a suitable runner:',
    'node distribution/scorecard.mjs --run-fast-tests',
    '```',
    '',
  ];
  return lines.join('\n');
}

const jsonPath = resolve(root, 'qualification-matrix.json');
const mdPath = resolve(root, 'QUALIFICATION_MATRIX.md');

if (verifyOnly) {
  assert(existsSync(jsonPath), 'Missing qualification-matrix.json');
  assert(existsSync(mdPath), 'Missing QUALIFICATION_MATRIX.md');
  const parsed = JSON.parse(readFileSync(jsonPath, 'utf8'));
  assert.equal(parsed.format, 'tendriller-qualification-matrix/v1');
  assert.equal(parsed.cloudAgentPlatforms.length, 5);
  assert.equal(parsed.localTelemetry.gates.length, 14);
  console.log(`Verified qualification-matrix.json (${parsed.localTelemetry.gates.length} gates, ${parsed.cloudAgentPlatforms.length} cloud-agent platforms).`);
} else {
  const telemetry = await collectLocalTelemetry();
  const doc = buildMatrixDocument(telemetry);
  writeFileSync(jsonPath, JSON.stringify(doc, null, 2) + '\n');
  writeFileSync(mdPath, renderMarkdown(doc));
  console.log(`Generated qualification-matrix.json and QUALIFICATION_MATRIX.md (${telemetry.gates?.length ?? 0} gates).`);
}
