/**
 * lib/rate-limit.ts
 *
 * Simple in-memory sliding-window rate limiter.
 *
 * ✅ Works correctly on Vercel Hobby (Node.js Lambda runtime)
 * ✅ No external dependencies
 * ❌ NOT for Edge Runtime — API routes must use default Node.js runtime
 *
 * Limitation: resets on cold-start (each new Lambda instance starts fresh).
 * This is acceptable for Hobby tier — warm instances persist state between
 * requests, so repeat abusers within the same instance window are throttled.
 *
 * For production at scale: replace `store` with an Upstash Redis client.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

interface Entry {
  count:   number;
  resetAt: number; // epoch ms
}

export interface RateLimitConfig {
  /** Max requests allowed per window */
  limit:    number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success:    boolean;
  remaining:  number;
  resetAt:    number;
  retryAfter: number; // seconds, 0 when allowed
}

// ─── Presets ────────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  trackEvents: { limit: 120, windowMs: 60_000  }, // 120/min  — play/like/share events
  upload:      { limit: 10,  windowMs: 600_000 }, // 10/10min — presign URL requests
  webhook:     { limit: 200, windowMs: 60_000  }, // 200/min  — Paystack webhooks
  auth:        { limit: 10,  windowMs: 60_000  }, // 10/min   — login attempts
  default:     { limit: 60,  windowMs: 60_000  }, // 60/min   — all other routes
} as const satisfies Record<string, RateLimitConfig>;

// ─── In-memory store ─────────────────────────────────────────────────────────

// Module-level Map persists across warm invocations of the same Lambda instance.
const store = new Map<string, Entry>();

// Purge expired entries to prevent unbounded memory growth.
// Uses conditional check to guard against Edge Runtime (no setInterval there).
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 30_000); // every 30 seconds
}

// ─── Core function ───────────────────────────────────────────────────────────

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.default,
): RateLimitResult {
  const now   = Date.now();
  const entry = store.get(identifier);

  // First request or expired window — start a fresh window
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    store.set(identifier, { count: 1, resetAt });
    return {
      success:    true,
      remaining:  config.limit - 1,
      resetAt,
      retryAfter: 0,
    };
  }

  // Within current window — check limit
  if (entry.count >= config.limit) {
    return {
      success:    false,
      remaining:  0,
      resetAt:    entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  // Under limit — increment and allow
  entry.count += 1;
  return {
    success:    true,
    remaining:  config.limit - entry.count,
    resetAt:    entry.resetAt,
    retryAfter: 0,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract real client IP from Vercel-forwarded headers.
 * x-forwarded-for is set by Vercel's edge network.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'anonymous';
}

/**
 * Build standard rate-limit response headers.
 */
export function rateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset':     String(Math.ceil(result.resetAt / 1000)),
  };
  if (result.retryAfter > 0) {
    headers['Retry-After'] = String(result.retryAfter);
  }
  return headers;
}

/**
 * Return a 429 Too Many Requests Response.
 */
export function tooManyRequestsResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please slow down.' }),
    {
      status:  429,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitHeaders(result),
      },
    },
  );
}
