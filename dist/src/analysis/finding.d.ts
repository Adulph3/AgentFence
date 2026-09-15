import type { Applicability, Category, Confidence, Evidence, Finding, Location, Severity } from '../core/types.js';
export interface FindingContext {
    readonly principalId?: string;
    /** A fixed rule-owned key, never a value copied from scanned input. */
    readonly semanticFactKey?: string;
    readonly evidenceKind?: Evidence['kind'];
    readonly factIds?: readonly string[];
    readonly codePoints?: readonly string[];
    readonly relatedFindingIds?: readonly string[];
}
export declare function finding(ruleId: string, category: Category, severity: Severity, confidence: Confidence, location: Location, summary: string, recommendation: string, applicability?: Applicability, agentIds?: readonly string[], context?: FindingContext): Finding;
