/** Fixed bundled parser entrypoint. It accepts source text supplied by the parent only. */
import { parseJson } from './json.js';
import { parseToml } from './toml.js';
import { markdownBlocks } from './markdown.js';
export function parseBounded(kind:'json'|'jsonc'|'toml'|'markdown', text:string):unknown { if(kind==='json')return parseJson(text,false);if(kind==='jsonc')return parseJson(text,true);if(kind==='toml')return parseToml(text);return markdownBlocks(text); }
