import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { getAuthToken, fetchProjectsFromServer, type Project } from "@/lib/projects";
import { useAuth } from "@/hooks/useAuth";
import { useProjectStore } from "@/hooks/useProject";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Search,
  Bell,
  Settings,
  ChevronDown,
  ChevronsUpDown,
  Check,
  Home,
  Rocket,
  FileText,
  Globe,
  Database,
  Lock,
  Terminal,
  Cpu,
  Package,
  BarChart3,
  Plug2,
  CreditCard,
  SlidersHorizontal,
  LogOut,
  User,
  Layers,
  Loader2,
  Plus,
  Webhook,
  Users,
  History,
  Key,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  ArrowRightLeft,
  Route as RouteIcon,
  Box
} from "lucide-react";

type QueueStatus = {
  running: boolean;
  queued: number;
  total: number;
};

function useQueueStatus() {
  const [status, setStatus] = useState<QueueStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api-proxy/queue", { signal: AbortSignal.timeout(4000) });
        if (!cancelled && res.ok) {
          const data = await res.json() as QueueStatus;
          setStatus(data);
        }
      } catch { /* silent */ }
    }

    poll();
    const id = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return status;
}

export const NAV_ITEMS = [
  { icon: Home, label: "Projects", href: "/dashboard", section: "Deployment" },
  { icon: Rocket, label: "Deployments", href: "/deployments", section: "Deployment" },
  { icon: FileText, label: "Logs", href: "/logs", section: "Deployment" },
  { icon: Globe, label: "Domains", href: "/domains", section: "Deployment" },
  { icon: SlidersHorizontal, label: "Environment Variables", href: "/env", section: "Deployment" },

  { icon: Database, label: "Supaspire", hasSubMenu: true, section: "Services" },
  { icon: Shield, label: "Hacker-shield", hasSubMenu: true, section: "Services" },

  { icon: Cpu, label: "Infrastructure", href: "/infrastructure", section: "Management" },
  { icon: Webhook, label: "Webhooks", href: "/webhooks", section: "Management" },
  { icon: Key, label: "API Tokens", href: "/tokens", section: "Management" },
  { icon: Users, label: "Team Members", href: "/team", section: "Management" },
  { icon: Globe, label: "CDN", hasSubMenu: true, section: "Services" },
  { icon: BarChart3, label: "Analytics", href: "/analytics", section: "Management" },
  { icon: Plug2, label: "Integrations", href: "/integrations", section: "Management" },
  { icon: History, label: "Backups", href: "/backups", section: "Management" },
  { icon: CreditCard, label: "Billing", href: "/billing", section: "Management" },
  { icon: Settings, label: "Settings", href: "/settings", section: "Management" },
] as const;

export const SIDEBAR_SECTIONS = [
  {
    items: [
      { icon: Home, label: "Projects", href: "/dashboard" },
      { icon: Rocket, label: "Deployments", href: "/deployments" },
      { icon: Globe, label: "Domains", href: "/domains" },
    ]
  },
  {
    name: "Observe",
    items: [
      { icon: FileText, label: "Logs", href: "/logs" },
      { icon: BarChart3, label: "Analytics", href: "/analytics" },
    ]
  },
  {
    name: "Build",
    items: [
      { icon: Database, label: "Supaspire", hasSubMenu: true },
      { icon: SlidersHorizontal, label: "Environment Variables", href: "/env" },
      { icon: History, label: "Backups", href: "/backups" },
    ]
  },
  {
    name: "Protect & Connect",
    items: [
      { icon: Shield, label: "Hacker-shield", hasSubMenu: true },
      { icon: Globe, label: "CDN", hasSubMenu: true },
      { icon: Webhook, label: "Webhooks", href: "/webhooks" },
    ]
  },
  {
    name: "Manage",
    items: [
      { icon: Cpu, label: "Infrastructure", href: "/infrastructure" },
      { icon: Users, label: "Team Members", href: "/team" },
      { icon: Key, label: "API Tokens", href: "/tokens" },
      { icon: Plug2, label: "Integrations", href: "/integrations" },
      { icon: CreditCard, label: "Billing", href: "/billing" },
      { icon: Settings, label: "Settings", href: "/settings" },
    ]
  }
] as const;

