"use client";

import { Mail, Calendar, CheckSquare, X, Clock, User } from "lucide-react";
import type { TriagedItem } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  item: TriagedItem | null;
  onClose: () => void;
}

const SOURCE_LABEL = {
  email: "Email",
  calendar: "Meeting",
  task: "Task",
} as const;

const SOURCE_ICON = {
  email: Mail,
  calendar: Calendar,
  task: CheckSquare,
} as const;

function relativeTime(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const abs = Math.abs(diffMin);
  if (abs < 1) return "now";
  if (abs < 60) return diffMin >= 0 ? `in ${abs}m` : `${abs}m ago`;
  const diffHr = Math.round(diffMin / 60);
  const absHr = Math.abs(diffHr);
  if (absHr < 24) return diffHr >= 0 ? `in ${absHr}h` : `${absHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  const absDay = Math.abs(diffDay);
  return diffDay >= 0 ? `in ${absDay}d` : `${absDay}d ago`;
}

function ScoreBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "muted";
}) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums text-foreground">
          {pct}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            tone === "accent"
              ? "bg-[linear-gradient(to_right,var(--accent),var(--accent-secondary))]"
              : "bg-foreground/60",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function WhyPanel({ item, onClose }: Props) {
  const open = item !== null;
  const Icon = item ? SOURCE_ICON[item.source] : Mail;
  const when = item ? relativeTime(item.timestamp) : null;

  return (
    <aside
      className={cn(
        "pointer-events-none fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col",
        "transform transition-transform duration-300 ease-out",
        open ? "translate-x-0 pointer-events-auto" : "translate-x-full",
      )}
      aria-hidden={!open}
      role="dialog"
      aria-label="Triage explanation"
    >
      <div className="m-4 flex h-[calc(100%-2rem)] flex-col rounded-2xl border border-border bg-card shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-accent pulse-dot" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              Why this score
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        {item && (
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
            {/* Source + when */}
            <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Icon size={14} />
                {SOURCE_LABEL[item.source]}
              </span>
              {when && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} />
                  {when}
                </span>
              )}
              {item.from && (
                <span className="inline-flex items-center gap-1.5 truncate">
                  <User size={14} />
                  <span className="truncate">{item.from}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h2
              className="text-2xl leading-tight tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {item.title}
            </h2>

            {/* Snippet */}
            {item.snippet && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.snippet}
              </p>
            )}

            {/* Scores */}
            <div className="mt-8 space-y-4">
              <ScoreBar
                label="Importance"
                value={item.importance}
                tone="accent"
              />
              <ScoreBar label="Urgency" value={item.urgency} tone="muted" />
            </div>

            {/* Reason — the killer moment */}
            <div className="mt-8 rounded-xl border border-border bg-muted/40 p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Gemini reasoning
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                {item.reason}
              </p>
            </div>

            {/* Item id (debug-friendly footer) */}
            <p className="mt-auto pt-8 font-mono text-[10px] text-muted-foreground/60">
              id: {item.id}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
