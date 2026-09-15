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
