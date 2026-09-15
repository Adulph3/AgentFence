# Architecture

CLI parsing invokes the Node acquisition API. Acquisition discovers fixed paths, performs bounded reads, and submits bytes to fixed bundled parser/analysis workers (two maximum; 64 MiB old-generation limit and one-second task timer). Worker replies are shape- and safe-alphabet-validated before the parent accepts them; raw buffers and ASTs never cross back. Core returns safe DTOs only; reporters cannot read files. Core exports `analyzeSources` and `scoreFindings`; `agentfence/node` exports `scanProject(request, services, signal)`.

No layer imports network, child-process, VM, or input-driven module loading APIs.

The dependency direction is CLI/application -> node acquisition -> parsers/adapters
-> analysis/rules -> core normalization/scoring -> reporters. Discovery and
acquisition own raw paths and bytes. Parsers own raw syntax trees. Adapters select
only bounded facts; analysis projects them into safe DTOs. `safe`/opaque helpers are
the raw-to-safe boundary, and serializers accept only those DTOs. This separation is
why a rule cannot preserve a server name, header, URL, command, path, or value in a
report identifier.

`analyzeSources` and `scoreFindings` are deterministic core APIs. The Node-only
`scanProject(request, services, signal)` API owns local filesystem access and allows
an injected home resolver for tests. Neither API resolves configuration inheritance,
loads plugins, follows links, or contacts an agent.
