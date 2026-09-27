import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { scanProject } from '../../dist/src/node/index.js';
import { jsonReport } from '../../dist/src/reporters/json.js';

test('vulnerable, safe, and mixed labs are deterministic and keep expected boundaries',async()=>{
 const vulnerableOne=await scanProject({path:resolve('examples/vulnerable')}),vulnerableTwo=await scanProject({path:resolve('examples/vulnerable')});
 assert.deepEqual(vulnerableOne,vulnerableTwo);assert.equal(vulnerableOne.status,'complete');assert.equal(vulnerableOne.thresholdExceeded,true);assert.ok(vulnerableOne.findings.some(finding=>finding.ruleId==='AF-SUPPLY-003'));assert.ok(vulnerableOne.findings.some(finding=>finding.ruleId==='AF-PERM-001'));assert.equal(jsonReport(vulnerableOne).includes('synthetic-training-value'),false);
 const safe=await scanProject({path:resolve('examples/safe')});assert.equal(safe.status,'complete');assert.equal(safe.thresholdExceeded,false);assert.equal(safe.score.value,100);assert.equal(safe.findings.some(finding=>finding.ruleId==='AF-SUPPLY-001'),false);
 const mixed=await scanProject({path:resolve('examples/mixed')});assert.equal(mixed.status,'complete');assert.equal(mixed.findings.some(finding=>finding.ruleId==='AF-SUPPLY-001'),true);assert.equal(mixed.findings.some(finding=>finding.ruleId==='AF-SECRET-001'),true);
});
