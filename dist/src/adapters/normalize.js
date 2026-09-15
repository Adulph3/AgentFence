import { createHmac } from 'node:crypto';
import { applicability } from '../analysis/capabilities.js';
import { classifyCredentialHeader, classifyEnvBinding, classifyEnvNameReference } from '../analysis/env.js';
const obj = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
const strings = (value) => Array.isArray(value) && value.every(item => typeof item === 'string') ? value : undefined;
const dynamic = (value) => /\$\{(?:env:|input:|command:)|\$\(|`/.test(value);
const unresolvedUrl = (value) => /\$\{(?:env:|input:)[^}]+\}/.test(value);
const validLiteralUrl = (value) => { try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
}
catch {
    return false;
} };
const credentialHeader = (name) => /^(?:authorization|x-api-key|api-key)$/i.test(name);
const appendHeaderFacts = (value, envFacts, codexEnvReferences) => { const headers = obj(value); if (!headers)
    return false; let valid = true; for (const [name, headerValue] of Object.entries(headers)) {
    if (typeof headerValue !== 'string') {
        valid = false;
        continue;
    }
    if (!credentialHeader(name))
        continue;
    envFacts.push(codexEnvReferences ? classifyEnvNameReference(headerValue, envFacts.length + 1) : classifyCredentialHeader(headerValue, envFacts.length + 1));
} return valid; };
/** Independently validate documented fields. Untrusted map keys never leave this module. */
export const emptyFacts = () => ({ recognized: false, envelopeValid: false, facts: [], diagnostics: [], hooks: [], approvals: [] });
/**
 * The common parser deliberately handles only transport and credential fields.
 * Vendor enablement and approval semantics are injected by fixed adapter maps.
 */
export function mcpFacts(source, parsed, options) {
    const root = obj(parsed);
    if (!root || !Object.hasOwn(root, options.key))
        return emptyFacts();
    const servers = obj(root[options.key]);
    if (!servers)
        return { ...emptyFacts(), recognized: true, diagnostics: ['AF_MCP_ENVELOPE'] };
    const facts = [];
    let ordinal = 0, malformed = false;
    for (const [name, value] of Object.entries(servers)) {
        ordinal++;
        const server = obj(value);
        if (!server) {
            malformed = true;
            continue;
        }
        let bad = false;
        const command = typeof server.command === 'string' && server.command !== '' ? server.command : undefined;
        const url = typeof server.url === 'string' && server.url !== '' ? server.url : undefined;
        if ((server.command !== undefined && !command) || (server.url !== undefined && !url))
            bad = true;
        const args = strings(server.args);
        if (server.args !== undefined && !args)
            bad = true;
        const type = typeof server.type === 'string' ? server.type : undefined;
        if (server.type !== undefined && !type)
            bad = true;
        if (command && url)
            bad = true;
        if (url && !unresolvedUrl(url) && !validLiteralUrl(url))
            bad = true;
        const transport = command ? 'stdio' : type === 'sse' && url ? 'sse' : url ? 'http' : 'unknown';
        if (transport === 'unknown' || (type !== undefined && type !== transport))
            bad = true;
        const env = obj(server.env);
        if (server.env !== undefined && !env)
            bad = true;
        const envFacts = [];
        if (env)
            for (const [name, binding] of Object.entries(env)) {
                if (typeof binding !== 'string') {
                    bad = true;
                    continue;
                }
                envFacts.push(classifyEnvBinding(name, binding, envFacts.length + 1));
            }
        if (options.codexExtras && server.env_vars !== undefined) {
            const names = strings(server.env_vars);
            if (names) {
                const seenNames = new Set();
                for (const name of names) {
                    if (seenNames.has(name))
                        continue;
                    seenNames.add(name);
                    envFacts.push(classifyEnvNameReference(name, envFacts.length + 1));
                }
            }
            else {
                const map = obj(server.env_vars);
                if (!map)
                    bad = true;
                else
                    for (const [name, binding] of Object.entries(map)) {
                        if (typeof binding === 'string')
                            envFacts.push(classifyEnvBinding(name, binding, envFacts.length + 1));
                        else
                            bad = true;
                    }
            }
        }
        if (options.codexExtras && server.bearer_token_env_var !== undefined) {
            if (typeof server.bearer_token_env_var === 'string')
                envFacts.push(classifyEnvNameReference(server.bearer_token_env_var, envFacts.length + 1));
            else
                bad = true;
        }
        if (options.codexExtras)
            for (const [headerField, envReferences] of [['headers', false], ['http_headers', false], ['env_http_headers', true]])
                if (server[headerField] !== undefined && !appendHeaderFacts(server[headerField], envFacts, envReferences))
                    bad = true;
        const seenEnvFacts = new Set();
        const deduplicatedEnvFacts = envFacts.filter(env => {
            // Only a documented safe name can establish equivalence. Header fields have
            // no exportable name, so collapsing them could hide distinct credentials.
            if (!env.safeName)
                return true;
            const key = `${env.safeName}:${env.mode}:${env.credentialField}`;
            if (seenEnvFacts.has(key))
                return false;
            seenEnvFacts.add(key);
            return true;
        }).map((env, index) => ({ ...env, ordinal: index + 1 }));
        const enabledResult = options.enabled?.(server, name, root) ?? applicability(undefined);
        const enabled = enabledResult === 'invalid' ? (bad = true, applicability(undefined)) : enabledResult;
        const approval = options.approvalBypass?.(server) ?? false;
        if (approval === 'invalid')
            bad = true;
        if (options.validServer && !options.validServer(server))
            bad = true;
        if (bad) {
            malformed = true;
            continue;
        }
        // Source IDs and ordinals are structural acquisition identifiers, never server names or values.
        const principal = `${source.principalId}:${source.id}:M${ordinal}`, capabilities = [];
        if (command)
            capabilities.push({ principal, sourceId: source.id, kind: 'process-launch', basis: 'explicit-config', confidence: 'high', applicability: enabled });
        if (url)
            capabilities.push({ principal, sourceId: source.id, kind: 'network', basis: 'explicit-config', confidence: 'high', applicability: enabled });
        const argv = command ? [command, ...(args ?? [])] : [];
        // Only documented filesystem-server positional arguments are roots.  A
        // launcher path (for example /usr/bin/npx) is never a declared root.
        const filesystemServer = /filesystem(?:-server)?(?:$|[\\/])/i.test(command ?? '') || args?.some(argument => /@modelcontextprotocol\/server-filesystem/i.test(argument)) === true;
        const roots = filesystemServer ? (args ?? []).filter(argument => /^(?:\/|~|[A-Za-z]:[\\/]|\.\.?[\\/])/.test(argument)) : [];
        const all = [command ?? '', ...(args ?? []), url ?? ''];
        const correlationKey = options.kiroCorrelationSecret && /^[a-f0-9]{64}$/.test(options.kiroCorrelationSecret) ? createHmac('sha256', options.kiroCorrelationSecret).update(name, 'utf8').digest('hex') : undefined;
        facts.push({ sourceId: source.id, principal, enabled, transport, ...(command ? { command } : {}), args: args ?? [], ...(url ? { url } : {}), envFacts: deduplicatedEnvFacts, capabilities, dynamic: all.some(dynamic), roots, approvalBypass: approval === true, ...(correlationKey ? { correlationKey } : {}) });
    }
    return { recognized: true, envelopeValid: true, facts, diagnostics: malformed ? ['AF_MCP_ENTITY'] : [], hooks: [], approvals: [] };
}
//# sourceMappingURL=normalize.js.map