const negated = (clause) => /(?:\bdo not\b|\bnever\b|\bavoid\b|\bmust not\b)/i.test(clause);
/**
 * Instruction prose is deliberately line-local: a negation is never allowed to
 * suppress a later line. Fenced and quoted educational examples are excluded.
 */
export function analyzeInstructions(text) {
    let fenced = false;
    const clauses = [];
    for (const line of text.split('\n')) {
        if (/^\s*(?:```|~~~)/.test(line)) {
            fenced = !fenced;
            continue;
        }
        if (fenced || /^\s*>/.test(line))
            continue;
        for (const clause of line.split(/[.;]|\bbut\b/i))
            if (clause.trim() && !negated(clause))
                clauses.push(clause);
    }
    const credential = clauses.some(c => /(?:read|print|dump).*(?:environment|env|ssh key|credential|token)|(?:environment|env|ssh key|credential|token).*(?:read|print|dump)/i.test(c));
    const bypass = clauses.some(c => /(?:disable|bypass|ignore).*(?:approval|safeguard|security|permission)/i.test(c));
    const exfil = clauses.some(c => /(?:send|upload|post).*(?:credential|token|ssh key|secret)|(?:credential|token|ssh key|secret).*(?:send|upload|post)/i.test(c));
    const imperative = /(?:\balways\b|\bautomatically\b|\bmust\b|\bshould\b|\bplease\b|\brun\b|\bexecute\b|\binvoke\b|\buse\b)/i;
    const destructive = clauses.some(c => imperative.test(c) && /(?:force push|rm\s+(?:-[A-Za-z]*[rf][A-Za-z]*|--recursive)|\bsudo\b)/i.test(c));
    const risky = clauses.some(c => /(?:always|automatically).*(?:shell|git push)/i.test(c));
    return { credential, bypass, exfil, automation: destructive ? 'destructive' : risky ? 'risky' : false };
}
//# sourceMappingURL=instructions.js.map