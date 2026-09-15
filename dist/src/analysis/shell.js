const MAX_CHARS = 8192, MAX_TOKENS = 2048, MAX_NESTING = 16;
export function tokenizeCommand(input) {
    if (input.length > MAX_CHARS)
        return { tokens: [], separators: [], segments: [], unsupported: true };
    const tokens = [], separators = [], segments = [[]];
    let word = '', quote = '', escaped = false, nesting = 0;
    const push = () => { if (word) {
        tokens.push(word);
        segments[segments.length - 1].push(word);
        word = '';
    } };
    const boundary = (separator) => { push(); separators.push(separator); segments.push([]); };
    for (let index = 0; index < input.length; index++) {
        const char = input[index];
        if (escaped) {
            word += char;
            escaped = false;
            continue;
        }
        if (char === '\\' && quote !== "'") {
            escaped = true;
            continue;
        }
        if (quote) {
            if (char === quote)
                quote = '';
            else
                word += char;
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }
        if (char === '$' && input[index + 1] === '(') {
            if (++nesting > MAX_NESTING)
                return { tokens, separators, segments, unsupported: true };
            push();
            separators.push('$(');
            index++;
            continue;
        }
        if (char === ')' && nesting) {
            nesting--;
            push();
            separators.push(')');
            continue;
        }
        if (char === '\n') {
            boundary(';');
            continue;
        }
        if (/\s/.test(char)) {
            push();
            continue;
        }
        if (char === '|' || char === ';' || char === '`' || (char === '&' && input[index + 1] === '&')) {
            if (char === '&')
                index++;
            if (char === '|' || char === ';' || char === '&')
                boundary(char === '&' ? '&&' : char);
            else {
                push();
                separators.push(char);
            }
            continue;
        }
        word += char;
        if (tokens.length > MAX_TOKENS)
            return { tokens, separators, segments, unsupported: true };
    }
    push();
    return { tokens, separators, segments, unsupported: Boolean(quote || escaped || nesting || tokens.length > MAX_TOKENS) };
}
const executable = (value) => value?.split(/[\\/]/).pop()?.toLowerCase() ?? '';
const exact = (word) => /(?:^|@)\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(word);
const packageSelector = (words) => {
    const command = executable(words[0]);
    let start = 1;
    if (command === 'npm') {
        if (words[1] !== 'exec')
            return false;
        start = 2;
    }
    else if (command !== 'npx')
        return false;
    for (let index = start; index < words.length; index++) {
        const word = words[index];
        if (word === '-p' || word === '--package')
            return exact(words[index + 1] ?? '') ? 'exact' : 'mutable';
        if (word.startsWith('--package='))
            return exact(word.slice('--package='.length)) ? 'exact' : 'mutable';
        if (word === '--')
            return exact(words[index + 1] ?? '') ? 'exact' : 'mutable';
        if (word.startsWith('-'))
            continue;
        return exact(word) ? 'exact' : 'mutable';
    }
    return 'mutable';
};
const rmTarget = (words) => {
    let recursive = false, force = false, options = true;
    const targets = [];
    for (const word of words.slice(1)) {
        if (options && word === '--') {
            options = false;
            continue;
        }
        if (options && word.startsWith('--')) {
            if (word === '--recursive')
                recursive = true;
            if (word === '--force')
                force = true;
            continue;
        }
        if (options && /^-[^-]+$/.test(word)) {
            const flags = word.slice(1);
            recursive ||= flags.includes('r') || flags.includes('R');
            force ||= flags.includes('f');
            continue;
        }
        targets.push(word);
    }
    if (!recursive || !force)
        return false;
    const classify = (target) => {
        if (target === '/' || target === '~' || target.startsWith('~/') || target === '$HOME' || target.startsWith('$HOME/') || /^\/root(?:\/|$)/.test(target) || /^\/(?:home|Users)(?:\/|$)/.test(target) || /^[A-Za-z]:[\\/]?$/.test(target) || /^[A-Za-z]:[\\/]Users(?:[\\/]|$)/i.test(target))
            return 'root';
        if (target.startsWith('./') || /^(?:dist|build|coverage)(?:[\\/]|$)/.test(target))
            return 'project';
        return 'other';
    };
    // Every positional target matters: a benign build cleanup followed by a home
    // target is still a root-class recursive delete.
    return targets.some(target => classify(target) === 'root') ? 'root' : targets.some(target => classify(target) === 'project') ? 'project' : 'other';
};
const sudoNested = (words) => { let index = 1; const withValue = new Set(['-u', '--user', '-g', '--group', '-h', '--host', '-p', '--prompt', '-r', '--role', '-t', '--type', '-C', '--close-from']), withoutValue = new Set(['-A', '-b', '-E', '-H', '-i', '-K', '-k', '-l', '-n', '-s', '-S', '-v', '-V', '--askpass', '--background', '--edit', '--help', '--invalidate', '--kill', '--list', '--non-interactive', '--preserve-env', '--shell', '--stdin', '--validate', '--version']), assignment = /^[A-Za-z_][A-Za-z0-9_]*=.*/; for (; index < words.length; index++) {
    const word = words[index];
    if (word === '--') {
        index++;
        break;
    }
    if (!word.startsWith('-'))
        break;
    if (withValue.has(word)) {
        if (index + 1 >= words.length)
            return { words: [], unsupported: true };
        index++;
        continue;
    }
    if (withoutValue.has(word))
        continue;
    return { words: [], unsupported: true };
} while (index < words.length && assignment.test(words[index]))
    index++; if (index < words.length && words[index].includes('='))
    return { words: [], unsupported: true }; return { words: words.slice(index), unsupported: false }; };
