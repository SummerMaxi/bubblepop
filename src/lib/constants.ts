/**
 * Centralized magic numbers. Anything that's a tunable threshold,
 * timeout, or capacity lives here so it can be discovered and tuned
 * in one place rather than buried inside each module.
 */

// ─── Bubble physics ────────────────────────────────────────────────
/** Smallest possible bubble (pixel radius). Floor for low-importance items. */
export const MIN_BUBBLE_RADIUS = 32;
/** Largest possible bubble (pixel radius). Reserved for ~1.0 importance. */
export const MAX_BUBBLE_RADIUS = 110;
/**
 * Power-curve exponent for importance → radius scaling.
 * Higher values produce more dramatic size variance (small items shrink more,
 * critical items dominate). Applied as `pow(importance, 1/RADIUS_CURVE)`.
 */
export const BUBBLE_RADIUS_CURVE = 1.6;

// ─── Triage server route ───────────────────────────────────────────
/** Triage cache TTL. Repeat triage for identical items returns cached result. */
export const TRIAGE_CACHE_TTL_MS = 60_000;
/** Max items the cache may hold before lazy eviction kicks in. */
export const TRIAGE_CACHE_MAX_ENTRIES = 50;
/** Hard cap on items per triage request — keeps Gemini input bounded. */
export const TRIAGE_MAX_ITEMS = 50;

// ─── Rate limiting ─────────────────────────────────────────────────
/** Window for fixed-window rate limiter. */
export const RATE_LIMIT_WINDOW_MS = 60_000;
/** /api/triage: tolerant because the cache absorbs most repeat clicks. */
export const TRIAGE_RATE_LIMIT = 30;
/** /api/chat: tighter — multi-turn, no cache, more upstream cost. */
export const CHAT_RATE_LIMIT = 15;
/** Lazy-eviction trigger for the rate limiter's per-client map. */
export const RATE_LIMIT_MAX_ENTRIES = 10_000;

// ─── Workspace fetchers ────────────────────────────────────────────
/** Per-source caps so one chatty source can't crowd out the others. */
export const GOOGLE_EMAIL_CAP = 12;
export const GOOGLE_EVENT_CAP = 8;
export const GOOGLE_TASK_CAP = 10;
/** Total context items budget (sum of caps). Bounds Gemini input. */
export const GOOGLE_TOTAL_CAP =
  GOOGLE_EMAIL_CAP + GOOGLE_EVENT_CAP + GOOGLE_TASK_CAP;

// ─── Gemini ────────────────────────────────────────────────────────
/**
 * Flash-Lite has a much higher free-tier daily quota than Flash
 * (1500+ RPD vs ~20). Better fit for a hackathon demo.
 */
export const GEMINI_MODEL = "gemini-2.5-flash-lite";

// ─── UI thresholds ─────────────────────────────────────────────────
/** Importance >= this gets the accent gradient treatment. */
export const HIGH_IMPORTANCE_THRESHOLD = 0.7;
/** Importance > this (and < HIGH) gets the medium glassmorphic treatment. */
export const MEDIUM_IMPORTANCE_THRESHOLD = 0.35;
