import { mcpFacts } from './normalize.js';
export const kiroAdapter = { kind: 'kiro', version: '1.0.0', supports: s => s.kind === 'kiro' };
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
const disabled = (server) => server.disabled === undefined ? 'potential' : typeof server.disabled === 'boolean' ? (server.disabled ? 'inactive' : 'potential') : 'invalid';
/** Dated Kiro map: boolean is supported; list form is broad only for exactly ['*']. */
const approval = (server) => { const value = server.autoApprove; if (value === undefined)
    return false; if (value === true || value === false)
    return value; if (Array.isArray(value)) {
    if (!value.every(item => typeof item === 'string'))
        return 'invalid';
    return value.length === 1 && value[0] === '*';
} return 'invalid'; };
/** Kiro's dated MCP map is limited to disabled and autoApprove. */
export function adaptKiro(source, parsed, kiroCorrelationSecret) {
    const base = mcpFacts(source, parsed, { key: 'mcpServers', enabled: disabled, approvalBypass: approval, ...(kiroCorrelationSecret ? { kiroCorrelationSecret } : {}) });
    if (!/(?:^|\/)\.kiro\/hooks\/[^/]+\.json$/.test(source.relativePath.replace(/\\/g, '/')))
        return base;
    const root = object(parsed), raw = root?.hooks;
    if (raw === undefined)
        return base;
    if (!Array.isArray(raw))
        return { ...base, recognized: true, diagnostics: [...base.diagnostics, 'AF_KIRO_HOOKS'] };
    const values = [];
    let invalid = false;
    for (const value of raw) {
        const item = object(value);
        if (!item || typeof item.command !== 'string' || item.command === '') {
            invalid = true;
            continue;
        }
        values.push(item.command);
    }
    const hooks = values.slice(0, 64).map((command, index) => ({ principal: `${source.principalId}:${source.id}:H${index + 1}`, command, applicability: 'potential', eventOrdinal: index + 1 }));
    // A valid hook can identify a hook-only file, but it cannot repair an MCP
    // envelope that was explicitly present and malformed.
    return { ...base, recognized: true, envelopeValid: base.recognized ? base.envelopeValid : !invalid, hooks, diagnostics: [...base.diagnostics, ...(invalid ? ['AF_KIRO_HOOKS'] : []), ...(values.length > hooks.length ? ['AF_REPORT_LIMIT'] : [])] };
}
//# sourceMappingURL=kiro.js.map