const one = (words) => { const command = executable(words[0]); let nested = words, unsupported = false; if (command === 'sudo') {
    const parsed = sudoNested(words);
    nested = parsed.words;
    unsupported = parsed.unsupported;
} const nestedCommand = executable(nested[0]); const rmrf = nestedCommand === 'rm' ? rmTarget(nested) : false; const push = nestedCommand === 'git' && nested[1] === 'push' ? (nested.includes('--force-with-lease') ? 'lease' : nested.some(word => word === '--force' || word === '-f') ? 'force' : 'normal') : false; return { sudo: command === 'sudo', rmrf, push, supply: nestedCommand === 'npx' || (nestedCommand === 'npm' && nested[1] === 'exec') ? packageSelector(nested) : false, unsupported }; };
const strongestRm = (facts) => facts.some(f => f.rmrf === 'root') ? 'root' : facts.some(f => f.rmrf === 'project') ? 'project' : facts.some(f => f.rmrf === 'other') ? 'other' : false;
const strongestPush = (facts) => facts.some(f => f.push === 'force') ? 'force' : facts.some(f => f.push === 'lease') ? 'lease' : facts.some(f => f.push === 'normal') ? 'normal' : false;
const supply = (facts) => facts.some(f => f.supply === 'mutable') ? 'mutable' : facts.some(f => f.supply === 'exact') ? 'exact' : false;
const downloader = (words) => /^(?:curl|wget)$/i.test(executable(words[0]));
const interpreter = (words) => /^(?:sh|bash|zsh|dash)$/i.test(executable(words[0]));
const classify = (segments, separators, shell, unsupported) => {
    const facts = segments.filter(words => words.length > 0).map(one);
    const remotePipe = shell && separators.some((separator, index) => separator === '|' && downloader(segments[index] ?? []) && interpreter(segments[index + 1] ?? []));
    return { shell, sudo: facts.some(f => f.sudo), rmrf: strongestRm(facts), chain: shell && separators.some(value => value === '&&' || value === ';' || value === '$(' || value === '`'), push: strongestPush(facts), supply: supply(facts), remotePipe, unsupported: unsupported || facts.some(f => f.unsupported) };
};
const blank = (unsupported) => ({ shell: false, sudo: false, rmrf: false, chain: false, push: false, supply: false, remotePipe: false, unsupported });
export function analyzeArgv(argv) {
    const command = executable(argv[0]);
    if (/^(?:powershell|pwsh|cmd)(?:\.exe)?$/.test(command))
        return blank(true);
    const shell = /^(?:sh|bash|zsh|dash|fish)(?:\.exe)?$/.test(command), flag = argv.indexOf('-c');
    if (shell) {
        if (flag < 0 || typeof argv[flag + 1] !== 'string')
            return blank(true);
        const parsed = tokenizeCommand(argv[flag + 1]);
        return parsed.unsupported ? blank(true) : classify(parsed.segments, parsed.separators, true, false);
    }
    return classify([argv], [], false, false);
}
export function analyzeCommand(input) { const parsed = tokenizeCommand(input); return parsed.unsupported ? blank(true) : classify(parsed.segments, parsed.separators, true, false); }
//# sourceMappingURL=shell.js.map