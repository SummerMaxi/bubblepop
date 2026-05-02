# BubblePop — architecture

A short tour of the codebase for anyone reading the source. For *what* the project does and *why*, see [README.md](./README.md). This doc focuses on *how it's organized*.

---

## Directory map

```
src/
├── app/                      Next.js App Router routes
│   ├── layout.tsx            Root layout — fonts + AuthProvider
│   ├── page.tsx              Marketing homepage (composes landing/* sections)
│   ├── app/page.tsx          The actual app — bubble canvas + side panels
│   ├── globals.css           Tailwind + design tokens + signature animations
│   └── api/
│       ├── triage/route.ts   Gemini scoring (importance + urgency + reason)
│       └── chat/route.ts     Gemini chat (streams text/plain over a ReadableStream)
│
├── components/
│   ├── ui/                   Reusable design-system primitives (no business logic)
│   │   ├── Button.tsx        Primary/secondary/ghost variants, sizes
│   │   ├── Card.tsx          Standard/elevated/featured variants
│   │   ├── Input.tsx         Text input with focus ring
│   │   ├── ScoreBar.tsx      Importance/urgency bar — used wherever a score appears
│   │   └── SectionLabel.tsx  Pill badge with monospace text + dot
│   │
│   ├── landing/              Marketing-page sections (composed by app/page.tsx)
│   │   ├── SiteHeader.tsx    Sticky top nav
│   │   ├── Hero.tsx          Headline + dual CTA + decorative bubble preview
│   │   ├── HowItWorks.tsx    3-step timeline with connecting line on desktop
│   │   ├── Features.tsx      Inverted bg, 3-column feature grid
│   │   ├── FinalCta.tsx      Inverted dark CTA card with dot pattern
│   │   └── SiteFooter.tsx    Repo footer
│   │
│   ├── TriageBubbleMap.tsx   d3-force canvas — bubblemaps.io-style sizing + connections
│   ├── AccessibleListView.tsx  Keyboard-navigable WCAG fallback over the same data
│   ├── WhyPanel.tsx          Slide-in detail panel (the AI's reasoning)
│   └── ChatPanel.tsx         Slide-in conversational chat panel (streaming)
│
└── lib/
    ├── AuthContext.tsx       Firebase Auth + demo mode + OAuth token capture
    ├── firebase.ts           Env-driven Firebase config + scope constants
    ├── useTriage.ts          Hook: fetch context → POST /api/triage → merge scores
    ├── google/               Gmail/Calendar/Tasks fetchers (browser-side)
    │   ├── gmail.ts          Recent unread, parse From/Subject/Date headers
    │   ├── calendar.ts       Upcoming events in next 24h
    │   ├── tasks.ts          Open tasks across all task lists
    │   └── index.ts          fetchAllContext — Promise.all + per-source caps
    ├── mockContext.ts        Realistic demo data for the no-auth path
    ├── rateLimit.ts          Fixed-window per-IP rate limiter (in-memory)
    ├── format.ts             Shared formatting helpers (relativeTime, source maps)
    ├── constants.ts          All tunable thresholds in one place
    ├── types.ts              Shared types (ContextItem, ScoredItem, TriagedItem)
    └── cn.ts                 class-merging helper (clsx + tailwind-merge)

tests/                        Vitest unit tests — 33 cases across 6 files
```

---

## Layering rules

1. **`lib/`** is leaf — never imports from `components/` or `app/`. Pure types, helpers, and hooks.
2. **`components/ui/`** is a leaf within `components/` — never imports from `landing/` or top-level components. Only depends on `lib/`.
3. **`components/landing/`** depends on `components/ui/` + `lib/`. Never on top-level components.
4. **Top-level components** (`TriageBubbleMap`, `WhyPanel`, etc.) depend on `components/ui/` + `lib/`.
5. **`app/`** is the only place that wires top-level components together. Contains the routes, period.

This keeps imports flowing one direction and prevents cycles.

---

## Server / client boundary

