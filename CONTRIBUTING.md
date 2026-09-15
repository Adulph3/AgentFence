# Contributing

Use only synthetic offline fixtures. Review every dependency and preserve the zero-network/no-execution and safe-output invariants. Run `npm ci --ignore-scripts`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and package checks. Rule changes require positive, negative, adversarial, redaction, and deterministic tests.

Do not add runtime rule loading, plugins, vendor SDKs, remote fixtures, real
credentials, or input-controlled imports. Keep raw parsed data inside parsing and
analysis boundaries; public DTOs and test assertions must use safe projections.
For a rule change, update the compiled registry metadata, its fixed remediation and
bundled HTTPS reference, then add executable positive, negative, adversarial and
redaction coverage. Review dependency purpose, version, license, lifecycle scripts
and transitive impact before changing the lockfile. Do not weaken a test solely to
make a gate pass.
