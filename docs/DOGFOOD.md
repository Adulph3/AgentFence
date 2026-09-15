# Dogfood expectations

AgentFence is scanned as ordinary repository data; it has no self-suppression. The reviewed repository expectation is deterministic output with honest coverage status. The repository intentionally contains synthetic risky fixtures, so their secret, MCP, cleartext-network, supply-chain, and prompt findings must remain visible. Permission findings require a documented vendor field and are not inferred from generic fixture keys. The synthetic clean fixture remains assessed with no risk deduction (inventory-only findings may still appear). These expectations are checked by the offline integration suite and do not assert that the project is secure.

Current deterministic dogfood baseline on this workspace under Node 24.21.0 is `partial` with
`AF_WALK_LIMIT`: 160 visited entries, 6 eligible/analyzed sources, 10 agents, 4 MCP
servers, 10 findings, score 52, and 1 error. The proper file-backed harness
(using the real production CLI and Node 24 runtime) observed two byte-identical safe
reports with SHA-256 `590ebe300dc5479e0d2c1e69b04e17e7fdc1a73a652fa56dce7c6b8c283107a4`.
Two runs under unchanged coverage must be byte-identical. The baseline asserts
evidence classes as well as these reviewed counts; refresh it only after reviewing
an intentional detector/catalog change and keep the clean fixture separate from the
intentionally risky repository. This is local deterministic evidence, not a claim
of publication, a secure repository, or unavailable platform validation.

This baseline was intentionally refreshed after actual Node 24 validation.
The one narrow fresh Sol/High release-gate review returned SHIP with no confirmed
blocker. Its non-blocking follow-ups are recorded in `docs/POST_V0_1_BACKLOG.md`;
completion remains distinct from publication authorization.
