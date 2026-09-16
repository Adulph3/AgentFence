import { safeJson } from '../security/safe.js';
import { LIMITS } from '../application/budget.js';
export function jsonReport(report) { const output = safeJson(report) + '\n'; if (Buffer.byteLength(output) > LIMITS.outputBytes)
    throw new Error('AF_OUTPUT_LIMIT'); return output; }
export function jsonFailure(code) { return safeJson({ kind: 'failure', schemaVersion: '1.0.0', engineVersion: '0.2.0', errors: [{ code, message: 'Scanner request failed' }] }) + '\n'; }
//# sourceMappingURL=json.js.map