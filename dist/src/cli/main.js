#!/usr/bin/env node
import { parseArgs } from './args.js';
import { scanProject } from '../node/index.js';
import { terminalReport } from '../reporters/terminal.js';
import { jsonFailure } from '../reporters/json.js';
import { runDoctor } from './doctor.js';
import { destinationWriter, runScan, runtimeSupported } from './runtime.js';
import { writeInterruptibly } from './write.js';
const usage = 'Usage: agentfence scan [path] [--json] [--output PATH] [--severity LEVEL] [--fail-on LEVEL] [--user-configs] [--no-color]\n       agentfence doctor [--json]\n';
const write = (stream, text, signal) => writeInterruptibly(stream, text, signal);
const fail = async (json, code, outputRequested = false) => { try {
    if (json && !outputRequested)
        await write(process.stdout, jsonFailure(code));
    else
        await write(process.stderr, 'AgentFence request failed\n');
}
catch { } return 2; };
/** Callback rejection controls exit precedence; listeners merely prevent a raw stream error. */
process.stdout.on('error', () => { });
process.stderr.on('error', () => { });
const argv = process.argv.slice(2);
let parsed;
try {
    parsed = parseArgs([...argv]);
}
catch {
    process.exitCode = await fail(argv.includes('--json'), 'AF_USAGE', argv.includes('--output'));
}
if (parsed) {
    if (parsed.command === 'help') {
        try {
            await write(process.stdout, usage);
        }
        catch {
            process.exitCode = 2;
        }
    }
    else if (parsed.command === 'version') {
        try {
            await write(process.stdout, '0.2.0\n');
        }
        catch {
            process.exitCode = 2;
        }
    }
    else if (!runtimeSupported(process.versions.node))
        process.exitCode = await fail(parsed.json, 'AF_RUNTIME_UNSUPPORTED', Boolean(parsed.output));
    else if (parsed.command === 'doctor') {
        try {
            const result = runDoctor(parsed.json);
            await write(process.stdout, result.output);
            process.exitCode = result.exitCode;
        }
        catch {
            process.exitCode = 2;
        }
    }
    else {
        const controller = new AbortController(), onInterrupt = () => controller.abort();
        process.once('SIGINT', onInterrupt);
        try {
            process.exitCode = await runScan(parsed.request, parsed.json, false, { runtimeVersion: process.versions.node, scan: (request, signal) => scanProject(request, {}, signal), writeReport: text => write(process.stdout, text), writeDiagnostic: text => write(process.stderr, text), ...(parsed.output ? destinationWriter(parsed.output, (text, signal) => write(process.stderr, text, signal)) : {}), render: report => terminalReport(report, !parsed.noColor && Boolean(process.stdout.isTTY) && !process.env.NO_COLOR) }, controller.signal);
        }
        finally {
            process.removeListener('SIGINT', onInterrupt);
        }
    }
}
//# sourceMappingURL=main.js.map