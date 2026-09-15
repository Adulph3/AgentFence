export interface MarkdownBlock {
    readonly prose: string;
    readonly fenced: boolean;
    readonly quote: boolean;
}
export declare function markdownBlocks(text: string): readonly MarkdownBlock[];
