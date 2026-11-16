// Exercise the paired core's actual browser/native RTC implementation.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { validateWebRtcReport } from './webrtc-report.mjs';

const { values } = parseArgs({ options: {
  chronolog: { type: 'string' }, output: { type: 'string' }, browser: { type: 'string' },
  'build-only': { type: 'boolean', default: false },
} });
for (const field of ['chronolog', 'output']) {
  if (!values[field]) throw Error(`Missing --${field}; use the exact source checkout and a new evidence directory`);
}
const chronolog = resolve(values.chronolog), output = resolve(values.output);
const runner = join(chronolog, 'tools/test-browser-webrtc.ts');
if (!existsSync(runner)) throw Error('The supplied Chronolog revision does not provide its browser/native WebRTC qualification CLI');
if (existsSync(output)) throw Error('Use a new output directory so earlier WebRTC evidence cannot be reused');
const args = ['--import', 'tsx', runner, '--output', output];
if (values['build-only']) args.push('--build-only');
const result = spawnSync(process.execPath, args, { cwd: chronolog, stdio: 'inherit',
  env: { ...process.env, ...(values.browser ? { CHRONOLOG_CHROMIUM_EXECUTABLE: resolve(values.browser) } : {}) } });
if (result.error) throw result.error;
if (result.signal) throw Error(`WebRTC qualification process ended with ${result.signal}`);
if (result.status !== 0) process.exitCode = result.status ?? 1;
else if (values['build-only']) console.log('WebRTC fixture built; browser/native runtime scenarios were not run.');
else {
  const report = JSON.parse(readFileSync(join(output, 'report.json'), 'utf8'));
  const summary = validateWebRtcReport(report);
  console.log(`Validated actual browser/native WebRTC evidence: ${JSON.stringify(summary)}`);
}
