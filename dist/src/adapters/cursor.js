import { mcpFacts } from './normalize.js';
export const cursorAdapter = { kind: 'cursor', version: '1.0.0', supports: s => s.kind === 'cursor' };
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
const disabled = (server) => server.disabled === undefined ? 'unknown' : typeof server.disabled === 'boolean' ? (server.disabled ? 'inactive' : 'potential') : 'invalid';
/** Dated Cursor map: boolean is supported; list form is broad only for exactly ['*']. */
const approval = (server) => { const value = server.autoApprove; if (value === undefined)
    return false; if (value === true || value === false)
    return value; if (Array.isArray(value)) {
    if (!value.every(item => typeof item === 'string'))
        return 'invalid';
    return value.length === 1 && value[0] === '*';
} return 'invalid'; };
/** Cursor MCP fields use disabled/autoApprove, not the generic enabled shape. */
export function adaptCursor(source, parsed) {
    const base = mcpFacts(source, parsed, { key: 'mcpServers', enabled: disabled, approvalBypass: approval });
    return hooks(source, parsed, base);
}
function hooks(source, parsed, base) {
    if (!/(?:^|\/)\.cursor\/hooks\.json$/.test(source.relativePath.replace(/\\/g, '/')))
        return base;
    const root = object(parsed), raw = root?.hooks;
    if (raw === undefined)
        return base;
    const values = [];
    let invalid = false, event = 0;
    const add = (value) => { const item = object(value); if (!item || typeof item.command !== 'string' || item.command === '') {
        invalid = true;
        return;
    } values.push({ command: item.command, event: ++event }); };
    if (Array.isArray(raw))
        raw.forEach(add);
    else {
        const events = object(raw);
        if (!events)
            invalid = true;
        else
            for (const handlers of Object.values(events)) {
                if (!Array.isArray(handlers)) {
                    invalid = true;
                    continue;
                }
                handlers.forEach(add);
            }
    }
    if (!base.recognized && values.length === 0 && !invalid)
        return base;
    const hooks = values.slice(0, 64).map(item => ({ principal: `${source.principalId}:${source.id}:H${item.event}`, command: item.command, applicability: 'potential', eventOrdinal: item.event }));
    // A valid hook can identify a hook-only file, but it cannot repair an MCP
    // envelope that was explicitly present and malformed.
    return { ...base, recognized: true, envelopeValid: base.recognized ? base.envelopeValid : !invalid, hooks, diagnostics: [...base.diagnostics, ...(invalid ? ['AF_CURSOR_HOOKS'] : []), ...(values.length > hooks.length ? ['AF_REPORT_LIMIT'] : [])] };
}
//# sourceMappingURL=cursor.js.map