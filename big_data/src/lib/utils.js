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
export async function trackView(url) {
    if (!url) return;
    try {
        await fetch('/api/news/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });
    } catch (err) {
        console.error('Failed to track view:', err);
    }
}
