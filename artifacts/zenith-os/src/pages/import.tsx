import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Github,
  Upload,
  FileArchive,
  Rocket,
  ChevronDown,
  Folder,
  Terminal,
  FolderOutput,
  Sparkles,
  Link2,
  CheckCircle2,
  X,
  Globe,
  Search,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getAuthToken } from "@/lib/projects";

export default function Import() {
  const [, navigate] = useLocation();
  const [repoUrl, setRepoUrl]           = useState("");
  const [zipFile, setZipFile]           = useState<File | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [projectName, setProjectName]   = useState("");
  const [buildCommand, setBuildCommand] = useState("npm run build");
  const [outputDir, setOutputDir]       = useState("dist");
  const [dragActive, setDragActive]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GitHub Integration States
  const [gitConnected, setGitConnected] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);

  const autoName = (() => {
    if (repoUrl) {
      const match = repoUrl.match(/github\.com\/[^/]+\/([^/.\s]+)/);
      if (match) return match[1];
    }
    if (zipFile) return zipFile.name.replace(/\.zip$/i, "");
    return "";
  })();

  const effectiveName = projectName || autoName;
  const activeSource  = repoUrl.trim() ? "github" : zipFile ? "zip" : null;
  const canDeploy     = repoUrl.trim().length > 0 || zipFile !== null;

  // GitHub Connection Status Verification
  const fetchStatus = () => {
    const token = getAuthToken();
    fetch("/api-proxy/api/auth/github/status", {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        setGitConnected(data.connected);
        if (data.connected) {
          fetchRepos();
        }
      })
      .catch((err) => console.error("Error loading GitHub status", err));
  };

  const fetchRepos = () => {
    setLoadingRepos(true);
    const token = getAuthToken();
    fetch("/api-proxy/api/github/repos", {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setRepos(data);
        setLoadingRepos(false);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error("Error fetching repos", err);
        setLoadingRepos(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchStatus();

    // Listen for auth message from popup window
    const handleAuthMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "GITHUB_AUTH_SUCCESS") {
        setGitConnected(true);
        fetchRepos();
      }
    };
    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, []);

  const handleConnectGitHub = () => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const token = getAuthToken();
    window.open(
      `/api-proxy/api/auth/github${token ? `?token=${encodeURIComponent(token)}` : ''}`,
      "GitHub Authorization",
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  const handleDisconnect = () => {
    setDisconnectConfirmOpen(true);
  };

  const confirmDisconnect = () => {
    const token = getAuthToken();
    fetch("/api-proxy/api/auth/github/disconnect", { 
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(() => {
        setGitConnected(false);
        setRepos([]);
        setDisconnectConfirmOpen(false);
      })
      .catch(err => console.error(err));
  };

  const handleSelectRepo = (url: string, repoName: string) => {
    navigate(`/deploying?name=${encodeURIComponent(repoName)}&repo=${encodeURIComponent(url.trim())}`);
  };

  function startDeploy() {
    if (!canDeploy) return;
    const name = effectiveName || "my-project";
    if (activeSource === "github") {
      navigate(`/deploying?name=${encodeURIComponent(name)}&repo=${encodeURIComponent(repoUrl.trim())}`);
    } else {
      navigate(`/deploying?name=${encodeURIComponent(name)}`);
    }
  }

  function handleFile(file: File | null) {
    if (!file || !file.name.toLowerCase().endsWith(".zip")) return;
    setZipFile(file);
    if (repoUrl) setRepoUrl("");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  // Filter repos based on search query
  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell activeNav="Projects">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── Page Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-300/40">
              <Rocket className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deploy a Project</h1>
          </div>
          <p className="text-sm text-slate-500 ml-12">
            Paste a public GitHub repo, upload a ZIP, or link your private GitHub account
          </p>
        </motion.div>

        {/* ── Main Layout Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* ── Left Column: Manual Deploy Settings (Col-span: 5) ── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="lg:col-span-5 space-y-8 bg-white/60 backdrop-blur-md border border-slate-200/50 p-6 rounded-3xl shadow-xl shadow-slate-100/50"
          >
            {/* GitHub Import Link */}
            <div className={`transition-opacity duration-300 ${activeSource === "zip" ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
                  <Github className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 leading-none">Import from URL</p>
                  <p className="text-xs text-slate-400 mt-0.5">Any public repository link</p>
                </div>
                {activeSource === "github" && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Selected
                  </motion.span>
                )}
              </div>

              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    if (e.target.value && zipFile) setZipFile(null);
                  }}
                  placeholder="https://github.com/username/repo"
                  className="w-full h-12 pl-10 pr-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 transition-all"
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-slate-300" />
                Provide a repository clone URL or select from your GitHub list
              </p>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold tracking-widest text-slate-400">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* ZIP Upload */}
            <div className={`transition-opacity duration-300 ${activeSource === "github" ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <FileArchive className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 leading-none">Upload ZIP Archive</p>
                  <p className="text-xs text-slate-400 mt-0.5">Drag & drop or browse</p>
                </div>
                {activeSource === "zip" && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Selected
                  </motion.span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />

              <AnimatePresence mode="wait">
                {!zipFile ? (
                  <motion.button
                    key="dropzone"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={onDrop}
                    className={`w-full flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed transition-all ${
                      dragActive
                        ? "border-violet-400 bg-violet-50 scale-[1.01]"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40 shadow-sm"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      dragActive ? "bg-violet-100 border border-violet-200" : "bg-slate-50 border border-slate-200 shadow-sm"
                    }`}>
                      <Upload className={`w-5 h-5 ${dragActive ? "text-violet-500" : "text-slate-400"}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        {dragActive ? "Drop it here!" : (
                          <><span className="text-violet-600 font-bold">Browse files</span> or drag & drop</>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">.zip archives only · max 100MB</p>
                    </div>
                  </motion.button>
                ) : (
                  <motion.div
                    key="file-selected"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shadow-sm shrink-0">
                      <FileArchive className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{zipFile.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {zipFile.size > 1024 * 1024
                          ? `${(zipFile.size / 1024 / 1024).toFixed(1)} MB`
                          : `${(zipFile.size / 1024).toFixed(1)} KB`}
                        &nbsp;·&nbsp;Ready to deploy
                      </p>
                    </div>
                    <button
                      onClick={() => setZipFile(null)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Advanced Settings */}
            <div className="border-t border-slate-200/60 pt-2">
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors py-2 group"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${advancedOpen ? "rotate-0" : "-rotate-90"}`} />
                Advanced Settings
                <span className="text-[11px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-1">Optional</span>
              </button>

              <AnimatePresence initial={false}>
                {advancedOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-4">
                      {[
                        { label: "Project Name", icon: Folder, value: projectName, set: setProjectName, placeholder: autoName || "my-awesome-project", hint: `Auto-filled from name`, mono: false },
                        { label: "Build Command", icon: Terminal, value: buildCommand, set: setBuildCommand, placeholder: "npm run build", hint: null, mono: true },
                        { label: "Output Directory", icon: FolderOutput, value: outputDir, set: setOutputDir, placeholder: "dist", hint: "Default: dist / build", mono: true },
                      ].map(({ label, icon: Icon, value, set, placeholder, hint, mono }) => (
                        <div key={label}>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
                          <div className="relative">
                            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => set(e.target.value)}
                              placeholder={placeholder}
                              className={`w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 transition-all shadow-sm ${mono ? "font-mono" : ""}`}
                            />
                          </div>
                          {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Deploy Button */}
            <div className="pt-2">
              <AnimatePresence>
                {effectiveName && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-center gap-2 text-xs text-slate-500 overflow-hidden"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>
                      Deploying as{" "}
                      <span className="font-bold text-slate-800 font-mono bg-slate-100 px-1.5 py-0.5 rounded-md">{effectiveName}</span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                disabled={!canDeploy}
                onClick={startDeploy}
                className="w-full flex items-center justify-center gap-2.5 h-12 rounded-2xl text-sm font-bold transition-all group disabled:opacity-35 disabled:cursor-not-allowed
                  bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white
                  hover:from-slate-800 hover:via-slate-700 hover:to-slate-800
                  enabled:shadow-lg enabled:shadow-slate-900/20
                  enabled:hover:shadow-xl enabled:hover:shadow-slate-900/30
                  enabled:hover:-translate-y-0.5 enabled:active:translate-y-0"
              >
                <Rocket className="w-4 h-4 transition-transform group-enabled:group-hover:-translate-y-0.5 group-enabled:group-hover:rotate-12" />
                Deploy Project
              </button>

              <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-sky-400" />
                Free · Auto-detected runtime · Live in ~60s
              </p>
            </div>
          </motion.div>

          {/* ── Right Column: GitHub Connection & Repositories (Col-span: 7) ── */}
          <div className="lg:col-span-7 space-y-6">
            {!gitConnected ? (
              // Connect Banner
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center p-12 rounded-3xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/50 shadow-xl shadow-slate-100/50 min-h-[460px]"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10 mb-6">
                  <Github className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Connect GitHub Account</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
                  Link your GitHub account to directly deploy and manage all your public and private repositories in a single click, Vercel-style.
                </p>
                <button
                  onClick={handleConnectGitHub}
                  className="flex items-center gap-2.5 px-6 h-12 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 transition-all shadow-md shadow-slate-900/10 hover:shadow-lg"
                >
                  <Github className="w-4 h-4" />
                  Connect with GitHub
                </button>
              </motion.div>
            ) : (
              // Active Repositories View
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col bg-white border border-slate-200/50 rounded-3xl shadow-xl shadow-slate-100/50 overflow-hidden min-h-[460px]"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Connected to GitHub</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Quickly select a repository to import</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center justify-center px-6 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Search / Refresh Operations */}
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search repositories..."
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-300 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                  <button
                    onClick={() => { setRefreshing(true); fetchRepos(); }}
                    disabled={loadingRepos || refreshing}
                    className="w-10 h-10 rounded-xl border border-slate-200/60 hover:bg-slate-50 flex items-center justify-center text-slate-500 disabled:opacity-40 transition-colors shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingRepos || refreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* Repository Scrollable List */}
                <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100 p-2">
                  {loadingRepos ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-violet-500" />
                      <p className="text-xs font-semibold">Loading your repositories...</p>
                    </div>
                  ) : filteredRepos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-6">
                      <p className="text-sm font-bold text-slate-700">No repositories found</p>
                      <p className="text-xs text-slate-400 mt-1">Try another keyword or refresh the page</p>
                    </div>
                  ) : (
                    filteredRepos.map((repo) => (
                      <div
                        key={repo.full_name}
                        className="flex items-center justify-between p-3 hover:bg-slate-50/70 rounded-2xl transition-all group"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Github className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                            <span className="text-sm font-bold text-slate-800 truncate group-hover:text-violet-600 transition-colors">
                              {repo.name}
                            </span>
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                              repo.private
                                ? "text-amber-700 bg-amber-50 border-amber-200/50"
                                : "text-emerald-700 bg-emerald-50 border-emerald-200/50"
                            }`}>
                              {repo.private ? "Private" : "Public"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate max-w-md">
                            {repo.description || "No description available"}
                          </p>
                          {repo.default_branch && (
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              Branch: <span className="font-mono text-slate-500 font-bold">{repo.default_branch}</span>
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleSelectRepo(repo.html_url, repo.name)}
                          className="px-4 h-9 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                        >
                          Import
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>

        </div>

      </div>

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {disconnectConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full border border-slate-100"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-5 border border-slate-200">
                <X className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Disconnect GitHub?</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                Are you sure you want to disconnect your GitHub account? You will lose access to your private repositories.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDisconnectConfirmOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDisconnect}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/20 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
