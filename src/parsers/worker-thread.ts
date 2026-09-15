import { parentPort } from 'node:worker_threads';
import { parseBounded } from './worker.js';
import { analyzeSources, mergeAnalysisResults } from '../core/index.js';
import { kiroServerCorrelations } from '../adapters/pipeline.js';
import { boundedUnicodeFindings } from '../rules/unicode.js';
import { opaque } from '../security/safe.js';
import { scanError } from '../security/errors.js';
import type { SourceRecord } from '../core/types.js';
import { LIMITS } from '../application/budget.js';
type Kind='json'|'jsonc'|'toml'|'markdown';
const kinds=new Set<Kind>(['json','jsonc','toml','markdown']);
const findingLimit=(value:unknown)=>Number.isSafeInteger(value)?Math.max(0,Math.min(LIMITS.findings,value as number)):LIMITS.findings;
const unicodeBeforeParse=(source:SourceRecord,code:string,limit:number)=>{
 const unicode=boundedUnicodeFindings(source.content,{sourceId:source.id,scope:source.scope,displayPath:opaque('source',Number(source.id.slice(1))||0)},limit);
 return{findings:unicode.findings,agents:[],mcpServers:[],capabilities:[],errors:[scanError(code,'parse','partial',source.id),...(unicode.truncated?[scanError('AF_REPORT_LIMIT','analyze','partial',source.id),scanError('AF_FINDINGS_LIMIT','analyze','partial',source.id)]:[])]};
};
parentPort?.on('message',(message:unknown)=>{
 const m=message&&typeof message==='object'?message as Record<string,unknown>:undefined;
 if(!m||m.type!=='parse'||!Number.isSafeInteger(m.id)){parentPort?.postMessage({type:'result',id:0,ok:false,code:'AF_PARSER_MESSAGE'});return;}
 try{
  if(m.source&&typeof m.source==='object'){
   const source=m.source as SourceRecord;
   if(typeof source.content!=='string'||typeof source.parseKind!=='string'||!kinds.has(source.parseKind as Kind))throw new Error('AF_PARSER_MESSAGE');
   if(m.findingLimit!==undefined&&(!Number.isSafeInteger(m.findingLimit)||(m.findingLimit as number)<0||(m.findingLimit as number)>LIMITS.findings))throw new Error('AF_PARSER_MESSAGE');
   if(m.kiroCorrelationSecret!==undefined&&(typeof m.kiroCorrelationSecret!=='string'||!/^[a-f0-9]{64}$/.test(m.kiroCorrelationSecret)))throw new Error('AF_PARSER_MESSAGE');
   const limit=findingLimit(m.findingLimit);
   try{
    const parsed=parseBounded(source.parseKind,source.content);
    const analyzed={...source,parsed},result=analyzeSources([analyzed],limit),kiroCorrelations=m.kiroCorrelationSecret?kiroServerCorrelations(analyzed,result,m.kiroCorrelationSecret):[];
    parentPort?.postMessage({type:'result',id:m.id,ok:true,analysis:true,value:{...result,...(kiroCorrelations.length?{kiroCorrelations}:{})}});
   }catch(error){
    const code=error instanceof Error&&/^AF_/.test(error.message)?error.message:'AF_PARSE_FAILED';
    // Unicode evidence is independent of structural syntax and must survive a
    // hostile malformed payload without exposing any raw surrounding text.
    parentPort?.postMessage({type:'result',id:m.id,ok:true,analysis:true,value:mergeAnalysisResults([unicodeBeforeParse(source,code,limit)],limit)});
   }
   return;
  }
  if(typeof m.kind!=='string'||typeof m.text!=='string'||!kinds.has(m.kind as Kind))throw new Error('AF_PARSER_MESSAGE');
  parentPort?.postMessage({type:'result',id:m.id,ok:true,value:parseBounded(m.kind as Kind,m.text)});
 }catch(error){
  const code=error instanceof Error&&/^AF_/.test(error.message)?error.message:'AF_PARSE_FAILED';
  parentPort?.postMessage({type:'result',id:m.id,ok:false,code});
 }
});
