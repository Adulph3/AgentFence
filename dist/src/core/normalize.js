export function normalizeFindings(findings) { const m = new Map(); for (const f of findings)
    if (!m.has(f.id))
        m.set(f.id, f); const rank = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }; return [...m.values()].sort((a, b) => rank[b.severity] - rank[a.severity] || a.location.sourceId.localeCompare(b.location.sourceId) || a.ruleId.localeCompare(b.ruleId) || (a.principalId ?? '').localeCompare(b.principalId ?? '') || a.id.localeCompare(b.id)); }
//# sourceMappingURL=normalize.js.map