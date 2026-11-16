// Invoke the paired core's public qualification CLI with explicit artifacts.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  chronolog: { type: 'string' }, 'tendriller-runtime': { type: 'string' },
  wasm: { type: 'string' }, output: { type: 'string' }, browser: { type: 'string' },
  'build-only': { type: 'boolean', default: false },
} });
for (const field of ['chronolog', 'tendriller-runtime', 'wasm', 'output']) {
  if (!values[field]) throw Error(`Missing --${field}; use exact source/artifact paths and a new evidence directory`);
}
const here = dirname(fileURLToPath(import.meta.url));
const contrib = resolve(here, '../../..'), chronolog = resolve(values.chronolog);
const runner = join(chronolog, 'tools/application-pilot.ts');
if (!existsSync(runner)) throw Error('The supplied Chronolog revision does not provide its application-pilot qualification CLI');
const args = ['--import', 'tsx', runner, '--contrib', contrib,
  '--tendriller-runtime', resolve(values['tendriller-runtime']), '--wasm', resolve(values.wasm), '--output', resolve(values.output)];
if (values.browser) args.push('--browser', resolve(values.browser));
if (values['build-only']) args.push('--build-only');
const result = spawnSync(process.execPath, args, { cwd: chronolog, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.signal) throw Error(`Qualification process ended with ${result.signal}`);
process.exitCode = result.status ?? 1;
