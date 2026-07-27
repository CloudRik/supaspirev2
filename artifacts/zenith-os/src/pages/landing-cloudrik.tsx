import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Zap,
  Github,
  Database,
  Shield,
  Activity,
  ArrowRight,
  GitBranch,
  Lock,
  Check,
  ChevronRight,
} from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ─── Cloudrik content (from App.tsx) ─── */
const BRAND = "Cloudrik";
const TAGLINE = "Reclaiming the Cloud for Developers";

const hero = {
  title: "The Full-Stack Cloud",
  subtitle: "Deploy your website in 1 click — no setup needed.",
  desc: "Automated deployment for your frontends, backends, and databases. On your own servers.",
  cta: "Deploy with GitHub",
  note: "Try it free. No credit card required.",
};

const trustedLogos = [
  { name: "GitHub", src: "https://cdn.simpleicons.org/github/white" },
  { name: "AWS", src: "https://cdn.simpleicons.org/amazonaws/white" },
  { name: "Docker", src: "https://cdn.simpleicons.org/docker/white" },
  { name: "PostgreSQL", src: "https://cdn.simpleicons.org/postgresql/white" },
];

const featuresIntro = {
  title: "Precision-Engineered Infrastructure",
  desc: "Everything you need to scale, without the configuration nightmare.",
};

const bentoItems = [
  {
    title: "Built-in PostgreSQL Database",
    desc: "PostgreSQL database built-in. No setup needed.",
    stat: null,
  },
  {
    title: "Available Everywhere",
    desc: "Custom domains, SSL, and zero-config HTTPS — deploy globally on your servers.",
    stat: "Full-Stack",
  },
  {
    title: "GitHub Native",
    desc: "Push to deploy. No yaml config. From code to cloud in 60 seconds.",
    stat: "60s",
    large: true,
  },
  {
    title: "People love us",
    desc: "See what developers are saying about switching to Cloudrik.",
    testimonial: true,
  },
];

const comparison = {
  bad: {
    title: "OTHER PLATFORMS",
    items: [
      "$20/month per developer",
      "Hidden Bandwidth Taxes",
      "Limited to Frontends only",
      "Proprietary Lock-in",
    ],
  },
  good: {
    title: "CLOUDRIK",
    items: [
      "$10/month (Unlimited Team)",
      "Zero Bandwidth Markup (AWS Direct)",
      "Full-Stack: Frontend+Backend+DB",
      "Total Ownership (Data + Server)",
    ],
  },
};

const reviews = [
  {
    name: "Arjun Reddy",
    role: "Founder & CTO",
    avatar: "https://i.pravatar.cc/120?img=68",
    quote:
      "I saved $400/month switching from Vercel to Cloudrik. Build times dropped from 3 minutes to 40 seconds, and I haven't paid a bandwidth bill since.",
  },
  {
    name: "Sarah Mitchell",
    role: "Full-Stack Developer",
    avatar: "https://i.pravatar.cc/120?img=32",
    quote:
      "Cloudrik completely transformed how I deploy apps. The tools are intuitive and the pricing is honest.",
  },
  {
    name: "David Chen",
    role: "DevOps Lead",
    avatar: "https://i.pravatar.cc/120?img=12",
    quote:
      "Real-time logs and auto-healing infrastructure gave our team confidence to ship faster.",
  },
];

const movingCards = [
  {
    quote:
      "I saved $400/month switching from Vercel to Cloudrik. Build times dropped from 3 minutes to 40 seconds.",
    name: "Arjun Reddy",
    title: "Founder & CTO",
  },
  {
    quote: "Push to deploy actually works. Had my full-stack app live in under a minute.",
    name: "Sarah Mitchell",
    title: "Indie Developer",
  },
  {
    quote: "Built-in PostgreSQL and real-time logs — no more juggling five different services.",
    name: "David Chen",
    title: "Startup Engineer",
  },
  {
    quote: "Zero bandwidth markup on AWS Direct. Best decision for my startup.",
    name: "Emma Davis",
    title: "Solo Founder",
  },
];

