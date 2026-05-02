/**
 * Tiny in-memory fixed-window rate limiter.
 *
 * Caveat: state lives in a module-scoped Map, so limits are enforced
 * **per Cloud Run instance**. With N instances scaled up, a determined
 * attacker can effectively get N × limit requests per window. That's
 * acceptable for a hackathon demo; a production deployment should swap
 * this for Redis / Memorystore (or Cloud Run's built-in rate limiting).
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the next slot opens (only set when !allowed). */
  retryAfter?: number;
  /** Useful for response headers. */
  remaining?: number;
}

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_ENTRIES = 10_000;

/** Drop expired entries when the map gets large. Cheap O(n) sweep, runs rarely. */
function evictExpired(now: number) {
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
  // If still huge after expiry sweep, drop oldest-inserted entries until we're back under cap.
  if (buckets.size > MAX_ENTRIES) {
    const overflow = buckets.size - MAX_ENTRIES;
    let i = 0;
    for (const k of buckets.keys()) {
      if (i++ >= overflow) break;
      buckets.delete(k);
    }
  }
}

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const { key, limit, windowMs } = opts;
  const now = Date.now();

  if (buckets.size > MAX_ENTRIES) evictExpired(now);

  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { allowed: true, remaining: limit - bucket.count };
}

/**
 * Pull a stable client identifier from a Request.
 * Cloud Run sets x-forwarded-for; we take the first hop.
 * Falls through to x-real-ip, then "anonymous".
 */
export function clientKey(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    // Don't trust the header to be well-formed — just take the first comma-separated value.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "anonymous";
}
