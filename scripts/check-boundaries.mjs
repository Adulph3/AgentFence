import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
const bad=/node:(?:child_process|http|https|net|tls|dns|dgram|http2|vm)|\b(?:eval|Function)\s*\(/;
async function files(d){const out=[];for(const e of await readdir(d,{withFileTypes:true})){const p=join(d,e.name);if(e.isDirectory())out.push(...await files(p));else if(p.endsWith('.ts'))out.push(p);}return out;}
for(const f of await files('src'))if(bad.test(await readFile(f,'utf8')))throw new Error(`forbidden boundary import: ${f}`);
console.log('boundary checks passed');
