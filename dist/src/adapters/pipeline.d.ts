import type { AnalyzeResult, DetectedAgent, SourceRecord } from '../core/types.js';
/** Internal HMAC-derived association, bounded and absent from public report types. */
export interface KiroServerCorrelation {
    readonly serverId: string;
    readonly key: string;
}
export type KiroCorrelatedAnalyzeResult = AnalyzeResult & {
    readonly kiroCorrelations?: readonly KiroServerCorrelation[];
};
export declare const newKiroCorrelationSecret: () => string;
/**
 * Map a Kiro declaration's already-safe structural server ID to an HMAC of its
 * exact map key. The HMAC secret is per scan and the result is consumed only
 * by mergeAnalysisResults; neither map keys nor correlation keys reach reports.
 */
export declare function kiroServerCorrelations(source: SourceRecord, result: AnalyzeResult, kiroCorrelationSecret: string): readonly KiroServerCorrelation[];
/** A local structural workspace ordinal permits deterministic opaque merging. */
export declare const detectedAgentId: (kind: NonNullable<SourceRecord["kind"]>, workspaceOrdinal?: number) => string;
export declare const detectedAgent: (source: SourceRecord, detection?: "confirmed-config" | "possible") => DetectedAgent;
export interface FindingBudget {
    remaining: number;
    truncated: boolean;
}
/** Fixed structured-source pipeline. Adapter facts, never arbitrary JSON traversal, drive findings. */
export declare function analyzeStructuredSource(source: SourceRecord, budget?: FindingBudget, kiroCorrelationSecret?: string): AnalyzeResult;
