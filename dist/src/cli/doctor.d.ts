import type { DoctorReport } from '../core/types.js';
export interface DoctorServices {
    readonly runtimeVersion?: string;
    readonly platform?: string;
    readonly architecture?: string;
    readonly overrides?: {
        readonly codexHome: boolean;
        readonly claudeConfigDir: boolean;
    };
    readonly escapeSelfTest?: () => boolean;
    readonly scoreSelfTest?: () => boolean;
}
export interface DoctorRunResult {
    readonly output: string;
    readonly exitCode: 0 | 2;
}
/** Pure, fixed-surface health report: it deliberately performs no discovery or probes. */
export declare function doctorReport(services?: DoctorServices): DoctorReport;
export declare function runDoctor(json: boolean, services?: DoctorServices): DoctorRunResult;
/** Legacy rendering interface retained for existing consumers. */
export declare function doctor(json: boolean): string;
