import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Hash,
  ChevronDown,
  ChevronRight,
  Rocket,
  Shield,
} from "lucide-react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { fetchProjectsFromServer, type Project } from "@/lib/projects";
import { getEnvVars, saveEnvVars, deleteEnvVar, type EnvVars } from "@/lib/deploy";

type EnvRow = { key: string; value: string; hidden: boolean };

function ProjectEnvPanel({ project }: { project: Project }) {
  const [, navigate] = useLocation();
  const [rows, setRows] = useState<EnvRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  async function load() {
    setLoading(true);
    try {
      const vars = await getEnvVars(project.name);
      setRows(Object.entries(vars).map(([key, value]) => ({ key, value, hidden: true })));
      setLoaded(true);
    } catch {
      setRows([]);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) load();
  }

  async function doSave(): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const vars: EnvVars = {};
      rows.forEach((r) => { if (r.key.trim()) vars[r.key.trim()] = r.value; });
      await saveEnvVars(project.name, vars);
      return true;
    } catch {
      setError("Save failed.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const ok = await doSave();
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  }

  async function handleSaveAndRedeploy() {
    const ok = await doSave();
    if (!ok) return;
    if (!project.repo) { setError("No repo URL found."); return; }
    navigate(`/deploying?repo=${encodeURIComponent(project.repo)}&name=${encodeURIComponent(project.name)}`);
  }

  async function handleDelete(key: string) {
    try {
      await deleteEnvVar(project.name, key);
      setRows((prev) => prev.filter((r) => r.key !== key));
    } catch { setError("Delete failed."); }
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
    setNewKey(""); setNewValue(""); setAdding(false);
  }

  function updateRow(idx: number, field: "key" | "value", val: string) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  }
  function toggleHide(idx: number) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, hidden: !r.hidden } : r));
  }

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${project.status === "live" ? "bg-emerald-400" : project.status === "failed" ? "bg-red-400" : "bg-amber-400"}`} />
        <span className="font-semibold text-slate-900 text-sm">{project.name}</span>
        {loaded && (
          <span className="text-xs text-slate-400 font-normal">
            {rows.length} variable{rows.length !== 1 ? "s" : ""}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 space-y-3 border-t border-slate-100">
              {/* Warning */}
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Changes take effect on next deploy. <strong>Redeploy</strong> to apply.</span>
              </div>

              {/* Rows */}
              {loaded && rows.length > 0 && (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {rows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 group">
                      <input
                        value={row.key}
                        onChange={(e) => updateRow(i, "key", e.target.value)}
                        className="w-36 shrink-0 h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                        placeholder="KEY"
                      />
                      <span className="text-slate-300 text-xs">=</span>
                      <div className="flex-1 relative">
                        <input
                          value={row.hidden ? "•".repeat(Math.min(row.value.length, 24)) : row.value}
                          onChange={(e) => !row.hidden && updateRow(i, "value", e.target.value)}
                          readOnly={row.hidden}
                          className="w-full h-8 px-2 pr-8 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300"
                          placeholder="value"
                        />
                        <button onClick={() => toggleHide(i)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                          {row.hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(row.key)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {loaded && rows.length === 0 && !adding && (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <Hash className="w-5 h-5 text-slate-300" />
                  <p className="text-xs text-slate-500">No variables yet</p>
                </div>
              )}

              {/* Add row form */}
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
                    <button onClick={handleAdd} className="h-9 px-3 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors">Add</button>
                    <button onClick={() => { setAdding(false); setNewKey(""); setNewValue(""); }} className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="text-xs text-red-500">{error}</p>}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <button
                  onClick={() => setAdding(true)}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Variable
                </button>
                {loaded && rows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
                    >
                      {saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</> : saved ? <><Check className="w-3 h-3 text-emerald-500" /> Saved!</> : "Save"}
                    </button>
                    <button
                      onClick={handleSaveAndRedeploy}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors"
                    >
                      {saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</> : <><Rocket className="w-3 h-3" /> Save & Redeploy</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EnvVarsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const isViewer = user?.workspaceRole === "Viewer";

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
    <AppShell activeNav="Environment Variables">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Environment Variables</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage env vars across all your projects</p>
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

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading projects…</span>
          </div>
        ) : isViewer ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Access Restricted</h3>
            <p className="text-sm text-slate-500">Viewer roles cannot view or manage environment variables.</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <SlidersHorizontal className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No projects found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <ProjectEnvPanel key={p.name} project={p} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
