import { randomBytes } from 'node:crypto';
import { parseBounded } from '../parsers/worker.js';
import { opaque, safe } from '../security/safe.js';
import { scanError } from '../security/errors.js';
import { stableId } from '../core/ids.js';
import { finding } from '../analysis/finding.js';
import { endpointClass, rootClass } from '../analysis/paths.js';
import { analyzeArgv } from '../analysis/shell.js';
import { normalizeFindings } from '../core/normalize.js';
import { extractAdapterFacts } from './dispatch.js';
import { LIMITS } from '../application/budget.js';
export const newKiroCorrelationSecret = () => randomBytes(32).toString('hex');
const correlationKey = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
/**
 * Map a Kiro declaration's already-safe structural server ID to an HMAC of its
 * exact map key. The HMAC secret is per scan and the result is consumed only
 * by mergeAnalysisResults; neither map keys nor correlation keys reach reports.
 */
export function kiroServerCorrelations(source, result, kiroCorrelationSecret) {
    if (source.kind !== 'kiro' || !correlationKey(kiroCorrelationSecret))
        return [];
    try {
        const parsed = source.parsed ?? parseBounded(source.parseKind, source.content), facts = extractAdapterFacts(source, parsed, kiroCorrelationSecret), servers = result.mcpServers.filter(server => server.location.sourceId === source.id && server.agentId === detectedAgentId('kiro', source.workspaceOrdinal));
        return facts.facts.slice(0, 1_000).flatMap((fact, index) => { const server = servers[index], key = fact.correlationKey; return server && correlationKey(key) ? [{ serverId: server.id, key }] : []; });
    }
    catch {
        return [];
    }
}
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
const location = (source) => ({ sourceId: source.id, scope: source.scope, displayPath: opaque('source', Number(source.id.slice(1)) || 0) });
/** A local structural workspace ordinal permits deterministic opaque merging. */
export const detectedAgentId = (kind, workspaceOrdinal = 0) => `A-${kind}-S${workspaceOrdinal}`;
export const detectedAgent = (source, detection = 'confirmed-config') => ({ id: detectedAgentId(source.kind, source.workspaceOrdinal), kind: source.kind, detection, sources: [source.id], adapterVersion: '1.0.0', runtimeVersion: 'unknown', effectiveState: 'unverified' });
const capability = (source, principal, kind, applicability, basis = 'explicit-config') => ({ id: stableId('cap', source.id, principal, kind), principalId: principal, kind, basis, confidence: 'high', applicability, sourceIds: [source.id], constraints: [] });
const context = (principalId, semanticFactKey) => ({ principalId, semanticFactKey });
function addShell(addFinding, errors, source, principal, app, agent, argv, capabilities) {
    const fact = analyzeArgv(argv), loc = location(source);
    if (fact.unsupported) {
        errors.push(scanError('AF_SHELL_UNSUPPORTED', 'analyze', 'partial', source.id));
        return;
    }
    if (fact.shell) {
        addFinding(() => finding('AF-SHELL-001', 'shell', 'low', 'high', loc, 'Shell wrapper is declared', 'Prefer an explicit executable and argument vector', app, [agent], context(principal, 'shell-wrapper')));
        capabilities.push(capability(source, principal, 'shell', app, 'recognized-command'));
    }
    if (fact.sudo)
        addFinding(() => finding('AF-SHELL-002', 'shell', 'medium', 'high', loc, 'Elevated command is declared', 'Remove elevation and use a least-privilege account', app, [agent], context(principal, 'elevated-command')));
    if (fact.rmrf)
        addFinding(() => finding('AF-SHELL-003', 'shell', fact.rmrf === 'root' ? 'critical' : fact.rmrf === 'project' ? 'medium' : 'high', 'high', loc, 'Recursive force deletion is declared', 'Narrow explicit targets and require approval', app, [agent], context(principal, 'recursive-force-delete')));
    if (fact.chain)
        addFinding(() => finding('AF-SHELL-004', 'shell', 'low', 'high', loc, 'Composite shell execution is declared', 'Replace composite shell strings with fixed commands', app, [agent], context(principal, 'composite-shell-execution')));
    if (fact.push)
        addFinding(() => finding('AF-SHELL-005', 'shell', fact.push === 'force' ? 'high' : 'medium', 'high', loc, 'Git push automation is declared', 'Require review and explicit approval before publishing changes', app, [agent], context(principal, 'git-push-automation')));
    if (fact.supply) {
        if (fact.supply === 'mutable')
            addFinding(() => finding('AF-SUPPLY-001', 'supply-chain', 'medium', 'high', loc, 'Mutable package execution selector is declared', 'Pin a direct package version', app, [agent], context(principal, 'mutable-package-selector')));
        addFinding(() => finding('AF-SUPPLY-002', 'supply-chain', 'info', 'high', loc, 'Temporary package runner is declared', 'Prefer a reviewed installed dependency', app, [agent], context(principal, 'temporary-package-runner')));
    }
    if (fact.remotePipe) {
        addFinding(() => finding('AF-SUPPLY-003', 'supply-chain', 'critical', 'high', loc, 'Download-to-interpreter flow is declared', 'Fetch and verify separately without streaming execution', app, [agent], context(principal, 'download-to-interpreter')));
        capabilities.push(capability(source, principal, 'network', app, 'recognized-command'));
    }
}
/** Fixed structured-source pipeline. Adapter facts, never arbitrary JSON traversal, drive findings. */
export function analyzeStructuredSource(source, budget = { remaining: LIMITS.findings, truncated: false }, kiroCorrelationSecret) {
    const findings = [], errors = [], servers = [], capabilities = [];
    let agents = [];
    const addFinding = create => { if (budget.remaining <= 0) {
        budget.truncated = true;
        return;
    } budget.remaining--; findings.push(create()); };
    try {
        const parsed = object(source.parsed ?? parseBounded(source.parseKind, source.content));
        if (!parsed)
            throw new Error('AF_PARSE_STRUCTURE');
        const facts = extractAdapterFacts(source, parsed, kiroCorrelationSecret), independentFacts = facts.hooks.length > 0 || facts.approvals.length > 0;
        // A valid vendor hook/approval is independently analyzable even when a
        // malformed peer makes the MCP envelope partial. Declaration processing
        // still requires a valid envelope, so malformed MCP does not get laundered.
        if (source.kind && (facts.envelopeValid || independentFacts))
            agents = [detectedAgent(source)];
        for (const code of facts.diagnostics)
            errors.push(scanError(code, 'analyze', 'partial', source.id));
        if (!source.kind)
            return { findings: normalizeFindings(findings), agents, mcpServers: servers, capabilities, errors };
        const agent = detectedAgentId(source.kind, source.workspaceOrdinal);
        let ordinal = 0;
        if (facts.envelopeValid)
            for (const declaration of facts.facts) {
                const loc = location(source), enabled = declaration.enabled === 'inactive' ? 'no' : declaration.enabled === 'potential' ? 'yes' : 'unknown', app = declaration.enabled, endpoint = declaration.url ? endpointClass(declaration.url) : undefined, id = stableId('mcp', source.id, String(ordinal++)), bindings = [], envFacts = declaration.envFacts.slice(0, 256);
                if (declaration.envFacts.length > envFacts.length)
                    errors.push(scanError('AF_REPORT_LIMIT', 'analyze', 'partial', source.id));
                for (const env of envFacts) {
                    const envKey = `env-binding-${env.ordinal}`;
                    bindings.push({ name: safe(env.safeName ?? `ENV_${String(env.ordinal).padStart(3, '0')}`), mode: env.mode });
                    if (env.nameClass === 'known' && env.mode !== 'unknown')
                        addFinding(() => finding('AF-SECRET-001', 'secrets', 'medium', 'high', loc, 'Sensitive environment binding is declared', 'Forward only required scoped credentials', app, [agent], context(declaration.principal, envKey)));
                    else if (env.nameClass === 'sensitive-suffix' && env.mode !== 'unknown')
                        addFinding(() => finding('AF-SECRET-001', 'secrets', 'medium', 'medium', loc, 'Sensitive environment binding is declared', 'Forward only required scoped credentials', app, [agent], context(declaration.principal, envKey)));
                    if (env.credentialField && env.mode === 'literal')
                        addFinding(() => finding('AF-SECRET-002', 'secrets', 'high', 'high', loc, 'Literal credential-bearing configuration is declared', 'Remove literals from shared configuration', app, [agent], context(declaration.principal, envKey)));
                    if (env.credentialField && env.mode !== 'unknown')
                        capabilities.push(capability(source, declaration.principal, 'sensitive-env', app));
                }
                const launcher = declaration.command && /^(?:sh|bash|zsh|dash)(?:\.exe)?$/i.test(declaration.command.split(/[\\/]/).pop() ?? '') ? 'shell' : declaration.command && /^(?:npx|npm)(?:\.exe)?$/i.test(declaration.command.split(/[\\/]/).pop() ?? '') ? 'package-runner' : declaration.command ? 'direct' : 'unknown';
                // Structural ordinals must follow semantic de-duplication: repeating the same
                // declared root cannot manufacture a second score group for one principal.
                const rootCandidates = [...new Set(declaration.roots)], rootValues = rootCandidates.slice(0, 256);
                if (rootCandidates.length > rootValues.length)
                    errors.push(scanError('AF_REPORT_LIMIT', 'analyze', 'partial', source.id));
                const selector = launcher === 'package-runner' ? (analyzeArgv([declaration.command, ...declaration.args]).supply === 'exact' ? 'exact' : 'mutable') : declaration.command ? 'absent' : 'unresolved', roots = rootValues.map(value => ({ class: rootClass(value) }));
                servers.push({ id, agentId: agent, principalId: declaration.principal, location: loc, transport: declaration.transport, enabled, launcher, packageSelector: selector, ...(endpoint ? { endpoint } : {}), envBindings: bindings, roots, capabilityIds: [] });
                if (declaration.transport === 'stdio')
                    addFinding(() => finding('AF-MCP-001', 'mcp', 'info', 'high', loc, 'Local process MCP server is declared', 'Review executable identity and process privileges', app, [agent], context(declaration.principal, 'local-process-server')));
                else
                    addFinding(() => finding('AF-MCP-002', 'mcp', 'info', 'high', loc, 'Remote MCP endpoint is declared', 'Review provider, data flow and authorization', app, [agent], context(declaration.principal, 'remote-endpoint')));
                if (endpoint?.scheme === 'http')
                    addFinding(() => finding('AF-NET-001', 'network', endpoint.hostClass === 'loopback-literal' ? 'info' : 'medium', 'high', loc, 'Plain HTTP MCP endpoint is declared', 'Prefer authenticated HTTPS', app, [agent], context(declaration.principal, 'plain-http-endpoint')));
                if (declaration.dynamic)
                    addFinding(() => finding('AF-MCP-003', 'mcp', 'medium', 'medium', loc, 'Dynamic MCP launcher or argument construction is declared', 'Use explicit reviewed launch values', app, [agent], context(declaration.principal, 'dynamic-launcher')));
                for (const [rootIndex, root] of roots.entries())
                    if (root.class === 'filesystem' || root.class === 'home' || root.class === 'sensitive')
                        addFinding(() => finding('AF-FS-001', 'filesystem', 'high', 'high', loc, 'Broad filesystem root is declared', 'Expose only required project subdirectories', app, [agent], context(declaration.principal, `filesystem-root-${rootIndex + 1}`)));
                if (declaration.approvalBypass) {
                    addFinding(() => finding('AF-PERM-001', 'permissions', 'high', 'high', loc, 'Broad approval bypass is declared', 'Restore approval and narrow tool permissions', app, [agent], context(declaration.principal, 'approval-bypass')));
                    capabilities.push(capability(source, declaration.principal, 'approval-bypass', app));
                }
                for (const c of declaration.capabilities)
                    capabilities.push(capability(source, c.principal, c.kind, c.applicability, c.basis));
                if (declaration.command)
                    addShell(addFinding, errors, source, declaration.principal, app, agent, [declaration.command, ...declaration.args], capabilities);
            }
        for (const approval of facts.approvals) {
            addFinding(() => finding('AF-PERM-001', 'permissions', 'high', 'high', location(source), 'Broad approval bypass is declared', 'Restore approval and narrow tool permissions', approval.applicability, [agent], context(approval.principal, 'approval-bypass')));
            capabilities.push(capability(source, approval.principal, 'approval-bypass', approval.applicability));
        }
        for (const hook of facts.hooks)
            addShell(addFinding, errors, source, hook.principal, hook.applicability, agent, ['sh', '-c', hook.command], capabilities);
        const uniqueCapabilities = [...new Map(capabilities.map(capability => [capability.id, capability])).values()];
        for (let index = 0; index < servers.length; index++) {
            const server = servers[index], ids = uniqueCapabilities.filter(capability => capability.principalId === server.principalId).map(capability => capability.id);
            if (ids.length > 1000)
                errors.push(scanError('AF_REPORT_LIMIT', 'analyze', 'partial', source.id));
            servers[index] = { ...server, capabilityIds: ids.slice(0, 1000) };
        }
        capabilities.splice(0, capabilities.length, ...uniqueCapabilities);
    }
    catch {
        errors.push(scanError('AF_PARSE_FAILED', 'parse', 'partial', source.id));
    }
    if (budget.truncated) {
        errors.push(scanError('AF_REPORT_LIMIT', 'analyze', 'partial', source.id));
        errors.push(scanError('AF_FINDINGS_LIMIT', 'analyze', 'partial', source.id));
    }
    return { findings: normalizeFindings(findings), agents, mcpServers: servers, capabilities, errors };
}
//# sourceMappingURL=pipeline.js.map