const fs = require('fs');
const file = '/home/ubuntu/backend/projects.json';
let data = JSON.parse(fs.readFileSync(file));
data.forEach(p => {
  if (p.name === 'cervizo_live') {
    p.slug = 'cervizo-live';
    p.url = 'https://cervizo-live.cloudrik.com';
  }
});
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("Updated projects.json");
