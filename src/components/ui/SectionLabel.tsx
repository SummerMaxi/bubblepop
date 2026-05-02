import { cn } from "@/lib/cn";

export interface SectionLabelProps {
  children: React.ReactNode;
  pulsing?: boolean;
  tone?: "accent" | "inverted";
  className?: string;
}

export function SectionLabel({
  children,
  pulsing = false,
  tone = "accent",
  className,
}: SectionLabelProps) {
  const surface =
    tone === "accent"
      ? "border-accent/30 bg-accent/5 text-accent"
      : "border-white/15 bg-white/5 text-white/80";
  const dotColor = tone === "accent" ? "bg-accent" : "bg-white";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-full border px-5 py-2",
        surface,
        className,
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          dotColor,
          pulsing && "pulse-dot",
        )}
        aria-hidden
      />
      <span className="font-mono text-xs uppercase tracking-[0.15em]">
        {children}
      </span>
    </div>
  );
}
