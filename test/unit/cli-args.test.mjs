import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../../dist/src/cli/args.js';
test('CLI accepts documented scan forms',()=>{assert.equal(parseArgs(['scan']).command,'scan');assert.equal(parseArgs(['scan','--json','--output','x','--severity','medium','--fail-on','none','--user-configs']).request.failOn,'none');assert.equal(parseArgs(['scan','--','-project']).request.path,'-project');});
test('CLI rejects duplicates and malformed forms',()=>{for(const args of [['scan','--json','--json'],['scan','a','b'],['scan','--severity'],['doctor','x'],['scan','--unknown']])assert.throws(()=>parseArgs(args));});
