# Post-v0.1 backlog

These items were classified NON-BLOCKING by the final narrow Sol/High release-gate review. They are not v0.1 release blockers and must be reconsidered against the threat model and compatibility contract before a later release.

1. Direct-core Claude attribution: when `CLAUDE.md` is the only same-workspace Claude evidence, an accompanying `.mcp.json` remains attributed to generic MCP. Findings are preserved; only agent association differs.
2. Quoted home-variable classification: `rm -rf "${HOME}"` remains High rather than Critical. `$HOME` and literal POSIX/macOS home paths classify as Critical, and the quoted form still preserves High gating.
3. Unsupported-runtime doctor presentation: production `doctor --json` returns the safe `AF_RUNTIME_UNSUPPORTED` failure envelope before command execution. The richer unsupported-runtime doctor report is available through the in-memory doctor path.

Actual Node 24.21.0 Linux validation and GitHub-hosted Ubuntu/macOS/Windows CI are complete. Private vulnerability reporting is enabled and the v0.1.0 GitHub release is authorized. Accepted external evidence gaps remain: Linux denied-network syscall tracing; a wholly cache-empty consumer; broader dependency-audit evidence; actual Windows ACL validation; and npm package ownership/publication. These require external environments or owner decisions and did not conceal a confirmed local Critical/High defect in the final review.
