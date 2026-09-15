import type { AgentKind, AnalyzeResult, Applicability, Capability, Confidence, DetectedAgent, Finding, MCPServer, ScanError, SourceRecord } from './types.js';
import { opaque } from '../security/safe.js';
import { stableId } from './ids.js';
import { finding } from '../analysis/finding.js';
import { analyzeInstructions } from '../analysis/instructions.js';
import { boundedUnicodeFindings } from '../rules/unicode.js';
import { normalizeFindings } from './normalize.js';
import { analyzeStructuredSource, detectedAgent, detectedAgentId, kiroServerCorrelations, newKiroCorrelationSecret, type KiroCorrelatedAnalyzeResult } from '../adapters/pipeline.js';
import { scanError } from '../security/errors.js';
import { workspaceKey } from '../discovery/workspace.js';
import { parseBounded } from '../parsers/worker.js';
import { extractAdapterFacts } from '../adapters/dispatch.js';
import { LIMITS } from '../application/budget.js';
export { scoreFindings } from '../scoring/score.js';
export type { ScanReport, ScanFailure, DoctorReport, Finding, ScoreResult, SafeText, Severity, Confidence, Applicability, Category, SourceRecord, AnalyzeResult } from './types.js';

const location=(source:SourceRecord)=>({sourceId:source.id,scope:source.scope,displayPath:opaque('source',Number(source.id.slice(1))||0)} as const);
const directory=(path:string)=>{const normalized=path.replace(/\\/g,'/');const index=normalized.lastIndexOf('/');return index<0?'':normalized.slice(0,index);};
const ordinaryAgents=(path:string)=>/(?:^|\/)AGENTS\.md$/.test(path)&&!/(?:^|\/)AGENTS\.override\.md$/.test(path);
const sourceWithKind=(source:SourceRecord,kind:AgentKind):SourceRecord=>({...source,kind});
function instructionAgents(source:SourceRecord):DetectedAgent[]{
 const path=source.relativePath.replace(/\\/g,'/');
 if(/(?:^|\/)\.codex\/AGENTS(?:\.override)?\.md$/.test(path))return[detectedAgent(sourceWithKind(source,'codex'),'possible')];
 if(/(?:^|\/)AGENTS(?:\.override)?\.md$/.test(path))return source.scope==='user'?[]:(['codex','cursor','kiro'] as const).map(kind=>detectedAgent(sourceWithKind(source,kind),'possible'));
 if(/(?:^|\/)(?:CLAUDE(?:\.local)?\.md|\.claude\/(?:CLAUDE\.md|rules\/.*\.md))$/.test(path))return[detectedAgent(sourceWithKind(source,'claude-code'))];
 if(/(?:^|\/)\.cursorrules$/.test(path))return[detectedAgent(sourceWithKind(source,'cursor'),'possible')];
 if(/(?:^|\/)\.cursor\/rules\/.*\.mdc$/.test(path))return[detectedAgent(sourceWithKind(source,'cursor'))];
 if(/(?:^|\/)\.kiro\/steering\/.*\.md$/.test(path))return[detectedAgent(sourceWithKind(source,'kiro'))];
 return[];
}

const scopeWorkspace=(source:SourceRecord)=>`${source.scope}:${workspaceKey(source.relativePath)}`;
const publicSourceLimit=1_000;
/**
 * Public callers bypass checked acquisition, so mirror its per-file byte
 * limit before a parser or detector receives content. The counter stops on
 * overflow rather than allocating/scanning an unbounded UTF-8 buffer.
 */
