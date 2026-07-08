# Redesign v2 — TODO

> Working checklist. Check items off as done. Keep [`LOG.md`](LOG.md) updated with what/why alongside.
> Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked/needs owner

---

## Phase 0 — Foundation  ✅
- [x] Explore current codebase (routes, components, styling, data, snippet feature)
- [x] Confirm inspection tooling (Puppeteer + Chrome present)
- [x] Get owner decisions (v1=live copy at /v1 · deploy=preview per push · checkpoint=review spec first)
- [x] Create branch `redesign/v2`
- [x] Create persistent docs: `CLAUDE.md`, `docs/redesign/TODO.md`, `docs/redesign/LOG.md`
- [ ] Commit foundation

## Phase 1 — Backup current site as live "v1"  (before any redesign)
Goal: current design fully browsable + functional at `/v1`, sharing DB/auth/APIs. New design will occupy `/`.
- [ ] Freeze current portfolio components into `components/v1/` (hero, about, projects, tech-stack, contact, footer, mode-toggle deps as needed)
- [ ] Freeze current blog components into `components/v1/` (blog-top-nav, blog-post-list, blog-series-nav, blog-archive-sidebar, blog-markdown, blog-comments, series/vote/snippet embeds, etc.)
- [ ] `app/v1/page.tsx` → renders v1 portfolio (imports from `components/v1/`)
- [ ] `app/v1/blog/page.tsx`, `app/v1/blog/[slug]/page.tsx`, `app/v1/blog/features/page.tsx`, `app/v1/blog/series/[...slug]/page.tsx` (reuse shared `lib/blog/*` data layer)
- [ ] Rewrite ALL internal links inside v1 to stay in `/v1/**`:
  - [ ] portfolio "Read Blog" → `/v1/blog`; project "Read Article" → `/v1/blog/[slug]`
  - [ ] blog "← Portfolio" → `/v1`; post/series/archive links → `/v1/blog/...`
  - [ ] verify OAuth/comment/vote actions still hit shared `/api/**` (must NOT be namespaced)
- [ ] Preserve v1 CSS: ensure classes v1 depends on (device frames, footer-pattern, theme-toggle, btn-show-*) are not removed by the redesign; scope into `app/v1/` styles if needed
- [ ] Preserve v1 metadata/OG so v1 pages don't 500
- [ ] Verify locally: every v1 page renders + every v1 link resolves within /v1 + login/comment still work
- [ ] Commit + push → check Vercel preview `/v1` on desktop + mobile

## Phase 2 — Template analysis → DESIGN SPEC  (ends at owner sign-off)
Tooling: Puppeteer script → screenshot each page at 3 viewports (mobile 390, tablet 834, desktop 1440) + dump computed styles/tokens. Save artifacts under scratchpad; write findings into `DESIGN-SPEC.md`.
Portfolio templates (primary = **portfolie**):
- [ ] portfolie.framer.website  (PRIMARY)
- [ ] portfoliod.framer.website
- [ ] banter.framer.website
- [ ] portfoliob.framer.website
Blog templates (primary = **reado**):
- [ ] reado-wbs.framer.website  (PRIMARY)
- [ ] narric.framer.website
- [ ] narrate-template.framer.website
- [ ] reflect-template.framer.website
- [ ] press-hub-blog.framer.website
Deliverables in `DESIGN-SPEC.md`:
- [ ] Per-template: layout, sections, type scale, color, spacing, motion, components, responsive behavior (with screenshots)
- [ ] Harmonized design system (tokens: type scale, color, spacing, radius, shadows, motion) unifying portfolio + blog
- [ ] Component-by-component mapping: which template pattern → which of my sections; how current content fits
- [ ] Where content is missing for a template section → proposed handling
- [ ] Plan for keeping device-showcase + snippet features within the new look
- [ ] **[!] Owner sign-off on DESIGN-SPEC.md**

## Phase 3 — Build redesign: shared system + portfolio
- [ ] Implement harmonized tokens (globals.css vars + tailwind config), fonts, dark mode
- [ ] Global CSS layer / component CSS files (no inline static styles)
- [ ] Rebuild portfolio sections per spec (nav, hero, about, projects+device showcase, tech, contact, footer)
- [ ] Responsive pass at 3 viewports; motion/interactions
- [ ] Commit + push → verify preview

## Phase 4 — Build redesign: blog
- [ ] Rebuild blog index (reado-style) + post page + series + features
- [ ] Preserve snippets (session pass-through), comments, votes, archive, series nav
- [ ] Keep admin/control untouched functionally
- [ ] Responsive pass; motion
- [ ] Commit + push → verify preview

## Phase 5 — Wire-up, redirects, QA
- [ ] Add "v1" reference/link from new site
- [ ] Add 301 redirects for any renamed v1 routes (next.config.mjs)
- [ ] Update `ROUTES.md` with new + /v1 routes
- [ ] Full link audit: no dead links anywhere (new site, v1, cross-links, external)
- [ ] Cross-check CSP/image domains for any new assets
- [ ] Accessibility + reduced-motion + Lighthouse pass
- [ ] Verify on Vercel preview: all pages, all viewports, auth/comments/snippets

## Phase 6 — Ship
- [ ] Final owner review on preview URL
- [ ] Merge `redesign/v2` → `main`
- [ ] Confirm production `nerosiegfried.com` works end-to-end (portfolio, blog, /v1, auth, snippets)
