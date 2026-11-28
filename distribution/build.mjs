import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readCookbooks, readingCatalog, walk } from './catalog.mjs';
import { gallery } from './gallery.mjs';
import { snapshotSource, finishSnapshotSource, snapshotContentPaths } from './snapshot-source.mjs';
import { packSnapshot } from './snapshot-archive.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const check = process.argv.includes('--check');
const entries = readCookbooks(root);
const catalog = readingCatalog(entries);
const groups = [...new Set(entries.map(e=>e.group || 'Other approaches'))].sort();
const index = groups.map(group=>`### ${group}\n\n`+entries.filter(e=>(e.group||'Other approaches')===group).map(e=>`- [${e.title}](${e.path})${e.runnable ? ' *(runnable snippets)*' : ''} — ${e.summary}`).join('\n')).join('\n\n');
const readme = readFileSync(resolve(root,'README.md'),'utf8').replace(/<!-- cookbook-index:start -->[\s\S]*?<!-- cookbook-index:end -->/, `<!-- cookbook-index:start -->\n${index}\n<!-- cookbook-index:end -->`);
const agent = [
 "# Tendriller cookbook reading index",
 "For initial setup, read [connected-app setup](guides/connected-app-setup.md). Keep the selected connector’s serviceOrigin or the origin supplied by the person. Call tendril_guide when available; use the returned same-origin setup links if the installed catalog omits it. Check /api/readiness before new-app downloads or installation, stop on paused or unverified creation, and verify the host’s immutable first-app release composition. An empty app list is not a missing plugin. Prepare and publish before owner sign-in; never block on a claimed reply. Existing apps resume their retained identity and actual permissions. Core’s deployed guide owns runnable setup; source-pinned evidence below records only the tested historical composition.",
 "Inspect the task and existing files first. Select only relevant guides; related links are optional reading, not dependencies. Explain consequential choices and a plausible rejected alternative. Implement page-owned source through the public core contract. Reading a guide installs nothing.",
 "Use the [common application session](guides/application-primitives.md): one authored operation set and coherent derived views across native and browser peers. Application order is signed author time, signing key and stable opId only. Stored, materialized, retained and finalized are independent observations. Initialized browsers save and materialize offline without an agent, peer or finalizer. Preserve exact signed intents and retry identities; late earlier facts can revise outcomes. Preview mutations safely with session.simulate().",
 "Keep account authority, unified $admission (authorization, verify() post-conditions, optional history admission, live signals), kernel-enforced $seals, $keys (PQ X-Wing, TreeKEM, anonymous padded envelopes, topicRings), Private Capability Vaults (chronolog/vaults), SQL write RLS, publication and external-tool authority separate. Schema and permission changes are ordinary authored transactions. Payload roles grant no credentials. Open history admission is the ordinary default; configured providers prove admission and closed time, never operation order. Explain late exclusion behind a sealed frontier. Irreversible work needs verified final prerequisites and an idempotent external-effect protocol.",
 "For unattended replies, read [Connect an agent that actually resumes](cookbooks/connect-resuming-agent/COOKBOOK.md) and the selected core host's conversation-delivery guide when it advertises one. Bind ephemeral availability to the actual request worker and handled topics, not the native session owner or one-shot waiter. Qualify the exact conversation through a request, receipt and answer, then a second request after the turn ends. Preserve private thread bindings and durable handled checkpoints; queue admission is not completed work, and no existing ChatGPT conversation wake is implied.",
 "For multi-participant workspaces, start with [Coordinate people, views and independent agents](cookbooks/coordinate-participants/COOKBOOK.md). Use maintained public owner, collaboration and view-reference primitives; the reference includes two authored layouts and exact-artifact native conformance. Labels and availability do not establish agent execution authority.",
 "The [peer application cookbook](cookbooks/run-a-peer-application/COOKBOOK.md) uses public @chronolog/peer-session APIs directly. Prefer createLiveView/createViewStore or equivalent FRP derivation: materialized snapshot plus separate local drafts/view state. Invalidate and rederive after changed order, outcomes or schema; preserve stable selection and focus. Executable checks require matching immutable archives and fresh evidence for this protocol.",
 "Start from an [application journey](guides/use-cases.md) when the user names an outcome rather than a technical decision. Follow the person through first use, correction, completion, and return; preserve the evidence boundary of every claimed check.",
 index,
 "See [evidence](guides/evidence.md), [contribution guidance](guides/contributing.md), and [core public entry](https://github.com/werg/tendriller/blob/master/agent.md)."
].join('\n\n') + '\n';
const sourceMap = {format:'tendriller-cookbook-origins',cookbooks:entries.map(e=>({id:e.id,sources:e.sources||[]}))};
const outputs = new Map([
 ['catalog.json',JSON.stringify(catalog,null,2)+'\n'],['index.html',gallery(entries)],['README.md',readme],['agent.md',agent],
 ['llms.txt','# Tendriller cookbooks\n\n> Adaptable reasoning for page-owned applications. No UI package or install graph.\n\n- [Connected-app setup on the selected service](guides/connected-app-setup.md)\n- [Common application session](guides/application-primitives.md)\n- [Worker lifetime and conversation delivery](cookbooks/connect-resuming-agent/COOKBOOK.md)\n- [Multi-participant reference](cookbooks/coordinate-participants/COOKBOOK.md)\n- [Exact-artifact collaboration checks](cookbooks/coordinate-participants/checks/README.md)\n- [Application journeys](guides/use-cases.md)\n- [Agent reading index](agent.md)\n- [Catalog](catalog.json)\n- [Usage](guides/using-cookbooks.md)\n- [Evidence](guides/evidence.md)\n- [Core public contract](https://github.com/werg/tendriller/blob/master/agent.md)\n'],
 ['distribution/source-map.json',JSON.stringify(sourceMap,null,2)+'\n'],
]);
for(const [path,content] of outputs){if(check){if(readFileSync(resolve(root,path),'utf8')!==content)throw Error(`Generated file is stale: ${path}; run npm run build`);}else writeFileSync(resolve(root,path),content);}
if(!check){
 const initialSource = snapshotSource(root, process.env.SOURCE_COMMIT);
 const dist=resolve(root,'dist'),site=resolve(dist,'static');rmSync(dist,{recursive:true,force:true});mkdirSync(site,{recursive:true});
 for (const path of snapshotContentPaths) {
  mkdirSync(dirname(resolve(site, path)), { recursive: true });
  cpSync(resolve(root, path), resolve(site, path), { recursive: true });
 }
 const { commit: sourceCommit, dirty } = finishSnapshotSource(root, initialSource, process.env.SOURCE_COMMIT, site);
 const sourceBase = sourceCommit && !dirty ? `https://github.com/werg/tendriller-contrib/blob/${sourceCommit}` : undefined;
 // Current discovery follows main; a clean exported snapshot names its exact source.
 writeFileSync(resolve(site, 'catalog.json'), JSON.stringify(readingCatalog(entries, sourceBase), null, 2) + '\n');
 writeFileSync(resolve(site, 'index.html'), gallery(entries, sourceBase));
 const pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
 const file= `tendriller-cookbooks-${pkg.version}.tgz`;
 writeFileSync(resolve(dist, file), packSnapshot(site));
 const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
 writeFileSync(resolve(dist,'manifest.json'),JSON.stringify({format:'tendriller-cookbook-snapshot',version:pkg.version,source_commit:sourceCommit,source_dirty:dirty,cookbooks:entries.length,artifacts:[{file,sha256:digest(readFileSync(resolve(dist,file)))}],files:walk(site).map(path=>({path:relative(site,path).replaceAll('\\','/'),sha256:digest(readFileSync(path))}))},null,2)+'\n');
}
console.log(`${check?'Verified':'Built'} ${entries.length} cookbook reading entries${check?'':' and a content-only snapshot'}.`);
