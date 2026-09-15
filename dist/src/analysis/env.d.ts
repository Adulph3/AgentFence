export declare const sensitiveNames: Set<string>;
export interface EnvFact {
    readonly ordinal: number;
    readonly safeName?: string;
    readonly nameClass: 'known' | 'sensitive-suffix' | 'other';
    readonly mode: 'literal' | 'reference' | 'unknown';
    readonly credentialField: boolean;
}
export declare function classifyEnvBinding(name: string, value: unknown, ordinal: number): EnvFact;
export declare function classifyEnvNameReference(name: string, ordinal: number): EnvFact;
/** A credential-bearing header has no exportable input name, but its value is still classified safely. */
export declare function classifyCredentialHeader(value: string, ordinal: number): EnvFact;
export declare function envRisk(name: string, value: unknown): 'recognized' | 'suffix' | 'literal' | 'none';
