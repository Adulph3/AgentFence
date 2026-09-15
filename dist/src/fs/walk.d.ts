import { lstat } from 'node:fs/promises';
import { LIMITS } from '../application/budget.js';
export interface WalkResult {
    readonly files: readonly string[];
    readonly visited: number;
    readonly limited: boolean;
    readonly skipped: Readonly<Record<string, number>>;
}
export interface WalkOptions {
    readonly signal?: AbortSignal;
    readonly deadline?: number;
    readonly now?: () => number;
    readonly limits?: Pick<typeof LIMITS, 'entries' | 'directoryEntries' | 'depth'>; /** Test-only metadata seam; production always uses node lstat. */
    readonly lstat?: typeof lstat;
}
export declare const sameDevice: (rootDevice: number, entryDevice: number) => boolean;
/** Registry paths are portable `/`-separated identifiers, not host paths. */
export declare const portableRelativePath: (path: string, separator?: string) => string;
/** Bounded, sequential traversal. Once halted, every ancestor returns without more I/O. */
export declare function walk(root: string, options?: WalkOptions): Promise<WalkResult>;
