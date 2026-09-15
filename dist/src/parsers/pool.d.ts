import type { SourceRecord, AnalyzeResult } from '../core/types.js';
import type { KiroCorrelatedAnalyzeResult } from '../adapters/pipeline.js';
export type ParseKind = 'json' | 'jsonc' | 'toml' | 'markdown';
/** Exact safe parent boundary for worker analysis replies. */
export declare const validateAnalyzeResultDto: (value: unknown) => value is AnalyzeResult;
export declare class ParserPool {
    #private;
    parse(kind: ParseKind, text: string, signal?: AbortSignal): Promise<unknown>;
    /** Internal orchestration may lower this task's finding allowance; it can never raise it. */
    analyze(source: SourceRecord, signal?: AbortSignal, findingLimit?: number, kiroCorrelationSecret?: string): Promise<KiroCorrelatedAnalyzeResult>;
    close(): Promise<void>;
}
