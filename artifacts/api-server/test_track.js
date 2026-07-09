const http = require("http");

const req = http.request({
  hostname: "127.0.0.1",
  port: 5000,
  path: "/analytics/track",
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  }
}, (res) => {
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => {
    console.log("Response:", res.statusCode, body);
  });
});

req.on("error", (e) => {
  console.error("Request error:", e);
});

req.write(JSON.stringify({
  projectName: "elegant",
  name: "pageview",
  type: "pageview",
  path: "/login",
  hostname: "elegant.cloudrik.com",
  referrer: "",
  environment: "production"
}));

req.end();
