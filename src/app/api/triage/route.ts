import { GoogleGenAI, Type } from "@google/genai";
import type { ContextItem, ScoredItem } from "@/lib/types";
import { rateLimit, clientKey } from "@/lib/rateLimit";

/**
 * POST /api/triage
 *
 * Body: { items: ContextItem[] }
 * Returns: { scored: ScoredItem[] }
 *
 * Calls Gemini with a structured-output schema so the model can only
 * return valid {id, importance, urgency, reason} tuples. Importance and
 * urgency drive the bubble physics (size + buoyancy) on the client.
 */

// Flash-Lite has a much higher free-tier daily quota than Flash (≥1500 RPD vs ~20)
// — better fit for a hackathon demo that gets clicked through many times.
const MODEL = "gemini-2.5-flash-lite";

// In-memory response cache. Keyed by the JSON of `items`, 60-second TTL.
// Per-instance (Cloud Run may scale to multiple instances) — that's fine; the
// goal is to absorb repeat clicks within a single user's session, not perfect
// global dedup.
type CacheEntry = { body: string; expiresAt: number };
const triageCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

function hashKey(items: unknown[]): string {
  return JSON.stringify(items);
}

function getCached(key: string): string | null {
  const hit = triageCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    triageCache.delete(key);
    return null;
  }
  return hit.body;
}

function setCached(key: string, body: string) {
  // Cap cache size to avoid memory bloat (lazy eviction)
  if (triageCache.size > 50) {
    const firstKey = triageCache.keys().next().value;
    if (firstKey) triageCache.delete(firstKey);
  }
  triageCache.set(key, { body, expiresAt: Date.now() + CACHE_TTL_MS });
}

const SYSTEM_INSTRUCTION = `You are an executive assistant for an overwhelmed team lead.
Your job is to score every item in their inbox / calendar / task list along two dimensions:

  importance (0-1): how much does this affect their goals, team, or business outcomes?
    - 1.0 = mission-critical (customer escalations, leadership decisions, blocked teammates)
    - 0.5 = normal work (status meetings, code reviews, FYIs from peers)
    - 0.0 = noise (newsletters, automated reports, low-stakes social)

  urgency (0-1): how time-sensitive is it?
    - 1.0 = needs action in the next few hours (today's meetings, EOD deadlines)
    - 0.5 = this week
    - 0.0 = no time pressure

Be decisive. Spread your scores across the full 0-1 range — do not cluster everything around 0.5.

For each item, also write a single-sentence "reason" the user can read to understand
why you ranked it the way you did. Be specific about what cue drove the score
(sender, deadline, content keyword). Maximum 20 words. No emoji.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    scored: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          importance: { type: Type.NUMBER },
          urgency: { type: Type.NUMBER },
          reason: { type: Type.STRING },
        },
        required: ["id", "importance", "urgency", "reason"],
        propertyOrdering: ["id", "importance", "urgency", "reason"],
      },
    },
  },
  required: ["scored"],
};

function buildUserPrompt(items: ContextItem[]) {
  const now = new Date().toISOString();
  const lines = items.map((item) => {
    const parts = [`[${item.source}] id=${item.id}`];
    if (item.from) parts.push(`from="${item.from}"`);
    if (item.timestamp) parts.push(`when=${item.timestamp}`);
    parts.push(`title="${item.title.replace(/"/g, "'")}"`);
    if (item.snippet)
      parts.push(`snippet="${item.snippet.replace(/"/g, "'").slice(0, 240)}"`);
    return parts.join(" ");
  });
  return `Current time: ${now}\n\nItems to triage:\n${lines.join("\n")}`;
}

function clamp01(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0.5;
  return Math.max(0, Math.min(1, x));
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY not configured on server" },
      { status: 500 },
    );
  }

  let body: { items?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json(
      { error: "body.items must be a non-empty array" },
      { status: 400 },
    );
  }
  if (items.length > 50) {
    return Response.json(
      { error: "max 50 items per request" },
      { status: 400 },
    );
  }

  // Cache: same items within 60s → return previous response (saves quota).
  const cacheKey = hashKey(items);
  const cached = getCached(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "HIT",
      },
    });
  }

  // Rate limit AFTER the cache check: cache hits are free (no upstream cost),
  // so they shouldn't count against a user's quota. We only throttle requests
  // that would actually hit Gemini.
  const { allowed, retryAfter } = rateLimit({
    key: clientKey(request),
    limit: 30, // 30 requests per minute per client
    windowMs: 60_000,
  });
  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded — too many requests. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter ?? 60) },
      },
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildUserPrompt(items as ContextItem[]),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.4,
      },
    });

    const raw = response.text;
    if (!raw) {
      return Response.json(
        { error: "empty response from model" },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(raw) as { scored: ScoredItem[] };
    const scored: ScoredItem[] = parsed.scored.map((s) => ({
      id: String(s.id),
      importance: clamp01(s.importance),
      urgency: clamp01(s.urgency),
      reason: String(s.reason ?? "").slice(0, 240),
    }));

    const responseBody = JSON.stringify({ scored });
    setCached(cacheKey, responseBody);
    return new Response(responseBody, {
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    // Clean up the quota error so the UI shows something readable.
    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
      return Response.json(
        {
          error:
            "Gemini free-tier quota exhausted for today. Enable billing on the Google Cloud project, or try again after the daily reset.",
        },
        { status: 429 },
      );
    }
    return Response.json(
      { error: `triage failed: ${msg}` },
      { status: 502 },
    );
  }
}
