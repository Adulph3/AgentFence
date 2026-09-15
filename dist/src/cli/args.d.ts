import type { ScanRequest } from '../node/index.js';
export type Parsed = {
    readonly command: 'scan' | 'doctor' | 'help' | 'version';
    readonly request?: ScanRequest;
    readonly json: boolean;
    readonly output?: string | undefined;
    readonly noColor: boolean;
};
export declare function parseArgs(argv: string[]): Parsed;
