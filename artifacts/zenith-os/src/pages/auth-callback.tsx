import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const setAuth = useAuth((state) => state.setAuth);

  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      
      if (!token) {
        navigate("/sign-in?error=No token provided");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const user = await res.json();
          setAuth(user, token);
          navigate("/dashboard");
        } else {
          throw new Error("Failed to fetch user");
        }
      } catch (error) {
        console.error("Auth fetch error:", error);
        navigate("/sign-in?error=Authentication failed");
      }
    };

    processCallback();
  }, [navigate, setAuth]);

  return (
    <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-16 h-16 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--primary))] flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.3)]"
        >
          <Zap className="w-8 h-8 text-[hsl(var(--primary))]" />
        </motion.div>
        <p className="text-[hsl(var(--muted-foreground))] font-medium animate-pulse">
          Authenticating...
        </p>
      </div>
    </div>
  );
}