export const SUPASPIRE_SUB_ITEMS = [
  { icon: Layers, label: "Overview" },
  { icon: Database, label: "Database" },
  { icon: Lock, label: "Authentication" },
  { icon: Package, label: "Storage" },
  { icon: Activity, label: "Real-time" },
  { icon: Terminal, label: "Functions" },
] as const;

export const HACKER_SHIELD_SUB_ITEMS = [
  { icon: Layers, label: "Overview" },
  { icon: Shield, label: "Firewall" },
  { icon: Lock, label: "WAF Rules" },
  { icon: Zap, label: "DDoS Protection" },
  { icon: BarChart3, label: "Rate Limiting" },
  { icon: Globe, label: "IP Rules" },
  { icon: Key, label: "SSL / TLS" },
  { icon: Cpu, label: "Bot Protection" },
  { icon: FileText, label: "Security Logs" },
  { icon: Bell, label: "Alerts" },
] as const;

export const CDN_SUB_ITEMS = [
  { icon: Layers, label: "Caches" },
  { icon: ArrowRightLeft, label: "Redirects" },
  { icon: RouteIcon, label: "Routing Rules" },
] as const;

export type NavLabel = (typeof NAV_ITEMS)[number]["label"];

export function AppShell({
  activeNav = "Projects",
  activeSubItem: propActiveSubItem,
  onSubItemChange,
  hasProject = true,
  children,
  activeSubTab,
  onSubTabChange,
}: {
  activeNav?: string;
  activeSubItem?: string;
  onSubItemChange?: (item: string) => void;
  hasProject?: boolean;
  children: ReactNode;
  activeSubTab?: string;
  onSubTabChange?: (tab: string) => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [leftPaneExpanded, setLeftPaneExpanded] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");

  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(
    activeNav === "Supaspire" || activeNav === "Hacker-shield" || activeNav === "CDN" ? activeNav : null
  );

  const [activeSubItemState, setActiveSubItemState] = useState<string>("Overview");

  const activeSubItem = propActiveSubItem !== undefined ? propActiveSubItem : activeSubItemState;
  const setActiveSubItem = (item: string) => {
    setActiveSubItemState(item);
    if (onSubItemChange) onSubItemChange(item);
  };

  useEffect(() => {
    if (activeNav === "Supaspire" || activeNav === "Hacker-shield" || activeNav === "CDN") {
      setActiveSubMenu(activeNav);
    } else {
      setActiveSubMenu(null);
    }
  }, [activeNav]);

  const queue = useQueueStatus();
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleSignOut = () => {
    localStorage.removeItem("zenith.projects");
    localStorage.removeItem("cloudrik-workspace");
    logout();
    navigate("/sign-in");
  };

  const {
    workspaces,
    setWorkspaces,
    activeWorkspace,
    setActiveWorkspace,
    projects,
    setProjects,
    activeProject,
    setActiveProject
  } = useProjectStore();

  const [projectOpen, setProjectOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch("/api-proxy/api/user/workspaces", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(data);

          const savedWorkspace = localStorage.getItem("cloudrik-workspace");
          if (savedWorkspace && data.find((w: any) => w.id === savedWorkspace)) {
            setActiveWorkspace(savedWorkspace);
          } else if (data.length > 0) {
            setActiveWorkspace(data[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch workspaces", e);
      }
    };
    fetchWorkspaces();
  }, []);

  const handleWorkspaceSwitch = (wId: string) => {
    setActiveWorkspace(wId);
    setWorkspaceOpen(false);
    window.location.reload(); // Reload to refresh all data for new workspace
  };

  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchProjects = async () => {
      try {
        const data = await fetchProjectsFromServer();
        setProjects(data);
        const savedProject = localStorage.getItem("cloudrik-active-project");
        if (savedProject && data.find((p: Project) => p.name === savedProject)) {
          setActiveProject(savedProject);
        } else if (data.length > 0) {
          setActiveProject(data[0].name);
        } else {
          setActiveProject(null);
        }
      } catch (e) {
        console.error("Failed to fetch projects", e);
      }
    };
    fetchProjects();
  }, [activeWorkspace]);

  const handleProjectSwitch = (pName: string) => {
    setActiveProject(pName);
    setProjectOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-[#fafafa] font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center px-4 gap-1 z-30">
        
        {/* Workspace Switcher */}
        <div className="relative z-50">
          <button
            onClick={() => { setWorkspaceOpen(!workspaceOpen); setWorkspaceSearch(""); }}
            className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <div className={`w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm ${workspaces.find(w => w.id === activeWorkspace)?.type === "personal" ? "bg-gradient-to-br from-slate-700 to-slate-900" : "bg-gradient-to-br from-violet-500 to-indigo-600"}`}>
              {workspaces.find(w => w.id === activeWorkspace)?.avatarUrl ? (
                <img src={workspaces.find(w => w.id === activeWorkspace)!.avatarUrl!} alt="" className="w-full h-full rounded-[5px] object-cover" />
              ) : (
                workspaces.find(w => w.id === activeWorkspace)?.name.slice(0, 2).toUpperCase() || "WS"
              )}
            </div>
            <span className="text-sm font-semibold text-slate-800 hidden sm:block whitespace-nowrap truncate max-w-[150px]">
              {workspaces.find(w => w.id === activeWorkspace)?.name || "Loading..."}
            </span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {workspaceOpen && (
            <div className="fixed inset-0 z-40" onClick={() => setWorkspaceOpen(false)} />
          )}

          <AnimatePresence>
            {workspaceOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 top-10 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={workspaceSearch}
                    onChange={e => setWorkspaceSearch(e.target.value)}
                    placeholder="Find workspace..."
                    className="w-full text-xs text-slate-700 placeholder:text-slate-400 bg-transparent focus:outline-none"
                  />
                </div>
                <div className="p-1 max-h-56 overflow-y-auto">
                  {workspaces
                    .filter(w => w.name.toLowerCase().includes(workspaceSearch.toLowerCase()))
                    .map((w) => {
                      const isActive = w.id === activeWorkspace;
                      return (
                        <button
                          key={w.id}
                          onClick={() => handleWorkspaceSwitch(w.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${isActive ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          <div className={`w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${w.type === "personal" ? "bg-gradient-to-br from-slate-700 to-slate-900" : "bg-gradient-to-br from-violet-500 to-indigo-600"}`}>
                            {w.avatarUrl ? (
                              <img src={w.avatarUrl} alt="" className="w-full h-full rounded-[5px] object-cover" />
                            ) : (
                              w.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <span className="flex-grow truncate">{w.name}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-slate-500" />}
                        </button>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-slate-300 mx-2">/</div>

        {/* Project Switcher */}
        <div className="relative z-50">
          <button
            onClick={() => { setProjectOpen(!projectOpen); setProjectSearch(""); }}
            className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <div className="w-[22px] h-[22px] rounded-[5px] bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Box className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <span className="text-sm font-semibold text-slate-800 hidden sm:block whitespace-nowrap truncate max-w-[150px]">
              {projects.length > 0 ? (activeProject || "Select Project") : "No Projects"}
            </span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {projectOpen && (
            <div className="fixed inset-0 z-40" onClick={() => setProjectOpen(false)} />
          )}

          <AnimatePresence>
            {projectOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 top-10 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={projectSearch}
                    onChange={e => setProjectSearch(e.target.value)}
                    placeholder="Find project..."
                    className="w-full text-xs text-slate-700 placeholder:text-slate-400 bg-transparent focus:outline-none"
                  />
                </div>
                <div className="p-1 max-h-56 overflow-y-auto">
                  {projects.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-500">No projects deployed yet.</div>
                  ) : (
                    projects
                      .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                      .map((p) => {
                        const isActive = p.name === activeProject;
                        return (
                          <button
                            key={p.name}
                            onClick={() => handleProjectSwitch(p.name)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${isActive ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                          >
                            <div className="w-[22px] h-[22px] rounded-[5px] bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              <Box className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <span className="flex-grow truncate">{p.name}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-slate-500" />}
                          </button>
                        );
                      })
                  )}
                </div>
                <div className="border-t border-slate-100 p-1">
                  <Link href="/dashboard" onClick={() => setProjectOpen(false)}>
                    <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> Deploy New Project
                    </div>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-grow" />

        <div className="flex items-center gap-1">
          {queue && queue.total > 0 && (
            <Link
              href="/deployments"
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <Loader2 className="w-3 h-3 animate-spin text-sky-500" />
              <span className="text-[11px] font-semibold">
                {queue.total} deploying
              </span>
            </Link>
          )}
          <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sky-500" />
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-200 mx-1" />

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {user?.avatar_url || user?.avatarUrl ? <img src={user.avatar_url || user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name || "User"}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800">{user?.name || "User"}</p>
                    <p className="text-xs text-slate-400">{user?.email || "user@zenith.link"}</p>
                  </div>
                  {[
                    { icon: User, label: "Profile" },
                    { icon: Settings, label: "Settings" },
                    { icon: CreditCard, label: "Billing" },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-400" /> {label}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 mt-1" />
                  <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR WRAPPER */}
        {activeSubMenu === "Supaspire" && (
          <div
            key="supaspire"
            className="flex shrink-0 z-20 bg-[#fafafa] border-r border-slate-200 animate-slide-in"
          >
            {/* Left Pane (Main Module Icons) */}
            <div className="relative w-[60px] shrink-0 h-full">
              <div
                className={`absolute left-0 top-0 h-full transition-[width] duration-200 ease-in-out border-r border-slate-200/60 flex flex-col items-start py-4 justify-between bg-[#fafafa] overflow-hidden z-30 shadow-[2px_0_8px_rgba(0,0,0,0.04)] ${leftPaneExpanded ? 'w-[220px]' : 'w-[60px]'}`}
                onMouseEnter={() => setLeftPaneExpanded(true)}
                onMouseLeave={() => setLeftPaneExpanded(false)}
              >
                <div className="w-full flex flex-col items-start gap-1">
                  {/* Back button to main cloudrik menu */}
                  <button
                    onClick={() => {
                      setActiveSubMenu(null);
                      navigate("/dashboard");
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors mb-1"
                    title="Back to CloudRik Menu"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    <span className={`transition-opacity duration-150 text-xs font-medium whitespace-nowrap ${leftPaneExpanded ? 'opacity-100' : 'opacity-0'}`}>Supaspire</span>
                  </button>

                  {/* Icons of main sub-items */}
                  {(((activeSubMenu as string) === "Supaspire" ? SUPASPIRE_SUB_ITEMS : HACKER_SHIELD_SUB_ITEMS) as any)
                    .filter((item: any) => hasProject || item.label === "Overview" || (activeSubMenu as string) === "Hacker-shield")
                    .map((item: any) => {
                      const { icon: Icon, label } = item;
                      const isActive = label === activeSubItem;
                      return (
                        <button
                          key={label}
                          onClick={() => setActiveSubItem(label)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${isActive
                            ? "bg-slate-200/60 text-slate-900"
                            : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-900"
                            }`}
                          title={label}
                        >
                          <Icon className="w-[18px] h-[18px] stroke-[1.8px] shrink-0" />
                          <span className={`transition-opacity duration-150 text-sm font-semibold whitespace-nowrap ${leftPaneExpanded ? 'opacity-100' : 'opacity-0'}`}>
                            {label}
                          </span>
                        </button>
                      );
                    })}
                </div>

                {/* Profile Avatar */}
                <div
                  onClick={handleSignOut}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden cursor-pointer"
                  title="Sign out"
                >
                  {user?.avatar_url || user?.avatarUrl ? <img src={user.avatar_url || user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase() || "U"}
                </div>
              </div>
            </div>

            {/* Right Pane (Subtabs list with icons) */}
            {activeSubItem !== "Overview" && (
              <div className="w-[210px] flex flex-col h-full bg-[#fafafa]">
                <div className="p-3 border-b border-slate-100 bg-[#fafafa]">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{activeSubItem}</span>
                </div>
                <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-4">

                  {/* Database Subtabs */}
                  {activeSubMenu === "Supaspire" && activeSubItem === "Database" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "Database Management",
                          items: [
                            { id: "Schema Visualizer", label: "Schema Visualizer", icon: Layers },
                            { id: "Tables", label: "Tables", icon: Database },
                            { id: "Functions", label: "Functions", icon: Terminal },
                            { id: "Triggers", label: "Triggers", icon: Zap },
                            { id: "Extensions", label: "Extensions", icon: Settings },
                            { id: "Indexes", label: "Indexes", icon: Key },
                          ]
                        },
                        {
                          section: "Configuration",
                          items: [
                            { id: "Roles", label: "Roles", icon: Users },
                            { id: "Policies", label: "Policies", icon: Shield },
                            { id: "Settings", label: "Settings", icon: Settings },
                          ]
                        },
                        {
                          section: "Platform",
                          items: [
                            { id: "Backups", label: "Backups", icon: History },
                            { id: "Database Webhooks", label: "Database Webhooks", icon: Webhook },
                          ]
                        }
                      ].map((sec) => (
                        <div key={sec.section}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1.5 select-none">{sec.section}</span>
                          <div className="space-y-0.5">
                            {sec.items.map((sub) => {
                              const isSubActive = sub.id === activeSubTab;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => onSubTabChange && onSubTabChange(sub.id)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${isSubActive
                                    ? "bg-slate-200/60 text-slate-900 font-bold"
                                    : "text-slate-600 hover:bg-slate-100/70"
                                    }`}
                                >
                                  <sub.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Authentication Subtabs */}
                  {activeSubMenu === "Supaspire" && activeSubItem === "Authentication" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "Users",
                          items: [
                            { id: "Users", label: "Users", icon: Users },
                          ]
                        },
                        {
                          section: "Configuration",
                          items: [
                            { id: "Providers", label: "Providers", icon: Key },
                            { id: "Templates", label: "Templates", icon: Lock },
                            { id: "Settings", label: "Settings", icon: Settings },
                          ]
                        }
                      ].map((sec) => (
                        <div key={sec.section}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1.5 select-none">{sec.section}</span>
                          <div className="space-y-0.5">
                            {sec.items.map((sub) => {
                              const isSubActive = sub.id === activeSubTab;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => onSubTabChange && onSubTabChange(sub.id)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${isSubActive
                                    ? "bg-slate-200/60 text-slate-900 font-bold"
                                    : "text-slate-600 hover:bg-slate-100/70"
                                    }`}
                                >
                                  <sub.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Storage Subtabs */}
                  {activeSubMenu === "Supaspire" && activeSubItem === "Storage" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "File Storage",
                          items: [
                            { id: "Buckets", label: "Buckets", icon: Package },
                            { id: "Usage", label: "Usage", icon: Activity },
                            { id: "Settings", label: "Settings", icon: Settings },
                          ]
                        }
                      ].map((sec) => (
                        <div key={sec.section}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1.5 select-none">{sec.section}</span>
                          <div className="space-y-0.5">
                            {sec.items.map((sub) => {
                              const isSubActive = sub.id === activeSubTab;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => onSubTabChange && onSubTabChange(sub.id)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${isSubActive
                                    ? "bg-slate-200/60 text-slate-900 font-bold"
                                    : "text-slate-600 hover:bg-slate-100/70"
                                    }`}
                                >
                                  <sub.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Real-time Subtabs */}
                  {activeSubMenu === "Supaspire" && activeSubItem === "Real-time" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "Live Channels",
                          items: [
                            { id: "Inspector", label: "Inspector", icon: Activity },
                            { id: "Settings", label: "Settings", icon: Settings },
                          ]
                        }
                      ].map((sec) => (
                        <div key={sec.section}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1.5 select-none">{sec.section}</span>
                          <div className="space-y-0.5">
                            {sec.items.map((sub) => {
                              const isSubActive = sub.id === activeSubTab;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => onSubTabChange && onSubTabChange(sub.id)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${isSubActive
                                    ? "bg-slate-200/60 text-slate-900 font-bold"
                                    : "text-slate-600 hover:bg-slate-100/70"
                                    }`}
                                >
                                  <sub.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Functions Subtabs */}
                  {activeSubMenu === "Supaspire" && activeSubItem === "Functions" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "Edge Functions",
                          items: [
                            { id: "Functions", label: "Functions", icon: Terminal },
                            { id: "Secrets", label: "Secrets", icon: Key },
                          ]
                        }
                      ].map((sec) => (
                        <div key={sec.section}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1.5 select-none">{sec.section}</span>
                          <div className="space-y-0.5">
                            {sec.items.map((sub) => {
                              const isSubActive = sub.id === activeSubTab;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => onSubTabChange && onSubTabChange(sub.id)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${isSubActive
                                    ? "bg-slate-200/60 text-slate-900 font-bold"
                                    : "text-slate-600 hover:bg-slate-100/70"
                                    }`}
                                >
                                  <sub.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}
        {activeSubMenu === "Hacker-shield" && (
          <aside
            className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto thin-scrollbar z-20 animate-slide-in"
          >
            <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-100">
              <button
                onClick={() => { setActiveSubMenu(null); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-800">Hacker-shield</span>
            </div>
            <div className="p-3">
              <ul className="space-y-0.5">
                {HACKER_SHIELD_SUB_ITEMS.map((item) => {
                  const { icon: Icon, label } = item;
                  const isActive = label === activeSubItem;
                  return (
                    <li key={label}>
                      <button
                        onClick={() => setActiveSubItem(label)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-slate-900" : "text-slate-500"}`} />
                        <span className="flex-1 text-left leading-none">{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        )}
        {activeSubMenu === "CDN" && (
          <aside
            className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto thin-scrollbar z-20 animate-slide-in"
          >
            <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-100">
              <button
                onClick={() => { setActiveSubMenu(null); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-800">CDN</span>
            </div>
            <div className="p-3">
              <ul className="space-y-0.5">
                {CDN_SUB_ITEMS.map((item) => {
                  const { icon: Icon, label } = item;
                  const isActive = label === activeSubItem;
                  return (
                    <li key={label}>
                      <button
                        onClick={() => setActiveSubItem(label)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-slate-900" : "text-slate-500"}`} />
                        <span className="flex-1 text-left leading-none">{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        )}
        {!activeSubMenu && (
          <aside key="normal-sidebar" className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden z-20">
            {/* Quick Search */}
            <div className="px-3 pt-3 pb-2 border-b border-slate-100/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  value={sidebarSearch}
                  onChange={e => setSidebarSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all font-sans"
                />
              </div>
            </div>

            {/* Scrollable list of sections */}
            <div className="flex-1 overflow-y-auto thin-scrollbar p-3">
              <div className="space-y-4">
                {SIDEBAR_SECTIONS.map((section, sIdx) => {
                  // Filter items in section based on sidebarSearch
                  const filteredItems = section.items.filter(item => 
                    item.label.toLowerCase().includes(sidebarSearch.toLowerCase())
                  );

                  if (filteredItems.length === 0) return null;

                  return (
                    <div key={section.name || sIdx} className="space-y-1">
                      {section.name && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2.5 mb-1.5 select-none">
                          {section.name}
                        </span>
                      )}
                      <ul className="space-y-0.5">
                        {filteredItems.map((item) => {
                          const { icon: Icon, label } = item;
                          const href = "href" in item ? item.href : undefined;
                          const hasSubMenu = "hasSubMenu" in item ? item.hasSubMenu : false;
                          const isActive = label === activeNav;

                          const inner = (
                            <>
                              <Icon
                                className={`w-4 h-4 shrink-0 ${isActive
                                  ? "text-slate-900"
                                  : "text-slate-500 group-hover/item:text-slate-700"
                                  }`}
                              />
                              <span className="flex-1 text-left leading-none truncate">{label}</span>
                              {hasSubMenu && <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                            </>
                          );

                          const itemClass = `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all group/item ${isActive
                            ? "bg-slate-100 text-slate-900 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`;

                          return (
                            <li key={label}>
                              {hasSubMenu ? (
                                <button
                                  onClick={() => {
                                    setActiveSubMenu(label);
                                    setActiveSubItem(label === "CDN" ? "Caches" : "Overview");
                                    if (label === "Supaspire") {
                                      navigate("/supaspire");
                                    } else if (label === "CDN") {
                                      navigate("/cdn");
                                    }
                                  }}
                                  className={itemClass}
                                >
                                  {inner}
                                </button>
                              ) : href ? (
                                <Link href={href} className={itemClass}>
                                  {inner}
                                </Link>
                              ) : (
                                <button className={itemClass}>
                                  {inner}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto border-t border-slate-100 p-3">
              <div
                onClick={handleSignOut}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                title="Sign out"
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || user?.email?.split('@')[0] || "User"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.workspaceRole === "Viewer" ? "Viewer (Free)" : "Pro Plan"}</p>
                </div>
                <LogOut className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-400 transition-colors shrink-0" />
              </div>
            </div>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto scrollbar-minimal bg-neutral-50">{children}</main>
      </div>
    </div>
  );
}
