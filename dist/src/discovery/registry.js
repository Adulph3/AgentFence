export const registry = [
    { path: /(?:^|\/)\.codex\/config\.toml$/, kind: 'codex', parseKind: 'toml' }, { path: /(?:^|\/)(?:AGENTS|AGENTS\.override)\.md$/, parseKind: 'markdown' },
    { path: /(?:^|\/)\.claude\/settings(?:\.local)?\.json$/, kind: 'claude-code', parseKind: 'json' }, { path: /(?:^|\/)\.claude\.json$/, kind: 'claude-code', parseKind: 'json' }, { path: /(?:^|\/)(?:CLAUDE|CLAUDE\.local)\.md$/, kind: 'claude-code', parseKind: 'markdown' }, { path: /(?:^|\/)\.claude\/(?:CLAUDE\.md|rules\/.*\.md)$/, kind: 'claude-code', parseKind: 'markdown' },
    { path: /(?:^|\/)\.cursor\/(?:mcp|hooks)\.json$/, kind: 'cursor', parseKind: 'json' }, { path: /(?:^|\/)(?:\.cursorrules|\.cursor\/rules\/.*\.mdc)$/, kind: 'cursor', parseKind: 'markdown' },
    { path: /(?:^|\/)\.kiro\/(?:settings\/mcp\.json|hooks\/.*\.json)$/, kind: 'kiro', parseKind: 'json' }, { path: /(?:^|\/)\.kiro\/steering\/.*\.md$/, kind: 'kiro', parseKind: 'markdown' },
    { path: /(?:^|\/)\.vscode\/(?:mcp|settings)\.json$/, kind: 'vscode', parseKind: 'jsonc' }, { path: /(?:^|\/)\.mcp\.json$/, kind: 'generic-mcp', parseKind: 'json' }
];
/** `.claude.json` is an opt-in home allowlist entry, never a project candidate. */
export function matchCandidate(relative, scope = 'project') { return registry.find(p => !(scope === 'project' && /(?:^|\/)\.claude\.json$/.test(relative)) && p.path.test(relative)); }
//# sourceMappingURL=registry.js.map