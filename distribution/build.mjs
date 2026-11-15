import './check-core-lock.mjs';
import { build } from 'esbuild';
import { bundledNotices } from './notices.mjs';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, cpSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { assets, manifest as runtimeManifest } from '../tools/preview/lib/preview-bundle.mjs';
import { guessType } from '../tools/cli/lib/pack.mjs';
import { catalog as recipeCatalog } from '../tools/cli/lib/assets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), dist = join(root, 'dist');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
function files(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).filter(entry => !entry.name.startsWith('.') && !['test','node_modules'].includes(entry.name))
    .flatMap(entry => entry.isDirectory() ? files(join(directory, entry.name), prefix + entry.name + '/') : [prefix + entry.name]).sort();
}
function copy(source, destination) { mkdirSync(dirname(destination), { recursive: true }); cpSync(source, destination, { recursive: true }); }
function archive(directory, name) {
  execFileSync('tar', ['--sort=name', '--mtime=@0', '--owner=0', '--group=0', '--numeric-owner', '-czf', join(dist, name), '-C', directory, '.']);
}
mkdirSync(join(root, 'components/vendor'), { recursive: true });
for (const [source, target] of [
  ['qrcode-generator/dist/qrcode.js', 'qrcode.js'], ['qrcode-generator/README.md', 'qrcode-LICENSE'],
  ['html-to-image/dist/html-to-image.js', 'html-to-image.js'], ['html-to-image/LICENSE', 'html-to-image-LICENSE'],
]) copy(join(root, 'node_modules', source), join(root, 'components/vendor', target));
rmSync(dist, { recursive: true, force: true }); mkdirSync(dist, { recursive: true });
const sourceCommit = process.env.SOURCE_COMMIT || (() => { try { return execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); } catch { return null; } })();
const release = { format: 'tendriller-contrib', version: pkg.version, source_commit: sourceCommit, requires: { contract: 2 }, core: JSON.parse(readFileSync(join(root,'core.lock.json'),'utf8')), runtime: { id: runtimeManifest.id, version: runtimeManifest.version }, maintainer: 'werg' };
const notices = new Map();
async function bundle(options) {
  const result = await build({ ...options, write: false, metafile: true });
  const notice = bundledNotices(result.metafile.inputs, root);
  if (notice) notices.set(basename(options.outfile), notice);
  writeFileSync(options.outfile, result.outputFiles[0].text + (notice ? '\n/* Third-party notices retained from distributed dependencies.\n' + notice.replaceAll('*/', '* /') + '\n*/\n' : ''));
  return result;
}
const previewPlugin = { name: 'released-preview-runtime', setup(builder) {
  builder.onLoad({ filter: /[/\\]preview-bundle\.mjs$/ }, () => ({ loader:'js', resolveDir:root,
    contents: `import * as support from '@tendriller/runtime/preview-support'; export const implementation=support; export const manifest=${JSON.stringify(runtimeManifest)}; export const assets=${JSON.stringify(assets)};` }));
} };
const resources = {};
for(const directory of ['components','recipes','examples']) for(const file of files(join(root,directory))) resources[directory+'/'+file]=readFileSync(join(root,directory,file)).toString('base64');
for(const path of ['package.json','core.lock.json','workflows/browser.js','workflows/session-archive.js']) if(existsSync(join(root,path)))resources[path]=readFileSync(join(root,path)).toString('base64');
const resourcesPlugin={name:'embedded-release-resources',setup(builder){builder.onLoad({filter:/[/\\]resources\.mjs$/},()=>({loader:'js',contents:`const files=${JSON.stringify(resources)};export const hasResource=path=>Object.hasOwn(files,path);export const readResource=path=>{if(!hasResource(path))throw Error('No such release resource: '+path);return Buffer.from(files[path],'base64')};export const resourceFiles=prefix=>Object.keys(files).filter(path=>path.startsWith(prefix+'/')).sort();`}))}};
const bundling = { bundle:true, platform:'node', format:'esm', target:'node22', logLevel:'warning', external:['bufferutil','utf-8-validate'],
  banner:{js:`import {createRequire as bundleRequire} from 'node:module'; const require=bundleRequire(import.meta.url);`}, plugins:[previewPlugin,resourcesPlugin] };
