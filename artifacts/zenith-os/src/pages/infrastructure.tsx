import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  MemoryStick,
  RefreshCw,
  Activity,
  HardDrive,
  Wifi,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { fetchProjectsFromServer, getAuthToken, type Project } from "@/lib/projects";

const STATS_URL = "/api-proxy/stats";

type ContainerStat = {
  Name: string;
  CPUPerc: string;
  MemUsage: string;
  MemPerc: string;
  NetIO: string;
  BlockIO: string;
  PIDs: string;
};

function parsePercent(s: string): number {
  return parseFloat(s.replace("%", "")) || 0;
}

function cpuColor(pct: number) {
  if (pct >= 80) return { bar: "bg-red-500", text: "text-red-600", bg: "bg-red-50" };
  if (pct >= 50) return { bar: "bg-amber-400", text: "text-amber-600", bg: "bg-amber-50" };
  return { bar: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" };
}

function memColor(pct: number) {
  if (pct >= 80) return { bar: "bg-red-500", text: "text-red-600", bg: "bg-red-50" };
  if (pct >= 60) return { bar: "bg-amber-400", text: "text-amber-600", bg: "bg-amber-50" };
  return { bar: "bg-sky-500", text: "text-sky-600", bg: "bg-sky-50" };
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

function StatCard({ stat, project }: { stat: ContainerStat; project?: Project }) {
  const cpuPct  = parsePercent(stat.CPUPerc);
  const memPct  = parsePercent(stat.MemPerc);
  const cpu     = cpuColor(cpuPct);
  const mem     = memColor(memPct);
  const [used, limit] = stat.MemUsage.split(" / ");
  const isLimited = limit && limit !== "0B" && !limit.includes("908") && !limit.includes("7.7");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">
            {project?.name ?? stat.Name}
          </p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{stat.Name}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isLimited ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-2.5 h-2.5" /> Limited
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
              No limit
            </span>
          )}
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            project?.status === "live" ? "text-emerald-700 bg-emerald-50" : "text-slate-500 bg-slate-100"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${project?.status === "live" ? "bg-emerald-500" : "bg-slate-400"}`} />
            {project?.status ?? "running"}
          </span>
        </div>
      </div>

      {/* CPU */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Cpu className="w-3 h-3 text-slate-400" /> CPU
          </span>
          <span className={`text-xs font-bold ${cpu.text}`}>{stat.CPUPerc}</span>
        </div>
        <MiniBar pct={cpuPct} color={cpu.bar} />
      </div>

      {/* Memory */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-600">
            <MemoryStick className="w-3 h-3 text-slate-400" /> Memory
          </span>
          <span className={`text-xs font-bold ${mem.text}`}>{used} / {limit}</span>
        </div>
        <MiniBar pct={memPct} color={mem.bar} />
        <p className="text-[10px] text-slate-400 mt-0.5 text-right">{stat.MemPerc}</p>
      </div>

      {/* IO row */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5 mb-0.5">
            <Wifi className="w-3 h-3 text-slate-400" />
          </div>
          <p className="text-[10px] font-semibold text-slate-500">Net I/O</p>
          <p className="text-[10px] text-slate-700 font-mono truncate">{stat.NetIO}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5 mb-0.5">
            <HardDrive className="w-3 h-3 text-slate-400" />
          </div>
          <p className="text-[10px] font-semibold text-slate-500">Block I/O</p>
          <p className="text-[10px] text-slate-700 font-mono truncate">{stat.BlockIO}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5 mb-0.5">
            <Activity className="w-3 h-3 text-slate-400" />
          </div>
          <p className="text-[10px] font-semibold text-slate-500">PIDs</p>
          <p className="text-[10px] text-slate-700 font-mono">{stat.PIDs}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function InfrastructurePage() {
  const [stats, setStats]       = useState<ContainerStat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      let url = STATS_URL;
      if (workspaceId) url += `?workspaceId=${workspaceId}`;

      const res = await fetch(url, { 
        signal: AbortSignal.timeout(15000),
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) return;
      const data = await res.json() as ContainerStat[];
      setStats(data);
      setLastUpdated(new Date());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchProjectsFromServer().then(setProjects);
    void fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => void fetchStats(), 5000);
    return () => clearInterval(t);
  }, [autoRefresh, fetchStats]);

  // Totals
  const totalCpu = stats.reduce((s, c) => s + parsePercent(c.CPUPerc), 0);
  const totalMem = stats.reduce((s, c) => {
    const [used] = c.MemUsage.split(" / ");
    const val = parseFloat(used);
    const unit = used.replace(/[\d.]/g, "").trim();
    return s + (unit === "GiB" ? val * 1024 : val);
  }, 0);
  const limitedCount = stats.filter((s) => {
    const [, limit] = s.MemUsage.split(" / ");
    return limit && !limit.includes("908") && !limit.includes("7.7") && limit !== "0B";
  }).length;

  function getProject(containerName: string) {
    return projects.find((p) =>
      (p as unknown as { container?: string }).container === containerName ||
      p.name === containerName
    );
  }

  return (
    <AppShell activeNav="Infrastructure">
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-slate-500" />
              Infrastructure
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Live resource usage across all running containers
              {lastUpdated && (
                <span className="ml-2 text-slate-400 text-xs">
                  · Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <div
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${autoRefresh ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${autoRefresh ? "left-4" : "left-0.5"}`} />
              </div>
              Auto-refresh (5s)
            </label>
            <button
              onClick={() => { setLoading(true); void fetchStats(); }}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary strip */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Running Containers", value: stats.length.toString(), icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Total CPU Usage", value: `${totalCpu.toFixed(1)}%`, icon: Cpu, color: "text-sky-600", bg: "bg-sky-50" },
              { label: "Total Memory Used", value: `${totalMem.toFixed(0)} MiB`, icon: MemoryStick, color: "text-violet-600", bg: "bg-violet-50" },
              { label: "Resource Limited", value: `${limitedCount} / ${stats.length}`, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && stats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Fetching container stats…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && stats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <AlertTriangle className="w-8 h-8 opacity-40" />
            <p className="text-sm">No running containers found</p>
          </div>
        )}

        {/* Container grid */}
        <AnimatePresence>
          {stats.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((stat) => (
                <StatCard
                  key={stat.Name}
                  stat={stat}
                  project={getProject(stat.Name)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Containers with 200MiB limit = resource-limited (new deployments). Others = deployed before limits were added.
        </p>
      </div>
    </AppShell>
  );
}
