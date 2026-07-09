import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useProjectStore } from "@/hooks/useProject";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag, Plus, Trash2, Loader2, Target, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FeatureFlag = {
  key: string;
  status: "enabled" | "rollout" | "disabled";
  rollout: number;
};

export default function FeatureFlags() {
  const { activeProject } = useProjectStore();
  const { toast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState("");

  const fetchFlags = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api-proxy/projects/${activeProject}/feature-flags`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFlags(data);
    } catch (e) {
      toast({ title: "Error", description: "Failed to load feature flags.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [activeProject]);

  const handleCreate = async () => {
    if (!newKey.trim() || !activeProject) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api-proxy/projects/${activeProject}/feature-flags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ key: newKey.trim(), status: "disabled", rollout: 0 })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed");
      }
      toast({ title: "Success", description: "Feature flag created." });
      setCreateOpen(false);
      setNewKey("");
      fetchFlags();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleUpdate = async (key: string, status: string, rollout: number) => {
    if (!activeProject) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api-proxy/projects/${activeProject}/feature-flags/${key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status, rollout })
      });
      if (!res.ok) throw new Error("Failed to update");
      setFlags(prev => prev.map(f => f.key === key ? { ...f, status: status as any, rollout } : f));
      toast({ title: "Updated", description: `Feature flag '${key}' updated.` });
    } catch (e) {
      toast({ title: "Error", description: "Update failed.", variant: "destructive" });
    }
  };

  const handleDelete = async (key: string) => {
    if (!activeProject) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api-proxy/projects/${activeProject}/feature-flags/${key}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to delete");
      setFlags(prev => prev.filter(f => f.key !== key));
      toast({ title: "Deleted", description: "Feature flag removed." });
    } catch (e) {
      toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Flag className="w-6 h-6 text-indigo-600" />
              Feature Flags
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Safely rollout new features to your users without deploying code.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-slate-900 hover:bg-black text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Flag
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {flags.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-5 border border-slate-100 shadow-sm">
                <Flag className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">No feature flags yet</h3>
              <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
                Feature flags let you safely roll out new features to your users without deploying code. Create your first flag to start experimenting.
              </p>
              <Button onClick={() => setCreateOpen(true)} className="bg-slate-900 hover:bg-black text-white h-9 px-4 text-xs font-medium shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Create your first flag
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {flags.map((flag) => (
                <div key={flag.key} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold text-slate-900">{flag.key}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <select
                        value={flag.status}
                        onChange={(e) => handleUpdate(flag.key, e.target.value, flag.rollout)}
                        className="text-xs font-medium bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none text-slate-700"
                      >
                        <option value="disabled">Disabled</option>
                        <option value="enabled">Live for everyone</option>
                        <option value="rollout">Percentage Rollout</option>
                      </select>
                      
                      {flag.status === "rollout" && (
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={flag.rollout}
                            onChange={(e) => handleUpdate(flag.key, flag.status, parseInt(e.target.value))}
                            className="w-24 accent-indigo-600"
                          />
                          <span className="text-xs font-mono text-slate-500">{flag.rollout}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <div className="px-3 py-1.5 bg-slate-50 rounded border border-slate-100 font-mono text-[10px] text-slate-500 flex items-center gap-1.5 hidden md:flex">
                      if (zenith.isFeatureEnabled('{flag.key}'))
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(flag.key)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Create Feature Flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Flag Key</label>
              <Input
                placeholder="e.g. new_dashboard_ui"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="font-mono text-sm text-slate-900 bg-white"
              />
              <p className="text-xs text-slate-500">
                Use lowercase, snake_case or kebab-case. This is how you'll reference the flag in code.
              </p>
            </div>
            <Button onClick={handleCreate} disabled={!newKey.trim()} className="w-full bg-slate-900 hover:bg-black text-white">
              Create Flag
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
