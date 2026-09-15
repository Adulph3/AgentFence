export const vscodeAdapter = { kind: 'vscode', version: '1.0.0', supports: s => s.kind === 'vscode' };
import { emptyFacts, mcpFacts } from './normalize.js';
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
/** Only the documented MCP envelope and exact MCP setting namespace identify VS Code. */
export function adaptVscode(source, parsed) {
    const base = mcpFacts(source, parsed, { key: 'servers' });
    if (base.recognized)
        return base;
    const root = object(parsed);
    if (!root)
        return emptyFacts();
    const setting = root['chat.mcp.enabled'];
    if (setting === undefined)
        return base;
    return typeof setting === 'boolean' ? { ...base, recognized: true, envelopeValid: true } : { ...base, recognized: true, diagnostics: ['AF_VSCODE_SETTING'] };
}
//# sourceMappingURL=vscode.js.map