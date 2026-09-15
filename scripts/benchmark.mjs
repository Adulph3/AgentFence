import { performance } from 'node:perf_hooks';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanProject } from '../dist/src/node/index.js';
const root=await mkdtemp(join(tmpdir(),'agentfence-benchmark-'));
try {
  /* Plan corpus: 10,000 visited entries, 50 supported candidates, about 2 MiB. */
  for(let d=0;d<100;d++){const dir=join(root,`d${String(d).padStart(3,'0')}`);await mkdir(dir);for(let f=0;f<100;f++)await writeFile(join(dir,`f${String(f).padStart(3,'0')}.txt`),'x');if(d<50){const payload='x'.repeat(40_000);await writeFile(join(dir,'.mcp.json'),JSON.stringify({mcpServers:{server:{command:'reviewed-tool',args:[payload]}}}));}}
  const samples=[];for(let i=0;i<5;i++){const start=performance.now();const report=await scanProject({path:root});if(report.status!=='complete'||report.coverage.analyzedFiles!==50)throw new Error('benchmark corpus was not fully analyzed');samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);const percentile=p=>samples[Math.min(samples.length-1,Math.ceil(samples.length*p)-1)]??0;console.log(JSON.stringify({corpus:'generated-10000-entry-50-candidate-2MiB',runs:samples.length,p50Ms:Number(percentile(.5).toFixed(2)),p95Ms:Number(percentile(.95).toFixed(2)),rssBytes:process.memoryUsage().rss,targetP95Ms:2000,passed:percentile(.95)<=2000}));
} finally { await rm(root,{recursive:true,force:true}); }
