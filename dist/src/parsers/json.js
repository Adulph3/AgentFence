import { parse, visit } from 'jsonc-parser';
import { guardGraph, ParserError } from './guards.js';
export function parseJson(text, jsonc) { const errors = []; const stack = []; let duplicate = false; let rejected = false; visit(text, { onObjectBegin: () => { stack.push(new Set()); }, onObjectProperty: (name) => { const set = stack.at(-1); if (!set)
        return; if (set.has(name))
        duplicate = true; set.add(name); if (name === '__proto__' || name === 'constructor' || name === 'prototype')
        rejected = true; }, onObjectEnd: () => { stack.pop(); }, onLiteralValue: (v) => { if (typeof v === 'string' && Buffer.byteLength(v) > 64 * 1024)
        rejected = true; } }, { allowTrailingComma: jsonc, disallowComments: !jsonc }); const value = parse(text, errors, { allowTrailingComma: jsonc, disallowComments: !jsonc }); if (errors.length)
    throw new ParserError('AF_PARSE_JSON'); if (duplicate)
    throw new ParserError('AF_PARSE_DUPLICATE_KEY'); if (rejected)
    throw new ParserError('AF_PARSE_GUARD'); guardGraph(value); return value; }
//# sourceMappingURL=json.js.map