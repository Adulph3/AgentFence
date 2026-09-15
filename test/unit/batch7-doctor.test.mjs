import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import doctorSchema from '../../schemas/doctor-1.0.schema.json' with {type:'json'};
import { doctor, doctorReport, runDoctor } from '../../dist/src/cli/doctor.js';

const validate=new Ajv2020({strict:true}).compile(doctorSchema);
const supported={runtimeVersion:'24.0.0',platform:'linux',architecture:'x64',overrides:{codexHome:true,claudeConfigDir:false}};
test('injected doctor is deterministic, schema-valid, and exposes fixed support metadata',()=>{
 const report=doctorReport(supported),run=runDoctor(true,supported);assert.equal(run.exitCode,0);assert.equal(validate(report),true,JSON.stringify(validate.errors));assert.deepEqual(report.adapters.map(adapter=>[adapter.kind,adapter.adapterVersion]),[['codex','1.0.0'],['claude-code','1.0.0'],['cursor','1.0.0'],['kiro','1.0.0'],['vscode','1.0.0'],['generic-mcp','1.0.0']]);assert.equal(JSON.parse(run.output).overrides.codexHome,true);const plain=runDoctor(false,supported).output;for(const name of ['codex','claude-code','cursor','kiro','vscode','generic-mcp'])assert.ok(plain.includes(`${name}@1.0.0`));assert.equal(plain.includes('DOCTOR_OVERRIDE_CANARY'),false);assert.equal(JSON.parse(doctor(true)).kind,'doctor');
});
test('injected doctor failures and unsupported runtime exit two with fixed safe output',()=>{
 for(const services of [{...supported,escapeSelfTest:()=>false},{...supported,scoreSelfTest:()=>false},{...supported,runtimeVersion:'22.0.0'}]){const result=runDoctor(true,services),value=JSON.parse(result.output);assert.equal(result.exitCode,2);assert.equal(validate(value),true,JSON.stringify(validate.errors));assert.equal(JSON.stringify(value).includes('DOCTOR_OVERRIDE_CANARY'),false);}
});
test('doctor treats an empty recognized override as present without exposing its value',()=>{const prior=process.env.CODEX_HOME;try{process.env.CODEX_HOME='';const report=doctorReport({runtimeVersion:'24.0.0'});assert.equal(report.overrides.codexHome,true);assert.equal(JSON.stringify(report).includes('CODEX_HOME'),false);}finally{if(prior===undefined)delete process.env.CODEX_HOME;else process.env.CODEX_HOME=prior;}});
