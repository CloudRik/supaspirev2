import { PROJECTS_API_URL } from "./deploy";

export type ProjectStatus = "live" | "building" | "failed" | "running" | "stopped";

export type Project = {
  id: number;
  name: string;
  domain: string;
  status: ProjectStatus;
  deployedAt: number;
  repo?: string;
  port?: number;
  framework?: string;
};

const KEY = "zenith.projects";

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

export async function fetchProjectsFromServer(): Promise<Project[]> {
  try {
    const res = await fetch(PROJECTS_API_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json() as Array<{
      name: string;
      repo: string;
      port: number;
      url: string;
      status: string;
      createdAt: string;
      framework?: string;
    }>;
    return data.map((p, i) => ({
      id: new Date(p.createdAt).getTime() || i,
      name: p.name,
      domain: p.url,
      repo: p.repo,
      port: p.port,
      framework: p.framework || "unknown",
      status: p.status === "running" ? "live" : p.status === "failed" ? "failed" : p.status === "stopped" ? "stopped" : "building",
      deployedAt: new Date(p.createdAt).getTime() || Date.now(),
    }));
  } catch {
    return [];
  }
}

export async function deleteProjectFromServer(name: string): Promise<boolean> {
  try {
    const res = await fetch(`${PROJECTS_API_URL.replace("/projects", "")}/projects/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function saveProject(input: {
  name: string;
  domain: string;
  status: ProjectStatus;
  repo?: string;
  framework?: string;
}): Project {
  const projects = getProjects();
  const now = Date.now();
  const existingIdx = projects.findIndex((p) => p.name === input.name);
  const next: Project = {
    id: existingIdx >= 0 ? projects[existingIdx].id : now,
    name: input.name,
    domain: input.domain,
    status: input.status,
    repo: input.repo,
    framework: input.framework,
    deployedAt: now,
  };
  if (existingIdx >= 0) {
    projects[existingIdx] = next;
  } else {
    projects.unshift(next);
  }
  localStorage.setItem(KEY, JSON.stringify(projects));
  return next;
}

export function removeProjectLocally(name: string): void {
  const projects = getProjects().filter((p) => p.name !== name);
  localStorage.setItem(KEY, JSON.stringify(projects));
}

export function formatRelativeTime(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return `${m} min${m === 1 ? "" : "s"} ago`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.floor(seconds / 86400);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}
