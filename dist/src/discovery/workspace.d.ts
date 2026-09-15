/**
 * Internal structural workspace key. It is never serialized or used as a hash
 * input for public IDs; callers convert it to a deterministic local ordinal.
 */
export declare function workspaceKey(relativePath: string): string;
