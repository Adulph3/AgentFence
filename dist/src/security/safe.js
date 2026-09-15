/** Creates bounded ASCII-safe report text from scanner-authored templates only. */
export function safe(value) {
    let text = '';
    for (const character of value) {
        const point = character.codePointAt(0);
        const token = point >= 0x20 && point <= 0x7e ? character : point <= 0xffff ? `\\u${point.toString(16).toUpperCase().padStart(4, '0')}` : `\\u{${point.toString(16).toUpperCase()}}`;
        if (text.length + token.length > 480)
            break;
        text += token;
    }
    return text;
}
export function opaque(kind, ordinal) { return safe(`${kind}-${ordinal}`); }
export function escapeTerminal(value) {
    let out = '';
    for (const c of value) {
        const n = c.codePointAt(0);
        out += n >= 0x20 && n <= 0x7e && c !== '\\' ? c : n <= 0xffff ? `\\u${n.toString(16).toUpperCase().padStart(4, '0')}` : `\\u{${n.toString(16).toUpperCase()}}`;
    }
    return out;
}
export function safeJson(value) { return JSON.stringify(value, (_key, item) => typeof item === 'string' ? escapeTerminal(item) : item); }
//# sourceMappingURL=safe.js.map