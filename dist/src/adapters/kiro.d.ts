import type { Adapter } from './types.js';
import { type McpFactsResult } from './normalize.js';
import type { SourceRecord } from '../core/types.js';
export declare const kiroAdapter: Adapter;
/** Kiro's dated MCP map is limited to disabled and autoApprove. */
export declare function adaptKiro(source: SourceRecord, parsed: unknown, kiroCorrelationSecret?: string): McpFactsResult;
