import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { scanProject } from '../../dist/src/node/index.js';
test('dogfood scan is deterministic without self-suppression',async()=>{const one=await scanProject({path:resolve('.')});const two=await scanProject({path:resolve('.')});assert.ok(one.status==='complete'||one.errors.some(error=>error.code==='AF_WALK_LIMIT'));assert.deepEqual(one,two);assert.ok(one.findings.some(f=>f.ruleId==='AF-SECRET-002'));assert.equal(one.findings.some(f=>f.ruleId==='AF-PERM-001'),false);});