const boundedPublicSourceBytes=(text:string):number|undefined=>{
 // Every UTF-16 code unit occupies at least one UTF-8 byte, so this avoids
 // traversing an attacker-provided multi-gigabyte string merely to reject it.
 if(text.length>LIMITS.fileBytes)return undefined;
 const bytes=Buffer.byteLength(text,'utf8');
 return bytes>LIMITS.fileBytes?undefined:bytes;
};
const boundedOrdinal=(value:unknown,prefix:'S'|'P'):number|undefined=>{
 if(typeof value!=='string'||value.length>5||!new RegExp(`^${prefix}[1-9][0-9]*$`).test(value))return undefined;
 const ordinal=Number(value.slice(1));return Number.isSafeInteger(ordinal)&&ordinal<=publicSourceLimit?ordinal:undefined;
};
const uniquePublicId=(value:unknown,index:number,seen:Set<string>):string=>{
 const supplied=boundedOrdinal(value,'S');if(supplied!==undefined&&!seen.has(`S${supplied}`)){const id=`S${supplied}`;seen.add(id);return id;}
 // The public input is capped to `publicSourceLimit`, so this bounded circular
 // search always finds an opaque structural ID without trusting raw input.
 for(let offset=0;offset<publicSourceLimit;offset++){const ordinal=((index+offset)%publicSourceLimit)+1,id=`S${ordinal}`;if(!seen.has(id)){seen.add(id);return id;}}
 return 'S1'; // unreachable after the input cap; keeps the public type total.
};
const publicSource=(value:SourceRecord,index:number,seen:Set<string>):SourceRecord=>{
 const candidateId=uniquePublicId(value.id,index,seen),principal=value.principalId==='P-user'?'P-user':boundedOrdinal(value.principalId,'P')!==undefined?`P${boundedOrdinal(value.principalId,'P')}`:`P${index+1}`;
 const scope=value.scope==='user'?'user':'project',parseKind=['json','jsonc','toml','markdown'].includes(value.parseKind)?value.parseKind:'markdown';
 const relativePath=typeof value.relativePath==='string'&&value.relativePath.length<=65_536?value.relativePath:'';
 const content=typeof value.content==='string'?value.content:'';
 const kind=['codex','claude-code','cursor','kiro','vscode','generic-mcp'].includes(value.kind??'')?value.kind:undefined;
 // This trusted internal projection retains only known acquisition metadata
 // for parser-worker callers; arbitrary runtime object keys never cross it.
 return{id:candidateId,principalId:principal,scope,parseKind,relativePath,content,...(kind?{kind}:{}),...(value.claudeProjectRoot!==undefined?{claudeProjectRoot:value.claudeProjectRoot}:{}),...(value.workspaceOrdinal!==undefined?{workspaceOrdinal:value.workspaceOrdinal}:{}),...(value.parsed!==undefined?{parsed:value.parsed}:{})};
};
/** Assign only local structural ordinals; raw workspace keys never leave analysis. */
export function prepareSources(sources:readonly SourceRecord[]):SourceRecord[]{
 // Worker tasks arrive one source at a time with the parent's precomputed
 // ordinal. Recomputing from a singleton would collapse every workspace to S0.
 if(sources.every(source=>source.workspaceOrdinal!==undefined&&Number.isSafeInteger(source.workspaceOrdinal)&&source.workspaceOrdinal>=0))return [...sources];
 const workspaces=[...new Set(sources.map(scopeWorkspace))].sort(),ordinals=new Map(workspaces.map((key,index)=>[key,index]));
 return sources.map(source=>({...source,workspaceOrdinal:ordinals.get(scopeWorkspace(source))??0}));
}
function independentlyIdentifiesClaude(source:SourceRecord):boolean{
 if(source.kind!=='claude-code'||source.parseKind==='markdown')return false;
 try{const parsed=source.parsed??parseBounded(source.parseKind,source.content),facts=extractAdapterFacts(source,parsed);return facts.recognized&&(facts.envelopeValid||facts.hooks.length>0||facts.approvals.length>0);}catch{return false;}
}
/** Internal direct-core association. Node discovery uses `prepareSources` only. */
const associateClaude=(sources:readonly SourceRecord[])=>{const claudeWorkspaces=new Set(sources.filter(independentlyIdentifiesClaude).map(scopeWorkspace));return sources.map(source=>source.kind==='generic-mcp'&&/(?:^|\/)\.mcp\.json$/.test(source.relativePath.replace(/\\/g,'/'))&&claudeWorkspaces.has(scopeWorkspace(source))?{...source,kind:'claude-code' as const}:source);};

/** Package-facing core entrypoint; bounded and limited to supported fields. */
export function analyzePublicSources(sources:readonly SourceRecord[]):AnalyzeResult{
 // Keep one sentinel so the internal cap emits AF_REPORT_LIMIT, while never
 // preprocessing an unbounded caller array or copying unknown object keys.
 const bounded=sources.slice(0,publicSourceLimit+1);
 return analyzeSources(bounded.map(source=>{
  const {id,scope,kind,relativePath,content,parseKind,principalId}=source;
  return{id,scope,relativePath,content,parseKind,principalId,...(kind!==undefined?{kind}:{})};
 }));
}

