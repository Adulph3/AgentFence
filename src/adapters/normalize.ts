import { createHmac } from 'node:crypto';
import { applicability,type CapabilityFact } from '../analysis/capabilities.js';
import { classifyCredentialHeader,classifyEnvBinding,classifyEnvNameReference,type EnvFact } from '../analysis/env.js';
import type { SourceRecord } from '../core/types.js';

export interface McpFact { readonly sourceId:string; readonly principal:string; readonly enabled:ReturnType<typeof applicability>; readonly transport:'stdio'|'http'|'sse'|'unknown'; readonly command?:string; readonly args:readonly string[]; readonly url?:string; readonly envFacts:readonly EnvFact[]; readonly capabilities:readonly CapabilityFact[]; readonly dynamic:boolean; readonly roots:readonly string[]; readonly approvalBypass:boolean; /** Private Kiro-only correlation; never part of a report DTO. */ readonly correlationKey?:string; }
export interface HookFact { readonly principal:string; readonly command:string; readonly applicability:ReturnType<typeof applicability>; readonly eventOrdinal:number; }
export interface ApprovalFact { readonly principal:string; readonly applicability:ReturnType<typeof applicability>; }
export interface McpFactsResult { readonly recognized:boolean; readonly envelopeValid:boolean; readonly facts:readonly McpFact[]; readonly diagnostics:readonly string[]; readonly hooks:readonly HookFact[]; readonly approvals:readonly ApprovalFact[]; }
export interface McpOptions {
 readonly key:string;
 readonly codexExtras?:boolean;
 readonly enabled?: (server:Record<string,unknown>, name:string, root:Record<string,unknown>)=>ReturnType<typeof applicability>|'invalid';
 readonly approvalBypass?: (server:Record<string,unknown>)=>boolean|'invalid';
 /** Vendor fields that are valid but intentionally never become report facts. */
 readonly validServer?: (server:Record<string,unknown>)=>boolean;
 /** Per-scan secret used only to correlate exact Kiro map keys across scopes. */
 readonly kiroCorrelationSecret?:string;
}
const obj=(value:unknown):Record<string,unknown>|undefined=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:undefined;
const strings=(value:unknown):string[]|undefined=>Array.isArray(value)&&value.every(item=>typeof item==='string')?value as string[]:undefined;
const dynamic=(value:string)=>/\$\{(?:env:|input:|command:)|\$\(|`/.test(value);
const unresolvedUrl=(value:string)=>/\$\{(?:env:|input:)[^}]+\}/.test(value);
const validLiteralUrl=(value:string)=>{try{const url=new URL(value);return url.protocol==='http:'||url.protocol==='https:';}catch{return false;}};
const credentialHeader=(name:string)=>/^(?:authorization|x-api-key|api-key)$/i.test(name);
const appendHeaderFacts=(value:unknown,envFacts:EnvFact[],codexEnvReferences:boolean):boolean=>{const headers=obj(value);if(!headers)return false;let valid=true;for(const [name,headerValue] of Object.entries(headers)){if(typeof headerValue!=='string'){valid=false;continue;}if(!credentialHeader(name))continue;envFacts.push(codexEnvReferences?classifyEnvNameReference(headerValue,envFacts.length+1):classifyCredentialHeader(headerValue,envFacts.length+1));}return valid;};

/** Independently validate documented fields. Untrusted map keys never leave this module. */
export const emptyFacts=():McpFactsResult=>({recognized:false,envelopeValid:false,facts:[],diagnostics:[],hooks:[],approvals:[]});
/**
 * The common parser deliberately handles only transport and credential fields.
 * Vendor enablement and approval semantics are injected by fixed adapter maps.
 */
export function mcpFacts(source:SourceRecord,parsed:unknown,options:McpOptions):McpFactsResult {
 const root=obj(parsed);if(!root||!Object.hasOwn(root,options.key))return emptyFacts();
 const servers=obj(root[options.key]);if(!servers)return{...emptyFacts(),recognized:true,diagnostics:['AF_MCP_ENVELOPE']};
 const facts:McpFact[]=[];let ordinal=0,malformed=false;
 for(const [name,value] of Object.entries(servers)){
  ordinal++;const server=obj(value);if(!server){malformed=true;continue;}let bad=false;
  const command=typeof server.command==='string'&&server.command!==''?server.command:undefined;
  const url=typeof server.url==='string'&&server.url!==''?server.url:undefined;
  if((server.command!==undefined&&!command)||(server.url!==undefined&&!url))bad=true;
  const args=strings(server.args);if(server.args!==undefined&&!args)bad=true;
  const type=typeof server.type==='string'?server.type:undefined;if(server.type!==undefined&&!type)bad=true;
  if(command&&url)bad=true;if(url&&!unresolvedUrl(url)&&!validLiteralUrl(url))bad=true;
  const transport:'stdio'|'http'|'sse'|'unknown'=command?'stdio':type==='sse'&&url?'sse':url?'http':'unknown';if(transport==='unknown'||(type!==undefined&&type!==transport))bad=true;
  const env=obj(server.env);if(server.env!==undefined&&!env)bad=true;
  const envFacts:EnvFact[]=[];
  if(env)for(const [name,binding] of Object.entries(env)){if(typeof binding!=='string'){bad=true;continue;}envFacts.push(classifyEnvBinding(name,binding,envFacts.length+1));}
  if(options.codexExtras&&server.env_vars!==undefined){const names=strings(server.env_vars);if(names){const seenNames=new Set<string>();for(const name of names){if(seenNames.has(name))continue;seenNames.add(name);envFacts.push(classifyEnvNameReference(name,envFacts.length+1));}}else{const map=obj(server.env_vars);if(!map)bad=true;else for(const [name,binding] of Object.entries(map)){if(typeof binding==='string')envFacts.push(classifyEnvBinding(name,binding,envFacts.length+1));else bad=true;}}}
  if(options.codexExtras&&server.bearer_token_env_var!==undefined){if(typeof server.bearer_token_env_var==='string')envFacts.push(classifyEnvNameReference(server.bearer_token_env_var,envFacts.length+1));else bad=true;}
  if(options.codexExtras)for(const [headerField,envReferences] of [['headers',false],['http_headers',false],['env_http_headers',true]] as const)if(server[headerField]!==undefined&&!appendHeaderFacts(server[headerField],envFacts,envReferences))bad=true;
  const seenEnvFacts=new Set<string>();const deduplicatedEnvFacts=envFacts.filter(env=>{
   // Only a documented safe name can establish equivalence. Header fields have
   // no exportable name, so collapsing them could hide distinct credentials.
   if(!env.safeName)return true;const key=`${env.safeName}:${env.mode}:${env.credentialField}`;if(seenEnvFacts.has(key))return false;seenEnvFacts.add(key);return true;
  }).map((env,index)=>({...env,ordinal:index+1}));
  const enabledResult=options.enabled?.(server,name,root)??applicability(undefined);
  const enabled=enabledResult==='invalid'?(bad=true,applicability(undefined)):enabledResult;
  const approval=options.approvalBypass?.(server)??false;
  if(approval==='invalid')bad=true;
  if(options.validServer&&!options.validServer(server))bad=true;
  if(bad){malformed=true;continue;}
  // Source IDs and ordinals are structural acquisition identifiers, never server names or values.
  const principal=`${source.principalId}:${source.id}:M${ordinal}`,capabilities:CapabilityFact[]=[];
  if(command)capabilities.push({principal,sourceId:source.id,kind:'process-launch',basis:'explicit-config',confidence:'high',applicability:enabled});
  if(url)capabilities.push({principal,sourceId:source.id,kind:'network',basis:'explicit-config',confidence:'high',applicability:enabled});
  const argv=command?[command,...(args??[])]:[];
  // Only documented filesystem-server positional arguments are roots.  A
  // launcher path (for example /usr/bin/npx) is never a declared root.
  const filesystemServer=/filesystem(?:-server)?(?:$|[\\/])/i.test(command??'')||args?.some(argument=>/@modelcontextprotocol\/server-filesystem/i.test(argument))===true;
  const roots=filesystemServer?(args??[]).filter(argument=>/^(?:\/|~|[A-Za-z]:[\\/]|\.\.?[\\/])/.test(argument)):[];
  const all=[command??'',...(args??[]),url??''];
  const correlationKey=options.kiroCorrelationSecret&&/^[a-f0-9]{64}$/.test(options.kiroCorrelationSecret)?createHmac('sha256',options.kiroCorrelationSecret).update(name,'utf8').digest('hex'):undefined;
  facts.push({sourceId:source.id,principal,enabled,transport,...(command?{command}:{}),args:args??[],...(url?{url}:{}),envFacts:deduplicatedEnvFacts,capabilities,dynamic:all.some(dynamic),roots,approvalBypass:approval===true,...(correlationKey?{correlationKey}:{})});
 }
 return{recognized:true,envelopeValid:true,facts,diagnostics:malformed?['AF_MCP_ENTITY']:[],hooks:[],approvals:[]};
}
