export function decodeHtml(text) {
    if (!text) return "";
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': "'",
        '&#39;': "'"
    };
    return text.replace(/&[a-zA-Z0-9#]+;/g, key => entities[key] || key);
}
