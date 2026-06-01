/**
 * Recently-opened projects, persisted to localStorage so the dashboard can show
 * a "Jump back in" strip and the command palette can deep-link straight to a
 * project. Purely client-side — no schema, no network.
 */
export interface RecentProject {
  chainId: string;
  projectId: string;
  name: string;
  chainName?: string;
  at: number;
}

const KEY = 'chainwork-recent-projects';
const MAX = 8;

export function getRecentProjects(): RecentProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as RecentProject[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function recordRecentProject(entry: Omit<RecentProject, 'at'>): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getRecentProjects().filter((p) => p.projectId !== entry.projectId);
    const next: RecentProject[] = [{ ...entry, at: Date.now() }, ...list].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Drop a project from the recents (e.g. when it 404s / was deleted). */
export function forgetRecentProject(projectId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const next = getRecentProjects().filter((p) => p.projectId !== projectId);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
