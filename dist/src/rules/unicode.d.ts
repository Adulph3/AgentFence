import type { Finding, Location } from '../core/types.js';
export interface UnicodeFindingsResult {
    readonly findings: readonly Finding[];
    readonly truncated: boolean;
}
/** Coordinates are 1-based UTF-16 columns with end-exclusive locations. */
export declare function boundedUnicodeFindings(text: string, location: Location, limit?: number): UnicodeFindingsResult;
/** Legacy array convenience for isolated Unicode callers; bounded by scanner limits. */
export declare const unicodeFindings: (text: string, location: Location) => Finding[];
