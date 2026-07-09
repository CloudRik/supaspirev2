import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Search, Plus, Trash2, Mail, ExternalLink, ChevronDown, ShieldCheck, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { getAuthToken } from "@/lib/projects";

type Role = string;

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  has2fa: boolean;
  joinedAt: string;
  avatarUrl?: string;
};

// Initial state starts empty while loading from backend
const INITIAL_MEMBERS: TeamMember[] = [];

const MAX_FREE_SEATS = 2;

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState("Owner");
  const { toast } = useToast();

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      let url = "/api-proxy/api/team";
      if (workspaceId) url += `?workspaceId=${workspaceId}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const teamData = await res.json();
        
        // Fetch owner details
        let ownerUrl = "/api-proxy/api/auth/me";
        if (workspaceId) ownerUrl += `?workspaceId=${workspaceId}`;
        const ownerRes = await fetch(ownerUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        let ownerData = null;
        if (ownerRes.ok) {
          ownerData = await ownerRes.json();
        }

        const ownerRow: TeamMember = {
          id: ownerData?.id || "owner-1",
          name: ownerData?.name || "Owner",
          email: ownerData?.email || "owner@example.com",
          role: "Owner",
          has2fa: false,
          joinedAt: new Date(ownerData?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        
        setCurrentUserRole(ownerData?.workspaceRole || "Owner");
        setMembers([ownerRow, ...teamData]);
      }
    } catch (error) {
      console.error("Failed to fetch members", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }

    try {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      let url = "/api-proxy/api/team/invite";
      if (workspaceId) url += `?workspaceId=${workspaceId}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole || "Member" })
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Upgrade to Pro", description: data.error || "Could not send invite", variant: "destructive" });
        return;
      }

      toast({ title: "Invitation Sent", description: `Sent to ${inviteEmail}.` });
      setInviteEmail("");
      setInviteRole("");
      fetchMembers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const token = getAuthToken();
      const workspaceId = localStorage.getItem("cloudrik-workspace");
      let url = `/api-proxy/api/team/${id}`;
      if (workspaceId) url += `?workspaceId=${workspaceId}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        toast({ title: "Member Removed" });
        fetchMembers();
      } else {
        toast({ title: "Error", description: "Could not remove member", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
    }
  };

  const isFreePlan = true;
  const seatsUsed = members.length;

  return (
    <AppShell activeNav="Team Members">
      <div className="max-w-7xl mx-auto px-6 py-10 font-sans">
        
        {/* Header (No Invite Button here anymore since it's inside the card) */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight mb-1">Team Members</h1>
          <p className="text-[15px] text-slate-500">
            Manage your team members and their account permissions here.
          </p>
        </motion.div>

        {/* Invite Members Card - Only visible to Owner */}
        {currentUserRole === 'Owner' && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-xl mb-8 shadow-sm overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Invite Members</h2>
            <p className="text-sm text-slate-500 mb-6">
              Add new members to your team by entering their email address and assigning a role
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all"
                />
              </div>
              <div className="w-full sm:w-64">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Role</label>
                <div className="relative">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-10 px-3 pr-10 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select a role</option>
                    <option value="Owner">Owner (Pro)</option>
                    <option value="Member">Member (Pro)</option>
                    <option value="Viewer">Viewer (Free)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <button className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add more
            </button>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {isFreePlan ? (
                <>
                  <span className="font-semibold text-slate-800">{seatsUsed} of {MAX_FREE_SEATS} free seats</span> used. Upgrade to Pro for unlimited seats.
                </>
              ) : (
                <>This feature is available on the <a href="#" className="text-sky-600 hover:underline inline-flex items-center gap-1">Pro plan <ExternalLink className="w-3 h-3" /></a>.</>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={handleInvite} className="h-9 px-4 rounded-md bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
                Send Invite
              </button>
              <button className="h-9 px-4 rounded-md bg-black text-white text-sm font-medium hover:bg-slate-800 transition-colors">
                Upgrade
              </button>
            </div>
          </div>
        </motion.div>
        )}

        {/* Table Card */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-md bg-white border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select className="h-9 px-3 rounded-md bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none hover:bg-slate-50 cursor-pointer">
                <option>All Roles</option>
              </select>
              <select className="h-9 px-3 rounded-md bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none hover:bg-slate-50 cursor-pointer">
                <option>2FA Status</option>
                <option>2FA Enabled</option>
                <option>2FA Disabled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">User</th>
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Role</th>
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">2FA</th>
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Joined</th>
                  <th className="py-3 px-6 text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                            {member.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{member.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            {member.email}
                            {member.joinedAt === "Pending" && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-medium border border-amber-200 ml-1">
                                <Mail className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-700 font-medium">{member.role}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {member.has2fa ? (
                        <div className="flex justify-center">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md px-2 py-1 bg-white">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 2FA
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 border border-slate-100 rounded-md px-2 py-1 bg-slate-50">
                            Off
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-500">{member.joinedAt}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {member.role !== "Owner" && currentUserRole === "Owner" && (
                        <button 
                          onClick={() => handleRemove(member.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
