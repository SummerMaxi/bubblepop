import type { ContextItem } from "@/lib/types";

/**
 * Enumerates every task list on the user's Google Tasks account, fetches
 * incomplete tasks from each in parallel, and returns the union as ContextItems.
 */

interface TaskListItem {
  id: string;
  title?: string;
}

interface TaskListsResponse {
  items?: TaskListItem[];
}

interface TaskItem {
  id: string;
  title?: string;
  notes?: string;
  due?: string; // ISO 8601 already
  status?: string;
}

interface TasksResponse {
  items?: TaskItem[];
}

async function authedFetch<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Tasks auth expired (401) — please sign in again.");
    }
    throw new Error(
      `Tasks API ${res.status}: ${await res.text().catch(() => "")}`,
    );
  }
  return (await res.json()) as T;
}

export async function fetchOpenTasks(
  accessToken: string,
): Promise<ContextItem[]> {
  const lists = await authedFetch<TaskListsResponse>(
    "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
    accessToken,
  );
  const listIds = (lists.items ?? []).map((l) => l.id);

  const perList = await Promise.all(
    listIds.map(async (listId) => {
      const url = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
        listId,
      )}/tasks?showCompleted=false&maxResults=20`;
      try {
        const resp = await authedFetch<TasksResponse>(url, accessToken);
        return resp.items ?? [];
      } catch (err) {
        console.warn(`tasks: failed to fetch list ${listId}`, err);
        return [] as TaskItem[];
      }
    }),
  );

  const items: ContextItem[] = [];
  for (const tasks of perList) {
    for (const t of tasks) {
      items.push({
        id: `task-${t.id}`,
        source: "task",
        title: t.title || "(untitled task)",
        snippet: t.notes,
        timestamp: t.due,
      });
    }
  }
  return items;
}
