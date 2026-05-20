export const DEPLOY_API_URL = "/api-proxy/deploy";
export const DEPLOY_STREAM_URL = "/api-proxy/deploy/stream";
export const PROJECTS_API_URL = "/api-proxy/projects";
export const WEBHOOK_INFO_URL = "/api-proxy/webhook/info";
export const ENV_VARS_API_URL = "/api-proxy/projects";

export type WebhookInfo = {
  webhookUrl: string;
  secret: string;
  projectName: string;
  slug: string;
};

export async function getWebhookInfo(projectName: string): Promise<WebhookInfo> {
  const res = await fetch(`${WEBHOOK_INFO_URL}/${encodeURIComponent(projectName)}`);
  if (!res.ok) throw new Error("Failed to fetch webhook info");
  return res.json() as Promise<WebhookInfo>;
}

// ── Environment Variables ────────────────────────────────────────────────────

export type EnvVars = Record<string, string>;

export async function getEnvVars(projectName: string): Promise<EnvVars> {
  const res = await fetch(`${ENV_VARS_API_URL}/${encodeURIComponent(projectName)}/env`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("Failed to fetch env vars");
  return res.json() as Promise<EnvVars>;
}

export async function saveEnvVars(projectName: string, vars: EnvVars): Promise<void> {
  const res = await fetch(`${ENV_VARS_API_URL}/${encodeURIComponent(projectName)}/env`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vars }),
  });
  if (!res.ok) throw new Error("Failed to save env vars");
}

export async function deleteEnvVar(projectName: string, key: string): Promise<void> {
  const res = await fetch(
    `${ENV_VARS_API_URL}/${encodeURIComponent(projectName)}/env/${encodeURIComponent(key)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete env var");
}

// ── Deploy helpers ───────────────────────────────────────────────────────────

export type DeployApiPayload = {
  [key: string]: unknown;
};

export type DeployApiResult = {
  errorMessage: string | null;
  liveUrl: string | null;
  logs: string[];
  ok: boolean;
  payload: DeployApiPayload;
};

function toLogLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((line) => String(line).trimEnd()).filter((line) => line.length > 0);
  }
  if (typeof value === "string") {
    return value.split(/\r?\n/).map((line) => line.trimEnd()).filter((line) => line.length > 0);
  }
  return [];
}

function extractLogs(payload: DeployApiPayload): string[] {
  const candidates = [payload.logs, payload.output, payload.terminal, payload.terminalOutput, payload.console, payload.data];
  for (const candidate of candidates) {
    const lines = toLogLines(candidate);
    if (lines.length > 0) return lines;
  }
  return [];
}

function extractLiveUrl(payload: DeployApiPayload): string | null {
  const candidates = [payload.url, payload.liveUrl, payload.live_url, payload.domain, payload.publicUrl, payload.public_url, payload.link];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) return candidate.trim();
  }
  return null;
}

function extractErrorMessage(payload: DeployApiPayload, fallback: string): string | null {
  const candidates = [payload.error, payload.message, payload.detail, payload.reason];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) return candidate.trim();
  }
  return fallback;
}

export function normalizeUrlForDisplay(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\d+\.\d+\.\d+\.\d+(:\d+)?/.test(trimmed)) return `http://${trimmed}`;
  return `https://${trimmed}`;
}

export function normalizeDomainForStorage(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export type StreamEvent =
  | { type: "log"; line: string }
  | { type: "queued"; position: number; total: number }
  | { type: "done"; success: boolean; url: string | null; project?: unknown; framework?: string; error?: string };

export function streamDeployment(
  repo: string,
  onEvent: (event: StreamEvent) => void,
  onError: (err: Error) => void
): () => void {
  const url = `${DEPLOY_STREAM_URL}?repo=${encodeURIComponent(repo)}`;
  const es = new EventSource(url);

  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data as string) as StreamEvent;
      onEvent(data);
      if (data.type === "done") es.close();
    } catch {
      // ignore parse errors
    }
  };

  es.onerror = () => {
    es.close();
    onError(new Error("Connection to deployment server lost. Please try again."));
  };

  return () => es.close();
}

export async function requestDeployment(repo: string): Promise<DeployApiResult> {
  const response = await fetch(DEPLOY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo }),
  });

  const rawText = await response.text();
  let payload: DeployApiPayload = {};
  try {
    payload = rawText ? (JSON.parse(rawText) as DeployApiPayload) : {};
  } catch {
    payload = rawText ? { message: rawText } : {};
  }

  const liveUrl = extractLiveUrl(payload);
  const logs = extractLogs(payload);
  const ok = response.ok && payload.success !== false;
  const errorMessage = ok ? null : extractErrorMessage(payload, `Deploy request failed with status ${response.status}`);

  return { ok, liveUrl, logs, errorMessage, payload };
}
