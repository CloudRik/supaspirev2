import { useEffect, useMemo, useRef, useState } from "react";
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
  if (normalized.includes("clone") || normalized.includes("cloning") || normalized.includes("repository")) return 0;
  if (normalized.includes("install") || normalized.includes("npm") || normalized.includes("pnpm") || normalized.includes("yarn") || normalized.includes("dependencies") || normalized.includes("pip install") || normalized.includes("bundle install")) return 1;
  if (normalized.includes("build") || normalized.includes("bundl") || normalized.includes("compil") || normalized.includes("vite") || normalized.includes("webpack")) return 2;
  if (normalized.includes("start") || normalized.includes("server") || normalized.includes("running") || normalized.includes("container") || normalized.includes("port") || normalized.includes("docker run")) return 3;
  if (normalized.includes("live at") || normalized.includes("deployment complete") || normalized.includes("live") || normalized.includes("success")) return 4;
  return -1;
}

function withProtocol(url: string): string {
  return normalizeUrlForDisplay(url);
}

export default function Deploying() {
  const projectName = useQueryParam("name") || "my-project";
  const repo = useQueryParam("repo") || "";
  const retryPath = useMemo(() => {
    if (!repo) return "/import";
    return `/deploying?name=${encodeURIComponent(projectName)}&repo=${encodeURIComponent(repo)}`;
  }, [projectName, repo]);

  const [state, setState] = useState<DeployState>(() => buildInitialState(projectName));

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
      }
    );

    return cleanup;
  }, [repo, projectName]);

  if (state.status === "live") return <SuccessScreen state={state} />;
  if (state.status === "failed") return <FailedScreen state={state} retryPath={retryPath} />;
  if (state.status === "queued" && state.queuePosition > 1) return <QueuedScreen state={state} />;
  return <BuildingScreen state={state} />;
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
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.startedAt) return;
    const startedAt = state.startedAt;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [state.startedAt]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [state.logs]);

  const doneCount = state.steps.filter((step) => step.status === "done").length;
  const activeCount = state.steps.some((step) => step.status === "running") ? doneCount + 1 : doneCount;
  const overallProgress = Math.round((activeCount / state.steps.length) * 100);

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-6 py-6 h-full flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Deployment</span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
              </span>
              {state.framework && state.framework !== "detecting..." && state.framework !== "unknown" && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] font-mono bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-full">
                    {state.framework}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 truncate flex items-center gap-2 flex-wrap">
              {state.projectName}
              <span className="text-slate-300 font-normal">·</span>
              <span className="text-sm font-mono text-sky-600 flex items-center gap-1 break-all">
                {state.liveUrl}
              </span>
            </h1>
          </div>
          <StatusPill status={state.status} />
        </div>

        <div className="mb-5">
          <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${overallProgress}%` }}
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-400"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-[7fr_3fr] gap-5 flex-1 min-h-0 h-[32rem]">
          <Terminal logs={state.logs} live={state.status === "building"} terminalRef={terminalRef} />

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden h-full min-h-0">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
              <Rocket className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Deployment Steps</h2>
              <span className="ml-auto text-[11px] font-mono text-slate-400">{doneCount}/{state.steps.length}</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
              <ol className="relative">
                {state.steps.map((step, idx) => (
                  <StepItem key={step.key} num={idx + 1} step={step} isLast={idx === state.steps.length - 1} />
                ))}
              </ol>
            </div>
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center justify-center gap-2 h-10 text-xs font-medium text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" />
                {state.isFinalizing
                  ? "Finalizing live site..."
                  : state.logs.length === 0
                  ? "Connecting to deploy server..."
                  : "Live deploy logs streaming..."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function SuccessScreen({ state }: { state: DeployState }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = withProtocol(state.liveUrl);

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
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <PartyPopper className="w-8 h-8 text-white drop-shadow" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white shadow-sm" />
            </div>
            <h1 className="relative text-xl font-bold text-slate-900 tracking-tight">Deployment Successful!</h1>
            <p className="relative text-sm text-slate-500 mt-1.5">Your project is now live and ready to share</p>
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
              Back to Projects
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
                <div className="bg-[#0b1020] border border-slate-800 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/80 bg-[#0a0f1c]">
                    <TerminalIcon className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] font-mono text-slate-400">deploy log</span>
                  </div>
                  <div ref={terminalRef} className="p-3 max-h-64 overflow-y-auto font-mono text-[12px] leading-relaxed space-y-0.5">
                    {state.logs.map((line, i) => (
                      <div
                        key={i}
                        className={
                          /error|fail|exit code [^0]/i.test(line)
                            ? "text-red-400"
                            : /warn/i.test(line)
                            ? "text-amber-400"
                            : /success|complete|live at/i.test(line)
                            ? "text-emerald-400"
                            : "text-slate-300"
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
              Back to Projects
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
          <ArrowLeft className="w-4 h-4" /> Projects
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
          className={`text-sm font-medium ${
            step.status === "done" ? "text-emerald-700" :
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
    <div className="bg-[#0b1020] border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full min-h-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/80 bg-[#0a0f1c] shrink-0">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-amber-400/70" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
        </div>
        <TerminalIcon className="w-3.5 h-3.5 text-slate-500 ml-1" />
        <span className="text-[11px] font-mono text-slate-500">deploy log</span>
        {live && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
          </span>
        )}
      </div>
      <div
        ref={terminalRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-[12.5px] leading-relaxed space-y-0.5"
      >
        {logs.length === 0 ? (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Connecting to deploy server...</span>
          </div>
        ) : (
          logs.map((line, i) => (
            <div
              key={i}
              className={
                /error|fail|exit code [^0]/i.test(line)
                  ? "text-red-400"
                  : /warn/i.test(line)
                  ? "text-amber-400"
                  : /success|complete|live at|framework detected/i.test(line)
                  ? "text-emerald-400"
                  : line.startsWith("→")
                  ? "text-sky-400"
                  : line.startsWith("=")
                  ? "text-violet-400 font-semibold"
                  : "text-slate-300"
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
