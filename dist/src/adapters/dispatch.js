import { adaptCodex } from './codex.js';
import { adaptClaude } from './claude.js';
import { adaptCursor } from './cursor.js';
import { adaptKiro } from './kiro.js';
import { adaptVscode } from './vscode.js';
import { adaptGenericMcp } from './mcp.js';
const result = (r) => r;
export function extractAdapterFacts(source, parsed, kiroCorrelationSecret) { switch (source.kind) {
    case 'codex': return result(adaptCodex(source, parsed));
    case 'claude-code': return result(adaptClaude(source, parsed));
    case 'cursor': return result(adaptCursor(source, parsed));
    case 'kiro': return result(adaptKiro(source, parsed, kiroCorrelationSecret));
    case 'vscode': return result(adaptVscode(source, parsed));
    case 'generic-mcp': return result(adaptGenericMcp(source, parsed));
    default: return { recognized: false, envelopeValid: false, facts: [], diagnostics: [], hooks: [], approvals: [] };
} }
//# sourceMappingURL=dispatch.js.map