export const sensitiveNames = new Set(['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN', 'AWS_SECRET_ACCESS_KEY', 'WEB_EXT_API_SECRET']);
const sensitiveSuffix = (name) => /(?:TOKEN|SECRET|API_KEY|PASSWORD|CREDENTIAL)$/i.test(name);
const reference = (value) => /^(?:\$\{(?:env:)?[^}]+\}|\{\{[^}]+\}\})$/.test(value);
const nameFact = (name, ordinal, mode, credentialField) => { const known = sensitiveNames.has(name), suffix = sensitiveSuffix(name); return { ordinal, ...(known ? { safeName: name } : {}), nameClass: known ? 'known' : suffix ? 'sensitive-suffix' : 'other', mode, credentialField: credentialField && (known || suffix) }; };
export function classifyEnvBinding(name, value, ordinal) { const mode = typeof value === 'string' ? (value === '' ? 'unknown' : reference(value) ? 'reference' : 'literal') : value && typeof value === 'object' ? 'reference' : 'unknown'; return nameFact(name, ordinal, mode, true); }
export function classifyEnvNameReference(name, ordinal) { return nameFact(name, ordinal, 'reference', true); }
/** A credential-bearing header has no exportable input name, but its value is still classified safely. */
export function classifyCredentialHeader(value, ordinal) { return { ordinal, nameClass: 'other', mode: value === '' ? 'unknown' : reference(value) ? 'reference' : 'literal', credentialField: true }; }
export function envRisk(name, value) {
    if (typeof value !== 'string' || value.length === 0)
        return 'none';
    if (/^(\$\{|\{\{)/.test(value))
        return sensitiveNames.has(name) ? 'recognized' : 'none';
    if (sensitiveNames.has(name))
        return 'literal';
    return sensitiveSuffix(name) ? 'suffix' : 'none';
}
//# sourceMappingURL=env.js.map