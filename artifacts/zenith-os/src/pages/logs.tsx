import { useEffect, useRef, useState, useCallback } from "react";
import { useSearch } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  RefreshCw,
  ChevronDown,
  Terminal,
  AlertTriangle,
  Download,
  Trash2,
  Radio,
  WifiOff,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { fetchProjectsFromServer, type Project } from "@/lib/projects";

const LOGS_URL = "/api-proxy/projects";
const STREAM_URL = "/api-proxy/projects";

type LogLine = { text: string; type: "error" | "warn" | "info" | "plain"; id: number };

let lineCounter = 0;
function makeLine(text: string): LogLine {
  const lower = text.toLowerCase();
  let type: LogLine["type"] = "plain";
  if (/error|exception|fatal|crash|panic/.test(lower)) type = "error";
  else if (/warn|warning|deprecated/.test(lower)) type = "warn";
  else if (/info|started|ready|listening|connected|success|running/.test(lower)) type = "info";
  return { text, type, id: ++lineCounter };
}

const LINE_COLORS: Record<string, string> = {
  error: "text-red-400",
  warn:  "text-amber-400",
  info:  "text-emerald-400",
  plain: "text-slate-300",
};

async function fetchLogs(projectName: string, lines = 200): Promise<string[]> {
  const res = await fetch(`${LOGS_URL}/${encodeURIComponent(projectName)}/logs?lines=${lines}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const data = await res.json() as { logs: string[] };
  return data.logs || [];
}

export default function LogsPage() {
  const search = useSearch();
  const preselect = new URLSearchParams(search).get("project") || "";

  const [projects, setProjects]         = useState<Project[]>([]);
  const [loadingProjects, setLPrj]      = useState(true);
  const [selected, setSelected]         = useState<string>(preselect);
  const [lines, setLines]               = useState<LogLine[]>([]);
  const [loadingLogs, setLoadingLogs]   = useState(false);
  const [streaming, setStreaming]       = useState(false);
  const [connected, setConnected]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lineCount, setLineCount]       = useState(200);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const esRef       = useRef<EventSource | null>(null);
  const autoScrollRef = useRef(true);

  // Load projects once; if no preselect, default to first
  useEffect(() => {
    fetchProjectsFromServer()
      .then((data) => {
        setProjects(data);
        if (!preselect && data.length > 0) setSelected(data[0].name);
      })
      .finally(() => setLPrj(false));
  }, []); // eslint-disable-line

  const scrollBottom = useCallback(() => {
    if (autoScrollRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // One-shot log fetch
  const refreshLogs = useCallback(async () => {
    if (!selected || streaming) return;
    setLoadingLogs(true);
    try {
      const data = await fetchLogs(selected, lineCount);
      setLines(data.map(makeLine));
      setTimeout(scrollBottom, 60);
    } finally {
      setLoadingLogs(false);
    }
  }, [selected, lineCount, streaming, scrollBottom]);

  // Initial load when project changes
  useEffect(() => {
    if (selected && !streaming) refreshLogs();
  }, [selected, lineCount]); // eslint-disable-line

  // Start / stop SSE stream
  function startStream() {
    if (esRef.current) { esRef.current.close(); }
    setLines([]);
    setConnected(false);
    setStreaming(true);

    const url = `${STREAM_URL}/${encodeURIComponent(selected)}/logs/stream?tail=80`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as { type: string; line?: string; message?: string };
        if (msg.type === "log" && msg.line) {
          setLines((prev) => {
            const next = [...prev, makeLine(msg.line!)];
            return next.length > 1000 ? next.slice(-1000) : next;
          });
          setTimeout(scrollBottom, 30);
        }
        if (msg.type === "done" || msg.type === "error") {
          setConnected(false);
        }
      } catch { /* ignore */ }
    };

    es.onerror = () => {
      setConnected(false);
    };
  }

  function stopStream() {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    setStreaming(false);
    setConnected(false);
  }

  // Clean up on unmount or project change
  useEffect(() => {
    return () => { if (esRef.current) { esRef.current.close(); esRef.current = null; } };
  }, [selected]);

  function handleToggleLive() {
    if (streaming) { stopStream(); setTimeout(() => refreshLogs(), 100); }
    else startStream();
  }

  function downloadLogs() {
    const text = lines.map((l) => l.text).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${selected}-logs.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  const selectedProject = projects.find((p) => p.name === selected);

  return (
    <AppShell activeNav="Logs">
      <div className="flex flex-col h-full max-w-6xl mx-auto px-6 py-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Logs</h1>
            <p className="text-sm text-slate-500 mt-0.5">Live container logs from your deployed projects</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Project selector */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-w-[160px]"
              >
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span className="flex-1 text-left truncate">{selected || "Select project"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-11 left-0 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 overflow-hidden"
                  >
                    {loadingProjects ? (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
                      </div>
                    ) : projects.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => {
                          if (streaming) stopStream();
                          setSelected(p.name);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                          p.name === selected ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          p.status === "live" ? "bg-emerald-400" : p.status === "failed" ? "bg-red-400" : "bg-amber-400"
                        }`} />
                        {p.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Lines selector — only when not streaming */}
            {!streaming && (
              <select
                value={lineCount}
                onChange={(e) => setLineCount(Number(e.target.value))}
                className="h-9 px-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
              >
                <option value={50}>50 lines</option>
                <option value={100}>100 lines</option>
                <option value={200}>200 lines</option>
                <option value={500}>500 lines</option>
              </select>
            )}

            {/* Live stream toggle */}
            <button
              onClick={handleToggleLive}
              disabled={!selected}
              className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 ${
                streaming
                  ? "bg-rose-600 border-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/30"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {streaming ? (
                <><Radio className="w-3.5 h-3.5 animate-pulse" /> Stop Live</>
              ) : (
                <><Radio className="w-3.5 h-3.5" /> Go Live</>
              )}
            </button>

            {/* Manual refresh — only when not streaming */}
            {!streaming && (
              <button
                onClick={() => void refreshLogs()}
                disabled={loadingLogs}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                Refresh
              </button>
            )}

            {lines.length > 0 && (
              <>
                <button onClick={downloadLogs} className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors" title="Download">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setLines([])} className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors" title="Clear">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Status bar ── */}
        {selectedProject && (
          <div className="flex items-center gap-3 px-3 py-2 bg-white border border-slate-200 rounded-xl mb-3 text-xs text-slate-500 flex-wrap">
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              selectedProject.status === "live" ? "bg-emerald-400 animate-pulse" : selectedProject.status === "failed" ? "bg-red-400" : "bg-amber-400 animate-pulse"
            }`} />
            <span className="font-mono font-semibold text-slate-800">{selected}</span>
            <span className="text-slate-300">·</span>
            <span>{selectedProject.domain}</span>

            {streaming && (
              <>
                <span className="text-slate-300">·</span>
                {connected ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Streaming live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <WifiOff className="w-3 h-3" /> Connecting…
                  </span>
                )}
              </>
            )}

            {lines.length > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <span>{lines.length} lines</span>
              </>
            )}

            <label className="ml-auto flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScrollRef.current}
                onChange={(e) => { autoScrollRef.current = e.target.checked; }}
                className="accent-sky-500"
              />
              <span>Auto-scroll</span>
            </label>
          </div>
        )}

        {/* ── Terminal window ── */}
        <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col min-h-[420px]">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-2 text-xs font-mono text-slate-400">
              {selected ? `${selected} — logs` : "select a project"}
            </span>
            {streaming && connected && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            )}
            {loadingLogs && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500 ml-auto" />}
          </div>

          {/* Log content */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            {!selected && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600">
                <Terminal className="w-8 h-8 opacity-30" />
                <p>Select a project to view logs</p>
              </div>
            )}
            {selected && loadingLogs && lines.length === 0 && (
              <div className="flex items-center gap-2 text-slate-500 justify-center h-full">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading logs…</span>
              </div>
            )}
            {selected && !loadingLogs && lines.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600">
                <AlertTriangle className="w-6 h-6 opacity-40" />
                <p>No logs — container may be idle</p>
                <button
                  onClick={handleToggleLive}
                  className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  <Radio className="w-3 h-3" /> Start Live Stream
                </button>
              </div>
            )}
            {selected && !loadingLogs && lines.length === 0 && streaming && (
              <div className="flex items-center gap-2 text-slate-500 justify-center h-full">
                <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
                <span>Waiting for new log lines…</span>
              </div>
            )}

            {lines.map((line, i) => (
              <div key={line.id} className={`flex gap-2 ${LINE_COLORS[line.type]} hover:bg-white/5 rounded px-1 -mx-1 py-0.5 group`}>
                <span className="text-slate-700 shrink-0 select-none w-8 text-right group-hover:text-slate-500">{i + 1}</span>
                <span className="break-all whitespace-pre-wrap">{line.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
