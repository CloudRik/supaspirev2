# CloudRik — Supaspire (BaaS) Architectural Plan

This document serves as a persistent guide and memory helper for the design, technology stack, and integration of the **Supaspire (BaaS)** module into the **CloudRik** platform.

---

## 1. Core Architectural Decisions

### 1.1 Multi-Cloud / Server Separation (Cost Optimization)
To optimize hosting costs while maintaining high reliability, the platform's backend infrastructure is split across cloud providers:
*   **Deployment Engine (Main Server):** Hosted on **AWS EC2** (Port `5000`). Handles core project deployments, Nginx router configuration, SSL certificate generation, and dashboard operations.
*   **Supaspire BaaS (Database/BaaS Server):** Hosted on **Oracle Cloud (Always Free Tier)** during development, with a seamless migration path to **Hetzner Cloud** (~€3.50/mo) or **Contabo** (~€5.50/mo) for production launch. Handles user PostgreSQL containers, Redis key-value stores, authentication services, and storage buckets.

### 1.2 Microservice Separation
*   Both backend systems run as entirely separate Node.js application instances.
*   If the Oracle Cloud instance or the Supaspire backend crashes/restarts, the main AWS deployment server and all running client websites remain completely unaffected.

---

## 2. Resource & Billing Aggregation

Instead of treating deployment and database resources as separate bills (like Vercel + Supabase), CloudRik offers a single, unified pricing plan (e.g., $20/month Pro Plan).

### 2.1 Centralized Metrics DB
*   A **Central PostgreSQL DB** acts as the Single Source of Truth.
*   A centralized `usage_metrics` table logs aggregate resources per workspace:
    $$\text{Total Storage} = \text{AWS Deployment Files} + \text{Oracle Database/Bucket Storage}$$
    $$\text{Total Bandwidth} = \text{AWS Web Traffic} + \text{Oracle DB/API Traffic}$$

### 2.2 Sync & Enforcement Flow
1.  **AWS Server** updates main DB with deployment storage and website bandwidth.
2.  **Oracle Server** updates main DB with database storage and query bandwidth.
3.  **Enforcement:** Before creating new projects or spinning up databases, the respective server queries the Central DB. If the combined usage exceeds the plan's threshold (e.g., 10GB limit), the action is blocked, prompting an upgrade.

---

## 3. Micro-Frontend Integration (Route-Level Embedding)

To keep codebases completely isolated and avoid layouts breaking during development, the UI is modularized:

### 3.1 Separate Repositories
*   **CloudRik UI (`app.cloudrik.com`):** Standard Vite/React frontend dashboard.
*   **Supaspire UI (`supaspire.cloudrik.com`):** Independent frontend codebase managing the database grids, user policies, and file explorers.

### 3.2 Seamless Iframe Embedding (No Redirects)
*   The main app shell contains a route `/supaspire` in `App.tsx`.
*   When navigating to `/supaspire`, a seamless, borderless, full-viewport `<iframe>` loads the Supaspire UI:
    ```tsx
    <iframe 
      src="https://supaspire.cloudrik.com" 
      className="w-full h-full border-none" 
      id="supaspire-iframe"
    />
    ```
*   Dono apps aapas me **Workspace context** share karne ke liye browser `window.postMessage` API use karti hain (e.g., active tabs sync aur project selection updates).

---

## 4. Confirmed Supaspire Technology Stack

| Feature | Technology | Setup & Role |
| :--- | :--- | :--- |
| **BaaS Server Host** | **Oracle Cloud (Dev)** $\to$ **Hetzner (Prod)** | Hosting all provisioned user resources. |
| **Database Engine** | **PostgreSQL** | Runs in isolated Docker containers for each project. |
| **Auto-API Layer** | **PostgREST** | Exposes SQL database structures directly as REST APIs (fast & lightweight). |
| **Authentication** | **GoTrue (by Supabase) + MSG91** | Go-based lightweight user auth service with Postgres RLS support. MSG91 for cheap SMS OTPs. |
| **Storage Engine** | **Cloudflare R2** | S3-compatible object storage with **zero egress fees** (highly cost-effective). |
| **Realtime Engine** | **WAL Logical Replication** | Reads Postgres Write-Ahead Logs (WAL) for changes and streams via WebSockets (RLS-aware). |
| **Edge Functions** | **Deno (or V8 Isolates)** | Sandbox-oriented runtime to securely execute user-submitted JS/TS scripts. |

