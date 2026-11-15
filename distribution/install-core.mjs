// Materialize only the two exact public artifacts declared by core.lock.json.
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const lock=JSON.parse(await readFile(join(root,'core.lock.json'),'utf8'));
if(lock.format!=='tendriller-core-lock'||lock.version!==1||lock.artifacts.length!==2)throw Error('Invalid core artifact lock.');
for(const artifact of lock.artifacts){
 if(!/^[\w.-]+\.tgz$/.test(artifact.file)||!/^[a-f0-9]{64}$/.test(artifact.sha256))throw Error('Invalid artifact identity.');
 const url=new URL(artifact.url);if(url.protocol!=='https:'||/\/(?:latest|main|master)\//.test(url.pathname))throw Error('Core dependencies must use immutable HTTPS release URLs.');
 const response=await fetch(url);if(!response.ok)throw Error(`Cannot fetch ${artifact.file}: HTTP ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(createHash('sha256').update(bytes).digest('hex')!==artifact.sha256)throw Error(`Integrity mismatch for ${artifact.file}`);
 const directory=join(root,'vendor/core');await mkdir(directory,{recursive:true});const temp=join(directory,artifact.file+'.'+randomUUID()+'.tmp');await writeFile(temp,bytes);await rename(temp,join(directory,artifact.file));
}
execFileSync('npm',['ci'],{cwd:root,stdio:'inherit'});
