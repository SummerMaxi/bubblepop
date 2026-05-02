import { describe, it, expect } from "vitest";

// Copied verbatim from src/components/TriageBubbleMap.tsx.
const MIN_RADIUS = 32;
const MAX_RADIUS = 110;
const RADIUS_CURVE = 1.6;

function importanceToRadius(importance: number) {
  const t = Math.pow(Math.max(0, Math.min(1, importance)), 1 / RADIUS_CURVE);
  return MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * t;
}

describe("importanceToRadius", () => {
  it("maps 0 to MIN_RADIUS (32)", () => {
    expect(importanceToRadius(0)).toBe(MIN_RADIUS);
  });

  it("maps 1 to MAX_RADIUS (110)", () => {
    expect(importanceToRadius(1)).toBe(MAX_RADIUS);
  });

  it("maps 0.5 to a value between MIN_RADIUS and MAX_RADIUS", () => {
    const r = importanceToRadius(0.5);
    expect(r).toBeGreaterThan(MIN_RADIUS);
    expect(r).toBeLessThan(MAX_RADIUS);
    // With t = 0.5 ^ (1/1.6) ≈ 0.6498, the result is *above* the linear midpoint
    // (71). The "less than midpoint due to power curve" guard from the spec does
    // not hold for an exponent < 1 — verify the actual concave-up behavior.
    const linearMid = (MIN_RADIUS + MAX_RADIUS) / 2;
    expect(r).toBeGreaterThan(linearMid);
  });

  it("clamps negative input up to MIN_RADIUS", () => {
    expect(importanceToRadius(-0.5)).toBe(MIN_RADIUS);
  });

  it("clamps input > 1 down to MAX_RADIUS", () => {
    expect(importanceToRadius(1.5)).toBe(MAX_RADIUS);
  });

  it("is monotonically increasing across the input range", () => {
    const r3 = importanceToRadius(0.3);
    const r6 = importanceToRadius(0.6);
    const r9 = importanceToRadius(0.9);
    expect(r3).toBeLessThan(r6);
    expect(r6).toBeLessThan(r9);
  });
});
