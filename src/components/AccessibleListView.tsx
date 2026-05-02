"use client";

import { useMemo } from "react";
import { Clock, User } from "lucide-react";
import type { TriagedItem } from "@/lib/types";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { cn } from "@/lib/cn";
import { SOURCE_LABEL, SOURCE_ICON, relativeTime } from "@/lib/format";
import { HIGH_IMPORTANCE_THRESHOLD } from "@/lib/constants";

interface Props {
  items: TriagedItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function Pill({
  value,
  highlight,
  label,
}: {
  value: number;
  highlight: boolean;
  label: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5",
        "font-mono text-[10px] uppercase tracking-[0.14em] tabular-nums",
        highlight
          ? "bg-[linear-gradient(to_right,var(--accent),var(--accent-secondary))] text-[var(--accent-foreground)] shadow-[0_4px_14px_rgba(0,82,255,0.25)]"
          : "bg-muted text-muted-foreground",
      )}
      aria-hidden
    >
      <span className="opacity-80">{label}</span>
      <span className="font-semibold">{pct}%</span>
    </span>
  );
}

export default function AccessibleListView({
  items,
  selectedId,
  onSelect,
}: Props) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => b.importance - a.importance),
    [items],
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <header className="mb-10">
        <SectionLabel tone="accent" pulsing>
          Triaged inbox · {sorted.length} item{sorted.length === 1 ? "" : "s"}
        </SectionLabel>
        <h1
          className="mt-5 text-4xl leading-tight tracking-tight text-foreground sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Today, ranked by importance
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Keyboard-navigable view of every item BubblePop has triaged. Use
          Tab to move between rows; press Enter or Space to expand the
          Gemini reasoning.
        </p>
      </header>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground">No items to triage.</p>
      ) : (
        <ul role="list" className="flex flex-col gap-3">
          {sorted.map((item) => {
            const isSelected = item.id === selectedId;
            const Icon = SOURCE_ICON[item.source];
            const when = relativeTime(item.timestamp);
            const importancePct = Math.round(item.importance * 100);
            const urgencyPct = Math.round(item.urgency * 100);
            const detailId = `row-detail-${item.id}`;

            const ariaLabel = [
              SOURCE_LABEL[item.source],
              item.from ? `from ${item.from}` : null,
              `— ${item.title}`,
              `importance ${importancePct}%`,
              `urgency ${urgencyPct}%`,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <li key={item.id} role="listitem">
                <div
                  className={cn(
                    "rounded-2xl border transition-all duration-200",
                    isSelected
                      ? "border-transparent bg-muted/60 ring-1 ring-accent shadow-[0_10px_15px_rgba(0,0,0,0.08)]"
                      : "border-border bg-card hover:bg-muted/40 hover:border-accent/30",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(isSelected ? null : item.id)}
                    aria-expanded={isSelected}
                    aria-controls={detailId}
                    aria-label={ariaLabel}
                    className={cn(
                      "group flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                  >
                    {/* Source icon tile */}
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                        isSelected
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-border bg-muted text-muted-foreground group-hover:text-foreground",
                      )}
                      aria-hidden
                    >
                      <Icon size={18} />
                    </span>

                    {/* Title + subline */}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold tracking-tight text-foreground">
                        {item.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted-foreground">
                        {item.from && (
                          <span className="inline-flex items-center gap-1 truncate">
                            <User size={12} aria-hidden />
                            <span className="truncate">{item.from}</span>
                          </span>
                        )}
                        {item.from && when && (
                          <span aria-hidden className="opacity-50">
                            ·
                          </span>
                        )}
                        {when && (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap">
                            <Clock size={12} aria-hidden />
                            {when}
                          </span>
                        )}
                      </span>
                    </span>

                    {/* Score pills */}
                    <span className="hidden shrink-0 items-center gap-2 sm:inline-flex">
                      <Pill
                        value={item.importance}
                        highlight={item.importance >= HIGH_IMPORTANCE_THRESHOLD}
                        label="Imp"
                      />
                      <Pill
                        value={item.urgency}
                        highlight={false}
                        label="Urg"
                      />
                    </span>
                  </button>

                  {/* Expanded detail */}
                  {isSelected && (
                    <section
                      id={detailId}
                      role="region"
                      aria-label="Item details"
                      className="border-t border-border/60 px-5 pb-5 pt-5"
                    >
                      {item.snippet && (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {item.snippet}
                        </p>
                      )}

                      {/* Score bars */}
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <ScoreBar
                          label="Importance"
                          value={item.importance}
                          tone="accent"
                        />
                        <ScoreBar
                          label="Urgency"
                          value={item.urgency}
                          tone="muted"
                        />
                      </div>

                      {/* Reason callout */}
                      <div className="mt-5 rounded-xl border border-border bg-muted/40 p-5">
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-accent"
                            aria-hidden
                          />
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Gemini reasoning
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">
                          {item.reason}
                        </p>
                      </div>
                    </section>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
