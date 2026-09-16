import { jsonFailure, jsonReport } from '../reporters/json.js';
import { scanError } from '../security/errors.js';
import { exclusiveWrite } from '../fs/output.js';
/** Internal runtime/exit helpers: no CLI or environment bypass is exposed. */
export const runtimeSupported = (version) => /^(?:22|24)\.\d+\.\d+$/.test(version);
export const reportExit = (report, interrupted = false) => report.errors.some(error => error.effect === 'fatal') ? 2 : interrupted ? 130 : report.status === 'partial' ? 3 : report.thresholdExceeded ? 1 : 0;
/** Internal production destination service; it is not part of the package API. */
export const destinationWriter = (path, writeDiagnostic) => {
    let receipt;
    return {
        writeOutput: async (text, signal) => { receipt = await exclusiveWrite(path, text, { ...(signal ? { signal } : {}), acknowledge: async () => { if (signal?.aborted)
                throw new Error('AF_INTERRUPTED'); await writeDiagnostic('AgentFence report written\n', signal); if (signal?.aborted)
                throw new Error('AF_INTERRUPTED'); } }); },
        cleanupOutput: async () => { await receipt?.discard(); }
    };
};
const interruptedReport = (report) => ({
    ...report,
    status: 'partial',
    errors: report.errors.some(error => error.code === 'AF_INTERRUPTED') ? report.errors : [...report.errors, scanError('AF_INTERRUPTED', 'analyze', 'partial')],
    score: { ...report.score, provisional: true }
});
const failure = async (services, json, code) => { try {
    if (json && !services.writeOutput)
        await services.writeReport(jsonFailure(code));
    else
        await services.writeDiagnostic('AgentFence request failed\n');
}
catch { } return 2; };
/** Non-public orchestration seam for CLI tests; real main supplies process/runtime services. */
export async function runScan(request, json, interrupted, services, signal) {
    if (!runtimeSupported(services.runtimeVersion))
        return failure(services, json, 'AF_RUNTIME_UNSUPPORTED');
    let report;
    try {
        report = await services.scan(request, signal);
    }
    catch {
        return failure(services, json, 'AF_INTERNAL');
    }
    if (report.errors.some(error => error.effect === 'fatal'))
        return failure(services, json, report.errors[0]?.code ?? 'AF_ROOT_INVALID');
    const isInterrupted = () => interrupted || signal?.aborted === true;
    // A pre-emission interrupt is representable in the report. Once a stream or
    // destination writer has started, already-emitted bytes cannot be safely
    // rewritten; that phase still returns 130 so callers never treat it as success.
    const wasInterrupted = isInterrupted(), outputReport = wasInterrupted ? interruptedReport(report) : report;
    let output;
    try {
        output = jsonReport(outputReport);
    }
    catch {
        return failure(services, json, 'AF_OUTPUT_FAILURE');
    }
    try {
        if (services.writeOutput)
            await services.writeOutput(output, signal);
        else
            await services.writeReport(json ? output : (services.render?.(outputReport) ?? 'AgentFence report completed\n'));
    }
    catch (error) {
        if (error instanceof Error && error.message === 'AF_INTERRUPTED')
            return 130;
        return failure(services, json, 'AF_OUTPUT_FAILURE');
    }
    if (services.writeOutput && isInterrupted()) {
        try {
            await services.cleanupOutput?.();
        }
        catch {
            return failure(services, json, 'AF_OUTPUT_FAILURE');
        }
        return 130;
    }
    return reportExit(outputReport, isInterrupted());
}
//# sourceMappingURL=runtime.js.map