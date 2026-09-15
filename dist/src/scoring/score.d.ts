import type { Finding, ScoreResult } from '../core/types.js';
export declare function scoreFindings(findings: readonly Finding[], analyzedFiles?: number, partial?: boolean): ScoreResult;
