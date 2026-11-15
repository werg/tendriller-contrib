import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const violations=[];
function visit(path){for(const entry of readdirSync(path,{withFileTypes:true})){
 const file=join(path,entry.name);if(entry.isDirectory()){if(!['node_modules','dist','test-results','.git'].includes(entry.name))visit(file);continue;}
 if(!/\.(?:mjs|js|ts|html)$/.test(file)||file.endsWith('check-boundaries.mjs'))continue;
 const text=readFileSync(file,'utf8');
 if(/(?:from\s*|import\s*\(|new URL\(\s*)['"][^'"]*(?:server\/src|server\/public|\.\.\/tendriller\/runtime|\.\.\/contract)/.test(text))violations.push(file+': private core import');
 if(/\._core\b/.test(text))violations.push(file+': private runtime hook');
 if(!file.includes('/test/') && /_tendril\/snippets\//.test(text))violations.push(file+': ambient component path');
 if(file.startsWith('components/')&&!file.includes('/test/')&&/(?:const\s+(?:LIB|MP|MODEL)\s*=\s*["'`]https?:|import\s*\(\s*["'`]https?:)/.test(text))violations.push(file+': undeclared remote executable dependency');
}}
for(const path of ['tools','components','recipes','examples','workflows','test'])try{visit(path)}catch(error){if(error.code!=='ENOENT')throw error;}
if(violations.length)throw Error(violations.join('\n'));
console.log('Public package and page asset boundaries verified.');
