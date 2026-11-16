// Invoke the paired core qualification with independently packed public hosts.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { validateMembershipReport } from './membership-report.mjs';

const { values } = parseArgs({ options: {
  chronolog: { type: 'string' }, 'tendriller-artifacts': { type: 'string' },
  wasm: { type: 'string' }, output: { type: 'string' }, browser: { type: 'string' },
  'build-only': { type: 'boolean', default: false },
} });
for (const field of ['chronolog', 'tendriller-artifacts', 'wasm', 'output']) {
  if (!values[field]) throw Error(`Missing --${field}; use exact source/artifact paths and a new evidence directory`);
}
const chronolog = resolve(values.chronolog), runner = join(chronolog, 'tools/thin-membership-pilot.ts'), output = resolve(values.output);
if (!existsSync(runner)) throw Error('The supplied Chronolog revision does not provide its thin-membership qualification CLI');
if (existsSync(output)) throw Error('Use a new output directory so earlier membership evidence cannot be reused');
const args = ['--import', 'tsx', runner, '--tendriller-artifacts', resolve(values['tendriller-artifacts']),
  '--wasm', resolve(values.wasm), '--output', output];
if (values.browser) args.push('--browser', resolve(values.browser));
if (values['build-only']) args.push('--build-only');
const result = spawnSync(process.execPath, args, { cwd: chronolog, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.signal) throw Error(`Membership qualification process ended with ${result.signal}`);
if (result.status !== 0) process.exitCode = result.status ?? 1;
else if (values['build-only']) console.log('Membership fixture built; workerd/browser runtime scenarios were not run.');
else {
  validateMembershipReport(JSON.parse(readFileSync(join(output, 'report.json'), 'utf8')));
  console.log(`Validated current RTC membership evidence: ${join(output, 'report.json')}`);
}