---

## 5. Security & Disaster Recovery Policy

### 5.1 Idle VM Keep-Alive
*   To prevent Oracle Cloud from reclaiming the free-tier VPS, a lightweight script runs in the background to maintain an active CPU load of 10%–15%.

### 5.2 Automated Cloud Backups
*   A Cron job runs every 12 hours on the BaaS host, backing up database dumps (`pg_dump`) and container configurations.
*   Backups are encrypted and pushed to a secure bucket on **Cloudflare R2** (completely free up to 10GB).

### 5.3 One-Click Production Migration
*   All services are containerized via Docker.
*   To migrate from Oracle Cloud (Development) to Hetzner/Contabo (Production):
    1.  Provision the paid server.
    2.  Execute `setup-vps.sh` (installs Docker, sets up firewalls, and configurations).
    3.  Execute `restore-backups.sh` (pulls database logs from Cloudflare R2 and spins up the user database containers).
    *Total downtime during migration is estimated at under 15 minutes.*

---

## 6. Future Roadmap — CloudRik Platform Security Features

> These features belong to the **CloudRik deployment engine** (AWS EC2 side), NOT the Supaspire BaaS side.
> These are planned for a future sprint after the core platform is live and stable.

### 6.1 Secret Leak Scanner
*   **What it does:** Every time a user deploys a project (via GitHub repo or CLI upload), before the container starts, a scanner will scan all code files for accidentally committed secrets — like AWS Access Keys, Firebase API Keys, Stripe secret tokens, database passwords, private keys, etc.
*   **How it works:** We will integrate **[Gitleaks](https://github.com/gitleaks/gitleaks)** (open-source, CLI tool) as a pre-deployment step inside our `deploy.sh` script. Gitleaks runs in milliseconds and uses a huge library of regex patterns to detect 150+ secret types.
*   **User Flow:** If a secret is found:
    1.  Deployment is **immediately blocked** before the code goes live.
    2.  User receives an alert (Dashboard notification + email) showing which file and line number the secret was found on.
    3.  User fixes the code, removes the key, and re-deploys.
*   **Implementation Note:** Run `gitleaks detect --source <deploy_dir> --no-git` inside `deploy.sh` before Docker image build step.

### 6.2 Vulnerability Assessment (VAPT Lightweight Wrapper)
*   **What it does:** After a project is successfully deployed and live, a background job automatically runs a passive security scan on the live URL to detect common web vulnerabilities like XSS (Cross-Site Scripting), Open Redirects, exposed sensitive files (e.g., `.env`, `config.json`), etc.
*   **How it works:** We will integrate **[Nikto](https://github.com/sullo/nikto)** (open-source web server scanner) or a lighter Node.js-based tool. The scan is lightweight (not a full penetration test) and is designed for common misconfigurations.
*   **User Flow:**
    1.  After deploy succeeds, a queued background job runs the scan (async — user is not blocked).
    2.  Results appear in a new **"Security"** tab inside the Project Detail page.
    3.  If critical vulnerabilities found, a dashboard alert is shown with actionable fix suggestions.
*   **Important Note:** Scans are performed only on the user's OWN deployed project URL. Rate-limited to 1 scan per deploy to prevent abuse.

### 6.3 DDoS Firewall (Built-in, Cloudflare-style)
*   **What it does:** Every deployed project automatically gets a basic, free-tier firewall that blocks fake traffic, bots, and volumetric DDoS attacks — similar to what Cloudflare's free plan offers.
*   **How it works:** Built at the Nginx layer using **rate-limiting + fail2ban** combination:
    *   **Nginx Rate Limiting:** `limit_req_zone` module restricts requests per IP per second (e.g., max 50 req/sec per IP).
    *   **Fail2Ban:** Monitors Nginx access logs. If an IP makes 200+ requests in 10 seconds, Fail2Ban auto-adds it to `iptables` firewall rules and blocks it for 1 hour.
    *   **Bot Detection (Future Phase):** A JS challenge page (like Cloudflare's browser check) rendered by Nginx before serving the app.
*   **User Flow:** No setup needed from the user. Protection is automatic on every deploy. Users can see blocked IPs/events inside a **"Firewall"** section in their project dashboard (future UI).
