/** Stable registry IDs resolve to distinct executable catalog obligation cases. */
const obligationFile='test/unit/catalog-obligations.test.mjs';
const rules=['AF-SECRET-001','AF-SECRET-002','AF-SHELL-001','AF-SHELL-002','AF-SHELL-003','AF-SHELL-004','AF-SHELL-005','AF-SUPPLY-001','AF-SUPPLY-002','AF-SUPPLY-003','AF-MCP-001','AF-MCP-002','AF-NET-001','AF-MCP-003','AF-PERM-001','AF-FS-001','AF-PROMPT-001','AF-PROMPT-002','AF-PROMPT-003','AF-PROMPT-004','AF-UNICODE-001','AF-UNICODE-002','AF-COMBO-001'];
const obligations=['positive','negative','adversarial','redaction'];
export const CATALOG_TEST_MANIFEST=Object.freeze(Object.fromEntries(rules.flatMap(rule=>obligations.map(obligation=>[`catalog-${rule}-${obligation}`,Object.freeze({file:obligationFile,name:`catalog ${rule} ${obligation}`})]))));
