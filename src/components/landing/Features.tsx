import {
  Network,
  MessageSquareText,
  Accessibility,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
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

/** Three-column feature grid on a muted background. */
export function Features() {
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
            Most assistants give you a flat ranked list. BubblePop makes the
            math visible — size, position, and connections all encode the
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
