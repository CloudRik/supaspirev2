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
  Code2,
  Moon,
  Folder,
  Sparkles,
  Paperclip,
  Mic,
  Send,
} from "lucide-react";

import {
  getProjects,
  fetchProjectsFromServer,
  formatRelativeTime,
  deleteProjectFromServer,
  removeProjectLocally,
  getAuthToken,
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
  if (status === "stopped")
    return <span className="w-2 h-2 rounded-full bg-slate-400 shadow-[0_0_6px_rgba(148,163,184,0.5)]" />;
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
  if (status === "stopped")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-600 text-xs font-medium">
        Stopped
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300"
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
  function handleConnectGitHub() {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const token = getAuthToken();
    window.open(
      "/api-proxy/api/auth/github" + (token ? "?token=" + encodeURIComponent(token) : ""),
      "GitHub Authorization",
      "width=" + width + ",height=" + height + ",top=" + top + ",left=" + left
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* File Upload Card (Left Side) */}
      <Link 
        href="/import" 
        className="group relative flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xl shadow-slate-200/60 min-h-[300px] hover:border-cyan-300 hover:shadow-cyan-100/50 transition-all cursor-pointer overflow-hidden"
      >
        {/* Top Icon with Animated Background Rings */}
        <div className="relative flex items-center justify-center w-20 h-20 mb-5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] pointer-events-none">
             <div className="absolute inset-0 bg-cyan-50/70 rounded-full scale-[0.6] group-hover:scale-[0.85] transition-transform duration-1000 ease-out" />
             <div className="absolute inset-0 bg-cyan-100/60 rounded-full scale-[0.4] group-hover:scale-[0.65] transition-transform duration-700 ease-out" />
          </div>

          <svg width="84" height="84" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 group-hover:-translate-y-1.5 transition-transform duration-500">
            {/* Back flap (Dark Blue) */}
            <path d="M16 32C16 25.3726 21.3726 20 28 20H52C55.3137 20 58.4925 21.317 60.836 23.6604L65.164 27.988C67.5075 30.3315 70.6863 31.6484 74 31.6484H100C106.627 31.6484 112 37.0211 112 43.6484V96H16V32Z" fill="#2563EB" />
            
            {/* Paper (Pale Yellow) */}
            <rect x="24" y="36" width="80" height="64" rx="4" fill="#FDE047" />
            <rect x="28" y="36" width="76" height="64" rx="4" fill="#FEF08A" />
            
            {/* Front flap (Light Blue/Purple) */}
            <path d="M12 48C12 41.3726 17.3726 36 24 36H104C110.627 36 116 41.3726 116 48V104C116 110.627 110.627 116 104 116H24C17.3726 116 12 110.627 12 104V48Z" fill="#93C5FD" />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2 relative z-10">Upload your project file</h3>

        <p className="text-sm text-slate-500 mx-auto max-w-[300px] mb-6 leading-relaxed relative z-10">
          Drag and drop your project ZIP file here, or browse your computer to manually upload your code.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3 mt-auto relative z-10">
          <span className="px-5 py-2.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 group-hover:bg-blue-100 transition-colors shadow-sm">
            Choose a file
          </span>
          <span className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 border-2 border-slate-200 group-hover:border-blue-200 transition-colors bg-white shadow-sm">
            Browse files
          </span>
        </div>
      </Link>

      {/* GitHub Connect Card (Right Side) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/80 shadow-xl shadow-slate-200/60 min-h-[300px]"
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10 mb-6">
          <Github className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">Connect GitHub Account</h3>
        <p className="text-sm text-slate-500 max-w-[320px] mb-8 leading-relaxed">
          Link your GitHub account to directly deploy and manage all your public and private repositories in a single click, Vercel-style.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={handleConnectGitHub}
            className="flex items-center gap-3 px-8 h-14 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 transition-all shadow-md shadow-slate-900/10 hover:shadow-lg"
          >
            <Github className="w-5 h-5" />
            Connect with GitHub
          </button>
        </div>
      </motion.div>
      </div>

      {/* AI Chat Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-4"
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">Ask Anything with Cloudrik</h2>
            <p className="text-sm text-slate-600">Confused about deployment? Ask questions, plan your architecture, or fix errors instantly.</p>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Textarea */}
          <textarea
            placeholder="Confused? Ask about deployment, domains, errors, or anything on the platform..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none px-5 pt-3.5 pb-2 min-h-[40px]"
            rows={1}
          />

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between px-4 py-2">
            {/* Left: Model label */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0" />
              Cloudrik AI
            </div>

            {/* Right: Icons + Send */}
            <div className="flex items-center gap-1">
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                <Mic className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-1.5 ml-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors shadow-sm">
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(() => getProjects());
  const [serverLoading, setServerLoading] = useState(true);

  async function loadAllProjects() {
    const local = getProjects();
    
    // Deduplicate initial local list by name
    const seenLocal = new Set<string>();
    const uniqueLocal = local.filter((p) => {
      if (seenLocal.has(p.name)) return false;
      seenLocal.add(p.name);
      return true;
    });
    setProjects(uniqueLocal);
    
    setServerLoading(true);
    const server = await fetchProjectsFromServer();
    setServerLoading(false);
    
    if (server.length > 0) {
      const seenNames = new Set<string>();
      const combined: Project[] = [];
      
      // 1. Add server projects first
      for (const p of server) {
        if (!seenNames.has(p.name)) {
          seenNames.add(p.name);
          combined.push(p);
        }
      }
      
      // 2. Add local-only projects
      for (const p of uniqueLocal) {
        if (!seenNames.has(p.name)) {
          seenNames.add(p.name);
          combined.push(p);
        }
      }
      
      // Clean up localStorage duplicate entries
      localStorage.setItem("zenith.projects", JSON.stringify(uniqueLocal));
      
      setProjects(combined.sort((a, b) => b.deployedAt - a.deployedAt));
    } else {
      setProjects([]);
      localStorage.removeItem("zenith.projects");
    }
  }

  useEffect(() => {
    void loadAllProjects();
    const onStorage = () => void loadAllProjects();
    window.addEventListener("storage", onStorage);
    return () => {
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
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-xl font-bold text-slate-900">Projects</h1>
            {projects.length > 0 && (
              <p className="text-sm text-slate-400 mt-0.5">
                {serverLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" /> Syncing from server...
                  </span>
                ) : (
                  `${projects.length} project${projects.length !== 1 ? "s" : ""} · ${liveCount} live · ${failedCount} failed`
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {projects.length > 0 && (
              <button
                onClick={() => void loadAllProjects()}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${serverLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            )}
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
        ) : serverLoading ? (
          <div className="flex flex-col items-center justify-center py-20 mb-8 bg-white border border-slate-200 rounded-2xl text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-slate-300" />
            <span className="text-sm font-medium">Loading workspace...</span>
          </div>
        ) : (
          <EmptyState />
        )}



        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-8" />

        {/* Usage */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50 mb-6 hover:shadow-md hover:shadow-slate-200/50 transition-all duration-300"
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
              { label: "Bandwidth", used: 0, total: 10240, display: "0 MB / 10 GB", color: "bg-violet-500", trackColor: "bg-violet-100" },
              { label: "Builds", used: projects.length, total: 200, display: `${projects.length} / 200`, color: "bg-emerald-500", trackColor: "bg-emerald-100" },
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
