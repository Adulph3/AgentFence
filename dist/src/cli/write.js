export const writeInterruptibly = (stream, text, signal) => new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    const succeed = () => { if (settled)
        return; settled = true; cleanup(); resolve(); };
    const fail = (error) => { if (settled)
        return; settled = true; cleanup(); reject(error); };
    const onAbort = () => fail(new Error('AF_INTERRUPTED'));
    if (signal?.aborted) {
        onAbort();
        return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
        stream.write(text, error => error ? fail(error) : succeed());
    }
    catch (error) {
        fail(error);
    }
});
//# sourceMappingURL=write.js.map