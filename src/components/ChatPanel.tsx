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

export function ChatPanel({ open, onClose, items }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) {
      // small delay so the slide-in animation can start first
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Auto-scroll to bottom whenever messages or loading change.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

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
          return;
        }

        const data = (await res.json()) as { reply?: string };
        if (!data.reply) {
          setError("Empty response from model");
          setLoading(false);
          return;
        }
        setMessages((prev) => [
          ...prev,
          { role: "model", content: data.reply as string },
        ]);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
        setLoading(false);
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
      aria-label="Gemini chat"
    >
      <div className="m-4 flex h-[calc(100%-2rem)] flex-col rounded-2xl border border-border bg-card shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
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
              {loading && <TypingIndicator />}
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
