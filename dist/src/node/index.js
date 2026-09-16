import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { opendir, lstat } from 'node:fs/promises';
import { checkedRoot } from '../fs/root.js';
import { walk } from '../fs/walk.js';
import { checkedDirectory, checkedRead } from '../fs/read.js';
import { matchCandidate } from '../discovery/registry.js';
import { mergeAnalysisResults, prepareSources } from '../core/index.js';
import { scoreFindings } from '../scoring/score.js';
import { safe } from '../security/safe.js';
import { scanError } from '../security/errors.js';
import { LIMITS } from '../application/budget.js';
import { ParserPool } from '../parsers/pool.js';
import { newKiroCorrelationSecret } from '../adapters/pipeline.js';
const severities = ['info', 'low', 'medium', 'high', 'critical'];
const reportErrorLimit = 10_000;
export const finalErrors = (errors) => {
    if (errors.length <= reportErrorLimit)
        return [...errors];
    const marker = errors.find(error => error.code === 'AF_REPORT_LIMIT') ?? scanError('AF_REPORT_LIMIT', 'analyze', 'partial');
    return [...errors.filter(error => error.code !== 'AF_REPORT_LIMIT').slice(0, reportErrorLimit - 1), marker];
};
const userFixed = ['.codex/config.toml', '.codex/AGENTS.md', '.codex/AGENTS.override.md', '.claude/settings.json', '.claude/CLAUDE.md', '.claude.json', '.cursor/mcp.json', '.cursor/hooks.json', '.kiro/settings/mcp.json'];
const effectiveLimits = (overrides) => Object.fromEntries(Object.entries(LIMITS).map(([key, value]) => [key, Math.max(0, Math.min(value, overrides?.[key] ?? value))]));
function source(id, scope, relativePath, content, principalId, claudeProjectRoot) { const pattern = matchCandidate(relativePath, scope); return pattern ? { id: `S${id}`, scope, ...(pattern.kind ? { kind: pattern.kind } : {}), relativePath, content, parseKind: pattern.parseKind, principalId, ...(claudeProjectRoot ? { claudeProjectRoot } : {}) } : undefined; }
const missing = (error) => typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
async function userPathPresent(home, relativePath, kind, statPath = lstat) { const parts = relativePath.split('/'); let current = home; try {
    const root = await statPath(home);
    if (root.isSymbolicLink() || !root.isDirectory())
        throw new Error('unsafe');
    for (let index = 0; index < parts.length; index++) {
        current = join(current, parts[index]);
        let entry;
        try {
            entry = await statPath(current);
        }
        catch (error) {
            if (missing(error))
                return false;
            throw error;
        }
        if (entry.isSymbolicLink() || entry.dev !== root.dev)
            throw new Error('unsafe');
        if (index < parts.length - 1) {
            if (!entry.isDirectory())
                throw new Error('unsafe');
            continue;
        }
        if (kind === 'file' ? !entry.isFile() : !entry.isDirectory())
            throw new Error('unsafe');
        return true;
    }
}
catch {
    throw new Error('unsafe');
} return false; }
async function userMarkdown(home, dir, principal, add, budget, limits, statPath = lstat) {
    if (!budget.entry())
        return;
    try {
        if (!await userPathPresent(home, dir, 'directory', statPath))
            return;
        await checkedDirectory(home, dir, { lstat: statPath });
    }
    catch {
        budget.unsafe();
        return;
    }
    async function visit(relative, depth) {
        if (budget.stopped())
            return;
        if (!budget.depth(depth))
            return;
        let handle;
        try {
            await checkedDirectory(home, relative, { lstat: statPath });
            handle = await opendir(join(home, relative));
        }
        catch {
            budget.unsafe();
            return;
        }
        const entries = [];
        let directoryEntries = 0;
        try {
            for await (const entry of handle) {
                if (budget.stopped())
                    return;
                if (++directoryEntries > limits.directoryEntries) {
                    budget.directoryLimit();
                    return;
                }
                if (!budget.entry())
                    return;
                entries.push(entry);
            }
        }
        catch {
            budget.unsafe();
            return;
        }
        entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        for (const entry of entries) {
            if (budget.stopped())
                return;
            const rel = `${relative}/${entry.name}`;
            if (entry.isSymbolicLink()) {
                budget.unsafe();
                continue;
            }
            if (entry.isDirectory()) {
                await visit(rel, depth + 1);
                continue;
            }
            if (entry.isFile() && entry.name.endsWith('.md') && !await add(rel))
                return;
        }
    }
    await visit(dir, 0);
}
export async function scanProject(request = {}, services = {}, signal) {
    const started = (services.now ?? Date.now)(), now = services.now ?? Date.now, limits = effectiveLimits(services.limits), deadline = started + limits.scanMs;
    let root;
    try {
        root = await checkedRoot(request.path ?? process.cwd());
    }
    catch {
        return failureReport(request);
    }
    const errors = [], userLstat = services.userLstat ?? lstat;
    const budgetError = (code, stage) => { if (!errors.some(error => error.code === code))
        errors.push(scanError(code, stage, 'partial')); };
    const walkResult = await walk(root, { ...(signal ? { signal } : {}), deadline, now, limits });
    if (walkResult.skipped.interrupted)
        budgetError('AF_INTERRUPTED', 'discovery');
    if (walkResult.skipped.deadline)
        budgetError('AF_SCAN_TIMEOUT', 'discovery');
    const sources = [];
    let index = 0, bytes = 0, candidates = 0, visited = walkResult.visited, principalCount = 0, stopped = Boolean(walkResult.skipped['entry-limit'] || walkResult.skipped['directory-entry-limit'] || walkResult.skipped.interrupted || walkResult.skipped.deadline);
    const principals = new Map();
    const projectPrincipal = (relative) => { const key = relative.replace(/\\/g, '/').split('/'); const config = key.findIndex(part => ['.codex', '.claude', '.cursor', '.kiro', '.vscode'].includes(part)); const workspace = (config >= 0 ? key.slice(0, config) : key.slice(0, -1)).join('/') || 'root'; let value = principals.get(workspace); if (!value) {
        value = `P${++principalCount}`;
        principals.set(workspace, value);
    } return value; };
    const halt = (code, stage) => { if (!stopped) {
        stopped = true;
        budgetError(code, stage);
    } };
    const shouldStop = () => { if (stopped)
        return true; if (signal?.aborted) {
        halt('AF_INTERRUPTED', 'discovery');
        return true;
    } if (now() > deadline) {
        halt('AF_SCAN_TIMEOUT', 'discovery');
        return true;
    } return false; };
    const acquisitionBudget = { stopped: shouldStop, entry: () => { if (shouldStop())
            return false; if (visited >= limits.entries) {
            halt('AF_WALK_LIMIT', 'discovery');
            return false;
        } visited++; return true; }, depth: (depth) => { if (shouldStop())
            return false; if (depth > limits.depth) {
            halt('AF_USER_DEPTH', 'discovery');
            return false;
        } return true; }, directoryLimit: () => halt('AF_USER_DIRECTORY_LIMIT', 'discovery'), unsafe: () => budgetError('AF_USER_TREE_UNSAFE', 'discovery') };
    const add = async (scope, base, relative, principal) => {
        if (shouldStop())
            return false;
        if (!matchCandidate(relative, scope))
            return true;
        if (candidates >= limits.files) {
            halt('AF_CANDIDATE_LIMIT', 'discovery');
            return false;
        }
        candidates++;
        // Allocate once for every attempted candidate. A read failure must consume
        // its opaque ordinal so it cannot collide with the next successful source.
        const sourceOrdinal = ++index;
        try {
            const content = await checkedRead(base, relative, { reserveBytes: size => { if (bytes + size > limits.bytes) {
                    halt('AF_TOTAL_BYTES', 'read');
                    return false;
                } bytes += size; return true; }, ...(scope === 'user' ? { lstat: userLstat } : {}) });
            const item = source(sourceOrdinal, scope, relative, content, principal, scope === 'user' && relative === '.claude.json' ? root : undefined);
            if (item)
                sources.push(item);
            return !shouldStop();
        }
        catch (error) {
            const code = error instanceof Error && /^AF_[A-Z_]+$/.test(error.message) ? error.message : 'AF_SOURCE_UNREADABLE';
            errors.push(scanError(code, 'read', 'partial', `S${sourceOrdinal}`));
            return !shouldStop();
        }
    };
    for (const relative of walkResult.files) {
        if (!await add('project', root, relative, projectPrincipal(relative)))
            break;
    }
    if (request.userConfigs && !shouldStop()) {
        const home = services.home?.() ?? homedir();
        for (const relative of userFixed) {
            if (!acquisitionBudget.entry())
                break;
            try {
                if (await userPathPresent(home, relative, 'file', userLstat) && !await add('user', home, relative, 'P-user'))
                    break;
            }
            catch {
                errors.push(scanError('AF_USER_SOURCE_UNSAFE', 'read', 'partial'));
            }
        }
        await userMarkdown(home, '.claude/rules', 'P-user', relative => add('user', home, relative, 'P-user'), acquisitionBudget, limits, userLstat);
        await userMarkdown(home, '.kiro/steering', 'P-user', relative => add('user', home, relative, 'P-user'), acquisitionBudget, limits, userLstat);
    }
    const preparedSources = prepareSources(sources), pool = new ParserPool(), kiroCorrelationSecret = newKiroCorrelationSecret(), analyzed = [], perSource = [], scanFindingLimit = Math.min(limits.findings, LIMITS.findings);
    let remainingFindings = scanFindingLimit;
    const findingBudgetError = () => { budgetError('AF_FINDINGS_LIMIT', 'analyze'); budgetError('AF_REPORT_LIMIT', 'analyze'); };
    const analyzeOne = async (item) => {
        if (remainingFindings <= 0) {
            findingBudgetError();
            return undefined;
        }
        try {
            const result = await pool.analyze(item, signal, remainingFindings, kiroCorrelationSecret);
            remainingFindings -= result.findings.length;
            if (result.errors.some(error => error.code === 'AF_FINDINGS_LIMIT') || remainingFindings === 0)
                findingBudgetError();
            return result;
        }
        catch (error) {
            const code = error instanceof Error && /^AF_[A-Z0-9_]+$/.test(error.message) ? error.message : 'AF_PARSE_FAILED';
            errors.push(scanError(code, 'parse', 'partial', item.id));
            return undefined;
        }
    };
    try {
        for (const item of preparedSources) {
            if (shouldStop()) {
                budgetError(signal?.aborted ? 'AF_INTERRUPTED' : 'AF_SCAN_TIMEOUT', 'analyze');
                break;
            }
            const result = await analyzeOne(item);
            if (!result)
                break;
            perSource.push(result);
            analyzed.push(item);
            if (errors.some(error => error.code === 'AF_FINDINGS_LIMIT'))
                break;
        }
        const claudeWorkspaces = new Set(analyzed.flatMap((item, index) => item.kind === 'claude-code' && perSource[index]?.agents.some(agent => agent.kind === 'claude-code' && agent.detection === 'confirmed-config') ? [item.workspaceOrdinal] : []));
        for (let index = 0; index < analyzed.length && !shouldStop(); index++) {
            const item = analyzed[index];
            if (item.kind !== 'generic-mcp' || !/(?:^|\/)\.mcp\.json$/.test(item.relativePath.replace(/\\/g, '/')) || !claudeWorkspaces.has(item.workspaceOrdinal))
                continue;
            const associated = { ...item, kind: 'claude-code' }, replacement = await analyzeOne(associated);
            if (!replacement)
                break;
            perSource[index] = replacement;
            analyzed[index] = associated;
            if (errors.some(error => error.code === 'AF_FINDINGS_LIMIT'))
                break;
        }
    }
    finally {
        await pool.close();
    }
    const result = mergeAnalysisResults(perSource, scanFindingLimit), parentDirectory = (path) => { const index = path.lastIndexOf('/'); return index < 0 ? '' : path.slice(0, index); }, overrideDirectories = new Set(analyzed.filter(item => /(?:^|\/)AGENTS\.override\.md$/.test(item.relativePath.replace(/\\/g, '/'))).map(item => parentDirectory(item.relativePath.replace(/\\/g, '/')))), inactiveSources = new Set(analyzed.filter(item => { const path = item.relativePath.replace(/\\/g, '/'); return /(?:^|\/)AGENTS\.md$/.test(path) && overrideDirectories.has(parentDirectory(path)); }).map(item => item.id)), findings = result.findings.map(finding => inactiveSources.has(finding.location.sourceId) ? { ...finding, applicability: 'inactive' } : finding);
    errors.push(...result.errors);
    if (walkResult.limited)
        budgetError('AF_WALK_LIMIT', 'discovery');
    if (findings.length > scanFindingLimit)
        budgetError('AF_FINDINGS_LIMIT', 'analyze');
    const reportFindings = findings.slice(0, scanFindingLimit), outputErrors = finalErrors(errors), partial = outputErrors.length > 0 || Boolean(signal?.aborted), score = scoreFindings(findings, analyzed.length, partial), threshold = request.failOn ?? 'high', thresholdExceeded = threshold !== 'none' && reportFindings.some(finding => finding.applicability !== 'inactive' && finding.confidence !== 'low' && severities.indexOf(finding.severity) >= severities.indexOf(threshold)), overrideState = services.configOverrides ?? { codexHome: process.env.CODEX_HOME !== undefined, claudeConfigDir: process.env.CLAUDE_CONFIG_DIR !== undefined }, limitations = [safe('Static local configuration analysis only'), ...(overrideState.codexHome ? [safe('Relocated Codex configuration was not assessed')] : []), ...(overrideState.claudeConfigDir ? [safe('Relocated Claude configuration was not assessed')] : [])];
    return { schemaVersion: '1.0.0', engineVersion: '0.2.0', rulesetVersion: '1.0.0', kind: 'scan', status: partial ? 'partial' : 'complete', scope: { project: 'PROJECT', userConfigs: Boolean(request.userConfigs), exclusions: [safe('Fixed exclusions were not assessed')] }, coverage: { eligibleFiles: candidates, analyzedFiles: analyzed.length, visitedEntries: visited, skippedByReason: walkResult.skipped, limitations }, sources: analyzed.map(item => ({ id: item.id, location: { sourceId: item.id, scope: item.scope, displayPath: safe(`source-${item.id.slice(1)}`) }, ...(item.kind ? { adapter: item.kind } : {}) })), agents: result.agents, mcpServers: result.mcpServers, capabilities: result.capabilities, findings: reportFindings, errors: outputErrors, score, thresholdExceeded, presentation: { minimumSeverity: request.minimumSeverity ?? 'info' } };
}
function failureReport(request) { return { schemaVersion: '1.0.0', engineVersion: '0.2.0', rulesetVersion: '1.0.0', kind: 'scan', status: 'partial', scope: { project: 'PROJECT', userConfigs: Boolean(request.userConfigs), exclusions: [] }, coverage: { eligibleFiles: 0, analyzedFiles: 0, visitedEntries: 0, skippedByReason: { root: 1 }, limitations: [safe('Requested root was rejected')] }, sources: [], agents: [], mcpServers: [], capabilities: [], findings: [], errors: [scanError('AF_ROOT_INVALID', 'discovery', 'fatal')], score: scoreFindings([], 0, true), thresholdExceeded: false, presentation: { minimumSeverity: request.minimumSeverity ?? 'info' } }; }
//# sourceMappingURL=index.js.map