# Detectors

v0.1 has a fixed, offline registry. Structured declarations outrank English text heuristics. Findings describe declarations or requests only; no rule proves runtime access, endpoint reachability, package integrity, or compromise.

- `AF-SECRET-001/002`: declared sensitive environment forwarding and literals.
- `AF-SHELL-001..005`: shell wrappers, elevation, recursive deletion, shell composition, and Git push automation.
- `AF-SUPPLY-001..003`: mutable/temporary package runners and downloader-to-interpreter flows.
- `AF-MCP-001..003` and `AF-NET-001`: local/remote MCP inventory, dynamic construction, and cleartext endpoint declarations.
- `AF-PERM-001`, `AF-FS-001`, and `AF-COMBO-001`: broad approvals, recognized filesystem roots, and same-principal shell/network/sensitive-env combinations.
- `AF-PROMPT-001..004`: affirmative credential, safeguard-bypass, transmission, and risky automation requests outside quoted/fenced/negated English clauses.
- `AF-UNICODE-001/002`: bidi and unusual format/control code points. Ordinary Arabic, Hebrew, emoji, and a leading BOM are not treated as suspicious solely for being non-Latin.

Unknown security-relevant syntax produces coverage limitations rather than an invented finding. Rules never load repository policy or plugins.

The compiled catalog is the executable source of truth for every initial rule:
ID/version/title/category/default severity, accepted fact kind, confidence/exclusion
summary, remediation, bundled HTTPS reference, milestone, and positive/negative/
adversarial/redaction test identifiers. Finding constructors verify a caller's
category and take title, version, remediation, and references from that catalog;
context may only narrow severity or confidence. The catalog validator rejects a
duplicate ID, missing required metadata/test identifier, unsupported category or
milestone, malformed version, and arbitrary reference origin.

The v0.1 manifest is bijective: 23 rules each own four distinct executable
obligations (positive, negative, adversarial, and redaction), for 92 named cases.
The build checker validates the same side-effect-free case table used to register
those tests and rejects shared or missing obligation links.

Noise posture: structural facts have high confidence; text and inferred facts are
conservative. Disabled declarations stay inventory but are inactive for scoring.
Quoted/fenced educational text and explicit negation are intentionally excluded from
the English instruction rules, which can create false negatives. No detector
validates a credential, tests reachability, or interprets arbitrary shell grammar.
