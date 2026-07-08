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
- [x] Commit foundation

## Phase 1 — Backup current site as live "v1"  ✅
Goal: current design fully browsable + functional at `/v1`, sharing DB/auth/APIs. New design will occupy `/`.
**Approach used (better than copying components): a `basePath` React context.** Existing components ARE the frozen v1 library; the redesign will build NEW component files and must not alter these. See LOG.
- [x] `lib/base-path.tsx` — `BasePathContext` + `useBasePath()` + `withBase()` + `BasePathProvider` (default "")
- [x] Wire basePath into central link components: `blog-link.tsx`, `portfolio-link.tsx`, `series-post-nav.tsx` (`<select>` jump)
- [x] Wire basePath into portfolio blog-links: `hero.tsx`, `about.tsx`, `projects.tsx`
- [x] `app/v1/layout.tsx` (BasePathProvider base="/v1", `.v1-scope` wrapper, `noindex`)
- [x] `app/v1/page.tsx` (portfolio, mirrors app/page.tsx)
- [x] `app/v1/blog/{layout,page,[slug]/page,features/page,series/[...slug]/page}.tsx` (+ loading skeletons)
- [x] Fix 2 plain (non-BlogLink) links in v1 features copy → `/v1/blog...`
- [x] Removed dead `getPostVote` import from v1 [slug] copy
- [x] `.v1-scope` CSS seam added to globals.css (no-op today; **populate frozen tokens in Phase 3**)
- [x] Verified via dev server: `/v1`, `/v1/blog`, `/v1/blog/[slug]`, `/v1/blog/series/...`, `/v1/blog/features` all 200; every link prefixed `/v1/*`; zero bare-`/blog` leaks; live `/` + `/blog` unchanged; `/v1/nonexistent` 404
- [x] Enabled branch preview deploys in `vercel.json` (`redesign/v2: true`)
- [ ] Commit + push → check Vercel preview `/v1` on desktop + mobile (env: confirm Preview scope has DATABASE_URL etc.)
- [ ] (Deferred to Phase 5) add a small "back to current site" affordance on /v1

## Phase 2 — Template analysis → DESIGN SPEC  (ends at owner sign-off)
Tooling (breakpoint-driven, per owner guidance): FIRST extract each template's REAL breakpoints from its inline `@media` rules (Framer inlines all CSS — no external stylesheets), THEN render/screenshot + dump computed styles at widths just below/above each real breakpoint. Save artifacts under scratchpad; write findings into `DESIGN-SPEC.md`.
Confirmed real breakpoints (from inline CSS):
- **portfolie**: ≤809 (phone) · 810–1199 (tablet) · 1200–1439 (desktop) · ≥1440 (large desktop)  → capture at 375, 809, 810, 1199, 1200, 1439, 1440
- **reado-wbs**: ≤809 (phone) · 810–1199 (tablet) · ≥1200 (desktop)  → capture at 375, 809, 810, 1199, 1200, 1440
- Other templates: extract their own breakpoints the same way before capturing.
Portfolio templates (primary = **portfolie**):
- [x] portfolie.framer.website  (PRIMARY — deep: tokens + desktop + mobile)
- [x] portfoliod.framer.website  (tokens + desktop)
- [x] banter.framer.website  (tokens + desktop)
- [x] portfoliob.framer.website  (tokens + desktop)
Blog templates (primary = **reado**):
- [x] reado-wbs.framer.website  (PRIMARY — deep: tokens + desktop + mobile)
- [x] narric.framer.website  (tokens + desktop)
- [x] narrate-template.framer.website  (tokens + desktop)
- [x] reflect-template.framer.website  (tokens + desktop)
- [x] press-hub-blog.framer.website  (tokens + desktop)
Deliverables in `DESIGN-SPEC.md`:
- [x] Per-template: layout, sections, type scale, color, radii, components, responsive (data-extracted + screenshots)
- [x] Central design decision framed (mood bridge, accent, type) — see spec §0
- [x] Component-by-component mapping (draft) — spec §5
- [x] Plan for keeping device-showcase + snippet features — spec §4
- [ ] **[!] Owner sign-off on DESIGN-SPEC.md** (§0 + Open Questions) — IN REVIEW
- [ ] After sign-off: finalize harmonized token system + finalize mapping

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
