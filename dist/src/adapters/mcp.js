import { mcpFacts } from './normalize.js';
export const genericMcpAdapter = { kind: 'generic-mcp', version: '1.0.0', supports: s => s.kind === 'generic-mcp' };
/** Generic MCP has no vendor enablement, approval, or hook semantics. */
export const adaptGenericMcp = (source, parsed) => mcpFacts(source, parsed, { key: 'mcpServers' });
//# sourceMappingURL=mcp.js.map