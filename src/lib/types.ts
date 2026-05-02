/**
 * Shared types between the Google Workspace fetchers, the triage API,
 * and the bubble physics layer.
 */

export type ContextSource = "email" | "calendar" | "task";

export interface ContextItem {
  id: string;
  source: ContextSource;
  title: string;
  snippet?: string;
  /** ISO 8601 — when the item arrived (email), starts (calendar), or is due (task). */
  timestamp?: string;
  /** Optional sender / organizer / list owner — helps Gemini judge importance. */
  from?: string;
}

export interface ScoredItem {
  id: string;
  /** 0-1: how impactful is this to the user's goals? */
  importance: number;
  /** 0-1: how time-sensitive is this? */
  urgency: number;
  /** One-sentence justification rendered in the "Why?" affordance. */
  reason: string;
}

/** Combined context + score, used by the UI layer. */
export interface TriagedItem extends ContextItem, ScoredItem {}
