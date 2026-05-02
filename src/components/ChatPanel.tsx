"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowRight, X } from "lucide-react";
import type { TriagedItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SectionLabel } from "@/components/ui/SectionLabel";

interface Props {
  open: boolean;
  onClose: () => void;
  items: TriagedItem[];
}

type ChatRole = "user" | "model";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

const QUICK_PROMPTS = [
  "What should I do first?",
  "Summarize my urgent emails",
  "Anyone blocked on me?",
] as const;

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ChatPanel({ open, onClose, items }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Whether we're awaiting the FIRST chunk of the in-flight reply.
  // Drives the typing indicator; flips false as soon as text starts streaming.
  const [awaitingFirstChunk, setAwaitingFirstChunk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Element that had focus before the panel opened — we restore to it on close.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Focus the input when the panel opens; restore previous focus on close.
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current =
        (document.activeElement as HTMLElement | null) ?? null;
      // small delay so the slide-in animation can start first
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
    // open === false: restore focus to the opener (if it's still in the DOM).
    const prev = previouslyFocusedRef.current;
    if (prev && document.contains(prev)) {
      prev.focus();
    }
    previouslyFocusedRef.current = null;
  }, [open]);

  // Esc-to-close + Tab focus trap while open.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Auto-scroll to bottom whenever messages or loading state change.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading, awaitingFirstChunk]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setError(null);
      const next: ChatMessage[] = [
        ...messages,
        { role: "user", content: trimmed },
      ];
      setMessages(next);
      setInput("");
      setLoading(true);
      setAwaitingFirstChunk(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next, context: items }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? `Request failed (${res.status})`);
          setLoading(false);
          setAwaitingFirstChunk(false);
          return;
        }

        if (!res.body) {
          setError("Empty response from model");
          setLoading(false);
          setAwaitingFirstChunk(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantStarted = false;
        let totalText = "";

        // Stream loop: append chunks to the in-flight assistant message.
        // The first chunk creates the assistant bubble and hides the typing
        // indicator; subsequent chunks update the last message in place.
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          totalText += chunk;
          if (!assistantStarted) {
            assistantStarted = true;
            setAwaitingFirstChunk(false);
            setMessages((prev) => [
              ...prev,
              { role: "model", content: totalText },
            ]);
          } else {
            setMessages((prev) => {
              if (prev.length === 0) return prev;
              const last = prev[prev.length - 1];
              if (last.role !== "model") return prev;
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...last,
                content: totalText,
              };
              return updated;
            });
          }
        }
        // Flush any trailing bytes from the decoder.
        const tail = decoder.decode();
        if (tail) {
          totalText += tail;
          if (!assistantStarted) {
            setMessages((prev) => [
              ...prev,
              { role: "model", content: totalText },
            ]);
          } else {
            setMessages((prev) => {
              if (prev.length === 0) return prev;
              const last = prev[prev.length - 1];
              if (last.role !== "model") return prev;
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...last,
                content: totalText,
              };
              return updated;
            });
          }
        }

        if (!assistantStarted) {
          setError("Empty response from model");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
      } finally {
        setLoading(false);
        setAwaitingFirstChunk(false);
      }
    },
    [items, loading, messages],
  );

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    send(input);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <aside
      className={cn(
        "pointer-events-none fixed right-0 top-0 z-40 flex h-full w-full max-w-[420px] flex-col",
        "transform transition-transform duration-300 ease-out",
        open ? "translate-x-0 pointer-events-auto" : "translate-x-full",
      )}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label="Gemini chat"
    >
      <div
        ref={panelRef}
        className="m-4 flex h-[calc(100%-2rem)] flex-col rounded-2xl border border-border bg-card shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <SectionLabel tone="accent" pulsing>
            Ask Gemini
          </SectionLabel>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </header>

        {/* Body */}
        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-6"
        >
          {isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <h2
                className="max-w-[260px] text-2xl leading-tight tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Ask me anything about your day
              </h2>
              <p className="mt-3 max-w-[260px] text-sm text-muted-foreground">
                Gemini can read your triaged items and suggest what to tackle
                first.
              </p>
              <div className="mt-8 flex w-full flex-col gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => send(prompt)}
                    disabled={loading}
                    className={cn(
                      "w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground",
                      "transition-all duration-200 hover:border-accent/40 hover:bg-muted hover:-translate-y-0.5 hover:shadow-md",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                      "disabled:opacity-50 disabled:pointer-events-none",
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <MessageBubble key={i} role={m.role} content={m.content} />
              ))}
              {awaitingFirstChunk && <TypingIndicator />}
              {error && (
                <div
                  role="alert"
                  className="self-start max-w-[85%] rounded-2xl rounded-bl-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Input bar */}
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 border-t border-border px-4 py-3"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Message Gemini..."
            aria-label="Message"
            disabled={loading}
            autoComplete="off"
          />
          <Button
            type="submit"
            size="md"
            disabled={loading || input.trim().length === 0}
            aria-label="Send"
            className="px-4"
          >
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Button>
        </form>
      </div>
    </aside>
  );
}

function MessageBubble({ role, content }: { role: ChatRole; content: string }) {
  const isUser = role === "user";
  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-[linear-gradient(to_right,var(--accent),var(--accent-secondary))] text-white shadow-[0_4px_14px_rgba(0,82,255,0.25)]"
            : "rounded-bl-sm bg-muted text-foreground",
        )}
      >
        {content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex w-full justify-start" aria-live="polite">
      <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span
            className="h-1.5 w-1.5 rounded-full bg-accent pulse-dot"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-accent pulse-dot"
            style={{ animationDelay: "200ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-accent pulse-dot"
            style={{ animationDelay: "400ms" }}
          />
        </div>
        <span className="sr-only">Gemini is thinking</span>
      </div>
    </div>
  );
}
