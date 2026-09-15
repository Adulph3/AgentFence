import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import reportSchema from '../../schemas/report-1.0.schema.json' with {type:'json'};
import { mergeAnalysisResults } from '../../dist/src/core/index.js';
import { scoreFindings } from '../../dist/src/scoring/score.js';
import { finalErrors } from '../../dist/src/node/index.js';
import { finding } from '../../dist/src/analysis/finding.js';
import { scanError } from '../../dist/src/security/errors.js';

const agent={id:'A-generic-mcp-S0',kind:'generic-mcp',detection:'confirmed-config',sources:['S1'],adapterVersion:'1.0.0',runtimeVersion:'unknown',effectiveState:'unverified'};
const server=index=>({id:index.toString(16).padStart(16,'0'),agentId:agent.id,principalId:'P',location:{sourceId:`S${index+1}`,scope:'project',displayPath:`source-${index+1}`},transport:'stdio',enabled:'yes',launcher:'direct',packageSelector:'absent',envBindings:[],roots:[],capabilityIds:[]});
test('mergeAnalysisResults produces bounded partial-safe report collections',()=>{
 const results=Array.from({length:334},(_,sourceIndex)=>({findings:[],agents:[{...agent,sources:[`S${sourceIndex+1}`]}],mcpServers:[server(sourceIndex*3),server(sourceIndex*3+1),server(sourceIndex*3+2)],capabilities:[],errors:[]}));
 const merged=mergeAnalysisResults(results);assert.equal(merged.mcpServers.length,1000);assert.ok(merged.errors.some(error=>error.code==='AF_REPORT_LIMIT'));
 const report={schemaVersion:'1.0.0',engineVersion:'0.1.0',rulesetVersion:'1.0.0',kind:'scan',status:'partial',scope:{project:'PROJECT',userConfigs:false,exclusions:[]},coverage:{eligibleFiles:334,analyzedFiles:334,visitedEntries:334,skippedByReason:{},limitations:[]},sources:Array.from({length:334},(_,index)=>({id:`S${index+1}`,location:{sourceId:`S${index+1}`,scope:'project',displayPath:`source-${index+1}`}})),...merged,score:scoreFindings(merged.findings,334,true),thresholdExceeded:false,presentation:{minimumSeverity:'info'}};
 const validate=new Ajv2020({strict:true}).compile(reportSchema);assert.equal(validate(report),true,JSON.stringify(validate.errors));assert.ok(report.score.groups.length<=10_000);
});
test('mergeAnalysisResults caps agents, capabilities, errors, findings, and public score groups',()=>{
 const findings=Array.from({length:10_001},(_,index)=>finding('AF-MCP-001','mcp','info','high',{sourceId:'S1',scope:'project',displayPath:'source-1'},'Local process MCP server is declared','Review executable identity and process privileges','potential',[],{principalId:'P',semanticFactKey:`bounded-${index}`}));
 const agents=Array.from({length:1_001},(_,index)=>({...agent,id:`A-generic-mcp-S${index}`}));
 const capabilities=Array.from({length:10_001},(_,index)=>({id:index.toString(16).padStart(16,'0'),principalId:'P',kind:'network',basis:'explicit-config',confidence:'high',applicability:'potential',sourceIds:['S1'],constraints:[]}));
 const errors=Array.from({length:10_001},()=>scanError('AF_PARSE_FAILED','parse','partial','S1'));
 const merged=mergeAnalysisResults([{findings,agents,mcpServers:[],capabilities,errors}]);
 assert.equal(merged.agents.length,1000);assert.equal(merged.capabilities.length,10_000);assert.equal(merged.findings.length,10_000);assert.equal(merged.errors.length,10_000);assert.ok(merged.errors.some(error=>error.code==='AF_REPORT_LIMIT'));assert.ok(scoreFindings(merged.findings,1,true).groups.length<=10_000);
});
test('scan-level error finalizer preserves a truncation marker within the schema limit',()=>{
 const errors=Array.from({length:10_001},()=>scanError('AF_PARSE_FAILED','parse','partial','S1'));const bounded=finalErrors([...errors,scanError('AF_SOURCE_UNREADABLE','read','partial','S2')]);assert.equal(bounded.length,10_000);assert.ok(bounded.some(error=>error.code==='AF_REPORT_LIMIT'));
});
