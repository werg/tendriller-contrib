import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { validateCollaborationReport } from './report.mjs';
import { validateBrowserReport } from './browser-report.mjs';

const { values } = parseArgs({ options: { native: { type: 'string' }, browser: { type: 'string' }, output: { type: 'string' } } });
for (const name of ['native', 'browser', 'output']) assert.ok(values[name], `Required --${name}`);
const nativeBytes = await readFile(values.native), browserBytes = await readFile(values.browser);
const native = validateCollaborationReport(JSON.parse(nativeBytes)), browser = validateBrowserReport(JSON.parse(browserBytes));
assert.deepEqual(native.source, browser.source, 'Both gates must exercise the exact Contrib source');
const identify = value => value.artifacts.map(({ name, version, sha256, sourceCommit, sourceTree, sourceDirty }) =>
  ({ name, version, sha256, sourceCommit, sourceTree, sourceDirty })).sort((a, b) => a.name.localeCompare(b.name));
assert.deepEqual(identify(native), identify(browser), 'Both gates must use the same exact public archives');
const hash = value => createHash('sha256').update(value).digest('hex');
const result = { format: 'tendriller-collaboration-composition/v1', qualification: 'clean-local-native-and-browser',
  source: native.source, artifacts: identify(native), reports: { native: hash(nativeBytes), browser: hash(browserBytes) },
  native: { topology: native.topology, checks: native.checks.map(value => value.name), runtime: native.runtime },
  browser: { scenarios: browser.scenarios, runtime: browser.runtime, wasm: browser.wasm }, claims: browser.claims };
await writeFile(values.output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(`Exact collaboration composition recorded: ${values.output}`);
