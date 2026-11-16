import { readResource, hasResource, resourceFiles } from "./resources.mjs";
// Resolve the complete immutable asset graph at publication time.
import { readFileSync, existsSync, mkdirSync, copyFileSync, cpSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
export function catalog() {
  const source = JSON.parse(readResource('recipes/catalog.json'));
  return { ...source, release: JSON.parse(readResource('package.json')).version,
    recipes: source.recipes.map(item => {
      const declaration = JSON.parse(readResource(item.path + '/tendril.json'));
      return { ...item, maintainer: 'werg', requires: declaration.requires, components: declaration.components || [], workflows: declaration.workflows || [] };
    }) };
}
export function componentAssets(names, { workflows = false } = {}) {
  const catalog = JSON.parse(readResource('components/catalog.json'));
  const chosen = new Map(), visiting = new Set();
  const visit = name => {
    if (chosen.has(name)) return;
    const component = catalog.components.find(item => item.id === name);
    if (!component || component.status !== 'supported') throw Error(`Component '${name}' is not in the supported catalog. Declare custom experimental assets explicitly.`);
    if (visiting.has(name)) throw Error(`Component dependency cycle at '${name}'.`);
    visiting.add(name);
    for (const dependency of component.dependencies) visit(dependency);
    visiting.delete(name); chosen.set(name, component);
  };
  names.forEach(visit);
  const files = new Map();
  for (const component of chosen.values()) for (const path of component.files) files.set('assets/components/' + path, 'components/' + path);
  if (workflows) for (const name of ['browser.js', 'session-archive.js']) {
    const source = 'workflows/' + name;
    if (!hasResource(source)) throw Error(`The selected workflow browser artifact is missing: ${name}`);
    files.set('assets/workflows/' + name, source);
  }
  return [...files].map(([path, source]) => ({ path, bytes: readResource(source), sha256: sha256(readResource(source)) }));
}
export function assetLock(declaration, assets = componentAssets(declaration.components || [], { workflows: !!declaration.workflows?.length })) {
  const core = JSON.parse(readResource('core.lock.json'));
  return { format: 'tendriller-page-assets', version: 1, contrib: JSON.parse(readResource('package.json')).version,
    requires: declaration.requires || { contract: 2, workflows: {} }, core: core.artifacts,
    files: assets.map(({ path, sha256 }) => ({ path, sha256 })) };
}
export function vendorAssets(directory, declaration) {
  const assets = componentAssets(declaration.components || [], { workflows: !!declaration.workflows?.length });
  for (const asset of assets) {
    const destination = join(directory, asset.path);
    mkdirSync(dirname(destination), { recursive: true }); writeFileSync(destination, asset.bytes);
  }
  const lock = assetLock(declaration, assets);
  writeFileSync(join(directory, 'tendril.assets.json'), JSON.stringify(lock, null, 2) + '\n');
  return lock;
}
export function verifyAssets(directory) {
  const lockPath = join(directory, 'tendril.assets.json');
  if (!existsSync(lockPath)) return null;
  const lock = json(lockPath);
  if (lock.format !== 'tendriller-page-assets' || lock.version !== 1) throw Error('Invalid page asset lock.');
  for (const { path, sha256: expected } of lock.files) {
    const local = resolve(directory, path), base = resolve(directory) + '/';
    if (!local.startsWith(base) || !existsSync(local) || sha256(readFileSync(local)) !== expected) throw Error(`Pinned page asset '${path}' is missing or has changed. Resolve and lock the asset set before publication.`);
  }
  return lock;
}
export function scaffold(name, directory) {
  const item = catalog().recipes.find(item => item.id === name);
  if (!item) throw Error(`Unknown recipe: ${name}`);
  if (existsSync(directory)) throw Error(`Target already exists: ${directory}`);
  for (const path of resourceFiles(item.path)) { const target = join(directory,path.slice(item.path.length+1)); mkdirSync(dirname(target),{recursive:true}); writeFileSync(target,readResource(path)); }
  const declaration = JSON.parse(readResource(item.path + '/tendril.json'));
  const lock = vendorAssets(directory, declaration);
  return { recipe: name, path: resolve(directory), assets: lock.files.length, requires: lock.requires, workflows: declaration.workflows || [] };
}
