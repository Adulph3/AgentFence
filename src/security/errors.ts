import { safe } from './safe.js';
import type { ScanError } from '../core/types.js';
export function scanError(code: string, stage: ScanError['stage'], effect: ScanError['effect'], sourceId?: string): ScanError {
  return { code, stage, effect, retryable: false, ...(sourceId ? { sourceId } : {}), message: safe(`Scanner recorded ${code.replace(/[^A-Z0-9_-]/g, '')}`) };
}
