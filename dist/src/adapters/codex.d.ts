import type { Adapter } from './types.js';
import { type McpFactsResult } from './normalize.js';
import type { SourceRecord } from '../core/types.js';
export declare const codexAdapter: Adapter;
/** Codex config-reference snapshot 2026-09-10: mcp_servers.enabled and top-level approval_policy. */
export declare function adaptCodex(source: SourceRecord, parsed: unknown): McpFactsResult;
