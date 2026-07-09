import { useEffect, useState, useRef } from "react";
import { Link, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Webhook,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  GitBranch,
  Zap,
  Terminal,
  Globe,
  ArrowRight,
  RefreshCw,
  Github,
  ChevronRight,
} from "lucide-react";
import { getProjects, fetchProjectsFromServer, saveProject, type Project } from "@/lib/projects";
import { AppShell } from "@/components/AppShell";
import { getWebhookInfo, generateWebhook, type WebhookInfo } from "@/lib/deploy";

// ─────────────────────────────────────────────────────────────────────────────
// Animated Demo Visual — loops automatically showing the full webhook flow
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_STEPS = [
  {
    id: "push",
    label: "Developer pushes code",
    icon: Terminal,
    color: "bg-violet-500",
    textColor: "text-violet-600",
    borderColor: "border-violet-200",
    bgLight: "bg-violet-50",
  },
  {
    id: "github",
    label: "GitHub fires webhook",
    icon: Github,
    color: "bg-slate-800",
    textColor: "text-slate-700",
    borderColor: "border-slate-200",
    bgLight: "bg-slate-50",
  },
  {
    id: "zenith",
    label: "ZenithOS receives event",
    icon: Zap,
    color: "bg-sky-500",
    textColor: "text-sky-600",
    borderColor: "border-sky-200",
    bgLight: "bg-sky-50",
  },
  {
    id: "deploy",
    label: "Auto-deploy triggered",
    icon: RefreshCw,
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    bgLight: "bg-emerald-50",
  },
  {
    id: "live",
    label: "Site goes live instantly",
    icon: Globe,
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    bgLight: "bg-emerald-50",
  },
];

const TERMINAL_LINES = [
  { text: "$ git add .", delay: 0 },
  { text: "$ git commit -m 'feat: add dark mode'", delay: 600 },
  { text: "$ git push origin main", delay: 1400 },
  { text: "Enumerating objects: 5, done.", delay: 2400 },
  { text: "Writing objects: 100% (5/5), done.", delay: 3000 },
  { text: "To github.com/user/my-project.git", delay: 3600 },
  { text: "   a3f2c81..9e1b04a  main → main", delay: 4000 },
];

const LOG_LINES = [
  { text: "Webhook received from GitHub", type: "info", delay: 0 },
  { text: "Signature verified ✓", type: "success", delay: 400 },
  { text: "Cloning repository...", type: "info", delay: 900 },
  { text: "Detected framework: Vite/React", type: "info", delay: 1500 },
  { text: "Installing dependencies...", type: "info", delay: 2100 },
  { text: "Building project...", type: "info", delay: 2900 },
  { text: "Build complete in 38s", type: "success", delay: 3700 },
  { text: "Container deployed on port 3010", type: "success", delay: 4200 },
  { text: "✓ Live at http://3.109.177.105:3010", type: "live", delay: 4800 },
];

