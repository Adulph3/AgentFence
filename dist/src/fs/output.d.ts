import { open } from 'node:fs/promises';
type OutputHandle = Awaited<ReturnType<typeof open>>;
export interface ExclusiveWriteOptions {
    /** Test seam for a failed body write; production always uses FileHandle.writeFile. */
    readonly write?: (handle: OutputHandle, data: string) => Promise<void>;
    /** Test seam for close failures; production always uses FileHandle.close. */
    readonly close?: (handle: OutputHandle) => Promise<void>;
    /** Runs only after the new file has closed successfully, within the abort transaction. */
    readonly acknowledge?: () => Promise<void>;
    /** A caller-owned interruption can only remove this newly-created identity. */
    readonly signal?: AbortSignal;
}
export interface ExclusiveWriteReceipt {
    readonly discard: () => Promise<void>;
}
export declare function exclusiveWrite(path: string, data: string, options?: ExclusiveWriteOptions): Promise<ExclusiveWriteReceipt>;
export {};
