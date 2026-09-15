import { escapeTerminal } from '../security/safe.js';
const rank = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
const ordinal = (sourceId) => Number(sourceId.slice(1)) || 0;
const coordinate = (finding) => [finding.location.line ?? 0, finding.location.column ?? 0, finding.location.endLine ?? 0, finding.location.endColumn ?? 0];
const compareCoordinates = (left, right) => { for (let index = 0; index < left.length; index++) {
    const difference = left[index] - (right[index]);
    if (difference)
        return difference;
} return 0; };
const order = (a, b) => rank[b.severity] - rank[a.severity] || ordinal(a.location.sourceId) - ordinal(b.location.sourceId) || compareCoordinates(coordinate(a), coordinate(b)) || a.ruleId.localeCompare(b.ruleId) || a.id.localeCompare(b.id);
const paint = (severity, label, color) => !color ? label : `\u001b[${severity === 'critical' || severity === 'high' ? 31 : severity === 'medium' ? 33 : 36}m${label}\u001b[0m`;
const text = (value) => escapeTerminal(value);
/** Terminal output consumes only already-safe DTO fields and escapes every display field again. */
export function terminalReport(report, color = false) {
    const visible = [...report.findings].filter(finding => rank[finding.severity] >= rank[report.presentation.minimumSeverity]).sort(order), highest = visible[0]?.severity ?? report.findings.slice().sort(order)[0]?.severity;
    const lines = [`AgentFence ${text(report.status)} scan`, `Coverage: ${report.coverage.analyzedFiles}/${report.coverage.eligibleFiles} supported files; ${report.coverage.visitedEntries} entries`];
    lines.push('Agent configuration inventory:');
    if (report.agents.length === 0)
        lines.push('  None detected');
    else
        for (const agent of [...report.agents].sort((a, b) => a.id.localeCompare(b.id)))
            lines.push(`  ${text(agent.id)} ${text(agent.kind)} ${text(agent.detection)} sources ${agent.sources.map(text).join(',')}`);
    if (report.score.value === null)
        lines.push('No supported configuration assessed');
    else
        lines.push(`Score: ${report.score.value} (${text(report.score.label)})${report.score.provisional ? ' provisional' : ''}; highest severity: ${highest ? text(highest) : 'none'}`);
    if (report.score.value !== null && visible.length === 0)
        lines.push('No findings in assessed scope');
    lines.push(`Findings: ${visible.length}`);
    for (const finding of visible) {
        const coordinates = typeof finding.location.line === 'number' && typeof finding.location.column === 'number' ? `:${finding.location.line}:${finding.location.column}` : '';
        const location = `${text(finding.location.sourceId)}${coordinates}`;
        lines.push(`${paint(finding.severity, finding.severity.toUpperCase(), color)} ${text(finding.ruleId)} ${location} confidence ${text(finding.confidence)} applicability ${text(finding.applicability)}`);
        lines.push(`  ${text(finding.description)}`);
        lines.push(`  Recommendation: ${text(finding.recommendation)}`);
    }
    lines.push('Errors and limitations:');
    if (report.errors.length === 0 && report.coverage.limitations.length === 0)
        lines.push('  None');
    else {
        for (const error of report.errors)
            lines.push(`  ${text(error.code)} ${text(error.message)}`);
        for (const limitation of report.coverage.limitations)
            lines.push(`  ${text(limitation)}`);
    }
    lines.push(`Summary: ${visible.length} visible findings; ${report.findings.length} total findings; ${report.errors.length} errors`);
    return lines.join('\n') + '\n';
}
//# sourceMappingURL=terminal.js.map