import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Plus,
  ArrowRight,
  AlertCircle,
  X,
  Clock,
  Trash2
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { fetchProjectsFromServer, addCustomDomainToServer, removeCustomDomainFromServer, checkCustomDomainStatusFromServer, checkDnsStatusFromServer, type Project } from "@/lib/projects";

// Mock Data Types
type DomainStatus = "active" | "pending_verification" | "failed";

interface CustomDomain {
  id: string;
  domain: string;
  projectId: string;
  projectName: string;
  status: DomainStatus;
  addedAt: number;
}

const EC2_IP = "3.109.177.105";
const CNAME_TARGET = "cname.cloudrik.com";

function isSubdomain(domain: string): boolean {
  const parts = domain.split(".");
  return parts.length > 2;
}

function getSubdomainName(domain: string): string {
  const parts = domain.split(".");
  if (parts.length <= 2) return "@";
  return parts.slice(0, parts.length - 2).join(".");
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }
  return { copied, copy };
}

export default function DomainsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [newDomain, setNewDomain] = useState("");
  const [selectedProject, setSelectedProject] = useState(() => {
    return localStorage.getItem("cloudrik-active-project") || "";
  });
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(false);
  const [dnsState, setDnsState] = useState<{ root: boolean | null, www: boolean | null }>({ root: null, www: null });
  const [listVerifyingId, setListVerifyingId] = useState<string | null>(null);
  
  const { copied, copy } = useCopy();

  async function load() {
    setLoading(true);
    try {
      const data = await fetchProjectsFromServer();
      setProjects(data);
      
      const domainsFromProjects: CustomDomain[] = data
        .filter(p => p.customDomain)
        .map(p => ({
          id: p.name,
          domain: p.customDomain!,
          projectId: p.name,
          projectName: p.name,
          status: p.domainStatus === "active" ? "active" : "pending_verification",
          addedAt: p.deployedAt
        }));
      setCustomDomains(domainsFromProjects);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const saveDomains = (domains: CustomDomain[]) => {
    setCustomDomains(domains);
  };

  const handleStartAddDomain = () => {
    setModalOpen(true);
    setStep(1);
    setNewDomain("");
    setSelectedProject("");
    setVerifyError(false);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setStep(3);
  };

  const handleDone = async () => {
    setVerifying(true);
    await addCustomDomainToServer(selectedProject, newDomain);
    await load(); // reload to show it in pending state
    closeModal();
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyError(false);
    
    // Check DNS status first
    // We haven't added the domain to the project yet on step 3 if they haven't clicked done.
    // Wait, checkDnsStatusFromServer requires the project to have customDomain set!
    // We should just call addCustomDomainToServer first so it saves, then check.
    await addCustomDomainToServer(selectedProject, newDomain);
    const dnsStatus = await checkDnsStatusFromServer(selectedProject);
    setDnsState({ root: dnsStatus.rootVerified, www: dnsStatus.wwwVerified });
    
    if (dnsStatus.rootVerified && dnsStatus.wwwVerified) {
      await load(); // update customDomains list
      setVerifying(false);
      setStep(4); // Success step
    } else {
      setVerifying(false);
      setVerifyError(true);
    }
  };

  const removeDomain = async (id: string) => {
    const domainObj = customDomains.find(d => d.id === id);
    if (domainObj) {
      await removeCustomDomainFromServer(domainObj.projectId);
      setCustomDomains(customDomains.filter(d => d.id !== id));
    }
  };

  const handleVerifyList = async (projectName: string, domainName: string) => {
    setListVerifyingId(projectName);
    // Trigger backend check
    await addCustomDomainToServer(projectName, domainName);
    // Check SSL status
    const status = await checkCustomDomainStatusFromServer(projectName);
    if (status === "active") {
      await load();
    } else {
      alert("Verification failed. The SSL certificate is not ready yet. Ensure DNS A-record points to our server, or wait a few minutes if Let's Encrypt is rate-limiting.");
    }
    setListVerifyingId(null);
  };

  return (
    <AppShell activeNav="Domains">
      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* Main List View */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Domains</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and configure custom domains for your projects</p>
          </div>
          <button
            onClick={handleStartAddDomain}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Domain
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : customDomains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-slate-300 rounded-3xl bg-slate-50/50">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-sky-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No custom domains yet</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md">
              Connect a custom domain to your projects to make them accessible via your own branding.
            </p>
            <button
              onClick={handleStartAddDomain}
              className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Your First Domain
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">Domain</div>
              <div className="col-span-3">Project</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {customDomains.map((domain) => {
              const isSub = isSubdomain(domain.domain);
              const recordType = isSub ? "CNAME" : "A";
              const recordName = isSub ? getSubdomainName(domain.domain) : "@";
              const recordValue = isSub ? CNAME_TARGET : EC2_IP;
              return (
                <div key={domain.id} className="flex flex-col border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                <div className="grid grid-cols-12 gap-4 px-6 py-5 items-center">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <Globe className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <a href={`https://www.${domain.domain.replace(/^www\./, '')}`} target="_blank" rel="noreferrer" className="font-semibold text-sm text-slate-900 hover:text-sky-600 transition-colors flex items-center gap-1.5">
                        www.{domain.domain.replace(/^www\./, '')}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="col-span-3 flex items-center">
                    <Link href={`/project/${domain.projectName}`} className="text-sm text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md transition-colors">
                      {domain.projectName}
                    </Link>
                  </div>

                  <div className="col-span-3">
                    {domain.status === "active" ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </div>
                    ) : domain.status === "pending_verification" ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        Failed
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => removeDomain(domain.id)}
                      title="Delete domain"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {domain.status === "pending_verification" && (
                  <div className="px-6 pb-5 pl-[4.5rem]">
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm max-w-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-semibold text-slate-800">DNS Verification Required</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">Please add the following {recordType} record to your DNS provider to verify this domain.</p>
                      
                      <div className="grid grid-cols-3 gap-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <div>Type</div>
                        <div>Name</div>
                        <div>Value</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                        <div className="text-sm font-medium text-slate-900">{recordType}</div>
                        <div className="text-sm font-mono text-slate-600">{recordName}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-slate-900 bg-white px-2 py-1 border border-slate-200 rounded-md shadow-sm">{recordValue}</span>
                          <button onClick={() => copy(recordValue, 'ip-' + domain.id)} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 transition-colors bg-white border border-slate-200 shadow-sm">
                            {copied === 'ip-' + domain.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="mt-5 flex justify-end">
                        <button
                          onClick={() => handleVerifyList(domain.projectName, domain.domain)}
                          disabled={listVerifyingId === domain.projectName}
                          className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-70 transition-colors"
                        >
                          {listVerifyingId === domain.projectName ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            "Verify Domain"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}

        {/* Modal Overlay */}
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden relative"
              >
                <button
                  onClick={closeModal}
                  className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="p-8">
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">Enter Domain</h2>
                      <p className="text-sm text-slate-500 mb-8">What domain do you want to connect?</p>
                      
                      <form onSubmit={handleStep1Submit} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Domain Name</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Globe className="w-5 h-5 text-slate-400" />
                            </div>
                            <input
                              type="text"
                              required
                              value={newDomain}
                              onChange={(e) => setNewDomain(e.target.value.toLowerCase().replace(/https?:\/\//, ''))}
                              placeholder="www.example.com"
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-shadow bg-white text-sm text-slate-900 shadow-sm"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={closeModal}
                            className="h-10 px-6 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!newDomain}
                            className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                          >
                            Next
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">Assign Project</h2>
                      <p className="text-sm text-slate-500 mb-8">Which project should <span className="font-semibold text-slate-700">{newDomain}</span> point to?</p>
                      
                      <form onSubmit={handleStep2Submit} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Select a Project</label>
                          <select
                            required
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-shadow bg-white text-sm text-slate-900 shadow-sm"
                          >
                            <option value="" disabled>Choose...</option>
                            {projects.map(p => (
                              <option key={p.name} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="pt-4 flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="h-10 px-6 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            disabled={!selectedProject}
                            className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                          >
                            Next
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {step === 3 && (() => {
                    const rootDomain = newDomain.replace(/^www\./, '');
                    return (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-2xl font-bold text-slate-900">Mandatory DNS Setup</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                          Add BOTH records to your DNS provider to connect <span className="font-semibold text-slate-700">{rootDomain}</span> to CloudRik.
                        </p>

                        <div className="space-y-4 mb-6">
                          {/* A Record */}
                          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide">1. A RECORD (Root Domain)</span>
                              {dnsState.root === true && <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5"/> Verified</span>}
                              {dnsState.root === false && <span className="flex items-center gap-1 text-xs font-bold text-red-500"><XCircle className="w-3.5 h-3.5"/> Missing</span>}
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              <div>Type</div>
                              <div>Name</div>
                              <div>Value</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                              <div className="text-sm font-medium text-slate-900">A</div>
                              <div className="text-sm font-mono text-slate-600">@</div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-slate-900 bg-white px-2 py-1 border border-slate-200 rounded-md shadow-sm">{EC2_IP}</span>
                                <button onClick={() => copy(EC2_IP, 'ip')} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 transition-colors bg-white border border-slate-200 shadow-sm">
                                  {copied === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* CNAME Record */}
                          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold tracking-wide">2. CNAME RECORD (www)</span>
                              {dnsState.www === true && <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5"/> Verified</span>}
                              {dnsState.www === false && <span className="flex items-center gap-1 text-xs font-bold text-red-500"><XCircle className="w-3.5 h-3.5"/> Missing</span>}
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              <div>Type</div>
                              <div>Name</div>
                              <div>Value</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                              <div className="text-sm font-medium text-slate-900">CNAME</div>
                              <div className="text-sm font-mono text-slate-600">www</div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-slate-900 bg-white px-2 py-1 border border-slate-200 rounded-md shadow-sm">{CNAME_TARGET}</span>
                                <button onClick={() => copy(CNAME_TARGET, 'cname')} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 transition-colors bg-white border border-slate-200 shadow-sm">
                                  {copied === 'cname' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {verifyError && (
                          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3 text-red-800">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-semibold">DNS verification failed</p>
                              <p className="mt-0.5 opacity-90">Please ensure BOTH records match the above exactly. DNS changes can take a few minutes to propagate.</p>
                            </div>
                          </div>
                        )}

                      <div className="flex justify-between items-center pt-4">
                        <button
                          onClick={() => setStep(2)}
                          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          Back
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={handleDone}
                            disabled={verifying}
                            className="h-10 px-6 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-70 transition-colors shadow-sm"
                          >
                            Done
                          </button>
                          <button
                            onClick={handleVerify}
                            disabled={verifying}
                            className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-70 transition-colors shadow-sm"
                          >
                            {verifying ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                Verify
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                    );
                  })()}

                  {step === 4 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                      <div className="w-20 h-20 rounded-full bg-emerald-50 border-8 border-emerald-100/50 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Domain Connected!</h2>
                      <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                        <span className="font-semibold text-slate-700">{newDomain}</span> is now successfully connected to <span className="font-semibold text-slate-700">{selectedProject}</span>.
                      </p>
                      
                      <div className="flex justify-center">
                        <button
                          onClick={closeModal}
                          className="inline-flex items-center justify-center h-11 px-8 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AppShell>
  );
}
