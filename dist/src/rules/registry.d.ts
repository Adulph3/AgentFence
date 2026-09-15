import type { Category, Severity } from '../core/types.js';
export declare const RULESET_VERSION: "1.0.0";
export interface RuleDefinition {
    readonly id: string;
    readonly version: '1.0.0';
    readonly title: string;
    readonly category: Category;
    readonly defaultSeverity: Severity;
    readonly acceptedFactKinds: readonly string[];
    readonly confidenceAndExclusions: string;
    readonly recommendation: string;
    readonly references: readonly string[];
    readonly milestone: 'M4' | 'M5' | 'M6' | 'M7' | 'M8';
    readonly testIds: Readonly<{
        positive: string;
        negative: string;
        adversarial: string;
        redaction: string;
    }>;
}
export declare const RULE_DEFINITIONS: readonly RuleDefinition[];
export declare const RULES: string[];
export declare function validateRuleRegistry(definitions?: readonly RuleDefinition[]): void;
export declare function ruleDefinition(id: string): RuleDefinition;
