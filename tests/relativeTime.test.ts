import { describe, it, expect } from "vitest";

// Copied verbatim from src/components/WhyPanel.tsx. Not exported there,
// so we test an equivalent local copy.
function relativeTime(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const abs = Math.abs(diffMin);
  if (abs < 1) return "now";
  if (abs < 60) return diffMin >= 0 ? `in ${abs}m` : `${abs}m ago`;
  const diffHr = Math.round(diffMin / 60);
  const absHr = Math.abs(diffHr);
  if (absHr < 24) return diffHr >= 0 ? `in ${absHr}h` : `${absHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  const absDay = Math.abs(diffDay);
  return diffDay >= 0 ? `in ${absDay}d` : `${absDay}d ago`;
}

describe("relativeTime", () => {
  it("returns 'now' for a timestamp a few seconds in the past", () => {
    // 5s is comfortably inside the < 1 minute window even with test-runner
    // startup latency. 30s sits on the rounding boundary and is flaky.
    const iso = new Date(Date.now() - 5_000).toISOString();
    expect(relativeTime(iso)).toBe("now");
  });

  it("formats minutes-in-the-past as 'Nm ago'", () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(relativeTime(iso)).toBe("5m ago");
  });

  it("formats hours-in-the-future as 'in Nh'", () => {
    const iso = new Date(Date.now() + 2 * 60 * 60_000).toISOString();
    expect(relativeTime(iso)).toBe("in 2h");
  });

  it("formats days-in-the-future as 'in Nd'", () => {
    const iso = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    expect(relativeTime(iso)).toBe("in 1d");
  });

  it("returns null when iso is undefined", () => {
    expect(relativeTime(undefined)).toBeNull();
  });

  it("returns null for an unparseable date string", () => {
    expect(relativeTime("not-a-real-date")).toBeNull();
  });
});
