import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Rocket,
  FileText,
  Globe,
  Plus,
  Github,
  Upload,
  RefreshCw,
  Clock,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Layers,
  Activity,
  BarChart3,
  Trash2,
  ExternalLink,
  Code2,
} from "lucide-react";

import {
  getProjects,
  fetchProjectsFromServer,
  formatRelativeTime,
  deleteProjectFromServer,
  removeProjectLocally,
  type Project,
} from "@/lib/projects";
import { normalizeUrlForDisplay } from "@/lib/deploy";
import { AppShell } from "@/components/AppShell";

const FRAMEWORK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  vite:           { bg: "bg-purple-50",  text: "text-purple-600", border: "border-purple-200" },
  cra:            { bg: "bg-sky-50",     text: "text-sky-600",    border: "border-sky-200" },
  nextjs:         { bg: "bg-slate-900",  text: "text-white",      border: "border-slate-700" },
  "nextjs-ssr":   { bg: "bg-slate-900",  text: "text-white",      border: "border-slate-700" },
  "nextjs-static":{ bg: "bg-slate-900",  text: "text-white",      border: "border-slate-700" },
  "nodejs-server":{ bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200" },
  "python-flask": { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200" },
  "python-fastapi":{ bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200" },
  "python-django":{ bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200" },
  php:            { bg: "bg-indigo-50",  text: "text-indigo-700", border: "border-indigo-200" },
  go:             { bg: "bg-cyan-50",    text: "text-cyan-700",   border: "border-cyan-200" },
  ruby:           { bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200" },
  html:           { bg: "bg-orange-50",  text: "text-orange-700", border: "border-orange-200" },
  nuxt:           { bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200" },
  monorepo:       { bg: "bg-violet-50",  text: "text-violet-700", border: "border-violet-200" },
  dockerfile:     { bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200" },
};

function frameworkColors(fw?: string) {
  if (!fw || fw === "unknown" || fw === "detecting...") return null;
  return FRAMEWORK_COLORS[fw] ?? { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" };
}

function FrameworkBadge({ framework }: { framework?: string }) {
  const colors = frameworkColors(framework);
  if (!colors || !framework) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
      <Code2 className="w-2.5 h-2.5" />
      {framework}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === "live" || status === "running")
    return <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />;
  if (status === "failed")
    return <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />;
  return <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.7)]" />;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "live" || status === "running")
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
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
      <Loader2 className="w-3 h-3 animate-spin" /> Building
    </span>
  );
}

function ProjectCard({
  project,
  index,
  onDelete,
}: {
  project: Project & { lastDeployed: string };
  index: number;
  onDelete: (name: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [, navigate] = useLocation();

  const redeployPath = project.repo
    ? `/deploying?name=${encodeURIComponent(project.name)}&repo=${encodeURIComponent(project.repo)}`
    : "/import";

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${project.name}"? This will stop the container and remove all files.`)) return;
    setDeleting(true);
    await deleteProjectFromServer(project.name);
    removeProjectLocally(project.name);
    onDelete(project.name);
  }

  function handleRedeploy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigate(redeployPath);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 hover:shadow-md hover:shadow-slate-100 transition-all duration-250"
    >
      {/* Header */}
      <Link
        href={`/project/${encodeURIComponent(project.name)}`}
        className="flex items-center gap-2.5 px-4 py-3.5 border-b border-slate-100 hover:bg-slate-50 transition-colors"
      >
        <StatusDot status={project.status} />
        <span className="font-semibold text-slate-900 text-sm flex-1 truncate">{project.name}</span>
        <FrameworkBadge framework={project.framework} />
      </Link>

      {/* Body */}
      <div
        onClick={() => navigate(`/project/${encodeURIComponent(project.name)}`)}
        className="block px-4 py-3 space-y-1.5 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="hover:text-sky-500 transition-colors truncate font-mono text-[11px]">
            {project.domain}
          </span>
          <a
            href={normalizeUrlForDisplay(project.domain)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-slate-300 hover:text-sky-500 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400">Status:</span>
          <StatusBadge status={project.status} />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Last Deploy: <span className="text-slate-700 font-medium">{project.lastDeployed}</span></span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center divide-x divide-slate-100">
        <button
          onClick={handleRedeploy}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
            project.status === "failed"
              ? "text-red-500 hover:bg-red-50"
              : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
          }`}
        >
          {project.status === "failed" ? (
            <><RefreshCw className="w-3.5 h-3.5" /> Retry</>
          ) : (
            <><Rocket className="w-3.5 h-3.5" /> Redeploy</>
          )}
        </button>
        <Link
          href={`/project/${encodeURIComponent(project.name)}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" /> Logs
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="bg-white border border-slate-200 rounded-2xl mb-8"
    >
      <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
        <div className="relative w-16 h-16 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-violet-200">
            <Rocket className="w-8 h-8 text-white drop-shadow" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white shadow-sm" />
          <span className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-2 border-white shadow-sm" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1.5">Deploy your first project</h3>
        <p className="text-sm text-slate-400 max-w-xs mb-7">
          Import any GitHub repo — React, Next.js, Python, Node.js, Go, PHP, and more.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link href="/import" className="flex items-center gap-2 h-9 px-5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm">
            <Github className="w-4 h-4" /> Import from GitHub
          </Link>
          <Link href="/import" className="flex items-center gap-2 h-9 px-5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors">
            <Upload className="w-4 h-4" /> Upload ZIP
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(() => getProjects());
  const [serverLoading, setServerLoading] = useState(true);

  async function loadAllProjects() {
    const local = getProjects();
    setProjects(local);
    setServerLoading(true);
    const server = await fetchProjectsFromServer();
    setServerLoading(false);
    if (server.length > 0) {
      const serverNames = new Set(server.map((p) => p.name));
      const localOnly = local.filter((p) => !serverNames.has(p.name));
      setProjects([...server, ...localOnly]);
    } else {
      setProjects(local);
      setServerLoading(false);
    }
  }

  useEffect(() => {
    void loadAllProjects();
    const onFocus = () => void loadAllProjects();
    const onStorage = () => void loadAllProjects();
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function handleDelete(name: string) {
    setProjects((prev) => prev.filter((p) => p.name !== name));
  }

  const projectCards = projects.map((p) => ({
    ...p,
    lastDeployed: formatRelativeTime(p.deployedAt),
  }));
  const hasProjects = projectCards.length > 0;
  const liveCount = projects.filter((p) => p.status === "live" || p.status === "running").length;
  const failedCount = projects.filter((p) => p.status === "failed").length;

  return (
    <AppShell activeNav="Projects">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-xl font-bold text-slate-900">Projects</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {serverLoading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Syncing from server...
                </span>
              ) : (
                `${projects.length} project${projects.length !== 1 ? "s" : ""} · ${liveCount} live · ${failedCount} failed`
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadAllProjects()}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${serverLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/import"
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Project
            </Link>
          </div>
        </motion.div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6" />

        {hasProjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {projectCards.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-8" />

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Stats Overview</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Projects", value: String(projects.length), sub: `${liveCount} live`, icon: Layers, color: "text-sky-500", bg: "bg-sky-50", border: "border-sky-100" },
              { label: "Live", value: String(liveCount), sub: `${failedCount} failed`, icon: Rocket, color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100" },
              { label: "Server", value: serverLoading ? "..." : "Online", sub: "13.233.87.37:5000", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
            ].map(({ label, value, sub, icon: Icon, color, bg, border }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.08 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:shadow-slate-100 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                  <div className={`w-8 h-8 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1 font-mono tracking-tight">{value}</div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <ArrowUpRight className={`w-3 h-3 ${color}`} />
                  {sub}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-8" />

        {/* Usage */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Usage</h2>
              <span className="text-xs text-slate-400 font-normal">· Last 30 days</span>
            </div>
            <button className="h-7 px-3 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors">
              Upgrade Plan
            </button>
          </div>
          <div className="px-5 py-4 space-y-4">
            {[
              { label: "Deployments", used: projects.length, total: 100, display: `${projects.length} / 100`, color: "bg-sky-500", trackColor: "bg-sky-100" },
              { label: "Bandwidth", used: 120, total: 10240, display: "120 MB / 10 GB", color: "bg-violet-500", trackColor: "bg-violet-100" },
              { label: "Builds", used: projects.length + 2, total: 200, display: `${projects.length + 2} / 200`, color: "bg-emerald-500", trackColor: "bg-emerald-100" },
            ].map(({ label, used, total, display, color, trackColor }) => {
              const pct = Math.min((used / total) * 100, 100);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-600">{label}</span>
                    <span className="text-xs text-slate-400 font-mono">{display}</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full ${trackColor} overflow-hidden`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
