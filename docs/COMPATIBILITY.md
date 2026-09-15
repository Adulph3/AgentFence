# Compatibility

v0.1 recognizes Codex TOML; Claude Code settings/MCP/instructions; Cursor MCP/hooks/rules; Kiro MCP/hooks/steering; VS Code MCP/settings JSONC; and generic `.mcp.json`. Compatibility is based on the dated official links in the master plan (2026-09-10).

The scanner preserves direct argv boundaries and classifies only documented MCP fields: transport, enabled state, launcher family, package selector, literal numeric endpoint class, curated/sanitized environment binding class, and recognized filesystem-server roots. It does not resolve DNS, environment values, inputs, headers, URLs, commands, package selectors, or root paths.

Project discovery is limited to the fixed registry and excludes `.claude.json`; that file is an opt-in user-allowlist location only. Project `AGENTS.md` is shared evidence and does not confirm Codex, while user `.codex/AGENTS*.md` is possible Codex evidence only. A lone `.mcp.json` is generic MCP evidence, but is Claude-associated once independently valid Claude evidence exists in the same structural workspace. Agent records use local structural workspace ordinals, never raw paths or names. `--user-configs` reads only the fixed Codex, Claude, Cursor, and Kiro locations plus bounded Markdown under Claude rules and Kiro steering; it never crawls a home directory or follows relocation variables. It does not emulate managed/profile/session state, custom config roots, dynamic registration, live MCP descriptions, or unknown argument schemas.

Research/compatibility review date: 2026-09-10. Primary documented fields are
Codex [`mcp_servers`, `command`, `args`, `env`, `env_vars`,
`bearer_token_env_var`](https://developers.openai.com/codex/config-reference/),
Claude Code [`mcpServers` and settings](https://code.claude.com/docs/en/settings),
and the [MCP transport/security documentation](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices).
For Codex compatibility, documented credential-bearing Authorization/API-key header
forms are classified as a literal or environment reference but their raw header
name and value are not retained. Unknown vendor fields remain unsupported rather
than becoming generic semantics.

The dated compatibility map is deliberately per-vendor: Codex accepts
`mcp_servers.enabled` and top-level `approval_policy: "never"`; Claude Code reads
its `disabledMcpServers` list, `permissions.defaultMode: "bypassPermissions"`, and
the documented nested command-hook shape; Cursor and Kiro read only their respective
`disabled` / `autoApprove` MCP fields and fixed hook files; VS Code recognizes the
`servers` envelope and exact `chat.mcp.enabled` setting. Generic `.mcp.json` retains
only universal transport, command/argv, URL, and environment semantics. It does not
inherit any of those vendor enablement, approval, or hook fields. These fixed maps
are tied to the 2026-09-10 official-source snapshot in the master plan; similarly
named arbitrary keys are ignored rather than generalized.

For user `.claude.json`, only top-level `mcpServers` and the `projects` record whose
key exactly matches the already-canonical explicit scan root are considered. Auth,
history, nonmatching projects, malformed project shapes, named profiles, and custom
roots are not scanned. A malformed selected recognized shape reports partial
coverage; a nonmatching project map alone does not confirm generic MCP.
