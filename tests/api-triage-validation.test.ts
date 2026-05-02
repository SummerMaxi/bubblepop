import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { POST } from "@/app/api/triage/route";
import type { ContextItem } from "@/lib/types";

/**
 * These tests exercise ONLY the request-validation paths of the triage
 * route — never the success path, which would hit Gemini and burn quota.
 */

function makeRequest(body: unknown, opts: { rawBody?: string } = {}): Request {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: opts.rawBody ?? JSON.stringify(body),
  };
  return new Request("http://localhost/api/triage", init);
}

const sampleItem: ContextItem = {
  id: "x-1",
  source: "email",
  title: "test item",
};

describe("POST /api/triage — validation", () => {
  beforeAll(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("returns 400 'invalid JSON' for an unparseable body", async () => {
    const res = await POST(makeRequest(null, { rawBody: "{not-json" }));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/invalid JSON/i);
  });

  it("returns 400 'non-empty array' when body has no items field", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/non-empty array/i);
  });

  it("returns 400 'non-empty array' when items is an empty array", async () => {
    const res = await POST(makeRequest({ items: [] }));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/non-empty array/i);
  });

  it("returns 400 'max 50' when items has more than 50 entries", async () => {
    const items: ContextItem[] = Array.from({ length: 51 }, (_, i) => ({
      ...sampleItem,
      id: `x-${i}`,
    }));
    const res = await POST(makeRequest({ items }));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/max 50/i);
  });
});

describe("POST /api/triage — missing GEMINI_API_KEY", () => {
  it("returns 500 with an error mentioning GEMINI_API_KEY", async () => {
    // Clear any stub from the other describe block first so process.env truly
    // has no GEMINI_API_KEY.
    vi.unstubAllEnvs();
    vi.stubEnv("GEMINI_API_KEY", "");
    const res = await POST(makeRequest({ items: [sampleItem] }));
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/GEMINI_API_KEY/);
    vi.unstubAllEnvs();
  });
});
