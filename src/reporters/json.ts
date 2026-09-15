import type { ScanReport } from '../core/types.js';
import { safeJson } from '../security/safe.js';
import { LIMITS } from '../application/budget.js';
export function jsonReport(report:ScanReport):string{const output=safeJson(report)+'\n';if(Buffer.byteLength(output)>LIMITS.outputBytes)throw new Error('AF_OUTPUT_LIMIT');return output;}
export function jsonFailure(code:string):string{return safeJson({kind:'failure',schemaVersion:'1.0.0',engineVersion:'0.1.0',errors:[{code,message:'Scanner request failed'}]})+'\n';}
