import type { Adapter } from './types.js';
import { mcpFacts, type McpFactsResult } from './normalize.js';
import type { SourceRecord } from '../core/types.js';
export const codexAdapter:Adapter={kind:'codex',version:'1.0.0',supports:s=>s.kind==='codex'};
const object=(value:unknown):Record<string,unknown>|undefined=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:undefined;
/** Codex config-reference snapshot 2026-09-10: mcp_servers.enabled and top-level approval_policy. */
export function adaptCodex(source:SourceRecord,parsed:unknown):McpFactsResult {
 const base=mcpFacts(source,parsed,{key:'mcp_servers',codexExtras:true,enabled:server=>server.enabled===undefined?'unknown':typeof server.enabled==='boolean'?(server.enabled?'potential':'inactive'):'invalid',validServer:server=>server.cwd===undefined||(typeof server.cwd==='string'&&server.cwd!=='' )}),root=object(parsed),policy=root?.approval_policy;
 if(policy===undefined)return base;
 if(typeof policy!=='string')return {...base,recognized:true,diagnostics:[...base.diagnostics,'AF_CODEX_APPROVAL']};
 if(policy==='never')return {...base,recognized:true,envelopeValid:true,approvals:[...base.approvals,{principal:`${source.principalId}:${source.id}:V1`,applicability:'potential'}]};
 // These documented non-bypass values are themselves valid Codex evidence.
 // They identify configuration but must never manufacture an approval finding.
 if(policy==='on-request'||policy==='untrusted')return {...base,recognized:true,envelopeValid:true};
 return {...base,recognized:true,diagnostics:[...base.diagnostics,'AF_CODEX_APPROVAL']};
}
