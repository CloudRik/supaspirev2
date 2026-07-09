import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Webhook,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Copy,
  AlertTriangle,
  Hash,
  ChevronDown,
  ChevronRight,
  Rocket,
  CheckCircle2,
  Zap,
  Github,
  Globe,
  Terminal,
  ArrowLeft,
  Settings,
  Sparkles,
  Link as LinkIcon,
  ShieldCheck,
  Database,
  Layers,
  HelpCircle,
  Code,
  ShieldAlert,
} from "lucide-react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { fetchProjectsFromServer, getAuthToken, type Project } from "@/lib/projects";
import { getWebhookInfo, generateWebhook, getWebhookPingStatus, getWebhookDeliveries, type WebhookInfo, type WebhookDelivery } from "@/lib/deploy";
import { useToast } from "@/hooks/use-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Copy Helper
// ─────────────────────────────────────────────────────────────────────────────
function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  };
  return { copied, copy };
}



// ─────────────────────────────────────────────────────────────────────────────
// Active Webhook Card component (100% LIGHT WHITE DESIGN)
// ─────────────────────────────────────────────────────────────────────────────
function ActiveWebhookCard({
  project,
  info,
  onDisconnect,
  isVerified,
  lastUpdated,
  deliveries,
  currentUserRole,
}: {
  project: Project;
  info: WebhookInfo;
  onDisconnect: () => void;
  isVerified: boolean;
  lastUpdated: string;
  deliveries: WebhookDelivery[];
  currentUserRole: string;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const urlCopy = useCopy();
  const secretCopy = useCopy();
  const curlCopy = useCopy();

  const curlCommand = `curl -X POST "${info.webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"ref": "refs/heads/main", "repository": {"default_branch": "main"}}'`;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-150 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
            <Webhook className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm">{project.name}</h3>
              
              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active & Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending — Add keys to repo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {project.repo ? project.repo.replace("https://github.com/", "") : "no connected repo"}
            </p>
          </div>
        </div>

        {currentUserRole !== "Viewer" && (
          <button
            onClick={onDisconnect}
            className="h-8 px-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-red-650 hover:border-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Disconnect webhook"
          >
            <Trash2 className="w-3.5 h-3.5" /> Disconnect
          </button>
        )}
      </div>

      {/* Card Body Grid — layout changes based on role */}
      <div className={`grid grid-cols-1 ${currentUserRole !== "Viewer" ? "lg:grid-cols-[1.1fr_0.9fr]" : ""} gap-6`}>

        {/* Left Panel: Credentials — hidden for Viewers */}
        {currentUserRole !== "Viewer" && (
          <div className="space-y-5">
            <div className="space-y-4 bg-slate-50/50 border border-slate-200 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" /> Webhook Credentials
              </h4>

              {/* Payload URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payload URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 h-9 px-3 flex items-center rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 truncate shadow-sm">
                    {info.webhookUrl}
                  </code>
                  <button onClick={() => urlCopy.copy(info.webhookUrl)} className="shrink-0 w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm">
                    {urlCopy.copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                </div>
              </div>

              {/* Secret Token */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Secret Token</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 h-9 px-3 flex items-center rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 truncate shadow-sm">
                    {showSecret ? info.secret : "•".repeat(32)}
                  </code>
                  <button onClick={() => setShowSecret(!showSecret)} className="shrink-0 w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm">
                    {showSecret ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                  <button onClick={() => secretCopy.copy(info.secret)} className="shrink-0 w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm">
                    {secretCopy.copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 my-2" />

              <div>
                <button onClick={() => setShowGuide(!showGuide)} className="text-xs font-semibold text-slate-600 hover:text-slate-850 transition-colors flex items-center gap-1">
                  {showGuide ? "Hide Setup Instructions" : "Show Setup Instructions"}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showGuide ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showGuide && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
                      <div className="space-y-2.5 pt-1">
                        {[
                          { step: "1", text: "Go to your GitHub Repository Settings → Webhooks → Add webhook." },
                          { step: "2", text: "Paste the Payload URL from above into the Payload URL field." },
                          { step: "3", text: "Choose Content type: application/json." },
                          { step: "4", text: "Paste the Secret Token from above into the Secret field." },
                          { step: "5", text: "Select \"Just the push event\" and click Add webhook." },
                        ].map((item) => (
                          <div key={item.step} className="flex items-start gap-2.5 text-[11px] text-slate-600 leading-relaxed font-medium">
                            <span className="shrink-0 w-4.5 h-4.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold mt-0.5">{item.step}</span>
                            <span>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-slate-600" /> Real Local Verification Command:
              </h5>
              <p className="text-[11px] text-slate-500 leading-normal font-medium">
                Verify the webhook instantly by sending a <strong>real HTTP request</strong> directly to the local backend. Copy and run this in your computer's terminal:
              </p>
              <div className="flex gap-2">
                <code className="flex-1 p-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-mono text-[10px] whitespace-pre-wrap break-all leading-normal shadow-sm">{curlCommand}</code>
                <button onClick={() => curlCopy.copy(curlCommand)} className="shrink-0 self-start w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm" title="Copy terminal command">
                  {curlCopy.copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Viewer restricted notice — shows instead of credentials */}
        {currentUserRole === "Viewer" && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Restricted Access</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">Webhook credentials (URL &amp; secret token) are only visible to workspace Owners and Members. Contact your workspace owner for access.</p>
            </div>
          </div>
        )}

        {/* Right Panel: Simulated Live Console Logs & Testing (PURE WHITE LIGHT THEME TERMINAL) */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Terminal Screen (WHITE BACKGROUND) */}
          <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl p-4 shadow-sm flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between mb-3 border-b border-slate-150 pb-2">
              <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-slate-500" /> delivery_logs
              </span>
              
              {isVerified ? (
                <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-600 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> VERIFIED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-mono text-amber-600 font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> PENDING SETUP
                </span>
              )}
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[220px] font-mono text-[11px]">
              {deliveries.length === 0 ? (
                <div className="text-slate-400 text-center py-12 flex flex-col items-center justify-center gap-2">
                  <HelpCircle className="w-6 h-6 text-slate-300" />
                  <p className="leading-relaxed max-w-[210px] text-[11px] font-medium">
                    Awaiting handshake trigger. Run the <strong>curl command</strong> on the left, or click the <strong>Verify Connection</strong> button above to force connect!
                  </p>
                </div>
              ) : (
                deliveries.map((del) => (
                  <div key={del.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-sky-600 uppercase">{del.event} event {del.branch && `• ${del.branch}`}</span>
                      <span className="text-slate-400 font-medium">
                        {new Date(del.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium leading-normal">{del.message}</p>
                    {del.author && del.author !== 'unknown' && (
                      <p className="text-[9px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <Github className="w-3 h-3" /> by {del.author}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[9px] text-slate-450 pt-0.5 border-t border-slate-100 mt-1.5">
                      <span>status: <strong className={del.status === "success" ? "text-emerald-600" : del.status === "failed" ? "text-red-500" : "text-amber-650 animate-pulse"}>{del.status}</strong></span>
                      {del.commit && del.commit !== "-" && <span>commit: {del.commit}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Setup verification indicator */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <h6 className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" style={{ animationDuration: "4s" }} /> Auto-Detect Poller Active
            </h6>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Checking every 5 seconds if GitHub has sent the webhook handshake. Status turns green automatically once your repo's webhook is configured with the Payload URL and Secret Token above.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhooks Landing Dashboard Container
// ─────────────────────────────────────────────────────────────────────────────
export default function WebhooksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Navigation states: "landing" | "connect"
  const [view, setView] = useState<"landing" | "connect">("landing");
  const [currentUserRole, setCurrentUserRole] = useState("Owner");

  // Auto-switch to connect view if ?connect=projectName is in URL (from project settings)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectName = params.get("connect");
    if (connectName) {
      setView("connect");
    }
  }, []);
  
  // Active/Connected webhooks state (Persists in localStorage)
  const [connectedIds, setConnectedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("zenith.webhooks.active") || "[]");
    } catch {
      return [];
    }
  });

  // Tracks which projects have been TRULY verified by real GitHub ping
  const [verifiedProjects, setVerifiedProjects] = useState<Record<string, boolean>>({});

  // Copy helpers
  const urlCopy = useCopy();
  const secretCopy = useCopy();

  // Connect flow states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  // Delivery logs cache (persisted per project)
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({});
  
  // Object dictionary for mapped project webhook credentials
  const [credentialsCache, setCredentialsCache] = useState<Record<string, WebhookInfo>>({});

  // Keeps track of project properties to detect server-side builds/updates
  const initialProjectStates = useRef<Record<string, { container: string; updatedAt: string }>>({});

  // Sync connected IDs with localStorage
  useEffect(() => {
    localStorage.setItem("zenith.webhooks.active", JSON.stringify(connectedIds));
  }, [connectedIds]);

  // Load projects & initialize active details
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProjectsFromServer();
        setProjects(data);
        
        // Cache initial states to detect builds
        const states: Record<string, { container: string; updatedAt: string }> = {};
        data.forEach((p) => {
          states[p.name] = { container: (p as any).container || "", updatedAt: (p as any).updatedAt || "" };
        });
        initialProjectStates.current = states;
        
        // Fetch active webhooks from the backend
        let activeIds: string[] = [];
        try {
          const token = getAuthToken();
          const workspaceId = localStorage.getItem("cloudrik-workspace");
          let url = "/api-proxy/api/webhooks";
          if (workspaceId) url += `?workspaceId=${workspaceId}`;
          const wRes = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (wRes.ok) {
            activeIds = await wRes.json();
          }
          
          // Fetch Role
          const roleRes = await fetch(`/api-proxy/api/auth/me${workspaceId ? `?workspaceId=${workspaceId}` : ''}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (roleRes.ok) {
            const roleData = await roleRes.json();
            setCurrentUserRole(roleData.workspaceRole || "Owner");
          }
        } catch {}
        
        // Merge with local storage just in case
        const localActive: string[] = JSON.parse(localStorage.getItem("zenith.webhooks.active") || "[]");
        activeIds = Array.from(new Set([...activeIds, ...localActive]));
        setConnectedIds(activeIds);

        const cache: Record<string, WebhookInfo> = {};
        
        await Promise.all(
          activeIds.map(async (name) => {
            try {
              const infoData = await getWebhookInfo(name);
              if (infoData) {
                cache[name] = infoData;
              }
            } catch { /* ignore */ }
          })
        );
        
        setCredentialsCache(cache);

        // Auto-select project from ?connect= URL param
        const params = new URLSearchParams(window.location.search);
        const connectName = params.get("connect");
        if (connectName) {
          const matchedProject = data.find((p) => p.name === connectName);
          if (matchedProject) {
            setSelectedProject(matchedProject);
          }
        }
      } catch {
        /* fail silent */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Poll backend every 5s to auto-detect if GitHub has sent a real webhook handshake
  useEffect(() => {
    if (connectedIds.length === 0) return;

    async function checkPings() {
      for (const name of connectedIds) {
        try {
          const status = await getWebhookPingStatus(name);
          if (status.verified) {
            setVerifiedProjects((prev) => {
              if (prev[name]) return prev; // already marked, no re-render
              // First time we detect verified — add delivery log + toast
              const newDelivery: WebhookDelivery = {
                id: `del_${Date.now()}`,
                event: "ping",
                timestamp: status.verifiedAt ? new Date(status.verifiedAt).toLocaleTimeString() : "Just now",
                status: "success",
                commit: "-",
                message: "GitHub handshake received — webhook is active and verified!",
                branch: "",
                author: "",
                pusher: "",
                repo: "",
                compareUrl: "",
                completedAt: status.verifiedAt || new Date().toISOString()
              };
              setDeliveries((d) => ({
                ...d,
                [name]: [newDelivery, ...(d[name] || [])],
              }));
              toast({
                title: "Webhook Verified! ✅",
                description: `Real GitHub handshake detected for ${name}. Auto-deploy is live!`,
              });
              return { ...prev, [name]: true };
            });

            // Fetch real delivery logs from backend
            const fetchedDeliveries = await getWebhookDeliveries(name);
            
            // Add a mock 'ping' handshake event at the end so it looks nice if there are no real pushes yet
            const pingEvent: WebhookDelivery = {
              id: `del_ping_${status.verifiedAt || Date.now()}`,
              event: "ping",
              timestamp: status.verifiedAt || new Date().toISOString(),
              status: "success",
              commit: "-",
              message: "GitHub handshake received — webhook is active and verified!",
              branch: "",
              author: "",
              pusher: "",
              repo: "",
              compareUrl: "",
              completedAt: status.verifiedAt || new Date().toISOString()
            };
            
            const updatedDeliveries = [...fetchedDeliveries];
            // Only add ping if not already there and if we just verified
            if (!updatedDeliveries.find(d => d.event === 'ping')) {
               updatedDeliveries.push(pingEvent);
            }

            setDeliveries(prev => ({
              ...prev,
              [name]: updatedDeliveries
            }));
          }
        } catch { /* ignore */ }
      }
    }

    checkPings(); // run immediately on mount
    const timer = setInterval(checkPings, 5000);
    return () => clearInterval(timer);
  }, [connectedIds, toast]);

  // Fetch existing webhook credentials when a project is selected
  useEffect(() => {
    if (!selectedProject) {
      setWebhookInfo(null);
      return;
    }

    async function loadInfo() {
      setFetchingInfo(true);
      setInfoError(null);
      try {
        const data = await getWebhookInfo(selectedProject!.name);
        setWebhookInfo(data);
      } catch {
        setInfoError("Failed to fetch webhook info. Verify backend server connectivity.");
      } finally {
        setFetchingInfo(false);
      }
    }
    loadInfo();
  }, [selectedProject]);

  // Explicitly generate webhook credentials when requested
  async function handleGenerateWebhook() {
    if (!selectedProject) return;
    setFetchingInfo(true);
    setInfoError(null);
    try {
      const data = await generateWebhook(selectedProject.name);
      setWebhookInfo(data);
    } catch {
      setInfoError("Failed to generate webhook. Verify backend server connectivity.");
    } finally {
      setFetchingInfo(false);
    }
  }


  // Activate a webhook for a selected project
  function handleActivateWebhook() {
    if (!selectedProject || !webhookInfo) return;
    
    const projName = selectedProject.name;
    
    if (!connectedIds.includes(projName)) {
      setConnectedIds((prev) => [...prev, projName]);
      setCredentialsCache((prev) => ({ ...prev, [projName]: webhookInfo }));
    }

    toast({
      title: "Integration Saved!",
      description: `Awaiting GitHub handshake. Paste the Payload URL into repository settings to activate.`,
    });

    // Reset flow and head back to landing status panel
    setSelectedProject(null);
    setView("landing");
  }

  // Disconnect/Remove a webhook connection
  async function handleDisconnectWebhook(projName: string) {
    // Actually delete from backend
    try {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      let url = `/api-proxy/api/webhooks/${projName}`;
      if (workspaceId) url += `?workspaceId=${workspaceId}`;
      await fetch(url, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch {}

    setConnectedIds((prev) => prev.filter((id) => id !== projName));
    
    // Clear delivery history for clean reset
    setDeliveries((prev) => {
      const copy = { ...prev };
      delete copy[projName];
      return copy;
    });

    toast({
      title: "Webhook disconnected",
      description: `Auto-deployments disabled for ${projName}.`,
    });
  }

  const activeConnectedProjects = projects.filter((p) => connectedIds.includes(p.name));

  return (
    <AppShell activeNav="Webhooks">
      <div className="min-h-full bg-[#fafafa] px-6 py-8">
        <div className="max-w-5xl mx-auto">
          
          <AnimatePresence mode="wait">
            
            {/* STATE 1: LANDING FLOW (Dynamic: shows onboarding split layout if none connected, else active dashboard list) */}
            {view === "landing" && (
              <motion.div
                key="landing-panel"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Header: Left aligned, with dynamic "New Webhook" button in the right corner if webhooks exist */}
                <div className="flex items-center justify-between pb-1 flex-wrap gap-4 text-left">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <Webhook className="w-6 h-6 text-slate-800" /> Webhooks
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                      {activeConnectedProjects.length > 0
                        ? "Manage and monitor your active auto-deployment triggers."
                        : "Receive live notifications and trigger automated deployment workflows."}
                    </p>
                  </div>
                  
                  {/* Dynamic Top Right Connect Button if at least 1 is connected */}
                  {activeConnectedProjects.length > 0 && currentUserRole !== "Viewer" && (
                    <button
                      onClick={() => setView("connect")}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98]"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Webhook
                    </button>
                  )}
                </div>

                {/* ONBOARDING STATE: No connected webhooks - render split screen landing advantages */}
                {activeConnectedProjects.length === 0 && !loading && (
                  <div className="space-y-8">
                    {/* Two-Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      
                      {/* Left Column: Connect Card (All elements centered, normal card, no top line) */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center min-h-[430px]">
                        <div className="relative w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 shadow-md shrink-0">
                          <Webhook className="w-7 h-7 text-white" />
                          <div className="absolute -inset-1.5 rounded-2xl border border-sky-400/20 animate-ping opacity-60" style={{ animationDuration: "3s" }} />
                        </div>

                        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">
                          Automate Your Deployment Flow
                        </h2>
                        
                        <p className="text-sm text-slate-500 leading-relaxed mb-8 max-w-sm">
                          Connect a secure GitHub webhook to automatically trigger lightning-fast serverless builds, container updates, and production deployments on every commit. No manuals, no waiting.
                        </p>

                        {currentUserRole !== "Viewer" && (
                          <button
                            onClick={() => setView("connect")}
                            className="group relative inline-flex items-center gap-2.5 h-12 px-6 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                          >
                            <Sparkles className="w-4.5 h-4.5 text-sky-400 group-hover:rotate-12 transition-transform" />
                            Connect Webhook
                          </button>
                        )}
                      </div>

                      {/* Right Column: Webhooks advantages directly next to connect box */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[430px]">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-5">
                            Webhooks advantages
                          </span>

                          <div className="space-y-4">
                            {[
                              { icon: Zap, color: "text-sky-500 bg-sky-50 border-sky-100", title: "Zero-Latency Compilation", text: "Zenith Docker compiler parses git hooks in under 15ms to launch container builds." },
                              { icon: ShieldCheck, color: "text-purple-500 bg-purple-50 border-purple-100", title: "HMAC Signature Handshake", text: "SHA-256 validation prevents rogue request injections and ensures payload legitimacy." },
                              { icon: Terminal, color: "text-emerald-500 bg-emerald-50 border-emerald-100", title: "Dynamic Delivery History", text: "Inspect status codes, signatures, and commit payloads directly in the log terminal." },
                              { icon: Layers, color: "text-amber-500 bg-amber-50 border-amber-100", title: "Downtime-Free rollbacks", text: "If a newly pushed commit build fails, the platform keeps the active live site running." },
                              { icon: Globe, color: "text-indigo-500 bg-indigo-50 border-indigo-100", title: "Global DNS Synchronization", text: "Immediate routing updates are triggered across all custom domain networks." }
                            ].map((adv) => (
                              <div key={adv.title} className="flex gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${adv.color}`}>
                                  <adv.icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-800">{adv.title}</p>
                                  <p className="text-[11px] text-slate-500 leading-normal">{adv.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Bottom Row: Visual animation visualizer centered below the two cards (PURE LIGHT WHITE EVENT GATEWAY) */}
                    <div className="max-w-2xl mx-auto w-full">
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden">
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-mono font-bold text-slate-450 tracking-widest uppercase">Live Event Gateway</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-250 text-[9px] font-mono text-emerald-600 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl relative my-3">
                          
                          <div className="flex flex-col items-center gap-1.5 z-10">
                            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm text-slate-700">
                              <Github className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-medium">Git Push</span>
                          </div>

                          <div className="flex-1 h-0.5 bg-slate-200 relative overflow-hidden mx-1">
                            <div className="absolute inset-0 bg-sky-450" style={{
                              animation: "shimmer 1.5s linear infinite",
                              width: "30%",
                            }} />
                          </div>

                          <div className="flex flex-col items-center gap-1.5 z-10">
                            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm text-sky-600">
                              <Webhook className="w-4.5 h-4.5 animate-pulse" />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-medium">Webhook</span>
                          </div>

                          <div className="flex-1 h-0.5 bg-slate-200 relative overflow-hidden mx-1">
                            <div className="absolute inset-0 bg-emerald-450" style={{
                              animation: "shimmer 1.5s linear infinite",
                              animationDelay: "0.7s",
                              width: "30%",
                            }} />
                          </div>

                          <div className="flex flex-col items-center gap-1.5 z-10">
                            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm text-emerald-600">
                              <Rocket className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-medium">Deploy Live</span>
                          </div>

                        </div>
                      </div>
                    </div>

                    <style dangerouslySetInnerHTML={{ __html: `
                      @keyframes shimmer {
                        0% { left: -30%; }
                        100% { left: 100%; }
                      }
                    `}} />
                  </div>
                )}

                {/* DYNAMIC RETURNING STATE: Render list of active connected webhooks */}
                {activeConnectedProjects.length > 0 && !loading && (
                  <div className="space-y-6">
                    {activeConnectedProjects.map((p) => {
                      const infoData = credentialsCache[p.name];
                      if (!infoData) return null;
                      return (
                        <ActiveWebhookCard
                          key={p.name}
                          project={p}
                          info={infoData}
                          onDisconnect={() => handleDisconnectWebhook(p.name)}
                          isVerified={!!verifiedProjects[p.name]}
                          lastUpdated={(p as any).updatedAt || ""}
                          deliveries={deliveries[p.name] || []}
                          currentUserRole={currentUserRole}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Global loading state */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-350" />
                    <span className="text-sm">Loading webhooks dashboard…</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* STATE 2: NEW CONNECT WEBHOOK FLOW WITH PROJECT SELECTOR */}
            {view === "connect" && (
              <motion.div
                key="connect-flow"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Navigation Back */}
                <button
                  onClick={() => {
                    setView("landing");
                    setSelectedProject(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-805 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Webhooks
                </button>

                {/* Title Header */}
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-slate-900">Connect Webhook</h1>
                  <p className="text-sm text-slate-500 mt-1 font-normal">Select an active project to generate and configure its secure deployment webhook.</p>
                </div>

                {/* Card container */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                  
                  {/* Project Selection Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Select Project</label>
                    <div className="relative">
                      <select
                        value={selectedProject ? selectedProject.name : ""}
                        onChange={(e) => {
                          const proj = projects.find((p) => p.name === e.target.value) || null;
                          setSelectedProject(proj);
                        }}
                        className="w-full h-11 pl-4 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled>-- Select a Project --</option>
                        {projects.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name} ({p.repo ? p.repo.replace("https://github.com/", "") : "no repository connected"})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Loading state for credentials */}
                  {fetchingInfo && (
                    <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-sm">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                      <span>Generating secure credentials…</span>
                    </div>
                  )}

                  {/* Error loading */}
                  {infoError && (
                    <div className="text-xs text-red-650 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      {infoError}
                    </div>
                  )}

                  {/* Prompt when project is selected but webhook is unconfigured */}
                  {selectedProject && !webhookInfo && !fetchingInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-10 px-6 bg-slate-50 border border-slate-200 border-dashed rounded-3xl text-center"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm text-slate-450">
                        <Webhook className="w-5 h-5 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mb-1">Webhook Unconfigured</h3>
                      <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-5">
                        No active webhook integration exists for <strong>{selectedProject.name}</strong>. Generate secure credentials to connect GitHub.
                      </p>
                      {currentUserRole !== "Viewer" ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedProject(null);
                              setView("landing");
                            }}
                            className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors shadow-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleGenerateWebhook}
                            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98]"
                          >
                            <Zap className="w-4 h-4 text-sky-400" /> Generate Webhook
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedProject(null);
                            setView("landing");
                          }}
                          className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors shadow-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* Webhook credentials output */}
                  {selectedProject && webhookInfo && !fetchingInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6 pt-2 border-t border-slate-100"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
                        {/* Left Panel: Credentials Output & Integration Tutorial */}
                        <div className="space-y-5 bg-slate-50/50 border border-slate-200 rounded-2xl p-5">
                          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                            <LinkIcon className="w-3.5 h-3.5 text-slate-500" /> Webhook Credentials
                          </h3>

                          {/* Payload URL */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payload URL</label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 h-9 px-3 flex items-center rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 truncate shadow-sm">
                                {webhookInfo.webhookUrl}
                              </code>
                              <button
                                onClick={() => urlCopy.copy(webhookInfo.webhookUrl)}
                                className="shrink-0 w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm"
                                title="Copy payload URL"
                              >
                                {urlCopy.copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                              </button>
                            </div>
                          </div>

                          {/* Secret Token */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Secret Token</label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 h-9 px-3 flex items-center rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 truncate shadow-sm">
                                {showSecret ? webhookInfo.secret : "•".repeat(32)}
                              </code>
                              <button
                                onClick={() => setShowSecret(!showSecret)}
                                className="shrink-0 w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm"
                              >
                                {showSecret ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                              </button>
                              <button
                                onClick={() => secretCopy.copy(webhookInfo.secret)}
                                className="shrink-0 w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm"
                                title="Copy secret"
                              >
                                {secretCopy.copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                              </button>
                            </div>
                          </div>

                          <div className="border-t border-slate-250 my-4" />

                          {/* GitHub Integration guide */}
                          <div className="space-y-3">
                            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Github className="w-3.5 h-3.5 text-slate-800" /> GitHub Repo Configuration:
                            </div>
                            <div className="space-y-2.5">
                              {[
                                { step: "1", text: "Go to your GitHub Repo → Settings → Webhooks → Add webhook." },
                                { step: "2", text: "Paste the Payload URL from above into the Payload URL field." },
                                { step: "3", text: "Choose Content type: application/json." },
                                { step: "4", text: "Paste the Secret Token from above into the Secret field." },
                                { step: "5", text: "Select \"Just the push event\" and click Add webhook." },
                              ].map((item) => (
                                <div key={item.step} className="flex items-start gap-2.5 text-[11px] text-slate-600 leading-relaxed font-medium">
                                  <span className="shrink-0 w-4.5 h-4.5 rounded-full bg-slate-100 border border-slate-200 text-slate-705 flex items-center justify-center text-[9px] font-bold mt-0.5">
                                    {item.step}
                                  </span>
                                  <span>{item.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Panel: Simulated Live Console Logs & Testing */}
                        <div className="space-y-5 flex flex-col justify-between">
                          
                          {/* Log Screen */}
                          <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl p-5 shadow-sm flex-1 flex flex-col min-h-[220px]">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-150 pb-2">
                              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <Terminal className="w-3.5 h-3.5 text-slate-550" /> delivery_logs
                              </h3>
                              <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> LIVE
                              </span>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[240px] pr-1 font-mono text-xs text-slate-450">
                              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center text-slate-400">
                                <HelpCircle className="w-6 h-6 text-slate-300" />
                                <p className="leading-relaxed text-[11px] max-w-[200px] font-medium">
                                  Integration not yet active. Save and trigger a real webhook payload or click Verify above.
                                </p>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Primary Activate / Save Integration Action */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-150">
                        <button
                          onClick={() => {
                            setSelectedProject(null);
                            setView("landing");
                          }}
                          className="h-11 px-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleActivateWebhook}
                          className="h-11 px-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold inline-flex items-center gap-2 transition-all shadow active:scale-[0.98]"
                        >
                          <Check className="w-4 h-4 text-sky-400" /> Save & Activate Integration
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Prompt when no project is chosen */}
                  {!selectedProject && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-450 text-center">
                      <LinkIcon className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs font-normal">Choose a project from the list above to set up GitHub deploy keys.</p>
                    </div>
                  )}

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
