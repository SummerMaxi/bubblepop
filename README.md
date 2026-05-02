# BubblePop

> **Your inbox, calendar, and tasks — triaged.** A gamified team-lead assistant that pulls real Google Workspace context, asks Gemini what actually matters today, and renders it as a living physics-based bubble map.

Built for the hackathon. Powered by **Gemini 2.5 Flash** and **Google Workspace** (Gmail, Calendar, Tasks).

---

## The chosen vertical

**The overwhelmed team lead.**

Engineering managers, product leads, and team owners juggle dozens of context streams every morning — Gmail threads, Calendar conflicts, Google Tasks backlogs, Slack — and have to decide _what to do first_ before they've even had coffee. Ranked lists are fine, but they hide the relative weight of decisions: a P1 customer escalation and a "lunch?" reply look the same on a 10-row list.

BubblePop solves this by **encoding AI judgment in physics**. Importance becomes bubble size. Urgency becomes pull-to-center. Items from the same person cluster together via d3-force links. The most critical thing is _visually_ the biggest, brightest object on the screen — and one click tells you exactly _why_ Gemini ranked it that way.

---

## What it does

1. **Connects to Google Workspace** — Firebase Auth + Google OAuth with read-only scopes (`gmail.readonly`, `calendar.readonly`, `tasks`). Nothing leaves the user's account.
2. **Pulls real context** — recent Gmail messages (last 24h), upcoming Calendar events (next 24h), and open Tasks across all task lists, in parallel.
3. **Asks Gemini to triage** — every item gets two scores (`importance` and `urgency`, both 0–1) plus a one-sentence reason. Schema-enforced JSON output via `responseSchema`, so the model can't drift.
4. **Renders a bubblemaps.io-style canvas** — d3-force simulation. Importance drives radius (exponentially scaled — a 0.95 bubble is dramatically bigger than a 0.3). Importance + urgency drive the pull-to-center force. Items sharing a sender are linked by dashed connection lines and naturally cluster.
5. **Click a bubble → side "Why" panel** — shows source, sender, time, importance + urgency bars, and Gemini's exact one-sentence reasoning. The AI's logic is fully visible, never a black box.
6. **Conversational layer** — "Ask Gemini" side panel with the full triaged context injected into the system prompt. Ask "what should I do first?" / "summarize my urgent emails" / "anyone blocked on me?" and get terse, decisive replies referencing the user's actual items.
7. **WCAG-accessible list view** — toggle between bubble-map and a fully keyboard-navigable list. Same data, same selection, same Why panel.
8. **Demo mode** — a deliberate path (not a fallback) for judges/visitors who don't want to connect Google. Realistic mock context exercises the entire pipeline including Gemini triage.

---

## How it works (architecture)

```
              ┌───────────────────────────────────────────┐
              │   Browser (Next.js client + React 19)     │
              │                                           │
  Sign in ───►│  Firebase Auth (Google OAuth)             │
              │  ↓ accessToken                            │
  Browser ───►│  fetchAllContext(token):                  │
   fetches    │    Gmail + Calendar + Tasks (parallel)    │
              │  ↓ ContextItem[]                          │
              │                                           │
  /api/triage ◄─POST────────────────────────────┐         │
              │                                  │         │
              └──────────────────────────────────┼─────────┘
                                                 │
                       ┌─────────────────────────▼──────────┐
                       │  Next.js Route Handler (server)    │
                       │  /api/triage  ─►  Gemini 2.5 Flash │
                       │     systemInstruction + JSON schema │
                       │  ◄── ScoredItem[] {imp, urg, reason}│
                       └────────────────────────────────────┘

       Browser receives scored items ──► d3-force simulation
                                     ──► Bubble canvas / List view
                                     ──► Why panel on click

  Chat:  Browser ─►  /api/chat (server) ─►  Gemini (full context in system prompt)
```

**Why the split?** The Gemini API key is **server-only** (no `NEXT_PUBLIC_` prefix), so all model calls go through Next.js route handlers. Google Workspace API calls are **direct browser → Google** — Google APIs accept browser CORS with bearer tokens, and Firebase already exposes the OAuth token to the client by design. This avoids a needless server proxy and keeps the architecture simple.

---

## Google services used

This is the heart of the hackathon evaluation, so to be explicit:

| Service | Purpose | Where |
|---|---|---|
| **Gemini API** (2.5 Flash) | Triage scoring + chat | `src/app/api/triage/route.ts`, `src/app/api/chat/route.ts` |
| **Firebase Authentication** | Google OAuth flow + token issuance | `src/lib/firebase.ts`, `src/lib/AuthContext.tsx` |
| **Gmail API** | Read recent messages | `src/lib/google/gmail.ts` |
| **Google Calendar API** | Read upcoming events | `src/lib/google/calendar.ts` |
| **Google Tasks API** | Read open tasks across all lists | `src/lib/google/tasks.ts` |
| **next/font/google** | Self-host Inter, Calistoga, JetBrains Mono | `src/app/layout.tsx` |

