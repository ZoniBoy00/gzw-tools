/**
 * Shared handler wrapper for Vercel serverless functions.
 * Applies CORS, caching, and rate limiting.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, getClientIp } from './rate-limit';

export interface HandlerOptions {
  /** Cache-Control max-age in seconds (default: 3600) */
  cacheMaxAge?: number;
  /** Rate limit: requests per window (default: 100) */
  rateLimit?: number;
  /** Rate limit: window in ms (default: 60_000) */
  rateWindowMs?: number;
}

export function createHandler(
  handler: (req: VercelRequest, res: VercelResponse) => void | Promise<void>,
  options: HandlerOptions = {},
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    // Only allow GET
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed', code: 405 });
      return;
    }

    // Rate limiting
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(clientIp, options.rateLimit ?? 100, options.rateWindowMs ?? 60_000);

    res.setHeader('X-RateLimit-Limit', String(rateCheck.limit));
    res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(rateCheck.resetAt / 1000)));

    if (!rateCheck.allowed) {
      const retryAfter = Math.ceil((rateCheck.resetAt - Date.now()) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too many requests',
        code: 429,
        retryAfter,
        limit: rateCheck.limit,
      });
      return;
    }

    // Cache
    const maxAge = options.cacheMaxAge ?? 3600;
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);

    try {
      await handler(req, res);
    } catch (err) {
      console.error('API Error:', err);
      res.status(500).json({
        error: 'Internal server error',
        code: 500,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };
}
