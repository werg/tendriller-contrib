// Invoke the paired core qualification with independently packed public hosts.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  chronolog: { type: 'string' }, 'tendriller-artifacts': { type: 'string' },
  wasm: { type: 'string' }, output: { type: 'string' }, browser: { type: 'string' },
  'build-only': { type: 'boolean', default: false },
} });
for (const field of ['chronolog', 'tendriller-artifacts', 'wasm', 'output']) {
  if (!values[field]) throw Error(`Missing --${field}; use exact source/artifact paths and a new evidence directory`);
}
const chronolog = resolve(values.chronolog), runner = join(chronolog, 'tools/thin-membership-pilot.ts');
if (!existsSync(runner)) throw Error('The supplied Chronolog revision does not provide its thin-membership qualification CLI');
const args = ['--import', 'tsx', runner, '--tendriller-artifacts', resolve(values['tendriller-artifacts']),
  '--wasm', resolve(values.wasm), '--output', resolve(values.output)];
if (values.browser) args.push('--browser', resolve(values.browser));
if (values['build-only']) args.push('--build-only');
const result = spawnSync(process.execPath, args, { cwd: chronolog, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.signal) throw Error(`Membership qualification process ended with ${result.signal}`);
process.exitCode = result.status ?? 1;
