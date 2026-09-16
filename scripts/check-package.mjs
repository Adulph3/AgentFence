import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import pkg from '../package.json' with {type:'json'};
import lock from '../package-lock.json' with {type:'json'};
import { validateRuleRegistry } from '../dist/src/rules/registry.js';
import { assertCatalogTestLinkage } from './check-catalog-tests.mjs';

const allowed=new Set(['@iarna/toml','jsonc-parser']);
const requiredFiles=new Set(['dist','schemas','README.md','LICENSE','SECURITY.md','THIRD_PARTY_NOTICES.md']);

export function validatePackageMetadata(packageMetadata=pkg,lockMetadata=lock){
  const root=lockMetadata.packages?.[''];
  if(packageMetadata.name!=='@adulph3/agentfence'||packageMetadata.version!=='0.2.0'||packageMetadata.private===true)throw new Error('package name, version, or public state invalid');
  if(packageMetadata.license!=='MIT')throw new Error('package license must be MIT');
  if(lockMetadata.name!==packageMetadata.name||lockMetadata.version!==packageMetadata.version||!root||root.name!==packageMetadata.name||root.version!==packageMetadata.version||root.license!==packageMetadata.license||root.engines?.node!==packageMetadata.engines?.node||root.bin?.agentfence!=='dist/src/cli/main.js')throw new Error('package and lock root metadata disagree');
  if(packageMetadata.engines?.node!=='^22.0.0 || ^24.0.0'||packageMetadata.bin?.agentfence!=='./dist/src/cli/main.js')throw new Error('runtime or CLI metadata invalid');
  if(packageMetadata.repository?.type!=='git'||packageMetadata.repository?.url!=='git+https://github.com/Adulph3/AgentFence.git'||packageMetadata.homepage!=='https://github.com/Adulph3/AgentFence#readme'||packageMetadata.bugs?.url!=='https://github.com/Adulph3/AgentFence/issues'||packageMetadata.publishConfig?.access!=='public')throw new Error('public package metadata invalid');
  if(!Array.isArray(packageMetadata.keywords)||!['security','mcp','codex','claude-code','cursor','kiro'].every(keyword=>packageMetadata.keywords.includes(keyword)))throw new Error('package keywords incomplete');
  if(Object.keys(packageMetadata.dependencies??{}).some(x=>!allowed.has(x)))throw new Error('unexpected runtime dependency');
  if(packageMetadata.type!=='module'||!packageMetadata.exports?.['./core']||!packageMetadata.exports?.['./node'])throw new Error('package surface incomplete');
  if(!Array.isArray(packageMetadata.files)||packageMetadata.files.length!==requiredFiles.size||packageMetadata.files.some(x=>!requiredFiles.has(x))||!packageMetadata.files.includes('LICENSE'))throw new Error('package files allowlist incomplete');
}

export async function checkPackage(){
  validatePackageMetadata();
  validateRuleRegistry();
  await assertCatalogTestLinkage();
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  await checkPackage();
  console.log('package checks passed');
}
