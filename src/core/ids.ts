import { createHash } from 'node:crypto';
export function stableId(...parts: readonly string[]): string { return createHash('sha256').update(parts.join('\u0000')).digest('hex').slice(0, 16); }
