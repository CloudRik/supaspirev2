import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const workspaceFile = resolve(root, "pnpm-workspace.yaml");
const nodeModulesDir = resolve(root, "node_modules");
const pnpmDir = resolve(nodeModulesDir, ".pnpm");

const errors = [];
const warnings = [];
const checks = [];

function ok(message) {
  checks.push(`OK   ${message}`);
}

function warn(message) {
  warnings.push(`WARN ${message}`);
}

function fail(message) {
  errors.push(`FAIL ${message}`);
}

function versionAtLeast(actual, minimum) {
  const actualParts = actual.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const minimumParts = minimum.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(actualParts.length, minimumParts.length);

  for (let i = 0; i < length; i += 1) {
    const a = actualParts[i] ?? 0;
    const b = minimumParts[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }

  return true;
}

function packagePresent(fragment) {
  if (!existsSync(pnpmDir)) return false;
  try {
    const entries = new Set(readdirSync(pnpmDir));
    for (const entry of entries) {
      if (entry.includes(fragment)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

const nodeVersion = process.versions.node;
if (versionAtLeast(nodeVersion, "20.0.0")) {
  ok(`Node.js ${nodeVersion} is supported`);
} else {
  fail(`Node.js ${nodeVersion} detected. Use Node.js 20 or newer.`);
}

const ua = process.env.npm_config_user_agent ?? "";
if (ua.startsWith("pnpm/")) {
  ok("pnpm is being used");
} else {
  warn("This workspace is designed for pnpm. Run commands through `corepack pnpm ...`.");
}

if (!existsSync(workspaceFile)) {
  fail("pnpm-workspace.yaml is missing.");
} else {
  const workspaceText = await readFile(workspaceFile, "utf8");
  const blockedWindowsOverrides = [
    '"esbuild>@esbuild/win32-x64": "-"',
    '"lightningcss>lightningcss-win32-x64-msvc": "-"',
    '"@tailwindcss/oxide>@tailwindcss/oxide-win32-x64-msvc": "-"',
    '"rollup>@rollup/rollup-win32-x64-msvc": "-"',
  ];

  const foundBlockedOverride = blockedWindowsOverrides.find((entry) =>
    workspaceText.includes(entry),
  );

  if (process.platform === "win32" && foundBlockedOverride) {
    fail(
      `Windows native binaries are blocked in pnpm-workspace.yaml (${foundBlockedOverride}).`,
    );
  } else {
    ok("Native package overrides look compatible with this machine");
  }
}

if (existsSync(nodeModulesDir)) {
  ok("Dependencies are installed");
} else {
  warn("`node_modules` is missing. Run `corepack pnpm install`.");
}

if (process.platform === "win32" && existsSync(nodeModulesDir)) {
  const windowsPackages = [
    ["@esbuild/win32-x64", "@esbuild+win32-x64@"],
    ["@rollup/rollup-win32-x64-msvc", "@rollup+rollup-win32-x64-msvc@"],
    ["lightningcss-win32-x64-msvc", "lightningcss-win32-x64-msvc@"],
    ["@tailwindcss/oxide-win32-x64-msvc", "@tailwindcss+oxide-win32-x64-msvc@"],
  ];

  for (const [label, fragment] of windowsPackages) {
    if (packagePresent(fragment)) {
      ok(`${label} is installed`);
    } else {
      warn(`${label} is missing. If dev server fails, run \`pnpm run reset:deps\` then \`corepack pnpm install\`.`);
    }
  }
}

for (const line of checks) {
  console.log(line);
}

for (const line of warnings) {
  console.log(line);
}

for (const line of errors) {
  console.error(line);
}

if (errors.length > 0) {
  process.exit(1);
}
