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
  if(packageMetadata.license!=='MIT')throw new Error('package license must be MIT');
  if(!root||root.name!==packageMetadata.name||root.version!==packageMetadata.version||root.license!==packageMetadata.license)throw new Error('package and lock root metadata disagree');
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
