/** Scanner-owned hard limits. These are never configurable by scanned content. */
export declare const LIMITS: {
    readonly entries: 50000;
    readonly directoryEntries: 5000;
    readonly depth: 24;
    readonly files: 1000;
    readonly bytes: number;
    readonly fileBytes: number;
    readonly outputBytes: number;
    readonly parsedDepth: 64;
    readonly parsedNodes: 100000;
    readonly stringBytes: number;
    readonly findings: 10000;
    readonly parserWorkers: 2;
    readonly readConcurrency: 4;
    readonly taskMs: 1000;
    readonly scanMs: 30000;
};
