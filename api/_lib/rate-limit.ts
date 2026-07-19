/**
 * Simple in-memory rate limiter for Vercel serverless functions.
 * 
 * Note: In-memory tracking resets on each cold start.
 * For production with many concurrent users, replace with
 * Vercel KV or Upstash Redis for persistence across invocations.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 300_000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Check rate limit for a given key (typically IP address).
 *
 * @param key - Unique identifier (IP, API key, etc.)
 * @param limit - Max requests per window (default: 100)
 * @param windowMs - Window duration in ms (default: 60_000 = 1 minute)
 */
export function checkRateLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 60_000,
): RateLimitResult {
  const now = Date.now();
  let entry = store.get(key);

  // Create or reset expired entry
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    limit,
  };
}

/**
 * Extract client IP from Vercel request headers.
 */
export function getClientIp(request: Request | { headers: Record<string, string | string[] | undefined> }): string {
  const headers = request.headers;

  // Vercel / Cloudflare proxy headers
  const forwarded = typeof headers.get === 'function'
    ? headers.get('x-forwarded-for')
    : (headers as any)['x-forwarded-for'];

  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
  }

  const realIp = typeof headers.get === 'function'
    ? headers.get('x-real-ip')
    : (headers as any)['x-real-ip'];

  if (realIp) return Array.isArray(realIp) ? realIp[0] : realIp;

  return 'unknown';
}
