import { cn } from "@/lib/cn";

interface ScoreBarProps {
  label: string;
  /** 0-1 — clamped to that range when rendered. */
  value: number;
  /** Accent gradient for primary score, foreground tint for secondary. */
  tone?: "accent" | "muted";
}

/**
 * Compact bar chart used wherever an importance/urgency score appears.
 * Uppercase mono label, tabular-nums numeric, gradient or foreground fill.
 * Includes a sr-only summary so screen readers announce the value.
 */
export function ScoreBar({ label, value, tone = "accent" }: ScoreBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
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
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="presentation"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            "motion-reduce:transition-none",
            tone === "accent"
              ? "bg-[linear-gradient(to_right,var(--accent),var(--accent-secondary))]"
              : "bg-foreground/60",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="sr-only">
        {label}: {pct} out of 100
      </span>
    </div>
  );
}