/** Public pure analysis entrypoint. Structured formats use the fixed adapter pipeline. */
/** Internal callers may lower the finding allowance; package exports always use the fixed default. */
export function analyzeSources(sources:readonly SourceRecord[],internalFindingLimit:number=LIMITS.findings):AnalyzeResult {
 const findingLimit=Number.isSafeInteger(internalFindingLimit)?Math.max(0,Math.min(LIMITS.findings,internalFindingLimit)):LIMITS.findings;
 const seen=new Set<string>(),accepted:SourceRecord[]=[],results:AnalyzeResult[]=sources.length>publicSourceLimit?[{findings:[],agents:[],mcpServers:[],capabilities:[],errors:[scanError('AF_REPORT_LIMIT','analyze','partial')]}]:[];let acceptedBytes=0;
 for(const [index,input] of sources.slice(0,publicSourceLimit).entries()){
  const candidate=publicSource(input,index,seen);
  const sourceBytes=boundedPublicSourceBytes(candidate.content);
  if(sourceBytes===undefined){
   // No parser, detector, hash, or DTO retains hostile content after this gate.
   results.push({findings:[],agents:[],mcpServers:[],capabilities:[],errors:[scanError('AF_OVERSIZED_INPUT','analyze','partial',candidate.id)]});
   continue;
  }
  if(acceptedBytes+sourceBytes>LIMITS.bytes){
   // Public callers have no acquisition layer. Stop before parsing or
   // analyzing content beyond the same scan-wide byte allowance as Node.
   results.push({findings:[],agents:[],mcpServers:[],capabilities:[],errors:[scanError('AF_TOTAL_BYTES','analyze','partial',candidate.id)]});
   break;
  }
  acceptedBytes+=sourceBytes;
  accepted.push(candidate);
 }
 const prepared=associateClaude(prepareSources(accepted)),kiroCorrelationSecret=newKiroCorrelationSecret();
 const overriddenDirectories=new Set(prepared.filter(source=>/(?:^|\/)AGENTS\.override\.md$/.test(source.relativePath.replace(/\\/g,'/'))).map(source=>directory(source.relativePath)));
 const findingBudget:{remaining:number;truncated:boolean}={remaining:findingLimit,truncated:false};
 for(const source of prepared){
  if(findingBudget.remaining===0){results.push({findings:[],agents:[],mcpServers:[],capabilities:[],errors:[scanError('AF_REPORT_LIMIT','analyze','partial',source.id),scanError('AF_FINDINGS_LIMIT','analyze','partial',source.id)]});break;}
  const inactive=ordinaryAgents(source.relativePath.replace(/\\/g,'/'))&&overriddenDirectories.has(directory(source.relativePath));
  const unicodeResult=boundedUnicodeFindings(source.content,location(source),findingBudget.remaining),unicode=unicodeResult.findings.map(result=>inactive?{...result,applicability:'inactive' as const}:result);findingBudget.remaining-=unicode.length;if(unicodeResult.truncated)findingBudget.truncated=true;
  if(findingBudget.truncated||findingBudget.remaining===0){results.push({findings:unicode,agents:[],mcpServers:[],capabilities:[],errors:[scanError('AF_REPORT_LIMIT','analyze','partial',source.id),scanError('AF_FINDINGS_LIMIT','analyze','partial',source.id)]});break;}
  if(source.parseKind!=='markdown'){const structured=analyzeStructuredSource(source,findingBudget,kiroCorrelationSecret),correlations=kiroServerCorrelations(source,structured,kiroCorrelationSecret),errors=findingBudget.truncated?[...structured.errors,scanError('AF_FINDINGS_LIMIT','analyze','partial',source.id)]:structured.errors;results.push({...structured,findings:[...unicode,...structured.findings],errors,...(correlations.length?{kiroCorrelations:correlations}:{})} as KiroCorrelatedAnalyzeResult);if(findingBudget.truncated)break;continue;}
  const detected=instructionAgents(source),findings=[...unicode],parsed=analyzeInstructions(source.content),agents=detected.map(agent=>agent.id),applicability=inactive?'inactive' as const:'potential' as const;
  const addPrompt=(create:()=>Finding)=>{if(findingBudget.remaining===0){findingBudget.truncated=true;return false;}findings.push(create());findingBudget.remaining--;return true;};
  if(parsed.credential&&!addPrompt(()=>finding('AF-PROMPT-001','prompt-security','high','medium',location(source),'Instruction requests credential access or environment dumping','Remove secret-access instruction',applicability,agents))) {results.push({findings:normalizeFindings(findings),agents:detected,mcpServers:[],capabilities:[],errors:[scanError('AF_REPORT_LIMIT','analyze','partial',source.id),scanError('AF_FINDINGS_LIMIT','analyze','partial',source.id)]});break;}
  if(parsed.bypass&&!addPrompt(()=>finding('AF-PROMPT-002','prompt-security','high','medium',location(source),'Instruction requests a safeguard bypass','Keep safeguards and explicit approvals',applicability,agents))) {results.push({findings:normalizeFindings(findings),agents:detected,mcpServers:[],capabilities:[],errors:[scanError('AF_REPORT_LIMIT','analyze','partial',source.id),scanError('AF_FINDINGS_LIMIT','analyze','partial',source.id)]});break;}
  if(parsed.exfil&&!addPrompt(()=>finding('AF-PROMPT-003','prompt-security','critical','medium',location(source),'Instruction requests sensitive-data transmission','Remove secret-access instruction',applicability,agents))) {results.push({findings:normalizeFindings(findings),agents:detected,mcpServers:[],capabilities:[],errors:[scanError('AF_REPORT_LIMIT','analyze','partial',source.id),scanError('AF_FINDINGS_LIMIT','analyze','partial',source.id)]});break;}
  if(parsed.automation&&!addPrompt(()=>finding('AF-PROMPT-004','prompt-security',parsed.automation==='destructive'?'high':'medium','medium',location(source),'Instruction requests risky command automation','Make risky actions manual and scoped',applicability,agents))) {results.push({findings:normalizeFindings(findings),agents:detected,mcpServers:[],capabilities:[],errors:[scanError('AF_REPORT_LIMIT','analyze','partial',source.id),scanError('AF_FINDINGS_LIMIT','analyze','partial',source.id)]});break;}
  results.push({findings:normalizeFindings(findings),agents:detected,mcpServers:[],capabilities:[],errors:[]});
 }
 return mergeAnalysisResults(results,findingLimit);
}

