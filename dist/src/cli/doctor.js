import { safe, safeJson } from '../security/safe.js';
import { scoreFindings } from '../scoring/score.js';
const adapterKinds = ['codex', 'claude-code', 'cursor', 'kiro', 'vscode', 'generic-mcp'];
const pass = (test) => { try {
    return test();
}
catch {
    return false;
} };
const defaultEscape = () => safe('\u001b]52;x\u0007') === '\\u001B]52;x\\u0007';
const defaultScore = () => scoreFindings([], 0).value === null;
/** Pure, fixed-surface health report: it deliberately performs no discovery or probes. */
export function doctorReport(services = {}) {
    const escapePass = pass(services.escapeSelfTest ?? defaultEscape), scorePass = pass(services.scoreSelfTest ?? defaultScore);
    return { schemaVersion: '1.0.0', engineVersion: '0.1.0', rulesetVersion: '1.0.0', kind: 'doctor', runtimeSupported: (services.runtimeVersion ?? process.versions.node).split('.')[0] === '24', platform: services.platform ?? process.platform, architecture: services.architecture ?? process.arch, adapters: adapterKinds.map(kind => ({ kind, adapterVersion: '1.0.0' })), checks: [{ id: 'escape', state: escapePass ? 'pass' : 'fail', message: safe('In-memory safe-output self-test') }, { id: 'score', state: scorePass ? 'pass' : 'fail', message: safe('In-memory scoring self-test') }], overrides: services.overrides ?? { codexHome: process.env.CODEX_HOME !== undefined, claudeConfigDir: process.env.CLAUDE_CONFIG_DIR !== undefined } };
}
const plain = (report) => `AgentFence doctor\nRuntime supported: ${report.runtimeSupported ? 'yes' : 'no'}\nSelf-tests: ${report.checks.every(check => check.state === 'pass') ? 'pass' : 'fail'}\nAdapters: ${report.adapters.map(adapter => `${adapter.kind}@${adapter.adapterVersion}`).join(', ')}\n`;
export function runDoctor(json, services = {}) {
    const report = doctorReport(services), healthy = report.runtimeSupported && report.checks.every(check => check.state === 'pass');
    return { output: json ? safeJson(report) + '\n' : plain(report), exitCode: healthy ? 0 : 2 };
}
/** Legacy rendering interface retained for existing consumers. */
export function doctor(json) { return runDoctor(json).output; }
//# sourceMappingURL=doctor.js.map