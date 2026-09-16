<div align="center">

# 🛡️ AgentFence

**Local-first security scanning for AI coding-agent configuration and instruction files.**

AgentFence helps you inspect what local AI-agent tooling is configured to access or execute — without launching agents, hooks, packages, MCP servers, or commands.

[![CI](https://github.com/Adulph3/AgentFence/actions/workflows/ci.yml/badge.svg)](https://github.com/Adulph3/AgentFence/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Adulph3/AgentFence)](https://github.com/Adulph3/AgentFence/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js 24](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Platforms](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-blue)](#installation)

[Latest release](https://github.com/Adulph3/AgentFence/releases/latest) · [Security](SECURITY.md) · [License](LICENSE)

</div>

---

## What AgentFence does

AgentFence performs a **read-only, offline static audit** of supported AI-agent configuration and instruction files.

It is designed to surface configuration risk such as:

- risky shell or hook behavior
- supply-chain exposure
- secret-bearing environment variable references without printing secret values
- MCP configuration risk
- filesystem and containment issues
- Unicode / bidi control hazards
- risky agent instructions and permissions
- explainable security findings and scoring

Supported configuration families include **Codex, Claude Code, Cursor, Kiro, and MCP-based setups**.

> AgentFence reports observable configuration exposure. It does **not** claim that a repository, agent, or machine is secure or exploitable.

## Safety model

AgentFence is intentionally conservative:

- **No runtime network requests** during scanning
- **No telemetry or analytics**
- **No backend or cloud account**
- **Never executes scanned content**
- Does not start agents, MCP servers, hooks, packages, or commands
- Does not inspect environment variable values
- Findings use opaque source identifiers and omit secret values
- Scanning is read-only unless you explicitly use `--output`

## Requirements

- **Node.js 24.x** (`>=24 <25`)
- npm included with your Node.js installation

Check your runtime:

```text
node --version
npm --version
```

`node --version` must report `v24.x.x`.

> AgentFence v0.1.0 is distributed through **GitHub Releases** and is **not published to the npm registry**. The `npm install -g` commands below install the downloaded local release artifact.

# Installation

## Linux

### 1. Install Node.js 24

Install Node.js 24 using your preferred package/version manager or the official Node.js download page:

https://nodejs.org/en/download

Then verify:

```bash
node --version
npm --version
```

### 2. Download AgentFence

```bash
curl -LO https://github.com/Adulph3/AgentFence/releases/download/v0.1.0/agentfence-0.1.0.tgz
```

### 3. Verify the release checksum

```bash
sha256sum agentfence-0.1.0.tgz
```

Expected SHA-256:

```text
4d5271aad1a7f56f66555752d6a3184643cac0213a712079af33d95709db278b
```

### 4. Install the CLI

```bash
npm install -g ./agentfence-0.1.0.tgz
```

### 5. Verify the installation

```bash
agentfence --version
agentfence doctor
```

---

## macOS

### 1. Install Node.js 24

Install Node.js 24 using your preferred version manager or the official Node.js download page:

https://nodejs.org/en/download

Verify:

```bash
node --version
npm --version
```

### 2. Download AgentFence

```bash
curl -LO https://github.com/Adulph3/AgentFence/releases/download/v0.1.0/agentfence-0.1.0.tgz
```

### 3. Verify the release checksum

```bash
shasum -a 256 agentfence-0.1.0.tgz
```

Expected SHA-256:

```text
4d5271aad1a7f56f66555752d6a3184643cac0213a712079af33d95709db278b
```

### 4. Install the CLI

```bash
npm install -g ./agentfence-0.1.0.tgz
```

### 5. Verify the installation

```bash
agentfence --version
agentfence doctor
```

---

## Windows

Use **PowerShell** for the commands below.

### 1. Install Node.js 24

Install the Node.js 24 Windows installer from:

https://nodejs.org/en/download

Open a new PowerShell window and verify:

```powershell
node --version
npm --version
```

### 2. Download AgentFence

```powershell
Invoke-WebRequest `
  -Uri "https://github.com/Adulph3/AgentFence/releases/download/v0.1.0/agentfence-0.1.0.tgz" `
  -OutFile "agentfence-0.1.0.tgz"
```

### 3. Verify the release checksum

```powershell
(Get-FileHash .\agentfence-0.1.0.tgz -Algorithm SHA256).Hash
```

Expected SHA-256:

```text
4D5271AAD1A7F56F66555752D6A3184643CAC0213A712079AF33D95709DB278B
```

### 4. Install the CLI

```powershell
npm install -g .\agentfence-0.1.0.tgz
```

### 5. Verify the installation

```powershell
agentfence --version
agentfence doctor
```

> On Windows, files created with `--output` inherit ACL behavior from the parent directory. Choose an output directory with appropriately restricted permissions when the report is sensitive.

# Quick start

Go to the project you want to inspect:

```bash
cd /path/to/project
```

Run a standard scan:

```bash
agentfence scan .
```

Generate JSON on stdout:

```bash
agentfence scan . --json
```

Write a new JSON report file:

```bash
agentfence scan . --output report.json
```

Scan supported user-level configurations as an explicit opt-in:

```bash
agentfence scan . --user-configs
```

Fail CI or a script when a High-or-higher finding is observed:

```bash
agentfence scan . --severity high --fail-on high
```

Run diagnostics:

```bash
agentfence doctor
agentfence doctor --json
```

## Common commands

| Command | Purpose |
| --- | --- |
| `agentfence scan .` | Scan the current project |
| `agentfence scan . --json` | Emit the safe JSON report to stdout |
| `agentfence scan . --output report.json` | Write a new JSON report file |
| `agentfence scan . --user-configs` | Include the fixed allowlist of supported user configuration files |
| `agentfence scan . --severity high` | Filter terminal presentation by severity |
| `agentfence scan . --fail-on high` | Return a threshold exit when High/Critical findings are present |
| `agentfence doctor` | Check runtime support and internal health |
| `agentfence doctor --json` | Emit doctor results as JSON |
| `agentfence --version` | Show the installed version |

## Exit codes

| Code | Meaning |
| ---: | --- |
| `0` | Scan completed below the configured failure threshold |
| `1` | Configured finding threshold was exceeded |
| `2` | Usage, fatal, runtime, or output failure |
| `3` | Partial coverage; the report remains useful but its score is provisional |
| `130` | Interrupted |

A partial result takes precedence over the threshold result.

## Output behavior

`scan [PATH]` defaults to the current project and supported project candidates only.

`--user-configs` is an explicit opt-in to a **fixed allowlist** of supported user configuration locations; AgentFence does not crawl your home directory.

`--severity` changes terminal presentation only. It does not alter the JSON model or score.

`--fail-on none|info|low|medium|high|critical` controls the threshold exit behavior.

`--json` writes the safe JSON model to stdout. `--output FILE` creates a **new** JSON file and does not overwrite an existing destination.

On POSIX systems, `--output` files are created with mode `0600`.

## CI / automation example

You can use AgentFence as a local or CI gate after installing the release artifact:

```bash
agentfence scan . --fail-on high
```

Typical interpretation:

```text
0  -> continue
1  -> configured risk threshold exceeded
2  -> scanner/runtime failure
3  -> incomplete coverage; inspect the report
```

The AgentFence repository itself is continuously tested on **Ubuntu, macOS, and Windows with Node.js 24**.

## Updating

Download the newer `.tgz` from the [latest GitHub Release](https://github.com/Adulph3/AgentFence/releases/latest), verify its published checksum, then install it:

```bash
npm install -g ./agentfence-VERSION.tgz
```

## Uninstalling

```bash
npm uninstall -g agentfence
```

## Security

Please read [SECURITY.md](SECURITY.md) before reporting a security issue. Use the repository's private vulnerability reporting flow for sensitive security reports.

## Current limitations

AgentFence is a static configuration/exposure scanner, not a runtime sandbox or endpoint-security product.

It does not:

- execute commands to determine whether a finding is exploitable
- start an agent or MCP server
- resolve remote endpoints
- inspect secret values
- monitor runtime behavior after a scan
- guarantee that a machine or repository is secure

Windows inherited-ACL confidentiality for `--output` depends on the selected parent directory and should be validated by the operator for sensitive reports.

## Release integrity

Official v0.1.0 artifact:

```text
agentfence-0.1.0.tgz
SHA-256: 4d5271aad1a7f56f66555752d6a3184643cac0213a712079af33d95709db278b
```

Download it from:

https://github.com/Adulph3/AgentFence/releases/tag/v0.1.0

## License

AgentFence is released under the [MIT License](LICENSE).
