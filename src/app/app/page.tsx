"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  LayoutList,
  LogOut,
  Map,
  MessageSquareText,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useTriage } from "@/lib/useTriage";
import TriageBubbleMap from "@/components/TriageBubbleMap";
import AccessibleListView from "@/components/AccessibleListView";
import { WhyPanel } from "@/components/WhyPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type ViewMode = "bubble" | "list";

export default function AppPage() {
  const router = useRouter();
  const { mode, user, loading: authLoading, logout } = useAuth();
  const {
    items,
    loading,
    error: triageError,
    refresh,
    source,
  } = useTriage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("bubble");
  const [chatOpen, setChatOpen] = useState(false);

  // Bounce signed-out visitors back to the marketing page.
  useEffect(() => {
    if (!authLoading && mode === "signed-out") {
      router.replace("/");
    }
  }, [authLoading, mode, router]);

  if (authLoading || mode === "signed-out") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foreground">
        <div className="flex items-center gap-3 text-white/70">
          <span
            className="h-2 w-2 rounded-full bg-accent pulse-dot"
            aria-hidden
          />
          <span className="font-mono text-xs uppercase tracking-[0.18em]">
            Connecting…
          </span>
        </div>
      </div>
    );
  }

  const selected = items.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="z-30 flex flex-none items-center justify-between border-b border-border bg-card px-6 py-3">
        <Link
          href="/"
          className="group flex items-center gap-4 rounded-lg p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
            }}
          >
            <Sparkles size={18} />
          </span>
          <span>
            <span
              className="block text-lg leading-none tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              BubblePop
            </span>
            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {mode === "demo" ? "Demo mode" : "Connected"}
              {source && ` · ${items.length} items`}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div
            role="group"
            aria-label="View mode"
            className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1"
          >
            <ViewToggle
              active={viewMode === "bubble"}
              onClick={() => setViewMode("bubble")}
              icon={<Map size={14} />}
              label="Map"
            />
            <ViewToggle
              active={viewMode === "list"}
              onClick={() => setViewMode("list")}
              icon={<LayoutList size={14} />}
              label="List"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
            aria-label="Re-triage items"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : undefined}
            />
            <span className="hidden md:inline">
              {loading ? "Triaging…" : "Re-triage"}
            </span>
          </Button>

          <Button
            variant={chatOpen ? "primary" : "secondary"}
            size="sm"
            onClick={() => setChatOpen((v) => !v)}
            aria-pressed={chatOpen}
          >
            <MessageSquareText size={14} />
            <span className="hidden md:inline">Ask Gemini</span>
          </Button>

          <span className="hidden text-sm text-muted-foreground lg:inline">
            {user?.displayName ?? "Demo"}
          </span>
          <Button variant="ghost" size="sm" onClick={logout} aria-label="Sign out">
            <LogOut size={14} />
            <span className="hidden md:inline">Sign out</span>
          </Button>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        {triageError && items.length > 0 && (
          <div
            role="alert"
            className="absolute left-1/2 top-4 z-40 max-w-md -translate-x-1/2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 shadow-lg"
          >
            {triageError}
          </div>
        )}

        {triageError && items.length === 0 ? (
          <div className="flex h-full items-center justify-center bg-foreground p-6">
            <div className="max-w-md rounded-2xl border border-red-300/30 bg-red-500/10 p-6 text-center text-white">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-red-300">
                Triage failed
              </p>
              <p className="mt-2 text-sm">{triageError}</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-4"
                onClick={refresh}
              >
                Try again
              </Button>
            </div>
          </div>
        ) : loading && items.length === 0 ? (
          <div
            className={cn(
              "flex h-full items-center justify-center",
              viewMode === "bubble" ? "bg-foreground" : "bg-background",
            )}
          >
            <div
              className={cn(
                "flex items-center gap-3",
                viewMode === "bubble" ? "text-white/70" : "text-muted-foreground",
              )}
            >
              <span
                className="h-2 w-2 rounded-full bg-accent pulse-dot"
                aria-hidden
              />
              <span className="font-mono text-xs uppercase tracking-[0.18em]">
                Asking Gemini what matters…
              </span>
            </div>
          </div>
        ) : viewMode === "bubble" ? (
          <TriageBubbleMap
            items={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <AccessibleListView
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        )}

        <WhyPanel item={selected} onClose={() => setSelectedId(null)} />
        <ChatPanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          items={items}
        />
      </main>
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
