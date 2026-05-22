const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

const app = express();
const PUBLIC_IP = '13.233.87.37';
const DEPLOY_SCRIPT = path.resolve(__dirname, '../deploy.sh');
const PROJECTS_FILE = path.resolve(__dirname, 'projects.json');
const ENV_VARS_FILE = path.resolve(__dirname, 'env_vars.json');
const NGINX_CONF = '/etc/nginx/sites-available/zenith';
const DEPLOYS_DIR = '/home/ubuntu/deploys';
// ── Deployment Queue ──────────────────────────────────────────────────────────
const deployQueue = [];   // [{repo, port, repoName, slug, existing, send, res, heartbeat, onDone}]
let deployRunning = false;

function processQueue() {
  if (deployRunning || deployQueue.length === 0) return;
  deployRunning = true;

  const job = deployQueue.shift();

  // Notify others in queue about updated positions
  deployQueue.forEach((j, idx) => {
    try { j.send({ type: 'queued', position: idx + 1, total: deployQueue.length + 1 }); } catch (e) { }
  });

  job.send({ type: 'log', line: '=== ZenithOS Deploy Starting ===' });
  job.send({ type: 'log', line: 'Repo: ' + job.repo });
  job.send({ type: 'log', line: 'Port: ' + job.port });

  const child = spawn('bash', [DEPLOY_SCRIPT, job.repo, String(job.port)], {
    cwd: path.dirname(DEPLOY_SCRIPT)
  });

  let logs = '';
  let actualContainer = '';
  let framework = 'unknown';
  let deployMode = 'static';

  child.stdout.on('data', function (d) {
    const text = d.toString();
    logs += text;
    text.split('\n').filter(l => l.trim()).forEach(line => {
      job.send({ type: 'log', line });
      const cm = line.match(/Container:\s*(app_\S+)/);
      if (cm) actualContainer = cm[1].trim();
      const fm = line.match(/Framework detected:\s*(\S+)/);
      if (fm) framework = fm[1].trim();
      const mm = line.match(/Mode:\s*(static|dynamic)/);
      if (mm) deployMode = mm[1].trim();
    });
  });

  child.stderr.on('data', function (d) {
    const text = d.toString();
    logs += text;
    text.split('\n').filter(l => l.trim()).forEach(line => job.send({ type: 'log', line }));
  });

  child.on('close', function (code) {
    clearInterval(job.heartbeat);
    const liveUrl = 'http://' + PUBLIC_IP + ':' + job.port + '/';
    const containerName = actualContainer || ('app_' + Date.now());
    const project = {
      name: job.repoName, slug: job.slug, repo: job.repo, port: job.port,
      container: containerName, url: liveUrl,
      status: code === 0 ? 'running' : 'failed',
      framework, deployMode,
      createdAt: job.existing ? job.existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const allProjects = loadProjects().filter(p => p.name !== job.repoName);
    allProjects.push(project);
    saveProjects(allProjects);
    if (code === 0) regenerateNginxConfig();

    job.send({ type: 'done', success: code === 0, url: code === 0 ? liveUrl : null, project, framework });
    job.res.end();

    deployRunning = false;
    processQueue();
  });

  job.cancelFn = () => { clearInterval(job.heartbeat); try { child.kill('SIGTERM'); } catch (e) { } };
}

const PORT_START = 3000;
const PORT_END = 3099;

app.use(cors());
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

function loadProjects() {
  try { return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8')); }
  catch { return []; }
}
function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}
function loadAllEnvVars() {
  try { return JSON.parse(fs.readFileSync(ENV_VARS_FILE, 'utf-8')); }
  catch { return {}; }
}
function saveAllEnvVars(data) {
  fs.writeFileSync(ENV_VARS_FILE, JSON.stringify(data, null, 2));
}
function getProjectEnvVars(name) {
  return loadAllEnvVars()[name] || {};
}
function setProjectEnvVars(name, vars) {
  const all = loadAllEnvVars();
  all[name] = vars;
  saveAllEnvVars(all);
}

function getNextPort() {
  const used = loadProjects().map(p => p.port);
  for (let p = PORT_START; p <= PORT_END; p++) {
    if (!used.includes(p)) return p;
  }
  throw new Error('No ports available (3000-3099 all in use)');
}
function stopContainer(containerName) {
  if (!containerName) return;
  try { execSync('docker stop ' + containerName + ' 2>/dev/null || true', { stdio: 'ignore' }); } catch { }
  try { execSync('docker rm ' + containerName + ' 2>/dev/null || true', { stdio: 'ignore' }); } catch { }
  try { execSync('docker rmi zenith_' + containerName + ' 2>/dev/null || true', { stdio: 'ignore' }); } catch { }
}
function cleanDeployDir(containerName) {
  if (!containerName) return;
  const dir = path.join(DEPLOYS_DIR, containerName);
  try { if (fs.existsSync(dir)) execSync('rm -rf ' + dir, { stdio: 'ignore' }); } catch { }
}
function regenerateNginxConfig() {
  const projects = loadProjects().filter(p => p.status === 'running');
  let locations = '';
  for (const p of projects) {
    const slug = (p.slug || p.name).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    locations += '\n    location /' + slug + '/ {\n        proxy_pass http://127.0.0.1:' + p.port + '/;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection \'upgrade\';\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }';
  }
  const config = 'server {\n    listen 80;\n    server_name _;\n    location / {\n        return 200 \'ZenithOS Deployment Server\';\n        add_header Content-Type text/plain;\n    }\n' + locations + '\n}';
  try {
    fs.writeFileSync('/tmp/zenith_nginx.conf', config);
    execSync('sudo cp /tmp/zenith_nginx.conf ' + NGINX_CONF);
    execSync('sudo ln -sf ' + NGINX_CONF + ' /etc/nginx/sites-enabled/zenith 2>/dev/null || true');
    execSync('sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true');
    execSync('sudo nginx -t && sudo systemctl reload nginx');
  } catch (err) { console.error('NGINX error:', err.message); }
}

function runDeploy(repo, res, isStream) {
  const repoName = repo.replace(/\.git$/, '').split('/').pop() || 'project';
  const slug = repoName.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  const projects = loadProjects();
  const existing = projects.find(p => p.name === repoName);
  let port;

  if (existing) {
    stopContainer(existing.container);
    cleanDeployDir(existing.container);
    port = existing.port;
  } else {
    try { port = getNextPort(); } catch (e) {
      if (isStream) { res.write('data: ' + JSON.stringify({ type: 'done', success: false, error: 'No ports available' }) + '\n\n'); res.end(); }
      else res.status(500).json({ error: 'No ports available' });
      return;
    }
  }

  const send = isStream
    ? (obj) => res.write('data: ' + JSON.stringify(obj) + '\n\n')
    : (obj) => { if (obj.type === 'log') console.log(obj.line); };

  send({ type: 'log', line: '=== ZenithOS Deploy Starting ===' });
  send({ type: 'log', line: 'Repo: ' + repo });
  send({ type: 'log', line: 'Port: ' + port });

  const child = spawn('bash', [DEPLOY_SCRIPT, repo, String(port)], {
    cwd: path.dirname(DEPLOY_SCRIPT)
  });

  let logs = '';
  let actualContainer = '';
  let framework = 'unknown';
  let deployMode = 'static';

  child.stdout.on('data', function (d) {
    const text = d.toString();
    logs += text;
    text.split('\n').filter(l => l.trim()).forEach(line => {
      send({ type: 'log', line });
      const cm = line.match(/Container:\s*(app_\S+)/);
      if (cm) actualContainer = cm[1].trim();
      const fm = line.match(/Framework detected:\s*(\S+)/);
      if (fm) framework = fm[1].trim();
      const mm = line.match(/Mode:\s*(static|dynamic)/);
      if (mm) deployMode = mm[1].trim();
    });
  });

  child.stderr.on('data', function (d) {
    const text = d.toString();
    logs += text;
    text.split('\n').filter(l => l.trim()).forEach(line => send({ type: 'log', line }));
  });

  child.on('close', function (code) {
    const liveUrl = 'http://' + PUBLIC_IP + ':' + port + '/';
    const containerName = actualContainer || ('app_' + Date.now());
    const project = {
      name: repoName, slug, repo, port, container: containerName,
      url: liveUrl, status: code === 0 ? 'running' : 'failed',
      framework, deployMode,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const allProjects = loadProjects().filter(p => p.name !== repoName);
    allProjects.push(project);
    saveProjects(allProjects);
    if (code === 0) regenerateNginxConfig();

    if (isStream) {
      send({ type: 'done', success: code === 0, url: code === 0 ? liveUrl : null, project, framework });
      res.end();
    } else {
      res.json({ success: code === 0, logs, url: code === 0 ? liveUrl : null, project, framework });
    }
  });

  if (isStream) {
    req.on('close', () => { try { child.kill(); } catch (e) { } });
  }
}

app.get('/', (_req, res) => res.json({ status: 'ZenithOS Backend Running', ip: PUBLIC_IP }));
app.get('/api/test', (_req, res) => res.json({ message: 'API working', ip: PUBLIC_IP }));
app.get('/projects', (_req, res) => res.json(loadProjects()));
app.get('/queue', (_req, res) => res.json({ running: deployRunning, queued: deployQueue.length, total: deployQueue.length + (deployRunning ? 1 : 0), projects: deployQueue.map((j, i) => ({ name: j.repoName, position: i + 2 })) }));


// SSE streaming endpoint
app.get('/deploy/stream', (req, res) => {
  let repo = req.query.repo;
  if (!repo) { res.status(400).end(); return; }

  const repoName = repo.replace(/\.git$/, '').split('/').pop() || 'project';

  // Extract GITHUB_TOKEN if present in URL and clean the URL
  const match = repo.match(/https:\/\/([^@]+)@github\.com\/(.+)/);
  if (match) {
    const token = match[1];
    repo = 'https://github.com/' + match[2];

    // Save to env_vars.json under repoName
    const allEnv = loadAllEnvVars();
    const projectEnv = allEnv[repoName] || {};
    projectEnv['GITHUB_TOKEN'] = token;
    allEnv[repoName] = projectEnv;
    saveAllEnvVars(allEnv);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const slug = repoName.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  const projects = loadProjects();
  const existing = projects.find(p => p.name === repoName);
  let port;

  if (existing) {
    stopContainer(existing.container);
    cleanDeployDir(existing.container);
    port = existing.port;
  } else {
    try { port = getNextPort(); } catch (e) {
      res.write('data: ' + JSON.stringify({ type: 'done', success: false, error: 'No ports available' }) + '\n\n');
      res.end(); return;
    }
  }

  const send = (obj) => { try { res.write('data: ' + JSON.stringify(obj) + '\n\n'); } catch (e) { } };
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch (e) { clearInterval(heartbeat); }
  }, 8000);

  const queuePos = deployQueue.length + (deployRunning ? 1 : 0);
  if (queuePos > 0) {
    send({ type: 'queued', position: queuePos + 1, total: queuePos + 1 });
  }

  const job = { repo, port, repoName, slug, existing, send, res, heartbeat, cancelFn: null };
  deployQueue.push(job);
  processQueue();

  req.on('close', () => {
    clearInterval(heartbeat);
    const idx = deployQueue.indexOf(job);
    if (idx !== -1) { deployQueue.splice(idx, 1); try { res.end(); } catch (e) { } }
    else if (job.cancelFn) job.cancelFn();
  });
});

// Legacy POST endpoint (kept for compatibility)
app.post('/deploy', (req, res) => {
  let repo = req.body && req.body.repo ? req.body.repo : req.query.repo;
  if (!repo) return res.status(400).json({ error: 'Repo URL required' });

  const repoName = repo.replace(/\.git$/, '').split('/').pop() || 'project';

  // Extract GITHUB_TOKEN if present in URL and clean the URL
  const match = repo.match(/https:\/\/([^@]+)@github\.com\/(.+)/);
  if (match) {
    const token = match[1];
    repo = 'https://github.com/' + match[2];

    // Save to env_vars.json under repoName
    const allEnv = loadAllEnvVars();
    const projectEnv = allEnv[repoName] || {};
    projectEnv['GITHUB_TOKEN'] = token;
    allEnv[repoName] = projectEnv;
    saveAllEnvVars(allEnv);
  }

  const slug = repoName.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  const projects = loadProjects();
  const existing = projects.find(p => p.name === repoName);
  let port;

  if (existing) {
    stopContainer(existing.container);
    cleanDeployDir(existing.container);
    port = existing.port;
  } else {
    try { port = getNextPort(); } catch (e) {
      return res.status(500).json({ error: 'No ports available' });
    }
  }

  const child = spawn('bash', [DEPLOY_SCRIPT, repo, String(port)], {
    cwd: path.dirname(DEPLOY_SCRIPT)
  });

  let logs = '';
  let actualContainer = '';
  let framework = 'unknown';
  let deployMode = 'static';

  child.stdout.on('data', function (d) {
    const text = d.toString();
    logs += text;
    text.split('\n').filter(l => l.trim()).forEach(line => {
      const cm = line.match(/Container:\s*(app_\S+)/);
      if (cm) actualContainer = cm[1].trim();
      const fm = line.match(/Framework detected:\s*(\S+)/);
      if (fm) framework = fm[1].trim();
      const mm = line.match(/Mode:\s*(static|dynamic)/);
      if (mm) deployMode = mm[1].trim();
    });
  });
  child.stderr.on('data', function (d) { logs += d.toString(); });

  child.on('close', function (code) {
    const liveUrl = 'http://' + PUBLIC_IP + ':' + port + '/';
    const containerName = actualContainer || ('app_' + Date.now());
    const project = {
      name: repoName, slug, repo, port, container: containerName,
      url: liveUrl, status: code === 0 ? 'running' : 'failed',
      framework, deployMode,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const allProjects = loadProjects().filter(p => p.name !== repoName);
    allProjects.push(project);
    saveProjects(allProjects);
    if (code === 0) regenerateNginxConfig();
    res.json({ success: code === 0, logs, url: code === 0 ? liveUrl : null, project, framework });
  });
});

app.delete('/projects/:name', (req, res) => {
  const name = req.params.name;
  const projects = loadProjects();
  const project = projects.find(p => p.name === name);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  stopContainer(project.container);
  cleanDeployDir(project.container);
  saveProjects(projects.filter(p => p.name !== name));
  regenerateNginxConfig();
  res.json({ success: true });
});

// ── Static Logs Snapshot ────────────────────────────────────────────────────
app.get('/projects/:name/logs', (req, res) => {
  const { name } = req.params;
  const lines = parseInt(req.query.lines) || 100;
  const projects = loadProjects();
  const project = projects.find(p => p.name === name);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const containerName = project.container || name;
  try {
    const logs = execSync(`docker logs --tail=${lines} ${containerName} 2>&1`, { timeout: 5000 }).toString();
    res.json({ logs: logs.split('\n').filter(l => l.trim()) });
  } catch (e) {
    res.json({ logs: ['Could not fetch logs: ' + e.message] });
  }
});

// ── Container Lifecycle Controls ───────────────────────────────────────────
app.post('/projects/:name/start', (req, res) => {
  const { name } = req.params;
  const projects = loadProjects();
  const index = projects.findIndex(p => p.name === name);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  const project = projects[index];
  const containerName = project.container || name;
  try {
    execSync(`docker start ${containerName}`);
    project.status = 'running';
    saveProjects(projects);
    regenerateNginxConfig();
    res.json({ success: true, status: 'running' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to start container: ' + e.message });
  }
});

app.post('/projects/:name/stop', (req, res) => {
  const { name } = req.params;
  const projects = loadProjects();
  const index = projects.findIndex(p => p.name === name);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  const project = projects[index];
  const containerName = project.container || name;
  try {
    execSync(`docker stop ${containerName}`);
    project.status = 'stopped';
    saveProjects(projects);
    regenerateNginxConfig();
    res.json({ success: true, status: 'stopped' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to stop container: ' + e.message });
  }
});

app.post('/projects/:name/restart', (req, res) => {
  const { name } = req.params;
  const projects = loadProjects();
  const index = projects.findIndex(p => p.name === name);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  const project = projects[index];
  const containerName = project.container || name;
  try {
    execSync(`docker restart ${containerName}`);
    project.status = 'running';
    saveProjects(projects);
    regenerateNginxConfig();
    res.json({ success: true, status: 'running' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to restart container: ' + e.message });
  }
});

(function migrateProjects() {
  const projects = loadProjects();
  let changed = false;
  for (const p of projects) {
    if (!p.slug) {
      p.slug = p.name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
      p.url = 'http://' + PUBLIC_IP + ':' + p.port + '/';
      changed = true;
    }
  }
  if (changed) { saveProjects(projects); console.log('Migrated projects.json'); }
})();

regenerateNginxConfig();


// ── Real-time log streaming (SSE) ───────────────────────────────────────────
app.get('/projects/:name/logs/stream', (req, res) => {
  const { name } = req.params;
  const tail = parseInt(req.query.tail) || 50;
  const projects = loadProjects();
  const project = projects.find(function (p) { return p.name === name; });
  const containerName = (project && project.container) ? project.container : name;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = function (data) {
    res.write('data: ' + JSON.stringify(data) + '\n\n');
  };

  // Send initial batch of recent logs
  try {
    const recent = require('child_process').execSync(
      'docker logs --tail=' + tail + ' ' + containerName + ' 2>&1',
      { timeout: 5000 }
    ).toString();
    const lines = recent.split('\n').filter(function (l) { return l.trim(); });
    lines.forEach(function (line) { send({ type: 'log', line: line }); });
  } catch (e) {
    send({ type: 'error', message: 'Could not fetch initial logs: ' + e.message });
  }

  // Stream new logs using docker logs -f
  let child;
  try {
    child = require('child_process').spawn('docker', ['logs', '-f', '--tail=0', containerName], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const onData = function (data) {
      data.toString().split('\n').forEach(function (line) {
        if (line.trim()) send({ type: 'log', line: line });
      });
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', function (e) { send({ type: 'error', message: e.message }); });
    child.on('close', function () { send({ type: 'done' }); res.end(); });
  } catch (e) {
    send({ type: 'error', message: e.message });
    res.end();
    return;
  }

  req.on('close', function () {
    if (child) { try { child.kill('SIGTERM'); } catch (e) { } }
    res.end();
  });
});

// ── Container resource stats (cached, refreshes every 4s) ───────────────────
let _statsCache = [];
let _statsUpdating = false;

function refreshStatsCache() {
  if (_statsUpdating) return;
  _statsUpdating = true;
  require('child_process').exec('docker stats --no-stream --format "{{json .}}"', { timeout: 12000 }, function (err, stdout) {
    _statsUpdating = false;
    if (err || !stdout) return;
    const parsed = stdout.trim().split('\n').filter(function (l) { return l.trim(); }).map(function (l) {
      try { return JSON.parse(l); } catch (e) { return null; }
    }).filter(Boolean);
    if (parsed.length > 0) _statsCache = parsed;
  });
}

// Warm up cache on startup
refreshStatsCache();
// Keep refreshing every 4 seconds
setInterval(refreshStatsCache, 4000);

app.get('/stats', function (_req, res) {
  res.json(_statsCache);
  // Trigger a fresh update in background
  refreshStatsCache();
});
app.listen(5000, '0.0.0.0', () => console.log('ZenithOS API running on port 5000 | IP: ' + PUBLIC_IP));

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB WEBHOOK SUPPORT
// ─────────────────────────────────────────────────────────────────────────────
const crypto = require('crypto');
const WEBHOOK_SECRETS_FILE = path.resolve(__dirname, 'webhook_secrets.json');

function loadWebhookSecrets() {
  try { return JSON.parse(fs.readFileSync(WEBHOOK_SECRETS_FILE, 'utf-8')); }
  catch { return {}; }
}
function saveWebhookSecrets(secrets) {
  fs.writeFileSync(WEBHOOK_SECRETS_FILE, JSON.stringify(secrets, null, 2));
}
function getOrCreateSecret(projectName) {
  const secrets = loadWebhookSecrets();
  if (!secrets[projectName]) {
    secrets[projectName] = crypto.randomBytes(32).toString('hex');
    saveWebhookSecrets(secrets);
  }
  return secrets[projectName];
}

// GET /webhook/info/:projectName — return webhook URL + secret
// ── Environment Variables ─────────────────────────────────────────────────────
app.get('/projects/:name/env', (req, res) => {
  const vars = getProjectEnvVars(req.params.name);
  res.json(vars);
});

app.post('/projects/:name/env', (req, res) => {
  const { vars } = req.body;
  if (!vars || typeof vars !== 'object') return res.status(400).json({ error: 'vars required' });
  // Sanitize: only string values
  const clean = {};
  for (const [k, v] of Object.entries(vars)) {
    if (k && typeof k === 'string') clean[k.trim()] = String(v ?? '');
  }
  setProjectEnvVars(req.params.name, clean);
  res.json({ ok: true, saved: Object.keys(clean).length });
});

app.delete('/projects/:name/env/:key', (req, res) => {
  const all = loadAllEnvVars();
  const project = all[req.params.name] || {};
  delete project[decodeURIComponent(req.params.key)];
  all[req.params.name] = project;
  saveAllEnvVars(all);
  res.json({ ok: true });
});

app.get('/webhook/info/:projectName', (req, res) => {
  const name = req.params.projectName;
  const projects = loadProjects();
  const project = projects.find(p => p.name === name);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const secret = getOrCreateSecret(name);
  const slug = (project.slug || name).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  res.json({
    webhookUrl: 'http://' + PUBLIC_IP + ':5000/webhook/' + slug,
    secret,
    projectName: name,
    slug,
  });
});

// POST /webhook/:slug — GitHub push webhook
app.post('/webhook/:slug', express.raw({ type: '*/*' }), (req, res) => {
  const slug = req.params.slug;
  const projects = loadProjects();
  const project = projects.find(p =>
    (p.slug || p.name).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase() === slug
  );
  if (!project) return res.status(404).json({ error: 'Project not found for slug: ' + slug });

  const secret = loadWebhookSecrets()[project.name];
  if (secret) {
    const sig = req.headers['x-hub-signature-256'];
    if (!sig) return res.status(401).json({ error: 'Missing X-Hub-Signature-256 header' });
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body) || '');
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const sigBuf = Buffer.from(sig.padEnd(expected.length, '0'));
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  // Parse payload
  let payload = {};
  try { payload = JSON.parse(req.body.toString()); } catch { }

  // Only trigger on push to default branch
  const ref = payload.ref || '';
  const defaultBranch = (payload.repository && payload.repository.default_branch) ? payload.repository.default_branch : 'main';
  if (ref && ref !== 'refs/heads/' + defaultBranch && ref !== '') {
    return res.json({ message: 'Ignored: push to non-default branch ' + ref });
  }

  console.log('[Webhook] Auto-deploying', project.name, 'triggered by push to', ref || 'unknown');
  res.json({ message: 'Deploy triggered for ' + project.name, project: project.name });

  // Trigger redeploy asynchronously (after response sent)
  setImmediate(() => {
    stopContainer(project.container);
    cleanDeployDir(project.container);
    const child = spawn('bash', [DEPLOY_SCRIPT, project.repo, String(project.port)], {
      cwd: path.dirname(DEPLOY_SCRIPT),
      detached: true,
      stdio: 'pipe',
    });
    let actualContainer = '';
    let framework = 'unknown';
    let deployMode = 'static';
    child.stdout.on('data', d => {
      const text = d.toString();
      const cm = text.match(/Container:\s*(app_\S+)/);
      if (cm) actualContainer = cm[1].trim();
      const fm = text.match(/Framework detected:\s*(\S+)/);
      if (fm) framework = fm[1].trim();
      const mm = text.match(/Mode:\s*(static|dynamic)/);
      if (mm) deployMode = mm[1].trim();
      process.stdout.write('[Webhook:' + project.name + '] ' + text);
    });
    child.stderr.on('data', d => process.stderr.write('[Webhook:' + project.name + '] ' + d.toString()));
    child.on('close', code => {
      const containerName = actualContainer || ('app_' + Date.now());
      const updated = {
        ...project,
        container: containerName,
        status: code === 0 ? 'running' : 'failed',
        framework, deployMode,
        updatedAt: new Date().toISOString(),
      };
      const all = loadProjects().filter(p => p.name !== project.name);
      all.push(updated);
      saveProjects(all);
      if (code === 0) regenerateNginxConfig();
      console.log('[Webhook] Deploy finished for', project.name, '— exit', code);
    });
  });
});

// ── Logs endpoint ────────────────────────────────────────────────────────────
app.get('/projects/:name/logs', (req, res) => {
  const { name } = req.params;
  const lines = parseInt(req.query.lines) || 150;
  const projects = loadProjects();
  const project = projects.find(function (p) { return p.name === name; });
  const containerName = (project && project.container) ? project.container : name;
  try {
    const out = execSync('docker logs --tail=' + lines + ' ' + containerName + ' 2>&1', { timeout: 6000 }).toString();
    res.json({ logs: out.split('\n').filter(function (l) { return l.trim(); }), container: containerName });
  } catch (e) {
    res.json({ logs: [], container: containerName });
  }
});

// ── All deployments ──────────────────────────────────────────────────────────
app.get('/deployments', (_req, res) => {
  const projects = loadProjects();
  res.json(projects.map((p, i) => ({
    id: i + 1,
    project: p.name,
    slug: p.slug || p.name,
    status: p.status || 'running',
    framework: p.framework || 'unknown',
    repo: p.repo || '',
    url: p.url || ('http://' + PUBLIC_IP + ':' + p.port),
    port: p.port,
    createdAt: p.createdAt || new Date().toISOString(),
  })));
});

// ── All env vars ─────────────────────────────────────────────────────────────
app.get('/env', (_req, res) => {
  res.json(loadAllEnvVars());
});

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB OAUTH & REPOSITORY LISTING ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────
const GITHUB_OAUTH_FILE = path.resolve(__dirname, 'github_oauth.json');
const GITHUB_TOKEN_FILE = path.resolve(__dirname, 'github_token.json');

function loadGitHubOauth() {
  try {
    if (fs.existsSync(GITHUB_OAUTH_FILE)) {
      return JSON.parse(fs.readFileSync(GITHUB_OAUTH_FILE, 'utf-8'));
    }
  } catch (e) { console.error('OAuth config load failed', e); }
  return {};
}

app.get('/api/auth/github', (req, res) => {
  const config = loadGitHubOauth();
  if (!config.client_id) return res.status(400).send('OAuth client not configured');
  const redirectUri = `http://13.233.87.37:5000/api/auth/github/callback`;
  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${config.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
  res.redirect(githubUrl);
});

app.get('/api/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Code required');

  const config = loadGitHubOauth();
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: config.client_id,
        client_secret: config.client_secret,
        code
      })
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return res.status(400).send('OAuth error: ' + tokenData.error_description);
    }

    const accessToken = tokenData.access_token;
    fs.writeFileSync(GITHUB_TOKEN_FILE, JSON.stringify({ access_token: accessToken }));

    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '${accessToken}' }, '*');
          window.close();
        } else {
          window.location.href = 'http://localhost:5174/import?github_connected=true';
        }
      </script>
    `);
  } catch (e) {
    console.error('OAuth Callback Error', e);
    res.status(500).send('Internal Auth Error');
  }
});

app.get('/api/auth/github/status', (req, res) => {
  const connected = fs.existsSync(GITHUB_TOKEN_FILE);
  res.json({ connected });
});

app.post('/api/auth/github/disconnect', (req, res) => {
  try {
    if (fs.existsSync(GITHUB_TOKEN_FILE)) {
      fs.unlinkSync(GITHUB_TOKEN_FILE);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Disconnect failed' });
  }
});

app.get('/api/github/repos', async (req, res) => {
  let token = '';
  try {
    if (fs.existsSync(GITHUB_TOKEN_FILE)) {
      token = JSON.parse(fs.readFileSync(GITHUB_TOKEN_FILE, 'utf-8')).access_token;
    }
  } catch (e) { }

  if (!token) return res.status(401).json({ error: 'GitHub not connected' });

  try {
    const reposRes = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Zenith-OS-Server'
      }
    });

    if (!reposRes.ok) {
      return res.status(reposRes.status).json({ error: 'Failed to fetch repos' });
    }

    const repos = await reposRes.json();
    const cleanRepos = repos.map(r => ({
      name: r.name,
      full_name: r.full_name,
      html_url: r.html_url,
      private: r.private,
      description: r.description,
      clone_url: r.clone_url,
      default_branch: r.default_branch
    }));

    res.json(cleanRepos);
  } catch (e) {
    console.error('Failed fetching repos', e);
    res.status(500).json({ error: 'GitHub API error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// REAL-TIME METRICS ENDPOINT (DOCKER CONTAINER STATS)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/projects/:name/stats', (req, res) => {
  const { name } = req.params;
  const projects = loadProjects();
  const project = projects.find(p => p.name === name);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const containerName = project.container || name;
  try {
    const out = execSync(`docker stats --no-stream --format '{"cpu":"{{.CPUPerc}}","memory":"{{.MemUsage}}","net":"{{.NetIO}}","memPerc":"{{.MemPerc}}"}' ${containerName} 2>/dev/null`, { timeout: 3000 }).toString();
    if (!out.trim()) {
      return res.json({ cpu: '0%', memory: '0B / 0B', net: '0B / 0B', memPerc: '0%', online: false });
    }
    const stats = JSON.parse(out.trim());
    res.json({
      cpu: stats.cpu,
      memory: stats.memory,
      net: stats.net,
      memPerc: stats.memPerc,
      online: true
    });
  } catch (e) {
    res.json({ cpu: '0%', memory: '0B / 0B', net: '0B / 0B', memPerc: '0%', online: false });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE PROVISIONING (PostgreSQL + Redis)
// ─────────────────────────────────────────────────────────────────────────────
const DATABASES_FILE = path.resolve(__dirname, 'databases.json');
const DB_PORT_START = 5400;
const DB_PORT_END = 5499;

function loadDatabases() {
  try { return JSON.parse(fs.readFileSync(DATABASES_FILE, 'utf-8')); } catch { return []; }
}
function saveDatabases(dbs) {
  fs.writeFileSync(DATABASES_FILE, JSON.stringify(dbs, null, 2));
}
function getNextDbPort(type) {
  const start = type === 'redis' ? 6370 : DB_PORT_START;
  const end = type === 'redis' ? 6469 : DB_PORT_END;
  const used = loadDatabases().map(d => d.port);
  for (let p = start; p <= end; p++) {
    if (!used.includes(p)) return p;
  }
  throw new Error('No DB ports available');
}
function randomPassword(len = 20) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pw = '';
  for (let i = 0; i < len; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

// GET /api/databases  — list all provisioned databases
app.get('/api/databases', (req, res) => {
  res.json(loadDatabases());
});

// POST /api/databases  — provision a new database
app.post('/api/databases', (req, res) => {
  const { name, type } = req.body; // type: 'postgres' | 'redis'
  if (!name || !['postgres', 'redis'].includes(type)) {
    return res.status(400).json({ error: 'name and type (postgres|redis) required' });
  }

  const slug = name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  const dbs = loadDatabases();
  if (dbs.find(d => d.name === slug)) {
    return res.status(409).json({ error: 'Database with this name already exists' });
  }

  let port, password, containerName, cmd;
  try { port = getNextDbPort(type); } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  password = randomPassword();
  containerName = `zenith_db_${slug}`;

  if (type === 'postgres') {
    const dataDir = `/home/ubuntu/postgres_data/${slug}`;
    execSync(`mkdir -p ${dataDir}`);
    cmd = `docker run -d --name ${containerName} --network zenith-network ` +
      `-e POSTGRES_PASSWORD=${password} -e POSTGRES_USER=zenith -e POSTGRES_DB=${slug} ` +
      `-p ${port}:5432 -v ${dataDir}:/var/lib/postgresql/data ` +
      `--restart unless-stopped postgres:15-alpine`;
  } else {
    cmd = `docker run -d --name ${containerName} --network zenith-network ` +
      `-p ${port}:6379 --restart unless-stopped redis:alpine ` +
      `redis-server --requirepass ${password}`;
  }

  try {
    execSync(cmd, { timeout: 60000 });
  } catch (e) {
    return res.status(500).json({ error: 'Docker run failed: ' + e.message });
  }

  const db = {
    id: Date.now(),
    name: slug,
    type,
    port,
    password,
    containerName,
    createdAt: new Date().toISOString(),
    internalHost: containerName,
    externalHost: PUBLIC_IP,
  };

  dbs.push(db);
  saveDatabases(dbs);
  res.json({ success: true, database: db });
});

// DELETE /api/databases/:name  — stop & remove a database
app.delete('/api/databases/:name', (req, res) => {
  const { name } = req.params;
  const dbs = loadDatabases();
  const idx = dbs.findIndex(d => d.name === name);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const db = dbs[idx];
  try {
    execSync(`docker stop ${db.containerName} 2>/dev/null || true`);
    execSync(`docker rm   ${db.containerName} 2>/dev/null || true`);
  } catch (e) { /* ignore */ }

  dbs.splice(idx, 1);
  saveDatabases(dbs);
  res.json({ success: true });
});

