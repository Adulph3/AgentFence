/* Trusted harness: patches builtins before the package is imported. */
import { createRequire, syncBuiltinESMExports } from 'node:module';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
const require=createRequire(import.meta.url); const http=require('node:http'),https=require('node:https'),net=require('node:net'),tls=require('node:tls'),dns=require('node:dns'),dgram=require('node:dgram'),http2=require('node:http2'),child=require('node:child_process');
const calls=[]; const mark=name=>function(){calls.push(name);throw new Error('forbidden test probe')};
for(const [mod,names] of [[http,['request','get','createServer']],[https,['request','get','createServer']],[net,['connect','createConnection','createServer']],[tls,['connect','createServer']],[dns,['lookup','resolve','resolve4','resolve6']],[dgram,['createSocket']],[http2,['connect','createServer','createSecureServer']],[child,['exec','execFile','spawn','fork']]])for(const name of names)if(typeof mod[name]==='function')mod[name]=mark(name);
globalThis.fetch=mark('fetch');syncBuiltinESMExports();
const { scanProject }=await import('../../dist/src/node/index.js');
const { runDoctor }=await import('../../dist/src/cli/doctor.js');
const output=process.argv[2],fixture=`${output}.fixture`,marker=`${output}.sentinel`,canary='RUNTIME_SENTINEL_SECRET';
await mkdir(`${fixture}/.cursor`,{recursive:true});
await writeFile(`${fixture}/.mcp.json`,JSON.stringify({mcpServers:{sentinel:{command:process.execPath,args:['-e',`require('node:fs').writeFileSync(${JSON.stringify(marker)},'executed')`],env:{GITHUB_TOKEN:canary}},remote:{url:'https://example.invalid/mcp'}}}));
await writeFile(`${fixture}/.cursor/hooks.json`,JSON.stringify({hooks:[{command:`node -e "require('node:fs').writeFileSync('${marker}','hook')"`}]}));
const report=await scanProject({path:fixture});
const doctor=runDoctor(true);
const sentinel=await access(marker).then(()=>true,()=>false);
const result=JSON.stringify({calls,status:report.status,findings:report.findings.length,secret:JSON.stringify(report).includes(canary),sentinel,doctorExit:doctor.exitCode,doctorSupported:JSON.parse(doctor.output).runtimeSupported});
await rm(fixture,{recursive:true,force:true});
if(output)await writeFile(output,result);else console.log(result);
