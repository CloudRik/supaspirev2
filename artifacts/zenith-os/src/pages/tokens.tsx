import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { getAuthToken } from "@/lib/projects";
import { useAuth } from "@/hooks/useAuth";
import { Key, Plus, Trash2, Copy, Check, AlertCircle, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ApiToken {
  id: string;
  name: string;
  tokenHint: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Success Modal state
  const [generatedToken, setGeneratedToken] = useState("");
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const isViewer = user?.workspaceRole === "Viewer";

  useEffect(() => {
    fetchTokens();
  }, []);

  async function fetchTokens() {
    try {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      
      const res = await fetch(`/api-proxy/api/user/tokens${workspaceId ? `?workspaceId=${workspaceId}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } catch (error) {
      console.error("Failed to fetch tokens", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateToken(e: React.FormEvent) {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    
    setIsCreating(true);
    try {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      
      const res = await fetch(`/api-proxy/api/user/tokens${workspaceId ? `?workspaceId=${workspaceId}` : ''}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}) 
        },
        body: JSON.stringify({ name: newTokenName.trim() })
      });
      
      if (res.ok) {
        const data = await res.json();
        setGeneratedToken(data.token);
        setIsCreateModalOpen(false);
        setNewTokenName("");
        fetchTokens();
      }
    } catch (error) {
      console.error("Failed to create token", error);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevokeToken(id: string) {
    if (!confirm("Are you sure you want to revoke this token? Any scripts using it will immediately fail.")) return;
    
    try {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      
      const res = await fetch(`/api-proxy/api/user/tokens/${id}${workspaceId ? `?workspaceId=${workspaceId}` : ''}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        setTokens(tokens.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to revoke token", error);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppShell activeNav="API Tokens">
      <div className="flex-1 flex flex-col h-full bg-[#fafafa] overflow-y-auto">
        <div className="max-w-[1000px] mx-auto w-full px-8 py-10 space-y-8">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#111] tracking-tight mb-1">API Tokens</h1>
              <p className="text-[14px] text-[#666]">Create personal access tokens to authenticate via the CLI and API.</p>
            </div>
            {!isViewer && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-black text-white text-[14px] font-medium rounded-md transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create Token
              </button>
            )}
          </div>

          <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm w-full overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-[#eaeaea] border-t-[#111] animate-spin"></div>
              </div>
            ) : isViewer ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-amber-50 rounded-full border border-amber-100 flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-[16px] font-semibold text-[#111] mb-1">Access Restricted</h3>
                <p className="text-[14px] text-[#666]">Viewer roles cannot view or manage API tokens in this workspace.</p>
              </div>
            ) : tokens.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-[#fafafa] rounded-full border border-[#eaeaea] flex items-center justify-center mb-4">
                  <Key className="w-5 h-5 text-[#888]" />
                </div>
                <h3 className="text-[16px] font-semibold text-[#111] mb-1">No API tokens found</h3>
                <p className="text-[14px] text-[#666] mb-6">You haven't created any API tokens for this workspace yet.</p>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 border border-[#eaeaea] text-[#111] text-[14px] font-medium rounded-md hover:bg-[#fafafa] transition-colors"
                >
                  Generate First Token
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#eaeaea] bg-[#fafafa]/50">
                    <th className="px-6 py-3 text-[13px] font-medium text-[#666]">Name</th>
                    <th className="px-6 py-3 text-[13px] font-medium text-[#666]">Token</th>
                    <th className="px-6 py-3 text-[13px] font-medium text-[#666]">Last Used</th>
                    <th className="px-6 py-3 text-[13px] font-medium text-[#666]">Created</th>
                    <th className="px-6 py-3 text-[13px] font-medium text-[#666] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeaea]">
                  {tokens.map(t => (
                    <tr key={t.id} className="hover:bg-[#fafafa]/50 transition-colors">
                      <td className="px-6 py-4 text-[14px] font-semibold text-[#111]">{t.name}</td>
                      <td className="px-6 py-4 text-[13px] font-mono text-[#666]">{t.tokenHint}</td>
                      <td className="px-6 py-4 text-[13px] text-[#666]">
                        {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[#666]">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleRevokeToken(t.id)}
                          className="text-[13px] font-medium text-red-600 hover:text-red-700 hover:underline"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Token Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !isCreating && setIsCreateModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-xl shadow-xl w-full max-w-md border border-[#eaeaea] overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-[#eaeaea]">
                <h3 className="text-[18px] font-bold text-[#111]">Create API Token</h3>
                <p className="text-[13px] text-[#666] mt-1">Tokens allow scripts and CLI tools to access your workspace.</p>
              </div>
              <form onSubmit={handleCreateToken} className="px-6 py-6">
                <div className="mb-6">
                  <label className="block text-[13px] font-semibold text-[#111] mb-2">Token Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="e.g. GitHub Actions Deployment"
                    className="w-full h-10 px-3 border border-[#eaeaea] bg-white text-[#111] rounded-md text-[14px] outline-none focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3] transition-all"
                    required
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                    className="px-4 py-2 border border-[#eaeaea] text-[#111] text-[14px] font-medium rounded-md hover:bg-[#fafafa] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isCreating || !newTokenName.trim()}
                    className="px-4 py-2 bg-[#111] hover:bg-black text-white text-[14px] font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    {isCreating ? "Creating..." : "Create Token"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Success Modal (Show Token) */}
        {generatedToken && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-xl shadow-xl w-full max-w-lg border border-[#eaeaea] overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full mx-auto flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-[20px] font-bold text-[#111] mb-2">Token Created</h3>
                <p className="text-[14px] text-[#666] mb-6">
                  Make sure to copy your personal access token now. You won't be able to see it again!
                </p>
                
                <div className="flex items-center justify-between p-3 border border-[#eaeaea] rounded-lg bg-[#fafafa] mb-6 relative group">
                  <code className="text-[14px] font-mono text-[#111] break-all text-left max-w-[85%]">{generatedToken}</code>
                  <button 
                    onClick={handleCopy}
                    className="p-2 border border-[#eaeaea] bg-white rounded-md hover:bg-[#fafafa] transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#666]" />}
                  </button>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-left mb-8">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-amber-800 leading-relaxed">
                    Treat this token like a password. Do not share it or commit it to version control. If it gets compromised, revoke it immediately.
                  </p>
                </div>

                <button 
                  onClick={() => setGeneratedToken("")}
                  className="w-full py-2.5 bg-[#111] hover:bg-black text-white text-[14px] font-medium rounded-md transition-colors"
                >
                  I have copied my token
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
