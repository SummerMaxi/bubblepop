import { describe, it, expect } from "vitest";

// Equivalent re-implementation of the private clamp01 helper in
// src/app/api/triage/route.ts. The route does not export it, so we copy
// the logic verbatim and test it directly.
const clamp01 = (n: unknown): number => {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0.5;
  return Math.max(0, Math.min(1, x));
};

describe("clamp01", () => {
  it("passes a value already in [0,1] through unchanged", () => {
    expect(clamp01(0.5)).toBe(0.5);
  });

  it("clamps negatives up to 0", () => {
    expect(clamp01(-1)).toBe(0);
  });

  it("clamps values above 1 down to 1", () => {
    expect(clamp01(2)).toBe(1);
  });

  it("returns the 0.5 fallback for NaN", () => {
    expect(clamp01(NaN)).toBe(0.5);
  });

  it("coerces a numeric string to a number", () => {
    // Number("0.7") === 0.7, which is finite and in range.
    expect(clamp01("0.7")).toBeCloseTo(0.7, 10);
  });

  it("returns the 0.5 fallback for undefined", () => {
    expect(clamp01(undefined)).toBe(0.5);
  });
});
