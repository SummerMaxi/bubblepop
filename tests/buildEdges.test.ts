import { describe, it, expect } from "vitest";
import type { TriagedItem } from "@/lib/types";

interface Edge {
  source: string;
  target: string;
}

// Copied verbatim from src/components/TriageBubbleMap.tsx.
function buildEdges(items: TriagedItem[]): Edge[] {
  const buckets = new Map<string, string[]>();
  for (const item of items) {
    if (!item.from) continue;
    const key = item.from.toLowerCase();
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(item.id);
  }
  const edges: Edge[] = [];
  for (const ids of buckets.values()) {
    for (let i = 0; i < ids.length - 1; i++) {
      edges.push({ source: ids[i], target: ids[i + 1] });
    }
  }
  return edges;
}

// Helper to fabricate a TriagedItem with just the fields buildEdges cares about.
function item(id: string, from?: string): TriagedItem {
  return {
    id,
    source: "email",
    title: `Item ${id}`,
    from,
    importance: 0.5,
    urgency: 0.5,
    reason: "test",
  };
}

describe("buildEdges", () => {
  it("returns no edges for an empty items array", () => {
    expect(buildEdges([])).toEqual([]);
  });

  it("returns no edges when no item has a `from` field", () => {
    expect(buildEdges([item("a"), item("b"), item("c")])).toEqual([]);
  });

  it("links two items that share a `from` (case-insensitive)", () => {
    const edges = buildEdges([
      item("a", "Alice@Example.com"),
      item("b", "alice@example.com"),
    ]);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual({ source: "a", target: "b" });
  });

  it("chains three same-from items into 2 sequential edges", () => {
    const edges = buildEdges([
      item("a", "x@y.com"),
      item("b", "x@y.com"),
      item("c", "x@y.com"),
    ]);
    expect(edges).toHaveLength(2);
    expect(edges).toEqual([
      { source: "a", target: "b" },
      { source: "b", target: "c" },
    ]);
  });

  it("only links items with the same `from`, leaving solos alone", () => {
    const edges = buildEdges([
      item("a", "x@y.com"),
      item("b", "x@y.com"),
      item("c", "lonely@y.com"),
      item("d"), // no from
    ]);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual({ source: "a", target: "b" });
  });
});
