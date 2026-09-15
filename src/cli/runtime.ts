import type { ScanReport } from '../core/types.js';
import type { ScanRequest } from '../node/index.js';
import { jsonFailure, jsonReport } from '../reporters/json.js';
import { scanError } from '../security/errors.js';
import { exclusiveWrite, type ExclusiveWriteReceipt } from '../fs/output.js';

/** Internal runtime/exit helpers: no CLI or environment bypass is exposed. */
export const runtimeSupported=(version:string):boolean=>version.split('.')[0]==='24';
export const reportExit=(report:ScanReport,interrupted=false):number=>report.errors.some(error=>error.effect==='fatal')?2:interrupted?130:report.status==='partial'?3:report.thresholdExceeded?1:0;
export interface ScanRunnerServices { readonly runtimeVersion:string; scan(request:ScanRequest,signal?:AbortSignal):Promise<ScanReport>; writeReport(text:string):Promise<void>; writeDiagnostic(text:string):Promise<void>; writeOutput?(text:string,signal?:AbortSignal):Promise<void>; /** Identity-bound destination rollback after a post-write observed interrupt. */ cleanupOutput?():Promise<void>; render?(report:ScanReport):string; }
/** Internal production destination service; it is not part of the package API. */
export const destinationWriter=(path:string,writeDiagnostic:(text:string,signal?:AbortSignal)=>Promise<void>):Pick<ScanRunnerServices,'writeOutput'|'cleanupOutput'>=>{
 let receipt:ExclusiveWriteReceipt|undefined;
 return{
  writeOutput:async(text,signal)=>{receipt=await exclusiveWrite(path,text,{...(signal?{signal}:{}),acknowledge:async()=>{if(signal?.aborted)throw new Error('AF_INTERRUPTED');await writeDiagnostic('AgentFence report written\n',signal);if(signal?.aborted)throw new Error('AF_INTERRUPTED');}});},
  cleanupOutput:async()=>{await receipt?.discard();}
 };
};
const interruptedReport=(report:ScanReport):ScanReport=>({
 ...report,
 status:'partial',
 errors:report.errors.some(error=>error.code==='AF_INTERRUPTED')?report.errors:[...report.errors,scanError('AF_INTERRUPTED','analyze','partial')],
 score:{...report.score,provisional:true}
});
const failure=async(services:ScanRunnerServices,json:boolean,code:string):Promise<number>=>{try{if(json&&!services.writeOutput)await services.writeReport(jsonFailure(code));else await services.writeDiagnostic('AgentFence request failed\n');}catch{}return 2;};
/** Non-public orchestration seam for CLI tests; real main supplies process/runtime services. */
export async function runScan(request:ScanRequest,json:boolean,interrupted:boolean,services:ScanRunnerServices,signal?:AbortSignal):Promise<number>{
 if(!runtimeSupported(services.runtimeVersion))return failure(services,json,'AF_RUNTIME_UNSUPPORTED');
 let report:ScanReport;
 try{report=await services.scan(request,signal);}catch{return failure(services,json,'AF_INTERNAL');}
 if(report.errors.some(error=>error.effect==='fatal'))return failure(services,json,report.errors[0]?.code??'AF_ROOT_INVALID');
 const isInterrupted=()=>interrupted||signal?.aborted===true;
 // A pre-emission interrupt is representable in the report. Once a stream or
 // destination writer has started, already-emitted bytes cannot be safely
 // rewritten; that phase still returns 130 so callers never treat it as success.
 const wasInterrupted=isInterrupted(),outputReport=wasInterrupted?interruptedReport(report):report;
 let output:string;
 try{output=jsonReport(outputReport);}catch{return failure(services,json,'AF_OUTPUT_FAILURE');}
 try{if(services.writeOutput)await services.writeOutput(output,signal);else await services.writeReport(json?output:(services.render?.(outputReport)??'AgentFence report completed\n'));}catch(error){if(error instanceof Error&&error.message==='AF_INTERRUPTED')return 130;return failure(services,json,'AF_OUTPUT_FAILURE');}
 if(services.writeOutput&&isInterrupted()){try{await services.cleanupOutput?.();}catch{return failure(services,json,'AF_OUTPUT_FAILURE');}return 130;}
 return reportExit(outputReport,isInterrupted());
}
