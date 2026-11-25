// Honest qualification telemetry and cross-platform matrix generator (W12).
// Measures real local artifacts and workloads; never fabricates vendor cloud-agent results.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { collectorGates } from './qualification-status.mjs';
import { inspectRelease, profileBytes } from './release-selection.mjs';

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

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

// The explicit kernel fast-test process may only run on the exact clean source
// the verified composition names; otherwise it is reported blocked, never run.
function kernelSourceBlock(release) {
  try {
    const head = git(chronologRoot, 'rev-parse', 'HEAD');
    if (head !== release.source.chronolog.source) return `Chronolog checkout is ${head.slice(0, 12)}, not the composition source ${release.source.chronolog.source.slice(0, 12)}.`;
    if (git(chronologRoot, 'status', '--porcelain') !== '') return 'Chronolog checkout has uncommitted changes.';
    return null;
  } catch { return 'The Chronolog checkout is not a readable git repository.'; }
}

const runTendril = (tool, args, options = {}) => execFileSync(process.execPath, ['--no-warnings', join(tool, 'bin/tendril.mjs'), ...args],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000, maxBuffer: 4 * 1024 * 1024, ...options });

async function collectLocalTelemetry() {
  const telemetry = {
    recordedAt: new Date().toISOString(),
    host: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    },
    release: null,
    artifacts: {},
    benchmarks: {},
    gates: [],
  };

  // Select the exact release composition; never glob for "the" archive.
  const inspection = inspectRelease(join(tendrillerRoot, 'dist'));
  if (inspection.status !== 'verified') {
    telemetry.release = { status: inspection.status, code: inspection.code, reason: inspection.reason };
    return { ...telemetry, gates: collectorGates(), note: `${inspection.reason} No gates were executed.` };
  }
  const { release } = inspection;
  telemetry.release = {
    status: 'verified', version: release.version, contract: release.contract, compositionId: release.compositionId,
    coreSource: release.source.core.source, chronologSource: release.source.chronolog.source,
    archives: Object.fromEntries(Object.values(release.components).map(item => [item.role, { file: item.file, size: item.size, sha256: item.sha256 }])),
    verification: 'Manifest/composition identity, clean sources, exact profiles and every selected archive size and SHA-256. No product gate was run.',
  };
  const bytes = role => release.components[role].size;
  telemetry.artifacts = {
    coreSdkBytes: bytes('sdk'),
    runtimeBytes: bytes('runtime'),
    toolsBytes: bytes('tools'),
    chronologAuthorityBytes: bytes('authority'),
    chronologSessionEventsBytes: bytes('session'),
    chronologSessionSqlBrowserBytes: bytes('session-sql-browser'),
    profileEventsTotalBytes: profileBytes(release, 'events'),
    profileSqlTotalBytes: profileBytes(release, 'sql'),
  };

  // Measure the current runner CLI extracted from the verified tools archive:
  // local capability probe and a real source handoff. Neither needs a network.
  const scratch = mkdtempSync(join(tmpdir(), 'tendriller-scorecard-'));
  let probe = null, probeMs = null, handoffMs = null, handoffPass = false;
  try {
    const tool = join(scratch, 'tools'), project = join(scratch, 'project');
    mkdirSync(tool); mkdirSync(project);
    execFileSync('tar', ['-xzf', release.components.tools.path, '-C', tool], { stdio: ['ignore', 'ignore', 'pipe'] });
    writeFileSync(join(project, 'package.json'), '{"name":"scorecard-fixture","private":true}\n');
    writeFileSync(join(project, 'page.mjs'), 'export const ready = true;\n');
    let t0 = performance.now();
    probe = JSON.parse(runTendril(tool, ['probe'], { cwd: project }));
    probeMs = Math.round((performance.now() - t0) * 100) / 100;
    t0 = performance.now();
    const out = JSON.parse(runTendril(tool, ['handoff', 'source', join(scratch, 'handoff.tgz'), '--project', project], { cwd: project }));
    handoffMs = Math.round((performance.now() - t0) * 100) / 100;
    handoffPass = out.manifest?.fileCount === 2 && out.size === statSync(join(scratch, 'handoff.tgz')).size;
  } catch (error) {
    telemetry.note = `Runner CLI fixture did not complete: ${String(error?.message ?? error).split('\n')[0]}`;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  let chronologFastLane = null, fastLaneBlocked = null;
  if (process.argv.includes('--run-fast-tests')) {
    fastLaneBlocked = kernelSourceBlock(release);
    if (!fastLaneBlocked && !existsSync(join(chronologRoot, 'tools/run-fast-tests.mjs'))) fastLaneBlocked = 'The Chronolog checkout has no tools/run-fast-tests.mjs.';
    if (!fastLaneBlocked) {
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
  }

  let bunVersion = null;
  for (const bin of ['bun', join(process.env.HOME ?? '', '.bun/bin/bun')]) {
    try { bunVersion = execFileSync(bin, ['--version'], { encoding: 'utf8', timeout: 3000, maxBuffer: 4096, stdio: ['ignore', 'pipe', 'ignore'] }).trim(); break; } catch {}
  }
  let denoVersion = null;
  for (const bin of ['deno', join(process.env.HOME ?? '', '.deno/bin/deno')]) {
    try { denoVersion = execFileSync(bin, ['--version'], { encoding: 'utf8', timeout: 3000, maxBuffer: 4096, stdio: ['ignore', 'pipe', 'ignore'] }).split('\n')[0].trim(); break; } catch {}
  }

  telemetry.benchmarks = {
    probeCapabilitiesMs: probeMs,
    probeRuntime: probe?.runtime ?? null,
    probeIpc: probe?.lifecycle?.ipc ?? null,
    sourceHandoffMs: handoffPass ? handoffMs : null,
    chronologFastLane,
    chronologFastLaneBlocked: fastLaneBlocked,
    bunVersion,
    denoVersion,
  };

  telemetry.gates = collectorGates({
    releaseComposition: { compositionId: release.compositionId },
    sourceHandoffMs: handoffPass ? handoffMs : null, probeCapabilitiesMs: probeMs,
    chronologFastLane,
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
    `> Release selection: ${!t.release ? 'not attempted.' : t.release.status === 'verified'
      ? `verified composition ${t.release.compositionId.slice(0, 12)} (core ${t.release.coreSource.slice(0, 12)}, Chronolog ${t.release.chronologSource.slice(0, 12)}). Archive integrity is the only thing verified from it.`
      : `${t.release.status} (${t.release.code}). ${t.release.reason}`}`,
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
    `| \`@chronolog/authority\` tarball | ${kb(a.chronologAuthorityBytes)} | — |`,
    `| \`@chronolog/peer-session\` events profile tarball | ${kb(a.chronologSessionEventsBytes)} | — |`,
    `| \`@chronolog/peer-session\` browser SQL profile tarball | ${kb(a.chronologSessionSqlBrowserBytes)} | — |`,
    `| Events profile total (sdk + tools + authority + session) | ${kb(a.profileEventsTotalBytes)} | < 15 MB |`,
    `| SQL profile total (sdk + tools + authority + browser SQL session) | ${kb(a.profileSqlTotalBytes)} | < 15 MB |`,
    `| Capability probe (\`tendril probe\`, verified tools archive) | ${b.probeCapabilitiesMs ?? 'n/a'} ms | < 500 ms |`,
    `| Source handoff (\`tendril handoff source\`, synthetic two-file project) | ${b.sourceHandoffMs ?? 'n/a'} ms | < 15,000 ms |`,
    `| \`chronolog-db\` \`pnpm test:fast\` (${b.chronologFastLane?.passedFiles ?? 'n/a'} pure-JS test files) | ${b.chronologFastLane ? b.chronologFastLane.durationSec + ' s' : b.chronologFastLaneBlocked ? 'blocked: ' + b.chronologFastLaneBlocked : 'n/a'} | < 30 s target |`,
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
    'Collect optional local fixture measurements from an explicit sibling Tendriller checkout whose `dist/` holds a complete release (set `TENDRILLER_ROOT`; `CHRONOLOG_ROOT` only for the fast-test process). A missing, ambiguous or unverifiable release is reported blocked and no gate runs. This does not run product qualification. Run heavy checks only on an approved remote runner:',
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
