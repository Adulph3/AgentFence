import { LIMITS } from '../application/budget.js';
import { ParserError } from './guards.js';
export interface MarkdownBlock { readonly prose:string; readonly fenced:boolean; readonly quote:boolean; }
export function markdownBlocks(text:string):readonly MarkdownBlock[]{if(Buffer.byteLength(text)>LIMITS.fileBytes)throw new ParserError('AF_PARSE_LIMIT');const out:MarkdownBlock[]=[];let fence=false;for(const line of text.split(/\n/)){if(Buffer.byteLength(line)>LIMITS.stringBytes)throw new ParserError('AF_PARSE_STRING');if(/^\s*(?:```|~~~)/.test(line)){fence=!fence;continue;}out.push({prose:line,fenced:fence,quote:/^\s*>/.test(line)});}if(fence)throw new ParserError('AF_MARKDOWN_FENCE');return out;}
