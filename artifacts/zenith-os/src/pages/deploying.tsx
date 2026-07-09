import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { saveProject } from "@/lib/projects";
import {
  normalizeDomainForStorage,
  normalizeUrlForDisplay,
  streamDeployment,
  type StreamEvent,
} from "@/lib/deploy";
import {
  Zap,
  CheckCircle2,
  Loader2,
  Circle,
  XCircle,
  Rocket,
  Terminal as TerminalIcon,
  Clock,
  ExternalLink,
  Copy,
  ChevronRight,
  Inbox,
  PartyPopper,
  Globe,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  FileText,
  ChevronDown,
  Check,
  GitBranch,
  Github,
  Plus
} from "lucide-react";

type StepStatus = "done" | "running" | "pending" | "failed";

type DeployStep = {
  key: string;
  label: string;
  status: StepStatus;
};

type DeployStatus = "queued" | "building" | "live" | "failed";

type DeployState = {
  projectName: string;
  liveUrl: string;
  status: DeployStatus;
  startedAt: number | null;
  finishedAt: number | null;
  errorMessage: string | null;
  isFinalizing: boolean;
  steps: DeployStep[];
  logs: string[];
  framework: string;
  queuePosition: number;
  queueTotal: number;
};

const STEP_DEFINITIONS: Omit<DeployStep, "status">[] = [
  { key: "clone", label: "Cloning Repo" },
  { key: "install", label: "Installing Packages" },
  { key: "build", label: "Building Project" },
  { key: "server", label: "Starting Server" },
  { key: "live", label: "Live" },
];

function buildStepsFromIndex(currentIndex: number, status: DeployStatus): DeployStep[] {
  return STEP_DEFINITIONS.map((step, index) => {
    if (status === "live") return { ...step, status: "done" };
    if (status === "failed") {
      if (index < currentIndex) return { ...step, status: "done" };
      if (index === currentIndex) return { ...step, status: "failed" };
      return { ...step, status: "pending" };
    }
    if (index < currentIndex) return { ...step, status: "done" };
    if (index === currentIndex) return { ...step, status: "running" };
    return { ...step, status: "pending" };
  });
}

function buildInitialState(projectName: string): DeployState {
  return {
    projectName,
    liveUrl: `${projectName}.zenithos.app`,
    status: "queued",
    startedAt: Date.now(),
    finishedAt: null,
    errorMessage: null,
    isFinalizing: false,
    steps: buildStepsFromIndex(0, "queued"),
    logs: [],
    framework: "detecting...",
    queuePosition: 0,
    queueTotal: 0,
  };
}

function useQueryParam(name: string): string | null {
  const [location] = useLocation();
  void location;
  const search = typeof window !== "undefined" ? window.location.search : "";
  return new URLSearchParams(search).get(name);
}

function inferStepIndex(line: string): number {
  const normalized = line.toLowerCase();
  if (normalized.includes("cloning repository") || normalized.startsWith("cloning into") || normalized.includes("cloning repo")) return 0;
  if (normalized.includes("installing dependencies") || normalized.includes("installing packages") || normalized.includes("installing monorepo dependencies") || normalized.includes("installing next.js")) return 1;
  if (normalized.includes("building project") || normalized.includes("building...") || normalized.includes("building next.js") || normalized.includes("building:")) return 2;
  if (normalized.includes("starting server") || normalized.startsWith("container:") || normalized.includes("docker run")) return 3;
  if (normalized.includes("live at") || normalized.includes("deployment complete") || normalized.includes("success")) return 4;
  return -1;
}

function withProtocol(url: string): string {
  return normalizeUrlForDisplay(url);
}

