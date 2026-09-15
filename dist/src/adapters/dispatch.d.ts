import type { SourceRecord } from '../core/types.js';
import type { ApprovalFact, HookFact, McpFact } from './normalize.js';
export interface AdapterFacts {
    readonly recognized: boolean;
    readonly envelopeValid: boolean;
    readonly facts: readonly McpFact[];
    readonly diagnostics: readonly string[];
    readonly hooks: readonly HookFact[];
    readonly approvals: readonly ApprovalFact[];
}
export declare function extractAdapterFacts(source: SourceRecord, parsed: unknown, kiroCorrelationSecret?: string): AdapterFacts;
