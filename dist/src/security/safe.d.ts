import type { SafeText } from '../core/types.js';
/** Creates bounded ASCII-safe report text from scanner-authored templates only. */
export declare function safe(value: string): SafeText;
export declare function opaque(kind: string, ordinal: number): SafeText;
export declare function escapeTerminal(value: string): string;
export declare function safeJson(value: unknown): string;
