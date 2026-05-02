import type { ContextItem } from "@/lib/types";
import {
  GOOGLE_EMAIL_CAP,
  GOOGLE_EVENT_CAP,
  GOOGLE_TASK_CAP,
} from "@/lib/constants";
import { fetchRecentEmails } from "./gmail";
import { fetchUpcomingEvents } from "./calendar";
import { fetchOpenTasks } from "./tasks";

/**
 * Pulls Gmail + Calendar + Tasks in parallel and returns a capped, merged
 * ContextItem list. Each source has an individual cap so a single chatty
 * source can't crowd out the others. Caps are tunable in lib/constants.ts.
 *
 * If any single fetcher rejects we log + treat that source as empty so the
 * triage pipeline still runs on the remaining data.
 */

async function safe<T>(p: Promise<T[]>, label: string): Promise<T[]> {
  try {
    return await p;
  } catch (err) {
    console.warn(`[google:${label}] fetch failed`, err);
    return [];
  }
}

export async function fetchAllContext(
  accessToken: string,
): Promise<ContextItem[]> {
  const [emails, events, tasks] = await Promise.all([
    safe(fetchRecentEmails(accessToken), "gmail"),
    safe(fetchUpcomingEvents(accessToken), "calendar"),
    safe(fetchOpenTasks(accessToken), "tasks"),
  ]);

  return [
    ...emails.slice(0, GOOGLE_EMAIL_CAP),
    ...events.slice(0, GOOGLE_EVENT_CAP),
    ...tasks.slice(0, GOOGLE_TASK_CAP),
  ];
}

export { fetchRecentEmails, fetchUpcomingEvents, fetchOpenTasks };
