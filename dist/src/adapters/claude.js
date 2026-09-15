import { mcpFacts } from './normalize.js';
export const claudeAdapter = { kind: 'claude-code', version: '1.0.0', supports: s => s.kind === 'claude-code' };
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
const disabled = (server, name, root) => {
    const list = root.disabledMcpServers;
    if (list === undefined)
        return 'unknown';
    // Settings validation records the partial diagnostic independently. Keep a
    // structurally valid server analyzable with unknown enablement rather than
    // dropping every sibling because this global list is malformed.
    if (!Array.isArray(list) || !list.every(item => typeof item === 'string'))
        return 'unknown';
    return list.includes(name) ? 'inactive' : 'potential';
};
const claudeMcp = (source, parsed) => mcpFacts(source, parsed, { key: 'mcpServers', enabled: disabled });
const claudeDefaultModes = new Set(['default', 'acceptEdits', 'plan', 'bypassPermissions']);
/**
 * `.claude.json` is a user-global file.  Its project map is deliberately not a
 * discovery surface: only the entry keyed by the already-canonical scan root is
 * selected, and that key remains acquisition-only data.
 */
export function adaptClaude(source, parsed) {
    if (!source.claudeProjectRoot)
        return settingsFacts(source, parsed, claudeMcp(source, parsed));
    const root = object(parsed);
    if (!root)
        return claudeMcp(source, parsed);
    const topLevel = object(root.mcpServers);
    const projects = object(root.projects);
    if (root.projects !== undefined && !projects) {
        const base = claudeMcp(source, parsed);
        return { ...base, diagnostics: [...base.diagnostics, 'AF_CLAUDE_PROJECTS'] };
    }
    const project = projects?.[source.claudeProjectRoot];
    if (project === undefined)
        return claudeMcp(source, parsed);
    const entry = object(project);
    if (!entry) {
        const base = claudeMcp(source, parsed);
        return { ...base, diagnostics: [...base.diagnostics, 'AF_CLAUDE_PROJECT'] };
    }
    const projectServers = object(entry.mcpServers);
    if (entry.mcpServers !== undefined && !projectServers) {
        const base = claudeMcp(source, parsed);
        return { ...base, diagnostics: [...base.diagnostics, 'AF_CLAUDE_PROJECT'] };
    }
    if (!projectServers)
        return claudeMcp(source, parsed);
    if (root.mcpServers !== undefined && !topLevel) {
        const base = claudeMcp(source, parsed);
        return { ...base, diagnostics: [...base.diagnostics, 'AF_CLAUDE_TOP_LEVEL'] };
    }
    const selected = Object.create(null);
    for (const [name, server] of Object.entries(topLevel ?? {}))
        selected[name] = server;
    let collision = false;
    for (const [name, server] of Object.entries(projectServers)) {
        if (Object.hasOwn(selected, name)) {
            collision = true;
            continue;
        }
        selected[name] = server;
    }
    const result = claudeMcp(source, { mcpServers: selected });
    return collision ? { ...result, diagnostics: [...result.diagnostics, 'AF_CLAUDE_PROJECT_CONFLICT'] } : result;
}
/** Claude settings are not deep-merged: only its documented list, mode, and hook shape are read. */
function settingsFacts(source, parsed, base) {
    if (!/(?:^|\/)\.claude\/settings(?:\.local)?\.json$/.test(source.relativePath.replace(/\\/g, '/')))
        return base;
    const root = object(parsed);
    if (!root)
        return base;
    const permissions = root.permissions, permission = object(permissions);
    let invalid = false, approval = false;
    if (permissions !== undefined && !permission)
        invalid = true;
    if (permission?.defaultMode !== undefined) {
        if (typeof permission.defaultMode !== 'string' || !claudeDefaultModes.has(permission.defaultMode))
            invalid = true;
        else
            approval = permission.defaultMode === 'bypassPermissions';
    }
    if (root.disabledMcpServers !== undefined && (!Array.isArray(root.disabledMcpServers) || !root.disabledMcpServers.every(item => typeof item === 'string')))
        invalid = true;
    const rawHooks = root.hooks;
    const hooks = [];
    if (rawHooks !== undefined) {
        const events = object(rawHooks);
        if (!events)
            invalid = true;
        else {
            let ordinal = 0;
            for (const entries of Object.values(events)) {
                if (!Array.isArray(entries)) {
                    invalid = true;
                    continue;
                }
                for (const entry of entries) {
                    const matcher = object(entry), inner = matcher && Array.isArray(matcher.hooks) ? matcher.hooks : undefined;
                    if (!inner) {
                        invalid = true;
                        continue;
                    }
                    for (const hook of inner) {
                        const item = object(hook);
                        if (!item || item.type !== 'command' || typeof item.command !== 'string' || item.command === '') {
                            invalid = true;
                            continue;
                        }
                        ordinal++;
                        hooks.push({ principal: `${source.principalId}:${source.id}:H${ordinal}`, command: item.command, applicability: 'potential', eventOrdinal: ordinal });
                    }
                }
            }
        }
    }
    const approvals = approval ? [{ principal: `${source.principalId}:${source.id}:V1`, applicability: 'potential' }] : [];
    const identifies = base.recognized || permissions !== undefined || rawHooks !== undefined || root.disabledMcpServers !== undefined;
    if (!identifies)
        return base;
    // A malformed MCP envelope cannot be laundered into Claude identification by
    // adjacent settings fields. Settings alone may identify only when no MCP
    // envelope was supplied at all.
    return { ...base, recognized: true, envelopeValid: base.envelopeValid || (!base.recognized && !invalid), hooks, approvals, diagnostics: [...base.diagnostics, ...(invalid ? ['AF_CLAUDE_SETTINGS'] : [])] };
}
//# sourceMappingURL=claude.js.map