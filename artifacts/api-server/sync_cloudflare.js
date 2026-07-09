require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!API_TOKEN || !ZONE_ID) {
  console.error("Missing Cloudflare keys in .env");
  process.exit(1);
}

const projectsPath = path.join(__dirname, 'projects.json');
let projects = [];
try {
  projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
} catch(e) {
  console.error("Error reading projects.json", e);
  process.exit(1);
}

function addCustomHostname(domain) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      hostname: domain,
      ssl: {
        method: "http",
        type: "dv",
        settings: {
          min_tls_version: "1.2"
        }
      }
    });

    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${ZONE_ID}/custom_hostnames`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        resolve(JSON.parse(body));
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sync() {
  let found = 0;
  for (const p of projects) {
    if (p.customDomain) {
      found++;
      console.log(`Syncing ${p.customDomain} to Cloudflare...`);
      const result = await addCustomHostname(p.customDomain);
      if (result.success) {
        console.log(`Success! ${p.customDomain} is now on Cloudflare Edge.`);
      } else {
        const err = result.errors ? result.errors[0]?.message : "Unknown error";
        if (err && err.includes("already exists")) {
          console.log(`${p.customDomain} already exists on Cloudflare.`);
        } else {
          console.error(`Failed for ${p.customDomain}:`, err);
        }
      }
    }
  }
  if (found === 0) {
    console.log("No custom domains found to sync.");
  }
  console.log("Sync complete.");
}

sync();