const tools = join(dist,'tools'); mkdirSync(tools,{recursive:true});
for (const directory of ['components','recipes','examples','docs','workflows']) if (existsSync(join(root,directory))) {
  for (const file of files(join(root,directory))) if (!file.endsWith('.ts') && !file.startsWith('server/')) copy(join(root,directory,file),join(tools,directory,file));
}
for (const name of ['README.md','PROVENANCE.md','core.lock.json']) if (existsSync(join(root,name))) copy(join(root,name),join(tools,name));
const bins = {};
for (const group of ['cli','collector','preview','bridges']) for (const file of readdirSync(join(root,'tools',group,'bin')).filter(name=>name.endsWith('.mjs'))) {
  const path = `tools/${group}/bin/${file}`;
  mkdirSync(dirname(join(tools,path)),{recursive:true});
  await bundle({...bundling,entryPoints:[join(root,path)],outfile:join(tools,path)});
  bins[basename(file,'.mjs')] = path;
  if (group !== 'cli') copy(join(tools,path),join(dist,file));
}
copy(join(root,'tools/bridges/scripts/tendril-wait.sh'),join(dist,'tendril-wait.sh'));
for(const entry of ['examples/training-dashboard/setup.mjs','examples/first-page/run.mjs']) await bundle({...bundling,entryPoints:[join(root,entry)],outfile:join(tools,entry)});
writeFileSync(join(tools,'package.json'),JSON.stringify({name:pkg.name,version:pkg.version,type:'module',bin:bins,engines:pkg.engines,description:pkg.description},null,2)+'\n');
writeFileSync(join(tools,'THIRD_PARTY_NOTICES.txt'), [...new Set(notices.values())].join('\n\n'));
archive(tools,`tendriller-tools-${pkg.version}.tgz`);
const staticDir=join(dist,'static');mkdirSync(staticDir,{recursive:true});
copy(join(root,'PROVENANCE.md'),join(staticDir,'PROVENANCE.md'));
for (const directory of ['components','recipes','examples','docs']) for(const file of files(join(root,directory))) copy(join(root,directory,file),join(staticDir,directory,file));
if(existsSync(join(root,'workflows/browser.js')))copy(join(root,'workflows/browser.js'),join(staticDir,'workflows/browser.js'));
if(existsSync(join(root,'workflows/session-archive.js')))copy(join(root,'workflows/session-archive.js'),join(staticDir,'workflows/session-archive.js'));
for(const entry of ['examples/training-dashboard/setup.mjs','examples/first-page/run.mjs']) await bundle({...bundling,entryPoints:[join(root,entry)],outfile:join(staticDir,entry)});
const galleryBuild=await build({entryPoints:[join(root,'distribution/gallery.ts')],bundle:true,platform:'node',format:'esm',write:false});
const gallery=await import('data:text/javascript;base64,'+Buffer.from(galleryBuild.outputFiles[0].text).toString('base64'));
writeFileSync(join(staticDir,'index.html'),await gallery.starterGallery(process.env.CONTRIB_SOURCE_BASE || `https://github.com/werg/tendriller-contrib/blob/v${pkg.version}`).text());
const catalogFiles=files(staticDir).map(path=>{const bytes=readFileSync(join(staticDir,path));return{path,sha256:hash(bytes),size:bytes.length,type:guessType(path)};});
const catalog={...release,format:'tendriller-catalog',components:JSON.parse(readFileSync(join(root,'components/catalog.json'),'utf8')).components,recipes:recipeCatalog().recipes,files:catalogFiles};
writeFileSync(join(dist,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
writeFileSync(join(staticDir,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
archive(staticDir,`tendriller-static-${pkg.version}.tgz`);
const workflowDir=join(dist,'workflows');mkdirSync(workflowDir,{recursive:true});
const workflowEntry=['workflows/server.ts'].map(path=>join(root,path)).find(existsSync);
if(workflowEntry){
 const result=await build({entryPoints:[workflowEntry],outfile:join(workflowDir,'index.mjs'),bundle:true,platform:'neutral',format:'esm',target:'es2022',metafile:true});
 if(Object.keys(result.metafile.inputs).some(path=>/(?:^|\/)tools\/|node_modules\/(?:ws|playwright|@modelcontextprotocol)/.test(path)))throw Error('Trusted workflow artifact imported tool dependencies.');
 writeFileSync(join(workflowDir,'package.json'),JSON.stringify({name:'@tendriller/workflows',version:pkg.version,type:'module',exports:{'.':'./index.mjs'},tendriller:{contract:2,interfaces:{sessions:{interface_version:'1',schema_version:'1'}}}},null,2)+'\n');
 writeFileSync(join(workflowDir,'manifest.json'),JSON.stringify({...release,format:'tendriller-workflows',interfaces:{sessions:{interface_version:'1',schema_version:'1'}},files:[{path:'index.mjs',sha256:hash(readFileSync(join(workflowDir,'index.mjs')))}]},null,2)+'\n');
 copy(join(root,'PROVENANCE.md'),join(workflowDir,'PROVENANCE.md'));
 archive(workflowDir,`tendriller-workflows-${pkg.version}.tgz`);
}
writeFileSync(join(dist,'THIRD_PARTY_NOTICES.txt'), [...new Set(notices.values())].join('\n\n'));
const artifacts=readdirSync(dist).filter(file=>!readdirSync(dist,{withFileTypes:true}).find(entry=>entry.name===file).isDirectory()&&file!=='manifest.json').sort().map(file=>{const bytes=readFileSync(join(dist,file));return{file,url:`https://github.com/werg/tendriller-contrib/releases/download/v${pkg.version}/${file}`,sha256:hash(bytes),size:bytes.length,type:guessType(file)};});
writeFileSync(join(dist,'manifest.json'),JSON.stringify({...release,artifacts},null,2)+'\n');
console.log(`Built ${artifacts.length} contrib release assets against core ${runtimeManifest.id}`);
