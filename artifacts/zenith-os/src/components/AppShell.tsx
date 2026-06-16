import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
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
  Activity
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
  { icon: CreditCard, label: "Billing", href: "/billing", section: "Management" },
  { icon: Settings, label: "Settings", href: "/settings", section: "Management" },
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
  { icon: Shield, label: "Rules" },
  { icon: FileText, label: "Logs" },
  { icon: Settings, label: "Settings" },
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
  
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(
    activeNav === "Supaspire" || activeNav === "Hacker-shield" ? activeNav : null
  );
  
  const [activeSubItemState, setActiveSubItemState] = useState<string>("Overview");
  
  const activeSubItem = propActiveSubItem !== undefined ? propActiveSubItem : activeSubItemState;
  const setActiveSubItem = (item: string) => {
    setActiveSubItemState(item);
    if (onSubItemChange) onSubItemChange(item);
  };

  useEffect(() => {
    if (activeNav === "Supaspire" || activeNav === "Hacker-shield") {
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

  const workspaces = [
    { id: "personal", name: "Personal Workspace", type: "personal" },
    { id: "team-supaspire", name: "Supaspire Team", type: "team" },
    { id: "team-dev", name: "Hacker-shield Dev", type: "team" },
  ];
  const [activeWorkspace, setActiveWorkspace] = useState("personal");

  return (
    <div className="h-screen flex flex-col bg-[#fafafa] font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center px-4 gap-4 z-30">
        <Link href="/" className="flex items-center gap-2 mr-1">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">CloudRik</span>
        </Link>
        
        <div className="text-slate-300 mx-1">/</div>
        
        {/* Workspace Switcher */}
        <div className="relative z-50">
          <button
            onClick={() => { setWorkspaceOpen(!workspaceOpen); setWorkspaceSearch(""); }}
            className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <div className={`w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm ${activeWorkspace === "personal" ? "bg-gradient-to-br from-slate-700 to-slate-900" : "bg-gradient-to-br from-violet-500 to-indigo-600"}`}>
              {workspaces.find(w => w.id === activeWorkspace)?.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-slate-800 hidden sm:block whitespace-nowrap">
              {workspaces.find(w => w.id === activeWorkspace)?.name}
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
                          onClick={() => {
                            setActiveWorkspace(w.id);
                            setWorkspaceOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${isActive ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          <div className={`w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${w.type === "personal" ? "bg-gradient-to-br from-slate-700 to-slate-900" : "bg-gradient-to-br from-violet-500 to-indigo-600"}`}>
                            {w.name.slice(0, 2).toUpperCase()}
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
        {activeSubMenu === "Supaspire" || activeSubMenu === "Hacker-shield" ? (
          <div className="flex shrink-0 z-20 bg-[#fafafa] border-r border-slate-200">
            {/* Left Pane (Main Module Icons) */}
            <div className="w-[60px] border-r border-slate-200/60 flex flex-col items-center py-4 justify-between h-full bg-[#fafafa]">
              <div className="w-full flex flex-col items-center gap-3">
                {/* Back button to main cloudrik menu */}
                <button
                  onClick={() => {
                    setActiveSubMenu(null);
                    navigate("/dashboard");
                  }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors mb-2"
                  title="Back to CloudRik Menu"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                
                {/* Icons of main sub-items */}
                {(activeSubMenu === "Supaspire" ? SUPASPIRE_SUB_ITEMS : HACKER_SHIELD_SUB_ITEMS)
                  .filter(item => hasProject || item.label === "Overview" || activeSubMenu === "Hacker-shield")
                  .map((item) => {
                    const { icon: Icon, label } = item;
                    const isActive = label === activeSubItem;
                    return (
                      <button
                        key={label}
                        onClick={() => setActiveSubItem(label)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-slate-200/60 text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                            : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-900"
                        }`}
                        title={label}
                      >
                        <Icon className="w-[18px] h-[18px] stroke-[1.8px]" />
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
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
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
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
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
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
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
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
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
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
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

                  {/* Hacker-shield Rules Subtabs */}
                  {activeSubMenu === "Hacker-shield" && activeSubItem === "Rules" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "WAF & Security",
                          items: [
                            { id: "WAF Rules", label: "WAF Rules", icon: Shield },
                            { id: "Rate Limiting", label: "Rate Limiting", icon: Activity },
                            { id: "IP Rules", label: "IP Rules", icon: Globe },
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
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
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

                  {/* Hacker-shield Logs Subtabs */}
                  {activeSubMenu === "Hacker-shield" && activeSubItem === "Logs" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "Security Logs",
                          items: [
                            { id: "Security Events", label: "Security Events", icon: Shield },
                            { id: "Traffic Logs", label: "Traffic Logs", icon: FileText },
                            { id: "Threat Analytics", label: "Threat Analytics", icon: BarChart3 },
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
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
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

                  {/* Hacker-shield Settings Subtabs */}
                  {activeSubMenu === "Hacker-shield" && activeSubItem === "Settings" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "Configuration",
                          items: [
                            { id: "General Settings", label: "General Settings", icon: Settings },
                            { id: "SSL/TLS", label: "SSL/TLS", icon: Lock },
                            { id: "Alerts & Notifications", label: "Alerts & Notifications", icon: Bell },
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
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
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
        ) : (
          /* Normal Workspace Sidebar */
          <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto z-20">
            <div className="p-3">
              <Link
                href="/domains"
                className="mb-3 flex items-center justify-center gap-2 h-10 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Domain
              </Link>
              <ul className="space-y-0.5">
                {NAV_ITEMS.map((item) => {
                  const { icon: Icon, label } = item;
                  const badge = "badge" in item ? (item as any).badge : undefined;
                  const href = "href" in item ? item.href : undefined;
                  const hasSubMenu = "hasSubMenu" in item ? item.hasSubMenu : false;
                  const isActive = label === activeNav;

                  const inner = (
                    <>
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive
                          ? "text-slate-900"
                          : badge
                            ? "text-slate-300"
                            : "text-slate-400 group-hover/item:text-slate-600"
                          }`}
                      />
                      <span className="flex-1 text-left leading-none">{label}</span>
                      {badge && (
                        <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                          {badge}
                        </span>
                      )}
                    </>
                  );

                  const itemClass = `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all group/item ${isActive
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : badge
                      ? "text-slate-400 cursor-default"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`;

                  return (
                    <li key={label}>
                      {hasSubMenu ? (
                        <button
                          onClick={() => {
                            setActiveSubMenu(label);
                            setActiveSubItem("Overview");
                            if (label === "Supaspire") {
                              navigate("/supaspire");
                            }
                          }}
                          className={itemClass}
                        >
                          {inner}
                        </button>
                      ) : href && !badge ? (
                        <Link href={href} className={itemClass}>
                          {inner}
                        </Link>
                      ) : (
                        <button disabled={!!badge} className={itemClass}>
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-auto border-t border-slate-100 p-3">
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">Asis Ghorai</p>
                  <p className="text-[10px] text-slate-400 truncate">Pro Plan</p>
                </div>
                <LogOut className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-400 transition-colors shrink-0" />
              </div>
            </div>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-neutral-50">{children}</main>
      </div>
    </div>
  );
}
