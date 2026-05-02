import { GoogleGenAI } from "@google/genai";
import type { TriagedItem } from "@/lib/types";
import { rateLimit, clientKey } from "@/lib/rateLimit";
import {
  GEMINI_MODEL,
  CHAT_RATE_LIMIT,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/constants";

/**
 * POST /api/chat
 *
 * Body: {
 *   messages: { role: "user" | "model"; content: string }[],
 *   context: TriagedItem[]
 * }
 * Returns: text/plain stream of Gemini's reply, OR a JSON error.
 *
 * Conversational layer over the triaged context. Gemini is given the
 * current bubble-map items as JSON inside the system instruction so it can
 * reason about them ("what should I do first?", "summarize urgent emails").
 * Read-only — no tool execution. Streams chunks as plain text so the UI can
 * render token-by-token.
 */

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

  // Chat is more expensive than triage (multi-turn, no cache), so the limit
  // is tighter than triage. Tunable in lib/constants.ts.
  const { allowed, retryAfter } = rateLimit({
    key: clientKey(request),
    limit: CHAT_RATE_LIMIT,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded — too many chat requests. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter ?? 60) },
      },
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

  // Open the streaming request before constructing the Response. Errors here
  // (validation, quota, transport) are pre-stream — we can still return JSON.
  let iterator: AsyncGenerator<{ text?: string }>;
  try {
    iterator = (await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: buildSystemInstruction(context),
        temperature: 0.6,
      },
    })) as AsyncGenerator<{ text?: string }>;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
      return Response.json(
        {
          error:
            "Gemini free-tier quota exhausted for today. Enable billing on the Google Cloud project, or try again after the daily reset.",
        },
        { status: 429 },
      );
    }
    return Response.json({ error: `chat failed: ${msg}` }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) {
          controller.close();
          return;
        }
        const text = value?.text;
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      } catch {
        // Mid-stream error: close gracefully — we've already committed to a 200.
        controller.close();
      }
    },
    cancel() {
      // If the client aborts, attempt to release the iterator.
      void iterator.return?.(undefined);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
