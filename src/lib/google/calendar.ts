import type { ContextItem } from "@/lib/types";

/**
 * Fetches upcoming Google Calendar events (now → +24h) on the primary
 * calendar and returns them as ContextItems.
 */

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  organizer?: { email?: string; displayName?: string };
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

interface CalendarListResponse {
  items?: CalendarEvent[];
}

export async function fetchUpcomingEvents(
  accessToken: string,
): Promise<ContextItem[]> {
  const now = new Date();
  const plus24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: plus24h.toISOString(),
    maxResults: "15",
    orderBy: "startTime",
    singleEvents: "true",
  });
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Calendar auth expired (401) — please sign in again.");
    }
    throw new Error(
      `Calendar API ${res.status}: ${await res.text().catch(() => "")}`,
    );
  }
  const json = (await res.json()) as CalendarListResponse;
  const events = json.items ?? [];

  return events.map((ev) => ({
    id: `cal-${ev.id}`,
    source: "calendar" as const,
    title: ev.summary || "(no title)",
    snippet: (ev.description || "").slice(0, 240),
    from: ev.organizer?.email,
    timestamp: ev.start?.dateTime ?? ev.start?.date,
  }));
}