type CompoundKind='shell'|'network'|'sensitive-env';
const compoundKinds:readonly CompoundKind[]=['shell','network','sensitive-env'];
const capabilityRules:Record<CompoundKind,readonly string[]>={shell:['AF-SHELL-001'],network:['AF-MCP-002','AF-SUPPLY-003'],'sensitive-env':['AF-SECRET-001','AF-SECRET-002']};
const confidenceOrder:Record<Confidence,number>={low:0,medium:1,high:2};
const reportAgentLimit=publicSourceLimit,reportServerLimit=1_000,reportCollectionLimit=10_000;
const minimumConfidence=(values:readonly Confidence[]):Confidence=>values.reduce((minimum,value)=>confidenceOrder[value]<confidenceOrder[minimum]?value:minimum,'high' as Confidence);
const conservativeApplicability=(values:readonly Applicability[]):Applicability=>values.includes('inactive')?'inactive':values.includes('unknown')?'unknown':'potential';
const compoundCapabilities=(capabilities:readonly Capability[],principal:string)=>capabilities.filter(capability=>capability.principalId===principal&&compoundKinds.includes(capability.kind as CompoundKind));

export function mergeAnalysisResults(results:readonly AnalyzeResult[],internalFindingLimit:number=reportCollectionLimit):AnalyzeResult {
 const findingLimit=Number.isSafeInteger(internalFindingLimit)?Math.max(0,Math.min(reportCollectionLimit,internalFindingLimit)):reportCollectionLimit;
 let truncated=false;
 const agentMap=new Map<string,DetectedAgent>(),mcpServers:MCPServer[]=[],capabilities:Capability[]=[],findingMap=new Map<string,Finding>();let errors:ScanError[]=[];
 const addError=(error:ScanError)=>{if(errors.length<reportCollectionLimit)errors.push(error);else truncated=true;};
 for(const result of results){
  for(let index=0;index<result.errors.length;index++){if(index>=reportCollectionLimit){truncated=true;break;}addError(result.errors[index]!);}
  for(let index=0;index<result.agents.length;index++){
   if(index>=reportAgentLimit){truncated=true;break;}const agent=result.agents[index]!,prior=agentMap.get(agent.id);
   if(!prior){if(agentMap.size>=reportAgentLimit){truncated=true;continue;}const sources=[...new Set(agent.sources.slice(0,reportAgentLimit))].sort();if(agent.sources.length>sources.length)truncated=true;agentMap.set(agent.id,{...agent,sources});continue;}
   const sourceIds=new Set(prior.sources);for(let sourceIndex=0;sourceIndex<agent.sources.length;sourceIndex++){if(sourceIndex>=reportAgentLimit||sourceIds.size>=reportAgentLimit){truncated=true;break;}sourceIds.add(agent.sources[sourceIndex]!);}agentMap.set(agent.id,{...prior,detection:prior.detection==='confirmed-config'||agent.detection==='confirmed-config'?'confirmed-config':'possible',sources:[...sourceIds].sort()});
  }
  for(let index=0;index<result.mcpServers.length;index++){if(mcpServers.length>=reportServerLimit){truncated=true;break;}mcpServers.push(result.mcpServers[index]!);}
  for(let index=0;index<result.capabilities.length;index++){if(capabilities.length>=reportCollectionLimit){truncated=true;break;}const capability=result.capabilities[index]!;if(capability.sourceIds.length>reportAgentLimit||capability.constraints.length>256)truncated=true;capabilities.push({...capability,sourceIds:capability.sourceIds.slice(0,reportAgentLimit),constraints:capability.constraints.slice(0,256)});}
  for(let index=0;index<result.findings.length;index++){const finding=result.findings[index]!;if(findingMap.has(finding.id))continue;if(findingMap.size>=findingLimit){truncated=true;break;}findingMap.set(finding.id,finding);}
 }
 const serverAgents=new Set(mcpServers.map(server=>server.agentId));
 const agents=[...agentMap.values()].sort((a,b)=>(Number(serverAgents.has(b.id))-Number(serverAgents.has(a.id)))||a.id.localeCompare(b.id)).slice(0,reportAgentLimit).map(agent=>{
  if(agent.sources.length<=reportAgentLimit)return agent;truncated=true;return{...agent,sources:agent.sources.slice(0,reportAgentLimit)};
 });
 if(agentMap.size>agents.length)truncated=true;
 const agentIds=new Set(agents.map(agent=>agent.id));
 let findings=normalizeFindings([...findingMap.values()]);
 const grouped=new Map<string,Set<CompoundKind>>(),compoundRoom=findingLimit-findings.length;let compounds=0;
 for(const capability of capabilities){
  if(capability.applicability==='inactive'||!compoundKinds.includes(capability.kind as CompoundKind))continue;
  const kinds=grouped.get(capability.principalId)??new Set<CompoundKind>();kinds.add(capability.kind as CompoundKind);grouped.set(capability.principalId,kinds);
 }
 for(const [principal,kinds] of grouped){
  if(compoundKinds.some(kind=>!kinds.has(kind)))continue;
  const relevantCapabilities=compoundCapabilities(capabilities,principal).filter(capability=>capability.applicability!=='inactive');
  if(compoundKinds.some(kind=>!relevantCapabilities.some(capability=>capability.kind===kind)))continue;
  // This is deliberately an exact, capability-level suppression: prose, a
  // missing network fact, unknown applicability, or another principal cannot
  // claim an egress denial. No adapter currently creates this plan token.
  if(relevantCapabilities.some(capability=>capability.kind==='network'&&capability.basis==='explicit-config'&&capability.applicability==='potential'&&capability.constraints.includes('network-deny' as import('./types.js').SafeText)))continue;
  const constituentIdsByKind=compoundKinds.map(kind=>[...new Set(findings.filter(finding=>finding.principalId===principal&&finding.applicability!=='inactive'&&capabilityRules[kind].includes(finding.ruleId)).map(finding=>finding.id))].sort());
  if(constituentIdsByKind.some(ids=>ids.length===0))continue;
  const relatedFindingIds=[...new Set(constituentIdsByKind.flat())].sort();
  const constituents=findings.filter(finding=>relatedFindingIds.includes(finding.id));
  const anchor=constituents[0];if(!anchor)continue;
  const applicability=conservativeApplicability([...relevantCapabilities.map(capability=>capability.applicability),...constituents.map(finding=>finding.applicability)]);
  if(applicability==='inactive')continue;
  const confidence=minimumConfidence([...relevantCapabilities.map(capability=>capability.confidence),...constituents.map(finding=>finding.confidence)]);
  const factIds=[...new Set(relevantCapabilities.map(capability=>`F-${stableId('compound-capability',principal,capability.id)}`))].sort();
  const server=mcpServers.find(item=>item.principalId===principal);
  if(compounds>=compoundRoom){truncated=true;continue;}
  findings.push(finding('AF-COMBO-001','agent-config','high',confidence,anchor.location,'Same-principal shell, network, and sensitive environment capabilities are declared','Separate capabilities and constrain egress',applicability,server?[server.agentId]:[...new Set(anchor.agentIds)].sort(),{principalId:principal,semanticFactKey:'shell-network-sensitive-env',evidenceKind:'combination',factIds,relatedFindingIds}));compounds++;
 }
 const correlations=new Map<string,string>();
 for(const result of results){const entries=(result as KiroCorrelatedAnalyzeResult).kiroCorrelations??[];for(const entry of entries.slice(0,reportServerLimit)){if(/^[a-f0-9]{16}$/.test(entry.serverId)&&/^[a-f0-9]{64}$/.test(entry.key)&&!correlations.has(entry.serverId))correlations.set(entry.serverId,entry.key);}}
 const capabilityIds=new Set(capabilities.map(capability=>capability.id));
 const boundedServers=mcpServers.filter(server=>agentIds.has(server.agentId)).map(server=>({...server,capabilityIds:[...new Set(server.capabilityIds)].filter(id=>capabilityIds.has(id)).slice(0,reportAgentLimit)}));
 if(boundedServers.length!==mcpServers.length)truncated=true;
 const projectKiroKeys=new Set(boundedServers.filter(server=>/^A-kiro-S\d+$/.test(server.agentId)&&server.location.scope==='project').flatMap(server=>{const key=correlations.get(server.id);return key?[key]:[];}));
 const shadowedKiroServerIds=new Set(boundedServers.filter(server=>/^A-kiro-S\d+$/.test(server.agentId)&&server.location.scope==='user'&&projectKiroKeys.has(correlations.get(server.id)??'')).map(server=>server.id));
 const shadowedKiroPrincipals=new Set(boundedServers.filter(server=>shadowedKiroServerIds.has(server.id)).map(server=>server.principalId));
 const outputServers=boundedServers.map(server=>shadowedKiroServerIds.has(server.id)?{...server,enabled:'no' as const}:server);
 const outputCapabilities=capabilities.map(capability=>shadowedKiroPrincipals.has(capability.principalId)&&capability.applicability!=='inactive'?{...capability,applicability:'inactive' as const}:capability);
 const outputFindings=findings.map(finding=>finding.principalId!==undefined&&shadowedKiroPrincipals.has(finding.principalId)&&finding.applicability!=='inactive'?{...finding,applicability:'inactive' as const}:finding);
 const retainedFindingIds=new Set(outputFindings.map(finding=>finding.id));
 const referenceSafeFindings=normalizeFindings(outputFindings).map(finding=>({...finding,agentIds:[...new Set(finding.agentIds)].filter(id=>agentIds.has(id)).slice(0,256),relatedFindingIds:[...new Set(finding.relatedFindingIds)].filter(id=>retainedFindingIds.has(id)).sort()}));
 if(errors.length>reportCollectionLimit){truncated=true;errors=errors.slice(0,reportCollectionLimit-1);}
 if(truncated){if(errors.length>=reportCollectionLimit)errors=errors.slice(0,reportCollectionLimit-1);errors.push(scanError('AF_REPORT_LIMIT','analyze','partial'));}
 return{findings:referenceSafeFindings,agents,mcpServers:outputServers,capabilities:outputCapabilities,errors};
}
