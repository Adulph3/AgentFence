# Threat model

Repository bytes, names, configuration, links, and parser failures are hostile. AgentFence uses fixed discovery, opaque report locations, bounded traversal/reads, no-follow link rejection, and exclusive output creation. Portable Node cannot fully contain concurrent filesystem replacement or identify every remote mount; use an immutable local snapshot for adversarial trees.

`--output` creates a POSIX report with mode 0600. On Windows, report confidentiality
depends on the inherited ACL of the selected parent directory; the operator must
choose a parent with appropriately restricted ACLs. Mocked or lexical Windows tests
do not establish real Windows ACL behavior.

Assets include local agent configuration, credentials referenced by it, private path
names, report destinations, and CI exit decisions. Trust crosses at CLI arguments,
the explicitly selected root, fixed user paths, filesystem metadata, parser-worker
messages, and reporter output. Inputs are not authority: a scanned instruction,
hook, URL, policy-like file, package command, or vendor setting cannot expand scope,
cause execution, load a module, change a rule, or make a network request.

Detected threats include secret/literal exposure indicators, unsafe local process and
endpoint declarations, filesystem roots, approval bypasses, risky shell/supply-chain
patterns, instruction patterns, and hidden Unicode. Out of scope are live agent
state, credential validity, endpoint reachability, package provenance, runtime
inheritance, general shell semantics, and compromise attribution. Residual limits
include filesystem races after checks, platform-specific link/device behavior, and
hostile process memory; partial coverage is surfaced instead of concealed.
