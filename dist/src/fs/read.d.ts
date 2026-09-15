import { lstat } from 'node:fs/promises';
export declare class ReadError extends Error {
    readonly code: 'AF_READ_REJECTED' | 'AF_FILE_CHANGED' | 'AF_BINARY_INPUT' | 'AF_OVERSIZED_INPUT' | 'AF_LINK_INPUT' | 'AF_TOTAL_BYTES';
    constructor(code: 'AF_READ_REJECTED' | 'AF_FILE_CHANGED' | 'AF_BINARY_INPUT' | 'AF_OVERSIZED_INPUT' | 'AF_LINK_INPUT' | 'AF_TOTAL_BYTES');
}
export interface CheckedPathOptions {
    readonly lstat?: typeof lstat;
}
export declare function checkedDirectory(root: string, relativePath: string, options?: CheckedPathOptions): Promise<void>;
type ReadHandle = {
    read(buffer: Buffer, offset: number, length: number, position: number): Promise<{
        bytesRead: number;
    }>;
};
/** Read a verified snapshot completely; a short EOF is a change, never partial input. */
export declare function readExact(handle: ReadHandle, expected: number): Promise<Buffer>;
export interface CheckedReadOptions extends CheckedPathOptions {
    readonly reserveBytes?: (size: number) => boolean;
    readonly afterRead?: () => void | Promise<void>;
}
export declare function checkedRead(root: string, relativePath: string, options?: CheckedReadOptions): Promise<string>;
export {};
