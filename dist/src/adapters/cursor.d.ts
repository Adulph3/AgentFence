import type { Adapter } from './types.js';
import { type McpFactsResult } from './normalize.js';
import type { SourceRecord } from '../core/types.js';
export declare const cursorAdapter: Adapter;
/** Cursor MCP fields use disabled/autoApprove, not the generic enabled shape. */
export declare function adaptCursor(source: SourceRecord, parsed: unknown): McpFactsResult;
