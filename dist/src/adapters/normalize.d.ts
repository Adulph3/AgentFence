import { applicability, type CapabilityFact } from '../analysis/capabilities.js';
import { type EnvFact } from '../analysis/env.js';
import type { SourceRecord } from '../core/types.js';
export interface McpFact {
    readonly sourceId: string;
    readonly principal: string;
    readonly enabled: ReturnType<typeof applicability>;
    readonly transport: 'stdio' | 'http' | 'sse' | 'unknown';
    readonly command?: string;
    readonly args: readonly string[];
    readonly url?: string;
    readonly envFacts: readonly EnvFact[];
    readonly capabilities: readonly CapabilityFact[];
    readonly dynamic: boolean;
    readonly roots: readonly string[];
    readonly approvalBypass: boolean; /** Private Kiro-only correlation; never part of a report DTO. */
    readonly correlationKey?: string;
}
export interface HookFact {
    readonly principal: string;
    readonly command: string;
    readonly applicability: ReturnType<typeof applicability>;
    readonly eventOrdinal: number;
}
export interface ApprovalFact {
    readonly principal: string;
    readonly applicability: ReturnType<typeof applicability>;
}
export interface McpFactsResult {
    readonly recognized: boolean;
    readonly envelopeValid: boolean;
    readonly facts: readonly McpFact[];
    readonly diagnostics: readonly string[];
    readonly hooks: readonly HookFact[];
    readonly approvals: readonly ApprovalFact[];
}
export interface McpOptions {
    readonly key: string;
    readonly codexExtras?: boolean;
    readonly enabled?: (server: Record<string, unknown>, name: string, root: Record<string, unknown>) => ReturnType<typeof applicability> | 'invalid';
    readonly approvalBypass?: (server: Record<string, unknown>) => boolean | 'invalid';
    /** Vendor fields that are valid but intentionally never become report facts. */
    readonly validServer?: (server: Record<string, unknown>) => boolean;
    /** Per-scan secret used only to correlate exact Kiro map keys across scopes. */
    readonly kiroCorrelationSecret?: string;
}
/** Independently validate documented fields. Untrusted map keys never leave this module. */
export declare const emptyFacts: () => McpFactsResult;
/**
 * The common parser deliberately handles only transport and credential fields.
 * Vendor enablement and approval semantics are injected by fixed adapter maps.
 */
export declare function mcpFacts(source: SourceRecord, parsed: unknown, options: McpOptions): McpFactsResult;
