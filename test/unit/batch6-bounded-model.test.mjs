import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import reportSchema from '../../schemas/report-1.0.schema.json' with {type:'json'};
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { safe } from '../../dist/src/security/safe.js';
import { scoreFindings } from '../../dist/src/scoring/score.js';
import { ParserPool } from '../../dist/src/parsers/pool.js';
import { scanProject } from '../../dist/src/node/index.js';

const baseFinding={id:'0123456789abcdef',ruleId:'AF-X-001',ruleVersion:'1.0.0',title:'safe',severity:'high',category:'shell',description:'safe',evidence:{kind:'field',summary:'safe',factIds:['F-0123456789abcdef']},location:{sourceId:'S1',scope:'project',displayPath:'source-1'},relatedLocations:[],recommendation:'safe',confidence:'high',applicability:'potential',agentIds:[],riskKey:'shell:AF-X-001:S1:0',references:[],relatedFindingIds:[]};
const array=(count,item)=>Array.from({length:count},()=>item);

test('SafeText emits complete printable ASCII tokens without splitting Unicode escapes',()=>{
 const value=safe(`A${'😀'.repeat(100)}`);assert.ok(value.length<=480);assert.match(value,/^[\x20-\x7e]*$/);assert.equal(value,safe(`A${'😀'.repeat(100)}`));assert.ok(value.endsWith('}')||value.endsWith('A'));assert.equal(/\\u(?:[0-9A-F]{0,3}|\{[0-9A-F]*$)$/.test(value),false);
});
test('public score groups are idempotent for duplicate findings',()=>{
 const one=scoreFindings([baseFinding],1),twice=scoreFindings([baseFinding,baseFinding],1);assert.equal(one.value,twice.value);assert.deepEqual(one.groups,twice.groups);assert.deepEqual(twice.groups[0]?.findingIds,[baseFinding.id]);
});
test('oversized parsed keys and Markdown lines reject without truncation and scan partial',async()=>{
 const pool=new ParserPool(),key='k'.repeat(65_537),line='X'.repeat(65_537),root=await mkdtemp(join(tmpdir(),'agentfence-bounded-'));
 try{await assert.rejects(pool.parse('json',`{"${key}":1}`),/AF_PARSE_STRING|AF_PARSE_GUARD/);await assert.rejects(pool.parse('markdown',line),/AF_PARSE_STRING/);await writeFile(join(root,'AGENTS.md'),line);const report=await scanProject({path:root});assert.equal(report.status,'partial');assert.ok(report.errors.some(error=>error.code==='AF_PARSE_STRING'));assert.equal(JSON.stringify(report).includes(line.slice(0,128)),false);}finally{await pool.close();await rm(root,{recursive:true,force:true});}
});
test('report schema rejects every bounded array overflow while normal reports validate',async()=>{
 const validate=new Ajv2020({strict:true}).compile(reportSchema),report=await scanProject({path:'test/fixtures/risky'});assert.equal(validate(report),true,JSON.stringify(validate.errors));
 const location={sourceId:'S1',scope:'project',displayPath:'source-1'},source={id:'S1',location},agent={id:'A-codex-S0',kind:'codex',detection:'possible',sources:['S1'],adapterVersion:'1.0.0',runtimeVersion:'unknown',effectiveState:'unverified'},server={id:'0123456789abcdef',agentId:'A-codex-S0',principalId:'P1',location,transport:'stdio',enabled:'unknown',launcher:'direct',packageSelector:'absent',envBindings:[],roots:[],capabilityIds:[]},capability={id:'0123456789abcdef',principalId:'P1',kind:'network',basis:'explicit-config',confidence:'high',applicability:'potential',sourceIds:['S1'],constraints:[]},error={code:'AF_TEST',stage:'parse',message:'safe',effect:'partial',retryable:false},group={riskKey:'shell:AF-X-001:S1:0',findingIds:[baseFinding.id],deducted:1},category={category:'shell',raw:1,cap:30,deducted:1};
 const reject=(mutate)=>{const value=structuredClone(report);mutate(value);assert.equal(validate(value),false,'schema accepted bounded-array overflow');};
 reject(value=>{value.scope.exclusions=array(257,'safe');});reject(value=>{value.coverage.limitations=array(257,'safe');});reject(value=>{value.coverage.skippedByReason=Object.fromEntries(array(257,0).map((_,index)=>[`x${index}`,0]));});
 reject(value=>{value.sources=array(1001,source);});reject(value=>{value.agents=array(1001,agent);});reject(value=>{value.agents=[{...agent,sources:array(1001,'S1')}];});
 reject(value=>{value.mcpServers=array(1001,server);});reject(value=>{value.mcpServers=[{...server,envBindings:array(257,{name:'ENV',mode:'unknown'})}];});reject(value=>{value.mcpServers=[{...server,roots:array(257,{class:'other'})}];});reject(value=>{value.mcpServers=[{...server,capabilityIds:array(1001,'0123456789abcdef')}];});
 reject(value=>{value.capabilities=array(10001,capability);});reject(value=>{value.capabilities=[{...capability,sourceIds:array(1001,'S1')}];});reject(value=>{value.capabilities=[{...capability,constraints:array(257,'safe')}];});
 reject(value=>{value.findings=array(10001,baseFinding);});reject(value=>{value.findings=[{...baseFinding,evidence:{...baseFinding.evidence,factIds:array(10001,'F-0123456789abcdef')}}];});reject(value=>{value.findings=[{...baseFinding,evidence:{...baseFinding.evidence,knownEnvNames:array(257,'safe')}}];});reject(value=>{value.findings=[{...baseFinding,evidence:{...baseFinding.evidence,codePoints:array(257,'U+200B')}}];});reject(value=>{value.findings=[{...baseFinding,relatedLocations:array(257,location)}];});reject(value=>{value.findings=[{...baseFinding,agentIds:array(257,'A-codex-S0')}];});reject(value=>{value.findings=[{...baseFinding,references:array(65,'https://example.invalid')}];});reject(value=>{value.findings=[{...baseFinding,relatedFindingIds:array(10001,'0123456789abcdef')}];});
 reject(value=>{value.errors=array(10001,error);});reject(value=>{value.score.categories=array(11,category);});reject(value=>{value.score.groups=array(10001,group);});reject(value=>{value.score.groups=[{...group,findingIds:array(10001,'0123456789abcdef')}];});
});
