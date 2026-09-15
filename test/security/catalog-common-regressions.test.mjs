import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanProject } from '../../dist/src/node/index.js';
import { jsonReport } from '../../dist/src/reporters/json.js';
import { analyzeSources } from '../../dist/src/core/index.js';

test('catalog shared benign declarations avoid unrelated rule families',()=>{const result=analyzeSources([{id:'S1',scope:'project',kind:'generic-mcp',relativePath:'.mcp.json',parseKind:'json',principalId:'P1',content:'{"mcpServers":{"safe":{"command":"reviewed-tool","env":{"NODE_ENV":"production"}}}}'}]);assert.deepEqual(result.findings.map(f=>f.ruleId),['AF-MCP-001']);});
test('catalog shared adversarial structured input preserves a valid sibling and safe output',async()=>{const root=await mkdtemp(join(tmpdir(),'agentfence-catalog-'));const canary='CATALOG_ADVERSARIAL_SECRET_CANARY';try{await writeFile(join(root,'.mcp.json'),JSON.stringify({mcpServers:{broken:{command:7,env:{UNTRUSTED_KEY:canary}},valid:{command:'reviewed-tool'}}}));const report=await scanProject({path:root});assert.equal(report.status,'partial');assert.equal(report.mcpServers.length,1);assert.ok(report.errors.some(error=>error.code==='AF_MCP_ENTITY'));assert.equal(jsonReport(report).includes(canary),false);}finally{await rm(root,{recursive:true,force:true});}});
test('public finding-budget exhaustion is partial and cannot expose hostile source metadata',async()=>{const core=await import('agentfence/core'),canary='PUBLIC_BUDGET_SECRET_CANARY',result=core.analyzeSources([{id:canary,scope:'project',relativePath:canary,parseKind:'markdown',principalId:canary,content:'\u202e'.repeat(349_525)}]),serialized=JSON.stringify(result);assert.equal(result.findings.length,10_000);assert.ok(result.errors.some(error=>error.code==='AF_REPORT_LIMIT'));assert.equal(serialized.includes(canary),false);});
