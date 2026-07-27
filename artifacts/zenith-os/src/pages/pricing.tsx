import { motion } from "framer-motion";
import { Link } from "wouter";
import { Check } from "lucide-react";
import { MorphingNav } from "@/pages/landing-v2";

export default function Pricing() {
  const plans = [
    {
      name: "Hobby",
      price: "$0",
      description: "For personal projects and exploration.",
      features: [
        "Up to 3 Projects",
        "Shared PostgreSQL DB",
        "Community Support",
        "1GB Storage",
        "Deploy from GitHub",
      ],
      buttonText: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$20",
      period: "/month",
      description: "For production apps and growing teams.",
      features: [
        "Unlimited Projects",
        "Dedicated PostgreSQL DB",
        "Priority Support",
        "50GB Storage",
        "Custom Domains",
        "Advanced Analytics",
      ],
      buttonText: "Upgrade to Pro",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large scale organizations.",
      features: [
        "Dedicated Infrastructure",
        "99.99% Uptime SLA",
        "24/7 Phone Support",
        "Unlimited Storage",
        "Custom Integrations",
        "SSO / SAML",
      ],
      buttonText: "Contact Sales",
      popular: false,
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      {/* Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center">
        <div className="w-[800px] h-[600px] bg-white/[0.03] rounded-full blur-[120px] -translate-y-1/2"></div>
      </div>

      <MorphingNav />

      {/* Main Content */}
      <main className="relative z-10 px-6 pt-32 pb-20 max-w-7xl mx-auto w-full flex flex-col items-center">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Simple, transparent pricing.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/50 max-w-2xl mx-auto"
          >
            Start for free, upgrade when you need more power. No hidden fees.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index + 0.2 }}
              className={`relative bg-[#111113] rounded-3xl p-8 border ${
                plan.popular ? "border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.15)]" : "border-white/10"
              } flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-medium text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-white/50">{plan.period}</span>}
                </div>
                <p className="text-sm text-white/50">{plan.description}</p>
              </div>

              <div className="flex-grow">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                      <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link 
                href="/sign-in"
                className={`w-full py-3 rounded-lg text-sm font-semibold text-center transition-colors ${
                  plan.popular 
                    ? "bg-white text-black hover:bg-gray-200" 
                    : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                }`}
              >
                {plan.buttonText}
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
