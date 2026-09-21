import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeArgv } from '../../dist/src/analysis/shell.js';
import { analyzeSources } from '../../dist/src/core/index.js';
import { adaptCodex } from '../../dist/src/adapters/codex.js';
import { RULESET_VERSION, ruleDefinition } from '../../dist/src/rules/registry.js';

const source=(kind='generic-mcp')=>({id:'S1',scope:'project',kind,relativePath:kind==='codex'?'.codex/config.toml':'.mcp.json',parseKind:kind==='codex'?'toml':'json',principalId:'P1',content:''});

test('uvx and uv tool run distinguish exact supported selectors from mutable selectors',()=>{
 for(const argv of [['uvx','ruff'],['uvx','ruff@latest'],['uv','tool','run','ruff'],['uvx','--from','ruff','ruff'],['uv','tool','run','--with=plugin','ruff==1.2.3']])assert.equal(analyzeArgv(argv).supply,'mutable',argv.join(' '));
 for(const argv of [['uvx','ruff==1.2.3'],['uvx','ruff@1.2.3'],['uv','tool','run','ruff==1.2.3'],['uvx','--from','ruff==1.2.3','ruff'],['uv','tool','run','--with=plugin==2.0.0','ruff==1.2.3']])assert.equal(analyzeArgv(argv).supply,'exact',argv.join(' '));
});

test('recognized uv runners emit versioned supply findings and classify launcher metadata',()=>{
 const mutable=analyzeSources([{...source(),content:JSON.stringify({mcpServers:{one:{command:'uvx',args:['ruff']}}})}]);
 assert.equal(mutable.mcpServers[0].launcher,'package-runner');assert.equal(mutable.mcpServers[0].packageSelector,'mutable');
 assert.equal(mutable.findings.find(finding=>finding.ruleId==='AF-SUPPLY-001')?.ruleVersion,'1.1.0');
 assert.equal(mutable.findings.find(finding=>finding.ruleId==='AF-SUPPLY-002')?.ruleVersion,'1.1.0');
 const exact=analyzeSources([{...source(),content:JSON.stringify({mcpServers:{one:{command:'uv',args:['tool','run','ruff==1.2.3']}}})}]);
 assert.equal(exact.mcpServers[0].launcher,'package-runner');assert.equal(exact.mcpServers[0].packageSelector,'exact');
 assert.equal(exact.findings.some(finding=>finding.ruleId==='AF-SUPPLY-001'),false);assert.ok(exact.findings.some(finding=>finding.ruleId==='AF-SUPPLY-002'));
});

test('combined POSIX shell flags and Windows executable suffixes retain semantics',()=>{
 assert.equal(analyzeArgv(['bash','-lc','rm -rf /']).rmrf,'root');
 assert.equal(analyzeArgv(['bash.exe','-lc','npx.cmd','pkg']).shell,true);
 assert.equal(analyzeArgv(['npx.cmd','pkg']).supply,'mutable');
 assert.equal(analyzeArgv(['npm.exe','exec','--','pkg@1.2.3']).supply,'exact');
 assert.equal(analyzeArgv(['pwsh.cmd','-c','rm -rf /']).unsupported,true);
});

test('Codex mixed env_vars records are supported without retaining opaque names',()=>{
 const canary='PRIVATE_CANARY_TOKEN';
 const result=adaptCodex(source('codex'),{mcp_servers:{one:{command:'tool',env_vars:['GITHUB_TOKEN',{name:'OPENAI_API_KEY',source:'local'},{name:canary,source:'remote'}]}}});
 assert.equal(result.diagnostics.length,0);assert.equal(result.facts.length,1);assert.equal(result.facts[0].envFacts.length,3);
 assert.equal(result.facts[0].envFacts[0].safeName,'GITHUB_TOKEN');assert.equal(result.facts[0].envFacts[1].safeName,'OPENAI_API_KEY');
 assert.equal(JSON.stringify(result).includes(canary),false);
});

test('Codex header helper is an explicit safe partial and raw helper command is never retained',()=>{
 const canary='HELPER_COMMAND_CANARY';
 const result=analyzeSources([{...source('codex'),parsed:{mcp_servers:{one:{command:'tool',http_headers_helper:canary}}}}]);
 assert.ok(result.errors.some(error=>error.code==='AF_CODEX_HTTP_HEADERS_HELPER_UNSUPPORTED'));
 assert.equal(JSON.stringify(result).includes(canary),false);assert.equal(result.mcpServers.length,1);
});

test('ruleset and changed rule versions are explicit without rewriting unrelated rules',()=>{
 assert.equal(RULESET_VERSION,'1.1.0');assert.equal(ruleDefinition('AF-SUPPLY-001').version,'1.1.0');assert.equal(ruleDefinition('AF-SUPPLY-002').version,'1.1.0');assert.equal(ruleDefinition('AF-SHELL-001').version,'1.0.0');
});
