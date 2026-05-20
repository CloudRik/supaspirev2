import { existsSync, rmSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  console.log("Usage: node scripts/reset-deps.mjs --yes");
  console.log("");
  console.log("Removes workspace node_modules folders and npm/yarn lockfiles.");
  console.log("Run `corepack pnpm install` right after this command.");
  process.exit(0);
}

if (!args.has("--yes")) {
  console.error("Refusing to remove dependencies without --yes.");
  console.error("Run: node scripts/reset-deps.mjs --yes");
  process.exit(1);
}

const targets = [
  "node_modules",
  "artifacts/api-server/node_modules",
  "artifacts/mockup-sandbox/node_modules",
  "artifacts/zenith-os/node_modules",
  "lib/api-client-react/node_modules",
  "lib/api-spec/node_modules",
  "lib/api-zod/node_modules",
  "lib/db/node_modules",
  "scripts/node_modules",
  "package-lock.json",
  "yarn.lock",
];

for (const target of targets) {
  const fullPath = resolve(root, target);
  if (!existsSync(fullPath)) continue;

  if (target.endsWith(".json") || target.endsWith(".lock")) {
    unlinkSync(fullPath);
    console.log(`removed ${target}`);
    continue;
  }

  rmSync(fullPath, { recursive: true, force: true });
  console.log(`removed ${target}`);
}

console.log("");
console.log("Dependencies were cleared.");
console.log("Next steps:");
console.log("1. corepack pnpm install");
console.log("2. corepack pnpm run doctor");
console.log("3. corepack pnpm dev");
