"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";

interface Props {
  onSignIn: () => void;
  onDemo: () => void;
}

/** Inverted-color final CTA with dot pattern + radial accent glow. */
export function FinalCta({ onSignIn, onDemo }: Props) {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl bg-foreground p-10 text-white md:p-20">
          <div className="dot-pattern absolute inset-0" aria-hidden />
          <div
            className="pointer-events-none absolute -right-32 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(0,82,255,0.32) 0%, transparent 65%)",
              filter: "blur(60px)",
            }}
            aria-hidden
          />
          <div className="relative max-w-2xl">
            <SectionLabel tone="inverted" pulsing>
              Ready?
            </SectionLabel>
            <h2
              className="mt-6 text-3xl leading-[1.1] tracking-tight md:text-[3.25rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Stop drowning in your <span className="gradient-text">inbox</span>.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
              Sign in with Google in two clicks. Or skip auth and explore the
              demo with realistic mock data.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={onSignIn} className="w-full sm:w-auto">
                <Sparkles size={18} />
                Sign in with Google
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={onDemo}
                className="w-full text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                Try the demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
