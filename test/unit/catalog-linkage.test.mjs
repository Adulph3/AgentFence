import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCatalogTestLinkage } from '../../scripts/check-catalog-tests.mjs';
import { RULE_DEFINITIONS } from '../../dist/src/rules/registry.js';
import { CATALOG_TEST_MANIFEST } from '../catalog-test-manifest.mjs';

test('every compiled registry test ID resolves to an executable test assertion',async()=>{await assertCatalogTestLinkage();});
test('catalog linkage rejects a missing executable case',async()=>{const broken={...CATALOG_TEST_MANIFEST,'catalog-AF-SECRET-001-positive':{file:'test/unit/rules.test.mjs',name:'not an executable test'}};await assert.rejects(assertCatalogTestLinkage(RULE_DEFINITIONS,broken),/AF_RULE_TEST_LINK/);});
