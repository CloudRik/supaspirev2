import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Zap, Github, Database, Shield, Activity, ArrowRight, Sparkles, TerminalSquare, CloudLightning, Cpu, Globe, Rocket, GitBranch, Lock, Star, Quote } from "lucide-react";
import { Switch, Route, Router as WouterRouter, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SignIn from "@/pages/sign-in";
import Dashboard from "@/pages/dashboard";
import Import from "@/pages/import";
import Deploying from "@/pages/deploying";
import ProjectDetail from "@/pages/project";
import WebhookPage from "@/pages/webhook";
import DeploymentsPage from "@/pages/deployments";
import LogsPage from "@/pages/logs";
import DomainsPage from "@/pages/domains";
import EnvVarsPage from "@/pages/env-vars";
import InfrastructurePage from "@/pages/infrastructure";
import { ProjectDeleteRoute } from "@/pages/project";

const queryClient = new QueryClient();

function TypewriterTerminal() {
  const [text, setText] = useState("");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const lines = [
      "$ git push origin main",
      "$ Building... Done!",
      "$ Deployed to zenith-os.link"
    ];

    let timer: NodeJS.Timeout;

    if (step === 0) {
      let i = 0;
      timer = setInterval(() => {
        setText(lines[0].substring(0, i + 1));
        i++;
        if (i === lines[0].length) {
          clearInterval(timer);
          setTimeout(() => setStep(1), 1000);
        }
      }, 100);
    } else if (step === 1) {
      setText(lines[0] + "\n" + lines[1]);
      timer = setTimeout(() => setStep(2), 1500);
    } else if (step === 2) {
      setText(lines[0] + "\n" + lines[1] + "\n" + lines[2]);
      timer = setTimeout(() => {
        setStep(0);
        setText("");
      }, 4000);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(timer);
    };
  }, [step]);

  return (
    <div className="font-mono text-sm sm:text-base text-[hsl(var(--primary))] p-4 whitespace-pre-wrap min-h-[7rem] sm:min-h-[8rem] leading-6">
      {text}
      <span className="animate-pulse">_</span>
    </div>
  );
}

