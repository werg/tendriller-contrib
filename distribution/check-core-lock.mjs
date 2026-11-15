import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const lock = JSON.parse(readFileSync(join(root, 'core.lock.json'), 'utf8'));
const npm = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
const names = new Map([['@tendriller/core', 'tendriller-sdk'], ['@tendriller/runtime', 'tendriller-runtime']]);
if (lock.format !== 'tendriller-core-lock' || lock.version !== 1 || lock.contract !== 2 || lock.artifacts.length !== names.size) throw Error('Invalid core pairing lock.');
for (const [name, prefix] of names) {
  const file = `${prefix}-${lock.core_release}.tgz`, artifact = lock.artifacts.find(item => item.file === file);
  if (!artifact || !artifact.url.includes(`/releases/download/v${lock.core_release}/${file}`)) throw Error(`Missing immutable release origin for ${name}.`);
  const bytes = readFileSync(join(root, 'vendor/core', file));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const integrity = 'sha512-' + createHash('sha512').update(bytes).digest('base64');
  const entry = npm.packages[`node_modules/${name}`];
  if (sha256 !== artifact.sha256 || entry?.integrity !== integrity || entry?.resolved !== `file:vendor/core/${file}`) throw Error(`Core lock and npm integrity disagree for ${name}. Refresh the exact artifact and both locks.`);
  const manifestPath = name === '@tendriller/runtime' ? 'assets/manifest.json' : 'package.json';
  const packed = execFileSync('tar', ['-xOf', join(root, 'vendor/core', file), `package/${manifestPath}`]);
  const installed = readFileSync(join(root, 'node_modules', name, manifestPath));
  if (!packed.equals(installed)) throw Error(`Installed ${name} differs from its locked artifact. Run npm ci.`);
}
console.log(`Core ${lock.core_release} artifact origins, bytes and npm integrity agree.`);
