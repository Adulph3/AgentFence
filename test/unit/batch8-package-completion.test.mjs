import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import pkg from '../../package.json' with {type:'json'};
import lock from '../../package-lock.json' with {type:'json'};
import { validatePackageMetadata } from '../../scripts/check-package.mjs';

const root=new URL('../..',import.meta.url);

test('public-ready package metadata is MIT, locked, and retains the release allowlist',()=>{
  assert.notEqual(pkg.private,true);
  assert.equal(pkg.name,'@adulph3/agentfence');
  assert.equal(pkg.version,'0.2.0');
  assert.equal(lock.name,pkg.name);
  assert.equal(pkg.license,'MIT');
  assert.equal(lock.packages[''].license,'MIT');
  assert.doesNotThrow(()=>validatePackageMetadata(pkg,lock));
  assert.throws(()=>validatePackageMetadata({...pkg,name:'agentfence'},lock),/package name/);
  assert.throws(()=>validatePackageMetadata(pkg,{...lock,name:'agentfence'}),/metadata disagree/);
  assert.throws(()=>validatePackageMetadata({...pkg,bin:{agentfence2:'./dist/src/cli/main.js'}},lock),/CLI metadata/);
  assert.throws(()=>validatePackageMetadata({...pkg,private:true},lock),/public state/);
  assert.throws(()=>validatePackageMetadata({...pkg,engines:{node:'>=22'}},lock),/metadata disagree|runtime/);
  assert.throws(()=>validatePackageMetadata({...pkg,publishConfig:{access:'restricted'}},lock),/public package metadata/);
  assert.throws(()=>validatePackageMetadata({...pkg,license:'Apache-2.0'},lock),/license/);
  assert.throws(()=>validatePackageMetadata(pkg,{...lock,packages:{...lock.packages,'':{...lock.packages[''],license:'Apache-2.0'}}}),/metadata disagree/);
  assert.throws(()=>validatePackageMetadata({...pkg,files:pkg.files.filter(file=>file!=='LICENSE')},lock),/allowlist/);
});

test('Batch 8 consumer documentation states the Windows inherited-ACL limit',async()=>{
  for(const relative of ['README.md','docs/THREAT_MODEL.md','docs/PRIVACY.md']){
    const text=await readFile(new URL(relative,root),'utf8');
    assert.match(text,/(?:POSIX[\s\S]{0,180}0600|0600[\s\S]{0,180}POSIX)/i,relative);
    assert.match(text,/Windows[\s\S]{0,240}inherited ACL/i,relative);
    assert.match(text,/operator[\s\S]{0,160}(?:parent directory|ACL)/i,relative);
    assert.match(text,/(?:mocked|lexical)[\s\S]{0,120}Windows[\s\S]{0,120}do not/i,relative);
  }
});
