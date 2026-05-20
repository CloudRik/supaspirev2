import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Rocket,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  GitBranch,
  Clock,
  Code2,
  Search,
  Globe,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { fetchProjectsFromServer, formatRelativeTime, type Project } from "@/lib/projects";

const FRAMEWORK_COLORS: Record<string, string> = {
  react: "bg-sky-100 text-sky-700",
  next: "bg-slate-900 text-white",
  nextjs: "bg-slate-900 text-white",
  vue: "bg-emerald-100 text-emerald-700",
  vite: "bg-purple-100 text-purple-700",
  node: "bg-green-100 text-green-700",
  express: "bg-green-100 text-green-700",
  python: "bg-blue-100 text-blue-700",
  django: "bg-green-100 text-green-700",
  flask: "bg-blue-100 text-blue-700",
  ruby: "bg-red-100 text-red-700",
  php: "bg-violet-100 text-violet-700",
  static: "bg-orange-100 text-orange-700",
  nuxt: "bg-emerald-100 text-emerald-700",
};

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
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
      <Loader2 className="w-3 h-3 animate-spin" /> Building
    </span>
  );
}

function FrameworkBadge({ fw }: { fw: string }) {
  const label = fw === "unknown" ? "Auto" : fw;
  const cls = FRAMEWORK_COLORS[fw?.toLowerCase()] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium ${cls}`}>
      <Code2 className="w-3 h-3" /> {label}
    </span>
  );
}

type Filter = "all" | "live" | "failed" | "building";

export default function DeploymentsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
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

  const filtered = projects.filter((p) => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.repo || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: projects.length,
    live: projects.filter((p) => p.status === "live").length,
    failed: projects.filter((p) => p.status === "failed").length,
    building: projects.filter((p) => p.status === "building").length,
  };

  return (
    <AppShell activeNav="Deployments">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Deployments</h1>
            <p className="text-sm text-slate-500 mt-0.5">All live deployments across your projects</p>
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

        {/* Filters + Search */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(["all", "live", "failed", "building"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all capitalize ${
                  filter === f
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f} {counts[f] > 0 && <span className="ml-1 opacity-60">{counts[f]}</span>}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading deployments…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Rocket className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No deployments found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or deploy a new project</p>
            <Link
              href="/import"
              className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              <Rocket className="w-3.5 h-3.5" /> New Deployment
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Project</span>
              <span>Framework</span>
              <span>Status</span>
              <span>Deployed</span>
              <span></span>
            </div>
            {filtered.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors items-center last:border-b-0"
              >
                {/* Project */}
                <div className="min-w-0">
                  <Link
                    href={`/project/${encodeURIComponent(p.name)}`}
                    className="font-semibold text-slate-900 text-sm hover:text-sky-600 transition-colors truncate block"
                  >
                    {p.name}
                  </Link>
                  {p.repo && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-0.5 truncate">
                      <GitBranch className="w-3 h-3 shrink-0" />
                      {p.repo.replace("https://github.com/", "")}
                    </span>
                  )}
                </div>
                {/* Framework */}
                <div>
                  <FrameworkBadge fw={p.framework || "unknown"} />
                </div>
                {/* Status */}
                <div>
                  <StatusBadge status={p.status} />
                </div>
                {/* Time */}
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3 shrink-0" />
                  {formatRelativeTime(p.deployedAt)}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {p.domain && (
                    <a
                      href={p.domain.startsWith("http") ? p.domain : `http://${p.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Visit site"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <Link
                    href={`/project/${encodeURIComponent(p.name)}`}
                    className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center transition-colors"
                  >
                    View
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer stats */}
        {!loading && projects.length > 0 && (
          <p className="text-xs text-slate-400 mt-4 text-center">
            {projects.length} project{projects.length !== 1 ? "s" : ""} total · {counts.live} live · {counts.failed} failed
          </p>
        )}
      </div>
    </AppShell>
  );
}
