/** Bounded shell grammar used only for actual shell `-c` payloads. */
export interface ShellFact {
    readonly shell: boolean;
    readonly sudo: boolean;
    readonly rmrf: 'root' | 'project' | 'other' | false;
    readonly chain: boolean;
    readonly push: 'force' | 'lease' | 'normal' | false;
    readonly supply: 'mutable' | 'exact' | 'runner' | false;
    readonly remotePipe: boolean;
    readonly unsupported: boolean;
}
export interface Tokenized {
    readonly tokens: readonly string[];
    readonly separators: readonly string[];
    readonly segments: readonly (readonly string[])[];
    readonly unsupported: boolean;
}
export declare function tokenizeCommand(input: string): Tokenized;
export declare function analyzeArgv(argv: readonly string[]): ShellFact;
export declare function analyzeCommand(input: string): ShellFact;
