import { Worker } from 'node:worker_threads';
import { LIMITS } from '../application/budget.js';
const kinds = new Set(['json', 'jsonc', 'toml', 'markdown']);
const safe = (value, max = 480) => typeof value === 'string' && value.length <= max && /^[\x20-\x7e]*$/.test(value);
const id = (value, pattern) => typeof value === 'string' && pattern.test(value);
const exact = (value, required, optional = []) => { if (!value || typeof value !== 'object' || Array.isArray(value))
    return false; const keys = Object.keys(value); return required.every(key => Object.hasOwn(value, key)) && keys.every(key => required.includes(key) || optional.includes(key)); };
const array = (value, max, check) => Array.isArray(value) && value.length <= max && value.every(check);
const loc = (value) => exact(value, ['sourceId', 'scope', 'displayPath'], ['line', 'column', 'endLine', 'endColumn', 'field']) && id(value.sourceId, /^S[0-9]+$/) && ['project', 'user'].includes(value.scope) && safe(value.displayPath) && ['line', 'column', 'endLine', 'endColumn'].every(key => value[key] === undefined || (Number.isSafeInteger(value[key]) && value[key] >= 1)) && (value.field === undefined || safe(value.field));
const evidence = (value) => exact(value, ['kind', 'summary', 'factIds'], ['knownEnvNames', 'codePoints']) && ['field', 'token-pattern', 'instruction-pattern', 'unicode', 'combination'].includes(value.kind) && safe(value.summary) && array(value.factIds, 10_000, item => id(item, /^F-[a-f0-9]{16}$/)) && (value.knownEnvNames === undefined || array(value.knownEnvNames, 256, item => safe(item))) && (value.codePoints === undefined || array(value.codePoints, 256, item => safe(item) && /^U\+[0-9A-F]{4,6}$/.test(item)));
const finding = (value) => exact(value, ['id', 'ruleId', 'ruleVersion', 'title', 'severity', 'category', 'description', 'evidence', 'location', 'relatedLocations', 'recommendation', 'confidence', 'applicability', 'agentIds', 'riskKey', 'references', 'relatedFindingIds'], ['principalId']) && id(value.id, /^[a-f0-9]{16}$/) && id(value.ruleId, /^AF-[A-Z-]+-[0-9]{3}$/) && value.ruleVersion === '1.0.0' && safe(value.title) && ['info', 'low', 'medium', 'high', 'critical'].includes(value.severity) && safe(value.description) && evidence(value.evidence) && loc(value.location) && array(value.relatedLocations, 256, loc) && safe(value.recommendation) && ['high', 'medium', 'low'].includes(value.confidence) && ['potential', 'inactive', 'unknown'].includes(value.applicability) && array(value.agentIds, 256, item => id(item, /^A-[a-z-]+-S[0-9]+$/)) && (value.principalId === undefined || id(value.principalId, /^[A-Za-z0-9:_-]{1,128}$/)) && id(value.riskKey, /^[A-Za-z0-9:_-]{1,240}$/) && array(value.references, 64, item => typeof item === 'string' && /^https:\/\//.test(item)) && array(value.relatedFindingIds, 10_000, item => id(item, /^[a-f0-9]{16}$/));
const agent = (value) => exact(value, ['id', 'kind', 'detection', 'sources', 'adapterVersion', 'runtimeVersion', 'effectiveState']) && id(value.id, /^A-[a-z-]+-S[0-9]+$/) && ['codex', 'claude-code', 'cursor', 'kiro', 'vscode', 'generic-mcp'].includes(value.kind) && ['confirmed-config', 'possible'].includes(value.detection) && array(value.sources, 1000, item => id(item, /^S[0-9]+$/)) && value.adapterVersion === '1.0.0' && value.runtimeVersion === 'unknown' && value.effectiveState === 'unverified';
const capability = (value) => exact(value, ['id', 'principalId', 'kind', 'basis', 'confidence', 'applicability', 'sourceIds', 'constraints']) && id(value.id, /^[a-f0-9]{16}$/) && id(value.principalId, /^[A-Za-z0-9:_-]{1,128}$/) && ['process-launch', 'shell', 'network', 'sensitive-env', 'filesystem-read', 'filesystem-write', 'approval-bypass'].includes(value.kind) && ['explicit-config', 'recognized-command', 'text-request', 'inferred'].includes(value.basis) && ['high', 'medium', 'low'].includes(value.confidence) && ['potential', 'inactive', 'unknown'].includes(value.applicability) && array(value.sourceIds, 1000, item => id(item, /^S[0-9]+$/)) && array(value.constraints, 256, item => safe(item));
const server = (value) => exact(value, ['id', 'agentId', 'principalId', 'location', 'transport', 'enabled', 'launcher', 'packageSelector', 'envBindings', 'roots', 'capabilityIds'], ['endpoint']) && id(value.id, /^[a-f0-9]{16}$/) && id(value.agentId, /^A-[a-z-]+-S[0-9]+$/) && id(value.principalId, /^[A-Za-z0-9:_-]{1,128}$/) && loc(value.location) && ['stdio', 'http', 'sse', 'unknown'].includes(value.transport) && ['yes', 'no', 'unknown'].includes(value.enabled) && ['direct', 'shell', 'package-runner', 'unknown'].includes(value.launcher) && ['exact', 'mutable', 'absent', 'unresolved'].includes(value.packageSelector) && array(value.envBindings, 256, item => exact(item, ['name', 'mode']) && safe(item.name) && ['literal', 'reference', 'unknown'].includes(item.mode)) && array(value.roots, 256, item => exact(item, ['class']) && ['project', 'home', 'filesystem', 'sensitive', 'other', 'unknown'].includes(item.class)) && array(value.capabilityIds, 1000, item => id(item, /^[a-f0-9]{16}$/)) && (value.endpoint === undefined || (exact(value.endpoint, ['scheme', 'hostClass']) && ['https', 'http', 'other'].includes(value.endpoint.scheme) && ['loopback-literal', 'private-literal', 'other', 'unresolved'].includes(value.endpoint.hostClass)));
const error = (value) => exact(value, ['code', 'stage', 'message', 'effect', 'retryable'], ['sourceId']) && id(value.code, /^AF_[A-Z0-9_]+$/) && ['discovery', 'read', 'parse', 'analyze', 'report'].includes(value.stage) && safe(value.message) && ['partial', 'fatal'].includes(value.effect) && typeof value.retryable === 'boolean' && (value.sourceId === undefined || id(value.sourceId, /^S[0-9]+$/));
const kiroCorrelation = (value) => exact(value, ['serverId', 'key']) && id(value.serverId, /^[a-f0-9]{16}$/) && id(value.key, /^[a-f0-9]{64}$/);
const analyzeFields = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value)) && array(value.findings, LIMITS.findings, finding) && array(value.agents, 1000, agent) && array(value.mcpServers, 1000, server) && array(value.capabilities, 10_000, capability) && array(value.errors, 10_000, error);
/** Exact safe parent boundary for worker analysis replies. */
export const validateAnalyzeResultDto = (value) => exact(value, ['findings', 'agents', 'mcpServers', 'capabilities', 'errors']) && analyzeFields(value);
const validateWorkerAnalyzeResultDto = (value) => exact(value, ['findings', 'agents', 'mcpServers', 'capabilities', 'errors'], ['kiroCorrelations']) && analyzeFields(value) && (value.kiroCorrelations === undefined || array(value.kiroCorrelations, 1_000, kiroCorrelation));
function valid(value) { if (!exact(value, ['type', 'id', 'ok'], ['value', 'code', 'analysis']) || value.type !== 'result' || !Number.isSafeInteger(value.id) || typeof value.ok !== 'boolean')
    return false; return !value.ok ? (typeof value.code === 'string' && /^AF_[A-Z0-9_]+$/.test(value.code)) : value.analysis === true ? validateWorkerAnalyzeResultDto(value.value) : true; }
