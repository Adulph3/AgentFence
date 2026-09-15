import type { Applicability, Category, Confidence, Evidence, Finding, Location, Severity } from '../core/types.js';
import { stableId } from '../core/ids.js';
import { safe } from '../security/safe.js';
import { ruleDefinition } from '../rules/registry.js';
export interface FindingContext {
 readonly principalId?: string;
 /** A fixed rule-owned key, never a value copied from scanned input. */
 readonly semanticFactKey?: string;
 readonly evidenceKind?: Evidence['kind'];
 readonly factIds?: readonly string[];
 readonly codePoints?: readonly string[];
 readonly relatedFindingIds?: readonly string[];
}

export function finding(ruleId:string, category:Category, severity:Severity, confidence:Confidence, location:Location, summary:string, recommendation:string, applicability:Applicability='potential', agentIds:readonly string[]=[], context:FindingContext={}): Finding {
 const rule=ruleDefinition(ruleId);if(rule.category!==category)throw new Error('AF_RULE_CATEGORY');
 const principal=context.principalId??'source';
 const semantic=context.semanticFactKey??`location-${String(location.field??location.line??0)}`;
 const id=stableId('finding',ruleId,'1.0.0',location.sourceId,principal,semantic);
 // Unicode IDs retain standard U+ notation. Only the public risk key replaces
 // that fixed token with its schema-safe structural spelling.
 const riskSemantic=semantic.startsWith('unicode:')?semantic.replace(':U+',':U'):semantic;
 const factIds=[...new Set(context.factIds??[`F-${stableId('fact',ruleId,location.sourceId,principal,semantic)}`])].sort();
 const relatedFindingIds=[...new Set(context.relatedFindingIds??[])].sort();
 return{id,ruleId,ruleVersion:rule.version,title:safe(rule.title),severity,category,description:safe(summary),evidence:{kind:context.evidenceKind??'field',summary:safe(summary),factIds,...(context.codePoints?{codePoints:context.codePoints.map(safe)}:{})},location,relatedLocations:[],recommendation:safe(rule.recommendation),confidence,applicability,agentIds,...(context.principalId?{principalId:context.principalId}:{}),riskKey:`${category}:${ruleId}:${location.sourceId}:${principal}:${riskSemantic}`,references:rule.references,relatedFindingIds};
}
