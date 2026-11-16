// Invoke the paired core's public qualification CLI with explicit artifacts.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { validateApplicationReport } from './application-report.mjs';

const { values } = parseArgs({ options: {
  chronolog: { type: 'string' }, 'tendriller-runtime': { type: 'string' }, 'tendriller-engine': { type: 'string' },
  wasm: { type: 'string' }, output: { type: 'string' }, browser: { type: 'string' },
  'build-only': { type: 'boolean', default: false },
} });
for (const field of ['chronolog', 'tendriller-runtime', 'tendriller-engine', 'wasm', 'output']) {
  if (!values[field]) throw Error(`Missing --${field}; use exact source/artifact paths and a new evidence directory`);
}
const here = dirname(fileURLToPath(import.meta.url));
const contrib = resolve(here, '../../..'), chronolog = resolve(values.chronolog), output = resolve(values.output);
const runner = join(chronolog, 'tools/application-pilot.ts');
if (!existsSync(runner)) throw Error('The supplied Chronolog revision does not provide its application-pilot qualification CLI');
if (existsSync(output)) throw Error('Use a new output directory so earlier application evidence cannot be reused');
const args = ['--import', 'tsx', runner, '--contrib', contrib,
  '--tendriller-runtime', resolve(values['tendriller-runtime']), '--tendriller-engine', resolve(values['tendriller-engine']),
  '--wasm', resolve(values.wasm), '--output', output];
if (values.browser) args.push('--browser', resolve(values.browser));
if (values['build-only']) args.push('--build-only');
const result = spawnSync(process.execPath, args, { cwd: chronolog, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.signal) throw Error(`Qualification process ended with ${result.signal}`);
if (result.status !== 0) process.exitCode = result.status ?? 1;
else if (values['build-only']) console.log('Application fixture built; browser/native runtime scenarios were not run.');
else {
  const report = JSON.parse(readFileSync(join(output, 'report.json'), 'utf8'));
  const summary = validateApplicationReport(report);
  console.log(`Validated RTC application evidence: ${JSON.stringify(summary)}`);
}
