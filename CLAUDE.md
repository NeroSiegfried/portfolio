# CLAUDE.md — Project Context (auto-loaded every session)

> **Read this first.** This file is the north star for the **portfolio redesign (v2)** project.
> Detailed working docs live in [`docs/redesign/`](docs/redesign/):
> - [`docs/redesign/TODO.md`](docs/redesign/TODO.md) — phased task list with minor steps + checkboxes. **Update as you work.**
> - [`docs/redesign/LOG.md`](docs/redesign/LOG.md) — chronological log of everything done + non-obvious decisions. **Append as you work.**
> - [`docs/redesign/DESIGN-SPEC.md`](docs/redesign/DESIGN-SPEC.md) — the template analysis + component-by-component redesign spec (created during Phase 2; needs owner sign-off before building).

---

## What this project is

Personal portfolio + blog for **Victor Nabasu** (`nerosiegfried.com`). **Next.js 15 App Router**, React 19, TypeScript, Tailwind, deployed on **Vercel**. Blog is Postgres-backed (AWS RDS) with OAuth login, comments, votes, series, and interactive code **snippets**.

### Current routes (the "v1" design)
- `/` — portfolio home: Hero → About → Projects → TechStack → Contact → Footer
- `/blog` — blog index (series nav + post list + archive)
- `/blog/[slug]` — blog post (markdown + snippets + comments + votes + series nav)
- `/blog/features` — features list
- `/blog/series/[...slug]` — series view
- `/control`, `/control/dashboard` — admin (login + dashboard)
- `/api/**` — auth (password + GitHub/Google OAuth), blog comments/votes, admin CRUD, contact, upload, og
- `blog.nerosiegfried.com` → 301 → `nerosiegfried.com/blog` (see `vercel.json` + `middleware.ts`)

Full route/data/auth reference already exists in [`ROUTES.md`](ROUTES.md) — keep it accurate.

### Key features that MUST be preserved
1. **Responsive device showcase** — [`components/projects.tsx`](components/projects.tsx) renders each project inside MacBook + Studio Display + iPad + iPhone frames (CSS in `app/globals.css` under "DEVICE FRAMES"). This is the "showcase responsiveness" feature.
2. **Interactive blog snippets with session pass-through** — [`components/blog-snippet-embed.tsx`](components/blog-snippet-embed.tsx): sandboxed iframes that receive **theme + logged-in user** via `postMessage` and render live HTML/CSS/JS. Snippets are admin-managed (`/api/admin/snippets`) and embedded into posts. Blog **slugs** + per-post snippet sections must keep working.
3. Dark/light theme (next-themes, class-based), OAuth login, comments, votes, admin dashboard.

## The redesign (v2) — what we're doing
Redesign portfolio + blog to be less basic, keeping (and extending) current functionality. Owner supplied Framer templates as the design source of truth (see DESIGN-SPEC / TODO). **Primaries: `portfolie` (portfolio) and `reado` (blog).** Portfolio and blog should feel unified.

### Backup requirement
The **current (v1) design is preserved as a live copy at `/v1`** (portfolio) and `/v1/blog/**`, fully dynamic, sharing the same DB/auth/APIs. New design lives at `/`. The new site references it as **"v1"**. Every existing URL must keep working; any route renamed in v2 gets a 301 redirect. See TODO Phase 1.

## Hard rules (owner constraints — do not violate)
- **THIS IS A GROUND-UP REDESIGN, NOT A RESKIN.** Do NOT keep the current site's section structure/components and just swap colors + fonts. Rethink each page's *composition, layout, and interaction* from the templates. Ignore the current site's styling entirely — take only the **information/content** from it and re-present it in the new style, even if that means a completely different structure. (Session-1 mistake: the first v2 portfolio was a reskin — rejected.)
- **Recreate the templates' INTERACTION layer, not just static looks.** Inspect and reproduce: custom **cursors** and per-section cursor behavior, **hover** effects (magnetic buttons, image zoom/reveal, text-swap/marquee-on-hover, link underlines), **scroll** motion (reveals, parallax, pinned/sticky, horizontal scroll), **icon/logo animations**, marquees, and page-load reveals. A redesign without these is incomplete.
- **Match the templates' SHAPE language: mostly SQUARED.** portfolie/banter/portfoliob use small radii (2–11px) — do not pill everything. Pills only where a template genuinely uses them.
- **Device responsiveness showcase:** do NOT use the CSS-rendered device frames. Present responsiveness as an **edited image "spread"** per project (like a blog-post image showing the product across viewports). Projects become image-led.
- **The accordion is NOT required** — don't retain it just because v1 had it.
- **NEVER use inline `style={}` for static styling.** Keep HTML/CSS/behaviour separate. Inline allowed ONLY for genuinely computed values (e.g. ResizeObserver scale); prefer CSS custom properties. No static colors/spacing/typography inline, ever.
- Analyse templates with a **real renderer** (Puppeteer + Chrome). Beyond screenshots + computed tokens, actively probe interactions: detect custom-cursor DOM, diff computed styles before/after `page.hover()`, capture hover-state screenshots, inspect transition/animation/transform usage. Never guess.
- **Get sign-off on `DESIGN-SPEC.md` before building the redesign.**

## Workflow
- Branch: **`redesign/v2`**. Keep committing here. Vercel builds a **preview per push**; production (`nerosiegfried.com`) only updates on **merge to main** — so it's safe to iterate.
- After meaningful changes: build locally / verify, commit, push, confirm the Vercel preview works (incl. mobile) before moving on.

## Design tokens (v1 baseline)
- Primary `#2F70FF` (blue), Secondary `#FF6B4A` (orange). HSL CSS vars in `app/globals.css`; Tailwind maps them in `tailwind.config.ts`. Font: Inter. `--radius: 0.5rem`. Dark mode = `.dark` class on `<html>`.

## Environment / deploy notes
- Needs `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, admin + OAuth secrets (see `ROUTES.md` › Environment Variables and `.env.example`). `.env.local` exists for local dev.
- `next.config.mjs` has CSP + image `remotePatterns` — when adding external image/asset hosts or inline needs, update CSP there.

## Secondary working dir
`/Users/nerosiegfried/Documents/VS/Derivian/src/app/blog` is a **different project** (Derivian, one of the showcased portfolio projects), not this repo. Ignore unless explicitly asked.
