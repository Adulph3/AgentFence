import test from 'node:test';
import assert from 'node:assert/strict';
import { endpointClass } from '../../dist/src/analysis/paths.js';

test('endpoint classes remain lexical and do not resolve names',()=>{
  assert.deepEqual(endpointClass('https://198.51.100.7/path'),{scheme:'https',hostClass:'other'});
  assert.deepEqual(endpointClass('http://10.0.0.7/path'),{scheme:'http',hostClass:'private-literal'});
  assert.deepEqual(endpointClass('http://127.0.0.1/path'),{scheme:'http',hostClass:'loopback-literal'});
  assert.deepEqual(endpointClass('http://[::1]/'),{scheme:'http',hostClass:'loopback-literal'});
  assert.deepEqual(endpointClass('https://[fd12::7]/'),{scheme:'https',hostClass:'private-literal'});
  assert.deepEqual(endpointClass('https://localhost/path'),{scheme:'https',hostClass:'other'});
  assert.equal(endpointClass('not a URL'),undefined);
  assert.deepEqual(endpointClass('https://${env:HOST}/'),{scheme:'other',hostClass:'unresolved'});
  assert.deepEqual(endpointClass('${input:serverUrl}'),{scheme:'other',hostClass:'unresolved'});
});
