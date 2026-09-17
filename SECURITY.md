# Security policy

## Supported versions

| Version | Status | Node.js |
| --- | --- | --- |
| 0.2.x | Supported | 22 or 24 |
| 0.1.x | Previous GitHub-only release | 24 |

The current stable package is `@adulph3/agentfence`. The unscoped npm package `agentfence` is unrelated to this repository.

## Report a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/Adulph3/AgentFence/security/advisories/new) for suspected vulnerabilities. Do not open a public issue for an unfixed security defect.

Include only what is needed to reproduce the problem:

- the AgentFence and Node.js versions;
- the operating system;
- the affected command or API surface;
- expected and observed behavior; and
- a minimal synthetic reproduction.

Do not include real credentials, raw reports, private configuration, private paths, customer data, or a weaponized exploit chain. Use synthetic values and redact unrelated details. There is no guaranteed response SLA.

## Security scope

Useful reports include unintended execution, application-initiated network activity during `scan` or `doctor`, scope escape, unsafe output, secret disclosure, parser bypass, terminal injection, report overwrite, or a result that conceals materially incomplete coverage.

AgentFence is static analysis. A missed unsupported format, a false positive without security impact, or the absence of a runtime-enforcement feature may be better suited to a regular issue. When uncertain, report privately.

## Disclosure

Please allow time to investigate and prepare a fix before public disclosure. Scanner output is an observation of supported configuration, not an incident verdict or a guarantee that a system is secure.
