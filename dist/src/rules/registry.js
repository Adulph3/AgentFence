export const RULESET_VERSION = '1.0.0';
const tests = (id) => ({ positive: `catalog-${id}-positive`, negative: `catalog-${id}-negative`, adversarial: `catalog-${id}-adversarial`, redaction: `catalog-${id}-redaction` });
const docs = { mcp: 'https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices', npm: 'https://docs.npmjs.com/cli/v11/commands/npm-exec/', codex: 'https://developers.openai.com/codex/config-reference/', claude: 'https://code.claude.com/docs/en/settings', unicode: 'https://trojansource.codes/', owasp: 'https://owasp.org/www-community/attacks/Log_Injection' };
const decisions = {
    'AF-SECRET-001': 'High confidence for curated credential names; suffix-only names are medium; empty or unknown bindings are excluded.',
    'AF-SECRET-002': 'High confidence only for nonempty literals in credential-bearing fields; references and empty values are excluded.',
    'AF-SHELL-001': 'High confidence for an actual shell wrapper; direct argv data and quoted metacharacters are excluded.',
    'AF-SHELL-002': 'High confidence for parsed sudo execution; prose, pseudocode, and quoted echo data are excluded.',
    'AF-SHELL-003': 'High confidence for parsed recursive force deletion; root/home is critical, project cleanup medium, and quoted examples are excluded.',
    'AF-SHELL-004': 'High confidence for parsed shell chaining or substitution; direct argv and quoted separators are excluded.',
    'AF-SHELL-005': 'High confidence for configured git push; force is high, force-with-lease medium, and non-push git commands are excluded.',
    'AF-SUPPLY-001': 'High confidence for npx/npm-exec mutable selectors; exact semver selectors are excluded.',
    'AF-SUPPLY-002': 'High confidence inventory for every recognized npx/npm-exec selector; ordinary direct executables are excluded.',
    'AF-SUPPLY-003': 'High confidence for curl/wget piped to a recognized interpreter; downloader-to-file and quoted examples are excluded.',
    'AF-MCP-001': 'High confidence for valid stdio declarations; URL-only and malformed transport entries are excluded.',
    'AF-MCP-002': 'High confidence for valid HTTP/SSE declarations; local process declarations are excluded.',
    'AF-NET-001': 'High confidence for literal HTTP endpoints; HTTPS is excluded and loopback is informational.',
    'AF-MCP-003': 'Medium confidence for supported dynamic launcher, argument, environment, or input construction; literals are excluded.',
    'AF-PERM-001': 'High confidence only for fixed documented vendor bypass fields; arbitrary similarly named keys are excluded.',
    'AF-FS-001': 'High confidence only for recognized filesystem-server root arguments; unknown positional arguments are excluded.',
    'AF-PROMPT-001': 'Medium confidence for affirmative credential or environment-dump requests; negated and fenced teaching text is excluded.',
    'AF-PROMPT-002': 'Medium confidence for affirmative safeguard-bypass requests; negated and fenced teaching text is excluded.',
    'AF-PROMPT-003': 'Medium confidence when sensitive source and send/upload action share a clause; ordinary public output is excluded.',
    'AF-PROMPT-004': 'Medium confidence for affirmative risky automation; negated instruction text is excluded.',
    'AF-UNICODE-001': 'High confidence for bidi controls; ordinary Arabic and escaped textual notation are excluded.',
    'AF-UNICODE-002': 'High confidence for hidden controls; initial BOM is excluded and prose joiners are informational.',
    'AF-COMBO-001': 'Confidence is the minimum constituent confidence; different principals and inactive constituents are excluded.'
};
const rule = (id, title, category, defaultSeverity, milestone, recommendation, reference, acceptedFactKinds = ['field']) => ({ id, version: RULESET_VERSION, title, category, defaultSeverity, acceptedFactKinds, confidenceAndExclusions: decisions[id], recommendation, references: [reference], milestone, testIds: tests(id) });
export const RULE_DEFINITIONS = [
    rule('AF-SECRET-001', 'Sensitive environment binding', 'secrets', 'medium', 'M5', 'Forward only required scoped credentials', docs.codex, ['environment-binding']), rule('AF-SECRET-002', 'Literal credential-bearing configuration', 'secrets', 'high', 'M5', 'Remove literals from shared configuration', docs.codex, ['environment-binding', 'header']),
    rule('AF-SHELL-001', 'Shell wrapper declaration', 'shell', 'low', 'M7', 'Prefer an explicit executable and argument vector', docs.owasp, ['command']), rule('AF-SHELL-002', 'Elevated command declaration', 'shell', 'medium', 'M7', 'Remove elevation and use a least-privilege account', docs.owasp, ['command']), rule('AF-SHELL-003', 'Recursive force deletion declaration', 'shell', 'high', 'M7', 'Narrow explicit targets and require manual approval', docs.owasp, ['command']), rule('AF-SHELL-004', 'Composite shell execution declaration', 'shell', 'low', 'M7', 'Replace composite shell strings with fixed commands', docs.owasp, ['command']), rule('AF-SHELL-005', 'Git push automation declaration', 'shell', 'medium', 'M7', 'Require review and explicit approval before publishing changes', docs.owasp, ['command']),
    rule('AF-SUPPLY-001', 'Mutable package execution selector', 'supply-chain', 'medium', 'M7', 'Pin a direct package version', docs.npm, ['command']), rule('AF-SUPPLY-002', 'Temporary package runner declaration', 'supply-chain', 'info', 'M7', 'Prefer a reviewed installed dependency', docs.npm, ['command']), rule('AF-SUPPLY-003', 'Download-to-interpreter flow declaration', 'supply-chain', 'critical', 'M7', 'Fetch and verify separately without streaming execution', docs.npm, ['command']),
    rule('AF-MCP-001', 'Local process MCP server declaration', 'mcp', 'info', 'M6', 'Review executable identity and process privileges', docs.mcp, ['mcp-server']), rule('AF-MCP-002', 'Remote MCP endpoint declaration', 'mcp', 'info', 'M6', 'Review provider, data flow and authorization', docs.mcp, ['mcp-server']), rule('AF-NET-001', 'Plain HTTP MCP endpoint declaration', 'network', 'medium', 'M6', 'Prefer authenticated HTTPS', docs.mcp, ['endpoint']), rule('AF-MCP-003', 'Dynamic MCP construction declaration', 'mcp', 'medium', 'M6', 'Use explicit reviewed launch values', docs.mcp, ['mcp-server']), rule('AF-PERM-001', 'Broad approval bypass declaration', 'permissions', 'high', 'M7', 'Restore approval and narrow tool permissions', docs.claude, ['permission']), rule('AF-FS-001', 'Broad filesystem root declaration', 'filesystem', 'high', 'M6', 'Expose only required project subdirectories', docs.mcp, ['filesystem-root']),
    rule('AF-PROMPT-001', 'Instruction requests credential access', 'prompt-security', 'high', 'M7', 'Remove secret-access instruction', docs.owasp, ['instruction']), rule('AF-PROMPT-002', 'Instruction requests safeguard bypass', 'prompt-security', 'high', 'M7', 'Keep safeguards and explicit approvals', docs.owasp, ['instruction']), rule('AF-PROMPT-003', 'Instruction requests sensitive-data transmission', 'prompt-security', 'critical', 'M7', 'Remove exfiltration-like instruction', docs.owasp, ['instruction']), rule('AF-PROMPT-004', 'Instruction requests risky command automation', 'prompt-security', 'medium', 'M7', 'Make risky actions manual and scoped', docs.owasp, ['instruction']), rule('AF-UNICODE-001', 'Bidirectional control character', 'unicode', 'medium', 'M4', 'Remove unintended direction controls', docs.unicode, ['unicode']), rule('AF-UNICODE-002', 'Hidden format or control character', 'unicode', 'low', 'M4', 'Make unusual controls visible and retain only intentional language usage', docs.unicode, ['unicode']), rule('AF-COMBO-001', 'Same-principal capability combination', 'agent-config', 'high', 'M8', 'Separate capabilities and constrain egress', docs.mcp, ['combination'])
];
export const RULES = RULE_DEFINITIONS.map(rule => rule.id);
const categories = new Set(['secrets', 'shell', 'filesystem', 'network', 'mcp', 'agent-config', 'supply-chain', 'unicode', 'permissions', 'prompt-security']);
const referenceHosts = new Set(['modelcontextprotocol.io', 'docs.npmjs.com', 'developers.openai.com', 'code.claude.com', 'trojansource.codes', 'owasp.org']);
export function validateRuleRegistry(definitions = RULE_DEFINITIONS) { const ids = new Set(), decisionTexts = new Set(); for (const definition of definitions) {
    if (!/^AF-[A-Z]+-\d{3}$/.test(definition.id) || ids.has(definition.id))
        throw new Error('AF_RULE_REGISTRY_ID');
    ids.add(definition.id);
    if (definition.version !== RULESET_VERSION || !categories.has(definition.category) || !['M4', 'M5', 'M6', 'M7', 'M8'].includes(definition.milestone))
        throw new Error('AF_RULE_REGISTRY_METADATA');
    if (!definition.title || !definition.recommendation || !definition.confidenceAndExclusions || definition.acceptedFactKinds.length === 0 || Object.values(definition.testIds).some(id => !/^catalog-AF-[A-Z]+-\d{3}-(?:positive|negative|adversarial|redaction)$/.test(id)))
        throw new Error('AF_RULE_REGISTRY_TESTS');
    if (decisionTexts.has(definition.confidenceAndExclusions))
        throw new Error('AF_RULE_REGISTRY_DECISION');
    decisionTexts.add(definition.confidenceAndExclusions);
    for (const reference of definition.references) {
        let url;
        try {
            url = new URL(reference);
        }
        catch {
            throw new Error('AF_RULE_REGISTRY_REFERENCE');
        }
        if (url.protocol !== 'https:' || !referenceHosts.has(url.hostname) || url.username || url.password || url.search || url.hash)
            throw new Error('AF_RULE_REGISTRY_REFERENCE');
    }
} }
validateRuleRegistry();
export function ruleDefinition(id) { const definition = RULE_DEFINITIONS.find(rule => rule.id === id); if (!definition)
    throw new Error('AF_RULE_UNKNOWN'); return definition; }
//# sourceMappingURL=registry.js.map