Five distinct Google integrations across two layers (auth + data + AI), all woven into a single coherent product loop.

---

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack dev), React 19, TypeScript 5
- **Styling:** Tailwind CSS v4 with custom design tokens; `clsx` + `tailwind-merge` for class composition
- **Visualization:** `d3-force` for the bubble physics
- **Auth:** Firebase JS SDK 12 (`signInWithPopup` with `GoogleAuthProvider`, additional scopes for Workspace APIs)
- **AI:** `@google/genai` SDK (Gemini 2.5 Flash), schema-enforced JSON output
- **Icons:** `lucide-react`
- **Fonts:** Calistoga (display), Inter (UI), JetBrains Mono (labels) — self-hosted via `next/font`

---

## Local setup

### Prerequisites
- Node 20+
- A Firebase project with Google sign-in enabled
- `gmail.readonly`, `calendar.readonly`, `tasks` scopes added to the OAuth consent screen, with your test Gmail added as a test user
- Gmail API, Calendar API, Tasks API enabled in Google Cloud
- A Gemini API key (from [aistudio.google.com](https://aistudio.google.com/apikey))

### Steps

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# fill in NEXT_PUBLIC_FIREBASE_* values from Firebase Console
# fill in GEMINI_API_KEY from AI Studio

# 3. Run
npm run dev
# → http://localhost:3000
```

Then either click **"Sign in with Google"** for the real flow, or **"Continue with demo data"** to explore without auth — both routes through Gemini, both render the same bubble canvas.

---

## Deploy to Cloud Run (auto-deploy on `git push`)

The repo includes `Dockerfile` + `cloudbuild.yaml` so a Cloud Build trigger watching the `main` branch will build → push to Artifact Registry → deploy to Cloud Run automatically on every push.

### One-time setup

1. **Create the Cloud Build trigger** in Google Cloud Console → Cloud Build → Triggers:
   - Event: **Push to a branch**
   - Source: GitHub (App) → `SummerMaxi/bubblepop`
   - Branch: `^main$`
   - Configuration: **Autodetected** (it'll pick up `cloudbuild.yaml`)
   - Service account: a service account with `Cloud Build Service Account`, `Cloud Run Admin`, and `Artifact Registry Writer` roles

2. **Add substitution variables** to the trigger so Firebase auth works in production. The deployment-related ones (`_AR_HOSTNAME`, `_SERVICE_NAME`, etc.) are already in the trigger — these are additional:

   | Variable | Value |
   |---|---|
   | `_NEXT_PUBLIC_FIREBASE_API_KEY` | from Firebase Console |
   | `_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` |
   | `_NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `<project>` |
   | `_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `<project>.firebasestorage.app` |
   | `_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | from Firebase Console |
   | `_NEXT_PUBLIC_FIREBASE_APP_ID` | from Firebase Console |
   | `_NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | from Firebase Console (optional) |

   These are public-safe (they identify the Firebase project, security comes from Firebase rules), so they're fine in build-time substitutions.

3. **Set the Gemini API key** as a runtime env var on the Cloud Run service. Two options:

   **Option A — Plain env var (quickest):**
   ```bash
   gcloud run services update bubblepop \
     --region europe-west1 \
     --update-env-vars GEMINI_API_KEY=your-key-here
   ```

   **Option B — Secret Manager (recommended):**
   ```bash
   echo -n "your-gemini-key" | gcloud secrets create gemini-api-key --data-file=-
   gcloud run services update bubblepop \
     --region europe-west1 \
     --update-secrets GEMINI_API_KEY=gemini-api-key:latest
   ```

4. **Add your Cloud Run domain to Firebase authorized domains** so the OAuth popup works:
   Firebase Console → Authentication → Settings → Authorized domains → add `bubblepop-<hash>-ew.a.run.app`

### What happens on every push

```
git push origin main
  ↓
Cloud Build trigger fires
  ↓
docker build (Stage 1: deps → Stage 2: Next.js build → Stage 3: minimal runtime)
  ↓
docker push  →  Artifact Registry
  ↓
gcloud run deploy bubblepop --image=...  →  Cloud Run
  ↓
new revision live, traffic shifted automatically
```

The Dockerfile uses Next.js's `output: 'standalone'` mode, so the runtime image is ~50 MB — fast cold starts on Cloud Run.

### Manual deploy (no trigger)

```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_NEXT_PUBLIC_FIREBASE_API_KEY=...,_NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx              Root layout — fonts + AuthProvider
│   ├── page.tsx                Marketing homepage (hero, how-it-works, features, CTA)
│   ├── app/page.tsx            The actual app — bubble canvas + side panels
│   └── api/
│       ├── triage/route.ts     Gemini triage scorer (importance + urgency + reason)
│       └── chat/route.ts       Gemini chat with full triage context as system prompt
├── components/
│   ├── ui/                     Button, Card, SectionLabel, Input primitives
│   ├── TriageBubbleMap.tsx     d3-force canvas: bubblemaps.io-style sizing + connections
│   ├── AccessibleListView.tsx  Keyboard-navigable WCAG fallback (same data, list shape)
│   ├── WhyPanel.tsx            Slide-in detail panel with the AI's reasoning
│   └── ChatPanel.tsx           Slide-in conversational chat panel
└── lib/
    ├── AuthContext.tsx         Firebase Auth + demo mode + OAuth token capture
    ├── firebase.ts             Env-driven Firebase config + scope constants
    ├── useTriage.ts            Hook: fetch context → POST /api/triage → merge scores
    ├── google/                 Gmail / Calendar / Tasks fetchers + barrel export
    ├── mockContext.ts          Realistic demo data (8 items spanning the 3 sources)
    ├── types.ts                Shared types: ContextItem, ScoredItem, TriagedItem
    └── cn.ts                   class-merging helper
```

---

## Assumptions & scope decisions

- **Read-only is intentional.** With write scopes we _could_ have Gemini draft and send replies, create events, etc. We chose read-only to (a) clear the hackathon rubric's "responsible implementation" line, (b) keep the OAuth consent screen low-friction, (c) match the user-trust model of a "second-pair-of-eyes" assistant rather than an autonomous agent.
- **Token refresh is not implemented.** Firebase issues an OAuth access token good for ~1 hour. For a hackathon demo this is fine; longer sessions would require either re-auth or a backend service account flow.
- **No persistence.** Triage runs fresh on every refresh — no Firestore writes. Keeps the data model simple and avoids cross-session staleness.
- **24-hour windows.** Gmail/Calendar fetchers look at the last/next 24 hours. Capped at 12 emails / 8 events / 10 tasks (30 max) to keep Gemini's input bounded and triage latency reasonable.
- **Tool-calling deferred.** The chat panel is text-in/text-out; Gemini can suggest "you should reply to Priya saying..." but doesn't actually send. This kept scope tight and matches the read-only stance above.
- **Demo mode is a feature, not a fallback.** It's a deliberate first-class path — a judge can demo the entire pipeline including real Gemini calls without ever clicking "sign in."

---

## Accessibility (rubric)

- Keyboard-navigable list view as a peer to the bubble canvas (toggle in header)
- All interactive elements: visible focus rings (`ring-2 ring-accent`), 44px+ touch targets, `aria-pressed` / `aria-expanded` / descriptive `aria-label`
- WCAG-AA contrast across light + inverted dark sections
- Honors `prefers-reduced-motion` for all continuous animations (pulsing dots, floating bubbles, slow-spinning rings) via `globals.css`
- `<ul role="list">`, `<button type="button">` rows, `aria-controls` on expanding panels
- Semantic HTML throughout — `<header>`, `<main>`, `<aside>`, `<nav>`, `<ol>` for the timeline

---

## Security & responsible implementation (rubric)

- **Server/client key separation:** `GEMINI_API_KEY` is server-only (no `NEXT_PUBLIC_` prefix), only ever read inside route handlers. Firebase config is `NEXT_PUBLIC_` because it's public-safe by design (it identifies the project; security comes from Firestore rules + auth provider settings).
- **Read-only OAuth scopes:** Gmail and Calendar are read-only. Tasks scope is full because we may eventually want pop-to-complete, but we don't currently write.
- **No secrets committed:** `.env.local` is gitignored. `.env.example` is the template.
- **No persistence of user data:** triaged items live only in component state. Page refresh clears everything.
- **Minimal context window:** Gemini only sees titles/snippets/sender/timestamp — never the full message body, never message IDs that could be used to impersonate.
- **Stateless route handlers:** no session storage, no database, no logs of user content.

---

## What's next (if this had a v2)

- Streaming Gemini responses in the chat panel
- Pop-to-complete: clicking a task balloon marks it done in Google Tasks
- Persisted triage so you can scroll back and see what was urgent yesterday
- Slack / Linear ingestion alongside Workspace
- Refresh tokens via a backend service account so sessions outlive an hour

---

## License & attribution

Hackathon project. Design system inspired by minimalist SaaS landing pages; bubble visualization aesthetic inspired by [bubblemaps.io](https://bubblemaps.io).
