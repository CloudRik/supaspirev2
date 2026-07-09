import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Github, Zap, ArrowLeft, ShieldCheck } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SignIn() {
  const [, navigate] = useLocation();
  const setAuth = useAuth((state) => state.setAuth);

  useEffect(() => {
    // Check for error in URL parameters if redirected back with failure
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      alert(`Authentication failed: ${error}`);
      // Remove error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = (provider: 'google' | 'github') => {
    const url = provider === 'github' ? `${API_URL}/api/auth/github/user` : `${API_URL}/api/auth/${provider}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative overflow-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
          maskImage: "radial-gradient(circle at center, black, transparent 80%)",
        }}
      />

      {/* Glowing Orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[hsl(var(--secondary))] opacity-10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[hsl(var(--primary))] opacity-10 blur-[120px] pointer-events-none z-0" />

      {/* Back to home */}
      <div className="relative z-10 px-6 py-6 max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </Link>
      </div>

      {/* Centered card */}
      <div className="relative z-10 flex items-center justify-center px-4 min-h-[calc(100vh-160px)]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md"
        >
          {/* Glow halo */}
          <div className="absolute -inset-6 bg-gradient-to-tr from-[hsl(var(--primary))]/20 via-transparent to-[hsl(var(--secondary))]/20 blur-3xl pointer-events-none" />

          <div className="relative bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))] rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/50">
            {/* Top border accent */}
            <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary))] to-transparent" />

            {/* Logo + heading */}
            <div className="flex flex-col items-center text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="w-12 h-12 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--primary))] flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.3)] mb-5"
              >
                <Zap className="w-6 h-6 text-[hsl(var(--primary))]" />
              </motion.div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome to CloudRik</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                Sign in to deploy your apps in seconds.
              </p>
            </div>

            {/* OAuth buttons */}
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLogin('google')}
                className="group inline-flex items-center justify-center gap-3 h-12 px-5 rounded-lg bg-white text-gray-900 font-semibold text-sm hover:bg-gray-50 transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.18)]"
              >
                <FcGoogle className="w-5 h-5" />
                <span>Continue with Google</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLogin('github')}
                className="group inline-flex items-center justify-center gap-3 h-12 px-5 rounded-lg bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] text-white font-semibold text-sm hover:border-[hsl(var(--primary))]/50 hover:bg-[hsl(var(--muted))]/60 hover:shadow-[0_0_25px_rgba(0,229,255,0.15)] transition-all"
              >
                <Github className="w-5 h-5" />
                <span>Continue with GitHub</span>
              </motion.button>
            </div>

            {/* Secure auth marker */}
            <div className="my-7 flex items-center gap-3">
              <div className="flex-1 h-px bg-[hsl(var(--border))]" />
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                <ShieldCheck className="w-3 h-3 text-[hsl(var(--primary))]" />
                <span>Secure OAuth 2.0</span>
              </div>
              <div className="flex-1 h-px bg-[hsl(var(--border))]" />
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              By continuing, you agree to our{" "}
              <a href="#" className="text-[hsl(var(--primary))] hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-[hsl(var(--primary))] hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          {/* Below card */}
          <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-6">
            New to CloudRik? Signing in creates your account automatically.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
