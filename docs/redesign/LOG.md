# Redesign v2 — Work Log

> Chronological record of what was done and **why** (esp. non-obvious decisions).
> Newest entries at the bottom. New sessions: read this + `CLAUDE.md` + `TODO.md` to get grounded.

---

## 2026-07-08 — Session 1: kickoff, discovery, foundation

### Context established
- Site is Next.js 15 App Router (React 19, TS, Tailwind), Vercel-hosted. Blog is Postgres/RDS-backed with OAuth, comments, votes, series, admin, and interactive snippets.
- Read: `ROUTES.md`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`, `components/hero.tsx`, `components/projects.tsx`, `app/blog/page.tsx`, `components/blog-snippet-embed.tsx`.
- **Design tokens (v1):** primary `#2F70FF`, secondary `#FF6B4A`, Inter, `--radius:0.5rem`, HSL vars, `.dark` class.
- **Two features to preserve:** (1) responsive device showcase in `projects.tsx` (MacBook/Studio/iPad/iPhone frames, CSS in globals.css); (2) snippet iframes in `blog-snippet-embed.tsx` that pass theme + user session via `postMessage`.

### Tooling decision
- Use **Puppeteer** (already a dependency) + installed Chrome to render/inspect the Framer template sites (screenshots at multiple viewports + computed-style extraction). Rationale: owner explicitly required a real renderer, not blind fetching. Python venv lacks playwright/selenium; Puppeteer is already present and sufficient.

### Owner decisions (via question prompt)
1. **v1 backup = Live copy at `/v1`.** Duplicate current design under `/v1` + `/v1/blog/**`, fully dynamic, sharing the same DB/auth/APIs. New design at `/`. Preserve all existing URLs; 301-redirect any route renamed in v2.
2. **Deploy = Preview per push, production on merge.** Enable branch preview deploys; `nerosiegfried.com` keeps serving current site until merge to `main`.
3. **Checkpoint = Review design spec first.** Analyze all 10 templates, produce `DESIGN-SPEC.md`, get sign-off before writing redesign code.

### Non-obvious notes / decisions
- **Inline styles:** current code has some inline `style={}` in `projects.tsx` (device-showcase scale math from ResizeObserver) and `blog-snippet-embed.tsx` (iframe height). These are *computed geometry*, allowed under the owner's rule; redesign will route such values through CSS custom properties where practical and keep all *static* styling in CSS/classes.
- **v1 freeze strategy chosen:** copy current components into `components/v1/` (frozen) rather than sharing live components, so the redesign can freely rewrite `components/*` without altering the `/v1` experience. Blog data layer (`lib/blog/*`) and API routes stay shared (same content, same auth).
- **API routes stay un-namespaced:** v1 blog must call the same `/api/**` endpoints (OAuth callback URLs are registered for exact paths; namespacing would break auth). Only page routes + UI components are duplicated under `/v1`.

### Done
- Created branch `redesign/v2`.
- Created `CLAUDE.md`, `docs/redesign/TODO.md`, `docs/redesign/LOG.md`.

### Next
- Build Phase 1 (v1 live backup), verify, commit, push, check preview.
- Then Phase 2 (template analysis → DESIGN-SPEC → sign-off).
