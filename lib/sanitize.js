// Strip HTML tags and dangerous patterns from user input
export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// Validate URL - only allow http/https
export function isValidUrl(url) {
  if (!url) return true; // empty is ok
  const lower = url.toLowerCase().trim();
  return lower.startsWith('http://') || lower.startsWith('https://');
}
