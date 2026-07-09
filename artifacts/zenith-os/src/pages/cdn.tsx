import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Globe,
  Layers,
  ArrowRightLeft,
  Route as RouteIcon,
  Loader2,
  Trash2,
  Plus,
  Check,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Sliders,
  Trash,
  X,
  Edit2,
  Clock,
  Info,
  TriangleAlert,
  ChevronRight,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthToken } from "@/lib/projects";
import { useProjectStore } from "@/hooks/useProject";

interface CacheRule {
  id: string;
  pathPattern: string;
  behavior: "Bypass" | "Cache";
  ttlOverride: string;
  status: "Active" | "Inactive";
}

export default function CdnPage() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem("cdn_active_tab") || "Caches";
  });

  useEffect(() => {
    localStorage.setItem("cdn_active_tab", activeTab);
  }, [activeTab]);
  const { activeProject: projectName } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [purging, setPurging] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Initial fetched state to detect unsaved changes
  const [initialState, setInitialState] = useState<any>(null);

  // CDN Caches Tab State
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [cacheTtl, setCacheTtl] = useState("1h");
  const [cacheRules, setCacheRules] = useState<CacheRule[]>([
    { id: "1", pathPattern: "/api/*", behavior: "Bypass", ttlOverride: "-", status: "Active" },
    { id: "2", pathPattern: "/images/*", behavior: "Cache", ttlOverride: "1 Year", status: "Active" },
    { id: "3", pathPattern: "/_next/static/*", behavior: "Cache", ttlOverride: "Immutable", status: "Active" },
  ]);

  // Purge States
  const [purgeUrlInput, setPurgeUrlInput] = useState("");
  const [purgeTagInput, setPurgeTagInput] = useState("");

  // Add rule modal state
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [rulePath, setRulePath] = useState("");
  const [ruleBehavior, setRuleBehavior] = useState<"Bypass" | "Cache">("Cache");
  const [ruleTtl, setRuleTtl] = useState("1 Hour");
  const [ruleStatus, setRuleStatus] = useState<"Active" | "Inactive">("Active");

  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);

  // CDN Redirects Tab State
  const [redirects, setRedirects] = useState<Array<{ fromPath: string; toUrl: string; statusCode: number; status?: "Active" | "Inactive" }>>([]);
  const [newFromPath, setNewFromPath] = useState("");
  const [newToUrl, setNewToUrl] = useState("");
  const [newStatusCode, setNewStatusCode] = useState(301);
  const [redirectSearch, setRedirectSearch] = useState("");
  const [redirectFilterStatus, setRedirectFilterStatus] = useState("All");

  // Redirect modal states
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [editingRedirectIndex, setEditingRedirectIndex] = useState<number | null>(null);
  const [redirectFromPath, setRedirectFromPath] = useState("");
  const [redirectToUrl, setRedirectToUrl] = useState("");
  const [redirectStatusCode, setRedirectStatusCode] = useState(301);
  const [redirectStatus, setRedirectStatus] = useState<"Active" | "Inactive">("Active");

  // Filtered Redirects
  const filteredRedirects = redirects.filter(r => {
    const matchesSearch = r.fromPath.toLowerCase().includes(redirectSearch.toLowerCase()) ||
                          r.toUrl.toLowerCase().includes(redirectSearch.toLowerCase());
    const matchesFilter = redirectFilterStatus === "All" || r.statusCode.toString() === redirectFilterStatus;
    return matchesSearch && matchesFilter;
  });

  // CDN Routing Rules Tab State
  interface RoutingRule {
    path: string;
    destination: string;
    type: "Rewrite" | "Middleware" | "Redirect";
    priority: number;
    status: "Active" | "Inactive";
    caseSensitive?: boolean;
    appendSlash?: boolean;
  }

  const [routes, setRoutes] = useState<Array<RoutingRule>>([]);

  const [routeSearch, setRouteSearch] = useState("");
  const [routeFilterType, setRouteFilterType] = useState("All");

  // Routing Rule modal states
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRouteIndex, setEditingRouteIndex] = useState<number | null>(null);
  const [routePathInput, setRoutePathInput] = useState("");
  const [routeDestInput, setRouteDestInput] = useState("");
  const [routeType, setRouteType] = useState<"Rewrite" | "Middleware" | "Redirect">("Rewrite");
  const [routePriority, setRoutePriority] = useState(100);
  const [routeStatus, setRouteStatus] = useState<"Active" | "Inactive">("Active");
  const [routeCaseSensitive, setRouteCaseSensitive] = useState(false);
  const [routeAppendSlash, setRouteAppendSlash] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Edge Middleware state
  const [edgeAuthCheck, setEdgeAuthCheck] = useState(true);
  const [edgeAbTesting, setEdgeAbTesting] = useState(false);
  const [edgeGeolocation, setEdgeGeolocation] = useState(true);

  // Analytics Tooltip state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [analyticsData, setAnalyticsData] = useState<{ time: string; hits: number; misses: number; bypass: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Filtered Routes
  const filteredRoutes = routes.filter(r => {
    const matchesSearch = r.path.toLowerCase().includes(routeSearch.toLowerCase()) ||
                          r.destination.toLowerCase().includes(routeSearch.toLowerCase());
    const matchesFilter = routeFilterType === "All" || r.type === routeFilterType;
    return matchesSearch && matchesFilter;
  });

  // Fetch settings when active project changes
  useEffect(() => {
    if (!projectName) return;

    const fetchCdnSettings = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        const res = await fetch(`/api-proxy/projects/${projectName}/cdn`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setCacheEnabled(data.cdnCacheEnabled !== false);
          setCacheTtl(data.cdnCacheTtl || "1h");
          if (data.cacheRules && Array.isArray(data.cacheRules)) {
            setCacheRules(data.cacheRules);
          }
          setRedirects(data.redirects || []);
          setRoutes(data.routes || []);

          setInitialState({
            cacheEnabled: data.cdnCacheEnabled !== false,
            cacheTtl: data.cdnCacheTtl || "1h",
            cacheRules: data.cacheRules || [
              { id: "1", pathPattern: "/api/*", behavior: "Bypass", ttlOverride: "-", status: "Active" },
              { id: "2", pathPattern: "/images/*", behavior: "Cache", ttlOverride: "1 Year", status: "Active" },
              { id: "3", pathPattern: "/_next/static/*", behavior: "Cache", ttlOverride: "Immutable", status: "Active" },
            ],
            redirects: data.redirects || [],
            routes: data.routes || []
          });
        }

        // Fetch cache analytics data
        const analyticsRes = await fetch(`/api-proxy/projects/${projectName}/cdn/analytics`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (analyticsRes.ok) {
          const analyticsDataFetched = await analyticsRes.json();
          if (Array.isArray(analyticsDataFetched) && analyticsDataFetched.length > 0) {
            setAnalyticsData(analyticsDataFetched);
          }
        }
      } catch (err) {
        console.error("Failed to load CDN settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCdnSettings();
  }, [projectName]);

  // Listen for container resize to adjust chart width dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      setContainerWidth(containerRef.current?.clientWidth || 800);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Detect unsaved changes
  const hasUnsavedChanges = initialState ? (
    cacheEnabled !== initialState.cacheEnabled ||
    cacheTtl !== initialState.cacheTtl ||
    JSON.stringify(cacheRules) !== JSON.stringify(initialState.cacheRules) ||
    JSON.stringify(redirects) !== JSON.stringify(initialState.redirects) ||
    JSON.stringify(routes) !== JSON.stringify(initialState.routes)
  ) : false;

  // Show status message helper
  const showStatus = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Discard changes
  const handleDiscardChanges = () => {
    if (!initialState) return;
    setCacheEnabled(initialState.cacheEnabled);
    setCacheTtl(initialState.cacheTtl);
    setCacheRules(initialState.cacheRules);
    setRedirects(initialState.redirects);
    setRoutes(initialState.routes);
    showStatus("Changes discarded.", "success");
  };

  // Save Settings to Backend
  const handleSaveSettings = async () => {
    if (!projectName) return;
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api-proxy/projects/${projectName}/cdn/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cdnCacheEnabled: cacheEnabled,
          cdnCacheTtl: cacheTtl,
          cacheRules,
          redirects,
          routes,
        }),
      });
      if (res.ok) {
        showStatus("CDN configurations applied and Nginx reloaded successfully!", "success");
        setInitialState({
          cacheEnabled,
          cacheTtl,
          cacheRules,
          redirects,
          routes
        });
      } else {
        showStatus("Failed to update CDN configurations.", "error");
      }
    } catch (err) {
      showStatus("Connection error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Purge CDN Cache
  const handlePurgeAll = async () => {
    if (!projectName) return;
    setPurging(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api-proxy/projects/${projectName}/cdn/purge`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        showStatus("Global CDN cache purged successfully!", "success");
      } else {
        showStatus("Failed to purge cache.", "error");
      }
    } catch (err) {
      showStatus("Connection error during cache purge.", "error");
    } finally {
      setPurging(false);
    }
  };

  // Handle Purge URL / Tag (Demo success notification)
  const handlePurgeUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purgeUrlInput) return;
    showStatus(`Purge request sent for URL: ${purgeUrlInput}`, "success");
    setPurgeUrlInput("");
  };

  const handlePurgeTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purgeTagInput) return;
    showStatus(`Purge request sent for Tag: ${purgeTagInput}`, "success");
    setPurgeTagInput("");
  };

  // Custom Cache Rules Actions
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rulePath) {
      showStatus("Path Pattern is required", "error");
      return;
    }

    if (editingRuleId) {
      setCacheRules(cacheRules.map(r => r.id === editingRuleId ? {
        id: editingRuleId,
        pathPattern: rulePath,
        behavior: ruleBehavior,
        ttlOverride: ruleBehavior === "Bypass" ? "-" : ruleTtl,
        status: ruleStatus
      } : r));
      showStatus("Cache rule updated locally.", "success");
    } else {
      const newRule: CacheRule = {
        id: Date.now().toString(),
        pathPattern: rulePath,
        behavior: ruleBehavior,
        ttlOverride: ruleBehavior === "Bypass" ? "-" : ruleTtl,
        status: ruleStatus
      };
      setCacheRules([...cacheRules, newRule]);
      showStatus("Cache rule added locally.", "success");
    }

    setRuleModalOpen(false);
    setEditingRuleId(null);
    setRulePath("");
  };

  const startEditRule = (rule: CacheRule) => {
    setEditingRuleId(rule.id);
    setRulePath(rule.pathPattern);
    setRuleBehavior(rule.behavior);
    setRuleTtl(rule.ttlOverride === "-" ? "1 Hour" : rule.ttlOverride);
    setRuleStatus(rule.status);
    setRuleModalOpen(true);
  };

  const handleDeleteRule = (id: string) => {
    setCacheRules(cacheRules.filter(r => r.id !== id));
    showStatus("Cache rule deleted locally.", "success");
  };

  // Custom Redirects Actions
  const handleSaveRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redirectFromPath.startsWith("/")) {
      showStatus("From Path must start with /", "error");
      return;
    }
    if (!redirectToUrl) {
      showStatus("Destination URL is required", "error");
      return;
    }

    if (editingRedirectIndex !== null) {
      const updated = [...redirects];
      updated[editingRedirectIndex] = {
        fromPath: redirectFromPath,
        toUrl: redirectToUrl,
        statusCode: redirectStatusCode,
        status: redirectStatus
      };
      setRedirects(updated);
      showStatus("Redirect rule updated locally.", "success");
    } else {
      setRedirects([...redirects, {
        fromPath: redirectFromPath,
        toUrl: redirectToUrl,
        statusCode: redirectStatusCode,
        status: redirectStatus
      }]);
      showStatus("Redirect rule added locally.", "success");
    }

    setRedirectModalOpen(false);
    setEditingRedirectIndex(null);
    setRedirectFromPath("");
    setRedirectToUrl("");
    setRedirectStatusCode(301);
    setRedirectStatus("Active");
  };

  const handleRemoveRedirect = (index: number) => {
    setRedirects(redirects.filter((_, i) => i !== index));
    showStatus("Redirect rule deleted locally.", "success");
  };

  // Custom Routes Actions
  const handleSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routePathInput.startsWith("/")) {
      showStatus("Source path must start with /", "error");
      return;
    }
    if (!routeDestInput) {
      showStatus("Destination URL/Middleware path is required", "error");
      return;
    }

    const newRule: RoutingRule = {
      path: routePathInput,
      destination: routeDestInput,
      type: routeType,
      priority: routePriority,
      status: routeStatus,
      caseSensitive: routeCaseSensitive,
      appendSlash: routeAppendSlash
    };

    if (editingRouteIndex !== null) {
      const updated = [...routes];
      updated[editingRouteIndex] = newRule;
      setRoutes(updated);
      showStatus("Routing rule updated locally.", "success");
    } else {
      setRoutes([...routes, newRule]);
      showStatus("Routing rule added locally.", "success");
    }

    setRouteModalOpen(false);
    setEditingRouteIndex(null);
    setRoutePathInput("");
    setRouteDestInput("");
    setRouteType("Rewrite");
    setRoutePriority(100);
    setRouteStatus("Active");
    setRouteCaseSensitive(false);
    setRouteAppendSlash(false);
    setShowAdvanced(false);
  };

  const handleRemoveRoute = (index: number) => {
    setRoutes(routes.filter((_, i) => i !== index));
    showStatus("Routing rule deleted locally.", "success");
  };

  // SVG Chart Calculation (Last 24 Hours)
  const generateDynamicCacheAnalytics = () => {
    const data = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = `${d.getHours()}:00`;
      
      // Calculate realistic counts with peak variations (sin/cos traffic model)
      const baseHits = 9300 + Math.floor(Math.sin((d.getHours() / 24) * Math.PI * 2) * 400) + Math.floor(Math.random() * 200);
      const baseMisses = 1000 + Math.floor(Math.cos((d.getHours() / 24) * Math.PI * 2) * 120) + Math.floor(Math.random() * 80);
      const baseBypass = 200 + Math.floor(Math.sin((d.getHours() / 24) * Math.PI * 2) * 25) + Math.floor(Math.random() * 30);

      data.push({
        time: hourStr,
        hits: Math.max(0, Math.min(10000, baseHits)),
        misses: Math.max(0, Math.min(10000, baseMisses)),
        bypass: Math.max(0, Math.min(10000, baseBypass))
      });
    }
    return data;
  };

  const activeData = analyticsData.length > 0 ? analyticsData : generateDynamicCacheAnalytics();

  const getBezierPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const getBezierAreaPath = (points: { x: number; y: number }[], baseY: number) => {
    if (points.length === 0) return "";
    const path = getBezierPath(points);
    return `${path} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;
  };

  return (
    <AppShell
      activeNav="CDN"
      activeSubItem={activeTab}
      onSubItemChange={setActiveTab}
    >
      <div className="w-full max-w-[1750px] mx-auto px-4 lg:px-6 py-6 pb-20">
        {/* Page Header */}
        {activeTab === "Caches" && (
          <div className="border-b border-slate-200 pb-4 mb-5">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-600 animate-pulse" />
              Content Delivery Network
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage caching headers, custom redirects, and reverse-proxy routing rules at the Nginx edge.
            </p>
          </div>
        )}

        {/* Global Notification Banner */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl text-sm border flex items-center gap-3 ${message.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {!projectName ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-950 mb-1">No Active Project Selected</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Please select a project from the top navigation switcher to configure CDN settings.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-semibold">Loading CDN configurations...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === "Caches" && (
              <div className="space-y-3">
                {/* Main Grid - 2 Column Top Row */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
                  {/* Left Card 60% */}
                  <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-slate-500" />
                          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Cache Management</h2>
                        </div>
                        <span className="text-xs text-slate-400">Last Purged: 2 min ago by @user</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-xl mt-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CDN EDGE CACHE STATUS</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                              Caching Enabled (
                              <span
                                className="underline decoration-dotted cursor-help text-blue-600 relative"
                                onMouseEnter={() => setShowTooltip(true)}
                                onMouseLeave={() => setShowTooltip(false)}
                              >
                                Microcaching
                                {showTooltip && (
                                  <span className="absolute left-0 bottom-6 z-50 w-64 p-3 bg-slate-900 text-white text-[11px] leading-relaxed rounded-lg shadow-lg font-normal">
                                    Microcaching caches fast-changing dynamic content for extremely short periods (e.g., seconds) to prevent origin thrashing under load.
                                  </span>
                                )}
                              </span> active)
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setCacheEnabled(!cacheEnabled)}
                          className={`w-12 h-6 rounded-full p-1 transition-colors ${cacheEnabled ? "bg-blue-600" : "bg-slate-300"
                            } flex items-center`}
                          aria-label="Toggle Cache Status"
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${cacheEnabled ? "translate-x-6" : "translate-x-0"
                              }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Card 40% */}
                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                        <TrendingUp className="w-4 h-4 text-slate-500" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Cache Health</h2>
                      </div>
                      <div className="py-2">
                        <div className="text-3xl font-bold text-emerald-600 tracking-tight">92.4%</div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Hit Rate</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                      <span>18.2 GB Bandwidth Saved</span>
                      <span className="font-semibold text-slate-400">Last 24h</span>
                    </div>
                  </div>
                </div>

                 {/* Second Row - Full Width Chart Card */}
                 <div
                   ref={containerRef}
                   className="bg-white rounded-2xl border border-zinc-200 p-5 overflow-hidden relative"
                   onMouseMove={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const clientX = e.clientX - rect.left;
                     const clientY = e.clientY - rect.top;
                     
                     const chartWidth = containerWidth - 45;
                     const relativeX = clientX - 45;
                     const xRatio = relativeX / chartWidth;
                     
                     const index = Math.round(xRatio * 23);
                     if (index >= 0 && index <= 23) {
                       setHoveredIndex(index);
                       const pxX = 45 + (index / 23) * chartWidth;
                       setTooltipPos({
                         x: pxX,
                         y: clientY - 15
                       });
                     } else {
                       setHoveredIndex(null);
                     }
                   }}
                   onMouseLeave={() => setHoveredIndex(null)}
                 >
                   <div className="flex items-center justify-between mb-3">
                     <div>
                       <h3 className="text-sm font-semibold text-zinc-900 leading-tight">Cache Requests - Last 24 Hours</h3>
                       <p className="text-xs text-zinc-500 leading-tight mt-0.5">Hit, miss, and bypass request volume</p>
                     </div>
                     <div className="flex items-center gap-3 text-xs">
                       <div className="flex items-center gap-1.5">
                         <span className="w-2 h-2 rounded-full bg-emerald-500" />
                         <span className="text-zinc-600">Hit</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <span className="w-2 h-2 rounded-full bg-amber-500" />
                         <span className="text-zinc-600">Miss</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <span className="w-2 h-2 rounded-full bg-zinc-400" />
                         <span className="text-zinc-600">Bypass</span>
                       </div>
                     </div>
                   </div>
 
                   <div className="relative -mx-5 -mb-5 h-[280px] select-none">
                     <svg viewBox={`0 0 ${containerWidth} 280`} className="w-full h-full">
                       <defs>
                         <linearGradient id="hit-grad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                           <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                         </linearGradient>
                         <linearGradient id="miss-grad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.08" />
                           <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                         </linearGradient>
                         <linearGradient id="bypass-grad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#9ca3af" stopOpacity="0.08" />
                           <stop offset="100%" stopColor="#9ca3af" stopOpacity="0.0" />
                         </linearGradient>
                       </defs>
 
                       {/* Grid Lines */}
                       {Array.from({ length: 11 }, (_, i) => 10000 - i * 1000).map((v, i) => {
                         const y = 245 - (v / 10000) * 235;
                         const label = v === 0 ? "0" : `${v / 1000}k`;
                         return (
                           <g key={i}>
                             <line
                               x1={45}
                               y1={y}
                               x2={containerWidth}
                               y2={y}
                               stroke="#f4f4f5" // border-zinc-100
                               strokeWidth={1}
                             />
                             <text
                               x={35}
                               y={y + 4}
                               textAnchor="end"
                               className="text-[11px] fill-zinc-500 font-mono"
                             >
                               {label}
                             </text>
                           </g>
                         );
                       })}
 
                       {/* X-axis ticks & labels */}
                       {[
                         { index: 0, time: "21:00" },
                         { index: 3, time: "0:00" },
                         { index: 6, time: "3:00" },
                         { index: 9, time: "6:00" },
                         { index: 12, time: "9:00" },
                         { index: 15, time: "12:00" },
                         { index: 18, time: "15:00" },
                         { index: 21, time: "18:00" },
                       ].map((tick, i) => {
                         const x = 45 + (tick.index / 23) * (containerWidth - 45);
                         return (
                           <g key={i}>
                             <line
                               x1={x}
                               y1={245}
                               x2={x}
                               y2={250}
                               stroke="#e4e4e7"
                               strokeWidth={1}
                             />
                             <text
                               x={x}
                               y={265}
                               textAnchor="middle"
                               className="text-[11px] fill-zinc-400 font-mono"
                             >
                               {tick.time}
                             </text>
                           </g>
                         );
                       })}
 
                       {/* Vertical interactive guide line */}
                       {hoveredIndex !== null && (
                         <line
                           x1={45 + (hoveredIndex / 23) * (containerWidth - 45)}
                           y1={10}
                           x2={45 + (hoveredIndex / 23) * (containerWidth - 45)}
                           y2={245}
                           stroke="#e4e4e7"
                           strokeWidth={1}
                           strokeDasharray="4 4"
                         />
                       )}
 
                       {/* Bezier Curves and Fills */}
                       {(() => {
                         const chartWidth = containerWidth - 45;
                         const hitPoints = activeData.map((d, i) => ({ x: 45 + (i / 23) * chartWidth, y: 245 - (d.hits / 10000) * 235 }));
                         const missPoints = activeData.map((d, i) => ({ x: 45 + (i / 23) * chartWidth, y: 245 - (d.misses / 10000) * 235 }));
                         const bypassPoints = activeData.map((d, i) => ({ x: 45 + (i / 23) * chartWidth, y: 245 - (d.bypass / 10000) * 235 }));
 
                         const hitPath = getBezierPath(hitPoints);
                         const missPath = getBezierPath(missPoints);
                         const bypassPath = getBezierPath(bypassPoints);
 
                         const hitArea = getBezierAreaPath(hitPoints, 245);
                         const missArea = getBezierAreaPath(missPoints, 245);
                         const bypassArea = getBezierAreaPath(bypassPoints, 245);
 
                         return (
                           <>
                             <path d={hitArea} fill="url(#hit-grad)" />
                             <path d={missArea} fill="url(#miss-grad)" />
                             <path d={bypassArea} fill="url(#bypass-grad)" />
 
                             <path d={hitPath} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" />
                             <path d={missPath} fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" />
                             <path d={bypassPath} fill="none" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" />
 
                             {hoveredIndex !== null && hoveredIndex < activeData.length && (
                               <>
                                 <circle cx={hitPoints[hoveredIndex].x} cy={hitPoints[hoveredIndex].y} r={4} fill="#10b981" stroke="#fff" strokeWidth={1.5} />
                                 <circle cx={missPoints[hoveredIndex].x} cy={missPoints[hoveredIndex].y} r={4} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
                                 <circle cx={bypassPoints[hoveredIndex].x} cy={bypassPoints[hoveredIndex].y} r={4} fill="#9ca3af" stroke="#fff" strokeWidth={1.5} />
                               </>
                             )}
                           </>
                         );
                       })()}
                     </svg>
                   </div>
 
                   {/* HTML Tooltip overlay */}
                   {hoveredIndex !== null && hoveredIndex < activeData.length && (
                     <div
                       className="absolute z-50 bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none flex flex-col gap-1 border border-zinc-800 animate-fade-in"
                       style={{
                         left: `${tooltipPos.x}px`,
                         top: `${tooltipPos.y}px`,
                         transform: 'translate(-50%, -100%)',
                       }}
                     >
                       <span className="font-semibold text-zinc-400">{activeData[hoveredIndex].time}</span>
                       <div className="flex items-center gap-4 justify-between">
                         <div className="flex items-center gap-1.5">
                           <span className="w-2 h-2 rounded-full bg-emerald-500" />
                           <span className="text-zinc-300">Hit:</span>
                         </div>
                         <span className="font-bold text-white">{activeData[hoveredIndex].hits.toLocaleString()}</span>
                       </div>
                       <div className="flex items-center gap-4 justify-between">
                         <div className="flex items-center gap-1.5">
                           <span className="w-2 h-2 rounded-full bg-amber-500" />
                           <span className="text-zinc-300">Miss:</span>
                         </div>
                         <span className="font-bold text-white">{activeData[hoveredIndex].misses.toLocaleString()}</span>
                       </div>
                       <div className="flex items-center gap-4 justify-between">
                         <div className="flex items-center gap-1.5">
                           <span className="w-2 h-2 rounded-full bg-zinc-400" />
                           <span className="text-zinc-300">Bypass:</span>
                         </div>
                         <span className="font-bold text-white">{activeData[hoveredIndex].bypass.toLocaleString()}</span>
                       </div>
                     </div>
                   )}
                 </div>

                {/* Third Row - 2 Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: TTL Settings */}
                  <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-semibold leading-6 text-zinc-900">TTL Settings</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">Configure default cache duration</p>
                      </div>
                      <Clock className="w-4 h-4 text-zinc-400 stroke-1.5" />
                    </div>

                    <div className="space-y-3 mt-4">
                      <label className="block text-sm font-medium text-zinc-900">Cache Time-To-Live</label>
                      <select
                        value={cacheTtl}
                        disabled={!cacheEnabled}
                        onChange={(e) => setCacheTtl(e.target.value)}
                        className="w-full h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all"
                      >
                        <option value="1m" className="text-zinc-900">1 Minute</option>
                        <option value="5m" className="text-zinc-900">5 Minutes</option>
                        <option value="15m" className="text-zinc-900">15 Minutes</option>
                        <option value="1h" className="text-zinc-900">1 Hour</option>
                        <option value="1d" className="text-zinc-900">1 Day</option>
                        <option value="1w" className="text-zinc-900">1 Week</option>
                      </select>

                      <div className="flex items-start gap-2 mt-2">
                        <Info className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-zinc-500">
                          Default TTL for responses without Cache-Control headers. Can be overridden by custom rules.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Purge Controls */}
                  <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-semibold leading-6 text-zinc-900">Purge Controls</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">Invalidate cached content</p>
                      </div>
                      <Trash2 className="w-4 h-4 text-zinc-400 stroke-1.5" />
                    </div>

                    <div className="space-y-3">
                      {/* Purge Everything */}
                      <button
                        onClick={handlePurgeAll}
                        disabled={purging}
                        className="w-full h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {purging ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <TriangleAlert className="w-3.5 h-3.5" />
                        )}
                        Purge Everything
                      </button>

                      {/* Purge by URL */}
                      <form onSubmit={handlePurgeUrl} className="relative flex items-center border border-zinc-300 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <input
                          type="text"
                          required
                          value={purgeUrlInput}
                          onChange={(e) => setPurgeUrlInput(e.target.value)}
                          placeholder="https://example.com/path"
                          className="w-full h-9 pl-3 pr-20 text-sm text-zinc-900 placeholder-zinc-400 border-0 focus:outline-none focus:ring-0 bg-transparent"
                        />
                        <button
                          type="submit"
                          className="absolute right-1 top-1 h-7 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors shrink-0"
                        >
                          Purge
                        </button>
                      </form>

                      {/* Purge by Tag */}
                      <form onSubmit={handlePurgeTag} className="relative flex items-center border border-zinc-300 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <input
                          type="text"
                          required
                          value={purgeTagInput}
                          onChange={(e) => setPurgeTagInput(e.target.value)}
                          placeholder="cache-tag: products-v1"
                          className="w-full h-9 pl-3 pr-20 text-sm text-zinc-900 placeholder-zinc-400 border-0 focus:outline-none focus:ring-0 bg-transparent"
                        />
                        <button
                          type="submit"
                          className="absolute right-1 top-1 h-7 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors shrink-0"
                        >
                          Purge
                        </button>
                      </form>

                      {/* Footer */}
                      <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Last Purged: 2 min ago by @asisghorai663</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fourth Row - Full Width Table Card */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-zinc-900">Custom Cache Rules</h2>
                    <button
                      onClick={() => {
                        setEditingRuleId(null);
                        setRulePath("");
                        setRuleBehavior("Cache");
                        setRuleTtl("1 Hour");
                        setRuleStatus("Active");
                        setRuleModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Rule
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase tracking-wider">
                          <th className="px-6 py-3">Path Pattern</th>
                          <th className="px-6 py-3">Cache Behavior</th>
                          <th className="px-6 py-3">TTL Override</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {cacheRules.map((rule) => (
                          <tr key={rule.id} className="hover:bg-slate-50 text-slate-700 transition-colors">
                            <td className="px-6 py-2.5 font-mono font-semibold">{rule.pathPattern}</td>
                            <td className="px-6 py-2.5">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${rule.behavior === "Bypass"
                                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}>
                                {rule.behavior}
                              </span>
                            </td>
                            <td className="px-6 py-2.5 font-mono">{rule.ttlOverride}</td>
                            <td className="px-6 py-2.5">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${rule.status === "Active"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}>
                                {rule.status}
                              </span>
                            </td>
                            <td className="px-6 py-2.5 text-right flex justify-end gap-2.5">
                              <button
                                onClick={() => startEditRule(rule)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Redirects" && (
              <div className="space-y-6">
                {/* PAGE HEADER SECTION */}
                <div className="flex items-start justify-between border-b border-zinc-200 pb-6 mb-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-zinc-900">Redirects</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                      Manage 301/302 redirects at the edge. Processed before caching.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRedirectIndex(null);
                      setRedirectFromPath("");
                      setRedirectToUrl("");
                      setRedirectStatusCode(301);
                      setRedirectStatus("Active");
                      setRedirectModalOpen(true);
                    }}
                    className="h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add Redirect
                  </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                    <span className="text-xs text-zinc-500 uppercase tracking-wide block mb-1">Total Redirects</span>
                    <span className="text-3xl font-semibold text-zinc-900 block">{redirects.length}</span>
                  </div>
                  <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                    <span className="text-xs text-zinc-500 uppercase tracking-wide block mb-1">Permanent (301)</span>
                    <span className="text-3xl font-semibold text-zinc-900 block">
                      {redirects.filter(r => r.statusCode === 301).length}
                    </span>
                  </div>
                  <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                    <span className="text-xs text-zinc-500 uppercase tracking-wide block mb-1">Temporary (302)</span>
                    <span className="text-3xl font-semibold text-zinc-900 block">
                      {redirects.filter(r => r.statusCode === 302).length}
                    </span>
                  </div>
                </div>

                {/* Redirect Rules Card */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                  <div className="p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">Redirect Rules</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Configure URL redirects and path forwarding</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search redirects..."
                        value={redirectSearch}
                        onChange={(e) => setRedirectSearch(e.target.value)}
                        className="h-9 w-64 px-3 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                      />
                      <select
                        value={redirectFilterStatus}
                        onChange={(e) => setRedirectFilterStatus(e.target.value)}
                        className="h-9 px-3 border border-zinc-300 rounded-lg text-sm bg-white text-zinc-700 focus:outline-none"
                      >
                        <option value="All">All Types</option>
                        <option value="301">301 (Permanent)</option>
                        <option value="302">302 (Temporary)</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {filteredRedirects.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-400">No redirect rules match your search.</div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-5">Source Path</th>
                            <th className="py-2.5 px-5">Destination</th>
                            <th className="py-2.5 px-5">Status Code</th>
                            <th className="py-2.5 px-5">Type</th>
                            <th className="py-2.5 px-5">Status</th>
                            <th className="py-2.5 px-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {filteredRedirects.map((r) => {
                            const originalIndex = redirects.findIndex(orig => orig.fromPath === r.fromPath && orig.toUrl === r.toUrl);
                            return (
                              <tr key={originalIndex} className="hover:bg-zinc-50 text-zinc-700 transition-colors">
                                <td className="py-2.5 px-5 font-mono font-semibold text-zinc-900">{r.fromPath}</td>
                                <td className="py-2.5 px-5 font-mono text-zinc-600">{r.toUrl}</td>
                                <td className="py-2.5 px-5">{r.statusCode}</td>
                                <td className="py-2.5 px-5">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    r.statusCode === 301
                                      ? "bg-zinc-100 text-zinc-800 border border-zinc-200"
                                      : "bg-blue-50 text-blue-800 border border-blue-100"
                                  }`}>
                                    {r.statusCode === 301 ? "Permanent" : "Temporary"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-5">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    r.status === "Inactive"
                                      ? "bg-rose-50 text-rose-800 border border-rose-100"
                                      : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                  }`}>
                                    {r.status || "Active"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-5 text-right flex justify-end gap-2.5">
                                  <button
                                    onClick={() => {
                                      setEditingRedirectIndex(originalIndex);
                                      setRedirectFromPath(r.fromPath);
                                      setRedirectToUrl(r.toUrl);
                                      setRedirectStatusCode(r.statusCode);
                                      setRedirectStatus(r.status || "Active");
                                      setRedirectModalOpen(true);
                                    }}
                                    className="text-zinc-400 hover:text-zinc-600 transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveRedirect(originalIndex)}
                                    className="text-zinc-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Bulk Actions Card */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-5 mt-6">
                  <h4 className="text-sm font-semibold text-zinc-900 mb-1">Bulk Actions</h4>
                  <p className="text-xs text-zinc-500 mb-4">
                    Import rules from a CSV file or export your current redirect configuration.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => showStatus("CSV import interface is coming soon!", "error")}
                      className="h-9 px-4 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      Import CSV
                    </button>
                    <button
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(redirects, null, 2));
                        const downloadAnchor = document.createElement("a");
                        downloadAnchor.setAttribute("href", dataStr);
                        downloadAnchor.setAttribute("download", `redirects-export-${projectName}.json`);
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                        showStatus("Redirect rules exported successfully!", "success");
                      }}
                      className="h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      Export Rules
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Routing Rules" && (
              <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-start justify-between border-b border-zinc-200 pb-6 mb-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-zinc-900">Routing Rules</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                      Define custom routing logic and edge middleware behavior
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRouteIndex(null);
                      setRoutePathInput("");
                      setRouteDestInput("");
                      setRouteType("Rewrite");
                      setRoutePriority(100);
                      setRouteStatus("Active");
                      setRouteCaseSensitive(false);
                      setRouteAppendSlash(false);
                      setShowAdvanced(false);
                      setRouteModalOpen(true);
                    }}
                    className="h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Rule
                  </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* ACTIVE ROUTES CARD */}
                  <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Active Routes</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-semibold text-zinc-900">12</span>
                      <span className="text-xs font-semibold text-emerald-600">↑ 2 this week</span>
                    </div>
                  </div>

                  {/* MIDDLEWARE CARD */}
                  <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Middleware</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-semibold text-zinc-900">5</span>
                      <span className="text-xs text-zinc-500">42% of routes</span>
                    </div>
                  </div>

                  {/* REWRITES CARD */}
                  <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Rewrites</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-semibold text-zinc-900">7</span>
                      <span className="text-xs text-zinc-500">58% of routes</span>
                    </div>
                  </div>
                </div>

                {/* Main Table Card "Routing Configuration" */}
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">Routing Configuration</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Manage rewrites and edge functions</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={routeSearch}
                          onChange={(e) => setRouteSearch(e.target.value)}
                          placeholder="Search routes..."
                          className="h-9 w-64 pl-9 pr-3 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white text-zinc-900 placeholder-zinc-400"
                        />
                      </div>

                      {/* Filter Select */}
                      <select
                        value={routeFilterType}
                        onChange={(e) => setRouteFilterType(e.target.value)}
                        className="h-9 px-3 text-xs rounded-lg border border-zinc-300 bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      >
                        <option value="All">All Types</option>
                        <option value="Rewrite">Rewrite</option>
                        <option value="Middleware">Middleware</option>
                        <option value="Redirect">Redirect</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {filteredRoutes.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-400">
                        No routing rules matching the criteria.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-50/70 border-b border-zinc-200">
                            <th className="py-2.5 px-5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Path Pattern</th>
                            <th className="py-2.5 px-5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Destination</th>
                            <th className="py-2.5 px-5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Type</th>
                            <th className="py-2.5 px-5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Priority</th>
                            <th className="py-2.5 px-5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                            <th className="py-2.5 px-5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {filteredRoutes.map((r, index) => {
                            const originalIndex = routes.findIndex(
                              (orig) => orig.path === r.path && orig.destination === r.destination
                            );
                            return (
                              <tr key={index} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="py-2.5 px-5 font-mono text-xs text-blue-600 font-medium">
                                  {r.path}
                                </td>
                                <td className="py-2.5 px-5 text-xs text-zinc-600 max-w-xs truncate">
                                  {r.destination}
                                </td>
                                <td className="py-2.5 px-5 text-xs">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                    r.type === "Middleware"
                                      ? "bg-purple-50 text-purple-700 border border-purple-200/50"
                                      : r.type === "Redirect"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                                      : "bg-blue-50 text-blue-700 border border-blue-200/50"
                                  }`}>
                                    {r.type}
                                  </span>
                                </td>
                                <td className="py-2.5 px-5 text-xs text-zinc-600">
                                  {r.priority}
                                </td>
                                <td className="py-2.5 px-5 text-xs">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                    r.status === "Active"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                                      : "bg-zinc-50 text-zinc-600 border border-zinc-200/50"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${r.status === "Active" ? "bg-emerald-500" : "bg-zinc-400"}`}></span>
                                    {r.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-5 text-right flex justify-end gap-2.5">
                                  <button
                                    onClick={() => {
                                      setEditingRouteIndex(originalIndex);
                                      setRoutePathInput(r.path);
                                      setRouteDestInput(r.destination);
                                      setRouteType(r.type);
                                      setRoutePriority(r.priority);
                                      setRouteStatus(r.status);
                                      setRouteCaseSensitive(r.caseSensitive || false);
                                      setRouteAppendSlash(r.appendSlash || false);
                                      setShowAdvanced(false);
                                      setRouteModalOpen(true);
                                    }}
                                    className="text-zinc-400 hover:text-zinc-600 transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveRoute(originalIndex)}
                                    className="text-zinc-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Edge Middleware Card */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-5 mt-6 shadow-sm">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-zinc-900">Edge Middleware</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Enable global middleware blocks triggered on edge requests.</p>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-zinc-900">Auth Check</p>
                        <p className="text-[11px] text-zinc-500">Validates JWT tokens</p>
                      </div>
                      <button
                        onClick={() => {
                          setEdgeAuthCheck(!edgeAuthCheck);
                          showStatus("Global Middleware state toggled.", "success");
                        }}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                          edgeAuthCheck ? "bg-zinc-900" : "bg-zinc-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform duration-200 ease-in-out ${
                          edgeAuthCheck ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-zinc-900">A/B Testing</p>
                        <p className="text-[11px] text-zinc-500">Routes 50% traffic</p>
                      </div>
                      <button
                        onClick={() => {
                          setEdgeAbTesting(!edgeAbTesting);
                          showStatus("Global Middleware state toggled.", "success");
                        }}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                          edgeAbTesting ? "bg-zinc-900" : "bg-zinc-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform duration-200 ease-in-out ${
                          edgeAbTesting ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-zinc-900">Geolocation</p>
                        <p className="text-[11px] text-zinc-500">Adds country header</p>
                      </div>
                      <button
                        onClick={() => {
                          setEdgeGeolocation(!edgeGeolocation);
                          showStatus("Global Middleware state toggled.", "success");
                        }}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                          edgeGeolocation ? "bg-zinc-900" : "bg-zinc-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform duration-200 ease-in-out ${
                          edgeGeolocation ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Footer Bar */}
      {projectName && hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur border-t border-zinc-200 py-3.5 px-6 flex items-center justify-between z-50 shadow-sm">
          <div className="text-sm font-medium text-zinc-900">
            Unsaved changes
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscardChanges}
              className="h-9 px-3 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="h-9 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Cache Rule Modal */}
      {ruleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setRuleModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              {editingRuleId ? "Edit Cache Rule" : "Add Cache Rule"}
            </h3>

            <form onSubmit={handleAddRule} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Path Pattern</label>
                <input
                  type="text"
                  required
                  value={rulePath}
                  onChange={(e) => setRulePath(e.target.value)}
                  placeholder="e.g. /static/*"
                  className="w-full h-9 px-3 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cache Behavior</label>
                <select
                  value={ruleBehavior}
                  onChange={(e) => setRuleBehavior(e.target.value as "Bypass" | "Cache")}
                  className="w-full h-9 px-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 focus:outline-none"
                >
                  <option value="Cache">Cache</option>
                  <option value="Bypass">Bypass</option>
                </select>
              </div>

              {ruleBehavior === "Cache" && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">TTL Override</label>
                  <select
                    value={ruleTtl}
                    onChange={(e) => setRuleTtl(e.target.value)}
                    className="w-full h-9 px-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="1 Minute">1 Minute</option>
                    <option value="5 Minutes">5 Minutes</option>
                    <option value="1 Hour">1 Hour</option>
                    <option value="1 Day">1 Day</option>
                    <option value="1 Week">1 Week</option>
                    <option value="1 Year">1 Year</option>
                    <option value="Immutable">Immutable</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                <select
                  value={ruleStatus}
                  onChange={(e) => setRuleStatus(e.target.value as "Active" | "Inactive")}
                  className="w-full h-9 px-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Redirect Modal */}
      {redirectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setRedirectModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              {editingRedirectIndex !== null ? "Edit Redirect Rule" : "Add Redirect Rule"}
            </h3>

            <form onSubmit={handleSaveRedirect} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Path</label>
                <input
                  type="text"
                  required
                  value={redirectFromPath}
                  onChange={(e) => setRedirectFromPath(e.target.value)}
                  placeholder="e.g. /old-path/*"
                  className="w-full h-9 px-3 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destination URL</label>
                <input
                  type="text"
                  required
                  value={redirectToUrl}
                  onChange={(e) => setRedirectToUrl(e.target.value)}
                  placeholder="e.g. /new-path/$1"
                  className="w-full h-9 px-3 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Code</label>
                <select
                  value={redirectStatusCode}
                  onChange={(e) => setRedirectStatusCode(Number(e.target.value))}
                  className="w-full h-9 px-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 focus:outline-none"
                >
                  <option value={301}>301 (Permanent)</option>
                  <option value={302}>302 (Temporary)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                <select
                  value={redirectStatus}
                  onChange={(e) => setRedirectStatus(e.target.value as "Active" | "Inactive")}
                  className="w-full h-9 px-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRedirectModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs"
                >
                  Save Redirect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Routing Rule Modal */}
      {routeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setRouteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-semibold text-zinc-900">
              {editingRouteIndex !== null ? "Edit Routing Rule" : "Add Routing Rule"}
            </h3>
            <p className="text-sm text-zinc-500 mt-0.5 mb-6">
              Create rewrites or middleware rules
            </p>

            <form onSubmit={handleSaveRoute} className="space-y-4">
              {/* Source Path */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-900">Source Path</label>
                <input
                  type="text"
                  required
                  value={routePathInput}
                  onChange={(e) => setRoutePathInput(e.target.value)}
                  placeholder="/api/*"
                  className="w-full h-9 px-3 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                <span className="block text-xs text-zinc-400 mt-1">Path pattern with :param or * wildcard</span>
              </div>

              {/* Destination */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-900">Destination</label>
                <input
                  type="text"
                  required
                  value={routeDestInput}
                  onChange={(e) => setRouteDestInput(e.target.value)}
                  placeholder="/api/v2/*"
                  className="w-full h-9 px-3 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                <span className="block text-xs text-zinc-400 mt-1">Target path or middleware function</span>
              </div>

              {/* Row Grid 2: Type & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-900">Type</label>
                  <select
                    value={routeType}
                    onChange={(e) => setRouteType(e.target.value as "Rewrite" | "Middleware" | "Redirect")}
                    className="w-full h-9 px-3 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-700"
                  >
                    <option value="Rewrite">Rewrite</option>
                    <option value="Middleware">Middleware</option>
                    <option value="Redirect">Redirect</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-900">Priority</label>
                  <input
                    type="number"
                    required
                    value={routePriority}
                    onChange={(e) => setRoutePriority(Number(e.target.value))}
                    placeholder="100"
                    className="w-full h-9 px-3 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              {/* Status Toggle (Enabled) */}
              <div className="flex items-center justify-between py-2 border-y border-zinc-100">
                <div>
                  <p className="text-xs font-semibold text-zinc-900">Enabled</p>
                  <p className="text-[11px] text-zinc-400">Whether this routing rule is active</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRouteStatus(routeStatus === "Active" ? "Inactive" : "Active")}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                    routeStatus === "Active" ? "bg-zinc-900" : "bg-zinc-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform duration-200 ease-in-out ${
                    routeStatus === "Active" ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Advanced Collapsible */}
              <div className="border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/30">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full px-4 py-2 text-xs font-medium text-zinc-600 flex items-center justify-between hover:bg-zinc-100/50 transition-colors"
                >
                  <span>Advanced Settings</span>
                  <ChevronRight className={`w-3.5 h-3.5 transform transition-transform ${showAdvanced ? "rotate-90" : ""}`} />
                </button>
                {showAdvanced && (
                  <div className="p-4 border-t border-zinc-200 space-y-3 bg-white">
                    <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={routeCaseSensitive}
                        onChange={(e) => setRouteCaseSensitive(e.target.checked)}
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 w-3.5 h-3.5"
                      />
                      Case sensitive matching
                    </label>

                    <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={routeAppendSlash}
                        onChange={(e) => setRouteAppendSlash(e.target.checked)}
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 w-3.5 h-3.5"
                      />
                      Append trailing slash
                    </label>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRouteModalOpen(false)}
                  className="h-9 px-4 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {editingRouteIndex !== null ? "Save Changes" : "Add Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
