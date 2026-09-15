export interface PromptFact {
    readonly credential: boolean;
    readonly bypass: boolean;
    readonly exfil: boolean;
    readonly automation: 'destructive' | 'risky' | false;
}
/**
 * Instruction prose is deliberately line-local: a negation is never allowed to
 * suppress a later line. Fenced and quoted educational examples are excluded.
 */
export declare function analyzeInstructions(text: string): PromptFact;
