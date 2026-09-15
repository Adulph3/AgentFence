/* Trusted harness: patches builtins before the package is imported. */
import { createRequire, syncBuiltinESMExports } from 'node:module';
import { writeFile } from 'node:fs/promises';
const require=createRequire(import.meta.url); const http=require('node:http'),https=require('node:https'),net=require('node:net'),tls=require('node:tls'),dns=require('node:dns'),dgram=require('node:dgram'),http2=require('node:http2'),child=require('node:child_process');
const calls=[]; const mark=name=>function(){calls.push(name);throw new Error('forbidden test probe')};
for(const [mod,names] of [[http,['request','get','createServer']],[https,['request','get','createServer']],[net,['connect','createConnection','createServer']],[tls,['connect','createServer']],[dns,['lookup','resolve','resolve4','resolve6']],[dgram,['createSocket']],[http2,['connect','createServer','createSecureServer']],[child,['exec','execFile','spawn','fork']]])for(const name of names)if(typeof mod[name]==='function')mod[name]=mark(name);
globalThis.fetch=mark('fetch');syncBuiltinESMExports();
const { scanProject }=await import('../../dist/src/node/index.js');
const report=await scanProject({path:new URL('../fixtures/risky',import.meta.url).pathname});
const result=JSON.stringify({calls,status:report.status,findings:report.findings.length,secret:JSON.stringify(report).includes('AF_TEST_CANARY_9b1')});
if(process.argv[2])await writeFile(process.argv[2],result);else console.log(result);
