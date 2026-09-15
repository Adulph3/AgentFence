import type { SourceRecord } from '../core/types.js';
export interface Adapter { readonly kind:NonNullable<SourceRecord['kind']>; readonly version:'1.0.0'; supports(source:SourceRecord):boolean; }
