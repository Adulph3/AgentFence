import type { AgentKind, SourceRecord } from '../core/types.js';
import type { ApprovalFact, HookFact, McpFact } from './normalize.js';
import { adaptCodex } from './codex.js';
import { adaptClaude } from './claude.js';
import { adaptCursor } from './cursor.js';
import { adaptKiro } from './kiro.js';
import { adaptVscode } from './vscode.js';
import { adaptGenericMcp } from './mcp.js';
export interface AdapterFacts { readonly recognized:boolean; readonly envelopeValid:boolean; readonly facts:readonly McpFact[]; readonly diagnostics:readonly string[]; readonly hooks:readonly HookFact[]; readonly approvals:readonly ApprovalFact[]; }
const result=(r:AdapterFacts):AdapterFacts=>r;
export function extractAdapterFacts(source:SourceRecord,parsed:unknown,kiroCorrelationSecret?:string):AdapterFacts{switch(source.kind as AgentKind|undefined){case'codex':return result(adaptCodex(source,parsed));case'claude-code':return result(adaptClaude(source,parsed));case'cursor':return result(adaptCursor(source,parsed));case'kiro':return result(adaptKiro(source,parsed,kiroCorrelationSecret));case'vscode':return result(adaptVscode(source,parsed));case'generic-mcp':return result(adaptGenericMcp(source,parsed));default:return{recognized:false,envelopeValid:false,facts:[],diagnostics:[],hooks:[],approvals:[]};}}
