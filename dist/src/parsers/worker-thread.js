import { parentPort } from 'node:worker_threads';
import { parseBounded } from './worker.js';
import { analyzeSources, mergeAnalysisResults } from '../core/index.js';
import { kiroServerCorrelations } from '../adapters/pipeline.js';
import { boundedUnicodeFindings } from '../rules/unicode.js';
import { opaque } from '../security/safe.js';
import { scanError } from '../security/errors.js';
import { LIMITS } from '../application/budget.js';
const kinds = new Set(['json', 'jsonc', 'toml', 'markdown']);
const findingLimit = (value) => Number.isSafeInteger(value) ? Math.max(0, Math.min(LIMITS.findings, value)) : LIMITS.findings;
const unicodeBeforeParse = (source, code, limit) => {
    const unicode = boundedUnicodeFindings(source.content, { sourceId: source.id, scope: source.scope, displayPath: opaque('source', Number(source.id.slice(1)) || 0) }, limit);
    return { findings: unicode.findings, agents: [], mcpServers: [], capabilities: [], errors: [scanError(code, 'parse', 'partial', source.id), ...(unicode.truncated ? [scanError('AF_REPORT_LIMIT', 'analyze', 'partial', source.id), scanError('AF_FINDINGS_LIMIT', 'analyze', 'partial', source.id)] : [])] };
};
parentPort?.on('message', (message) => {
    const m = message && typeof message === 'object' ? message : undefined;
    if (!m || m.type !== 'parse' || !Number.isSafeInteger(m.id)) {
        parentPort?.postMessage({ type: 'result', id: 0, ok: false, code: 'AF_PARSER_MESSAGE' });
        return;
    }
    try {
        if (m.source && typeof m.source === 'object') {
            const source = m.source;
            if (typeof source.content !== 'string' || typeof source.parseKind !== 'string' || !kinds.has(source.parseKind))
                throw new Error('AF_PARSER_MESSAGE');
            if (m.findingLimit !== undefined && (!Number.isSafeInteger(m.findingLimit) || m.findingLimit < 0 || m.findingLimit > LIMITS.findings))
                throw new Error('AF_PARSER_MESSAGE');
            if (m.kiroCorrelationSecret !== undefined && (typeof m.kiroCorrelationSecret !== 'string' || !/^[a-f0-9]{64}$/.test(m.kiroCorrelationSecret)))
                throw new Error('AF_PARSER_MESSAGE');
            const limit = findingLimit(m.findingLimit);
            try {
                const parsed = parseBounded(source.parseKind, source.content);
                const analyzed = { ...source, parsed }, result = analyzeSources([analyzed], limit), kiroCorrelations = m.kiroCorrelationSecret ? kiroServerCorrelations(analyzed, result, m.kiroCorrelationSecret) : [];
                parentPort?.postMessage({ type: 'result', id: m.id, ok: true, analysis: true, value: { ...result, ...(kiroCorrelations.length ? { kiroCorrelations } : {}) } });
            }
            catch (error) {
                const code = error instanceof Error && /^AF_/.test(error.message) ? error.message : 'AF_PARSE_FAILED';
                // Unicode evidence is independent of structural syntax and must survive a
                // hostile malformed payload without exposing any raw surrounding text.
                parentPort?.postMessage({ type: 'result', id: m.id, ok: true, analysis: true, value: mergeAnalysisResults([unicodeBeforeParse(source, code, limit)], limit) });
            }
            return;
        }
        if (typeof m.kind !== 'string' || typeof m.text !== 'string' || !kinds.has(m.kind))
            throw new Error('AF_PARSER_MESSAGE');
        parentPort?.postMessage({ type: 'result', id: m.id, ok: true, value: parseBounded(m.kind, m.text) });
    }
    catch (error) {
        const code = error instanceof Error && /^AF_/.test(error.message) ? error.message : 'AF_PARSE_FAILED';
        parentPort?.postMessage({ type: 'result', id: m.id, ok: false, code });
    }
});
//# sourceMappingURL=worker-thread.js.map