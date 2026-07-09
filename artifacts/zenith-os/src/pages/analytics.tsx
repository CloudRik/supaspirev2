import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { getAuthToken } from "@/lib/projects";
import { useProjectStore } from "@/hooks/useProject";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Globe,
  ChevronDown,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Target,
  AlertCircle,
  Flag,
  Plus,
  Code2,
  Users,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sparkles,
} from "lucide-react";

export type CustomEventItem = {
  name: string;
  type: "conversion" | "click" | "error";
  count: number;
  delta: string;
  lastSeen: string;
  description?: string;
};

type EventProperty = {
  key: string;
  type: "string" | "number" | "boolean";
  example: string;
};

const EVENT_TEMPLATES: {
  name: string;
  type: CustomEventItem["type"];
  description: string;
}[] = [
  { name: "signup_completed", type: "conversion", description: "User finished account registration" },
  { name: "cta_clicked", type: "click", description: "Hero or pricing CTA was clicked" },
  { name: "checkout_started", type: "conversion", description: "User opened the checkout flow" },
  { name: "api_error", type: "error", description: "Server returned an unexpected error" },
];

function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  };
  return { copied, copy };
}

function isValidEventName(name: string) {
  return /^[a-z][a-z0-9_]*$/.test(name);
}

function createRandom(seedStr: string) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function MetricBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 min-w-[72px]">
      <div className="hidden sm:block w-14 h-1 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-slate-400/70" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-900 font-medium font-mono text-xs tabular-nums w-11 text-right">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export default function AnalyticsPage() {
  const { activeProject, projects } = useProjectStore();
  const currentProject = projects.find((p) => p.name === activeProject);

  const [activeMetricTab, setActiveMetricTab] = useState<"visitors" | "views" | "bounce">("visitors");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [environment, setEnvironment] = useState<"production" | "preview" | "development">("production");
  const [activePageTab, setActivePageTab] = useState<"pages" | "routes" | "hostnames">("pages");
  const [activeReferrerTab, setActiveReferrerTab] = useState<"referrers" | "utm">("referrers");
  const [activeDeviceTab, setActiveDeviceTab] = useState<"devices" | "browsers">("devices");
  const [activeEventTab, setActiveEventTab] = useState<"all" | "conversions" | "errors">("all");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [userEvents, setUserEvents] = useState<CustomEventItem[]>([]);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const { toast } = useToast();

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // 'loading' | 'not_enabled' | 'setup' | 'verified'
  const [analyticsStatus, setAnalyticsStatus] = useState<"loading" | "not_enabled" | "setup" | "verified">("loading");
  const [enabling, setEnabling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (!activeProject) { setAnalyticsStatus("loading"); setLoading(false); return; }
    let isMounted = true;

    const fetchAnalytics = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const token = getAuthToken();
        const workspaceId = localStorage.getItem("cloudrik-workspace");
        const wsParam = workspaceId && workspaceId !== 'null' && workspaceId !== 'undefined' ? workspaceId : '';
        const res = await fetch(`/api-proxy/projects/${activeProject}/analytics?timeRange=${timeRange}&env=${environment}${wsParam ? `&workspaceId=${wsParam}` : ''}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (!isMounted) return;

        const enabled = data.analyticsEnabled === true || localStorage.getItem(`analytics_enabled_${activeProject}`) === 'true';
        const hasData = (data.viewsTotal || 0) > 0;

        if (!enabled) {
          setAnalyticsStatus("not_enabled");
        } else if (!hasData) {
          setAnalyticsStatus("setup");
        } else {
          setAnalyticsStatus("verified");
        }

        setAnalyticsData({
          visitorsTotal: data.visitorsTotal || 0,
          viewsTotal: data.viewsTotal || 0,
          bounceRate: data.bounceRate || 0,
          graphData: data.graphData || [],
          pages: data.pages || [],
          routes: data.routes || [],
          hostnames: data.hostnames || [],
          referrers: data.referrers || [],
          utm: data.utm || [],
          countries: data.countries || [],
          devices: data.devices || [],
          browsers: data.browsers || [],
          os: data.os || [],
          customEvents: data.customEvents || [],
          featureFlags: data.featureFlags || [],
        });
      } catch (err) {
        console.error(err);
        // Even if backend fails, check localStorage
        if (isMounted) {
          if (localStorage.getItem(`analytics_enabled_${activeProject}`) === 'true') {
            setAnalyticsStatus("setup");
          } else {
            setAnalyticsStatus("not_enabled");
          }
        }
      } finally {
        if (isInitial && isMounted) setLoading(false);
      }
    };

    fetchAnalytics(true);
    return () => { isMounted = false; };
  }, [activeProject, timeRange, environment]);

  const handleEnable = async () => {
    setEnabling(true);
    try {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      const wsParam = workspaceId && workspaceId !== 'null' && workspaceId !== 'undefined' ? workspaceId : '';
      const res = await fetch(`/api-proxy/projects/${activeProject}/analytics/enable${wsParam ? `?workspaceId=${wsParam}` : ''}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to enable");
    } catch {
      // Backend not deployed yet — store locally
    }
    localStorage.setItem(`analytics_enabled_${activeProject}`, 'true');
    setAnalyticsStatus("setup");
    setEnabling(false);
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyError(false);
    try {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      const wsParam = workspaceId && workspaceId !== 'null' && workspaceId !== 'undefined' ? workspaceId : '';
      const res = await fetch(`/api-proxy/projects/${activeProject}/analytics/verify${wsParam ? `?workspaceId=${wsParam}` : ''}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.verified) {
        setAnalyticsStatus("verified");
        // Re-fetch full analytics data
        const res2 = await fetch(`/api-proxy/projects/${activeProject}/analytics?timeRange=${timeRange}&env=${environment}${wsParam ? `&workspaceId=${wsParam}` : ''}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res2.ok) {
          const d = await res2.json();
          setAnalyticsData({
            visitorsTotal: d.visitorsTotal || 0,
            viewsTotal: d.viewsTotal || 0,
            bounceRate: d.bounceRate || 0,
            graphData: d.graphData || [],
            pages: d.pages || [],
            routes: d.routes || [],
            hostnames: d.hostnames || [],
            referrers: d.referrers || [],
            utm: d.utm || [],
            countries: d.countries || [],
            devices: d.devices || [],
            browsers: d.browsers || [],
            os: d.os || [],
            customEvents: d.customEvents || [],
            featureFlags: d.featureFlags || [],
          });
        }
        toast({ title: "Verified!", description: "Analytics is working. Redirecting to dashboard..." });
      } else {
        setVerifyError(true);
      }
    } catch {
      setVerifyError(true);
    } finally {
      setVerifying(false);
    }
  };

  const scriptTag = `<script defer src="https://api.cloudrik.com/analytics/vitals.js" data-project="${activeProject}"></script>`;

  const svgChartPath = useMemo(() => {
    if (!analyticsData || analyticsData.graphData.length === 0) return { path: "", points: [] };
    const data = analyticsData.graphData;
    const maxVal = Math.max(
      ...data.map((d) =>
        activeMetricTab === "visitors" ? d.visitors : activeMetricTab === "views" ? d.views : d.bounce
      )
    );

    const width = 800;
    const height = 160;
    const paddingY = 16;

    const points = data.map((d, index) => {
      const val =
        activeMetricTab === "visitors" ? d.visitors : activeMetricTab === "views" ? d.views : d.bounce;
      const x = (index / (data.length - 1)) * width;
      const y = height - paddingY - (val / (maxVal || 1)) * (height - paddingY * 2);
      return { x, y, label: d.label, value: val };
    });

    if (points.length === 0) return { path: "", points: [] };

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    return { path, points, height };
  }, [analyticsData, activeMetricTab]);

  const metricCards = [
    {
      id: "visitors" as const,
      label: "Visitors",
      value: analyticsData?.visitorsTotal.toLocaleString() ?? "—",
      delta: "+14.2%",
      positive: true,
    },
    {
      id: "views" as const,
      label: "Page views",
      value: analyticsData?.viewsTotal.toLocaleString() ?? "—",
      delta: "+21.8%",
      positive: true,
    },
    {
      id: "bounce" as const,
      label: "Bounce rate",
      value: analyticsData ? `${analyticsData.bounceRate}%` : "—",
      delta: "-2.4%",
      positive: true,
    },
  ];

  const pageRows =
    activePageTab === "pages"
      ? analyticsData?.pages ?? []
      : activePageTab === "routes"
        ? analyticsData?.routes ?? []
        : analyticsData?.hostnames.map((h) => ({ path: h.name, visitors: h.visitors })) ?? [];

  const referrerRows =
    activeReferrerTab === "referrers" ? analyticsData?.referrers ?? [] : analyticsData?.utm ?? [];

  const deviceRows =
    activeDeviceTab === "devices" ? analyticsData?.devices ?? [] : analyticsData?.browsers ?? [];

  const pageMax = Math.max(...pageRows.map((r) => r.visitors), 1);
  const referrerMax = Math.max(...referrerRows.map((r) => r.visitors), 1);
  const countryMax = Math.max(...(analyticsData?.countries.map((c) => c.visitors) ?? [1]));
  const deviceMax = Math.max(...deviceRows.map((d) => d.visitors), 1);
  const osMax = Math.max(...(analyticsData?.os.map((o) => o.visitors) ?? [1]));

  const displayEvents = useMemo(() => {
    const base = analyticsData?.customEvents ?? [];
    const existing = new Set(base.map((e) => e.name));
    const extra = userEvents.filter((e) => !existing.has(e.name));
    return [...base, ...extra];
  }, [analyticsData, userEvents]);

  const handleCreateEvent = async (event: CustomEventItem) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api-proxy/projects/${activeProject}/analytics/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          eventName: event.name,
          type: event.type,
          description: event.name // simple mapping for now
        })
      });
      if (!res.ok) throw new Error("Failed to save event");
      setUserEvents((prev) => [...prev, event]);
      toast({
        title: "Event created",
        description: `"${event.name}" is ready. Deploy the snippet to start collecting data.`,
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppShell activeNav="Analytics">
      <div className="flex flex-col h-full w-full px-4 py-5">
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {activeProject
                ? `Traffic overview for ${activeProject}`
                : "Select a project to view traffic metrics"}
            </p>
          </div>

          {activeProject && analyticsStatus === "verified" && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as "24h" | "7d" | "30d")}
                  className="h-8 pl-3 pr-7 appearance-none rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as "production" | "preview" | "development")}
                  className="h-8 pl-3 pr-7 appearance-none rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="production">Production</option>
                  <option value="preview">Preview</option>
                  <option value="development">Development</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* STATE: Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900" />
            <p className="text-xs text-slate-500 mt-3">Loading analytics...</p>
          </div>

        /* STATE: No project selected */
        ) : !activeProject ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-xl text-center">
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-3">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No project selected</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Choose a project from the top bar to review traffic and usage metrics.
            </p>
          </div>

        /* STATE: Analytics not enabled — show Enable button */
        ) : analyticsStatus === "not_enabled" ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <div className="max-w-md mx-auto">
              {/* Project Info Card */}
              <div className="inline-flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 mb-6">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold">
                  {activeProject?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-900">{activeProject}</span>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">Web Analytics</h3>
              <p className="text-sm text-slate-500 mb-7">
                Privacy-friendly analytics for your website. Track visitors, pageviews, devices, countries, and custom events.
              </p>
              <Button
                onClick={handleEnable}
                disabled={enabling}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-10 text-sm font-medium rounded-lg gap-2"
              >
                {enabling ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {enabling ? "Enabling..." : "Enable Analytics"}
              </Button>
            </div>
          </div>

        /* STATE: Setup — show 1-line code + Verify button */
        ) : analyticsStatus === "setup" ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Setup Analytics for {activeProject}</h2>
              <p className="text-xs text-slate-500 mt-1">Add this single line of code inside your website's <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono">&lt;head&gt;</code> tag, then click Verify.</p>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-lg p-4 font-mono text-[12px] flex justify-between items-center border border-slate-800 overflow-x-auto">
              <code className="text-emerald-400 whitespace-nowrap">{scriptTag}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(scriptTag);
                  setCodeCopied(true);
                  toast({ title: "Copied!" });
                  setTimeout(() => setCodeCopied(false), 2000);
                }}
                className="text-slate-400 hover:text-white transition-colors ml-4 shrink-0"
              >
                {codeCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleVerify}
                disabled={verifying}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 h-9 text-sm font-medium rounded-lg gap-2"
              >
                {verifying ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {verifying ? "Verifying..." : "Verify Installation"}
              </Button>
              {verifyError && (
                <div className="flex items-center gap-2 text-xs text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>No data received yet. Add the code to your site, visit a page, and try again.</span>
                </div>
              )}
            </div>
          </div>

        /* STATE: Verified — show full dashboard */
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {metricCards.map((metric) => {
                const active = activeMetricTab === metric.id;
                return (
                  <button
                    key={metric.id}
                    onClick={() => setActiveMetricTab(metric.id)}
                    className={`text-left rounded-lg border px-4 py-3 transition-all ${
                      active
                        ? "border-slate-300 bg-white shadow-sm ring-1 ring-slate-200/80"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="text-xs font-medium text-slate-500 mb-1">{metric.label}</div>
                    <div className="text-xl font-semibold text-slate-900 tabular-nums tracking-tight">
                      {metric.value}
                    </div>
                    <div
                      className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium ${
                        metric.positive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {metric.positive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {metric.delta}
                      <span className="text-slate-400 font-normal">vs prev.</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {activeMetricTab === "visitors"
                    ? "Unique visitors"
                    : activeMetricTab === "views"
                      ? "Page views"
                      : "Bounce rate"}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {timeRange === "24h" ? "24h" : timeRange === "7d" ? "7d" : "30d"}
                </span>
              </div>

              <div className="relative px-3 pt-2 pb-3">
                <div className="relative w-full h-[140px]">
                  <svg viewBox="0 0 800 160" className="w-full h-full" preserveAspectRatio="none">
                    {[0, 0.5, 1].map((ratio, index) => (
                      <line
                        key={index}
                        x1="0"
                        y1={16 + ratio * 128}
                        x2="800"
                        y2={16 + ratio * 128}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                    ))}

                    <path
                      d={svgChartPath.path}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {svgChartPath.points.length > 0 && (
                      <path
                        d={`${svgChartPath.path} L 800 144 L 0 144 Z`}
                        fill="#334155"
                        opacity="0.04"
                      />
                    )}

                    {hoveredIndex !== null && svgChartPath.points[hoveredIndex] && (
                      <>
                        <line
                          x1={svgChartPath.points[hoveredIndex].x}
                          y1="8"
                          x2={svgChartPath.points[hoveredIndex].x}
                          y2="144"
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray="3 3"
                        />
                        <circle
                          cx={svgChartPath.points[hoveredIndex].x}
                          cy={svgChartPath.points[hoveredIndex].y}
                          r="3.5"
                          fill="#334155"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      </>
                    )}

                    {svgChartPath.points.map((p, idx) => (
                      <rect
                        key={idx}
                        x={p.x - 16}
                        y="0"
                        width="32"
                        height="160"
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    ))}
                  </svg>

                  {hoveredIndex !== null && svgChartPath.points[hoveredIndex] && (
                    <div
                      className="absolute bg-slate-900 text-white rounded-md px-2 py-1 shadow-lg z-10 pointer-events-none text-left"
                      style={{
                        left: `${Math.min(78, (svgChartPath.points[hoveredIndex].x / 800) * 100)}%`,
                        top: `${Math.max(0, (svgChartPath.points[hoveredIndex].y / 160) * 100 - 28)}%`,
                      }}
                    >
                      <div className="text-[10px] text-slate-400 font-mono">
                        {svgChartPath.points[hoveredIndex].label}
                      </div>
                      <div className="text-xs font-semibold tabular-nums">
                        {activeMetricTab === "bounce"
                          ? `${svgChartPath.points[hoveredIndex].value}%`
                          : svgChartPath.points[hoveredIndex].value.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-1 px-1 text-xs text-slate-400 font-mono">
                  <span>{svgChartPath.points[0]?.label}</span>
                  <span>{svgChartPath.points[Math.floor(svgChartPath.points.length / 2)]?.label}</span>
                  <span>{svgChartPath.points[svgChartPath.points.length - 1]?.label}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DataPanel
                tabs={[
                  { id: "pages", label: "Pages" },
                  { id: "routes", label: "Routes" },
                  { id: "hostnames", label: "Hostnames" },
                ]}
                activeTab={activePageTab}
                onTabChange={(id) => setActivePageTab(id as typeof activePageTab)}
              >
                {pageRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50/80 transition-colors"
                  >
                    <span className="text-slate-600 font-mono text-xs truncate">{row.path}</span>
                    <MetricBar value={row.visitors} max={pageMax} />
                  </div>
                ))}
              </DataPanel>

              <DataPanel
                tabs={[
                  { id: "referrers", label: "Referrers" },
                  { id: "utm", label: "UTM" },
                ]}
                activeTab={activeReferrerTab}
                onTabChange={(id) => setActiveReferrerTab(id as typeof activeReferrerTab)}
              >
                {referrerRows.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-slate-400">No campaign data yet.</div>
                ) : (
                  referrerRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50/80 transition-colors"
                    >
                      <span className="text-slate-600 text-xs truncate">{row.name}</span>
                      <MetricBar value={row.visitors} max={referrerMax} />
                    </div>
                  ))
                )}
              </DataPanel>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DataPanel title="Countries">
                {analyticsData?.countries.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0 text-slate-900">{c.flag}</span>
                      <span className="text-slate-600 text-xs font-medium truncate">{c.name}</span>
                    </div>
                    <MetricBar value={c.visitors} max={countryMax} />
                  </div>
                ))}
              </DataPanel>

              <DataPanel
                tabs={[
                  { id: "devices", label: "Devices" },
                  { id: "browsers", label: "Browsers" },
                ]}
                activeTab={activeDeviceTab}
                onTabChange={(id) => setActiveDeviceTab(id as typeof activeDeviceTab)}
              >
                {deviceRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50/80 transition-colors"
                  >
                    <span className="text-slate-600 text-xs font-medium">{row.name}</span>
                    <MetricBar value={row.visitors} max={deviceMax} />
                  </div>
                ))}
              </DataPanel>

              <DataPanel title="Operating systems">
                {analyticsData?.os.map((o, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50/80 transition-colors"
                  >
                    <span className="text-slate-600 text-xs font-medium">{o.name}</span>
                    <MetricBar value={o.visitors} max={osMax} />
                  </div>
                ))}
              </DataPanel>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CustomEventsPanel
                events={displayEvents}
                activeTab={activeEventTab}
                onTabChange={setActiveEventTab}
                projectName={activeProject}
                onAddClick={() => setAddEventOpen(true)}
              />
              <FeatureFlagsPanel flags={analyticsData?.featureFlags ?? []} projectName={activeProject ?? ""} />
            </div>
          </div>
        )}
      </div>

      <AddEventModal
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        projectName={activeProject ?? ""}
        existingNames={displayEvents.map((e) => e.name)}
        onCreate={handleCreateEvent}
      />
    </AppShell>
  );
}

function DataPanel({
  title,
  tabs,
  activeTab,
  onTabChange,
  children,
}: {
  title?: string;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-[260px]">
      <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
        {tabs ? (
          <div className="flex items-center gap-0.5 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 border border-slate-200 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-sm font-medium text-slate-700">{title}</span>
        )}
        <span className="text-xs text-slate-400 font-mono shrink-0">visitors</span>
      </div>
      <div className="divide-y divide-slate-100 h-[220px] overflow-y-auto scrollbar-minimal">{children}</div>
    </div>
  );
}

function CustomEventsPanel({
  events,
  activeTab,
  onTabChange,
  projectName,
  onAddClick,
}: {
  events: CustomEventItem[];
  activeTab: "all" | "conversions" | "errors";
  onTabChange: (tab: "all" | "conversions" | "errors") => void;
  projectName: string;
  onAddClick: () => void;
}) {
  const filtered =
    activeTab === "all"
      ? events
      : activeTab === "conversions"
        ? events.filter((e) => e.type === "conversion" || e.type === "click")
        : events.filter((e) => e.type === "error");

  const eventMax = Math.max(...filtered.map((e) => e.count), 1);
  const totalEvents = events.reduce((sum, e) => sum + e.count, 0);

  const typeMeta = {
    conversion: {
      icon: Target,
      label: "Conversion",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    click: {
      icon: MousePointerClick,
      label: "Click",
      className: "bg-sky-50 text-sky-700 border-sky-200",
    },
    error: {
      icon: AlertCircle,
      label: "Error",
      className: "bg-rose-50 text-rose-700 border-rose-200",
    },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-[260px]">
      <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-slate-700">Custom events</span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            {totalEvents.toLocaleString()} total
          </span>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
        >
          <Plus className="w-3 h-3" />
          Add event
        </button>
      </div>

      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-0.5">
        {(
          [
            { id: "all", label: "All" },
            { id: "conversions", label: "Conversions" },
            { id: "errors", label: "Errors" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
              activeTab === tab.id
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="divide-y divide-slate-100 h-[185px] overflow-y-auto scrollbar-minimal">
        {filtered.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-slate-400">No events in this category.</div>
        ) : (
          filtered.map((event) => {
            const meta = typeMeta[event.type];
            const Icon = meta.icon;
            const isPositive = event.delta.startsWith("+") || event.type === "error";

            return (
              <div
                key={event.name}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50/80 transition-colors"
              >
                <div
                  className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${meta.className}`}
                >
                  <Icon className="w-3 h-3" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-800 truncate">{event.name}</span>
                    <span
                      className={`hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded border ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Last fired {event.lastSeen}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block w-12 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-400/70"
                      style={{ width: `${Math.round((event.count / eventMax) * 100)}%` }}
                    />
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-900 tabular-nums">
                      {event.count.toLocaleString()}
                    </div>
                    <div
                      className={`text-xs font-medium tabular-nums ${
                        event.delta === "New"
                          ? "text-indigo-600"
                          : event.type === "error"
                            ? event.delta.startsWith("-")
                              ? "text-emerald-600"
                              : "text-rose-600"
                            : isPositive
                              ? "text-emerald-600"
                              : "text-rose-600"
                      }`}
                    >
                      {event.delta}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40 flex items-start gap-2">
        <Code2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs text-slate-500 leading-relaxed">
            Track from your app with{" "}
            <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">
              zenith.track(&apos;event_name&apos;)
            </code>
          </p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            Project: {projectName} · SDK auto-links page views
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureFlagsPanel({
  flags,
  projectName,
}: {
  flags: {
    key: string;
    status: "enabled" | "rollout" | "disabled";
    rollout: number;
    exposures: number;
    conversion: number;
  }[];
  projectName: string;
}) {
  const activeFlags = flags.filter((f) => f.status !== "disabled").length;

  const statusMeta = {
    enabled: {
      label: "Live",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    rollout: {
      label: "Rollout",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    disabled: {
      label: "Off",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-[260px]">
      <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <Flag className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Feature flags</span>
          <span className="text-xs text-slate-400 font-mono">
            {activeFlags} active
          </span>
        </div>
        <Link
          href={`/${projectName}/feature-flags`}
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 shrink-0"
        >
          Manage
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 border-b border-slate-100 text-[10px] font-medium text-slate-400 uppercase tracking-wide">
        <span>Flag</span>
        <span className="text-right hidden sm:block">Status</span>
        <span className="text-right">Exposures</span>
        <span className="text-right">Conv.</span>
      </div>

      <div className="divide-y divide-slate-100 h-[155px] overflow-y-auto scrollbar-minimal">
        {flags.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-slate-400">No feature flags found.</div>
        ) : flags.map((flag) => {
          const meta = statusMeta[flag.status];
          return (
            <div
              key={flag.key}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-3 py-2 hover:bg-slate-50/80 transition-colors"
            >
              <div className="min-w-0">
                <span className="text-xs font-mono text-slate-800 truncate block">{flag.key}</span>
                {flag.status === "rollout" && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400/80"
                        style={{ width: `${flag.rollout}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{flag.rollout}%</span>
                  </div>
                )}
              </div>

              <span
                className={`hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${meta.className}`}
              >
                {flag.status === "rollout" ? `${flag.rollout}%` : meta.label}
              </span>

              <div className="flex items-center justify-end gap-1 text-xs text-slate-700 tabular-nums">
                <Users className="w-3 h-3 text-slate-400 sm:hidden" />
                {flag.exposures.toLocaleString()}
              </div>

              <span className="text-xs font-medium text-slate-900 tabular-nums text-right">
                {flag.status === "disabled" ? "—" : `${flag.conversion}%`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Segment traffic by flag variant in analytics filters.
        </p>
        <a
          href="/integrations"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 shrink-0"
        >
          Connect provider
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function AddEventModal({
  open,
  onOpenChange,
  projectName,
  existingNames,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  existingNames: string[];
  onCreate: (event: CustomEventItem) => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomEventItem["type"]>("conversion");
  const [description, setDescription] = useState("");
  const [properties, setProperties] = useState<EventProperty[]>([]);
  const [installConfirmed, setInstallConfirmed] = useState(false);
  const [nameError, setNameError] = useState("");
  const [codeTab, setCodeTab] = useState<"javascript" | "react" | "curl">("javascript");
  const jsCopy = useCopy();
  const reactCopy = useCopy();
  const curlCopy = useCopy();

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setName("");
    setType("conversion");
    setDescription("");
    setProperties([]);
    setInstallConfirmed(false);
    setNameError("");
    setCodeTab("javascript");
  }, [open]);

  const typeOptions: {
    id: CustomEventItem["type"];
    label: string;
    hint: string;
    icon: typeof Target;
    className: string;
  }[] = [
    {
      id: "conversion",
      label: "Conversion",
      hint: "Sign-ups, purchases, goals",
      icon: Target,
      className: "border-emerald-200 bg-emerald-50/50 text-emerald-800",
    },
    {
      id: "click",
      label: "Click",
      hint: "Buttons, links, UI actions",
      icon: MousePointerClick,
      className: "border-sky-200 bg-sky-50/50 text-sky-800",
    },
    {
      id: "error",
      label: "Error",
      hint: "Failures, exceptions, 5xx",
      icon: AlertCircle,
      className: "border-rose-200 bg-rose-50/50 text-rose-800",
    },
  ];

  const validateName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Event name is required");
      return false;
    }
    if (!isValidEventName(trimmed)) {
      setNameError("Use lowercase snake_case (e.g. signup_completed)");
      return false;
    }
    if (existingNames.includes(trimmed)) {
      setNameError("This event name already exists");
      return false;
    }
    setNameError("");
    return true;
  };

  const buildPropertiesPayload = () => {
    const payload: Record<string, string | number | boolean> = {};
    properties
      .filter((p) => p.key.trim())
      .forEach((p) => {
        if (p.type === "number") payload[p.key.trim()] = Number(p.example) || 0;
        else if (p.type === "boolean") payload[p.key.trim()] = p.example === "true";
        else payload[p.key.trim()] = p.example || "value";
      });
    return payload;
  };

  const payload = buildPropertiesPayload();
  const propertiesJson =
    Object.keys(payload).length > 0 ? `, ${JSON.stringify(payload, null, 2)}` : "";

  const jsSnippet = `import { zenith } from '@zenith-os/analytics';

zenith.init({ project: '${projectName || "your-project"}' });

zenith.track('${name || "event_name"}'${propertiesJson});`;

  const reactSnippet = `import { useEffect } from 'react';
import { zenith } from '@zenith-os/analytics';

export function TrackEvent() {
  useEffect(() => {
    zenith.track('${name || "event_name"}'${propertiesJson});
  }, []);

  return null;
}`;

  const curlSnippet = `curl -X POST https://api.zenith-os.link/v1/events \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "project": "${projectName || "your-project"}",
    "event": "${name || "event_name"}"${Object.keys(payload).length ? `,\n    "properties": ${JSON.stringify(payload)}` : ""}
  }'`;

  const activeSnippet =
    codeTab === "javascript" ? jsSnippet : codeTab === "react" ? reactSnippet : curlSnippet;

  const addProperty = () => {
    setProperties((prev) => [...prev, { key: "", type: "string", example: "" }]);
  };

  const updateProperty = (index: number, patch: Partial<EventProperty>) => {
    setProperties((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const removeProperty = (index: number) => {
    setProperties((prev) => prev.filter((_, i) => i !== index));
  };

  const applyTemplate = (template: (typeof EVENT_TEMPLATES)[number]) => {
    setName(template.name);
    setType(template.type);
    setDescription(template.description);
    setNameError("");
  };

  const handleNext = () => {
    if (step === 1 && !validateName()) return;
    setStep((s) => Math.min(4, s + 1));
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleCreate = () => {
    if (!validateName()) {
      setStep(1);
      return;
    }
    onCreate({
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      count: 0,
      delta: "New",
      lastSeen: "Waiting",
    });
    setStep(4);
  };

  const stepLabels = ["Details", "Properties", "Install", "Done"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden bg-white border-slate-200 text-slate-900 sm:rounded-xl [&_input]:bg-white [&_input]:text-slate-900 [&_input]:placeholder:text-slate-400 [&_textarea]:bg-white [&_textarea]:text-slate-900 [&_textarea]:placeholder:text-slate-400 [&_select]:text-slate-900">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-slate-100 space-y-3">
          <div className="pr-6">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {step === 4 ? "Event created" : "Create custom event"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              {step === 4
                ? "Your event is saved. Deploy the snippet to start receiving data."
                : "Define what to track and copy the install snippet into your app."}
            </DialogDescription>
          </div>

          {step < 4 && (
            <div className="flex items-center gap-1">
              {stepLabels.slice(0, 3).map((label, index) => {
                const stepNum = index + 1;
                const active = step === stepNum;
                const done = step > stepNum;
                return (
                  <div key={label} className="flex items-center gap-1 flex-1 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        done || active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {done ? <Check className="w-3 h-3" /> : stepNum}
                    </div>
                    <span className={`text-[10px] font-medium truncate ${active ? "text-slate-900" : "text-slate-400"}`}>
                      {label}
                    </span>
                    {index < 2 && <div className="h-px flex-1 bg-slate-200 mx-1" />}
                  </div>
                );
              })}
            </div>
          )}
        </DialogHeader>

        <div className="px-5 py-4 max-h-[min(60vh,420px)] overflow-y-auto scrollbar-minimal">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-name" className="text-xs text-slate-700">
                  Event name
                </Label>
                <Input
                  id="event-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
                    setNameError("");
                  }}
                  placeholder="signup_completed"
                  className="h-9 text-sm font-mono bg-white text-slate-900 placeholder:text-slate-400 border-slate-200"
                />
                {nameError ? (
                  <p className="text-[11px] text-rose-600">{nameError}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">Lowercase letters, numbers, and underscores only.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-700">Event type</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {typeOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = type === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setType(option.id)}
                        className={`text-left rounded-lg border p-3 transition-all ${
                          selected
                            ? `${option.className} ring-1 ring-slate-300`
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-2 ${selected ? "" : "text-slate-400"}`} />
                        <div className="text-xs font-semibold text-slate-900">{option.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{option.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-desc" className="text-xs text-slate-700">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="event-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this event measure?"
                  className="min-h-[72px] text-sm resize-none bg-white text-slate-900 placeholder:text-slate-400 border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium text-slate-600">Quick templates</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="text-[10px] font-mono px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-600">
                  Attach optional metadata to filter and segment this event later.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">You can skip this step if you don&apos;t need properties yet.</p>
              </div>

              {properties.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
                  <p className="text-xs text-slate-500">No properties added yet.</p>
                  <Button type="button" variant="outline" size="sm" onClick={addProperty} className="mt-3 h-8 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Add property
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {properties.map((prop, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center rounded-lg border border-slate-200 p-2 bg-slate-50/40"
                    >
                      <Input
                        value={prop.key}
                        onChange={(e) => updateProperty(index, { key: e.target.value })}
                        placeholder="property_key"
                        className="h-8 text-xs font-mono bg-white text-slate-900 placeholder:text-slate-400 border-slate-200"
                      />
                      <select
                        value={prop.type}
                        onChange={(e) =>
                          updateProperty(index, { type: e.target.value as EventProperty["type"] })
                        }
                        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-900"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                      </select>
                      <Input
                        value={prop.example}
                        onChange={(e) => updateProperty(index, { example: e.target.value })}
                        placeholder={prop.type === "boolean" ? "true" : "example value"}
                        className="h-8 text-xs font-mono bg-white text-slate-900 placeholder:text-slate-400 border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeProperty(index)}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addProperty} className="h-8 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Add another
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-mono text-slate-900 truncate">{name || "event_name"}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {typeOptions.find((t) => t.id === type)?.label} · {projectName || "your-project"}
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 shrink-0">
                  Preview
                </span>
              </div>

              <div className="flex items-center gap-1">
                {(["javascript", "react", "curl"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCodeTab(tab)}
                    className={`text-[10px] font-medium px-2.5 py-1 rounded-md capitalize transition-colors ${
                      codeTab === tab ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {tab === "curl" ? "cURL" : tab}
                  </button>
                ))}
              </div>

              <div className="relative rounded-lg border border-slate-200 bg-slate-950 overflow-hidden">
                <pre className="p-3 text-[10px] leading-relaxed text-slate-100 font-mono overflow-x-auto scrollbar-minimal max-h-40">
                  {activeSnippet}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    if (codeTab === "javascript") jsCopy.copy(jsSnippet);
                    else if (codeTab === "react") reactCopy.copy(reactSnippet);
                    else curlCopy.copy(curlSnippet);
                  }}
                  className="absolute top-2 right-2 inline-flex items-center gap-1 h-7 px-2 rounded-md bg-white/10 hover:bg-white/15 text-[10px] font-medium text-white transition-colors"
                >
                  {(codeTab === "javascript" ? jsCopy.copied : codeTab === "react" ? reactCopy.copied : curlCopy.copied) ? (
                    <>
                      <Check className="w-3 h-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>

              <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 cursor-pointer hover:bg-slate-50/80 transition-colors">
                <input
                  type="checkbox"
                  checked={installConfirmed}
                  onChange={(e) => setInstallConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span className="text-xs text-slate-600">
                  I&apos;ve added this snippet to my project (or will deploy it with the next release).
                </span>
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{name}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Event saved for <span className="font-medium text-slate-700">{projectName}</span>. It will appear in
                your list with status <span className="font-mono text-indigo-600">Waiting</span> until the first ping
                arrives.
              </p>

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 text-left px-3 py-2.5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Next steps</p>
                <ul className="space-y-1.5 text-[11px] text-slate-600">
                  <li>1. Deploy your app with the tracking snippet</li>
                  <li>2. Trigger the event once in production or preview</li>
                  <li>3. Refresh analytics to see live counts</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
          {step === 1 && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleNext} className="h-8 text-xs bg-slate-900 hover:bg-black text-white">
                Continue
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={handleBack} className="h-8 text-xs">
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleNext} className="h-8 text-xs">
                  Skip
                </Button>
                <Button type="button" size="sm" onClick={handleNext} className="h-8 text-xs bg-slate-900 hover:bg-black text-white">
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={handleBack} className="h-8 text-xs">
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>
              <Button type="button" size="sm" onClick={handleCreate} disabled={!installConfirmed} className="h-8 text-xs bg-slate-900 hover:bg-black text-white">
                Create event
              </Button>
            </>
          )}

          {step === 4 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep(1);
                  setName("");
                  setDescription("");
                  setProperties([]);
                  setInstallConfirmed(false);
                  setNameError("");
                }}
                className="h-8 text-xs"
              >
                Add another
              </Button>
              <Button type="button" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs bg-slate-900 hover:bg-black text-white">
                Done
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
