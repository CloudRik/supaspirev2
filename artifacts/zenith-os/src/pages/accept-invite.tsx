import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { getAuthToken } from "@/lib/projects";
import { useToast } from "@/hooks/use-toast";

export default function AcceptInvitePage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid or missing invitation token.");
    }
  }, [token]);

  const handleAccept = async () => {
    let authToken = getAuthToken();

    // If not logged in, trigger GitHub login popup
    if (!authToken) {
      try {
        authToken = await new Promise((resolve, reject) => {
          const width = 600, height = 700;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          const authWindow = window.open(
            `/api-proxy/api/auth/github/user`,
            "GitHub Auth",
            `width=${width},height=${height},left=${left},top=${top}`
          );

          if (!authWindow) return reject("Popup blocked");

          const handleMessage = (e: MessageEvent) => {
            if (e.origin !== window.location.origin) return;
            if (e.data?.token) {
              window.removeEventListener("message", handleMessage);
              
              // Save token locally like the SignIn page does
              const authState = { state: { token: e.data.token, user: null } };
              localStorage.setItem("cloudrik-auth", JSON.stringify(authState));
              
              resolve(e.data.token);
            }
            if (e.data?.error) {
              window.removeEventListener("message", handleMessage);
              reject(e.data.error);
            }
          };

          window.addEventListener("message", handleMessage);
        });
      } catch (err) {
        toast({ title: "Login Failed", description: "You must login to accept.", variant: "destructive" });
        return;
      }
    }

    if (!authToken) return;

    setStatus("loading");
    try {
      const res = await fetch("/api-proxy/api/team/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ inviteId: token })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setTimeout(() => setLocation("/dashboard"), 2000);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to accept invitation.");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Failed to connect to the server.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center"
      >
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Join Team on CloudRik</h1>
        <p className="text-slate-500 mb-8">
          You have been invited to collaborate. Accept the invitation to access the dashboard and projects.
        </p>

        {status === "error" && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-left">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

        {status === "success" && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-left">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Invitation Accepted!</p>
              <p className="text-xs text-emerald-600 mt-1">Redirecting you to dashboard...</p>
            </div>
          </div>
        )}

        {status !== "success" && (
          <button 
            onClick={handleAccept}
            disabled={status === "loading"}
            className="w-full h-11 bg-slate-900 text-white rounded-xl font-medium text-[15px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : (
              "Accept Invitation"
            )}
          </button>
        )}

        {status !== "success" && (
          <p className="mt-6 text-xs text-slate-400">
            If you don't have an account, you will be prompted to create one with GitHub.
          </p>
        )}
      </motion.div>
    </div>
  );
}
