import { LIMITS } from '../application/budget.js';
export class ParserError extends Error {
    code;
    constructor(code) {
        super(code);
        this.code = code;
    }
}
export function guardGraph(value, depth = 0, state = { nodes: 0 }) { if (depth > LIMITS.parsedDepth)
    throw new ParserError('AF_PARSE_DEPTH'); if (++state.nodes > LIMITS.parsedNodes)
    throw new ParserError('AF_PARSE_NODES'); if (typeof value === 'string' && Buffer.byteLength(value) > LIMITS.stringBytes)
    throw new ParserError('AF_PARSE_STRING'); if (Array.isArray(value)) {
    for (const x of value)
        guardGraph(x, depth + 1, state);
    return;
} if (value && typeof value === 'object') {
    for (const [key, x] of Object.entries(value)) {
        if (Buffer.byteLength(key) > LIMITS.stringBytes)
            throw new ParserError('AF_PARSE_STRING');
        if (key === '__proto__' || key === 'prototype' || key === 'constructor')
            throw new ParserError('AF_PARSE_PROTOTYPE');
        guardGraph(x, depth + 1, state);
    }
} }
//# sourceMappingURL=guards.js.map