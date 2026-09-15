# AgentFence

AgentFence is a local, offline static audit of supported agent configuration and instruction files. It never launches agents, hooks, packages, MCP servers, or commands, and makes no application network request.

```sh
agentfence scan .
agentfence scan . --json
agentfence scan . --output report.json
agentfence scan . --severity high --fail-on high
agentfence scan . --user-configs
agentfence doctor --json
```

Scanning is read-only except `--output`, which creates a new JSON file and never overwrites an existing destination. On POSIX, that file is created with mode 0600. On Windows, confidentiality depends on inherited ACLs: choose a parent directory whose ACL is appropriately restricted. Findings use opaque source identifiers and omit secrets, URLs, commands, and paths. The score summarizes observed configuration risk, not runtime access or security certification. Exit 0 means complete below threshold; 1 threshold exceeded; 2 usage/fatal/output failure; 3 partial coverage; 130 interruption.

Node 24 is required (`>=24 <25`). Official v0.1.0 artifacts are distributed through GitHub Releases; the package is not published to npm.

`scan [PATH]` defaults to the current project and supported project candidates only.
`--user-configs` is explicit opt-in and reads a fixed allowlist; it never crawls a
home directory. `--severity` changes terminal presentation, not the JSON model or
score. `--fail-on none|info|low|medium|high|critical` controls the threshold exit.
`--json` writes the safe JSON model to stdout; `--output FILE` writes a new JSON
file instead. A partial result is useful coverage evidence, but its score is
provisional and exit 3 takes precedence over a threshold result.

Mocked or lexical Windows-path tests exercise failure handling only; they do not
validate real Windows inherited-ACL confidentiality. Operators remain responsible
for the ACL of the selected output parent directory.

The CLI is deliberately offline and static: it does not execute commands, start
agents or MCP servers, resolve endpoints, inspect environment values, send
telemetry, or make runtime network requests. It reports observations rather than
claims that a configuration is safe or exploitable.
