import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import reportSchema from '../../schemas/report-1.0.schema.json' with {type:'json'};
import { ParserPool } from '../../dist/src/parsers/pool.js';
import { mergeAnalysisResults, scoreFindings } from '../../dist/src/core/index.js';

test('parser-worker matrix: strict modes, guards, cancellation, and cleanup', async () => {
  const pool=new ParserPool();
  try {
    assert.deepEqual(await pool.parse('json','{"a":1}'),{a:1});
    await assert.rejects(pool.parse('json','{/*comment*/"a":1}'),/AF_PARSE_JSON/);
    assert.deepEqual(await pool.parse('jsonc','{/*comment*/"a":1,}'),{a:1});
    await assert.rejects(pool.parse('json','{"a":1,"a":2}'),/AF_PARSE_DUPLICATE_KEY/);
    await assert.rejects(pool.parse('json','{"__proto__":1}'),/AF_PARSE_GUARD/);
    await assert.rejects(pool.parse('json','{'),/AF_PARSE_JSON/);
    await assert.rejects(pool.parse('toml','a = ['),/AF_PARSE_TOML/);
    assert.ok(Array.isArray(await pool.parse('markdown','text\n```\ncode\n```')));
    await assert.rejects(pool.parse('markdown','```\nunterminated'),/AF_MARKDOWN_FENCE/);
    const deep='['.repeat(65)+'0'+']'.repeat(65);await assert.rejects(pool.parse('json',deep),/AF_PARSE_DEPTH/);
    await assert.rejects(pool.parse('json',`{"x":"${'a'.repeat(65537)}"}`),/AF_PARSE_GUARD|AF_PARSE_STRING/);
    const controller=new AbortController();controller.abort();await assert.rejects(pool.parse('json','{}',controller.signal),/AF_INTERRUPTED/);
  } finally { await pool.close(); }
});
test('worker preserves Unicode findings when every supported parse kind is malformed',async()=>{
 const pool=new ParserPool();
 try{
  for(const [id,parseKind,content] of [['S1','json','{"x":"\u202e"'],['S2','toml','x = "\u202e'],['S3','markdown','\u202e\n```']] ){
   const result=await pool.analyze({id,scope:'project',kind:'generic-mcp',relativePath:'.mcp.json',parseKind,principalId:'P',content});
   assert.equal(result.findings.filter(finding=>finding.category==='unicode').length,1);
   assert.ok(result.errors.some(error=>error.stage==='parse'));
  }
 }finally{await pool.close();}
});
test('worker bounds malformed Unicode fallback while preserving its parse diagnostic',async()=>{
 const pool=new ParserPool();
 try{
 const result=await pool.analyze({id:'S9',scope:'project',kind:'generic-mcp',relativePath:'.mcp.json',parseKind:'json',principalId:'P',content:`{"x":"${'\u202e'.repeat(10_001)}`});
  assert.equal(result.findings.length,10_000);assert.ok(result.findings.every(finding=>finding.category==='unicode'));assert.ok(result.errors.some(error=>error.code==='AF_PARSE_JSON'));assert.ok(result.errors.some(error=>error.code==='AF_REPORT_LIMIT'));
  const merged=mergeAnalysisResults([result]),report={schemaVersion:'1.0.0',engineVersion:'0.1.0',rulesetVersion:'1.0.0',kind:'scan',status:'partial',scope:{project:'PROJECT',userConfigs:false,exclusions:[]},coverage:{eligibleFiles:1,analyzedFiles:1,visitedEntries:1,skippedByReason:{},limitations:[]},sources:[{id:'S9',location:{sourceId:'S9',scope:'project',displayPath:'source-9'},adapter:'generic-mcp'}],...merged,score:scoreFindings(merged.findings,1,true),thresholdExceeded:false,presentation:{minimumSeverity:'info'}},validate=new Ajv2020({strict:true}).compile(reportSchema);assert.equal(validate(report),true,JSON.stringify(validate.errors));
 }finally{await pool.close();}
});
test('worker accepts only a lowered internal finding allowance for malformed Unicode fallback',async()=>{const pool=new ParserPool();try{const result=await pool.analyze({id:'S8',scope:'project',kind:'generic-mcp',relativePath:'.mcp.json',parseKind:'json',principalId:'P',content:`{"x":"${'\u202e'.repeat(11)}`},undefined,3);assert.equal(result.findings.length,3);assert.ok(result.errors.some(error=>error.code==='AF_PARSE_JSON'));assert.ok(result.errors.some(error=>error.code==='AF_FINDINGS_LIMIT'));assert.ok(result.errors.some(error=>error.code==='AF_REPORT_LIMIT'));}finally{await pool.close();}});
test('worker retains a schema-bounded server when nested env bindings exceed the cap',async()=>{const pool=new ParserPool();try{const env=Object.fromEntries(Array.from({length:257},(_,index)=>[`SAFE_${index}`,'x'])),result=await pool.analyze({id:'S1',scope:'project',kind:'generic-mcp',relativePath:'.mcp.json',parseKind:'json',principalId:'P1',content:JSON.stringify({mcpServers:{one:{command:'tool',env}}})});assert.equal(result.mcpServers.length,1);assert.equal(result.mcpServers[0].envBindings.length,256);assert.ok(result.errors.some(error=>error.code==='AF_REPORT_LIMIT'));}finally{await pool.close();}});
