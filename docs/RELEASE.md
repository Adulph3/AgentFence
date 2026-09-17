# Release readiness

v0.2.0 is the current stable [GitHub Release](https://github.com/Adulph3/AgentFence/releases/tag/v0.2.0) and npm package [`@adulph3/agentfence`](https://www.npmjs.com/package/@adulph3/agentfence/v/0.2.0). Its executable remains `agentfence`, and it supports Node.js 22 and 24. The unrelated unscoped npm package `agentfence` is not this project.

The release commit is `36d1a7f4ad938b57f52db101ee84a77d891f489c`. The GitHub release artifact is `adulph3-agentfence-0.2.0.tgz` with SHA-256 `ac7c7bbcedcb07b1a290229ec417a353ce006f88d1efbd81f3184ecb30bd7429`. Hosted CI passed on Ubuntu, macOS, and Windows for Node.js 22 and 24, and CodeQL passed for the release.

v0.1.0 remains available as the previous [GitHub-only release](https://github.com/Adulph3/AgentFence/releases/tag/v0.1.0). Its artifact `agentfence-0.1.0.tgz` has SHA-256 `4d5271aad1a7f56f66555752d6a3184643cac0213a712079af33d95709db278b` and requires Node.js 24.

A Linux network-denied packaged runtime trace and actual Windows output-parent ACL validation remain external evidence gaps. These limits do not change the verified application-level no-network tests or hosted platform results, and they must not be presented as stronger evidence than they are.

Local release checklist: run typecheck, boundary/package checks, full tests,
schema/CLI examples, deterministic dogfood, benchmark, and a dry-run package;
verify the fixed rule registry and report schemas are packaged; review direct and
transitive dependencies, licenses and lifecycle scripts; record exact evidence and
the master-plan checksum. Treat an audit as evidence only for the reviewed cache or
network state in which it ran. Future tags, artifacts, npm publication, and release
notes still require their own explicit authorization and verification.
