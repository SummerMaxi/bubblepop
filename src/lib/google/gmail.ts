import type { ContextItem } from "@/lib/types";

/**
 * Fetches recent (last 24h) Gmail messages and returns them as ContextItems.
 * Runs the per-message metadata fetches in parallel.
 *
 * Uses the bearer-token REST API directly from the browser — Google APIs
 * support CORS for these endpoints.
 */

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  resultSizeEstimate?: number;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessageResponse {
  id: string;
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: GmailHeader[];
  };
}

const LIST_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=newer_than:1d&maxResults=15";

function headerValue(headers: GmailHeader[] | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  const found = headers.find((h) => h.name.toLowerCase() === lower);
  return found?.value;
}

/**
 * Pulls the email address out of a `From` header value.
 * Examples:
 *   "Priya Patel <priya@acme.com>" -> "priya@acme.com"
 *   "priya@acme.com"               -> "priya@acme.com"
 *   "Priya Patel"                  -> "Priya Patel" (fallback to display name)
 */
function parseFrom(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const angle = raw.match(/<([^>]+)>/);
  if (angle) return angle[1].trim();
  if (raw.includes("@")) return raw.trim();
  return raw.trim();
}

async function authedFetch<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Gmail auth expired (401) — please sign in again.");
    }
    throw new Error(`Gmail API ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return (await res.json()) as T;
}

export async function fetchRecentEmails(
  accessToken: string,
): Promise<ContextItem[]> {
  const list = await authedFetch<GmailListResponse>(LIST_URL, accessToken);
  const messages = list.messages ?? [];

  const detailed = await Promise.all(
    messages.map(async (m) => {
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(
        m.id,
      )}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`;
      try {
        return await authedFetch<GmailMessageResponse>(url, accessToken);
      } catch (err) {
        console.warn(`gmail: failed to fetch message ${m.id}`, err);
        return null;
      }
    }),
  );

  const items: ContextItem[] = [];
  for (const msg of detailed) {
    if (!msg) continue;
    const subject = headerValue(msg.payload?.headers, "Subject") ?? "(no subject)";
    const from = parseFrom(headerValue(msg.payload?.headers, "From"));
    const ts = msg.internalDate
      ? new Date(Number(msg.internalDate)).toISOString()
      : undefined;
    items.push({
      id: `gmail-${msg.id}`,
      source: "email",
      title: subject,
      snippet: msg.snippet,
      from,
      timestamp: ts,
    });
  }
  return items;
}
