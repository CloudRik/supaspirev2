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
import WebhooksPage from "@/pages/webhooks";
import DeploymentsPage from "@/pages/deployments";
import LogsPage from "@/pages/logs";
import DomainsPage from "@/pages/domains";
import EnvVarsPage from "@/pages/env-vars";
import InfrastructurePage from "@/pages/infrastructure";
import AuthCallback from "@/pages/auth-callback";
import TeamPage from "@/pages/team";
import AcceptInvitePage from "@/pages/accept-invite";
import BillingPage from "@/pages/billing";
import TokensPage from "@/pages/tokens";
import { ProjectDeleteRoute } from "@/pages/project";
import SupaspirePage from "@/pages/supaspire";
import CdnPage from "@/pages/cdn";
import AnalyticsPage from "@/pages/analytics";
import FeatureFlagsPage from "@/pages/feature-flags";
// NEW Cryptgen-style landing (Cloudrik). Preview at /landing-preview
// To replace old landing: change Route path="/" component={LandingCloudrik}
import LandingCloudrik from "@/pages/landing-cloudrik";
import LandingV2 from "@/pages/landing-v2";
import Pricing from "@/pages/pricing";

const queryClient = new QueryClient();





function Router() {
  return (
    <Switch>
      <Route path="/landing-preview" component={LandingCloudrik} />
      <Route path="/" component={LandingV2} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/sign-in" component={SignIn} />
      <Route path="/auth/callback" component={AuthCallback} />
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
      <Route path="/webhooks" component={WebhooksPage} />
      <Route path="/cdn" component={CdnPage} />
      <Route path="/supaspire" component={SupaspirePage} />
      <Route path="/infrastructure" component={InfrastructurePage} />
      <Route path="/team" component={TeamPage} />
      <Route path="/billing" component={BillingPage} />
      <Route path="/tokens" component={TokensPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/:name/feature-flags" component={FeatureFlagsPage} />
      <Route path="/feature-flags" component={FeatureFlagsPage} />
      <Route path="/accept-invite" component={AcceptInvitePage} />
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
