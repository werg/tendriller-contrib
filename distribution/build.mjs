import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readCookbooks, readingCatalog, walk } from './catalog.mjs';
import { gallery } from './gallery.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const check = process.argv.includes('--check');
const entries = readCookbooks(root);
const catalog = readingCatalog(entries);
const groups = [...new Set(entries.map(e=>e.group || 'Other approaches'))].sort();
const index = groups.map(group=>`### ${group}\n\n`+entries.filter(e=>(e.group||'Other approaches')===group).map(e=>`- [${e.title}](${e.path}) — ${e.summary}`).join('\n')).join('\n\n');
const readme = readFileSync(resolve(root,'README.md'),'utf8').replace(/<!-- cookbook-index:start -->[\s\S]*?<!-- cookbook-index:end -->/, `<!-- cookbook-index:start -->\n${index}\n<!-- cookbook-index:end -->`);
const agent = [
 "# Tendriller cookbook reading index",
 "Inspect the task and existing files first. Select only relevant guides; related links are optional reading, not dependencies. Explain consequential choices and a plausible rejected alternative. Implement page-owned source through the public core contract. Reading a guide installs nothing.",
 "Use the [common application session](guides/application-primitives.md): one command/query/event API and one journal across native and browser peers. Storage, transport and engine capabilities define roles. The host is an explicit filtered control/publication participant; ordinary application work travels between peers. applied() reports execution in the selected history; shared() separately observes retained coverage on another peer. Explicit recovery may abandon a recent suffix, including previously applied work. Preserve original identity on exact retry, reread after recovery and deliberately link any new reapplication.",
 "Keep author, sequencing, recovery, data membership, ownership and external-tool authority separate. Preserve verified requester provenance through effect journals; payload roles grant no private credentials. Irreversible work requires an explicitly configured protected checkpoint covering its prerequisites or a durable external-action service. Keep stable effect identities, authorization and reconciliation; reversible computation may follow an explicit rerun policy. Stronger guarantees are declared capabilities of the same application contract, not alternate runtime profiles.",
 "For multi-participant workspaces, start with [Coordinate people, views and independent agents](cookbooks/coordinate-participants/COOKBOOK.md). Use maintained public owner, collaboration and view-reference primitives; the reference includes two authored layouts and exact-artifact native conformance. Labels and availability do not establish agent execution authority.",
 "The [peer application cookbook](cookbooks/run-a-peer-application/COOKBOOK.md) uses the public applied()/shared() contract directly. Executable examples install an explicitly supplied matching @chronolog/peer-session archive. The [qualification record](cookbooks/run-a-peer-application/notes/peer-generation-qualification.md) preserves clean native RTC, SQL and hosted runs with exact source and artifact hashes. Browser ownership, SDK recovery orchestration and deployed operating limits require their own evidence. Historical reports retain their source-specific scope and do not define another supported session API.",
 "Start from an [application journey](guides/use-cases.md) when the user names an outcome rather than a technical decision. Follow the person through first use, correction, completion, and return; preserve the evidence boundary of every claimed check.",
 index,
 "See [evidence](guides/evidence.md), [contribution guidance](guides/contributing.md), and [core public entry](https://github.com/werg/tendriller/blob/master/agent.md)."
].join('\n\n') + '\n';
const sourceMap = {format:'tendriller-cookbook-origins',cookbooks:entries.map(e=>({id:e.id,sources:e.sources||[]}))};
const outputs = new Map([
 ['catalog.json',JSON.stringify(catalog,null,2)+'\n'],['index.html',gallery(entries)],['README.md',readme],['agent.md',agent],
 ['llms.txt','# Tendriller cookbooks\n\n> Adaptable reasoning for page-owned applications. No UI package or install graph.\n\n- [Common application session](guides/application-primitives.md)\n- [Multi-participant reference](cookbooks/coordinate-participants/COOKBOOK.md)\n- [Exact-artifact collaboration checks](cookbooks/coordinate-participants/checks/README.md)\n- [Application journeys](guides/use-cases.md)\n- [Agent reading index](agent.md)\n- [Catalog](catalog.json)\n- [Usage](guides/using-cookbooks.md)\n- [Evidence](guides/evidence.md)\n- [Core public contract](https://github.com/werg/tendriller/blob/master/agent.md)\n'],
 ['distribution/source-map.json',JSON.stringify(sourceMap,null,2)+'\n'],
]);
for(const [path,content] of outputs){if(check){if(readFileSync(resolve(root,path),'utf8')!==content)throw Error(`Generated file is stale: ${path}; run npm run build`);}else writeFileSync(resolve(root,path),content);}
if(!check){
 const dist=resolve(root,'dist'),site=resolve(dist,'static');rmSync(dist,{recursive:true,force:true});mkdirSync(site,{recursive:true});
 for(const path of ['cookbooks','guides','README.md','PROVENANCE.md','catalog.json','index.html','agent.md','llms.txt'])cpSync(resolve(root,path),resolve(site,path),{recursive:true});
 mkdirSync(resolve(site, 'distribution'), { recursive: true });
 cpSync(resolve(root, 'distribution/source-map.json'), resolve(site, 'distribution/source-map.json'));
 let commit = null, dirty = true;
 try {
  commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().length > 0;
 } catch {}
 const sourceCommit = process.env.SOURCE_COMMIT || commit;
 if (sourceCommit && !/^[a-f0-9]{40}$/.test(sourceCommit)) throw Error('SOURCE_COMMIT must be a full Git commit SHA');
 const sourceBase = sourceCommit && !dirty ? `https://github.com/werg/tendriller-contrib/blob/${sourceCommit}` : undefined;
 // Current discovery follows main; a clean exported snapshot names its exact source.
 writeFileSync(resolve(site, 'catalog.json'), JSON.stringify(readingCatalog(entries, sourceBase), null, 2) + '\n');
 writeFileSync(resolve(site, 'index.html'), gallery(entries, sourceBase));
 const pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
 const file= `tendriller-cookbooks-${pkg.version}.tgz`;
 execFileSync('tar',['--sort=name','--mtime=@0','--owner=0','--group=0','--numeric-owner','-czf',resolve(dist,file),'-C',site,'.']);
 const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
 writeFileSync(resolve(dist,'manifest.json'),JSON.stringify({format:'tendriller-cookbook-snapshot',version:pkg.version,source_commit:sourceCommit,source_dirty:dirty,cookbooks:entries.length,artifacts:[{file,sha256:digest(readFileSync(resolve(dist,file)))}],files:walk(site).map(path=>({path:relative(site,path).replaceAll('\\','/'),sha256:digest(readFileSync(path))}))},null,2)+'\n');
}
console.log(`${check?'Verified':'Built'} ${entries.length} cookbook reading entries${check?'':' and a content-only snapshot'}.`);
