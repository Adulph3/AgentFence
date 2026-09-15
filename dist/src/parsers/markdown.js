import { LIMITS } from '../application/budget.js';
import { ParserError } from './guards.js';
export function markdownBlocks(text) { if (Buffer.byteLength(text) > LIMITS.fileBytes)
    throw new ParserError('AF_PARSE_LIMIT'); const out = []; let fence = false; for (const line of text.split(/\n/)) {
    if (Buffer.byteLength(line) > LIMITS.stringBytes)
        throw new ParserError('AF_PARSE_STRING');
    if (/^\s*(?:```|~~~)/.test(line)) {
        fence = !fence;
        continue;
    }
    out.push({ prose: line, fenced: fence, quote: /^\s*>/.test(line) });
} if (fence)
    throw new ParserError('AF_MARKDOWN_FENCE'); return out; }
//# sourceMappingURL=markdown.js.map