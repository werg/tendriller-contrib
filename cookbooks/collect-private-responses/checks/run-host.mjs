// Test the real trusted host from public core artifacts; no core checkout imports.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { artifacts: { type: 'string' }, output: { type: 'string' } } });
if (!values.artifacts) throw Error('Usage: node cookbooks/collect-private-responses/checks/run-host.mjs --artifacts /path/to/core/dist');
const artifacts = resolve(values.artifacts), here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const selected = kind => {
  const files = readdirSync(artifacts).filter(name => new RegExp(`^tendriller-${kind}-.+\\.tgz$`).test(name));
  if (files.length !== 1) throw Error(`Expected one ${kind} artifact; build a clean core dist directory`);
  return join(artifacts, files[0]);
};
const sdk = selected('sdk'), engine = selected('engine');
const directory = mkdtempSync(join(tmpdir(), 'tendriller-host-check-'));
const write = (name, value) => writeFileSync(join(directory, name), value);
const run = (command, args) => execFileSync(command, args, { cwd: directory, stdio: 'inherit', env: { ...process.env, NO_COLOR: '1' } });
try {
  write('package.json', JSON.stringify({ private: true, type: 'module', dependencies: {
    '@tendriller/core': `file:${sdk}`, '@tendriller/engine': `file:${engine}`,
    '@cloudflare/vitest-plugin': '1.8.1', vitest: '4.1.12', typescript: '7.0.2',
  } }, null, 2));
  copyFileSync(join(here, '../snippets/private-responses.mjs'), join(directory, 'private-responses.mjs'));
  copyFileSync(join(root, 'cookbooks/review-exact-proposal/snippets/approval.mjs'), join(directory, 'approval.mjs'));
  copyFileSync(join(here, 'host.scenarios.mjs'), join(directory, 'host.test.mjs'));
  for (const extension of ['mts', 'mjs']) copyFileSync(join(root, `test/public-signals.${extension}`), join(directory, `public-signals.${extension}`));
  write('signals.tsconfig.json', JSON.stringify({ compilerOptions: { target: 'ES2023', module: 'NodeNext',
    moduleResolution: 'NodeNext', strict: true, noEmit: true, lib: ['ES2023', 'DOM', 'DOM.Iterable'], types: [] },
    files: ['public-signals.mts'] }, null, 2));
  const identity = path => createHash('sha256').update(readFileSync(path)).digest('hex');
  write('entry.mjs', `import { configureWorkflows } from '@tendriller/engine';
import { privateResponses } from './private-responses.mjs';
import { proposalReview } from './approval.mjs';
configureWorkflows([
  privateResponses({implementationVersion:${JSON.stringify(identity(join(directory, 'private-responses.mjs')))},summaryPath:['findings']}),
  proposalReview({implementationVersion:${JSON.stringify(identity(join(directory, 'approval.mjs')))}}),
]);
export {default,Tendril,Admission} from '@tendriller/engine';\n`);
  mkdirSync(join(directory, 'assets')); write('assets/index.txt', 'Test fixture assets');
  write('wrangler.jsonc', JSON.stringify({ name: 'cookbook-trusted-check', main: 'entry.mjs', compatibility_date: '2026-11-01', compatibility_flags: ['nodejs_compat'],
    assets: { directory: './assets', binding: 'ASSETS', run_worker_first: true },
    durable_objects: { bindings: [{ name: 'TENDRIL', class_name: 'Tendril' }, { name: 'ADMISSION', class_name: 'Admission' }] },
    migrations: [{ tag: 'baseline', new_sqlite_classes: ['Tendril', 'Admission'] }],
    d1_databases: [{ binding: 'ACCOUNTS', database_name: 'test', database_id: '00000000-0000-4000-8000-000000000001' }],
    r2_buckets: [{ binding: 'FILES', bucket_name: 'test' }],
    vars: { PUBLIC_BASE: 'https://tendriller.dev', PAGE_BASE_DOMAIN: 'tendriller.site' },
  }, null, 2));
  write('vitest.config.mjs', `import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
const require = createRequire(import.meta.url);
const migrations = await readD1Migrations(dirname(require.resolve('@tendriller/engine/accounts-schema')));
export default defineConfig({plugins:[cloudflareTest({main:new URL('./entry.mjs',import.meta.url).pathname,wrangler:{configPath:new URL('./wrangler.jsonc',import.meta.url).pathname}})],test:{include:['host.test.mjs'],testTimeout:30000,provide:{d1Migrations:migrations}}});\n`);
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund']);
  run(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'signals.tsconfig.json']);
  const signals = JSON.parse(execFileSync(process.execPath, ['public-signals.mjs'], {
    cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'],
  }));
  run(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.config.mjs', '--reporter=default', '--reporter=json', '--outputFile=vitest-results.json']);
  const testReport = JSON.parse(readFileSync(join(directory, 'vitest-results.json'), 'utf8'));
  const evidence = {
    evidence: 'exercised', date: new Date().toISOString(), host: 'real built Worker',
    source_commit: process.env.GITHUB_SHA || null, core_commit: process.env.CORE_CHECK_REF || null,
    sdk_sha256: identity(sdk), engine_sha256: identity(engine),
    public_signals: { ...signals, types: 'passed' },
    private_reference_sha256: identity(join(directory, 'private-responses.mjs')), approval_reference_sha256: identity(join(directory, 'approval.mjs')),
    scenarios: testReport.testResults.flatMap(file => file.assertionResults.map(test => ({ name: test.fullName, status: test.status }))),
    limits: ['Synthetic test identities and text responses; private media and production deployment are not exercised.'],
  };
  const output = resolve(values.output || join(root, 'test-results/host-evidence.json'));
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify(evidence, null, 2));
} finally { rmSync(directory, { recursive: true, force: true }); }
