import type { Adapter } from './types.js';
import { type McpFactsResult } from './normalize.js';
import type { SourceRecord } from '../core/types.js';
export declare const claudeAdapter: Adapter;
/**
 * `.claude.json` is a user-global file.  Its project map is deliberately not a
 * discovery surface: only the entry keyed by the already-canonical scan root is
 * selected, and that key remains acquisition-only data.
 */
export declare function adaptClaude(source: SourceRecord, parsed: unknown): McpFactsResult;
