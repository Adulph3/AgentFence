# AgentFence local security lab

These examples are synthetic and safe to inspect. AgentFence treats every value as hostile data and never executes the declared commands, starts MCP servers, installs packages, or contacts configured endpoints.

## Exercise

1. Read `vulnerable/` and predict which declarations create findings.
2. Build AgentFence locally with `npm run build`.
3. Run `node dist/src/cli/main.js scan examples/vulnerable`.
4. Compare the findings with `safe/` and `mixed/`.
5. Copy the vulnerable directory outside this repository, replace mutable package selectors with exact reviewed versions, remove credential literals, narrow filesystem roots, require approval, and remove download-to-interpreter commands.
6. Scan the copy again and explain why its findings and score changed.

The safe example can still produce informational inventory findings. A score of 100 means no scored risk was observed in the supported static surface; it is not a security guarantee.

Expected high-level outcome:

- `vulnerable/`: multiple scored findings and a failing default High threshold.
- `safe/`: complete scan, informational inventory only, score 100.
- `mixed/`: both safer and review-worthy declarations, illustrating that the score is a summary rather than a verdict.
