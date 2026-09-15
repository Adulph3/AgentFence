export declare class ParserError extends Error {
    readonly code: string;
    constructor(code: string);
}
export declare function guardGraph(value: unknown, depth?: number, state?: {
    nodes: number;
}): void;
