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
  customDomain?: string;
  domainStatus?: "active" | "pending" | "none";
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

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("cloudrik-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
}

export async function fetchProjectsFromServer(): Promise<Project[]> {
  try {
    const token = getAuthToken();
    const workspaceId = typeof window !== "undefined" ? localStorage.getItem("cloudrik-workspace") : null;
    let url = PROJECTS_API_URL;
    if (workspaceId) {
      url += `?workspaceId=${workspaceId}`;
    }

    const res = await fetch(url, { 
      signal: AbortSignal.timeout(8000),
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) return [];
    const data = await res.json() as Array<{
      name: string;
      repo: string;
      port: number;
      url: string;
      status: string;
      createdAt: string;
      framework?: string;
      custom_domain?: string;
      domain_status?: "active" | "pending" | "none";
    }>;
    return data.map((p, i) => ({
      id: new Date(p.createdAt).getTime() || i,
      name: p.name,
      domain: p.url,
      repo: p.repo,
      port: p.port,
      framework: p.framework || "unknown",
      customDomain: p.custom_domain,
      domainStatus: p.domain_status || "none",
      status: p.status === "running" ? "live" : p.status === "failed" ? "failed" : p.status === "stopped" ? "stopped" : "building",
      deployedAt: new Date(p.createdAt).getTime() || Date.now(),
    }));
  } catch {
    return [];
  }
}

export async function deleteProjectFromServer(name: string): Promise<boolean> {
  try {
    const token = getAuthToken();
    const res = await fetch(`${PROJECTS_API_URL.replace("/projects", "")}/projects/${encodeURIComponent(name)}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function addCustomDomainToServer(projectName: string, domain: string): Promise<{ success: boolean; customDomain?: string; error?: string }> {
  try {
    const token = getAuthToken();
    const workspaceId = typeof window !== "undefined" ? localStorage.getItem("cloudrik-workspace") : null;
    let url = `${PROJECTS_API_URL.replace("/projects", "")}/projects/${encodeURIComponent(projectName)}/domain`;
    if (workspaceId) url += `?workspaceId=${workspaceId}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ domain })
    });
    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error || "Failed to add domain" };
    }
    const data = await res.json();
    return data;
  } catch(e: any) {
    return { success: false, error: e.message };
  }
}

export async function removeCustomDomainFromServer(projectName: string): Promise<boolean> {
  try {
    const token = getAuthToken();
    const workspaceId = typeof window !== "undefined" ? localStorage.getItem("cloudrik-workspace") : null;
    let url = `${PROJECTS_API_URL.replace("/projects", "")}/projects/${encodeURIComponent(projectName)}/domain`;
    if (workspaceId) url += `?workspaceId=${workspaceId}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkCustomDomainStatusFromServer(projectName: string): Promise<"active" | "pending" | "none"> {
  try {
    const token = getAuthToken();
    const workspaceId = typeof window !== "undefined" ? localStorage.getItem("cloudrik-workspace") : null;
    let url = `${PROJECTS_API_URL.replace("/projects", "")}/projects/${encodeURIComponent(projectName)}/domain/status`;
    if (workspaceId) url += `?workspaceId=${workspaceId}`;

    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store"
    });
    if (!res.ok) return "none";
    const data = await res.json();
    return data.status || "none";
  } catch {
    return "none";
  }
}

export async function checkDnsStatusFromServer(projectName: string): Promise<{ rootVerified: boolean; wwwVerified: boolean }> {
  try {
    const token = getAuthToken();
    const workspaceId = typeof window !== "undefined" ? localStorage.getItem("cloudrik-workspace") : null;
    let url = `${PROJECTS_API_URL.replace("/projects", "")}/projects/${encodeURIComponent(projectName)}/domain/dns-check`;
    if (workspaceId) url += `?workspaceId=${workspaceId}`;

    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store"
    });
    if (!res.ok) return { rootVerified: false, wwwVerified: false };
    const data = await res.json();
    return { rootVerified: !!data.rootVerified, wwwVerified: !!data.wwwVerified };
  } catch {
    return { rootVerified: false, wwwVerified: false };
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
