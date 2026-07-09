import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  ExternalLink,
  Settings as SettingsIcon,
  ArrowLeft,
  Activity,
  GitBranch,
  FileText,
  Rocket,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
  Plus,
  ShoppingCart,
  Trash2,
  Package as PackageIcon,
  Hash,
  Code2,
  Clock,
  RefreshCw,
  Search,
  AlertTriangle,
  Webhook,
  Eye,
  EyeOff,
  Zap,
  ChevronRight,
  Radio,
  WifiOff,
  Download,
  Moon,
  Github,
} from "lucide-react";
import { getProjects, fetchProjectsFromServer, formatRelativeTime, deleteProjectFromServer, getAuthToken, addCustomDomainToServer, removeCustomDomainFromServer, checkCustomDomainStatusFromServer, checkDnsStatusFromServer, type Project } from "@/lib/projects";
import { AppShell } from "@/components/AppShell";
import { normalizeUrlForDisplay, getWebhookInfo, getWebhookPingStatus, getEnvVars, saveEnvVars, deleteEnvVar, type WebhookInfo, type EnvVars } from "@/lib/deploy";

// ─────────────────────────────────────────────────────────────────────────────
// Tab configuration
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "deployments", label: "Deployments", icon: Rocket },
  { id: "logs", label: "Logs", icon: FileText },
  { id: "domains", label: "Domains", icon: Globe },
  { id: "settings", label: "Settings", icon: SettingsIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─────────────────────────────────────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  if (status === "live")
    return <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />;
  if (status === "failed")
    return <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />;
  if (status === "stopped")
    return <span className="w-2 h-2 rounded-full bg-slate-400 shadow-[0_0_6px_rgba(148,163,184,0.7)]" />;
  return (
    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.7)]" />
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "live")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
        <CheckCircle2 className="w-3 h-3" /> Live
      </span>
    );
  if (status === "failed")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
        <XCircle className="w-3 h-3" /> Failed
      </span>
    );
  if (status === "stopped")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-600 text-xs font-medium">
        <WifiOff className="w-3 h-3" /> Stopped
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
      <Loader2 className="w-3 h-3 animate-spin" /> Building
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const [, params] = useRoute("/project/:name");
  const projectName = params?.name ? decodeURIComponent(params.name) : "";
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"start" | "stop" | "restart" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [screenshotLoaded, setScreenshotLoaded] = useState(false);
  const [screenshotError, setScreenshotError] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("Owner");

  useEffect(() => {
    setScreenshotLoaded(false);
    setScreenshotError(false);
  }, [projectName]);

  useEffect(() => {
    async function loadRole() {
      try {
        const workspaceId = localStorage.getItem("cloudrik-workspace");
        const token = getAuthToken();
        let url = "/api-proxy/api/auth/me";
        if (workspaceId) url += `?workspaceId=${workspaceId}`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserRole(data.workspaceRole || "Owner");
        }
      } catch (err) {}
    }
    loadRole();
  }, []);

  const handleAction = async (action: "start" | "stop" | "restart") => {
    setActionLoading(action);
    try {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      let url = `/api-proxy/projects/${encodeURIComponent(projectName)}/${action}`;
      if (workspaceId) url += `?workspaceId=${workspaceId}`;

      const res = await fetch(url, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { status: string };
        const mappedStatus = data.status === "running" || data.status === "already_running" ? "live" 
          : data.status === "stopped" ? "stopped" 
          : "failed";

        // Update local state
        setProject(prev => prev ? { ...prev, status: mappedStatus } : null);

        // Also update local storage cache so it persists!
        const saved = getProjects();
        const index = saved.findIndex(p => p.name === projectName);
        if (index >= 0) {
          saved[index].status = mappedStatus;
          localStorage.setItem("zenith.projects", JSON.stringify(saved));
        }
      }
    } catch (err) {
      console.error(`Failed to ${action} container`, err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    // Try localStorage first for instant load
    const fromCache = getProjects().find((p) => p.name === projectName) ?? null;
    if (fromCache) {
      setProject(fromCache);
      setLoading(false);
    }

    // Always fetch from server in background to get the fresh database values
    fetchProjectsFromServer().then((data) => {
      const found = data.find((p) => p.name === projectName) ?? null;
      if (found) {
        setProject(found);
        // Persist fresh data to local storage cache
        const saved = getProjects();
        const filtered = saved.filter((p) => p.name !== projectName);
        localStorage.setItem("zenith.projects", JSON.stringify([found, ...filtered]));
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const refresh = () => {
      const found = getProjects().find((p) => p.name === projectName) ?? null;
      if (found) setProject(found);
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [projectName]);

  // Loading state
  if (loading) {
    return (
      <AppShell activeNav="Projects">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-400">Loading project details...</p>
        </div>
      </AppShell>
    );
  }

  // Project not found
  if (!project) {
    return (
      <AppShell activeNav="Projects">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Project not found</h1>
          <p className="text-sm text-slate-500 mb-6">
            We couldn't find a project named <span className="font-mono text-slate-700">{projectName}</span>.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Back to Projects
          </Link>
        </div>
      </AppShell>
    );
  }

  const primaryDisplayDomain = project.customDomain || project.domain;



  return (
    <AppShell activeNav="Projects">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-4">
          <Link href="/dashboard" className="hover:text-slate-700 transition-colors">
            Projects
          </Link>
          <span>›</span>
          <span className="text-slate-700">{project.name}</span>
        </div>

        {/* PROJECT HEADER (no card — sits directly on the page bg) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
            
            {/* Left: Website Preview Card */}
            <a 
              href={normalizeUrlForDisplay(primaryDisplayDomain)}
              target="_blank"
              rel="noreferrer"
              className="group relative w-full sm:w-[384px] h-[216px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden block shadow-sm"
            >
              {project.status === "live" || project.status === "running" ? (
                <>
                  <div className="absolute inset-0 z-10 overflow-hidden rounded-xl">
                    <iframe
                      src={`https://${normalizeUrlForDisplay(primaryDisplayDomain)}`}
                      title="Project Preview"
                      className="w-full h-full border-none pointer-events-none"
                      scrolling="no"
                    />
                  </div>
                  {/* Premium Skeleton/Loader state */}
                  {!screenshotLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-50 z-20">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                        <span className="text-xs font-semibold text-slate-500 tracking-wider">Generating Preview...</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{primaryDisplayDomain}</div>
                    </div>
                  )}
                  {/* Fallback card under the image */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 z-0">
                    <Globe className="w-8 h-8 text-slate-300 mb-2 opacity-50" />
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{project.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{primaryDisplayDomain}</div>
                  </div>
                </>
              ) : (
                /* Stopped App State Placeholder */
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-50">
                  <Globe className="w-8 h-8 text-slate-300 mb-2 opacity-50" />
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Application Offline</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{primaryDisplayDomain}</div>
                </div>
              )}

              {/* Hover shade */}
              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/[0.04] transition-colors flex items-center justify-center z-30">
                 <ExternalLink className="w-5 h-5 text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm" />
              </div>
            </a>

            {/* Right: Project Details & Actions */}
            <div className="flex-1 min-w-0 w-full flex flex-col md:flex-row md:items-start justify-between gap-6">
              
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold text-black tracking-tight mb-2.5">
                  {project.name}
                </h1>

                {/* Domain & Link */}
                <div className="flex items-center gap-2 mb-3.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100/70 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  </span>
                  <a
                    href={normalizeUrlForDisplay(primaryDisplayDomain)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors text-sm break-all flex items-center gap-1"
                  >
                    {primaryDisplayDomain}
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600/70 inline" />
                  </a>
                </div>

                {/* Meta details list in Netlify Sentence Style */}
                <div className="space-y-1.5 text-sm text-slate-900">
                  <p>
                    Deploys from <span className="font-semibold text-black">{project.repo ? "GitHub" : "File Upload"}</span>.
                  </p>

                  {project.repo && (
                    <p className="flex items-center gap-1">
                      Repository is{" "}
                      <a 
                        href={project.repo.startsWith("http") ? project.repo : `https://github.com/${project.repo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                      >
                        <Github className="w-4 h-4 text-slate-600 inline" />
                        {project.repo.replace(/^(https?:\/\/)?(www\.)?github\.com\//, "").replace(/\/$/, "")}
                      </a>.
                    </p>
                  )}

                  <p>
                    Status is <span className="font-semibold text-black">{project.status === "live" || project.status === "running" ? "active" : "offline"}</span>.
                  </p>

                  <p>
                    Last update <span className="font-semibold text-black">{formatRelativeTime(project.deployedAt || project.updatedAt)}</span>.
                  </p>
                </div>
              </div>

              {/* Right side action buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {currentUserRole !== "Viewer" && (project.status === "live" || project.status === "running" ? (
                  <button
                    disabled={actionLoading !== null}
                    onClick={() => handleAction("stop")}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-rose-50 border border-rose-200 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === "stop" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                    Stop App
                  </button>
                ) : project.status === "stopped" ? (
                  <button
                    disabled={actionLoading !== null}
                    onClick={() => handleAction("start")}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-[0_0_8px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === "start" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Rocket className="w-4 h-4" />
                    )}
                    Start App
                  </button>
                ) : null)}

                <a
                  href={normalizeUrlForDisplay(primaryDisplayDomain)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Visit Site
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* HORIZONTAL TABS */}
        <div className="border-b border-slate-200 mb-6">
          <div className="flex items-center gap-1 overflow-x-auto -mb-px">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${active ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {active && (
                    <motion.div
                      layoutId="project-tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && <OverviewTab project={project} setActiveTab={setActiveTab} />}
            {activeTab === "deployments" && <DeploymentsTab project={project} />}
            {activeTab === "logs" && <LogsTab project={project} />}
            {activeTab === "domains" && <DomainsTab project={project} refreshProject={() => {
              fetchProjectsFromServer().then((data) => {
                const found = data.find((p) => p.name === project.name);
                if (found) {
                  const saved = getProjects().filter(p => p.name !== project.name);
                  localStorage.setItem("zenith.projects", JSON.stringify([found, ...saved]));
                  // Dispatch storage event so setProject updates via existing listener if needed, 
                  // but we should just update it via a new state update or window event.
                  window.dispatchEvent(new Event("focus")); 
                }
              });
            }} />}
            {activeTab === "settings" && <SettingsTab project={project} currentUserRole={currentUserRole} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW TAB — Project Summary + Quick Actions + Build Info
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ project, setActiveTab }: { project: Project; setActiveTab: (t: TabId) => void }) {
  const [stats, setStats] = useState({
    cpu: "0%",
    memory: "0B / 0B",
    net: "0B / 0B",
    memPerc: "0%",
    online: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    const fetchStats = () => {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      let url = `/api-proxy/api/projects/${encodeURIComponent(project.name)}/stats`;
      if (workspaceId) url += `?workspaceId=${workspaceId}`;

      fetch(url, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      })
        .then(res => {
          if (!res.ok) throw new Error("Server error fetching stats");
          return res.json();
        })
        .then(data => {
          if (active && data && !data.error) {
            setStats({ ...data, loading: false });
          } else if (active) {
            setStats(s => ({ ...s, loading: false, online: false }));
          }
        })
        .catch(err => {
          console.error("Failed to fetch stats", err);
          if (active) {
            setStats(s => ({ ...s, loading: false, online: false }));
          }
        });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [project.name]);

  const cpuVal = (stats.cpu && typeof stats.cpu === "string") ? parseFloat(stats.cpu.replace('%', '')) || 0 : 0;
  const memVal = (stats.memPerc && typeof stats.memPerc === "string") ? parseFloat(stats.memPerc.replace('%', '')) || 0 : 0;

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <Card title="Project Summary" icon={Activity}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1.5">Status</div>
            <StatusBadge status={project.status} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1.5">Last Deploy</div>
            <div className="text-slate-900 font-medium">{formatRelativeTime(project.deployedAt)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1.5">Live URL</div>
            <a
              href={normalizeUrlForDisplay(project.domain)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-mono text-sm transition-colors"
            >
              {project.domain}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </Card>

      {/* Real-Time Resource Metrics */}
      <Card title="Real-Time Resource Metrics" icon={Activity}>
        {stats.loading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
            <span className="text-xs font-semibold">Connecting to container...</span>
          </div>
        ) : !stats.online ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-500">
            <WifiOff className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-800">Container Offline / Stopped</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Start or redeploy the project to activate metrics streaming.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CPU */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">CPU Usage</span>
                <span className="font-mono text-slate-800 font-bold">{stats.cpu}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(cpuVal, 100)}%` }}
                  className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                />
              </div>
            </div>

            {/* RAM */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Memory (RAM)</span>
                <span className="font-mono text-slate-800 font-bold">{stats.memory}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(memVal, 100)}%` }}
                  className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                />
              </div>
            </div>

            {/* Network Traffic */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Network I/O</span>
                <span className="font-mono text-slate-800 font-bold">{stats.net}</span>
              </div>
              <div className="flex items-center gap-1.5 h-6 text-sm text-slate-700 font-medium font-mono">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
                <span>Streaming live data</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions" icon={Rocket}>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/import"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Rocket className="w-4 h-4" /> Deploy Again
          </Link>
          <Link
            href={`/logs?project=${encodeURIComponent(project.name)}`}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <FileText className="w-4 h-4" /> View Logs
          </Link>
          <a
            href={normalizeUrlForDisplay(project.domain)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Visit Site
          </a>
        </div>
      </Card>

      {/* Build Info */}
      <Card title="Build Info" icon={PackageIcon}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
          <InfoRow label="Framework" value={project.framework && project.framework !== "unknown" ? project.framework : "Auto-detected"} icon={Code2} mono />
          <InfoRow label="Branch" value="main" icon={GitBranch} mono />
          <InfoRow label="Region" value="Mumbai (ap-south-1)" icon={Globe} />
          <InfoRow label="Repo" value={project.repo ? project.repo.split("/").slice(-2).join("/") : "—"} icon={Hash} mono />
        </div>
      </Card>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof Activity;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
        </div>
        {action}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
  mono,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-1.5">{label}</div>
      <div className={`inline-flex items-center gap-1.5 text-slate-900 font-medium ${mono ? "font-mono" : ""}`}>
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYMENTS TAB — list of past deployments
// ─────────────────────────────────────────────────────────────────────────────
type DeploymentRow = {
  id: string;
  commit: string;
  message: string;
  branch: string;
  status: "live" | "building" | "failed" | "stopped";
  duration: string;
  ts: number;
  author: string;
};

function buildMockDeployments(project: Project): DeploymentRow[] {
  const base = project.deployedAt;
  const rows: DeploymentRow[] = [
    {
      id: "dep_01",
      commit: "a3f2c81",
      message: "Initial deploy",
      branch: "main",
      status: project.status === "running" ? "building" : project.status,
      duration: "42s",
      ts: base,
      author: "Asis",
    },
  ];
  // Add a few historical mock entries so the page feels alive
  rows.push({
    id: "dep_02",
    commit: "9e1b04a",
    message: "Update README and CI config",
    branch: "main",
    status: "live",
    duration: "38s",
    ts: base - 1000 * 60 * 60 * 6,
    author: "Asis",
  });
  rows.push({
    id: "dep_03",
    commit: "7c44b12",
    message: "Fix navbar overflow on mobile",
    branch: "main",
    status: "failed",
    duration: "1m 04s",
    ts: base - 1000 * 60 * 60 * 24,
    author: "Asis",
  });
  rows.push({
    id: "dep_04",
    commit: "f0d2299",
    message: "Add hero section animations",
    branch: "feature/hero",
    status: "live",
    duration: "47s",
    ts: base - 1000 * 60 * 60 * 30,
    author: "Asis",
  });
  return rows;
}

function DeploymentsTab({ project }: { project: Project }) {
  const deployments = useMemo(() => buildMockDeployments(project), [project]);

  return (
    <Card
      title="Deployments"
      icon={Rocket}
      action={
        <Link
          href="/import"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Deployment
        </Link>
      }
    >
      <div className="-mx-5 -my-5 divide-y divide-slate-100">
        {deployments.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
          >
            <StatusDot status={d.status} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-slate-900 text-sm truncate">{d.message}</span>
                <StatusBadge status={d.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  <span className="font-mono">{d.branch}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono">{d.commit}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(d.ts)}
                </span>
                <span className="text-slate-400">·</span>
                <span>{d.duration}</span>
                <span className="text-slate-400">·</span>
                <span>by {d.author}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                href={`/logs?project=${encodeURIComponent(project.name)}`}
                className="h-8 px-3 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:border-slate-200 border border-transparent transition-colors inline-flex items-center gap-1"
                title="View logs"
              >
                <FileText className="w-3 h-3" /> Logs
              </Link>
              {d.status === "failed" ? (
                <button className="h-8 px-3 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors inline-flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              ) : (
                <button className="h-8 px-3 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:border-slate-200 border border-transparent transition-colors">
                  Rollback
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGS TAB — real EC2 container logs with SSE live streaming
// ─────────────────────────────────────────────────────────────────────────────
const LOGS_API = "/api-proxy/projects";

let _logLineId = 0;
type RealLogLine = { id: number; text: string; color: string };

function colorForLine(text: string): string {
  const l = text.toLowerCase();
  if (/error|exception|fatal|crash|panic/.test(l)) return "text-red-500 font-medium";
  if (/warn|warning|deprecated/.test(l)) return "text-amber-500";
  if (/info|started|ready|listening|connected|success|running/.test(l)) return "text-emerald-500";
  return "text-slate-700";
}

function makeRealLine(text: string): RealLogLine {
  return { id: ++_logLineId, text, color: colorForLine(text) };
}

function LogsTab({ project }: { project: Project }) {
  const [lines, setLines] = useState<RealLogLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState("");
  const [lineCount, setLineCount] = useState(200);

  const bottomRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const autoScroll = useRef(true);

  const scrollBottom = useCallback(() => {
    if (autoScroll.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initial snapshot fetch
  const fetchSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      let url = `${LOGS_API}/${encodeURIComponent(project.name)}/logs?lines=${lineCount}`;
      if (workspaceId) url += `&workspaceId=${workspaceId}`;

      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) return;
      const data = await res.json() as { logs: string[] };
      setLines((data.logs || []).map(makeRealLine));
      setTimeout(scrollBottom, 60);
    } finally {
      setLoading(false);
    }
  }, [project.name, lineCount, scrollBottom]);

  // Load on mount + when lineCount changes (not streaming)
  useEffect(() => {
    if (!streaming) void fetchSnapshot();
  }, [project.name, lineCount]); // eslint-disable-line

  // Start SSE live stream
  function startStream() {
    if (esRef.current) esRef.current.close();
    setLines([]);
    setConnected(false);
    setStreaming(true);

    const token = getAuthToken();
    const workspaceId = localStorage.getItem("cloudrik-workspace");
    let streamUrl = `${LOGS_API}/${encodeURIComponent(project.name)}/logs/stream?tail=80&token=${token || ""}`;
    if (workspaceId) streamUrl += `&workspaceId=${workspaceId}`;

    const es = new EventSource(streamUrl);
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as { type: string; line?: string };
        if (msg.type === "log" && msg.line) {
          setLines((prev) => {
            const next = [...prev, makeRealLine(msg.line!)];
            return next.length > 1000 ? next.slice(-1000) : next;
          });
          setTimeout(scrollBottom, 30);
        }
        if (msg.type === "done" || msg.type === "error") setConnected(false);
      } catch { /* ignore */ }
    };
    es.onerror = () => setConnected(false);
  }

  function stopStream() {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    setStreaming(false);
    setConnected(false);
  }

  // Clean up on unmount
  useEffect(() => () => { if (esRef.current) { esRef.current.close(); esRef.current = null; } }, []);

  function handleToggleLive() {
    if (streaming) { stopStream(); setTimeout(() => void fetchSnapshot(), 100); }
    else startStream();
  }

  function downloadLogs() {
    const blob = new Blob([lines.map((l) => l.text).join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${project.name}-logs.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = filter
    ? lines.filter((l) => l.text.toLowerCase().includes(filter.toLowerCase()))
    : lines;

  return (
    <Card
      title="Logs"
      icon={FileText}
      action={
        <div className="flex items-center gap-2">
          {/* Lines selector — snapshot only */}
          {!streaming && (
            <select
              value={lineCount}
              onChange={(e) => setLineCount(Number(e.target.value))}
              className="h-8 pl-2 pr-6 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            >
              <option value={50}>50 lines</option>
              <option value={100}>100 lines</option>
              <option value={200}>200 lines</option>
              <option value={500}>500 lines</option>
            </select>
          )}

          {/* Live toggle */}
          <button
            onClick={handleToggleLive}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition-all ${streaming
              ? "bg-rose-600 border-rose-600 text-white hover:bg-rose-700 shadow shadow-rose-500/30"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            {streaming
              ? <><Radio className="w-3 h-3 animate-pulse" /> Stop Live</>
              : <><Radio className="w-3 h-3" /> Go Live</>
            }
          </button>

          {/* Refresh — snapshot only */}
          {!streaming && (
            <button
              onClick={() => void fetchSnapshot()}
              disabled={loading}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}

          {/* Download */}
          {lines.length > 0 && (
            <button
              onClick={downloadLogs}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
              title="Download logs"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Clear */}
          {lines.length > 0 && (
            <button
              onClick={() => setLines([])}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
              title="Clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {/* Filter + status row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter logs…"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 transition-all"
            />
          </div>
          {streaming && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${connected ? "text-emerald-600" : "text-amber-500"}`}>
              {connected
                ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Streaming live</>
                : <><WifiOff className="w-3 h-3" />Connecting…</>
              }
            </span>
          )}
          {!streaming && lines.length > 0 && (
            <span className="text-xs text-slate-400">{filtered.length} lines</span>
          )}
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              defaultChecked
              onChange={(e) => { autoScroll.current = e.target.checked; }}
              className="accent-sky-500"
            />
            Auto-scroll
          </label>
        </div>

        {/* Terminal */}
        <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 bg-slate-50 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 text-[11px] font-mono text-slate-500">{project.name} — logs</span>
            {streaming && connected && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />LIVE
              </span>
            )}
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 ml-auto" />}
          </div>

          <div className="font-mono text-xs leading-relaxed p-4 h-[420px] overflow-y-auto">
            {/* Loading state */}
            {loading && filtered.length === 0 && (
              <div className="flex items-center gap-2 text-slate-400 justify-center h-full">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading logs…
              </div>
            )}
            {/* Empty + streaming — waiting */}
            {!loading && filtered.length === 0 && streaming && (
              <div className="flex items-center gap-2 text-slate-500 justify-center h-full">
                <Radio className="w-4 h-4 animate-pulse text-emerald-500" /> Waiting for new log lines…
              </div>
            )}
            {/* Empty + not streaming */}
            {!loading && filtered.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
                <AlertTriangle className="w-6 h-6 opacity-30" />
                <p>No logs — container may be idle or filter matches nothing</p>
                <button
                  onClick={handleToggleLive}
                  className="mt-1 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  <Radio className="w-3 h-3" /> Start Live Stream
                </button>
              </div>
            )}

            {filtered.map((line, i) => (
              <div key={line.id} className={`flex gap-2 ${line.color} hover:bg-slate-50 rounded px-1 -mx-1 py-0.5 group transition-colors`}>
                <span className="text-slate-300 shrink-0 select-none w-7 text-right group-hover:text-slate-400">{i + 1}</span>
                <span className="break-all whitespace-pre-wrap">{line.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAINS TAB — full custom domain setup flow
// ─────────────────────────────────────────────────────────────────────────────
type CustomDomain = {
  id: string;
  host: string;
  verified: boolean;
  addedAt: number;
  step: "dns-setup" | "verifying" | "active";
};
const CUSTOM_DOMAINS_KEY = (projectId: string) => `zenith.domains.project.${projectId}`;
const SERVER_IP = "3.109.177.105";
const CNAME_TARGET = "cname.cloudrik.com";

function isSubdomain(domain: string): boolean {
  const parts = domain.split(".");
  return parts.length > 2;
}

function getSubdomainName(domain: string): string {
  const parts = domain.split(".");
  if (parts.length <= 2) return "@";
  return parts.slice(0, parts.length - 2).join(".");
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function DnsSetupPanel({ domain, projectName, onVerified }: { domain: CustomDomain; projectName: string; onVerified: () => void }) {
  const [checking, setChecking] = useState(false);
  const [dnsState, setDnsState] = useState<{ root: boolean | null, www: boolean | null }>({ root: null, www: null });

  const checkDns = async () => {
    setChecking(true);
    const result = await checkDnsStatusFromServer(projectName);
    setDnsState({ root: result.rootVerified, www: result.wwwVerified });
    setChecking(false);
    
    if (result.rootVerified && result.wwwVerified) {
      onVerified();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mx-5 mb-4 rounded-xl border border-sky-200 bg-sky-50/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-sky-100 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center">
            <Hash className="w-3 h-3 text-sky-600" />
          </div>
          <span className="text-xs font-semibold text-sky-800">Mandatory DNS Setup</span>
          <span className="ml-auto text-[10px] text-sky-500">Add BOTH records to your DNS provider</span>
        </div>

        <div className="p-4 space-y-4">
          {/* A Record */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">1. A Record (Root Domain)</p>
              {dnsState.root === true && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><CheckCircle2 className="w-3 h-3"/> Verified</span>}
              {dnsState.root === false && <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><XCircle className="w-3 h-3"/> Missing</span>}
            </div>
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div className="grid grid-cols-3 px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Type</span><span>Name</span><span>Value</span>
              </div>
              <div className="grid grid-cols-3 px-3 py-2.5 font-mono text-xs text-slate-800">
                <span className="font-semibold text-sky-600">A</span>
                <span>@</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate font-semibold">{SERVER_IP}</span>
                  <CopyBtn value={SERVER_IP} />
                </div>
              </div>
            </div>
          </div>

          {/* CNAME Record */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">2. CNAME Record (www)</p>
              {dnsState.www === true && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><CheckCircle2 className="w-3 h-3"/> Verified</span>}
              {dnsState.www === false && <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><XCircle className="w-3 h-3"/> Missing</span>}
            </div>
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div className="grid grid-cols-3 px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Type</span><span>Name</span><span>Value</span>
              </div>
              <div className="grid grid-cols-3 px-3 py-2.5 font-mono text-xs text-slate-800">
                <span className="font-semibold text-amber-600">CNAME</span>
                <span>www</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate font-semibold">{CNAME_TARGET}</span>
                  <CopyBtn value={CNAME_TARGET} />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
            <span className="font-semibold text-slate-700">Quick Guide:</span> In your DNS provider (e.g. BigRock, GoDaddy), add an A record pointing <span className="font-mono bg-slate-100 px-1 rounded">@</span> to <span className="font-mono bg-slate-100 px-1 rounded">{SERVER_IP}</span> AND a CNAME record pointing <span className="font-mono bg-slate-100 px-1 rounded">www</span> to <span className="font-mono bg-slate-100 px-1 rounded">{CNAME_TARGET}</span>.
          </p>

          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> DNS changes can take a few minutes to propagate globally.
          </p>

          <button
            onClick={checkDns}
            disabled={checking}
            className="w-full h-9 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {checking
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying both records…</>
              : <><RefreshCw className="w-3.5 h-3.5" /> Verify Setup</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DomainsTab({ project, refreshProject }: { project: Project, refreshProject: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const SERVER_IP = "3.109.177.105";

  // Manage verified status
  const [domainStatus, setDomainStatus] = useState<"none"|"pending"|"active">("none");

  useEffect(() => {
    if (project.customDomain) {
      checkCustomDomainStatusFromServer(project.name).then(setDomainStatus);
    }
  }, [project.customDomain, project.name]);

  // Create a normalized list to support future multiple domains, 
  // but for now we map the single customDomain from the project object
  const customDomains: CustomDomain[] = project.customDomain ? [
    {
      id: "cd_1",
      host: project.customDomain,
      verified: domainStatus === "active",
      step: domainStatus === "active" ? "active" : "dns-setup",
      addedAt: Date.now()
    }
  ] : [];

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    setAdding(true);
    setError("");
    const res = await addCustomDomainToServer(project.name, newDomain.trim());
    if (res.success) {
      setNewDomain("");
      refreshProject();
    } else {
      setError(res.error || "Failed to add custom domain");
    }
    setAdding(false);
  };

  const removeDomain = async (id: string) => {
    setAdding(true);
    const success = await removeCustomDomainFromServer(project.name);
    if (success) {
      if (expandedId === id) setExpandedId(null);
      refreshProject();
    }
    setAdding(false);
  };

  const markVerified = async () => {
    // Actually check status from backend
    const status = await checkCustomDomainStatusFromServer(project.name);
    if (status === "active") {
      setDomainStatus("active");
      setExpandedId(null);
    } else {
      // Still pending
      alert("Verification failed. The SSL certificate is not ready yet. Ensure DNS A-record points to our server.");
    }
    refreshProject();
  };

  return (
    <div className="space-y-6">
      {/* Domain list */}
      <Card title="Domains" icon={Globe}>
        <div className="-mx-5 -my-5 divide-y divide-slate-100">
          {/* Default domain */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
            <a href={normalizeUrlForDisplay(project.domain)} target="_blank" rel="noreferrer"
              className="font-mono text-sm text-slate-900 hover:text-sky-600 transition-colors flex-1 truncate">
              {project.domain}
            </a>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium">Default</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          </div>

          {/* Custom domains */}
          {customDomains.map((d) => (
            <div key={d.id}>
              <div className="flex items-center gap-3 px-5 py-3.5">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <a 
                  href={`https://www.${d.host.replace(/^www\./, '')}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="font-mono text-sm text-slate-900 flex-1 truncate hover:text-sky-600 transition-colors flex items-center gap-1.5"
                >
                  www.{d.host.replace(/^www\./, '')}
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
                {d.verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium">
                      <Clock className="w-3 h-3" /> SSL Pending
                    </span>
                    <button
                      onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                      className="h-7 px-2.5 rounded-md text-[11px] font-medium text-sky-600 bg-sky-50 border border-sky-200 hover:bg-sky-100 transition-colors flex items-center gap-1"
                    >
                      <Hash className="w-3 h-3" />
                      {expandedId === d.id ? "Hide Setup" : "Setup DNS"}
                    </button>
                  </>
                )}
                <button
                  onClick={() => removeDomain(d.id)}
                  disabled={adding}
                  className="w-7 h-7 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <AnimatePresence>
                {expandedId === d.id && !d.verified && (
                  <DnsSetupPanel domain={d} projectName={project.name} onVerified={markVerified} />
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Add Domain Form */}
          {customDomains.length === 0 && (
            <div className="px-5 py-5 border-t border-slate-100 bg-slate-50/50">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Add Custom Domain</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="www.example.com"
                  className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
                  disabled={adding}
                />
                <button
                  onClick={handleAddDomain}
                  disabled={adding || !newDomain.trim()}
                  className="h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Domain
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            </div>
          )}
        </div>
      </Card>

      {/* Actions bar */}
      {showGuide && customDomains.length > 0 && (() => {
        return (
          <Card title="Setup guide" icon={Hash}>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-700 mb-2">Step 1: Add DNS records</div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between gap-3"><span>A record</span><span className="font-mono">{SERVER_IP}</span></div>
                  <div className="flex justify-between gap-3"><span>CNAME www</span><span className="font-mono">{CNAME_TARGET}</span></div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-700 mb-2">Step 2: Verify</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Both records must be verified. After DNS is updated, SSL verification will run automatically in the background. Note: this can take a few minutes.
                </p>
              </div>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS TAB
// ─────────────────────────────────────────────────────────────────────────────
function SettingsTab({ project, currentUserRole }: { project: Project, currentUserRole: string }) {
  return (
    <div className="space-y-6">
      <Card title="General" icon={SettingsIcon}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Project Name</label>
            <input
              type="text"
              defaultValue={project.name}
              className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Production Branch</label>
            <input
              type="text"
              defaultValue="main"
              className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 transition-all font-mono"
            />
          </div>
        </div>
      </Card>

      <EnvVarsCard project={project} currentUserRole={currentUserRole} />

      <WebhookBannerCard project={project} currentUserRole={currentUserRole} />

      {currentUserRole !== "Viewer" && (
        <Card title="Danger Zone" icon={AlertTriangle}>
          <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50/50">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-0.5">Delete this project</h3>
              <p className="text-xs text-slate-500">
                Open a confirmation page before permanently removing <span className="font-mono">{project.name}</span>.
              </p>
            </div>
            <Link
              href={`/project/${encodeURIComponent(project.name)}/delete`}
              className="h-9 px-4 rounded-lg bg-white border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors inline-flex items-center"
            >
              Delete Project
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function DeleteProjectPage({ project }: { project: Project }) {
  const [, navigate] = useLocation();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const ok = await deleteProjectFromServer(project.name);
    setDeleting(false);
    if (ok) navigate("/");
    else setError("Delete failed. Please try again.");
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-red-600 via-rose-600 to-orange-500 text-white shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Danger Zone
                </div>
                <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
                  Delete project <span className="font-mono">{project.name}</span>
                </h1>
                <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed">
                  This removes the project, deployments, environment variables, custom domains, and webhook settings.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
                  <div className="text-[11px] uppercase tracking-wider text-white/60">Deployments</div>
                  <div className="mt-1 text-2xl font-semibold">All</div>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
                  <div className="text-[11px] uppercase tracking-wider text-white/60">Recovery</div>
                  <div className="mt-1 text-2xl font-semibold">No</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6">
          <Card title="Confirm deletion" icon={Trash2}>
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-0.5">Type the project name to confirm</p>
                  <p className="text-xs text-red-600/80 leading-relaxed">
                    This is permanent. Use the exact project name below before you continue.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Project name</label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800">
                  {project.name}
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/project/${encodeURIComponent(project.name)}`}
                  className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors inline-flex items-center"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {deleting ? "Deleting…" : "Yes, Delete Project"}
                </button>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card title="What will be removed?" icon={AlertTriangle}>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Project record</span>
                  <span className="text-red-600 font-medium">Deleted</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deployments</span>
                  <span className="text-red-600 font-medium">Deleted</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Domains</span>
                  <span className="text-red-600 font-medium">Deleted</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Env vars</span>
                  <span className="text-red-600 font-medium">Deleted</span>
                </div>
              </div>
            </Card>

            <Card title="Before you delete" icon={CheckCircle2}>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="mt-1 w-2 h-2 rounded-full bg-amber-400" />
                  Export anything important first.
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 w-2 h-2 rounded-full bg-amber-400" />
                  Make sure no active users depend on this project.
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 w-2 h-2 rounded-full bg-amber-400" />
                  This action cannot be undone.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export function ProjectDeleteRoute() {
  const [, params] = useRoute("/project/:name/delete");
  const projectName = params?.name ? decodeURIComponent(params.name) : "";
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const fromCache = getProjects().find((p) => p.name === projectName) ?? null;
    setProject(fromCache);
    if (!fromCache) {
      fetchProjectsFromServer().then((data) => {
        setProject(data.find((p) => p.name === projectName) ?? null);
      });
    }
  }, [projectName]);

  if (!project) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="rounded-3xl bg-gradient-to-br from-red-600 via-rose-600 to-orange-500 text-white shadow-2xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Loading project
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">Preparing delete page</h1>
              <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed">
                We&apos;re loading the project details before showing the confirmation screen.
              </p>
            </div>
          </div>
          <Card title="Delete Project" icon={AlertTriangle}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="h-24 rounded-2xl bg-slate-50 animate-pulse" />
              <div className="h-24 rounded-2xl bg-slate-50 animate-pulse" />
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return <DeleteProjectPage project={project} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENV VARS CARD — full CRUD for project environment variables
// ─────────────────────────────────────────────────────────────────────────────
type EnvRow = { key: string; value: string; hidden: boolean };

function EnvVarsCard({ project, currentUserRole }: { project: Project, currentUserRole: string }) {
  const [, navigate] = useLocation();
  const [rows, setRows] = useState<EnvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    getEnvVars(project.name)
      .then((vars: EnvVars) => {
        setRows(Object.entries(vars).map(([key, value]) => ({ key, value, hidden: true })));
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [project.name]);

  async function doSave(): Promise<boolean> {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const vars: EnvVars = {};
      rows.forEach((r) => { if (r.key.trim()) vars[r.key.trim()] = r.value; });
      await saveEnvVars(project.name, vars);
      return true;
    } catch {
      setError("Failed to save. Check server connection.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const ok = await doSave();
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function handleSaveAndRedeploy() {
    const ok = await doSave();
    if (!ok) return;
    if (!project.repo) {
      setError("No repo URL found — cannot redeploy.");
      return;
    }
    navigate(`/deploying?repo=${encodeURIComponent(project.repo)}&name=${encodeURIComponent(project.name)}`);
  }

  async function handleDelete(key: string) {
    try {
      await deleteEnvVar(project.name, key);
      setRows((prev) => prev.filter((r) => r.key !== key));
    } catch {
      setError("Delete failed.");
    }
  }

  function handleAdd() {
    const k = newKey.trim();
    const v = newValue.trim();
    if (!k) return;
    if (rows.find((r) => r.key === k)) {
      setRows((prev) => prev.map((r) => r.key === k ? { ...r, value: v } : r));
    } else {
      setRows((prev) => [...prev, { key: k, value: v, hidden: true }]);
    }
    setNewKey("");
    setNewValue("");
    setAdding(false);
  }

  function updateRow(idx: number, field: "key" | "value", val: string) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  }

  function toggleHide(idx: number) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, hidden: !r.hidden } : r));
  }

  return (
    <Card
      title="Environment Variables"
      icon={Hash}
      action={
        currentUserRole !== "Viewer" && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        )
      }
    >
      <div className="space-y-3">
        {/* Info banner */}
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Changes take effect on next deploy. <strong>Redeploy</strong> after saving.</span>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading variables…
          </div>
        )}

        {/* Existing rows */}
        {!loading && rows.length > 0 && (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 group">
                <input
                  value={row.key}
                  onChange={(e) => updateRow(i, "key", e.target.value)}
                  disabled={currentUserRole === "Viewer"}
                  className="w-36 shrink-0 h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 disabled:opacity-60"
                  placeholder="KEY"
                />
                <span className="text-slate-300 text-xs">=</span>
                <div className="flex-1 relative">
                  <input
                    value={row.hidden ? "•".repeat(Math.min(row.value.length, 24)) : row.value}
                    onChange={(e) => !row.hidden && updateRow(i, "value", e.target.value)}
                    readOnly={row.hidden || currentUserRole === "Viewer"}
                    className="w-full h-8 px-2 pr-8 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 disabled:opacity-60"
                    placeholder="value"
                  />
                  <button
                    onClick={() => toggleHide(i)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {row.hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                </div>
                {currentUserRole !== "Viewer" && (
                  <button
                    onClick={() => handleDelete(row.key)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && rows.length === 0 && !adding && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Hash className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500">No environment variables yet.</p>
            {currentUserRole !== "Viewer" && (
              <button
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add First Variable
              </button>
            )}
          </div>
        )}

        {/* Add new row form */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <input
                autoFocus
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/\s/g, "_"))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="w-36 shrink-0 h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                placeholder="KEY_NAME"
              />
              <span className="text-slate-400 text-xs">=</span>
              <input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="flex-1 h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                placeholder="value"
              />
              <button
                onClick={handleAdd}
                className="h-9 px-3 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => { setAdding(false); setNewKey(""); setNewValue(""); }}
                className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Save / Redeploy buttons */}
        {(rows.length > 0 || adding) && !loading && currentUserRole !== "Viewer" && (
          <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
            <p className="text-xs text-slate-400">{rows.length} variable{rows.length !== 1 ? "s" : ""} total</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 transition-colors"
              >
                {saving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                ) : saved ? (
                  <><Check className="w-3.5 h-3.5 text-emerald-500" /> Saved!</>
                ) : (
                  "Save"
                )}
              </button>
              <button
                onClick={handleSaveAndRedeploy}
                disabled={saving}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors"
              >
                {saving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                ) : (
                  <><Rocket className="w-3.5 h-3.5" /> Save & Redeploy</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK BANNER CARD — shows real connection status & links to /webhooks page
// ─────────────────────────────────────────────────────────────────────────────
function WebhookBannerCard({ project, currentUserRole }: { project: Project; currentUserRole: string }) {
  const [status, setStatus] = useState<"loading" | "unconfigured" | "pending" | "verified">("loading");

  useEffect(() => {
    let active = true;
    async function checkStatus() {
      try {
        setStatus("loading");
        const token = getAuthToken();
        const workspaceId = localStorage.getItem("cloudrik-workspace");
        let url = "/api-proxy/api/webhooks";
        if (workspaceId) url += `?workspaceId=${workspaceId}`;
        
        const wRes = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        if (!wRes.ok) {
          if (active) setStatus("unconfigured");
          return;
        }
        
        const activeIds: string[] = await wRes.json();
        const hasWebhook = activeIds.includes(project.name);
        
        if (!hasWebhook) {
          if (active) setStatus("unconfigured");
          return;
        }
        
        const pingStatus = await getWebhookPingStatus(project.name);
        if (active) {
          if (pingStatus.verified) {
            setStatus("verified");
          } else {
            setStatus("pending");
          }
        }
      } catch (err) {
        if (active) setStatus("unconfigured");
      }
    }
    checkStatus();
    return () => {
      active = false;
    };
  }, [project.name]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
        <Webhook className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-sm font-semibold text-slate-900">GitHub Webhook</span>
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">Auto-deploy on push</span>
          
          {status === "loading" && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Checking…
            </span>
          )}
          {status === "verified" && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
            </span>
          )}
          {status === "pending" && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending Setup
            </span>
          )}
          {status === "unconfigured" && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-550 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Not Connected
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {status === "verified" && "Auto-deploy is active — every git push triggers a new build."}
          {status === "pending" && "Webhook created but awaiting GitHub handshake. Paste Payload URL into repo settings."}
          {status === "unconfigured" && "Connect GitHub to auto-deploy this project on every git push."}
          {status === "loading" && "Checking webhook configuration status..."}
        </p>
      </div>
      {currentUserRole !== "Viewer" && status !== "loading" && (
        <Link
          href={`/webhooks?connect=${encodeURIComponent(project.name)}`}
          className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          {status === "unconfigured" ? "Connect" : "Manage"}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// Keep old WebhookCard definition (unused but avoids import errors)
function WebhookCard({ project }: { project: Project }) {
  const [info, setInfo] = useState<WebhookInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  void info; void loading; void error; void showSecret; void copiedUrl; void copiedSecret;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getWebhookInfo(project.name);
      setInfo(data);
    } catch {
      setError("Could not load webhook info. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };
  void load;

  const copy = async (text: string, which: "url" | "secret") => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "url") { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 1500); }
      else { setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 1500); }
    } catch { /* ignore */ }
  };
  void copy;

  return (
    <Card
      title="GitHub Webhook"
      icon={Webhook}
      action={
        !info && !loading ? (
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            <Zap className="w-3 h-3" /> Setup
          </button>
        ) : undefined
      }
    >
      {!info && !loading && !error && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Webhook className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 mb-1">Auto-deploy on push</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Connect your GitHub repo so every <code className="font-mono bg-slate-100 px-1 rounded">git push</code> to main triggers a deploy automatically.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Zap className="w-4 h-4" /> Generate Webhook
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-3 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Generating webhook…
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 py-2">{error}</p>
      )}

      {info && (
        <div className="space-y-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Webhook ready — add it to your GitHub repo to enable auto-deploys
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payload URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 h-10 px-3 flex items-center rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono truncate">
                {info.webhookUrl}
              </code>
              <button
                onClick={() => copy(info.webhookUrl, "url")}
                className="shrink-0 w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors"
                title="Copy URL"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Secret */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Secret Token</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 h-10 px-3 flex items-center rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono truncate">
                {showSecret ? info.secret : "•".repeat(40)}
              </code>
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="shrink-0 w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors"
                title={showSecret ? "Hide" : "Show"}
              >
                {showSecret ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
              </button>
              <button
                onClick={() => copy(info.secret, "secret")}
                className="shrink-0 w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors"
                title="Copy secret"
              >
                {copiedSecret ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Setup instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-700 mb-2">Setup in GitHub</p>
            {[
              "Open your repo → Settings → Webhooks → Add webhook",
              "Paste the Payload URL above",
              'Set Content type to "application/json"',
              "Paste the Secret Token above",
              'Select "Just the push event" and click Add webhook',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="shrink-0 w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}


// Back-link for not-found view (re-used)
export function BackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" /> Back
    </Link>
  );
}
