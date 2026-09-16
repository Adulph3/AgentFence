# Release readiness

v0.1.0 is published as a verified [GitHub Release](https://github.com/Adulph3/AgentFence/releases/tag/v0.1.0). Its sole official asset is `agentfence-0.1.0.tgz` (SHA-256 `4d5271aad1a7f56f66555752d6a3184643cac0213a712079af33d95709db278b`). It is not an npm release.

v0.2.0 is a local npm/npx preparation target under the owner-selected public scoped name `@adulph3/agentfence`; it is not yet published. Its executable remains `agentfence`. The unrelated unscoped npm package `agentfence` is not this project. A read-only lookup of `@adulph3/agentfence` on 2026-09-16 returned 404, which is consistent with an unpublished package but does not prove that the owner controls the npm scope.

The validated local Node 24 artifact is `adulph3-agentfence-0.2.0.tgz` (152 files, 90,144 bytes; SHA-256 `fb6327407b814176da352d652b7ff71b7b9d9ae21352066c3091f850b2f2ad56`). This is a local candidate, not a public npm or GitHub release artifact. Node 22 and 24 offline package execution and isolated consumer checks passed against those bytes; see `docs/PROGRESS.md` for the exact evidence and limits.

Before any npm publication, the owner must verify npm account/scope access, review the final scoped tarball and security evidence, run the six Node 22/24 Linux/macOS/Windows CI jobs, update branch protection to their actual check names, and explicitly authorize publication. A Linux network-denied packaged runtime trace and actual Windows output-parent ACL validation remain external evidence gaps. Publishing, tags, remote repositories, provenance, and uploads require separate authorization.

Local release checklist: run typecheck, boundary/package checks, full tests,
schema/CLI examples, deterministic dogfood, benchmark, and a dry-run package;
verify the fixed rule registry and report schemas are packaged; review direct and
transitive dependencies, licenses and lifecycle scripts; record exact evidence and
the master-plan checksum. Treat an audit as evidence only for the reviewed cache or
network state in which it ran. Do not claim the v0.2.0 package is public until
those external gates and an authorized npm publication are independently complete.
