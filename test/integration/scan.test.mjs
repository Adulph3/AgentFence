import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { scanProject } from '../../dist/src/node/index.js';
import { jsonReport } from '../../dist/src/reporters/json.js';

test('risky fixture produces deterministic safe findings', async () => {
  const root=resolve('test/fixtures/risky');
  const one=await scanProject({path:root,failOn:'high'}); const two=await scanProject({path:root,failOn:'high'});
  assert.equal(one.status,'complete'); assert.equal(one.thresholdExceeded,true);
  assert.deepEqual(one,two); assert.equal(jsonReport(one).includes('AF_TEST_CANARY_9b1'),false); assert.equal(jsonReport(one).includes('AF_URL_CANARY'),false);
  assert.ok(one.findings.some(f=>f.ruleId==='AF-SECRET-002'));
});
test('clean fixture has assessed report', async () => { const r=await scanProject({path:resolve('test/fixtures/clean')}); assert.equal(r.status,'complete'); assert.equal(r.score.value,100); });
test('relocated configuration overrides are reported by presence only and never followed',async()=>{const root=resolve('test/fixtures/clean');for(const [configOverrides,expected] of [[{codexHome:true,claudeConfigDir:false},['Relocated Codex configuration was not assessed']],[{codexHome:false,claudeConfigDir:true},['Relocated Claude configuration was not assessed']],[{codexHome:true,claudeConfigDir:true},['Relocated Codex configuration was not assessed','Relocated Claude configuration was not assessed']]]){const report=await scanProject({path:root},{configOverrides});assert.deepEqual(report.coverage.limitations.filter(value=>value!=='Static local configuration analysis only'),expected);assert.equal(JSON.stringify(report).includes('HOME='),false);}});
test('failed acquisition consumes its opaque source ordinal before later success',async()=>{const root=await mkdtemp(resolve(tmpdir(),'agentfence-source-ordinal-'));try{await mkdir(resolve(root,'.codex'));await writeFile(resolve(root,'.codex','config.toml'),'x'.repeat(1_024*1_024+1));await writeFile(resolve(root,'.mcp.json'),'{"mcpServers":{}}');const report=await scanProject({path:root});assert.ok(report.errors.some(error=>error.code==='AF_OVERSIZED_INPUT'&&error.sourceId==='S1'));assert.deepEqual(report.sources.map(source=>source.id),['S2']);assert.equal(new Set([...report.errors.flatMap(error=>error.sourceId?[error.sourceId]:[]),...report.sources.map(source=>source.id)]).size,2);}finally{await rm(root,{recursive:true,force:true});}});
