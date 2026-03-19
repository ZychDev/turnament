const hits = new Map();

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of hits) {
    const filtered = timestamps.filter((t) => now - t < 120_000);
    if (filtered.length === 0) hits.delete(key);
    else hits.set(key, filtered);
  }
}, 60_000).unref?.();

/**
 * Create a rate limiter.
 * @param {number} limit  Max requests allowed in the window (default 60)
 * @param {number} windowMs  Window size in ms (default 60 000)
 * @returns {(req: Request) => { success: boolean, remaining: number }}
 */
export function rateLimit(limit = 60, windowMs = 60_000) {
  return function check(req) {
    const ip =
      req.headers.get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get?.('x-real-ip') ||
      'unknown';

    const key = `${ip}:${limit}:${windowMs}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = (hits.get(key) || []).filter((t) => t > windowStart);
    const success = timestamps.length < limit;

    if (success) timestamps.push(now);
    hits.set(key, timestamps);

    return { success, remaining: Math.max(0, limit - timestamps.length) };
  };
}
