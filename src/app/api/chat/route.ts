import { GoogleGenAI } from "@google/genai";
import type { TriagedItem } from "@/lib/types";

/**
 * POST /api/chat
 *
 * Body: {
 *   messages: { role: "user" | "model"; content: string }[],
 *   context: TriagedItem[]
 * }
 * Returns: { reply: string }
 *
 * Conversational layer over the triaged context. Gemini is given the
 * current bubble-map items as JSON inside the system instruction so it can
 * reason about them ("what should I do first?", "summarize urgent emails").
 * Read-only — no tool execution. Non-streaming for simplicity.
 */

// Flash-Lite: higher free-tier quota than Flash; chat does fine on it.
const MODEL = "gemini-2.5-flash-lite";

type ChatRole = "user" | "model";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

function isChatMessage(v: unknown): v is ChatMessage {
  if (!v || typeof v !== "object") return false;
  const m = v as Record<string, unknown>;
  return (
    (m.role === "user" || m.role === "model") &&
    typeof m.content === "string"
  );
}

function compactItem(item: TriagedItem) {
  return {
    id: item.id,
    source: item.source,
    title: item.title,
    snippet: item.snippet,
    from: item.from,
    timestamp: item.timestamp,
    importance: item.importance,
    urgency: item.urgency,
    reason: item.reason,
  };
}

function buildSystemInstruction(context: TriagedItem[]): string {
  const now = new Date().toISOString();
  const compact = context.map(compactItem);
  const json = JSON.stringify(compact);

  return `You are BubblePop's assistant — a pragmatic, decisive copilot for an overwhelmed team lead.

Current time: ${now}

The user is looking at a bubble visualization of their triaged inbox / calendar / tasks.
Each bubble has been pre-scored along two dimensions: importance (0-1) and urgency (0-1).
Here is the user's CURRENT triaged context as JSON (id, source, title, snippet, from, timestamp, importance, urgency, reason):

${json}

You have READ-ONLY access. You can:
- Summarize what's on the user's plate
- Recommend priorities and order of operations
- Draft replies, agendas, or notes the user can copy
- Explain why something scored high or low (use the "reason" field)

You CANNOT:
- Send emails, create calendar events, modify tasks, or call any external tool
- Pretend to have taken any action

Style:
- Terse and decisive. No filler, no apologies, no "as an AI" disclaimers.
- Use the user's actual item titles and senders by name when relevant.
- Prefer short paragraphs and tight bullet lists over long prose.
- When recommending, be specific: cite the title or sender, say what to do, why, and roughly when.
- If the context is empty, say so plainly and ask what they want to focus on.`;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY not configured on server" },
      { status: 500 },
    );
  }

  let body: { messages?: unknown; context?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const messagesRaw = body.messages;
  if (!Array.isArray(messagesRaw) || messagesRaw.length === 0) {
    return Response.json(
      { error: "body.messages must be a non-empty array" },
      { status: 400 },
    );
  }
  if (!messagesRaw.every(isChatMessage)) {
    return Response.json(
      { error: "each message must be { role: 'user'|'model', content: string }" },
      { status: 400 },
    );
  }
  const messages = messagesRaw as ChatMessage[];

  const contextRaw = body.context ?? [];
  if (!Array.isArray(contextRaw)) {
    return Response.json(
      { error: "body.context must be an array" },
      { status: 400 },
    );
  }
  const context = contextRaw as TriagedItem[];

  const ai = new GoogleGenAI({ apiKey });

  const contents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: buildSystemInstruction(context),
        temperature: 0.6,
      },
    });

    const reply = response.text;
    if (!reply) {
      return Response.json(
        { error: "empty response from model" },
        { status: 502 },
      );
    }

    return Response.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: `chat failed: ${msg}` }, { status: 502 });
  }
}
