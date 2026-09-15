import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('source has no forbidden network or execution runtime imports', async () => { const source=await readFile('src/core/index.ts','utf8'); assert.equal(/node:(?:child_process|http|https|net|tls|dns)|\beval\s*\(/.test(source),false); });
