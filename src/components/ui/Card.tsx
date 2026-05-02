"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "standard" | "elevated" | "featured";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const base = "relative rounded-2xl transition-all duration-300";

const variants: Record<Variant, string> = {
  standard:
    "bg-card border border-border shadow-[0_4px_6px_rgba(0,0,0,0.07)] " +
    "hover:shadow-[0_20px_25px_rgba(0,0,0,0.1)]",
  elevated:
    "bg-card border border-border shadow-[0_10px_15px_rgba(0,0,0,0.08)] " +
    "hover:shadow-[0_20px_25px_rgba(0,0,0,0.1)] hover:-translate-y-0.5",
  featured: "", // gradient border applied via wrapper below
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "standard", children, ...props }, ref) => {
    if (variant === "featured") {
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary),var(--accent))] p-[2px]",
            "shadow-[0_8px_24px_rgba(0,82,255,0.25)]",
            className,
          )}
          {...props}
        >
          <div className="h-full w-full rounded-[calc(1rem-2px)] bg-card">
            {children}
          </div>
        </div>
      );
    }
    return (
      <div ref={ref} className={cn(base, variants[variant], className)} {...props}>
        {children}
      </div>
    );
  },
);
Card.displayName = "Card";
