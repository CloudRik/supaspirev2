# Zenith OS — Landing Page

Premium animated landing page for **Zenith OS** (a developer cloud hosting platform). Built with React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion, and shadcn/ui.

## Quick Start

You need **Node.js 20+**. If you are working from the full exported repo, prefer the root workspace commands with `pnpm`.

```bash
# From the repo root
corepack pnpm install
corepack pnpm dev
```

If you only want to run this folder by itself, use:

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (auto-opens http://localhost:5173)
npm run dev
```

For the exported workspace repo, the main app also runs at the root with:

```bash
corepack pnpm dev
```

On Windows, if Vite reports missing `esbuild`, `rollup`, `lightningcss`, or `oxide` packages, go back to the repo root and run:

```bash
corepack pnpm run reset:deps
corepack pnpm install
corepack pnpm run doctor
```

## Available Scripts

| Command            | What it does                              |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Start Vite dev server on port 5173        |
| `npm run build`    | Build production bundle into `dist/`      |
| `npm run preview`  | Locally preview the production build      |
| `npm run typecheck`| Run TypeScript type-checking              |

## Project Structure

```
zenith-os-standalone/
├── index.html              # HTML entry
├── vite.config.ts          # Vite config
├── tsconfig.json           # TS config
├── package.json
├── public/                 # Static assets (favicon, og image)
└── src/
    ├── main.tsx            # React entry
    ├── App.tsx             # The whole landing page (single file)
    ├── index.css           # Tailwind v4 + design tokens
    ├── components/ui/      # shadcn/ui primitives
    ├── hooks/              # React hooks (use-toast, use-mobile)
    ├── lib/utils.ts        # cn() helper
    └── pages/not-found.tsx # 404 page
```

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 7** (build tool)
- **Tailwind CSS v4** (via `@tailwindcss/vite` — no `tailwind.config.js` needed; theme is in `src/index.css`)
- **Framer Motion** (animations)
- **lucide-react** (icons)
- **wouter** (routing)
- **shadcn/ui** + **Radix UI** (component primitives)

## Editing in VS Code / Cursor / WebStorm

Just open the `zenith-os-standalone/` folder in your editor. Recommended VS Code extensions:

- **ESLint**
- **Tailwind CSS IntelliSense**
- **Prettier**

## Deployment

Run `npm run build` — the static output in `dist/` can be deployed to:

- Vercel (`vercel deploy`)
- Netlify (drag-drop the `dist/` folder)
- Cloudflare Pages
- GitHub Pages
- Any static host

No backend, no environment variables required.

## Notes

- The page is **dark mode by default** (the `<html>` tag has `class="dark"`).
- All design tokens live as HSL CSS variables in `src/index.css` — tweak the palette there.
- The whole landing is a single component file (`src/App.tsx`) for easy editing.
