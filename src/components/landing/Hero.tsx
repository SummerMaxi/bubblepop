"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";

interface Props {
  onSignIn: () => void;
  onDemo: () => void;
  authError: string | null;
}

/** Top-of-page hero — gradient headline, dual CTA, decorative bubble preview. */
export function Hero({ onSignIn, onDemo, authError }: Props) {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-32 md:pt-32 md:pb-44">
      {/* Ambient corner glows */}
      <div
        className="pointer-events-none absolute -left-40 -top-20 h-[500px] w-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0,82,255,0.18) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-40 top-40 h-[500px] w-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(77,124,255,0.14) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <SectionLabel pulsing>AI Team-Lead Assistant</SectionLabel>

          <h1
            className="mt-6 text-[2.75rem] leading-[1.05] tracking-tight md:text-6xl lg:text-[4.75rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your inbox,
            <br />
            calendar, and tasks
            <br />
            <span className="relative inline-block">
              <span className="gradient-text">triaged.</span>
              <span
                className="absolute -bottom-1 left-0 h-3 w-full rounded-sm md:-bottom-2 md:h-4"
                style={{
                  background:
                    "linear-gradient(to right, rgba(0,82,255,0.18), rgba(77,124,255,0.10))",
                }}
                aria-hidden
              />
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            BubblePop connects to Google Workspace, asks Gemini what actually
            matters today, and turns it into a living map of your attention.
            The most important thing is always the biggest bubble.
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
              variant="secondary"
              size="lg"
              onClick={onDemo}
              className="w-full sm:w-auto"
            >
              Continue with demo data
            </Button>
          </div>

          {authError && (
            <p
              role="alert"
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {authError}
            </p>
          )}

          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8 text-xs">
            <div>
              <p className="font-mono uppercase tracking-[0.15em] text-muted-foreground">
                Reads
              </p>
              <p className="mt-2 text-sm">Gmail, Calendar, Tasks</p>
            </div>
            <div>
              <p className="font-mono uppercase tracking-[0.15em] text-muted-foreground">
                Brain
              </p>
              <p className="mt-2 text-sm">Gemini 2.5 Flash-Lite</p>
            </div>
            <div>
              <p className="font-mono uppercase tracking-[0.15em] text-muted-foreground">
                Privacy
              </p>
              <p className="mt-2 text-sm">Read-only scopes</p>
            </div>
          </div>
        </div>

        {/* Decorative bubble preview — desktop only */}
        <div className="relative hidden h-[500px] lg:block">
          <div className="absolute inset-0 overflow-hidden rounded-3xl border border-border bg-foreground">
            <div className="dot-pattern absolute inset-0" aria-hidden />
            <div
              className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,82,255,0.18) 0%, transparent 65%)",
                filter: "blur(40px)",
              }}
              aria-hidden
            />
            <DecorativeBubble
              size={200}
              left="50%"
              top="50%"
              translate
              high
              delay="0s"
            />
            <DecorativeBubble size={90} left="18%" top="28%" delay="0.5s" />
            <DecorativeBubble size={70} left="72%" top="68%" delay="1.2s" />
            <DecorativeBubble size={55} left="78%" top="22%" delay="2s" />
            <DecorativeBubble size={45} left="22%" top="72%" delay="1.6s" />
            <div
              className="slow-spin absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: 360,
                height: 360,
                borderRadius: "50%",
                border: "1px dashed rgba(255,255,255,0.12)",
              }}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  );
}

interface DecorativeBubbleProps {
  size: number;
  left: string;
  top: string;
  delay: string;
  high?: boolean;
  translate?: boolean;
}

/** Animated decorative bubble used only inside the hero preview. */
function DecorativeBubble({
  size,
  left,
  top,
  delay,
  high,
  translate,
}: DecorativeBubbleProps) {
  return (
    <div
      className="float-bob absolute"
      style={{
        left,
        top,
        width: size,
        height: size,
        borderRadius: "50%",
        transform: translate ? "translate(-50%, -50%)" : undefined,
        animationDelay: delay,
        background: high
          ? "radial-gradient(circle at 30% 30%, #4d7cff, #0052ff 70%)"
          : "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.14), rgba(255,255,255,0.03) 70%)",
        boxShadow: high
          ? "0 8px 32px rgba(0,82,255,0.45), inset 0 2px 16px rgba(255,255,255,0.25)"
          : "0 4px 20px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.12)",
        border: high
          ? "1px solid rgba(255,255,255,0.35)"
          : "1px solid rgba(255,255,255,0.12)",
      }}
      aria-hidden
    />
  );
}
