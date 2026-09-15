# Privacy

Scan and doctor make no application network requests or telemetry. Raw source buffers remain in memory only while analyzed; JavaScript cannot promise memory zeroization or protect process dumps. Reports omit raw paths, names, values, URLs, commands, headers, parser errors, and secret-derived hashes. Terminal controls are escaped and JSON turns invisible controls into visible ASCII escapes. Opt-in user scope uses only the fixed allowlist documented in the master plan.

Source locations are ordinal labels (`source-N`), not filesystem paths. Structured
principal, finding and risk identifiers derive only from source ordinals and fixed
semantic labels, never server names or content. `.claude.json` project keys are
read only transiently to compare the canonical requested root and are neither
reported nor hashed. The process still handles hostile bytes in memory; use a
trusted local machine and do not treat the scanner as a secure-enclave boundary.

When an operator requests `--output`, the report is created mode 0600 on POSIX. On
Windows, confidentiality depends on the inherited ACL of the chosen parent directory,
which the operator must restrict appropriately. The mocked Windows paths in local
tests do not validate actual Windows ACL confidentiality.
