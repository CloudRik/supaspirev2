const fs = require('fs');
const NGINX_CONF = '/etc/nginx/sites-available/zenith';

const p = {
    name: "cervizo_live",
    slug: "cervizo-live",
    port: 3000
};

const slug = p.slug || p.name;
const domain = `${slug}.cloudrik.com`;
const serverBlocks = `
server {
    listen 80;
    server_name ${domain};
    location / {
        proxy_pass http://127.0.0.1:${p.port}/;
    }
}
`;

const config = 'server {\n    listen 80;\n    server_name _;\n    location / {\n        return 200 \'ZenithOS Deployment Server\';\n        add_header Content-Type text/plain;\n    }\n}\n' + serverBlocks;

try {
    fs.writeFileSync('/tmp/zenith_nginx.conf', config);
    console.log("Wrote config to /tmp/zenith_nginx.conf");
    console.log(config);
} catch (e) {
    console.error(e);
}