const pricingPlans = [
  {
    name: "HOBBY",
    badge: "Try For Free",
    price: "$0",
    sub: "forever",
    features: ["Shared server", "Unlimited projects", "Community support"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "PRO ✦",
    badge: "Most Popular",
    price: "$12 – $15",
    sub: "per month",
    features: ["Dedicated Server", "Managed DB", "Priority Support", "Custom Domains"],
    cta: "Start Free",
    highlight: true,
    strikethrough: "$20",
  },
  {
    name: "BUSINESS",
    badge: "Enterprise",
    price: "Custom",
    sub: "tailored pricing",
    features: ["Enterprise security", "Multi-region setup", "SLA guarantee", "Dedicated support"],
    cta: "Contact Sales",
    highlight: false,
  },
];

const faqs = [
  {
    q: "What can I deploy on Cloudrik?",
    a: "Frontends, backends, APIs, and PostgreSQL databases — full-stack apps on your own servers with one-click deploys from GitHub.",
  },
  {
    q: "How does pricing compare to Vercel or Netlify?",
    a: "No per-seat fees. Hobby is free. Pro is $12–15/month for a dedicated server with zero bandwidth markup on AWS Direct.",
  },
  {
    q: "Do I own my data and infrastructure?",
    a: "Yes. Cloudrik provisions on your servers. You keep full ownership of data, code, and infrastructure.",
  },
  {
    q: "How fast is deployment?",
    a: "Most projects go from git push to live in under 60 seconds after initial setup.",
  },
  {
    q: "Is a credit card required to start?",
    a: "No. Try Hobby free — no credit card required.",
  },
];

/* ─── Dashboard preview (Cryptgen hero widget grid) ─── */
function DashboardPreview() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-full p-2 md:p-4 overflow-hidden">
      <Card className="col-span-2 bg-zinc-950 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-zinc-400 font-normal">Total Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">1,247</div>
          <div className="mt-3 h-12 flex items-end gap-1">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="flex-1 bg-white/80 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-zinc-400 font-normal">CPU Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">12%</div>
        </CardContent>
      </Card>
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-zinc-400 font-normal">RAM Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">32%</div>
        </CardContent>
      </Card>
      <Card className="col-span-2 bg-zinc-950 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-zinc-400 font-normal flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-emerald-400" /> Live Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-[10px] text-emerald-400/80 space-y-1">
          <div>$ git push origin main</div>
          <div className="text-zinc-500">Building... Done!</div>
          <div>Deployed to cloudrik.app ✓</div>
        </CardContent>
      </Card>
      <Card className="col-span-2 bg-zinc-950 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-zinc-400 font-normal">Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">24</div>
          <div className="mt-2 h-8 w-full bg-zinc-800 rounded overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-zinc-600 to-white/60 rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DatabaseHeader() {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 items-center justify-center">
      <Database className="w-10 h-10 text-neutral-600" />
    </div>
  );
}

function GlobeHeader() {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #555 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <Lock className="w-8 h-8 text-neutral-500 relative z-10" />
    </div>
  );
}

function GitHubHeader() {
  const icons = [Github, Database, Shield, GitBranch, Activity, Lock];
  return (
    <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 p-4 flex-col justify-between">
      <div className="flex gap-2 flex-wrap">
        {icons.map((Icon, i) => (
          <div key={i} className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
            <Icon className="w-4 h-4 text-neutral-400" />
          </div>
        ))}
      </div>
      <div className="text-4xl md:text-5xl font-bold text-white tracking-tight">60s</div>
      <div className="flex gap-1">
        {[68, 32, 12, 45, 22, 55].map((id) => (
          <img key={id} src={`https://i.pravatar.cc/40?img=${id}`} alt="" className="w-7 h-7 rounded-full border border-neutral-700" />
        ))}
      </div>
    </div>
  );
}

function TestimonialHeader() {
  return (
    <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 p-4 items-end">
      <div className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-4 -rotate-2 shadow-lg">
        <p className="text-xs text-neutral-300 leading-relaxed">
          &ldquo;I saved $400/month switching to Cloudrik.&rdquo;
        </p>
        <p className="text-[10px] text-neutral-500 mt-2">Arjun Reddy · Founder</p>
      </div>
    </div>
  );
}

