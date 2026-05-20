import { useState, useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Search,
  Bell,
  Settings,
  ChevronDown,
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
  { icon: Home, label: "Projects", href: "/dashboard" },
  { icon: Rocket, label: "Deployments", href: "/deployments" },
  { icon: FileText, label: "Logs", href: "/logs" },
  { icon: Globe, label: "Domains", href: "/domains" },
  { icon: SlidersHorizontal, label: "Environment Variables", href: "/env" },
  { icon: Database, label: "Database", badge: "Soon" },
  { icon: Lock, label: "Auth", badge: "Soon" },
  { icon: Terminal, label: "Functions", badge: "Future" },
  { icon: Cpu, label: "Infrastructure", href: "/infrastructure" },
  { icon: Package, label: "Storage", badge: "Soon" },
  { icon: Layers, label: "CDN", badge: "Soon" },
  { icon: BarChart3, label: "Analytics", badge: "Future" },
  { icon: Plug2, label: "Integrations", badge: "Soon" },
  { icon: CreditCard, label: "Billing", href: "/dashboard" },
  { icon: Settings, label: "Settings", href: "/dashboard" },
] as const;

export type NavLabel = (typeof NAV_ITEMS)[number]["label"];

export function AppShell({
  activeNav = "Projects",
  children,
}: {
  activeNav?: NavLabel;
  children: ReactNode;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const queue = useQueueStatus();

  return (
    <div className="h-screen flex flex-col bg-white font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center px-4 gap-4 z-30">
        <Link href="/" className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">Zenith OS</span>
        </Link>

        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, deployments..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 transition-all"
          />
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Live deploy queue badge */}
          {queue && queue.total > 0 && (
            <Link
              href="/deployments"
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <Loader2 className="w-3 h-3 animate-spin text-sky-500" />
              <span className="text-[11px] font-semibold">
                {queue.total} deploying{queue.queued > 0 ? `, ${queue.queued} queued` : ""}
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
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">Asis</span>
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
                    <p className="text-xs font-semibold text-slate-800">Asis Ghorai</p>
                    <p className="text-xs text-slate-400">asis@zenith.link</p>
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
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
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
        {/* SIDEBAR */}
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
                const badge = "badge" in item ? item.badge : undefined;
                const href = "href" in item ? item.href : undefined;
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
                    {href && !badge ? (
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

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-neutral-50">{children}</main>
      </div>
    </div>
  );
}
