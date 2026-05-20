# Zenith OS Workspace

This repo is a `pnpm` workspace exported from Replit. It now supports local Windows development too.

## Quick Start

Use Node.js 20+ and `pnpm` through Corepack.

```bash
corepack enable
corepack pnpm install
corepack pnpm run doctor
corepack pnpm dev
```

App URL:

- `http://localhost:5173`

## Useful Commands

- `corepack pnpm dev` - run the main landing app from the workspace
- `corepack pnpm dev:standalone` - run the standalone Vite copy in `zenith-os-standalone/`
- `corepack pnpm run doctor` - verify the machine and native package setup
- `corepack pnpm run reset:deps` - clear installed dependencies for a clean reinstall
- `corepack pnpm run build` - typecheck and build the workspace

## If It Breaks Again

If you see errors about `esbuild`, `rollup`, `lightningcss`, or `@tailwindcss/oxide` being missing, the dependency install is usually corrupted or copied from another platform.

Run this exact sequence:

```bash
corepack pnpm run reset:deps
corepack pnpm install
corepack pnpm run doctor
corepack pnpm dev
```

## Why This Was Failing Before

The original Replit setup was excluding Windows-native binaries for a few build tools. That works on Linux-only environments, but it breaks local Windows development. The workspace config now keeps the needed Windows x64 packages available.
