import type { ScanError } from '../core/types.js';
export declare function scanError(code: string, stage: ScanError['stage'], effect: ScanError['effect'], sourceId?: string): ScanError;
