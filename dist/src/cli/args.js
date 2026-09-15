const levels = new Set(['info', 'low', 'medium', 'high', 'critical']);
function level(v, fail = false) { if ((fail && v === 'none') || levels.has(v))
    return v; throw new Error('invalid severity'); }
export function parseArgs(argv) { if (argv.length === 0)
    return { command: 'help', json: false, noColor: false }; if (argv[0] === '--help' || argv[0] === '-h')
    return { command: 'help', json: false, noColor: false }; if (argv[0] === '--version' || argv[0] === '-V')
    return { command: 'version', json: false, noColor: false }; const command = argv.shift(); if (command === 'doctor') {
    let json = false;
    for (const a of argv) {
        if (a === '--json') {
            if (json)
                throw new Error('duplicate json');
            json = true;
        }
        else
            throw new Error('invalid doctor argument');
    }
    return { command: 'doctor', json, noColor: true };
} if (command !== 'scan')
    throw new Error('unknown command'); let json = false, userConfigs = false, noColor = false; let output, path, min = 'info', fail = 'high'; let severitySeen = false, failSeen = false; for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
        const p = argv[++i];
        if (!p || path || i !== argv.length - 1)
            throw new Error('invalid path');
        path = p;
        break;
    }
    if (a === '--json') {
        if (json)
            throw new Error('duplicate json');
        json = true;
    }
    else if (a === '--user-configs') {
        if (userConfigs)
            throw new Error('duplicate user configs');
        userConfigs = true;
    }
    else if (a === '--no-color') {
        if (noColor)
            throw new Error('duplicate no color');
        noColor = true;
    }
    else if (['--output', '--severity', '--fail-on'].includes(a)) {
        const v = argv[++i];
        if (!v)
            throw new Error('missing option value');
        if (a === '--output') {
            if (output)
                throw new Error('duplicate output');
            output = v;
        }
        else if (a === '--severity') {
            if (severitySeen)
                throw new Error('duplicate severity');
            severitySeen = true;
            min = level(v);
        }
        else {
            if (failSeen)
                throw new Error('duplicate fail on');
            failSeen = true;
            fail = level(v, true);
        }
    }
    else if (a.startsWith('-'))
        throw new Error('unknown option');
    else {
        if (path)
            throw new Error('multiple paths');
        path = a;
    }
} return { command: 'scan', json, output, noColor, request: { ...(path ? { path } : {}), userConfigs, minimumSeverity: min, failOn: fail } }; }
//# sourceMappingURL=args.js.map