import { RULE_DEFINITIONS } from '../dist/src/rules/registry.js';
import { CATALOG_TEST_MANIFEST } from '../test/catalog-test-manifest.mjs';
import { CATALOG_OBLIGATION_CASES, registerCatalogObligationCases } from '../test/unit/catalog-obligations.test.mjs';

const obligationFile='test/unit/catalog-obligations.test.mjs';
const obligations=Object.freeze(['positive','negative','adversarial','redaction']);
const fail=()=>{throw new Error('AF_RULE_TEST_LINK');};
const expectedName=(rule,obligation)=>`catalog ${rule} ${obligation}`;
const expectedId=(rule,obligation)=>`catalog-${rule}-${obligation}`;

/** Captures the same registration used by Node tests without invoking assertions. */
export async function assertCatalogTestLinkage(definitions=RULE_DEFINITIONS,manifest=CATALOG_TEST_MANIFEST){
 const expected=new Map();
 for(const definition of definitions){
  if(Object.keys(definition.testIds).sort().join(',')!==[...obligations].sort().join(','))fail();
  const perRule=new Set();
  for(const obligation of obligations){
   const id=definition.testIds[obligation];
   if(id!==expectedId(definition.id,obligation)||expected.has(id)||perRule.has(id))fail();
   perRule.add(id);expected.set(id,{rule:definition.id,obligation});
  }
  if(perRule.size!==obligations.length)fail();
 }
 const manifestIds=Object.keys(manifest);
 if(manifestIds.length!==expected.size||manifestIds.some(id=>!expected.has(id)))fail();

 const cases=new Map();
 for(const entry of CATALOG_OBLIGATION_CASES){
  if(!entry||typeof entry.id!=='string'||cases.has(entry.id)||Object.keys(entry).sort().join(',')!=='adversarial,id,negative,positive,redaction')fail();
  for(const obligation of obligations)if(typeof entry[obligation]!=='function')fail();
  cases.set(entry.id,entry);
 }
 if(cases.size!==definitions.length||definitions.some(definition=>!cases.has(definition.id)))fail();

 const registrations=new Map();
 registerCatalogObligationCases((name,handler)=>{if(typeof name!=='string'||typeof handler!=='function'||registrations.has(name))fail();registrations.set(name,handler);});
 if(registrations.size!==expected.size)fail();
 const linkedNames=new Set();
 for(const [id,{rule,obligation}] of expected){
  const link=manifest[id];
  if(!link||link.file!==obligationFile||link.name!==expectedName(rule,obligation)||linkedNames.has(link.name))fail();
  linkedNames.add(link.name);
  if(registrations.get(link.name)!==cases.get(rule)?.[obligation])fail();
 }
 if(linkedNames.size!==expected.size)fail();
}
if(import.meta.url===new URL(process.argv[1]??'',`file://${process.cwd()}/`).href){await assertCatalogTestLinkage();console.log('catalog test linkage passed');}
