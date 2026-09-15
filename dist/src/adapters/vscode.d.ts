import type { Adapter } from './types.js';
import type { SourceRecord } from '../core/types.js';
export declare const vscodeAdapter: Adapter;
import { type McpFactsResult } from './normalize.js';
/** Only the documented MCP envelope and exact MCP setting namespace identify VS Code. */
export declare function adaptVscode(source: SourceRecord, parsed: unknown): McpFactsResult;