function Home() {
  return (
    <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] selection:bg-[hsl(var(--primary))] selection:text-black overflow-x-hidden relative">

      {/* Abstract Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '4rem 4rem', maskImage: 'radial-gradient(circle at center, black, transparent 80%)' }}></div>

      {/* Glowing Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[hsl(var(--secondary))] opacity-10 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[hsl(var(--primary))] opacity-10 blur-[120px] pointer-events-none z-0"></div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--primary))] flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                <Zap className="w-5 h-5 text-[hsl(var(--primary))]" />
              </div>
              <span className="font-bold text-lg tracking-tight">Zenith OS</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
              <a href="#features" className="hover:text-[hsl(var(--primary))] transition-colors">Features</a>
              <a href="#comparison" className="hover:text-[hsl(var(--primary))] transition-colors">Comparison</a>
              <a href="#pricing" className="hover:text-[hsl(var(--primary))] transition-colors">Pricing</a>
              <a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Docs</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="hidden sm:inline-flex text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/sign-in" className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-[hsl(var(--primary))] text-black font-semibold text-sm hover:bg-[hsl(var(--primary))]/90 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all">
              Deploy
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 pt-24 pb-32 overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] whitespace-nowrap">
                The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))]">Full-Stack</span> Cloud.
              </h1>
              <h2 className="text-xl sm:text-2xl font-medium text-[hsl(var(--foreground))]/90 leading-snug max-w-xl mt-5">
                Deploy your website in 1 click <span className="text-[hsl(var(--muted-foreground))]">— no setup needed.</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-400 leading-loose tracking-wide max-w-xl mt-5">
                Automated deployment for your frontends, backends, and databases. On your own servers.
              </p>

              <div className="flex flex-col gap-4 max-w-md mt-16">
                <Link href="/sign-in" className="group inline-flex items-center justify-center gap-2.5 h-12 px-7 rounded-lg bg-[hsl(var(--primary))] text-black font-semibold text-base shadow-[0_0_18px_rgba(0,229,255,0.35)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] hover:bg-[hsl(var(--primary))]/90 transition-all w-fit">
                  <Github className="w-5 h-5" />
                  <span>Deploy with GitHub</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <Sparkles className="w-4 h-4 text-[hsl(var(--accent))]" />
                  <span>Try it free. No credit card required.</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              {/* 3D Dashboard Mockup */}
              <div className="relative z-10 perspective-1000">
                <motion.div
                  animate={{ rotateY: [-2, 2, -2], rotateX: [1, -1, 1] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm relative border-t-[hsl(var(--secondary))]/30"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="flex items-center gap-2 p-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    <div className="ml-2 text-xs text-[hsl(var(--muted-foreground))] font-mono">zenith-os-dashboard</div>
                  </div>

                  <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="col-span-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium flex items-center gap-2"><Activity className="w-4 h-4 text-[hsl(var(--primary))]" /> System Metrics</span>
                        <span className="text-xs text-[hsl(var(--primary))] font-mono animate-pulse">LIVE</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">CPU Usage</div>
                          <div className="text-2xl font-bold font-mono">12%</div>
                          <div className="w-full bg-[hsl(var(--muted))] h-1.5 rounded-full mt-2 overflow-hidden">
                            <motion.div
                              animate={{ width: ["10%", "15%", "12%", "18%", "12%"] }}
                              transition={{ repeat: Infinity, duration: 4 }}
                              className="h-full bg-[hsl(var(--primary))]"
                            ></motion.div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">RAM Usage</div>
                          <div className="text-2xl font-bold font-mono">32%</div>
                          <div className="w-full bg-[hsl(var(--muted))] h-1.5 rounded-full mt-2 overflow-hidden">
                            <motion.div
                              animate={{ width: ["30%", "34%", "32%", "35%", "32%"] }}
                              transition={{ repeat: Infinity, duration: 5 }}
                              className="h-full bg-[hsl(var(--secondary))]"
                            ></motion.div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 bg-black border border-[hsl(var(--border))] rounded-lg p-4 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <TypewriterTerminal />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Decorative elements behind mockup */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-[hsl(var(--primary))]/20 to-[hsl(var(--secondary))]/20 blur-[80px] -z-10 rounded-full"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TRUTH SECTION (Comparison) */}
      <section id="comparison" className="relative z-10 py-24 bg-[hsl(var(--muted))]/20 border-y border-[hsl(var(--border))]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Truth About Serverless</h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">Stop paying arbitrary markups for standard infrastructure.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {/* Bad Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] rounded-2xl p-8 grayscale opacity-80 scale-[0.98] transition-all"
            >
              <h3 className="text-xl font-bold mb-6 text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                <Globe className="w-5 h-5" /> OTHER PLATFORMS
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-[hsl(var(--muted-foreground))]">
                  <X className="w-5 h-5 text-red-500/70 shrink-0 mt-0.5" />
                  <span>$20/month per developer</span>
                </li>
                <li className="flex items-start gap-3 text-[hsl(var(--muted-foreground))]">
                  <X className="w-5 h-5 text-red-500/70 shrink-0 mt-0.5" />
                  <span>Hidden Bandwidth Taxes</span>
                </li>
                <li className="flex items-start gap-3 text-[hsl(var(--muted-foreground))]">
                  <X className="w-5 h-5 text-red-500/70 shrink-0 mt-0.5" />
                  <span>Limited to Frontends only</span>
                </li>
                <li className="flex items-start gap-3 text-[hsl(var(--muted-foreground))]">
                  <X className="w-5 h-5 text-red-500/70 shrink-0 mt-0.5" />
                  <span>Proprietary Lock-in</span>
                </li>
              </ul>
            </motion.div>

            {/* Good Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[hsl(var(--card))] border border-[hsl(var(--primary))]/50 rounded-2xl p-8 shadow-[0_0_30px_rgba(0,255,255,0.1)] relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))]"></div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity blur"></div>

              <h3 className="text-xl font-bold mb-6 text-[hsl(var(--primary))] flex items-center gap-2 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
                <Zap className="w-5 h-5" /> ZENITH OS
              </h3>
              <ul className="space-y-4 relative z-10">
                <li className="flex items-start gap-3 font-medium">
                  <Check className="w-5 h-5 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
                  <span>$10/month (Unlimited Team)</span>
                </li>
                <li className="flex items-start gap-3 font-medium">
                  <Check className="w-5 h-5 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
                  <span>Zero Bandwidth Markup (AWS Direct)</span>
                </li>
                <li className="flex items-start gap-3 font-medium">
                  <Check className="w-5 h-5 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
                  <span>Full-Stack: Frontend+Backend+DB</span>
                </li>
                <li className="flex items-start gap-3 font-medium">
                  <Check className="w-5 h-5 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
                  <span>Total Ownership (Data + Server)</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES (Bento Grid) */}
      <section id="features" className="relative z-10 py-24">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Precision-Engineered Infrastructure</h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">Everything you need to scale, without the configuration nightmare.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <BentoCard
              visual={<DatabaseVisual />}
              title="Built-in PostgreSQL Database"
              desc="PostgreSQL database built-in. No setup needed."
              delay={0}
            />
            <BentoCard
              visual={<ShieldVisual />}
              title="Auto-Healing Infrastructure"
              desc="Self-restarting apps. No downtime."
              delay={0.08}
            />
            <BentoCard
              visual={<SSLVisual />}
              title="Zero-Config SSL"
              desc="HTTPS built-in. One click."
              delay={0.16}
            />
            <BentoCard
              visual={<LogStreamVisual />}
              title="Real-time Log Streaming"
              desc="See everything live. No more 'where's the log?'"
              delay={0.24}
            />
            <BentoCard
              visual={<ScaleVisual />}
              title="Infinite Scalability"
              desc="One click to upgrade CPU/RAM instantly."
              delay={0.32}
            />
            <BentoCard
              visual={<GitFlowVisual />}
              title="GitHub Native"
              desc="Push to deploy. No yaml config."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (3 Steps) */}
      <section className="relative z-10 py-24 bg-[hsl(var(--muted))]/20 border-y border-[hsl(var(--border))]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">From Code to Cloud in 60s</h2>
          </div>

          <div className="relative">
            {/* Animated Connector Line */}
            <div className="absolute top-12 left-[10%] right-[10%] h-0.5 bg-[hsl(var(--border))] hidden md:block">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] origin-left"
              ></motion.div>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              <StepCard
                num="1"
                title="Connect"
                desc="Select your repository from GitHub."
                delay={0}
              />
              <StepCard
                num="2"
                title="Config"
                desc="Choose your plan (Hobby or Pro)."
                delay={0.3}
              />
              <StepCard
                num="3"
                title="Launch"
                desc="Zenith OS provisions your server and ships it live — automatically."
                delay={0.6}
              />
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">No per-seat licenses. No bandwidth extortion.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Hobby */}
            <PricingCard
              name="HOBBY"
              price="$0"
              features={["Shared server", "Unlimited projects", "Community support"]}
              cta="Start Free"
            />
            {/* Pro (Elevated) */}
            <PricingCard
              name="PRO"
              price="$12 - $15"
              features={["Dedicated Server", "Managed DB", "Priority Support", "Custom Domains"]}
              cta="Start Free"
              popular={true}
            />
            {/* Business */}
            <PricingCard
              name="BUSINESS"
              price="Custom"
              features={["Enterprise security", "Multi-region setup", "SLA guarantee", "Dedicated support"]}
              cta="Contact Sales"
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="relative z-10 py-24 bg-[hsl(var(--muted))]/20 border-y border-[hsl(var(--border))] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[hsl(var(--primary))]/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 bg-[hsl(var(--primary))]/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 bg-[hsl(var(--secondary))]/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 max-w-3xl relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30 text-xs font-medium text-[hsl(var(--primary))] mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Loved by founders</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">From the trenches</h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-7 md:p-10 shadow-[0_0_60px_rgba(0,229,255,0.06)]"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary))] to-transparent" />

            <div className="absolute -top-4 left-8 w-10 h-10 rounded-full bg-[hsl(var(--background))] border border-[hsl(var(--primary))]/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.2)]">
              <Quote className="w-4 h-4 text-[hsl(var(--primary))] fill-[hsl(var(--primary))]" />
            </div>

            <div className="flex gap-1 mb-5 mt-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="w-4 h-4 fill-[hsl(var(--accent))] text-[hsl(var(--accent))]" />
              ))}
            </div>

            <blockquote className="text-lg md:text-xl font-medium leading-relaxed text-white mb-8 tracking-tight">
              I saved <span className="text-[hsl(var(--primary))] font-semibold">$400/month</span> switching from Vercel to Zenith OS. Build times dropped from 3 minutes to 40 seconds, and I haven't paid a bandwidth bill since. Best decision for my startup.
            </blockquote>

            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src="https://i.pravatar.cc/120?img=68"
                  alt="Arjun Reddy"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[hsl(var(--primary))]/30 shadow-[0_0_18px_rgba(0,229,255,0.25)]"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[hsl(var(--primary))] border-2 border-[hsl(var(--card))] flex items-center justify-center">
                  <Check className="w-2 h-2 text-black" strokeWidth={4} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white">Arjun Reddy</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                  Founder &amp; CTO
                </div>
              </div>
            </div>
          </motion.div>

          <p className="text-center text-xs text-[hsl(var(--muted-foreground))]/70 mt-6 italic">
            Customer story shared with permission
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 pt-20 pb-10 bg-[hsl(var(--background))] border-t border-[hsl(var(--border))]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--primary))] flex items-center justify-center shadow-[0_0_10px_rgba(0,255,255,0.3)]">
                  <Zap className="w-3 h-3 text-[hsl(var(--primary))]" />
                </div>
                <span className="font-bold text-lg tracking-tight">Zenith OS</span>
              </Link>
              <p className="text-[hsl(var(--muted-foreground))] font-medium mt-4">
                "Reclaiming the Cloud for Developers"
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                <li><a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Comparison</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                <li><a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Docs</a></li>
                <li><a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                <li><a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-[hsl(var(--primary))] transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[hsl(var(--border))] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[hsl(var(--muted-foreground))]">
            <div>© {new Date().getFullYear()} Zenith OS. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BentoCard({ visual, title, desc, delay, className = "" }: { visual: React.ReactNode; title: string; desc: string; delay: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden hover:border-[hsl(var(--primary))]/40 hover:shadow-[0_0_32px_rgba(0,229,255,0.1)] transition-all duration-500 ${className}`}
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[hsl(var(--muted))]/40 via-transparent to-[hsl(var(--secondary))]/[0.04] border-b border-[hsl(var(--border))]">
        {visual}
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold mb-1.5 tracking-tight">{title}</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function DatabaseVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
      <div className="relative w-[110px] h-[120px]">
        <svg width="110" height="120" viewBox="0 0 110 120" className="absolute inset-0">
          <defs>
            <linearGradient id="db-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <path d="M 15 28 L 15 92 Q 15 104 55 104 Q 95 104 95 92 L 95 28" fill="url(#db-grad)" stroke="hsl(var(--primary))" strokeOpacity="0.6" strokeWidth="1.5" />
          <ellipse cx="55" cy="50" rx="40" ry="11" fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 3" />
          <ellipse cx="55" cy="72" rx="40" ry="11" fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 3" />
          <ellipse cx="55" cy="28" rx="40" ry="11" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeOpacity="0.7" strokeWidth="1.5" />
        </svg>
        <motion.div
          className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[80px] h-[22px] rounded-[50%] border border-[hsl(var(--primary))] pointer-events-none"
          animate={{ opacity: [0, 0.5, 0], scale: [0.95, 1.2, 1.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
        {[0, 0.8, 1.6].map((delay, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] shadow-[0_0_10px_hsl(var(--primary))]"
            style={{ top: -6 }}
            animate={{ y: [0, 32], opacity: [0, 1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay, ease: "easeIn" }}
          />
        ))}
      </div>
    </div>
  );
}

function ShieldVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-12 h-12 rounded-full border border-[hsl(var(--primary))]/50"
          animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
        />
      ))}
      <motion.div
        className="absolute w-24 h-24 rounded-full border-2 border-transparent"
        style={{ borderTopColor: "hsl(var(--primary))", borderRightColor: "hsl(var(--primary) / 0.3)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))]/20 to-[hsl(var(--secondary))]/20 border border-[hsl(var(--primary))]/40 flex items-center justify-center"
        animate={{ boxShadow: ["0 0 0 rgba(0,229,255,0.4)", "0 0 24px rgba(0,229,255,0.6)", "0 0 0 rgba(0,229,255,0.4)"] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Shield className="w-6 h-6 text-[hsl(var(--primary))]" />
      </motion.div>
    </div>
  );
}

function SSLVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        className="absolute w-28 h-28 rounded-full border border-dashed border-[hsl(var(--primary))]/40"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[hsl(var(--primary))] shadow-[0_0_10px_hsl(var(--primary))]" />
      </motion.div>
      <motion.div
        className="absolute w-20 h-20 rounded-full border border-[hsl(var(--secondary))]/40"
        animate={{ rotate: -360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[hsl(var(--secondary))] shadow-[0_0_8px_hsl(var(--secondary))]" />
      </motion.div>
      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--primary))]/30 to-[hsl(var(--secondary))]/30 border border-[hsl(var(--primary))]/50 flex items-center justify-center">
        <Globe className="w-6 h-6 text-[hsl(var(--primary))]" />
      </div>
      <motion.div
        className="absolute top-3 right-3 px-2 py-1 rounded-md bg-[hsl(var(--primary))]/15 border border-[hsl(var(--primary))]/40 text-[10px] font-mono text-[hsl(var(--primary))] flex items-center gap-1"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Lock className="w-2.5 h-2.5" />
        <span>HTTPS</span>
      </motion.div>
    </div>
  );
}

function LogStreamVisual() {
  const lines = [
    { t: "12:01", lvl: "INFO", c: "text-[hsl(var(--primary))]", msg: "GET /api/users 200 12ms" },
    { t: "12:01", lvl: "INFO", c: "text-[hsl(var(--primary))]", msg: "POST /deploy queued" },
    { t: "12:02", lvl: "WARN", c: "text-[hsl(var(--accent))]", msg: "cache miss key=user:42" },
    { t: "12:02", lvl: "INFO", c: "text-[hsl(var(--primary))]", msg: "build complete in 8.4s" },
    { t: "12:03", lvl: "INFO", c: "text-[hsl(var(--primary))]", msg: "deployed v1.0.42" },
    { t: "12:03", lvl: "INFO", c: "text-[hsl(var(--primary))]", msg: "GET /health 200 3ms" },
  ];
  return (
    <div className="absolute inset-0 p-3">
      <div className="absolute inset-3 rounded-lg bg-black/50 border border-[hsl(var(--border))] overflow-hidden">
        <div className="flex items-center gap-1.5 px-2 py-1 border-b border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/60">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
          <span className="ml-auto font-mono text-[9px] text-[hsl(var(--muted-foreground))]">~ live</span>
        </div>
        <div className="relative h-[120px] overflow-hidden">
          <motion.div
            className="absolute inset-x-0 top-0 px-2 py-1.5 space-y-1 font-mono text-[10px]"
            animate={{ y: [0, -84] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            {[...lines, ...lines].map((l, i) => (
              <div key={i} className="flex gap-1.5 whitespace-nowrap">
                <span className="text-[hsl(var(--muted-foreground))]/70">{l.t}</span>
                <span className={l.c}>{l.lvl}</span>
                <span className="text-[hsl(var(--muted-foreground))] truncate">{l.msg}</span>
              </div>
            ))}
          </motion.div>
          <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

function ScaleVisual() {
  const bars = [
    { label: "CPU", color: "hsl(var(--primary))", glow: "rgba(0,229,255,0.4)" },
    { label: "RAM", color: "hsl(var(--secondary))", glow: "rgba(139,92,246,0.4)" },
    { label: "NET", color: "hsl(var(--accent))", glow: "rgba(245,158,11,0.4)" },
  ];
  return (
    <div className="absolute inset-0 flex items-end justify-center gap-3 px-8 pb-5 pt-4">
      {bars.map((b, i) => (
        <div key={b.label} className="flex flex-col items-center gap-1.5 flex-1 max-w-[44px]">
          <div className="relative w-full h-[110px] rounded-md bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] overflow-hidden">
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-sm"
              style={{ background: `linear-gradient(to top, ${b.color}, ${b.color})`, boxShadow: `0 0 16px ${b.glow}` }}
              animate={{ height: ["20%", "85%", "55%", "95%", "30%"] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
            />
            <motion.div
              className="absolute inset-x-0 h-1.5 bg-white/40 blur-[2px]"
              animate={{ top: ["100%", "0%"] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

function GitFlowVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 280 130" className="w-full h-full px-3">
        <line x1="20" y1="90" x2="260" y2="90" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <path d="M 80 90 Q 110 90 110 50 L 200 50 Q 220 50 220 90" fill="none" stroke="hsl(var(--secondary))" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="3 3" />

        {[40, 80, 140, 180, 220, 260].map((cx, i) => (
          <motion.circle
            key={i}
            cx={cx}
            cy={90}
            r={5}
            fill="hsl(var(--primary))"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1], scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, delay: i * 0.35, repeat: Infinity, repeatDelay: 2.5 }}
            style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary)))" }}
          />
        ))}

        {[110, 160, 200].map((cx, i) => (
          <motion.circle
            key={`f-${i}`}
            cx={cx}
            cy={50}
            r={4}
            fill="hsl(var(--secondary))"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0.5] }}
            transition={{ duration: 0.5, delay: 1 + i * 0.4, repeat: Infinity, repeatDelay: 2.5 }}
          />
        ))}

        <motion.circle
          r={3.5}
          cy={90}
          cx={20}
          fill="hsl(var(--accent))"
          animate={{ cx: [20, 260], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ filter: "drop-shadow(0 0 8px hsl(var(--accent)))" }}
        />

        <text x="20" y="115" fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="monospace">main</text>
        <text x="180" y="40" fill="hsl(var(--secondary))" fontSize="9" fontFamily="monospace" opacity="0.7">feature/api</text>
      </svg>
    </div>
  );
}

function StepCard({ num, title, desc, delay }: { num: string, title: string, desc: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="flex flex-col items-center text-center relative"
    >
      <div className="w-24 h-24 rounded-full bg-[hsl(var(--card))] border-2 border-[hsl(var(--border))] flex items-center justify-center text-3xl font-bold mb-6 relative z-10 shadow-lg shadow-black/50">
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-[hsl(var(--muted-foreground))]">
          {num}
        </span>
        <div className="absolute inset-[-2px] rounded-full border-2 border-[hsl(var(--primary))] opacity-0 hover:opacity-100 hover:scale-110 transition-all duration-300 blur-[2px]"></div>
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-[hsl(var(--muted-foreground))] max-w-[250px]">{desc}</p>
    </motion.div>
  );
}

function PricingCard({ name, price, features, cta, popular = false }: { name: string, price: string, features: string[], cta: string, popular?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-[hsl(var(--card))] rounded-2xl p-8 flex flex-col relative transition-all hover:-translate-y-1 ${popular
        ? 'border border-[hsl(var(--primary))] shadow-[0_0_30px_rgba(0,255,255,0.1)] md:-mt-8 md:mb-8'
        : 'border border-[hsl(var(--border))]'
        }`}
    >
      {popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[hsl(var(--accent))] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Most Popular
        </div>
      )}

      <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-4">{name}</h3>
      <div className="text-4xl font-bold mb-6">{price}</div>

      <div className="w-full h-px bg-[hsl(var(--border))] mb-6"></div>

      <ul className="space-y-4 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <Check className="w-4 h-4 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button className={`w-full py-3 rounded-md font-semibold transition-all ${popular
        ? 'bg-[hsl(var(--primary))] text-black hover:bg-[hsl(var(--primary))]/90 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]'
        : 'bg-[hsl(var(--muted))] text-white hover:bg-[hsl(var(--border))]'
        }`}>
        {cta}
      </button>
    </motion.div>
  );
}



function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sign-in" component={SignIn} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/import" component={Import} />
      <Route path="/deploying" component={Deploying} />
      <Route path="/project/:name/webhook" component={WebhookPage} />
      <Route path="/project/:name" component={ProjectDetail} />
      <Route path="/project/:name/delete" component={ProjectDeleteRoute} />
      <Route path="/deployments" component={DeploymentsPage} />
      <Route path="/logs" component={LogsPage} />
      <Route path="/domains" component={DomainsPage} />
      <Route path="/env" component={EnvVarsPage} />
      <Route path="/infrastructure" component={InfrastructurePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
