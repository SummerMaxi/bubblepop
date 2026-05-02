"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  Plug,
  Brain,
  Eye,
  Network,
  MessageSquareText,
  Accessibility,
  Code2,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";

export default function Home() {
  const { mode, error, signInWithGoogle, continueAsDemo } = useAuth();
  const router = useRouter();

  // Already signed in? Skip the marketing page and go straight to the app.
  useEffect(() => {
    if (mode === "authenticated" || mode === "demo") router.replace("/app");
  }, [mode, router]);

  const handleSignIn = async () => {
    await signInWithGoogle();
  };
  const handleDemo = () => {
    continueAsDemo();
  };

  return (
    <div className="bg-background text-foreground">
      <SiteHeader onSignIn={handleSignIn} onDemo={handleDemo} />
      <Hero onSignIn={handleSignIn} onDemo={handleDemo} authError={error} />
      <HowItWorks />
      <Features />
      <FinalCta onSignIn={handleSignIn} onDemo={handleDemo} />
      <SiteFooter />
    </div>
  );
}

/* ─────────────────────────────────────────── Header ───────────────── */

function SiteHeader({
  onSignIn,
  onDemo,
}: {
  onSignIn: () => void;
  onDemo: () => void;
}) {
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

/* ─────────────────────────────────────────── Hero ─────────────────── */

function Hero({
  onSignIn,
  onDemo,
  authError,
}: {
  onSignIn: () => void;
  onDemo: () => void;
  authError: string | null;
}) {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-32 md:pt-32 md:pb-44">
      {/* Ambient glows */}
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
            BubblePop connects to Google Workspace, asks Gemini what
            actually matters today, and turns it into a living map of your
            attention. The most important thing is always the biggest bubble.
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
              <p className="mt-2 text-sm">Gemini 2.5 Flash</p>
            </div>
            <div>
              <p className="font-mono uppercase tracking-[0.15em] text-muted-foreground">
                Privacy
              </p>
              <p className="mt-2 text-sm">Read-only scopes</p>
            </div>
          </div>
        </div>

        {/* Decorative bubble preview */}
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

function DecorativeBubble({
  size,
  left,
  top,
  delay,
  high,
  translate,
}: {
  size: number;
  left: string;
  top: string;
  delay: string;
  high?: boolean;
  translate?: boolean;
}) {
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

/* ─────────────────────────────────────────── How it works ─────────── */

const STEPS = [
  {
    icon: Plug,
    title: "Connect",
    body: "Sign in with Google. Read-only scopes for Gmail, Calendar, and Tasks. Nothing leaves your account.",
  },
  {
    icon: Brain,
    title: "Triage",
    body: "Gemini 2.5 Flash scores every item by importance and urgency, with a one-sentence reason for each.",
  },
  {
    icon: Eye,
    title: "Visualize",
    body: "Critical work becomes the biggest bubble. Items from the same person cluster. Click any bubble to see why.",
  },
];

function HowItWorks() {
  return (
    <section className="px-6 py-28 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <SectionLabel>How it works</SectionLabel>
          <h2
            className="mx-auto mt-6 max-w-3xl text-3xl leading-[1.15] tracking-tight md:text-[3.25rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Triage in three <span className="gradient-text">steps</span>.
          </h2>
        </div>

        <ol className="relative mt-20 grid gap-6 md:grid-cols-3">
          {/* Connecting line on desktop */}
          <div
            className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            aria-hidden
          />
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              <Card className="relative h-full p-6">
                <div className="mb-5 flex items-center gap-4">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-[0_4px_14px_rgba(0,82,255,0.25)]"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
                    }}
                  >
                    <step.icon size={20} />
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Step {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3
                  className="text-xl tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────── Features ─────────────── */

const FEATURES = [
  {
    icon: Network,
    title: "Physics-based clustering",
    body: "Items from the same person drift together via d3-force. Hidden communication patterns surface visually.",
  },
  {
    icon: MessageSquareText,
    title: "AI explains itself",
    body: "Every score comes with a one-sentence reason. No black boxes — you see why a bubble is big.",
  },
  {
    icon: Accessibility,
    title: "Accessible by design",
    body: "Keyboard-navigable list view fallback. Honors prefers-reduced-motion. WCAG-AA contrast throughout.",
  },
];

function Features() {
  return (
    <section className="bg-muted/40 px-6 py-28 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <SectionLabel>What makes it different</SectionLabel>
          <h2
            className="mt-6 text-3xl leading-[1.15] tracking-tight md:text-[3.25rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Beyond a <span className="gradient-text">checklist</span>.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
            Most assistants give you a flat ranked list. BubblePop makes
            the math visible — size, position, and connections all encode the
            AI&apos;s decisions.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} variant="elevated" className="p-8">
              <span
                className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
                }}
              >
                <feature.icon size={20} />
              </span>
              <h3
                className="text-lg tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────── Final CTA ────────────── */

function FinalCta({
  onSignIn,
  onDemo,
}: {
  onSignIn: () => void;
  onDemo: () => void;
}) {
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

/* ─────────────────────────────────────────── Footer ───────────────── */

function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          Built for the hackathon. Powered by Gemini and Google Workspace.
        </p>
        <a
          href="https://github.com/anthropics/claude-code"
          rel="noreferrer"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Code2 size={14} />
          Source
        </a>
      </div>
    </footer>
  );
}
