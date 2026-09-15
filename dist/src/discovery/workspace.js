/**
 * Internal structural workspace key. It is never serialized or used as a hash
 * input for public IDs; callers convert it to a deterministic local ordinal.
 */
export function workspaceKey(relativePath) {
    const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
    const config = parts.findIndex(part => ['.codex', '.claude', '.cursor', '.kiro', '.vscode'].includes(part));
    if (config >= 0)
        return parts.slice(0, config).join('/');
    return parts.slice(0, -1).join('/');
}
//# sourceMappingURL=workspace.js.map