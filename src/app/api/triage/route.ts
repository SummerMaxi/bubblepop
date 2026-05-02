import { GoogleGenAI, Type } from "@google/genai";
import type { ContextItem, ScoredItem } from "@/lib/types";

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

const MODEL = "gemini-2.5-flash";

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

    return Response.json({ scored });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return Response.json(
      { error: `triage failed: ${msg}` },
      { status: 502 },
    );
  }
}
