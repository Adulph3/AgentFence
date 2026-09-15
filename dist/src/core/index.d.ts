import type { AnalyzeResult, SourceRecord } from './types.js';
export { scoreFindings } from '../scoring/score.js';
export type { ScanReport, ScanFailure, DoctorReport, Finding, ScoreResult, SafeText, Severity, Confidence, Applicability, Category, SourceRecord, AnalyzeResult } from './types.js';
/** Assign only local structural ordinals; raw workspace keys never leave analysis. */
export declare function prepareSources(sources: readonly SourceRecord[]): SourceRecord[];
/** Package-facing core entrypoint; bounded and limited to supported fields. */
export declare function analyzePublicSources(sources: readonly SourceRecord[]): AnalyzeResult;
/** Public pure analysis entrypoint. Structured formats use the fixed adapter pipeline. */
/** Internal callers may lower the finding allowance; package exports always use the fixed default. */
export declare function analyzeSources(sources: readonly SourceRecord[], internalFindingLimit?: number): AnalyzeResult;
export declare function mergeAnalysisResults(results: readonly AnalyzeResult[], internalFindingLimit?: number): AnalyzeResult;
