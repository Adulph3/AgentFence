import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, RULE_DEFINITIONS, validateRuleRegistry } from '../../dist/src/rules/registry.js';

test('compiled catalog is complete and validates fixed metadata',()=>{assert.equal(RULES.length,23);assert.equal(new Set(RULES).size,RULES.length);assert.doesNotThrow(()=>validateRuleRegistry());for(const rule of RULE_DEFINITIONS){assert.ok(rule.title&&rule.recommendation&&rule.references.length&&rule.acceptedFactKinds.length);assert.ok(Object.values(rule.testIds).every(id=>id.includes(rule.id)));}});
test('catalog validator rejects duplicate IDs, missing tests, and arbitrary references',()=>{const base=RULE_DEFINITIONS[0];assert.throws(()=>validateRuleRegistry([base,base]),/AF_RULE_REGISTRY_ID/);assert.throws(()=>validateRuleRegistry([{...base,testIds:{...base.testIds,redaction:''}}]),/AF_RULE_REGISTRY_TESTS/);assert.throws(()=>validateRuleRegistry([{...base,references:['https://example.invalid/rule']}]),/AF_RULE_REGISTRY_REFERENCE/);});
