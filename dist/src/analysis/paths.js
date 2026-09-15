export function rootClass(value) { const normalized = value.replace(/\\/g, '/'); if (/^\\\\[?.+/.test(value)||/^\\\.\\/.test(value)||/^[A-Za-z]:.*:/.test(value))
    return 'other'; if (/^(?:\/root\/\.ssh|\/home\/[^/]+\/\.ssh|\/Users\/[^/]+\/\.ssh|[A-Za-z]:\/Users\/[^/]+\/\.ssh)(?:\/|$)/i.test(normalized))
    return 'sensitive'; if (/^(?:~|\/root(?:\/|$)|\/home\/|\/Users\/|[A-Za-z]:\/Users\/)/i.test(normalized))
    return 'home'; if (normalized === '/' || /^[A-Za-z]:\/$/.test(normalized) || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized))
    return 'filesystem'; if (normalized.startsWith('../') || normalized === '..')
    return 'filesystem'; if (normalized === '.' || normalized.startsWith('./'))
    return 'project'; return 'unknown'; }
export function endpointClass(value) { if (/\$\{(?:env:|input:|command:)/.test(value))
    return { scheme: 'other', hostClass: 'unresolved' }; try {
    const u = new URL(value);
    const h = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    const loopback = h === '::1' || /^127\./.test(h);
    const privateIp = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || /^f[cd][0-9a-f]{2}:/i.test(h);
    return { scheme: u.protocol === 'https:' ? 'https' : u.protocol === 'http:' ? 'http' : 'other', hostClass: loopback ? 'loopback-literal' : privateIp ? 'private-literal' : 'other' };
}
catch {
    return undefined;
} }
//# sourceMappingURL=paths.js.map