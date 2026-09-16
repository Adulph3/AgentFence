# Decisions

- D01–D18 in the master plan are adopted unchanged.
- Runtime dependencies are restricted to `@iarna/toml` 2.2.5 and `jsonc-parser` 3.3.1. Development tooling is exact-pinned and lifecycle scripts are ignored during installation.
- D19: the rule catalog is compiled into the package. Rule identifiers alone are
  insufficient because callers must not own public title/version/remediation/link
  strings. Only registry-owned bundled HTTPS origins are permitted.
- D20: a user `.claude.json` project map is selection context, not discovery scope.
  The canonical explicit root selects at most one project entry; project keys and
  nonmatching records never cross the safe-output boundary. A name collision between
  top-level and selected project server maps is reported as partial rather than
  silently choosing one.
- D21: link, device, and output containment checks are best-effort portable Node
  defenses. They reject observed unsafe components but cannot make a concurrent
  mutation race impossible; that residual limit is documented rather than hidden.
- D22: the requested v0.2.0 milestone is npm/npx distribution readiness and Node
  22/24 compatibility only. The master plan's R2 explicit policy/scope-control
  work is deferred; no detection or security invariant changes accompany this
  package-version increment. npm publication remains a separately authorized act.
- D23: the owner selected the public scoped npm package `@adulph3/agentfence`
  for v0.2.0. The installed executable remains `agentfence`; the unrelated
  unscoped registry package is outside this project's control. This naming
  decision changes package identity and self-imports only, not detection behavior.
