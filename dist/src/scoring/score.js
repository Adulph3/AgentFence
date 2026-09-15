import { safe } from '../security/safe.js';
const weights = { info: 0, low: 2, medium: 6, high: 15, critical: 30 };
const caps = { secrets: 30, shell: 30, filesystem: 25, network: 15, mcp: 10, 'agent-config': 25, 'supply-chain': 40, unicode: 10, permissions: 25, 'prompt-security': 35 };
const categories = Object.keys(caps);
export function scoreFindings(findings, analyzedFiles = 1, partial = false) {
    if (analyzedFiles === 0)
        return { modelVersion: '1.0.0', value: null, label: 'not-assessed', provisional: partial, categories: [], groups: [], interpretation: safe('No supported configuration assessed') };
    const groups = new Map();
    for (const f of findings) {
        if (f.applicability === 'inactive' || f.confidence === 'low')
            continue;
        const value = weights[f.severity] * (f.confidence === 'high' ? 1 : .5);
        const old = groups.get(f.riskKey);
        if (!old || value > old.value)
            groups.set(f.riskKey, { category: f.category, value, ids: [f.id] });
        else if (value === old.value)
            old.ids.push(f.id);
    }
    const raw = new Map(categories.map(c => [c, 0]));
    for (const g of groups.values())
        raw.set(g.category, (raw.get(g.category) ?? 0) + g.value);
    const resultCategories = categories.map(category => ({ category, raw: raw.get(category) ?? 0, cap: caps[category], deducted: Math.min(caps[category], raw.get(category) ?? 0) }));
    const value = Math.max(0, 100 - Math.ceil(resultCategories.reduce((n, c) => n + c.deducted, 0)));
    const label = value >= 95 ? 'few-observed' : value >= 80 ? 'low' : value >= 60 ? 'moderate' : value >= 30 ? 'high' : 'critical';
    return { modelVersion: '1.0.0', value, label, provisional: partial, categories: resultCategories, groups: [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([riskKey, g]) => ({ riskKey, findingIds: [...new Set(g.ids)].sort(), deducted: g.value })), interpretation: safe(partial ? 'Observed-risk score is provisional because coverage is partial' : 'Observed configuration risk; not a security certification') };
}
//# sourceMappingURL=score.js.map