export default function LandingCloudrik() {
  return (
    <div className="dark min-h-screen bg-black text-white antialiased">
      {/* ── Cryptgen floating navbar ── */}
      <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
        <nav className="flex items-center gap-6 md:gap-10 px-5 md:px-8 py-2.5 rounded-full border border-white/10 bg-black/80 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 border border-white/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-white">{BRAND}</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#comparison" className="hover:text-white transition-colors">Comparison</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <Link
            href="/sign-in"
            className="text-xs md:text-sm px-4 py-1.5 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            Get Started Now
          </Link>
        </nav>
      </div>

      {/* ── Hero: Container Scroll (Aceternity) ── */}
      <ContainerScroll
        titleComponent={
          <div className="px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-neutral-50 to-neutral-400 leading-tight">
              {hero.title}
            </h1>
            <p className="text-base md:text-lg text-neutral-400 mt-4 max-w-xl mx-auto leading-relaxed">
              {hero.subtitle}
            </p>
            <p className="text-sm text-neutral-500 mt-2 max-w-lg mx-auto">{hero.desc}</p>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 mt-8 px-6 py-2.5 rounded-full border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition-all"
            >
              Get Started
            </Link>
          </div>
        }
      >
        <DashboardPreview />
      </ContainerScroll>

      {/* ── Trusted by ── */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Trusted by Industry Leaders</h2>
          <p className="text-neutral-500 text-sm mb-12 max-w-lg mx-auto">
            Join developers already deploying full-stack apps on their own infrastructure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            {trustedLogos.map((logo) => (
              <div key={logo.name} className="flex items-center gap-2.5 opacity-50 hover:opacity-80 transition-opacity">
                <img src={logo.src} alt={logo.name} className="w-6 h-6" />
                <span className="text-sm font-medium text-neutral-400">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features & Benefits + Bento Grid (Cryptgen layout) ── */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-neutral-50 to-neutral-500 mb-4">
              {featuresIntro.title}
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto text-sm md:text-base">{featuresIntro.desc}</p>
          </div>

          <BentoGrid className="md:auto-rows-[20rem]">
            <BentoGridItem
              title={bentoItems[0].title}
              description={bentoItems[0].desc}
              header={<DatabaseHeader />}
              className="md:col-span-2"
              icon={<Database className="w-4 h-4 text-neutral-500" />}
            />
            <BentoGridItem
              title={bentoItems[1].stat}
              description={bentoItems[1].title}
              header={<GlobeHeader />}
              className="md:col-span-1"
            />
            <BentoGridItem
              title="Major Developer Adoption"
              description={bentoItems[2].desc}
              header={<GitHubHeader />}
              className="md:col-span-2 md:row-span-2"
            />
            <BentoGridItem
              title={bentoItems[3].title}
              description={bentoItems[3].desc}
              header={<TestimonialHeader />}
              className="md:col-span-1"
            />
          </BentoGrid>
        </div>
      </section>

      {/* ── Comparison (Cloudrik content, Cryptgen card style) ── */}
      <section id="comparison" className="py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">The Truth About Serverless</h2>
            <p className="text-neutral-500 text-sm">Stop paying arbitrary markups for standard infrastructure.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8 opacity-70">
              <h3 className="text-sm font-bold text-neutral-500 mb-6 tracking-wider">{comparison.bad.title}</h3>
              <ul className="space-y-4">
                {comparison.bad.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-neutral-500">
                    <span className="text-red-500 mt-0.5">✕</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-neutral-700 bg-neutral-950 p-8">
              <h3 className="text-sm font-bold text-white mb-6 tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4" /> {comparison.good.title}
              </h3>
              <ul className="space-y-4">
                {comparison.good.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-neutral-200">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Infinite Moving Cards (Aceternity) ── */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
          <h3 className="text-xl font-bold text-white">People love us</h3>
          <p className="text-neutral-500 text-sm mt-2">From the trenches — real developer stories.</p>
        </div>
        <InfiniteMovingCards items={movingCards} speed="slow" />
      </section>

      {/* ── What they say about us (Cryptgen 2-col) ── */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
              What they say about us
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              {hero.desc} Built for everyone — from solo founders to growing teams.
            </p>
          </div>
          <div className="space-y-4">
            {reviews.map((r) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold text-sm text-white">{r.name}</div>
                    <div className="text-xs text-neutral-500">{r.role}</div>
                  </div>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  <span className="text-neutral-600">&ldquo;</span>
                  {r.quote}
                  <span className="text-neutral-600">&rdquo;</span>
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing (Cryptgen 3-card) ── */}
      <section id="pricing" className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-neutral-50 to-neutral-500 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-neutral-500 text-sm">No per-seat licenses. No bandwidth extortion.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 items-stretch">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 flex flex-col ${
                  plan.highlight
                    ? "border-neutral-600 bg-neutral-950 md:-mt-2 md:mb-2"
                    : "border-neutral-800 bg-black"
                }`}
              >
                {plan.highlight && (
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">
                    {plan.badge}
                  </div>
                )}
                {!plan.highlight && (
                  <div className="text-xs text-neutral-500 mb-1">{plan.badge}</div>
                )}
                <h3 className="text-lg font-bold text-white mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  {plan.strikethrough && (
                    <span className="text-neutral-600 line-through text-sm">{plan.strikethrough}</span>
                  )}
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                </div>
                <p className="text-xs text-neutral-500 mb-8">{plan.sub}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-neutral-400">
                      <Check className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-in"
                  className={`w-full py-3 rounded-full text-sm font-semibold text-center transition-all ${
                    plan.highlight
                      ? "bg-white text-black hover:bg-neutral-200"
                      : "border border-neutral-700 text-white hover:bg-neutral-900"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Let&apos;s Answer Your Questions</h2>
            <p className="text-neutral-500 text-sm">Everything you need to know about Cloudrik.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`faq-${i}`}
                className="rounded-xl border border-neutral-800 bg-neutral-950 px-5 border-b-0"
              >
                <AccordionTrigger className="text-sm font-medium text-white hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-500 text-sm pb-5">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-neutral-50 to-neutral-400 mb-4">
            {hero.title}
          </h2>
          <p className="text-neutral-500 text-sm mb-8 max-w-md mx-auto">{hero.subtitle}</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-colors"
          >
            <Github className="w-4 h-4" />
            {hero.cta}
            <ChevronRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-neutral-600 mt-4">{hero.note}</p>
        </div>
      </section>

      {/* ── Footer (Cryptgen 4-col) ── */}
      <footer className="border-t border-white/5 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-white" />
                <span className="font-bold text-white">{BRAND}</span>
              </Link>
              <p className="text-sm text-neutral-500">&ldquo;{TAGLINE}&rdquo;</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Comparison"] },
              { title: "Resources", links: ["Docs", "Blog", "Status"] },
              { title: "Company", links: ["About", "Contact", "Careers"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm text-white mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-neutral-500 hover:text-white transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-600">
            <span>© {new Date().getFullYear()} {BRAND}. All rights reserved.</span>
            <div className="flex gap-5">
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
