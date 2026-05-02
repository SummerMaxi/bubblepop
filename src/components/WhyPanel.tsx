"use client";

import { useEffect, useRef } from "react";
import { Mail, Calendar, CheckSquare, X, Clock, User } from "lucide-react";
import type { TriagedItem } from "@/lib/types";
import { cn } from "@/lib/cn";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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

  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Esc-to-close, focus trap (Tab/Shift+Tab), auto-focus close button on open,
  // and restore focus to the previously active element on close.
  useEffect(() => {
    if (!open) return;

    // Capture the element that had focus before the panel opened so we can
    // return focus to it when the panel closes.
    previouslyFocusedRef.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;

    // Auto-focus the close button so keyboard users can immediately Esc/Tab.
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
      );

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !panel.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const previouslyFocused = previouslyFocusedRef.current;
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the element that had it before the panel opened.
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [open, onClose]);

  return (
    <aside
      ref={panelRef}
      className={cn(
        "pointer-events-none fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col",
        "transform transition-transform duration-300 ease-out",
        open ? "translate-x-0 pointer-events-auto" : "translate-x-full",
      )}
      aria-hidden={!open}
      aria-modal="true"
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
            ref={closeButtonRef}
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
