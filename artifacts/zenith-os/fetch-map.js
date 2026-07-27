const fetch = require('node-fetch'); // wait node 18 has fetch built-in
fetch('https://cryptgen-template-aceternity.vercel.app/')
  .then(res => res.text())
  .then(html => {
    const urls = html.match(/(https?:\/\/[^\s"'<>]+?(?:svg|png|webp|jpg))/gi) || [];
    const srcUrls = html.match(/src="([^"]+)"/gi) || [];
    console.log("All matching image URLs:", new Set([...urls, ...srcUrls]));
  });
