"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { MOCK_CONTEXT } from "@/lib/mockContext";
import { fetchAllContext } from "@/lib/google";
import type { ContextItem, ScoredItem, TriagedItem } from "@/lib/types";

interface TriageState {
  items: TriagedItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  source: "demo" | "google" | null;
}

/**
 * Fetches a context list (Gmail/Calendar/Tasks in auth mode, MOCK in demo mode),
 * sends it to /api/triage for Gemini scoring, and returns the merged result.
 */
export function useTriage(): TriageState {
  const { mode, accessToken } = useAuth();
  const [items, setItems] = useState<TriagedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"demo" | "google" | null>(null);
  const versionRef = useRef(0);

  const run = useCallback(async () => {
    if (mode === "signed-out") {
      setItems([]);
      setSource(null);
      return;
    }

    const myVersion = ++versionRef.current;
    setLoading(true);
    setError(null);

    let context: ContextItem[];
    if (mode === "authenticated" && accessToken) {
      try {
        const real = await fetchAllContext(accessToken);
        if (myVersion !== versionRef.current) return;
        if (real.length === 0) {
          // Nothing in the user's last-24h window — fall back to demo so the
          // UI has something to render but flag it so the user knows.
          context = MOCK_CONTEXT;
          setSource("demo");
          setError(
            "No Gmail / Calendar / Tasks items in the last 24 hours — showing demo data.",
          );
        } else {
          context = real;
          setSource("google");
        }
      } catch (err) {
        if (myVersion !== versionRef.current) return;
        const message =
          err instanceof Error ? err.message : "google fetch failed";
        // Surface the error but keep the demo flow alive so the pipeline
        // can still be exercised end-to-end.
        context = MOCK_CONTEXT;
        setSource("demo");
        setError(`Google fetch failed: ${message}`);
      }
    } else {
      context = MOCK_CONTEXT;
      setSource("demo");
    }

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: context }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `triage HTTP ${res.status}`);
      }
      const { scored } = (await res.json()) as { scored: ScoredItem[] };

      // Stale-response guard: only commit if no newer refresh started.
      if (myVersion !== versionRef.current) return;

      const scoreById = new Map(scored.map((s) => [s.id, s]));
      const merged: TriagedItem[] = context.map((item) => {
        const score = scoreById.get(item.id);
        return {
          ...item,
          importance: score?.importance ?? 0.5,
          urgency: score?.urgency ?? 0.5,
          reason: score?.reason ?? "No reasoning available.",
        };
      });
      setItems(merged);
    } catch (err) {
      if (myVersion !== versionRef.current) return;
      const message = err instanceof Error ? err.message : "triage failed";
      setError(message);
    } finally {
      if (myVersion === versionRef.current) setLoading(false);
    }
  }, [mode, accessToken]);

  useEffect(() => {
    run();
  }, [run]);

  return { items, loading, error, refresh: run, source };
}
