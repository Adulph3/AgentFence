import type { Adapter } from './types.js';
import { mcpFacts } from './normalize.js';
import type { SourceRecord } from '../core/types.js';
export const genericMcpAdapter:Adapter={kind:'generic-mcp',version:'1.0.0',supports:s=>s.kind==='generic-mcp'};
/** Generic MCP has no vendor enablement, approval, or hook semantics. */
export const adaptGenericMcp=(source:SourceRecord,parsed:unknown)=>mcpFacts(source,parsed,{key:'mcpServers'});
