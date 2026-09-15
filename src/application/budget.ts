/** Scanner-owned hard limits. These are never configurable by scanned content. */
export const LIMITS={
 entries:50_000, directoryEntries:5_000, depth:24, files:1_000,
 bytes:32*1024*1024, fileBytes:1_024*1024, outputBytes:16*1024*1024,
 parsedDepth:64, parsedNodes:100_000, stringBytes:64*1024, findings:10_000,
 parserWorkers:2, readConcurrency:4, taskMs:1_000, scanMs:30_000
} as const;
