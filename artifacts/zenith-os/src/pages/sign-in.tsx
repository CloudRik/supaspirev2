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
    <div className="min-h-screen w-full bg-black text-white selection:bg-white/20 relative flex items-center justify-center overflow-hidden">
      {/* Background grid (subtle) */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
          maskImage: "radial-gradient(circle at center, black, transparent 80%)",
        }}
      />

      {/* CloudRik Logo - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="25 30 48 48" className="w-8 h-8 text-white shrink-0">
            <g fill="currentColor">
              <polygon points="35,32 65,32 57,44 27,44"/>
              <polygon points="41,49 71,49 63,61 33,61"/>
              <polygon points="61,66 71,66 71,76"/>
            </g>
          </svg>
          <span className="font-bold text-lg tracking-widest text-white whitespace-nowrap">CloudRik</span>
        </Link>
      </div>

      {/* Centered card */}
      <div className="relative z-10 w-full max-w-[400px] px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full bg-[#18181b] border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl"
        >
          {/* Heading */}
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-sm text-white/50 mt-2">
              Sign in to deploy your apps in seconds.
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleLogin('google')}
              className="flex items-center justify-center gap-3 h-11 w-full rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-colors"
            >
              <FcGoogle className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => handleLogin('github')}
              className="flex items-center justify-center gap-3 h-11 w-full rounded-lg bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* Secure auth marker */}
          <div className="my-8 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/40">
              <ShieldCheck className="w-3 h-3 text-white/40" />
              <span>Secure OAuth 2.0</span>
            </div>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-white/40 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="text-white/60 hover:text-white transition-colors hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-white/60 hover:text-white transition-colors hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </motion.div>

        {/* Below card text */}
        <p className="text-center text-xs text-white/40 mt-6">
          New to CloudRik? Signing in creates your account automatically.
        </p>
      </div>
    </div>
  );
}
