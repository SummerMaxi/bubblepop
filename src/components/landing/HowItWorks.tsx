import { Plug, Brain, Eye, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Plug,
    title: "Connect",
    body: "Sign in with Google. Read-only scopes for Gmail, Calendar, and Tasks. Nothing leaves your account.",
  },
  {
    icon: Brain,
    title: "Triage",
    body: "Gemini 2.5 Flash-Lite scores every item by importance and urgency, with a one-sentence reason for each.",
  },
  {
    icon: Eye,
    title: "Visualize",
    body: "Critical work becomes the biggest bubble. Items from the same person cluster. Click any bubble to see why.",
  },
];

/** Three-step timeline with connecting line on desktop. */
export function HowItWorks() {
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
