import type { Applicability, Confidence } from '../core/types.js';

/** Private adapter fact: never serialized directly. */
export interface CapabilityFact {
  readonly principal: string;
  readonly sourceId: string;
  readonly kind: 'process-launch'|'shell'|'network'|'sensitive-env'|'filesystem-read'|'filesystem-write'|'approval-bypass';
  readonly basis: 'explicit-config'|'recognized-command'|'text-request'|'inferred';
  readonly confidence: Confidence;
  readonly applicability: Applicability;
}
export function applicability(enabled: unknown): Applicability { return enabled===false?'inactive':enabled===true?'potential':'unknown'; }
