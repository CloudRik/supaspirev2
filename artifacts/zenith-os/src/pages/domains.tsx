import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Lock,
  AlertTriangle,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { fetchProjectsFromServer, type Project } from "@/lib/projects";
import { useLocation } from "wouter";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }
  return { copied, copy };
}

function DomainRow({ project, idx }: { project: Project; idx: number }) {
  const { copied, copy } = useCopy();
  const [, navigate] = useLocation();
  const [chooserOpen, setChooserOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const domainUrl = project.domain.startsWith("http") ? project.domain : `http://${project.domain}`;
  const displayDomain = project.domain.replace(/^https?:\/\//, "");
  const storageKey = `zenith.domains.project.${project.name}`;
  const globalKey = "zenith.domains.global";

  const readCustomDomains = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const addCustomDomain = () => {
    const host = newDomain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!host) return;
    const next = [
      { id: `${project.name}-${host}-${Date.now()}`, host, verified: false, addedAt: Date.now(), step: "dns-setup" },
      ...readCustomDomains(),
    ];
    localStorage.setItem(storageKey, JSON.stringify(next));
    setChooserOpen(false);
    setNewDomain("");
    navigate(`/project/${encodeURIComponent(project.name)}?tab=domains`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="p-5 border-b border-slate-100 hover:bg-slate-50/60 transition-colors last:border-b-0"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/project/${encodeURIComponent(project.name)}`}
              className="font-semibold text-slate-900 text-sm hover:text-sky-600 transition-colors"
            >
              {project.name}
            </Link>
            {project.status === "live" ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
                <CheckCircle2 className="w-2.5 h-2.5" /> Live
              </span>
            ) : project.status === "failed" ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-semibold">
                <XCircle className="w-2.5 h-2.5" /> Failed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Building
              </span>
            )}
          </div>

          {/* Current domain */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-100 border border-slate-200 flex-1 max-w-sm">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-sm font-mono text-slate-700 truncate">{displayDomain}</span>
            </div>
            <button
              onClick={() => copy(project.domain, project.name + "-copy")}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title="Copy URL"
            >
              {copied === project.name + "-copy" ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <a
              href={domainUrl}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Custom domain section */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-dashed border-slate-300 bg-white flex-1 max-w-sm opacity-60">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400 font-mono">custom-domain.com</span>
            </div>
            <button
              onClick={() => setChooserOpen(true)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Domain
            </button>
          </div>
          {chooserOpen && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <button type="button" className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-slate-900" />
                    <div className="font-semibold text-slate-900">Buy domain</div>
                  </div>
              <p className="mt-2 text-xs text-slate-500">One bought domain can later be shared across projects.</p>
                </button>
                <button type="button" onClick={() => setChooserOpen(false)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-900" />
                    <div className="font-semibold text-slate-900">Add custom domain</div>
                  </div>
              <p className="mt-2 text-xs text-slate-500">This saves only for this project.</p>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                />
                <button onClick={addCustomDomain} className="h-10 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium">
                  Continue
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Project key: <span className="font-mono">{storageKey}</span> · global bought domains: <span className="font-mono">{globalKey}</span>
              </p>
            </div>
          )}
        </div>

        <Link
          href={`/project/${encodeURIComponent(project.name)}?tab=settings`}
          className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center transition-colors shrink-0"
        >
          Settings
        </Link>
      </div>
    </motion.div>
  );
}

export default function DomainsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    try {
      const data = await fetchProjectsFromServer();
      setProjects(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <AppShell activeNav="Domains">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Domains</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage domains for all your projects</p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Custom domains notice */}
        <div className="flex items-start gap-2.5 p-4 mb-5 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
          <div>
            <p className="font-semibold">Custom domains coming soon</p>
            <p className="text-xs text-sky-600 mt-0.5">
              Currently projects run on EC2 IP with port. Custom domain support (with SSL) is in development.
            </p>
          </div>
        </div>

        {/* Projects list */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading domains…</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Globe className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No projects yet</p>
            <p className="text-xs text-slate-400 mt-1">Deploy a project to see its domain here</p>
            <Link
              href="/import"
              className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Deploy New Project
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {projects.map((p, i) => (
              <DomainRow key={p.name} project={p} idx={i} />
            ))}
          </div>
        )}

        {!loading && projects.length > 0 && (
          <p className="text-xs text-slate-400 mt-4 text-center">
            {projects.length} project{projects.length !== 1 ? "s" : ""} · all running on EC2 (13.233.87.37)
          </p>
        )}
      </div>
    </AppShell>
  );
}
