import { open, lstat, unlink } from 'node:fs/promises';
import { dirname, join, parse, relative, resolve } from 'node:path';
import { LIMITS } from '../application/budget.js';
type Identity={readonly dev:number;readonly ino:number};
type OutputHandle=Awaited<ReturnType<typeof open>>;
const missing=(error:unknown)=>typeof error==='object'&&error!==null&&'code'in error&&(error as {code?:unknown}).code==='ENOENT';
/** Reject namespaces, UNC paths, drive-relative paths, and ADS syntax. */
export function outputPathLexicallySafe(path:string,platform:NodeJS.Platform=process.platform):boolean{
  if(!path||path.includes('\0')||/^(?:\\\\|\/\/)/.test(path)||/^(?:\\\\[?.]|\/\/[?.])/.test(path))return false;
  const driveAbsolute=/^[a-zA-Z]:[\\/]/.test(path);
  if(platform==='win32'&&driveAbsolute)return!path.slice(2).includes(':');
  return!/^[a-zA-Z]:/.test(path)&&!path.includes(':');
}
async function checkedParent(destination:string):Promise<void>{if(destination===parse(destination).root)throw new Error('AF_OUTPUT_PATH');const root=parse(destination).root,parent=dirname(destination),parts=relative(root,parent).split(/[\\/]/).filter(Boolean);let current=root;try{const rootStat=await lstat(root);if(!rootStat.isDirectory()||rootStat.isSymbolicLink())throw new Error('AF_OUTPUT_PARENT');for(const part of parts){current=join(current,part);const entry=await lstat(current);if(!entry.isDirectory()||entry.isSymbolicLink())throw new Error('AF_OUTPUT_PARENT');}}catch(error){if(error instanceof Error&&/^AF_OUTPUT_/.test(error.message))throw error;throw new Error('AF_OUTPUT_PARENT');}try{await lstat(destination);throw new Error('AF_OUTPUT_EXISTS');}catch(error){if(missing(error))return;if(error instanceof Error&&/^AF_OUTPUT_/.test(error.message))throw error;throw new Error('AF_OUTPUT_PARENT');}}
async function removeCreated(destination:string,identity:Identity|undefined):Promise<void>{if(!identity)return;try{const entry=await lstat(destination);if(entry.isFile()&&!entry.isSymbolicLink()&&entry.nlink===1&&entry.dev===identity.dev&&entry.ino===identity.ino)await unlink(destination);}catch{/* Cleanup is identity-bound and best-effort. */}}
export interface ExclusiveWriteOptions {
  /** Test seam for a failed body write; production always uses FileHandle.writeFile. */
  readonly write?:(handle:OutputHandle,data:string)=>Promise<void>;
  /** Test seam for close failures; production always uses FileHandle.close. */
  readonly close?:(handle:OutputHandle)=>Promise<void>;
  /** Runs only after the new file has closed successfully, within the abort transaction. */
  readonly acknowledge?:()=>Promise<void>;
  /** A caller-owned interruption can only remove this newly-created identity. */
  readonly signal?:AbortSignal;
}
export interface ExclusiveWriteReceipt { readonly discard:()=>Promise<void>; }
export async function exclusiveWrite(path:string,data:string,options:ExclusiveWriteOptions={}):Promise<ExclusiveWriteReceipt>{
  if(options.signal?.aborted)throw new Error('AF_INTERRUPTED');
  if(!outputPathLexicallySafe(path))throw new Error('AF_OUTPUT_PATH');
  if(Buffer.byteLength(data)>LIMITS.outputBytes)throw new Error('AF_OUTPUT_LIMIT');
  const destination=resolve(path);await checkedParent(destination);
  let h:OutputHandle|undefined,identity:Identity|undefined,created=false,failed:unknown;
  try{
    h=await open(destination,'wx',0o600);created=true;
    const stat=await h.stat();if(!stat.isFile()||stat.nlink!==1)throw new Error('AF_OUTPUT_UNSAFE');
    identity={dev:stat.dev,ino:stat.ino};
    if(options.write)await options.write(h,data);else await h.writeFile(data,{encoding:'utf8'});
    if(options.signal?.aborted)throw new Error('AF_INTERRUPTED');
    if(options.close)await options.close(h);else await h.close();
    h=undefined;
    if(options.signal?.aborted)throw new Error('AF_INTERRUPTED');
    if(options.acknowledge)await options.acknowledge();
    if(options.signal?.aborted)throw new Error('AF_INTERRUPTED');
  }catch(error){
    failed=error;
    if(created&&!identity&&h)try{const stat=await h.stat();identity={dev:stat.dev,ino:stat.ino};}catch{/* Without an identity, cleanup must not risk deleting a replacement. */}
  }
  try{await h?.close();}catch(error){failed??=error;}
  if(options.signal?.aborted)failed??=new Error('AF_INTERRUPTED');
  if(failed){await removeCreated(destination,identity);throw failed;}
  return{discard:()=>removeCreated(destination,identity)};
}