function TerminalBlock({ active, phase }: { active: boolean; phase: number }) {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    if (!active) { setVisibleLines(0); return; }
    setVisibleLines(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    TERMINAL_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), _.delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [active, phase]);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border-b border-slate-700">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        <span className="ml-2 text-xs font-mono text-slate-400">~/my-project</span>
      </div>
      <div className="bg-slate-900 p-3 min-h-[140px] font-mono text-xs">
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={line.text.startsWith("$") ? "text-emerald-400" : "text-slate-400"}
          >
            {line.text}
          </motion.div>
        ))}
        {active && visibleLines < TERMINAL_LINES.length && (
          <span className="inline-block w-1.5 h-3.5 bg-emerald-400 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}

function DeployLogBlock({ active, phase }: { active: boolean; phase: number }) {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    if (!active) { setVisibleLines(0); return; }
    setVisibleLines(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    LOG_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [active, phase]);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-100">
        <Zap className="w-3.5 h-3.5 text-sky-500" />
        <span className="text-xs font-semibold text-slate-600">ZenithOS Deploy Log</span>
        {active && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        )}
      </div>
      <div className="bg-white p-3 min-h-[140px] space-y-1">
        {LOG_LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-start gap-2 text-xs font-mono ${
              line.type === "live"
                ? "text-emerald-600 font-semibold"
                : line.type === "success"
                ? "text-emerald-500"
                : "text-slate-500"
            }`}
          >
            <span className="shrink-0 mt-0.5">
              {line.type === "live" ? "🟢" : line.type === "success" ? "✓" : "›"}
            </span>
            {line.text}
          </motion.div>
        ))}
        {!active && (
          <div className="flex flex-col items-center justify-center h-20 gap-1">
            <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
            <span className="text-xs text-slate-400">Waiting for push...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function WebhookFlowArrow({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-0 my-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-6 h-0.5 bg-sky-400"
          initial={{ opacity: 0.2 }}
          animate={active ? { opacity: [0.2, 1, 0.2] } : { opacity: 0.15 }}
          transition={active ? { duration: 0.8, repeat: Infinity, delay: i * 0.12 } : {}}
        />
      ))}
      <motion.div
        animate={active ? { x: [0, 4, 0] } : {}}
        transition={active ? { duration: 0.8, repeat: Infinity } : {}}
      >
        <ChevronRight className="w-4 h-4 text-sky-400" />
      </motion.div>
    </div>
  );
}

function AnimatedDemo() {
  const [activeStep, setActiveStep] = useState(-1);
  const [phase, setPhase] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const STEP_DURATIONS = [5200, 1800, 1800, 5800, 3000];

  useEffect(() => {
    let stepIdx = 0;
    let currentPhase = 0;

    function advance() {
      setActiveStep(stepIdx);
      const duration = STEP_DURATIONS[stepIdx] ?? 2000;
      timerRef.current = setTimeout(() => {
        stepIdx++;
        if (stepIdx >= DEMO_STEPS.length) {
          stepIdx = 0;
          currentPhase++;
          setPhase(currentPhase);
          setActiveStep(-1);
          timerRef.current = setTimeout(advance, 1200);
        } else {
          advance();
        }
      }, duration);
    }

    timerRef.current = setTimeout(advance, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-900">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="ml-2 text-xs font-mono text-slate-400">webhook-demo — live preview</span>
        <motion.div
          className="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-emerald-400"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          AUTO-RUNNING
        </motion.div>
      </div>

      <div className="p-5 space-y-5">
        {/* Step indicators */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {DEMO_STEPS.map((step, i) => {
            const done = activeStep > i;
            const current = activeStep === i;
            return (
              <div key={step.id} className="flex items-center gap-1 shrink-0">
                <motion.div
                  animate={current ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                    current
                      ? "bg-sky-500/20 border border-sky-500/60 text-sky-300"
                      : done
                      ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                      : "bg-slate-800/60 border border-slate-700 text-slate-500"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : current ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-3 h-3 text-sky-400" />
                    </motion.div>
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-slate-600 flex items-center justify-center text-[8px] text-slate-500">
                      {i + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </motion.div>
                {i < DEMO_STEPS.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Main demo area — two panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT — Terminal / Developer side */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
                <Terminal className="w-3 h-3 text-violet-400" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Your Computer</span>
              <GitBranch className="w-3 h-3 text-slate-500 ml-auto" />
              <span className="text-xs text-slate-500 font-mono">main</span>
            </div>
            <TerminalBlock active={activeStep === 0} phase={phase} />

            {/* GitHub webhook fires */}
            <AnimatePresence>
              {(activeStep >= 1) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700"
                >
                  <Github className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-xs font-mono text-slate-400">GitHub webhook fired</span>
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="ml-auto"
                  >
                    <ArrowRight className="w-3 h-3 text-sky-400" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT — ZenithOS side */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                <Zap className="w-3 h-3 text-sky-400" />
              </div>
              <span className="text-xs font-semibold text-slate-300">ZenithOS Server</span>
              <AnimatePresence>
                {activeStep >= 2 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-auto text-[10px] font-medium text-emerald-400 flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Deploying
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <DeployLogBlock active={activeStep >= 2} phase={phase} />
          </div>
        </div>

        {/* Bottom result banner */}
        <AnimatePresence>
          {activeStep === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: 2 }}
                className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </motion.div>
              <div>
                <div className="text-sm font-semibold text-emerald-300">Deployed successfully!</div>
                <div className="text-xs text-emerald-500/80 font-mono">git push → live in ~38 seconds. No manual steps.</div>
              </div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="ml-auto text-xs text-slate-500"
              >
                Restarting demo...
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy helper
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
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function WebhookPage() {
  const [, params] = useRoute("/project/:name/webhook");
  const projectName = params?.name ? decodeURIComponent(params.name) : "";

  const [project, setProject] = useState<Project | null>(() =>
    getProjects().find((p) => p.name === projectName) ?? null
  );
  const [projectLoading, setProjectLoading] = useState(!project);

  const [info, setInfo] = useState<WebhookInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const urlCopy = useCopy();
  const secretCopy = useCopy();

  // Fetch from API if not in localStorage
  useEffect(() => {
    if (project) { setProjectLoading(false); return; }
    let cancelled = false;
    fetchProjectsFromServer().then((list) => {
      if (cancelled) return;
      const found = list.find((p) => p.name === projectName) ?? null;
      if (found) {
        saveProject({ name: found.name, domain: found.domain, status: found.status, repo: found.repo, framework: found.framework });
        setProject(found);
      }
      setProjectLoading(false);
    });
    return () => { cancelled = true; };
  }, [projectName]);

  // Load existing webhook info on mount if it exists
  useEffect(() => {
    if (!projectName) return;
    let active = true;
    async function checkExisting() {
      try {
        const data = await getWebhookInfo(projectName);
        if (active && data) {
          setInfo(data);
        }
      } catch (e) {
        // Ignore errors as it might just be unconfigured
      }
    }
    checkExisting();
    return () => { active = false; };
  }, [projectName]);

  async function load() {
    if (loading || !projectName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generateWebhook(projectName);
      setInfo(data);
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (projectLoading) {
    return (
      <AppShell activeNav="Projects">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading project…</p>
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell activeNav="Projects">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Project not found</h1>
          <Link href="/dashboard" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
            Back to Projects
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="Projects">
      <div className="max-w-3xl mx-auto px-6 py-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-6">
          <Link href="/dashboard" className="hover:text-slate-700 transition-colors">Projects</Link>
          <span>›</span>
          <Link href={`/project/${encodeURIComponent(projectName)}`} className="hover:text-slate-700 transition-colors">{projectName}</Link>
          <span>›</span>
          <span className="text-slate-700">GitHub Webhook</span>
        </div>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow">
              <Webhook className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">GitHub Webhook</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Auto-deploy <span className="font-semibold text-slate-700">{projectName}</span> on every <code className="font-mono bg-slate-100 px-1 rounded text-xs">git push</code> to main
              </p>
            </div>
            <Link
              href={`/project/${encodeURIComponent(projectName)}`}
              className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
          </div>
        </motion.div>

        {/* ── SECTION 1: Webhook Setup ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6"
        >
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
            <Zap className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Webhook Setup</h2>
            {info && (
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            )}
          </div>

          <div className="px-5 py-5">
            {/* Not yet loaded */}
            {!info && !loading && !error && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center shadow-sm">
                  <Webhook className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">Connect your GitHub repo</p>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Generate a unique webhook URL and secret for <strong>{projectName}</strong>. Paste them into GitHub and every push will trigger an auto-deploy.
                  </p>
                </div>
                <button
                  onClick={load}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow"
                >
                  <Zap className="w-4 h-4" /> Generate Webhook
                </button>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating webhook…
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 py-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4">
                {error}
              </div>
            )}

            {info && (
              <div className="space-y-5">
                {/* Payload URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payload URL
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 h-11 px-3.5 flex items-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono truncate">
                      {info.webhookUrl}
                    </code>
                    <button
                      onClick={() => urlCopy.copy(info.webhookUrl)}
                      className="shrink-0 w-11 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors"
                      title="Copy URL"
                    >
                      {urlCopy.copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>
                </div>

                {/* Secret Token */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Secret Token
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 h-11 px-3.5 flex items-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono truncate">
                      {showSecret ? info.secret : "•".repeat(40)}
                    </code>
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="shrink-0 w-11 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors"
                      title={showSecret ? "Hide" : "Show"}
                    >
                      {showSecret ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                    </button>
                    <button
                      onClick={() => secretCopy.copy(info.secret)}
                      className="shrink-0 w-11 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors"
                      title="Copy secret"
                    >
                      {secretCopy.copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Setup Steps */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5" /> Setup in GitHub (5 steps)
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { step: "1", text: "Open your GitHub repo → Settings → Webhooks → Add webhook" },
                      { step: "2", text: "Paste the Payload URL above into the \"Payload URL\" field" },
                      { step: "3", text: 'Set Content type to "application/json"' },
                      { step: "4", text: "Paste the Secret Token above into the \"Secret\" field" },
                      { step: "5", text: 'Select "Just the push event" and click Add webhook' },
                    ].map((s) => (
                      <div key={s.step} className="flex items-start gap-3 text-xs text-slate-600">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                          {s.step}
                        </span>
                        {s.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── SECTION 2: How it works (Animated Demo) ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">How it works — Live Demo</h2>
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-sky-500"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              Auto-looping
            </span>
          </div>

          <AnimatedDemo />

          <p className="text-xs text-slate-400 text-center mt-3">
            This demo auto-loops — showing exactly what happens each time you <code className="font-mono bg-slate-100 px-1 rounded">git push</code>
          </p>
        </motion.div>

      </div>
    </AppShell>
  );
}
