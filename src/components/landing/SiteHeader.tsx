"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  onSignIn: () => void;
  onDemo: () => void;
}

/** Sticky top nav for the marketing homepage. Logo + dual CTA. */
export function SiteHeader({ onSignIn, onDemo }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
            }}
          >
            <Sparkles size={16} />
          </span>
          <span
            className="text-base tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            BubblePop
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDemo}>
            Try demo
          </Button>
          <Button size="sm" onClick={onSignIn}>
            Sign in
            <ArrowRight size={14} />
          </Button>
        </div>
      </nav>
    </header>
  );
}
