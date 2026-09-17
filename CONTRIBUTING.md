# Contributing

Thanks for helping improve AgentFence. Keep changes focused, reproducible, and grounded in observable configuration behavior.

## Before you start

- Read `AGENTS.md`, `AGENTFENCE_MASTER_PLAN.md`, and `docs/PROGRESS.md`.
- Use Node.js 22 or 24; Node.js 24 is recommended.
- Use only synthetic offline fixtures. Never commit credentials, personal configuration, raw private reports, or machine-specific paths.
- For a suspected vulnerability, use [private vulnerability reporting](https://github.com/Adulph3/AgentFence/security/advisories/new) instead of a public issue.

## Development setup

```bash
git clone https://github.com/Adulph3/AgentFence.git
cd AgentFence
npm ci --ignore-scripts
```

Run the quality gates before opening a pull request:

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm pack --dry-run --ignore-scripts
```

Do not weaken a test to make a gate pass. Fix the defect or document a genuine platform/evidence limitation.

## Project invariants

Every change must preserve:

- no execution of scanned instructions, hooks, commands, packages, or configuration;
- no application-initiated runtime network access, telemetry, backend, or remote AI;
- read-only scanning unless the operator explicitly requests a new report file;
- bounded acquisition and parsing;
- deterministic analysis for identical complete inputs; and
- safe output that does not reproduce raw secrets, commands, URLs, parser errors, names, or paths.

Do not add runtime rule loading, plugins, vendor SDKs, remote fixtures, input-controlled imports, or a redaction bypass.

## Rule and adapter changes

A detector change needs positive, negative, adversarial, redaction, and deterministic coverage. Update the compiled registry metadata, fixed remediation, bundled HTTPS reference, and detector documentation together.

An adapter change must be based on documented vendor semantics and include bounded compatibility fixtures. Unknown behavior should remain an explicit coverage limitation rather than a guessed effective configuration.

## Dependency changes

Explain the dependency's purpose and review its exact version, license, lifecycle scripts, transitive graph, runtime capabilities, and effect on the no-network/no-execution boundary. Keep the lockfile and `THIRD_PARTY_NOTICES.md` consistent.

## Pull requests

Keep pull requests small enough to review. Describe:

- the problem and intended behavior;
- security-boundary or schema impact;
- tests and platforms exercised; and
- remaining limitations or follow-up work.

Do not paste secret-bearing output into the PR. A maintainer may request additional platform or adversarial coverage for security-sensitive changes.
