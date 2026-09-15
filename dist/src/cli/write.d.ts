/** A narrow CLI sink that can abandon a backpressured diagnostic on interruption. */
export interface CallbackTextSink {
    write(text: string, callback: (error?: Error | null) => void): unknown;
}
export declare const writeInterruptibly: (stream: CallbackTextSink, text: string, signal?: AbortSignal) => Promise<void>;
