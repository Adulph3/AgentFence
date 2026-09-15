# Local release readiness

v0.1 is locally prepared only. Before publication, confirm package ownership, a private security reporting route, Node 24 Linux/macOS/Windows runs, a network-denied packaged runtime test, dependency audit status, and a clean offline tarball consumer. Publishing, tags, remote repositories, provenance, and uploads require separate authorization.

Local release checklist: run typecheck, boundary/package checks, full tests,
schema/CLI examples, deterministic dogfood, benchmark, and a dry-run package;
verify the fixed rule registry and report schemas are packaged; review direct and
transitive dependencies, licenses and lifecycle scripts; record exact evidence and
the master-plan checksum. Treat an audit as evidence only for the reviewed cache or
network state in which it ran. Do not claim a public release until the external
gates above are independently complete.