| Code | Runs where | Why |
|---|---|---|
| `app/api/*/route.ts` | **Server** (Next.js route handler) | Holds the `GEMINI_API_KEY` — never sent to the client |
| `lib/google/*` | **Browser** | Calls Google APIs directly with the OAuth token from Firebase Auth. No server proxy needed (Google APIs accept browser CORS with bearer tokens). |
| `app/page.tsx`, `app/app/page.tsx` | **Browser** (`"use client"`) | All UI |
| `lib/AuthContext.tsx` | **Browser** | Firebase Auth lives in the browser by design |
| `lib/rateLimit.ts` | **Server only** | Imported only from `app/api/*/route.ts` |

The server-only modules never `import` browser-only code (Firebase). The browser code never imports `rateLimit` or anything that touches `process.env.GEMINI_API_KEY`.

---

## Data flow on every page load

```
1. Browser loads /app
2. AuthContext checks Firebase auth state (or demo flag)
3. useTriage() fires:
     a. authenticated  → fetchAllContext(token) hits Gmail+Calendar+Tasks in parallel
        demo mode      → MOCK_CONTEXT
     b. POST those items to /api/triage
4. Server route handler:
     a. rateLimit() check (after cache hit so cache hits stay free)
     b. cache lookup (60s TTL keyed by JSON of items)
     c. Gemini API call with schema-enforced JSON output
     d. clamp01(importance), clamp01(urgency), trim reason
     e. cache + return
5. Browser merges scores into items → TriagedItem[]
6. TriageBubbleMap mounts, d3-force simulates, bubbles render
7. User clicks a bubble → WhyPanel slides in with the reason
8. User clicks "Ask Gemini" → ChatPanel posts to /api/chat
     a. Server streams text/plain via ReadableStream wrapping
        ai.models.generateContentStream
     b. Browser reads with getReader() + TextDecoder, appending to last
        message in place so the UI grows live
```

---

## Key design decisions

### Read-only OAuth scopes
We only request `gmail.readonly`, `calendar.readonly`, `tasks` (Tasks is full because we may eventually want pop-to-complete, but we don't currently write). This keeps the consent screen friendly and matches the "second-pair-of-eyes" trust model.

### Demo mode is a feature, not a fallback
`continueAsDemo()` is a deliberate first-class auth state, not a hack triggered when Firebase fails. Judges and visitors can run the entire pipeline including live Gemini calls without ever signing in.

### Browser-side Google API calls
Cleaner than a server proxy: Firebase exposes the OAuth token to the client by design, and Google APIs accept browser CORS with bearer tokens. No double round-trip, no token-passing dance.

### Schema-enforced JSON output
`/api/triage` uses Gemini's `responseSchema` so the model can only return `{id, importance, urgency, reason}` tuples. No retry-on-parse-fail logic needed.

### Streaming chat over plain text/plain
Not SSE. The client-side reader is simpler with raw `text/plain` chunks — `getReader() + TextDecoder` and append to the last assistant message. SSE would add framing overhead for no real benefit here.

### In-memory rate limiter and cache
Cloud Run scales horizontally, so per-instance state isn't perfect global dedup. That's fine: the goal is to absorb repeat clicks within a single user's session, not enforce global quotas. Production would swap in Redis/Memorystore.

### `lib/constants.ts` is the only place magic numbers live
Bubble radii, cache TTLs, rate limits, Workspace fetcher caps — all named constants, all in one file, all commented. No number-by-number drift across modules.

---

## Where to make changes

| Change | File |
|---|---|
| Add a new section to the marketing page | `components/landing/<NewSection>.tsx`, mount in `app/page.tsx` |
| Tune a threshold (radius, rate limit, cache TTL) | `lib/constants.ts` |
| Add a Google service (e.g. Drive) | `lib/google/<service>.ts` + add to `fetchAllContext` |
| Change Gemini prompts | `app/api/triage/route.ts` (SYSTEM_INSTRUCTION) or `app/api/chat/route.ts` (`buildSystemInstruction`) |
| Add a new design primitive | `components/ui/<Primitive>.tsx` |
| Change bubble visual treatment | `components/TriageBubbleMap.tsx` |
| Change the AI reasoning panel layout | `components/WhyPanel.tsx` |
