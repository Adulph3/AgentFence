import { parse } from '@iarna/toml';
import { guardGraph, ParserError } from './guards.js';
export function parseToml(text) { try {
    const value = parse(text);
    guardGraph(value);
    return value;
}
catch (error) {
    if (error instanceof ParserError)
        throw error;
    throw new ParserError('AF_PARSE_TOML');
} }
//# sourceMappingURL=toml.js.map