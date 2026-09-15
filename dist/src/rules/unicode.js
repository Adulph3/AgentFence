import { finding } from '../analysis/finding.js';
import { LIMITS } from '../application/budget.js';
// U+202A through U+202E are the complete directional-formatting range. Keep
// this explicit so safe code-point evidence remains deterministic.
const bidi = new Set([0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069]);
const codePoint = (value) => `U+${value.toString(16).toUpperCase().padStart(4, '0')}`;
const hidden = (value, index) => ((value >= 0 && value < 32 && value !== 9 && value !== 10 && value !== 13) || value === 127 || ([0x200b, 0x200c, 0x200d, 0xfeff].includes(value) && index !== 0));
const relevantControl = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\u202A-\u202E\u2066-\u2069\uFEFF]/;
/** Coordinates are 1-based UTF-16 columns with end-exclusive locations. */
export function boundedUnicodeFindings(text, location, limit = LIMITS.findings) {
    if (!relevantControl.test(text))
        return { findings: [], truncated: false };
    const findings = [];
    let line = 1, column = 1, index = 0, truncated = false;
    for (const character of text) {
        const value = character.codePointAt(0);
        const endLine = line, endColumn = column + character.length, identifier = codePoint(value);
        const detectedRule = bidi.has(value) ? 'AF-UNICODE-001' : hidden(value, index) ? 'AF-UNICODE-002' : undefined;
        if (detectedRule) {
            if (findings.length >= limit) {
                truncated = true;
                break;
            }
            else {
                const severity = detectedRule === 'AF-UNICODE-001' ? 'medium' : value === 0x200c || value === 0x200d ? 'info' : 'low';
                const summary = detectedRule === 'AF-UNICODE-001' ? 'Bidirectional control character was observed' : 'Hidden format or control character was observed';
                const recommendation = detectedRule === 'AF-UNICODE-001' ? 'Remove bidirectional controls from configuration text' : 'Make unusual controls visible and retain only intentional language usage';
                const semanticFactKey = `unicode:${detectedRule}:${identifier}:L${line}:C${column}:E${endLine}:C${endColumn}`;
                findings.push(finding(detectedRule, 'unicode', severity, 'high', { ...location, line, column, endLine, endColumn }, summary, recommendation, 'potential', [], { semanticFactKey, evidenceKind: 'unicode', codePoints: [identifier] }));
            }
        }
        if (character === '\n') {
            line++;
            column = 1;
        }
        else
            column = endColumn;
        index += character.length;
    }
    return { findings, truncated };
}
/** Legacy array convenience for isolated Unicode callers; bounded by scanner limits. */
export const unicodeFindings = (text, location) => [...boundedUnicodeFindings(text, location).findings];
//# sourceMappingURL=unicode.js.map