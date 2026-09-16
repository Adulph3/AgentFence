# Security policy

AgentFence v0.1.0 is published on GitHub Releases. v0.2.0 is a local distribution candidate, not a published release. Do not place credentials, raw reports, private paths, or exploit payloads in public issues. Report suspected vulnerabilities through [GitHub private vulnerability reporting](https://github.com/Adulph3/AgentFence/security/advisories/new). Scanner reports are static observations, not incident verdicts.

If you discover a suspected defect, retain only the minimum synthetic reproduction
needed to explain it and avoid publishing scanned configuration, secret values,
machine paths, or an exploit chain. There is intentionally no claimed response SLA.
The published v0.1.0 GitHub artifact supports Node 24. The v0.2.0 local candidate targets Node 22 and 24 under the chosen npm name `@adulph3/agentfence`, with the `agentfence` executable. This repository has not published to npm. The unrelated unscoped npm package `agentfence` is not this project; npm publication and other runtimes are not yet a supported public distribution claim.
