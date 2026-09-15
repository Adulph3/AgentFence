import type { Adapter } from './types.js';
import type { SourceRecord } from '../core/types.js';
export const vscodeAdapter:Adapter={kind:'vscode',version:'1.0.0',supports:s=>s.kind==='vscode'};
import { emptyFacts, mcpFacts, type McpFactsResult } from './normalize.js';
const object=(value:unknown):Record<string,unknown>|undefined=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:undefined;
/** Only the documented MCP envelope and exact MCP setting namespace identify VS Code. */
export function adaptVscode(source:SourceRecord,parsed:unknown):McpFactsResult {
 const base=mcpFacts(source,parsed,{key:'servers'}); if(base.recognized)return base;
 const root=object(parsed); if(!root)return emptyFacts();
 const setting=root['chat.mcp.enabled'];
 if(setting===undefined)return base;
 return typeof setting==='boolean'?{...base,recognized:true,envelopeValid:true}:{...base,recognized:true,diagnostics:['AF_VSCODE_SETTING']};
}
