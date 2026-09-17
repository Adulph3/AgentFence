## Summary

Describe the problem and the smallest change that solves it.

## Security and compatibility impact

- Does this change discovery, parsing, adapters, rules, scoring, schemas, reports, dependencies, or public APIs?
- Which documented vendor behavior or project invariant supports the change?
- What limitations remain?

## Validation

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run test:coverage` when security/scoring behavior changes
- [ ] `npm run build`
- [ ] `npm pack --dry-run --ignore-scripts` when package contents change
- [ ] Synthetic positive, negative, adversarial, and redaction cases were added where applicable

## Safety checklist

- [ ] Scanned content is never executed or imported
- [ ] `scan` and `doctor` initiate no application network activity
- [ ] No telemetry, backend, remote AI, or live MCP access was added
- [ ] Default scanning remains read-only and bounded
- [ ] Output contains no raw secrets, commands, URLs, parser errors, names, or paths
- [ ] This PR contains no credentials, private configuration, raw private reports, or machine-specific data
