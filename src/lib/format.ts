import { Mail, Calendar, CheckSquare, type LucideIcon } from "lucide-react";
import type { ContextSource } from "@/lib/types";

/**
 * Formatting helpers shared between the bubble canvas, the Why panel,
 * and the accessible list view. Keeping these in one place avoids the
 * three-way drift that crept in across earlier copies.
 */

/** Human label for a context source — used in panel headers and ARIA strings. */
export const SOURCE_LABEL: Record<ContextSource, string> = {
  email: "Email",
  calendar: "Meeting",
  task: "Task",
};

/** Lucide icon component for each source — used everywhere we render a source. */
export const SOURCE_ICON: Record<ContextSource, LucideIcon> = {
  email: Mail,
  calendar: Calendar,
  task: CheckSquare,
};

/**
 * Human-friendly relative time ("in 5m", "2h ago", "in 3d", or "now").
 * Returns null for missing or invalid input so callers can simply skip
 * rendering the field.
 */
export function relativeTime(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  const absMin = Math.abs(diffMin);
  if (absMin < 1) return "now";
  if (absMin < 60) return diffMin >= 0 ? `in ${absMin}m` : `${absMin}m ago`;

  const diffHr = Math.round(diffMin / 60);
  const absHr = Math.abs(diffHr);
  if (absHr < 24) return diffHr >= 0 ? `in ${absHr}h` : `${absHr}h ago`;

  const diffDay = Math.round(diffHr / 24);
  const absDay = Math.abs(diffDay);
  return diffDay >= 0 ? `in ${absDay}d` : `${absDay}d ago`;
}
