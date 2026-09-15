import type { ScanReport } from '../core/types.js';
/** Terminal output consumes only already-safe DTO fields and escapes every display field again. */
export declare function terminalReport(report: ScanReport, color?: boolean): string;