export class ParserPool {
    #workers = [];
    #pending = new Map();
    #next = 1;
    #closed = false;
    #make() { const worker = new Worker(new URL('./worker-thread.js', import.meta.url), { resourceLimits: { maxOldGenerationSizeMb: 64 } }); worker.on('message', (message) => this.#message(worker, message)); worker.on('error', () => this.#fail(worker, 'AF_PARSER_WORKER')); worker.on('exit', code => { if (code !== 0)
        this.#fail(worker, 'AF_PARSER_WORKER'); }); this.#workers.push(worker); return worker; }
    #message(worker, message) { if (!valid(message)) {
        this.#fail(worker, 'AF_PARSER_MESSAGE');
        return;
    } const pending = this.#pending.get(message.id); if (!pending || pending.worker !== worker)
        return; clearTimeout(pending.timer); this.#pending.delete(message.id); message.ok ? pending.resolve(message.value) : pending.reject(new Error((message.code ?? 'AF_PARSE_FAILED').replace(/[^A-Z0-9_]/g, ''))); }
    #fail(worker, code) { this.#workers = this.#workers.filter(item => item !== worker); for (const [id, pending] of this.#pending)
        if (pending.worker === worker) {
            clearTimeout(pending.timer);
            this.#pending.delete(id);
            pending.reject(new Error(code));
        } void worker.terminate().catch(() => undefined); }
    parse(kind, text, signal) { return this.#request({ kind, text }, signal); }
    /** Internal orchestration may lower this task's finding allowance; it can never raise it. */
    analyze(source, signal, findingLimit, kiroCorrelationSecret) { const limit = Number.isSafeInteger(findingLimit) ? Math.max(0, Math.min(LIMITS.findings, findingLimit)) : undefined; const secret = typeof kiroCorrelationSecret === 'string' && /^[a-f0-9]{64}$/.test(kiroCorrelationSecret) ? kiroCorrelationSecret : undefined; return this.#request({ source, ...(limit === undefined ? {} : { findingLimit: limit }), ...(secret ? { kiroCorrelationSecret: secret } : {}) }, signal); }
    #request(payload, signal) { if (this.#closed)
        return Promise.reject(new Error('AF_PARSE_REQUEST')); if (signal?.aborted)
        return Promise.reject(new Error('AF_INTERRUPTED')); const worker = this.#workers.length < LIMITS.parserWorkers ? this.#make() : this.#workers[0], id = this.#next++; return new Promise((resolve, reject) => { const timer = setTimeout(() => this.#fail(worker, 'AF_PARSE_TIMEOUT'), LIMITS.taskMs); const abort = () => { const pending = this.#pending.get(id); if (pending) {
        clearTimeout(pending.timer);
        this.#pending.delete(id);
        reject(new Error('AF_INTERRUPTED'));
    } }; signal?.addEventListener('abort', abort, { once: true }); this.#pending.set(id, { resolve: value => { signal?.removeEventListener('abort', abort); resolve(value); }, reject: error => { signal?.removeEventListener('abort', abort); reject(error); }, timer, worker }); worker.postMessage({ type: 'parse', id, ...payload }); }); }
    async close() { if (this.#closed)
        return; this.#closed = true; for (const [id, pending] of this.#pending) {
        clearTimeout(pending.timer);
        this.#pending.delete(id);
        pending.reject(new Error('AF_PARSER_CLOSED'));
    } await Promise.all(this.#workers.map(worker => worker.terminate())); this.#workers = []; }
}
//# sourceMappingURL=pool.js.map