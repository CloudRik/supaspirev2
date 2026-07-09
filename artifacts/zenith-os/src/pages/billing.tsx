import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { getAuthToken } from "@/lib/projects";
import { 
  CreditCard, Zap, Package, Download, Check, AlertTriangle, 
  Lock, Users, Activity, ExternalLink, ShieldCheck, ArrowRight, Server, Receipt, Database, Globe
} from "lucide-react";
import { motion } from "framer-motion";

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState("Owner");
  
  useEffect(() => {
    async function loadRole() {
      try {
        const token = getAuthToken();
        const workspaceId = localStorage.getItem("cloudrik-workspace");
        
        const roleRes = await fetch(`/api-proxy/api/auth/me${workspaceId ? `?workspaceId=${workspaceId}` : ''}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          setCurrentUserRole(roleData.workspaceRole || "Owner");
        }
      } catch (error) {
        console.error("Failed to load role", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadRole();
  }, []);

  if (loading) {
    return (
      <AppShell activeNav="Billing">
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-sky-500 animate-spin"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="Billing">
      <div className="flex-1 flex flex-col h-full bg-[#fafafa] overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-bold text-slate-900 tracking-tight mb-1">Billing & Usage</h1>
              <p className="text-slate-500 font-medium">Manage your subscription, view limits, and past invoices.</p>
            </div>
          </div>

          {/* RBAC Restricted View */}
          {currentUserRole !== "Owner" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center shadow-sm flex flex-col items-center mt-6"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Access Restricted</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                You currently have the <span className="font-semibold text-slate-700">{currentUserRole}</span> role. 
                Only Workspace Owners have permission to view billing information, upgrade plans, or modify payment methods.
              </p>
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-3 rounded-lg flex items-start gap-3 text-left">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  Please contact the owner of this workspace to upgrade the plan or access billing invoices.
                </div>
              </div>
            </motion.div>
          )}

          {/* Full Access View */}
          {currentUserRole === "Owner" && (
            <div className="flex flex-col gap-6 pt-2 pb-16 w-full max-w-[1000px] mx-auto">
              
              {/* Plan Card */}
              <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm w-full">
                
                {/* Header (Hobby Plan & Top Buttons) */}
                <div className="flex items-start justify-between px-8 py-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-[#111] tracking-tight">Hobby Plan</h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#047857] text-[12px] font-medium leading-none">Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-3.5 py-1.5 border border-[#eaeaea] rounded-md text-[13px] font-medium text-[#444] hover:bg-[#fafafa] transition-colors bg-white">Invoices</button>
                    <button className="px-3.5 py-1.5 border border-[#eaeaea] rounded-md text-[13px] font-medium text-[#444] hover:bg-[#fafafa] transition-colors bg-white">Usage</button>
                  </div>
                </div>

                {/* Center Upgrade to Pro */}
                <div className="flex flex-col items-center justify-center pt-8 pb-10 px-8 text-center">
                  <div className="inline-flex px-2 py-0.5 rounded-full bg-[#0070f3] text-white text-[11px] font-semibold leading-none mb-4">Pro</div>
                  <h3 className="text-[20px] font-bold text-[#111] mb-2">Upgrade to Pro</h3>
                  <p className="text-[#666] text-[14px] leading-relaxed max-w-[600px]">
                    Your plan includes a fixed amount of free usage. Unlock on-demand usage, collaboration, and faster builds.<br/>
                    Get started with $20 in credit.
                  </p>
                </div>

                {/* Features Grid */}
                <div className="px-10 pb-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-5">
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[14px] text-[#111]">
                         <Server className="w-[18px] h-[18px] text-[#666]" strokeWidth={1.5} /> Dedicated EC2 Server
                      </div>
                      <span className="text-[13px] font-medium text-[#0070f3]">$15 /month included</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[14px] text-[#111]">
                         <Activity className="w-[18px] h-[18px] text-[#666]" strokeWidth={1.5} /> Observability tools
                      </div>
                      <div className="w-[18px] h-[18px] rounded-full bg-[#0070f3] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[14px] text-[#111]">
                         <Activity className="w-[18px] h-[18px] text-[#666]" strokeWidth={1.5} /> Fast Data Transfer
                      </div>
                      <span className="text-[13px] font-medium text-[#0070f3]">1 TB /month included</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[14px] text-[#111]">
                         <ShieldCheck className="w-[18px] h-[18px] text-[#666]" strokeWidth={1.5} /> Advanced WAF Protection
                      </div>
                      <div className="w-[18px] h-[18px] rounded-full bg-[#0070f3] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[14px] text-[#111]">
                         <Globe className="w-[18px] h-[18px] text-[#666]" strokeWidth={1.5} /> Edge Requests
                      </div>
                      <span className="text-[13px] font-medium text-[#0070f3]">10M /month included</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[14px] text-[#111]">
                         <Zap className="w-[18px] h-[18px] text-[#666]" strokeWidth={1.5} /> Enhanced build machines
                      </div>
                      <div className="w-[18px] h-[18px] rounded-full bg-[#0070f3] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[14px] text-[#111]">
                         <Users className="w-[18px] h-[18px] text-[#666]" strokeWidth={1.5} /> Team Collaboration
                      </div>
                      <div className="w-[18px] h-[18px] rounded-full bg-[#0070f3] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[14px] text-[#111]">
                         <Package className="w-[18px] h-[18px] text-[#666]" strokeWidth={1.5} /> On-demand concurrent builds
                      </div>
                      <div className="w-[18px] h-[18px] rounded-full bg-[#0070f3] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[14px] text-[#111]">
                         <ShieldCheck className="w-[18px] h-[18px] text-[#666]" strokeWidth={1.5} /> Free Viewer Seats
                      </div>
                      <div className="w-[18px] h-[18px] rounded-full bg-[#0070f3] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[14px] text-[#111]">
                         <Database className="w-[18px] h-[18px] text-[#666]" strokeWidth={1.5} /> Enterprise-grade paid add-ons
                      </div>
                      <div className="w-[18px] h-[18px] rounded-full bg-[#0070f3] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[14px] text-[#111]">
                         <Globe className="w-[18px] h-[18px] text-[#666]" strokeWidth={1.5} /> Global CDN
                      </div>
                      <div className="w-[18px] h-[18px] rounded-full bg-[#0070f3] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[14px] text-[#111]">
                         <CreditCard className="w-[18px] h-[18px] text-[#666]" strokeWidth={1.5} /> Spend Management
                      </div>
                      <div className="w-[18px] h-[18px] rounded-full bg-[#0070f3] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-[#eaeaea] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[14px] text-[#666]">
                    Learn more about <a href="#" className="text-[#0070f3] hover:underline">Pricing and Plans</a> <ExternalLink className="w-3 h-3 inline ml-0.5 text-[#0070f3]" />
                  </p>
                  <button className="w-full sm:w-auto px-6 py-2 bg-[#111] hover:bg-black text-white text-[14px] font-medium rounded-md transition-colors shadow-sm">
                    Upgrade
                  </button>
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-white border border-[#eaeaea] rounded-lg shadow-sm w-full">
                <div className="p-8 pb-10">
                  <h2 className="text-[20px] font-bold text-[#111] tracking-tight mb-3">Payment Method</h2>
                  <p className="text-[14px] text-[#666]">Payments for domains, add-ons, and other usage are made using the default card.</p>
                </div>
              </div>

            </div>
          )}
          
        </div>
      </div>
    </AppShell>
  );
}
