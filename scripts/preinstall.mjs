import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

for (const file of ["package-lock.json", "yarn.lock"]) {
  const p = resolve(root, file);
  if (existsSync(p)) {
    try {
      unlinkSync(p);
    } catch {
      // ignore
    }
  }
}

const ua = process.env.npm_config_user_agent ?? "";
if (!ua.startsWith("pnpm/")) {
  console.error("Use pnpm instead (https://pnpm.io/installation)");
  process.exit(1);
}
