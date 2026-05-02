import { Code2 } from "lucide-react";

/** Repo footer with attribution + source link. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          Built for the hackathon. Powered by Gemini and Google Workspace.
        </p>
        <a
          href="https://github.com/SummerMaxi/bubblepop"
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
