const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECTS_FILE = '/home/ubuntu/backend/projects.json';
const NGINX_CONF = '/etc/nginx/sites-available/zenith';

function loadProjects() {
  try { return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8')); }
  catch { return []; }
}

function buildNginxCDNConfig(p) {
  const cacheTtl = p.cdnCacheTtl || '60m';
  const cacheEnabled = p.cdnCacheEnabled !== false;

  let redirectsStr = '';
  if (p.redirects && Array.isArray(p.redirects)) {
    for (const r of p.redirects) {
      if (r.fromPath && r.toUrl) {
        redirectsStr += `    if ($request_uri = "${r.fromPath}") { return ${r.statusCode || 301} "${r.toUrl}"; }\n`;
      }
    }
  }

  let routesStr = '';
  if (p.routes && Array.isArray(p.routes)) {
    for (const r of p.routes) {
      if (r.path && r.destination) {
        routesStr += `
    location ${r.path} {
        proxy_pass ${r.destination};
        proxy_set_header Host $host;
        proxy_cache off;
    }
`;
      }
    }
  }

  let cacheConfig = '';
  if (cacheEnabled) {
    cacheConfig = `
        # Edge CDN Configuration
        proxy_cache CLOUDRIK_CDN;
        proxy_cache_valid 200 302 ${cacheTtl};
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_background_update on;
        proxy_cache_lock on;
        proxy_cache_bypass $http_upgrade;
        add_header X-CloudRik-CDN $upstream_cache_status;
        
        # Force browser to always revalidate index.html with the CDN
        add_header Cache-Control "no-cache, must-revalidate";
    `;
  } else {
    cacheConfig = `
        # Edge CDN Disabled
        proxy_cache off;
        add_header Cache-Control "no-cache, must-revalidate";
    `;
  }

  return { redirectsStr, routesStr, cacheConfig };
}

function regenerateNginxConfig(skipCertbot = false) {
  const allProjects = loadProjects();
  let serverBlocks = `
# Global Edge CDN Cache Path
proxy_cache_path /var/cache/nginx/cloudrik_cdn levels=1:2 keys_zone=CLOUDRIK_CDN:50m inactive=7d max_size=2g;
`;
  const domainsToCertify = [];

  for (const p of allProjects) {
    const slug = (p.slug || p.name).replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    const projectDomains = [`${slug}.cloudrik.com`];
    if (p.customDomain) {
      projectDomains.push(p.customDomain.toLowerCase());
    }

    const { redirectsStr, routesStr, cacheConfig } = buildNginxCDNConfig(p);

    for (const rootDomain of projectDomains) {
      const isSubdomain = rootDomain.endsWith('.cloudrik.com') && rootDomain.split('.').length === 3;
      const wwwDomain = isSubdomain ? '' : 'www.' + rootDomain;
      const certPath = `/etc/letsencrypt/live/${rootDomain}/fullchain.pem`;
      const keyPath = `/etc/letsencrypt/live/${rootDomain}/privkey.pem`;
      let hasSsl = false;
      try {
        require('child_process').execSync(`sudo test -f ${certPath}`);
        hasSsl = true;
      } catch(e) {}

      if (hasSsl) {
        serverBlocks += `
server {
    listen 80;
    server_name ${rootDomain} ${wwwDomain};
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name ${rootDomain} ${wwwDomain};
    ssl_certificate ${certPath};
    ssl_certificate_key ${keyPath};
    
    # Custom Redirects
${redirectsStr}
    # Custom Routes
${routesStr}
    location / {
        proxy_pass http://127.0.0.1:${p.port}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
${cacheConfig}
    }
}
`;
      } else {
        serverBlocks += `
server {
    listen 80;
    server_name ${rootDomain} ${wwwDomain};
    
    # Custom Redirects
${redirectsStr}
    # Custom Routes
${routesStr}
    location / {
        proxy_pass http://127.0.0.1:${p.port}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
${cacheConfig}
    }
}
`;
        domainsToCertify.push(rootDomain);
      }
    }
  }

  const apiServerBlocks = `
server {
    server_name api.cloudrik.com;
    location / {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.cloudrik.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.cloudrik.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = api.cloudrik.com) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name api.cloudrik.com;
    return 404;
}
`;

  const config = 'server {\n    listen 80;\n    server_name _;\n    location / {\n        return 200 \'ZenithOS Deployment Server\';\n        add_header Content-Type text/plain;\n    }\n}\n' + serverBlocks + apiServerBlocks;
  try {
    fs.writeFileSync('/tmp/zenith_nginx.conf', config);
    execSync('sudo cp /tmp/zenith_nginx.conf ' + NGINX_CONF);
    execSync('sudo ln -sf ' + NGINX_CONF + ' /etc/nginx/sites-enabled/zenith 2>/dev/null || true');
    execSync('sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true');
    execSync('sudo nginx -t && sudo systemctl reload nginx');
    console.log('Nginx regenerated and reloaded successfully');
  } catch (err) { console.error('NGINX error:', err.message); }
}

regenerateNginxConfig(true);
