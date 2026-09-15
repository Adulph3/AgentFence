import type { Adapter } from './types.js';
import type { SourceRecord } from '../core/types.js';
export declare const genericMcpAdapter: Adapter;
/** Generic MCP has no vendor enablement, approval, or hook semantics. */
export declare const adaptGenericMcp: (source: SourceRecord, parsed: unknown) => import("./normalize.js").McpFactsResult;
