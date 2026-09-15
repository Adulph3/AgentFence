import { safe } from './safe.js';
export function scanError(code, stage, effect, sourceId) {
    return { code, stage, effect, retryable: false, ...(sourceId ? { sourceId } : {}), message: safe(`Scanner recorded ${code.replace(/[^A-Z0-9_-]/g, '')}`) };
}
//# sourceMappingURL=errors.js.map