import { describe, it, expect } from "vitest";
import { MOCK_CONTEXT } from "@/lib/mockContext";

describe("MOCK_CONTEXT", () => {
  it("contains at least 6 items so the demo bubble map is visually rich", () => {
    expect(MOCK_CONTEXT.length).toBeGreaterThanOrEqual(6);
  });

  it("populates the required ContextItem fields (id, source, title) for every entry", () => {
    for (const item of MOCK_CONTEXT) {
      expect(typeof item.id).toBe("string");
      expect(item.id.length).toBeGreaterThan(0);
      expect(typeof item.title).toBe("string");
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.source).toBeDefined();
    }
  });

  it("only uses the three valid ContextSource values", () => {
    const allowed = new Set(["email", "calendar", "task"]);
    for (const item of MOCK_CONTEXT) {
      expect(allowed.has(item.source)).toBe(true);
    }
  });

  it("has globally unique ids", () => {
    const ids = MOCK_CONTEXT.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes at least one item from each of the three sources", () => {
    const sources = new Set(MOCK_CONTEXT.map((i) => i.source));
    expect(sources.has("email")).toBe(true);
    expect(sources.has("calendar")).toBe(true);
    expect(sources.has("task")).toBe(true);
  });
});
