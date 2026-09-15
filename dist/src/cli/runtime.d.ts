import type { ScanReport } from '../core/types.js';
import type { ScanRequest } from '../node/index.js';
/** Internal runtime/exit helpers: no CLI or environment bypass is exposed. */
export declare const runtimeSupported: (version: string) => boolean;
export declare const reportExit: (report: ScanReport, interrupted?: boolean) => number;
export interface ScanRunnerServices {
    readonly runtimeVersion: string;
    scan(request: ScanRequest, signal?: AbortSignal): Promise<ScanReport>;
    writeReport(text: string): Promise<void>;
    writeDiagnostic(text: string): Promise<void>;
    writeOutput?(text: string, signal?: AbortSignal): Promise<void>; /** Identity-bound destination rollback after a post-write observed interrupt. */
    cleanupOutput?(): Promise<void>;
    render?(report: ScanReport): string;
}
/** Internal production destination service; it is not part of the package API. */
export declare const destinationWriter: (path: string, writeDiagnostic: (text: string, signal?: AbortSignal) => Promise<void>) => Pick<ScanRunnerServices, "writeOutput" | "cleanupOutput">;
/** Non-public orchestration seam for CLI tests; real main supplies process/runtime services. */
export declare function runScan(request: ScanRequest, json: boolean, interrupted: boolean, services: ScanRunnerServices, signal?: AbortSignal): Promise<number>;
