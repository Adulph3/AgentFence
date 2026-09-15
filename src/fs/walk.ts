import { opendir, lstat } from 'node:fs/promises';
import type { Dirent, Stats } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { matchCandidate } from '../discovery/registry.js';
import { LIMITS } from '../application/budget.js';
export interface WalkResult { readonly files:readonly string[]; readonly visited:number; readonly limited:boolean; readonly skipped:Readonly<Record<string,number>>; }
export interface WalkOptions { readonly signal?:AbortSignal; readonly deadline?:number; readonly now?:()=>number; readonly limits?:Pick<typeof LIMITS,'entries'|'directoryEntries'|'depth'>; /** Test-only metadata seam; production always uses node lstat. */ readonly lstat?:typeof lstat; }
const configTrees=new Set(['.codex','.claude','.cursor','.kiro','.vscode']);
const ignored=new Set(['.git','node_modules','dist','build','coverage','.cache','.next','.nuxt','.turbo','.venv','venv','__pycache__','vendor','target']);
const metadataConcurrency=Math.min(4,LIMITS.readConcurrency);
export const sameDevice=(rootDevice:number,entryDevice:number)=>rootDevice===entryDevice;
/** Registry paths are portable `/`-separated identifiers, not host paths. */
export const portableRelativePath=(path:string,separator:string=sep)=>separator==='\\'?path.replaceAll('\\','/'):path;
const securityRelevantLink=(relativePath:string)=>matchCandidate(relativePath)!==undefined||relativePath.split(/[\\/]/).some(part=>configTrees.has(part));

/** Bounded, sequential traversal. Once halted, every ancestor returns without more I/O. */
export async function walk(root:string,options:WalkOptions={}):Promise<WalkResult>{
 const files:string[]=[];const skipped:Record<string,number>={};let visited=0,limited=false,halted=false;
 const limits={entries:Math.min(options.limits?.entries??LIMITS.entries,LIMITS.entries),directoryEntries:Math.min(options.limits?.directoryEntries??LIMITS.directoryEntries,LIMITS.directoryEntries),depth:Math.min(options.limits?.depth??LIMITS.depth,LIMITS.depth)};
 const now=options.now??Date.now,statPath=options.lstat??lstat,skip=(why:string)=>{skipped[why]=(skipped[why]??0)+1;},stop=(why:string)=>{if(!halted){halted=true;limited=true;skip(why);}};
 const expired=()=>{if(options.signal?.aborted){stop('interrupted');return true;}if(options.deadline!==undefined&&now()>options.deadline){stop('deadline');return true;}return halted;};
 let rootDevice:number;try{const stat=await statPath(root);if(!stat.isDirectory()||stat.isSymbolicLink())return{files,visited,limited:true,skipped:{'unreadable-directory':1}};rootDevice=stat.dev;}catch{return{files,visited,limited:true,skipped:{'unreadable-directory':1}};}
 async function visit(dir:string,depth:number):Promise<void>{
  if(expired())return;if(depth>limits.depth){limited=true;skip('depth');return;}let handle;try{handle=await opendir(dir);}catch{limited=true;skip('unreadable-directory');return;}
  const entries:Dirent[]=[];try{for await(const entry of handle){if(expired())return;if(entries.length>=limits.directoryEntries){stop('directory-entry-limit');return;}if(visited>=limits.entries){stop('entry-limit');return;}visited++;entries.push(entry);}}catch{limited=true;skip('unreadable-directory');return;}
  entries.sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
  const stats:Array<Stats|undefined>=new Array(entries.length),unreadable=new Set<number>();let next=0;
  const inspect=async()=>{while(!expired()){const index=next++;if(index>=entries.length)return;const entry=entries[index]!;if(ignored.has(entry.name))continue;try{stats[index]=await statPath(join(dir,entry.name));}catch{unreadable.add(index);}}};
  await Promise.all(Array.from({length:metadataConcurrency},inspect));
  for(let index=0;index<entries.length;index++){if(expired())return;const entry=entries[index]!;if(ignored.has(entry.name)){skip('excluded');continue;}const full=join(dir,entry.name),relativePath=portableRelativePath(relative(root,full)),stat=stats[index];if(unreadable.has(index)||!stat){limited=true;skip('unreadable-entry');continue;}if(stat.isSymbolicLink()){if(securityRelevantLink(relativePath)){limited=true;skip('supported-link');}else skip('link');continue;}if(stat.isBlockDevice()||stat.isCharacterDevice()||stat.isFIFO()||stat.isSocket()){limited=true;skip('special-file');continue;}if(!sameDevice(rootDevice,stat.dev)){limited=true;skip('cross-device');continue;}if(stat.isDirectory())await visit(full,depth+1);else if(stat.isFile())files.push(relativePath);}
 }
 await visit(root,0);return{files:files.sort((a,b)=>a<b?-1:a>b?1:0),visited,limited,skipped};
}
