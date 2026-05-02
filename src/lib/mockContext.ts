import type { ContextItem } from "./types";

/**
 * Demo context — used when the user is in demo mode (no Google sign-in).
 * Mirrors the shape of real Gmail/Calendar/Tasks fetchers so the rest of
 * the pipeline (triage + UI) is identical in both modes.
 */
export const MOCK_CONTEXT: ContextItem[] = [
  {
    id: "email-1",
    source: "email",
    title: "Re: Q3 launch — go/no-go decision needed by EOD",
    snippet:
      "Priya here. Legal cleared the privacy review this morning. Need your sign-off before 5pm so marketing can ship the announcement tomorrow.",
    from: "priya@acme.com",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cal-1",
    source: "calendar",
    title: "1:1 with Marcus (Director, Eng)",
    snippet: "Weekly check-in. Agenda: roadmap, hiring, on-call rotation.",
    from: "marcus@acme.com",
    timestamp: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-1",
    source: "task",
    title: "Review pull request #482 (auth refactor)",
    snippet: "Three engineers blocked on this review.",
    timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "email-2",
    source: "email",
    title: "[Newsletter] This week in distributed systems",
    snippet:
      "Top reads: gossip protocols, Raft vs Paxos, the case against microservices.",
    from: "newsletter@infoq.example",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-2",
    source: "task",
    title: "Update team OKRs doc for next quarter",
    snippet: "Draft due to leadership next Friday.",
    timestamp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cal-2",
    source: "calendar",
    title: "Customer escalation call — Globex Inc.",
    snippet: "P1 incident from yesterday. CTO of Globex will be on the call.",
    from: "support-escalations@acme.com",
    timestamp: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-3",
    source: "task",
    title: "Approve expense report",
    snippet: "Submitted by James (offsite travel).",
    timestamp: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "email-3",
    source: "email",
    title: "Lunch tomorrow?",
    snippet: "Hey! Free for lunch tomorrow around 12:30? - Sam",
    from: "sam@acme.com",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];