export default function Deploying() {
  const defaultProjectName = useQueryParam("name") || "my-project";
  const repo = useQueryParam("repo") || "";
  const [projectName, setProjectName] = useState(defaultProjectName);

  useEffect(() => {
    if (defaultProjectName) {
      setProjectName(defaultProjectName);
    }
  }, [defaultProjectName]);

  const retryPath = useMemo(() => {
    if (!repo) return "/import";
    return `/deploying?name=${encodeURIComponent(projectName)}&repo=${encodeURIComponent(repo)}`;
  }, [projectName, repo]);

  const [state, setState] = useState<DeployState>(() => buildInitialState(projectName));
  const [step, setStep] = useState<"configure" | "deploying">("configure");

  useEffect(() => {
    setState(buildInitialState(projectName));
  }, [projectName]);

  useEffect(() => {
    if (state.status !== "live" && state.status !== "failed") return;
    saveProject({
      name: state.projectName,
      domain: normalizeDomainForStorage(state.liveUrl),
      status: state.status,
      repo: repo || undefined,
      framework: state.framework,
    });
  }, [state.status, state.projectName, state.liveUrl]);

  useEffect(() => {
    if (step !== "deploying") return;

    if (!repo) {
      setState((c) => ({
        ...c,
        status: "failed",
        finishedAt: Date.now(),
        errorMessage: "GitHub repository URL is missing. Go back and try again.",
        steps: buildStepsFromIndex(0, "failed"),
      }));
      return;
    }

    setState((c) => ({
      ...c,
      status: "building",
      startedAt: c.startedAt ?? Date.now(),
      errorMessage: null,
      isFinalizing: false,
      logs: [],
      steps: buildStepsFromIndex(0, "building"),
    }));

    let currentStepIndex = 0;

    const cleanup = streamDeployment(
      repo,
      (event: StreamEvent) => {
        if (event.type === "queued") {
          setState((c) => ({
            ...c,
            status: "queued",
            queuePosition: event.position,
            queueTotal: event.total,
          }));
        } else if (event.type === "log") {
          const line = event.line;
          const inferred = inferStepIndex(line);
          if (inferred >= 0 && inferred >= currentStepIndex) currentStepIndex = inferred;

          // Detect framework from log line
          const fmMatch = line.match(/Framework detected:\s*(\S+)/);

          setState((c) => ({
            ...c,
            status: "building",
            queuePosition: 0,
            logs: [...c.logs, line],
            steps: buildStepsFromIndex(currentStepIndex, "building"),
            framework: fmMatch ? fmMatch[1] : c.framework,
          }));
        } else if (event.type === "done") {
          const liveUrl = event.url ? normalizeDomainForStorage(event.url) : normalizeDomainForStorage(`${projectName}.zenithos.app`);
          const fw = event.framework || "unknown";

          if (event.success) {
            setState((c) => ({
              ...c,
              liveUrl,
              status: "building",
              isFinalizing: true,
              framework: fw,
              steps: buildStepsFromIndex(4, "building"),
              logs: [...c.logs, "", "→ Finalizing public URL...", "→ Waiting for the site to become reachable..."],
            }));
            setTimeout(() => {
              setState((c) => ({
                ...c,
                liveUrl,
                status: "live",
                isFinalizing: false,
                finishedAt: Date.now(),
                framework: fw,
                errorMessage: null,
                steps: buildStepsFromIndex(4, "live"),
              }));
            }, 4000);
          } else {
            setState((c) => {
              const errorLines = c.logs.filter((l) => /error|fail|exit|cannot|not found/i.test(l));
              const errorMessage =
                event.error ||
                (errorLines.length > 0 ? errorLines.slice(-3).join("\n") : null) ||
                (c.logs.length > 0 ? c.logs.slice(-3).join("\n") : "Deployment failed. Check logs for details.");
              return {
                ...c,
                liveUrl,
                status: "failed",
                isFinalizing: false,
                finishedAt: Date.now(),
                framework: fw,
                errorMessage,
                steps: buildStepsFromIndex(currentStepIndex, "failed"),
              };
            });
          }
        }
      },
      (err) => {
        setState((c) => ({
          ...c,
          status: "failed",
          isFinalizing: false,
          finishedAt: Date.now(),
          errorMessage: err.message,
          logs: [...c.logs, `✗ ${err.message}`],
          steps: buildStepsFromIndex(currentStepIndex, "failed"),
        }));
      },
      projectName
    );

    return cleanup;
  }, [repo, projectName, step]);

  return (
    <AnimatePresence mode="wait">
      {step === "configure" ? (
        <motion.div key="configure" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
          <ConfigureScreen 
            repoUrl={repo} 
            defaultProjectName={projectName} 
            onDeploy={(newName) => {
              setProjectName(newName);
              setStep("deploying");
            }} 
          />
        </motion.div>
      ) : (
        <motion.div key="deploy-flow" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          {state.status === "live" ? <SuccessScreen state={state} /> :
           state.status === "failed" ? <FailedScreen state={state} retryPath={retryPath} /> :
           state.status === "queued" && state.queuePosition > 1 ? <QueuedScreen state={state} /> :
           <BuildingScreen state={state} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QueuedScreen({ state }: { state: DeployState }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const pos = state.queuePosition;

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-6 py-14 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
            <Inbox className="w-9 h-9 text-white drop-shadow" />
          </div>
          <span className="absolute -top-2 -right-2 min-w-[26px] h-[26px] rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow">
            {pos}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Queued for Deployment
        </h1>
        <p className="text-sm text-slate-500 mb-1">
          <span className="font-semibold text-slate-700">{state.projectName}</span> is position{" "}
          <span className="font-bold text-amber-600">#{pos}</span> in the deploy queue.
        </p>
        <p className="text-xs text-slate-400 mb-8">
          Another deployment is currently running. Yours will start automatically when it finishes.
        </p>

        <div className="w-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden mb-6">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-white">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{state.projectName}</p>
              <p className="text-xs text-slate-400 font-mono truncate">{state.liveUrl}</p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Queued #{pos}
            </span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between text-sm">
            <span className="text-slate-500">Waiting time</span>
            <span className="font-mono font-semibold text-slate-700">
              {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          Waiting for the current deployment to finish…
        </div>
      </div>
    </PageShell>
  );
}

function BuildingScreen({ state }: { state: DeployState }) {
  const [elapsed, setElapsed] = useState(0);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const logContainerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!state.startedAt) return;
    const startedAt = state.startedAt;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [state.startedAt]);

  // Group logs
  const groupedLogs = useMemo(() => {
    const groups: string[][] = Array(STEP_DEFINITIONS.length).fill(null).map(() => []);
    let currentStep = 0;
    for (const line of state.logs) {
      const inferred = inferStepIndex(line);
      if (inferred >= 0 && inferred > currentStep) {
        currentStep = inferred;
      }
      groups[currentStep].push(line);
    }
    return groups;
  }, [state.logs]);

  // Auto-expand the currently running step
  useEffect(() => {
    if (state.status === "building") {
      const runningIdx = state.steps.findIndex(s => s.status === "running");
      if (runningIdx >= 0) {
        setExpandedStep(runningIdx);
      }
    }
  }, [state.steps, state.status]);

  // Auto scroll logs
  useEffect(() => {
    if (expandedStep !== null && logContainerRefs.current[expandedStep]) {
      const el = logContainerRefs.current[expandedStep];
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [state.logs, expandedStep]);

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col items-center">
        <div className="w-full bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] p-6 md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Deployment</h1>

          <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            <span>Deployment started {elapsed}s ago...</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            {state.steps.map((step, idx) => {
              const isExpanded = expandedStep === idx;
              const stepLogs = groupedLogs[idx] || [];

              return (
                <div key={step.key} className={`border-b border-slate-200 last:border-0 ${isExpanded ? "bg-slate-50/50" : "bg-white"} transition-colors`}>
                  <button 
                    onClick={() => setExpandedStep(isExpanded ? null : idx)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                    <span className={`text-sm font-medium flex-1 ${step.status === "pending" ? "text-slate-400" : "text-slate-700"}`}>
                      {step.label}
                    </span>
                    <div className="shrink-0">
                      {step.status === "done" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : step.status === "running" ? (
                        <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                      ) : step.status === "failed" ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4">
                       <div 
                         ref={(el) => { logContainerRefs.current[idx] = el; }}
                         className="bg-white border border-slate-200 rounded-lg p-3 max-h-64 overflow-y-auto font-mono text-[12px] leading-relaxed space-y-0.5 shadow-sm"
                       >
                         {stepLogs.length === 0 ? (
                           <div className="text-slate-400 italic">Waiting for logs...</div>
                         ) : (
                           stepLogs.map((line, i) => (
                             <div
                                key={i}
                                className={
                                  /error|fail|exit code [^0]/i.test(line)
                                    ? "text-red-500 font-medium"
                                    : /warn/i.test(line)
                                      ? "text-amber-500"
                                      : /success|complete|live at|framework detected/i.test(line)
                                        ? "text-emerald-500"
                                        : line.startsWith("→")
                                          ? "text-sky-500"
                                          : line.startsWith("=")
                                            ? "text-violet-500 font-semibold"
                                            : "text-slate-600"
                                }
                              >
                                {line || "\u00A0"}
                              </div>
                           ))
                         )}
                         {step.status === "running" && (
                            <div className="flex items-center gap-1.5 text-sky-500 mt-1">
                              <span className="animate-pulse">█</span>
                            </div>
                         )}
                       </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-2 text-[13px] text-slate-500 font-mono truncate max-w-[60%]">
              <GitBranch className="w-3.5 h-3.5" />
              <span className="truncate">Deploying from main - {state.projectName}</span>
            </div>
            
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Cancel Deployment
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function SuccessScreen({ state }: { state: DeployState }) {
  const [copied, setCopied] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const fullUrl = withProtocol(state.liveUrl);

  useEffect(() => {
    // Wait 10 seconds for SSL/Nginx configuration to propagate on the server
    const timer = setTimeout(() => {
      setPreviewReady(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  function copy() {
    navigator.clipboard?.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-slate-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
            <span className="font-semibold text-slate-900 text-sm flex-1">{state.projectName}</span>
            {state.framework && state.framework !== "unknown" && (
              <span className="text-[11px] font-mono bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-full">
                {state.framework}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" /> Live
            </span>
          </div>

          <div className="px-6 py-8 text-center border-b border-slate-100 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-50/60 to-transparent pointer-events-none" />
            
            <h1 className="relative text-2xl font-bold text-slate-900 tracking-tight mb-2 mt-4">Congratulations!</h1>
            <p className="relative text-sm text-slate-600 mb-8">
              You just deployed a new project to <span className="font-semibold text-slate-800">your ZenithOS</span>.
            </p>

            <div className="relative mx-auto w-full max-w-[560px] aspect-[16/10] bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-sm group">
               {/* Browser Top Bar */}
               <div className="absolute top-0 inset-x-0 h-6 bg-slate-100 border-b border-slate-200 flex items-center px-2 gap-1.5 z-10">
                 <div className="w-2 h-2 rounded-full bg-red-400" />
                 <div className="w-2 h-2 rounded-full bg-amber-400" />
                 <div className="w-2 h-2 rounded-full bg-emerald-400" />
                 {previewReady && (
                   <button 
                     onClick={() => {
                       setPreviewReady(false);
                       setTimeout(() => setPreviewReady(true), 500);
                     }}
                     className="ml-auto text-[10px] text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none focus:outline-none"
                   >
                     <RefreshCw className="w-2.5 h-2.5" /> Refresh Preview
                   </button>
                 )}
               </div>
               
               {/* Iframe wrapped for desktop simulation */}
               <div className="absolute top-6 inset-x-0 bottom-0 overflow-hidden bg-white">
                 {!previewReady ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-3 p-4 z-10">
                     <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                     <p className="text-xs font-medium animate-pulse">Securing connection & loading preview...</p>
                   </div>
                 ) : (
                   <div className="w-[200%] h-[200%] origin-top-left scale-[0.5] pointer-events-none bg-white">
                     <iframe 
                       src={fullUrl} 
                       className="w-full h-full border-none overflow-hidden" 
                       title="Deployment Preview"
                       scrolling="no"
                       loading="lazy"
                       sandbox="allow-scripts allow-same-origin"
                     />
                   </div>
                 )}
               </div>
            </div>
          </div>

          <div className="px-6 py-5 border-b border-slate-100">
            <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-2">
              <Globe className="w-3 h-3" /> Live URL
            </label>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <a
                href={fullUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-sm font-mono text-slate-800 hover:text-sky-600 transition-colors truncate"
              >
                {fullUrl}
              </a>
              <button
                onClick={copy}
                className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors"
              >
                {copied ? <><Check className="w-3 h-3 text-emerald-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-5 py-4 bg-slate-50/60">
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 active:bg-slate-950 transition-colors shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" /> Visit Site <ExternalLink className="w-3 h-3" />
            </a>
            <Link
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
            >
              Back
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-5">
          Manage your deployments from your{" "}
          <Link href="/dashboard" className="text-sky-500 hover:underline font-medium">dashboard</Link>.
        </p>
        <p className="text-center text-xs text-slate-400 mt-2">
          If the first load still shows an old page, wait a few seconds and refresh once.
        </p>
      </div>
    </PageShell>
  );
}

function FailedScreen({ state, retryPath }: { state: DeployState; retryPath: string }) {
  const [logsOpen, setLogsOpen] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  const failedStep = state.steps.find((step) => step.status === "failed");

  useEffect(() => {
    if (logsOpen && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logsOpen, state.logs]);

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-slate-100">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
            <span className="font-semibold text-slate-900 text-sm flex-1">{state.projectName}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <XCircle className="w-3 h-3" /> Failed
            </span>
          </div>

          <div className="px-6 py-8 text-center border-b border-slate-100 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-red-50/60 to-transparent pointer-events-none" />
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full bg-red-400/30 blur-xl" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-200">
                <AlertTriangle className="w-8 h-8 text-white drop-shadow" />
              </div>
            </div>
            <h1 className="relative text-xl font-bold text-slate-900 tracking-tight">Deployment Failed</h1>
            <p className="relative text-sm text-slate-500 mt-1.5">
              {failedStep ? `Stopped at "${failedStep.label}"` : "Something went wrong during deployment"}
            </p>
          </div>

          {state.errorMessage && (
            <div className="px-6 py-5 border-b border-slate-100">
              <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-2">
                <AlertTriangle className="w-3 h-3 text-red-400" /> Error
              </label>
              <div className="p-3 rounded-xl bg-red-50/60 border border-red-100">
                <code className="block text-[13px] font-mono text-red-700 whitespace-pre-wrap break-words leading-relaxed">
                  {state.errorMessage}
                </code>
              </div>
            </div>
          )}

          <div className="border-b border-slate-100">
            <button
              onClick={() => setLogsOpen(!logsOpen)}
              className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors group"
            >
              <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-white border border-slate-200 flex items-center justify-center transition-colors">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                </span>
                View Logs ({state.logs.length} lines)
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${logsOpen ? "rotate-180" : ""}`} />
            </button>
            {logsOpen && (
              <div className="px-6 pb-5">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <TerminalIcon className="w-3 h-3 text-slate-500" />
                    <span className="text-[11px] font-mono text-slate-500">deploy log</span>
                  </div>
                  <div ref={terminalRef} className="p-3 max-h-64 overflow-y-auto font-mono text-[12px] leading-relaxed space-y-0.5">
                    {state.logs.map((line, i) => (
                      <div
                        key={i}
                        className={
                          /error|fail|exit code [^0]/i.test(line)
                            ? "text-red-500 font-medium"
                            : /warn/i.test(line)
                              ? "text-amber-500"
                              : /success|complete|live at/i.test(line)
                                ? "text-emerald-500"
                                : "text-slate-600"
                        }
                      >
                        {line || "\u00A0"}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 px-5 py-4 bg-slate-50/60">
            <Link
              href={retryPath}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Deploy
            </Link>
            <Link
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-sm font-medium text-slate-800">Deploying</span>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <Zap className="w-3.5 h-3.5 text-sky-400" />
          ZenithOS
        </div>
      </div>
      <div className="py-6">{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: DeployStatus }) {
  if (status === "live")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" /> Live
      </span>
    );
  if (status === "failed")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
        <XCircle className="w-3.5 h-3.5" /> Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Building
    </span>
  );
}

function StepItem({ num, step, isLast }: { num: number; step: DeployStep; isLast: boolean }) {
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!isLast && <div className="absolute left-[15px] top-6 bottom-0 w-px bg-slate-100" />}
      <div className="shrink-0 mt-0.5">
        {step.status === "done" ? (
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-200">
            <Check className="w-3.5 h-3.5 text-white" />
          </span>
        ) : step.status === "running" ? (
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-sky-500 shadow-sm shadow-sky-200">
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          </span>
        ) : step.status === "failed" ? (
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-red-500 shadow-sm shadow-red-200">
            <XCircle className="w-3.5 h-3.5 text-white" />
          </span>
        ) : (
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-slate-100 border border-slate-200">
            <Circle className="w-3 h-3 text-slate-300" />
          </span>
        )}
      </div>
      <div className="pt-0.5 min-w-0">
        <p
          className={`text-sm font-medium ${step.status === "done" ? "text-emerald-700" :
            step.status === "running" ? "text-sky-700" :
              step.status === "failed" ? "text-red-700" :
                "text-slate-400"
            }`}
        >
          {num}. {step.label}
        </p>
      </div>
    </li>
  );
}

function Terminal({
  logs,
  live,
  terminalRef,
}: {
  logs: string[];
  live: boolean;
  terminalRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-full min-h-0 shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50 shrink-0">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <TerminalIcon className="w-3.5 h-3.5 text-slate-500 ml-1" />
        <span className="text-[11px] font-mono text-slate-500">deploy log</span>
        {live && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
          </span>
        )}
      </div>
      <div
        ref={terminalRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-[12.5px] leading-relaxed space-y-0.5 bg-white"
      >
        {logs.length === 0 ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Connecting to deploy server...</span>
          </div>
        ) : (
          logs.map((line, i) => (
            <div
              key={i}
              className={
                /error|fail|exit code [^0]/i.test(line)
                  ? "text-red-500 font-medium"
                  : /warn/i.test(line)
                    ? "text-amber-500"
                    : /success|complete|live at|framework detected/i.test(line)
                      ? "text-emerald-500"
                      : line.startsWith("→")
                        ? "text-sky-500"
                        : line.startsWith("=")
                          ? "text-violet-500 font-semibold"
                          : "text-slate-600"
              }
            >
              {line || "\u00A0"}
            </div>
          ))
        )}
        {live && logs.length > 0 && (
          <div className="flex items-center gap-1.5 text-sky-500 mt-1">
            <span className="animate-pulse">█</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Keep these for unused import suppression
void Inbox;
void Zap;

function ConfigureScreen({ repoUrl, defaultProjectName, onDeploy }: { repoUrl: string; defaultProjectName: string; onDeploy: (newName: string) => void }) {
  const [, navigate] = useLocation();
  const repoPath = repoUrl ? repoUrl.replace("https://github.com/", "") : "imasis07/my-awesome-app";
  
  const [buildOpen, setBuildOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);
  
  const [projectName, setProjectName] = useState(defaultProjectName);
  const [framework, setFramework] = useState("Vite");
  const [rootDir, setRootDir] = useState("./");
  
  const [buildCommand, setBuildCommand] = useState("npm run build");
  const [buildOverride, setBuildOverride] = useState(false);
  
  const [outputDir, setOutputDir] = useState("dist");
  const [outputOverride, setOutputOverride] = useState(false);
  
  const [envVars, setEnvVars] = useState([{ key: "", value: "" }]);
  
  const [leakProtection, setLeakProtection] = useState(true);
  const [firewall, setFirewall] = useState(true);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-200 shadow-sm text-zinc-900 font-sans">
        
        {/* 1. REPO SUMMARY HEADER */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <Github className="w-6 h-6 text-zinc-900" />
            <h2 className="text-lg font-semibold">{repoPath}</h2>
            <span className="bg-zinc-100 text-zinc-600 rounded text-xs font-medium px-2 py-0.5">main</span>
          </div>
          <a href={repoUrl || "#"} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
            {repoUrl || "https://github.com/imasis07/my-awesome-app"}
          </a>
        </div>

        {/* 2. GENERAL SETTINGS */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Project Name</label>
            <input 
              type="text" 
              value={projectName} 
              onChange={e => setProjectName(e.target.value)} 
              className="h-9 w-full rounded-lg border border-zinc-300 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
            />
            <p className="text-sm text-zinc-500 mt-1.5">Used to identify your project</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Framework Preset</label>
            <select 
              value={framework} 
              onChange={e => setFramework(e.target.value)} 
              className="h-9 w-full rounded-lg border border-zinc-300 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all bg-white"
            >
              <option value="Vite">Vite</option>
              <option value="Next.js">Next.js</option>
              <option value="React">React</option>
              <option value="Node.js">Node.js</option>
              <option value="Vue">Vue</option>
              <option value="Svelte">Svelte</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Root Directory</label>
            <input 
              type="text" 
              value={rootDir} 
              onChange={e => setRootDir(e.target.value)} 
              className="h-9 w-full rounded-lg border border-zinc-300 text-sm px-3 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
            />
            <p className="text-sm text-zinc-500 mt-1.5">The directory within your repository where your code is located</p>
          </div>
        </div>

        {/* 3. BUILD SETTINGS */}
        <div className="p-6">
          <button onClick={() => setBuildOpen(!buildOpen)} className="w-full flex items-center gap-2 text-sm font-medium">
            <ChevronDown className={`w-4 h-4 transition-transform ${buildOpen ? "rotate-180" : ""}`} />
            Build Settings
          </button>
          <AnimatePresence>
            {buildOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-5 space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium">Build Command</label>
                      <label className="flex items-center gap-2 text-sm text-zinc-600">
                        <input type="checkbox" checked={buildOverride} onChange={e => setBuildOverride(e.target.checked)} className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
                        Override
                      </label>
                    </div>
                    <input 
                      type="text" 
                      value={buildCommand} 
                      onChange={e => setBuildCommand(e.target.value)} 
                      disabled={!buildOverride}
                      className="h-9 w-full rounded-lg border border-zinc-300 text-sm px-3 font-mono disabled:bg-zinc-50 disabled:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium">Output Directory</label>
                      <label className="flex items-center gap-2 text-sm text-zinc-600">
                        <input type="checkbox" checked={outputOverride} onChange={e => setOutputOverride(e.target.checked)} className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
                        Override
                      </label>
                    </div>
                    <input 
                      type="text" 
                      value={outputDir} 
                      onChange={e => setOutputDir(e.target.value)} 
                      disabled={!outputOverride}
                      className="h-9 w-full rounded-lg border border-zinc-300 text-sm px-3 font-mono disabled:bg-zinc-50 disabled:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. ENVIRONMENT VARIABLES */}
        <div className="p-6">
          <button onClick={() => setEnvOpen(!envOpen)} className="w-full flex items-center gap-2 text-sm font-medium">
            <ChevronDown className={`w-4 h-4 transition-transform ${envOpen ? "rotate-180" : ""}`} />
            Environment Variables
          </button>
          <AnimatePresence>
            {envOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-5 space-y-3">
                  {envVars.map((env, i) => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="KEY"
                        value={env.key} 
                        onChange={e => { const newVars = [...envVars]; newVars[i].key = e.target.value; setEnvVars(newVars); }}
                        className="h-9 w-full rounded-lg border border-zinc-300 text-sm px-3 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                      <input 
                        type="text" 
                        placeholder="VALUE"
                        value={env.value} 
                        onChange={e => { const newVars = [...envVars]; newVars[i].value = e.target.value; setEnvVars(newVars); }}
                        className="h-9 w-full rounded-lg border border-zinc-300 text-sm px-3 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                  ))}
                  <button 
                    onClick={() => setEnvVars([...envVars, { key: "", value: "" }])}
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 mt-2 hover:opacity-70 transition-opacity"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5. ADVANCED SECURITY */}
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Secret Leak Protection</p>
              <p className="text-sm text-zinc-500">Automatically scan and prevent secrets from being exposed in logs and deployments</p>
            </div>
            <button 
              onClick={() => setLeakProtection(!leakProtection)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${leakProtection ? 'bg-zinc-900' : 'bg-zinc-200'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${leakProtection ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Advanced DDoS Firewall</p>
              <p className="text-sm text-zinc-500">Enable intelligent traffic filtering and rate limiting at the edge</p>
            </div>
            <button 
              onClick={() => setFirewall(!firewall)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${firewall ? 'bg-zinc-900' : 'bg-zinc-200'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${firewall ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

      </div>

      {/* 6. ACTION BUTTONS */}
      <div className="flex items-center justify-end gap-3">
        <button 
          onClick={() => navigate("/import")}
          className="h-9 px-4 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={async () => {
            const btn = document.getElementById("deploy-btn");
            if (btn) btn.innerHTML = "Configuring...";
            try {
              await fetch("/api-proxy/deploy/configure", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("cloudrik-token")}`
                },
                body: JSON.stringify({
                  projectName,
                  framework,
                  rootDir,
                  buildCommand,
                  buildOverride,
                  outputDir,
                  outputOverride,
                  envVars,
                  leakProtection,
                  firewall
                })
              });
              onDeploy(projectName);
            } catch (err) {
              console.error(err);
              if (btn) btn.innerHTML = "Deploy";
            }
          }}
          id="deploy-btn"
          className="h-9 px-6 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm active:scale-95 min-w-[100px]"
        >
          Deploy
        </button>
      </div>
    </div>
  );
}
