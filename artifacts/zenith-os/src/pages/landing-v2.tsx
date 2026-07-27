import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from "framer-motion";
import WorldMap from "@/components/ui/world-map";
import { AnimatedList } from "@/components/ui/animated-list";
import { Link } from "wouter";
import { ChevronDown, Database, Rocket, Activity, Settings, Bot, Globe, Webhook, Lock, Cloud, Key, Shield, HardDrive, Zap } from "lucide-react";
// --- Subcomponents ---

// Feature Flag Row with spring-animated toggle
const FeatureFlagRow = ({
  label,
  delay,
  defaultOn,
  color,
}: {
  label: string;
  delay: number;
  defaultOn: boolean;
  color: "green" | "blue";
}) => {
  const [isOn, setIsOn] = useState(defaultOn);
  const glowColor = color === "green" ? "rgba(34,197,94,0.4)" : "rgba(59,130,246,0.4)";
  const trackBg = isOn
    ? color === "green" ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)"
    : "rgba(255,255,255,0.04)";
  const trackBorder = isOn
    ? color === "green" ? "rgba(34,197,94,0.3)" : "rgba(59,130,246,0.3)"
    : "rgba(255,255,255,0.08)";
  const dotColor = isOn
    ? color === "green" ? "#4ade80" : "#60a5fa"
    : "rgba(255,255,255,0.25)";

  return (
    <motion.div
      className="flex items-center justify-between py-3 border-b border-white/5 cursor-pointer"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      viewport={{ once: true }}
      onClick={() => setIsOn(!isOn)}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-white/70 font-mono">{label}</span>
        <motion.span
          key={isOn ? "live" : "off"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-medium"
          style={{ color: isOn ? dotColor : "rgba(255,255,255,0.25)" }}
        >
          {isOn ? "● Live on Edge" : "○ Inactive"}
        </motion.span>
      </div>

      {/* Spring Toggle */}
      <motion.div
        className="w-10 h-5 rounded-full flex items-center px-1 relative flex-shrink-0 cursor-pointer"
        animate={{ backgroundColor: trackBg, borderColor: trackBorder }}
        style={{ border: "1px solid", boxShadow: isOn ? `0 0 14px ${glowColor}` : "none" }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="w-3.5 h-3.5 rounded-full absolute"
          animate={{ left: isOn ? "calc(100% - 18px)" : "3px", backgroundColor: dotColor }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.div>
    </motion.div>
  );
};


// 3D Scroll Container (Aceternity Style)
const HeroScrollContainer = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Tilted at the start, straightens out as you scroll down
  const rotateX = useTransform(scrollYProgress, [0, 0.25], [25, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.25], [0.8, 1]);
  const translateY = useTransform(scrollYProgress, [0, 0.25], [50, 0]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-start justify-center w-full pt-6 pb-10 perspective-[1000px]"
    >
      <motion.div
        style={{
          rotateX,
          scale,
          translateY,
          // Bottom fade out mask that user requested
          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
        }}
        className="w-full max-w-[1200px] mx-auto rounded-[2rem] border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm shadow-2xl overflow-hidden p-4"
      >
        <div className="w-full h-full min-h-[600px] rounded-2xl bg-[#09090b] border border-white/5 p-4 sm:p-6 grid grid-cols-3 gap-4 sm:gap-6 overflow-hidden relative">

          {/* Top Left - GitHub Deploy */}
          <div className="col-span-1 bg-[#111113] rounded-xl border border-white/5 p-5 flex flex-col relative overflow-hidden group">
            <div className="text-white/40 text-xs font-medium mb-4 z-10">Deploy in minutes</div>

            <div className="flex-1 flex flex-col items-center justify-center gap-5 z-10">
              <div className="w-16 h-16 rounded-full bg-[#161618] border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/5 transition-all duration-500 shadow-2xl relative">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-8 h-8 text-white/90 relative z-10"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>

                {/* Expanding Rings on Hover */}
                <div className="absolute inset-0 rounded-full border border-white/10 scale-[1.2] opacity-0 group-hover:opacity-100 group-hover:scale-[1.6] transition-all duration-700 ease-out"></div>
                <div className="absolute inset-0 rounded-full border border-white/5 scale-[1.5] opacity-0 group-hover:opacity-100 group-hover:scale-[2.2] transition-all duration-1000 ease-out delay-75"></div>
              </div>

              <div className="px-5 py-2 rounded-full bg-white text-black text-[10px] font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-transform duration-300">
                Deploy Project
              </div>
            </div>

            {/* Subtle glow behind the logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none group-hover:bg-white/10 transition-colors"></div>
          </div>

          <div className="col-span-1 bg-[#111113] rounded-xl border border-white/5 p-5 flex flex-col justify-between">
            <div>
              <div className="text-white/40 text-xs font-medium mb-1">API Requests</div>
              <div className="text-white text-2xl font-bold tracking-tight">2.4M</div>
              <div className="text-[10px] text-green-400 mt-1">+180.1% from last month</div>
            </div>
            {/* Minimalist Bar Chart */}
            <div className="w-full h-12 mt-4 flex items-end justify-between gap-1">
              {[40, 70, 45, 90, 65, 85, 50, 75, 40].map((h, i) => (
                <div key={i} className="flex-1 bg-white/20 rounded-sm hover:bg-white/40 transition-colors" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          {/* CloudRik AI Chat Box (Spans 2 rows) */}
          <div className="col-span-1 row-span-2 bg-[#111113] rounded-xl border border-white/5 p-5 flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
              </div>
              <div>
                <div className="text-white text-sm font-medium">CloudRik AI</div>
                <div className="text-white/40 text-[10px]">Co-pilot active</div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="self-start max-w-[85%] bg-white/5 rounded-2xl rounded-tl-sm px-4 py-2 text-xs text-white/70">
                Hi, how can I help you deploy today?
              </div>
              <div className="self-end max-w-[85%] bg-white/10 rounded-2xl rounded-tr-sm px-4 py-2 text-xs text-white">
                My build is failing on step 3.
              </div>
              <div className="self-start max-w-[85%] bg-white/5 rounded-2xl rounded-tl-sm px-4 py-2 text-xs text-white/70">
                I found an issue in package.json. Let me fix it for you.
              </div>
            </div>

            <div className="mt-4 w-full h-8 rounded-lg bg-white/5 border border-white/5 flex items-center px-3">
              <div className="text-white/30 text-xs">Type your message...</div>
            </div>
          </div>

          {/* Bottom Left - Team */}
          <div className="col-span-1 bg-[#111113] rounded-xl border border-white/5 p-5 relative overflow-hidden">
            <div className="text-white/40 text-xs font-medium mb-4">Team Members</div>
            <div className="flex flex-col gap-4">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1c] border border-white/5 overflow-hidden flex items-center justify-center">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ismail&backgroundColor=transparent" alt="Ismail" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-white text-[11px] font-medium leading-tight">Ismail (You)</div>
                    <div className="text-white/30 text-[9px]">ismail@cloudrik.com</div>
                  </div>
                </div>
                <div className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[9px] text-white/60 flex items-center gap-1 cursor-pointer hover:bg-white/10 transition-colors">
                  Owner
                  <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1c] border border-white/5 overflow-hidden flex items-center justify-center">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia&backgroundColor=transparent" alt="Sofia" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-white text-[11px] font-medium leading-tight">Sofia Davis</div>
                    <div className="text-white/30 text-[9px]">m@example.com</div>
                  </div>
                </div>
                <div className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[9px] text-white/60 flex items-center gap-1 cursor-pointer hover:bg-white/10 transition-colors">
                  Member
                  <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1c] border border-white/5 overflow-hidden flex items-center justify-center">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jackson&backgroundColor=transparent" alt="Jackson" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-white text-[11px] font-medium leading-tight">Jackson Lee</div>
                    <div className="text-white/30 text-[9px]">p@example.com</div>
                  </div>
                </div>
                <div className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[9px] text-white/60 flex items-center gap-1 cursor-pointer hover:bg-white/10 transition-colors">
                  Member
                  <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* 4th member that will be partially hidden/blurred */}
              <div className="flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1c] border border-white/5 overflow-hidden flex items-center justify-center">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=transparent" alt="Alex" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-white text-[11px] font-medium leading-tight">Alex Chen</div>
                    <div className="text-white/30 text-[9px]">a@example.com</div>
                  </div>
                </div>
                <div className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[9px] text-white/60 flex items-center gap-1">
                  Member
                  <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

            </div>

            {/* Inner fade overlay to blur/hide the bottom items */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#111113] to-transparent pointer-events-none"></div>
          </div>

          {/* Bottom Middle - Server Load */}
          <div className="col-span-1 bg-[#111113] rounded-xl border border-white/5 p-5 flex flex-col">
            <div className="text-white/40 text-xs font-medium mb-1">Global Traffic</div>
            <div className="text-white/30 text-[10px] mb-4">Edge network requests per minute</div>
            <div className="flex-1 relative w-full mt-2">
              {/* Fake dual line chart */}
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full stroke-white/40 fill-none" strokeWidth="1">
                <path d="M0 30 Q 25 10, 50 25 T 100 15" />
                <path d="M0 35 Q 25 20, 50 30 T 100 25" strokeOpacity="0.3" strokeDasharray="2 2" />
              </svg>
            </div>
          </div>

          {/* Fade Overlay for the bottom part inside the grid itself */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none"></div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Morphing Navbar Component ---
export const MorphingNav = () => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 100);
  });

  return (
    <div className={`fixed top-0 inset-x-0 z-[5000] flex justify-center pointer-events-none transition-all duration-300 ${isScrolled ? "pt-6" : "pt-6"}`}>
      <motion.nav
        layout
        className={`pointer-events-auto flex items-center justify-between rounded-full transition-colors duration-300 ${isScrolled
          ? "bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 px-6 py-3 shadow-2xl w-[900px] max-w-[95vw]"
          : "bg-transparent border-transparent px-8 py-2 w-full max-w-7xl"
          }`}
      >
        <motion.div layout className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="25 30 48 48" className="w-8 h-8 text-white shrink-0">
            <g fill="currentColor">
              <polygon points="35,32 65,32 57,44 27,44"/>
              <polygon points="41,49 71,49 63,61 33,61"/>
              <polygon points="61,66 71,66 71,76"/>
            </g>
          </svg>
          <span className="font-bold text-lg tracking-widest text-white whitespace-nowrap">CloudRik</span>
        </motion.div>

        <motion.div layout className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          {/* Features Dropdown */}
          <div className="relative group px-2 py-2">
            <button className="flex items-center gap-1 hover:text-white transition-colors">
              Features <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
              <div className="w-[700px] bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-4 grid grid-cols-3 gap-2 relative">
                {/* Glow behind dropdown */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none"></div>
                
                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <Database className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">PostgreSQL</div>
                    <div className="text-white/40 text-xs line-clamp-1">Managed databases</div>
                  </div>
                </a>

                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <Rocket className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">Deployments</div>
                    <div className="text-white/40 text-xs line-clamp-1">Git push to deploy</div>
                  </div>
                </a>

                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <Activity className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">Analytics</div>
                    <div className="text-white/40 text-xs line-clamp-1">Live web metrics</div>
                  </div>
                </a>

                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <Settings className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">Env Vars</div>
                    <div className="text-white/40 text-xs line-clamp-1">Secure secrets</div>
                  </div>
                </a>

                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <Bot className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">CloudRik AI</div>
                    <div className="text-white/40 text-xs line-clamp-1">Your infrastructure copilot</div>
                  </div>
                </a>

                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <Globe className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">Global Edge</div>
                    <div className="text-white/40 text-xs line-clamp-1">Fast CDN routing</div>
                  </div>
                </a>

                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <Webhook className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">Webhooks</div>
                    <div className="text-white/40 text-xs line-clamp-1">Real-time event hooks</div>
                  </div>
                </a>

                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <Lock className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">Authentication</div>
                    <div className="text-white/40 text-xs line-clamp-1">Secure user auth</div>
                  </div>
                </a>

                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <Cloud className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">Cloud CDN</div>
                    <div className="text-white/40 text-xs line-clamp-1">Lightning fast delivery</div>
                  </div>
                </a>

                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <Key className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">API Tokens</div>
                    <div className="text-white/40 text-xs line-clamp-1">Access control</div>
                  </div>
                </a>

                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <Shield className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">Hacker-Shield</div>
                    <div className="text-white/40 text-xs line-clamp-1">DDoS & bot protection</div>
                  </div>
                </a>

                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <HardDrive className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">Storage</div>
                    <div className="text-white/40 text-xs line-clamp-1">S3-compatible objects</div>
                  </div>
                </a>

                <a href="/#features" className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                  <div className="bg-white/5 p-2 rounded-lg group-hover/item:bg-white/10 transition-colors">
                    <Zap className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">Real-time</div>
                    <div className="text-white/40 text-xs line-clamp-1">WebSockets & Sync</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <a href="/#docs" className="hover:text-white transition-colors">Docs</a>
        </motion.div>

        <motion.div layout className="origin-right">
          <Link href="/sign-in" className="px-5 py-2.5 text-sm font-semibold rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all whitespace-nowrap">
            Get Started
          </Link>
        </motion.div>
      </motion.nav>
    </div>
  );
};

// --- Main Page Component ---

export default function LandingV2() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 overflow-x-hidden">
      {/* Background Radial Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center">
        <div className="w-[800px] h-[600px] bg-white/[0.03] rounded-full blur-[120px] -translate-y-1/2"></div>
      </div>

      <div className="relative z-10">
        {/* Morphing Navbar */}
        <MorphingNav />

        {/* Hero Section */}
        <div className="pt-40 pb-0 px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40"
          >
            The Ultimate <br className="hidden md:block" /> Full-Stack Cloud
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="max-w-2xl mx-auto text-white/50 text-lg mb-10 leading-relaxed"
          >
            Deploy your apps in seconds, manage PostgreSQL databases, and scale globally. Everything you need to ship faster, without the devops headache.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex justify-center"
          >
            <Link href="/sign-in" className="px-12 py-2.5 text-sm font-semibold rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all relative overflow-hidden group">
              <span className="relative z-10 flex items-center gap-2">Deploy Now</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </Link>
          </motion.div>
        </div>

        {/* 3D Dashboard Mockup */}
        <HeroScrollContainer />

        {/* Supported Languages Ticker */}
        <div className="pt-10 pb-20 mt-4 relative overflow-hidden">
          <div className="text-center text-lg md:text-xl font-medium text-white/80 mb-16 tracking-wide">
            Deploy your favorite frameworks instantly
          </div>

          <div
            className="relative w-full max-w-6xl mx-auto overflow-hidden flex items-center"
            style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)' }}
          >
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
              className="flex items-center w-max"
            >
              {/* Two identical blocks to create a perfect seamless loop */}
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-20 pr-20">
                  {/* Next.js */}
                  <div className="flex items-center gap-2 transition-all duration-300">
                    <svg viewBox="0 0 128 128" className="w-8 h-8 text-white"><path fill="currentColor" d="M64 0a64 64 0 1064 64A64.07 64.07 0 0064 0zm0 117.76A53.76 53.76 0 11117.76 64 53.92 53.92 0 0164 117.76z" /><path fill="currentColor" d="M80 92.88l-27.73-43V92.88H44.1V35.12h8.17l27.73 43V35.12H88.2v57.76z" /></svg>
                    <span className="text-white font-bold text-xl tracking-tight">Next.js</span>
                  </div>

                  {/* React */}
                  <div className="flex items-center gap-2 transition-all duration-300">
                    <svg viewBox="-11.5 -10.23174 23 20.46348" className="w-8 h-8"><circle cx="0" cy="0" r="2.05" fill="#61dafb" /><g stroke="#61dafb" strokeWidth="1" fill="none"><ellipse rx="11" ry="4.2" /><ellipse rx="11" ry="4.2" transform="rotate(60)" /><ellipse rx="11" ry="4.2" transform="rotate(120)" /></g></svg>
                    <span className="text-white font-bold text-xl tracking-tight">React</span>
                  </div>

                  {/* Node.js */}
                  <div className="flex items-center gap-2 transition-all duration-300 text-[#339933]">
                    <span className="font-extrabold text-2xl tracking-tighter">Node.js</span>
                  </div>

                  {/* Vue */}
                  <div className="flex items-center gap-2 transition-all duration-300">
                    <svg viewBox="0 0 256 221" className="w-7 h-7"><path d="M204.8 0H256L128 220.8 0 0h51.2L128 132.48 204.8 0z" fill="#41B883" /><path d="M204.8 0H153.6L128 44.16 102.4 0H51.2L128 132.48 204.8 0z" fill="#35495E" /></svg>
                    <span className="text-white font-bold text-xl tracking-tight">Vue</span>
                  </div>

                  {/* Python */}
                  <div className="flex items-center gap-2 transition-all duration-300 text-[#3776AB]">
                    <span className="font-extrabold text-2xl tracking-tighter">Python</span>
                  </div>

                  {/* Docker */}
                  <div className="flex items-center gap-2 transition-all duration-300 text-[#0db7ed]">
                    <span className="font-extrabold text-2xl tracking-tighter">Docker</span>
                  </div>

                  {/* Svelte */}
                  <div className="flex items-center gap-2 transition-all duration-300 text-[#FF3E00]">
                    <span className="font-extrabold text-2xl tracking-tighter">Svelte</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Features & Benefits Section */}
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-white">Features &</span> <span className="text-white/40">Benefits</span>
            </h2>
          </div>

          {/* Feature Cards Grid (Empty logic as requested) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Card 1 - Supaspire */}
            <div className="h-[420px] rounded-[2rem] bg-[#111111] border border-white/5 hover:border-white/10 transition-colors p-8 flex flex-col relative overflow-hidden group">

              {/* Graphic at TOP */}
              <div className="absolute inset-x-0 top-0 h-[260px] z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="relative flex items-center justify-center opacity-80 group-hover:opacity-100 transition-transform duration-700 w-full h-full -translate-y-4 scale-90 group-hover:scale-95">
                  {/* Center Core (Database) */}
                  <div className="absolute z-10 w-16 h-16 rounded-full bg-[#161618] border border-white/10 flex items-center justify-center shadow-xl">
                    <svg className="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                  </div>

                  {/* Orbit 1 */}
                  <div className="absolute w-[180px] h-[180px] rounded-full border border-white/10 border-dashed animate-[spin_25s_linear_infinite]">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-xl bg-[#161618] border border-white/10 flex items-center justify-center shadow-lg animate-[spin_25s_linear_infinite_reverse]">
                      <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-xl bg-[#161618] border border-white/10 flex items-center justify-center shadow-lg animate-[spin_25s_linear_infinite_reverse]">
                      <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                  </div>

                  {/* Orbit 2 */}
                  <div className="absolute w-[280px] h-[280px] rounded-full border border-white/5 animate-[spin_35s_linear_infinite_reverse]">
                    <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-xl bg-[#161618] border border-white/10 flex items-center justify-center shadow-lg animate-[spin_35s_linear_infinite]">
                      <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    </div>
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 rounded-xl bg-[#161618] border border-white/10 flex items-center justify-center shadow-lg animate-[spin_35s_linear_infinite]">
                      <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                  </div>

                  {/* Ambient Glow */}
                  <div className="absolute w-64 h-64 bg-white/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-white/10 transition-colors duration-700"></div>
                </div>
              </div>

              {/* Text at BOTTOM */}
              <div className="relative z-10 mt-auto">
                <h3 className="text-2xl font-semibold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                  Supaspire Backend
                </h3>
                <p className="text-white/40 text-sm leading-relaxed pr-4">
                  The complete open-source backend natively integrated. Instantly deploy PostgreSQL, Authentication, and Edge Functions without external providers.
                </p>
              </div>
            </div>

            {/* Right Card 1 - One-Click Deploy */}
            <div className="h-[400px] rounded-[2rem] bg-[#111111] border border-white/5 hover:border-white/10 transition-colors p-8 flex flex-col relative overflow-hidden group">

              {/* Text at TOP */}
              <div className="relative z-10">
                <h3 className="text-2xl font-semibold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                  One-Click Deploy
                </h3>
                <p className="text-white/40 text-sm leading-relaxed pr-6">
                  Push to Git and go live in seconds. CloudRik handles builds, tests, and global distribution automatically.
                </p>
              </div>

              {/* Minimal Graphic at BOTTOM */}
              <div className="absolute inset-x-0 bottom-0 h-[220px] flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-4 sm:gap-6 transform -translate-y-4">
                  {/* GitHub Repo Icon */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:bg-white/[0.05] transition-colors">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8 text-white/80 group-hover:text-white transition-colors" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </div>

                  {/* Connecting Line with Animated Dot */}
                  <div className="w-12 sm:w-16 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent relative">
                     <motion.div 
                        className="absolute top-1/2 left-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400 -translate-y-1/2 shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                        animate={{ left: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                     />
                  </div>

                  {/* Deploy Button */}
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-xl blur-[10px] opacity-40 group-hover:opacity-80 transition duration-700"></div>
                    <div className="relative px-5 py-2.5 sm:px-6 sm:py-3 bg-black rounded-xl border border-white/10 flex items-center justify-center gap-2 shadow-2xl">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                      <span className="text-white font-medium text-sm">Deploy</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Left Card 2 - Native Feature Flags */}
            <div className="h-[400px] rounded-[2rem] bg-[#111111] border border-white/5 hover:border-white/10 transition-colors p-8 flex flex-col relative overflow-hidden group">

              {/* Text at TOP */}
              <div className="relative z-10">
                <h3 className="text-2xl font-semibold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                  Native Feature Flags
                </h3>
                <p className="text-white/40 text-sm leading-relaxed pr-6">
                  Test in production safely. Manage kill switches and percentage-based rollouts directly from your dashboard.
                </p>
              </div>

              {/* Animated List Graphic at BOTTOM */}
              <div className="absolute inset-x-0 bottom-0 h-[290px] overflow-hidden pointer-events-none">
                {/* Bottom fade */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#111111] to-transparent z-10 pointer-events-none"></div>
                {/* Top fade */}
                <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#111111] to-transparent z-10 pointer-events-none"></div>

                <AnimatedList delay={1200} className="px-4 pt-2 gap-2">
                  {[
                    { flag: "dark_mode_v2", status: "Enabled", pct: "100%", color: "#4ade80", dot: "#166534" },
                    { flag: "checkout_redesign", status: "47% Rollout", pct: "47%", color: "#c084fc", dot: "#581c87" },
                    { flag: "new_onboarding", status: "Enabled", pct: "100%", color: "#60a5fa", dot: "#1e3a8a" },
                    { flag: "ai_suggestions", status: "5% Canary", pct: "5%", color: "#f59e0b", dot: "#78350f" },
                    { flag: "legacy_editor", status: "Disabled", pct: "0%", color: "#6b7280", dot: "#1f2937" },
                    { flag: "payments_v3", status: "Enabled", pct: "100%", color: "#4ade80", dot: "#166534" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between w-full rounded-xl px-3 py-2 border border-white/5 bg-white/[0.03] backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }}></div>
                        <span className="text-[11px] text-white/60 font-mono">{item.flag}</span>
                      </div>
                      <span className="text-[10px] font-semibold font-mono" style={{ color: item.color }}>{item.status}</span>
                    </div>
                  ))}
                </AnimatedList>
              </div>

            </div>

            {/* Right Card 2 - Global Edge Network */}
            <div className="h-[420px] rounded-[2rem] bg-[#111111] border border-white/5 hover:border-white/10 transition-colors p-8 flex flex-col relative overflow-hidden group">

              {/* Graphic at TOP */}
              <div className="absolute inset-x-0 top-0 h-[260px] z-0 pointer-events-none overflow-hidden">
                <div className="relative w-full h-[150%] -top-10 opacity-70 group-hover:opacity-100 transition-opacity duration-700">
                  <WorldMap
                    dots={[
                      { start: { lat: 64.2008, lng: -149.4937 }, end: { lat: 34.0522, lng: -118.2437 } },
                      { start: { lat: 64.2008, lng: -149.4937 }, end: { lat: -15.7975, lng: -47.8919 } },
                      { start: { lat: -15.7975, lng: -47.8919 }, end: { lat: 38.7223, lng: -9.1393 } },
                      { start: { lat: 51.5074, lng: -0.1278 }, end: { lat: 28.6139, lng: 77.209 } },
                      { start: { lat: 28.6139, lng: 77.209 }, end: { lat: 43.1332, lng: 131.9113 } },
                      { start: { lat: 28.6139, lng: 77.209 }, end: { lat: -1.2921, lng: 36.8219 } },
                    ]}
                  />
                  {/* Ambient Map Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[100px] bg-blue-500/10 rounded-[100%] blur-[50px] pointer-events-none group-hover:bg-blue-500/15 transition-colors duration-700"></div>
                </div>
              </div>

              {/* Text at BOTTOM */}
              <div className="relative z-10 mt-auto">
                <h3 className="text-2xl font-semibold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                  Global Edge Network
                </h3>
                <p className="text-white/40 text-sm leading-relaxed pr-4">
                  Zero-latency deployments across 100+ cities. Your application is automatically distributed globally on our edge infrastructure for maximum performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 pt-24 pb-12 border-t border-white/10 bg-black mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 md:gap-8 mb-16">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="25 30 48 48" className="w-8 h-8 text-white shrink-0">
                  <g fill="currentColor">
                    <polygon points="35,32 65,32 57,44 27,44"/>
                    <polygon points="41,49 71,49 63,61 33,61"/>
                    <polygon points="61,66 71,66 71,76"/>
                  </g>
                </svg>
                <span className="font-bold text-xl tracking-widest text-white">CloudRik</span>
              </Link>
              <p className="text-white/40 font-medium mt-4 max-w-sm leading-relaxed">
                Reclaiming the Cloud for Developers. 
                <br/>No setup, no servers, just code.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-white tracking-wide">Product</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-white tracking-wide">Resources</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-white tracking-wide">Company</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
            <div>© {new Date().getFullYear()} CloudRik Inc. All rights reserved.</div>
            <div className="flex items-center gap-5">
              {/* Twitter / X */}
              <a href="#" className="text-white/40 hover:text-white transition-colors" aria-label="Twitter">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* GitHub */}
              <a href="#" className="text-white/40 hover:text-white transition-colors" aria-label="GitHub">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .321.218.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.373-12-12-12z" />
                </svg>
              </a>
              {/* Discord */}
              <a href="#" className="text-white/40 hover:text-white transition-colors" aria-label="Discord">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" className="text-white/40 hover:text-white transition-colors" aria-label="Instagram">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
