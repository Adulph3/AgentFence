import type { AgentKind, Scope } from '../core/types.js';
export interface Pattern {
    readonly path: RegExp;
    readonly kind?: AgentKind;
    readonly parseKind: 'json' | 'jsonc' | 'toml' | 'markdown';
}
export declare const registry: readonly Pattern[];
/** `.claude.json` is an opt-in home allowlist entry, never a project candidate. */
export declare function matchCandidate(relative: string, scope?: Scope): Pattern | undefined;
