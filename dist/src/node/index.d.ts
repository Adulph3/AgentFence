import { lstat } from 'node:fs/promises';
import { LIMITS } from '../application/budget.js';
import type { ScanError, ScanReport, Severity } from '../core/types.js';
type LimitOverrides = Partial<Record<keyof typeof LIMITS, number>>;
export interface ScanRequest {
    readonly path?: string;
    readonly userConfigs?: boolean;
    readonly minimumSeverity?: Severity;
    readonly failOn?: Severity | 'none';
}
export interface AcquisitionServices {
    readonly home?: () => string;
    readonly now?: () => number;
    readonly limits?: LimitOverrides; /** Internal test seam for user-scope metadata; production uses node lstat. */
    readonly userLstat?: typeof lstat; /** Presence only: relocated config paths are deliberately never followed. */
    readonly configOverrides?: {
        readonly codexHome?: boolean;
        readonly claudeConfigDir?: boolean;
    };
}
export declare const finalErrors: (errors: readonly ScanError[]) => ScanError[];
export declare function scanProject(request?: ScanRequest, services?: AcquisitionServices, signal?: AbortSignal): Promise<ScanReport>;
export {};
