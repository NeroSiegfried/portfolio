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

## 2026-07-08 — Session 1 (cont.): Phase 1 — v1 live backup

### Approach decision (important)
Instead of physically copying ~20 components into `components/v1/`, I used a **`basePath` React context** (`lib/base-path.tsx`). Rationale:
- Nearly all blog links already route through one component, `BlogLink`, which uses a context (`SubdomainContext`) to transform hrefs. Extending that pattern with a `basePath` context flips the entire `/v1` subtree's links to `/v1/*` with almost no per-component edits.
- The **existing components ARE the frozen v1 library.** The redesign (Phase 3/4) must create NEW component files and must NOT edit these existing section components in ways that change their look. This keeps v1 frozen without duplication.
- Consequence/constraint recorded in CLAUDE.md: redesign = new component files (e.g. under `components/v2/`), reuse `components/ui/*` freely (scoped by tokens).

### What changed
- New: `lib/base-path.tsx` (`BasePathContext`/`useBasePath`/`withBase`/`BasePathProvider`, default base `""`).
- Edited (non-visual, default-`""` so live `/` unchanged): `blog-link.tsx`, `portfolio-link.tsx`, `series-post-nav.tsx` (the `<select>` post-jump used `window.location.href`), `hero.tsx`, `about.tsx`, `projects.tsx`.
- New routes: `app/v1/layout.tsx` (provides base `/v1`, wraps `.v1-scope`, `noindex`), `app/v1/page.tsx`, `app/v1/blog/{layout,page,[slug]/page,features/page,series/[...slug]/page}.tsx` + loading skeletons. Blog pages are near-verbatim copies (absolute `@/` imports + context prefixing = copies just work). Fixed 2 plain `<Link>` in the v1 features copy and dropped a dead `getPostVote` import.
- `app/globals.css`: added `.v1-scope` seam (marker only for now).
- `vercel.json`: enabled preview deploys for `redesign/v2`.

### Verification (dev server on :3939)
- 200: `/`, `/v1`, `/blog`, `/v1/blog`, `/v1/blog/features`, `/v1/blog/blog-welcome`, `/v1/blog/series/cs-journey`. 404: `/v1/nonexistent`.
- v1 HTML links all `/v1/*` (portfolio "Read Blog", project "Read Article", blog list/series/archive, breadcrumb, "← Portfolio" → `/v1`). **Zero** bare-`/blog` leaks in v1 HTML.
- Live `/` and `/blog` still emit bare `/blog` links — untouched. DB is reachable from this env (blog pages returned 200 with real slugs).

### Non-obvious notes
- **Pre-existing type errors** exist in the repo (14, e.g. `getPostVote` missing in store, `not-found.tsx` canvas nulls, `db-postgres.ts` type mismatches). `next.config.mjs` sets `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds`, so builds tolerate them. My new code adds none.
- **`.v1-scope` is a deferred seam:** today v1 and live share tokens, so it's a no-op. When Phase 3 changes `:root`/`.dark` tokens (colors, radius, and font if it changes in `app/layout.tsx`), the CURRENT values must be pinned under `.v1-scope` / `.dark .v1-scope` or v1 will drift. Note: `tailwind.config.ts` maps `primary`/`secondary` to hardcoded hexes (`#2F70FF`/`#FF6B4A`) while `--primary`/`--secondary` HSL vars are ~1° off — to scope those two colors, convert them to `hsl(var(--x)/<alpha-value>)` first (match hexes exactly to avoid a shift).
- **Vercel Preview env:** if `DATABASE_URL`/OAuth secrets are Production-scoped only, the branch preview's blog will hit its try/catch fallback. Portfolio `/v1` needs no DB. Confirm on the preview.

### Next
- Commit + push Phase 1 → verify Vercel preview (desktop + mobile).
- Phase 2: template analysis with Puppeteer → `DESIGN-SPEC.md` → **owner sign-off** before building.

## 2026-07-08 — Session 1 (cont.): preview deploy + Phase 2 methodology

### Vercel / production host finding
- Git push to `redesign/v2` did NOT auto-create a Vercel deployment; latest Vercel deploy is 29 days old. Combined with `amplify.yml` + "Analytics no-op on Amplify" comment, **production (nerosiegfried.com) likely runs on AWS Amplify**, with Vercel git auto-deploy dormant. RESOLVE the production-host question before the Phase 6 merge (does merging main deploy to Amplify? Is the plan to move to Vercel?).
- Vercel CLI is authed as `nerosiegfried`. Created a manual PREVIEW deploy (not prod): **https://portfolio-joxgbsagj-nerosiegfrieds-projects.vercel.app** (`/v1` = v1 portfolio). All routes 200, build OK.
- Preview is behind **Vercel Deployment Protection** (Vercel Authentication) → raw URL shows "Login – Vercel" to anyone not signed into the account. Owner can view in-browser. Offered to disable preview protection for a public link (awaiting owner).

### Phase 2 methodology (owner guidance: use CSS breakpoints, not fixed viewports)
- Framer templates inline ALL CSS (no external stylesheets), so real breakpoints are grep-able from the page HTML `@media` rules.
- Confirmed breakpoints — portfolie: 809/810, 1199/1200, 1439/1440 (4 tiers). reado-wbs: 809/810, 1199/1200 (3 tiers). Will extract each other template's own breakpoints before capturing.
- Plan: extract breakpoints → render + dump computed styles/screenshots at widths straddling each real breakpoint → write `DESIGN-SPEC.md`.

## 2026-07-08 — Session 1 (cont.): Phase 2 complete + SIGN-OFF

- Analyzed all 10 templates (primaries portfolie/reado deep; 7 secondaries + tokens). `DESIGN-SPEC.md` written; capture tool saved to `scripts/redesign-capture.mjs`; screenshots in scratchpad `screens/`.
- Made the Vercel preview PUBLIC (disabled `ssoProtection` via API). Confirmed production is **Vercel** (not Amplify) per owner; will do CLI preview deploys per milestone (git auto-deploy dormant).
- **Owner sign-off decisions** (see DESIGN-SPEC "SIGNED OFF" block):
  1. Mood: ONE theme system for both sections, **light + dark** modes, consistent (NOT split dark-portfolio/light-blog). Dark = portfolie look; light = warm editorial.
  2. Accent `#FB460D`.
  3. Type: Inter Tight display + Nanum Myeongjo serif (blog titles) + Geist Mono labels + sans body.
  4. Portfolio sections: core + stats + "What I do" + "Latest from blog" + FAQ; drop pricing/testimonials.
- Finalized token palettes (light+dark) recorded in spec.

### Phase 3 kickoff notes (important)
- Build NEW components under `components/v2/` (portfolio) + new blog components; DO NOT edit the existing section components (they are the frozen v1 library used by /v1).
- **Freeze v1 tokens NOW:** when changing `:root`/`.dark` in globals.css to the v2 palette, pin the CURRENT values under `.v1-scope` / `.dark .v1-scope`. Also convert tailwind `primary`/`secondary` (currently hardcoded hexes `#2F70FF`/`#FF6B4A`) to `hsl(var(--x)/<alpha-value>)` and set vars to match those hexes exactly, so `.v1-scope` can override them. Verify /v1 visually unchanged after.
- Preserve custom classes v1 uses (device frames, footer-pattern, theme-toggle, btn-show-*, animate-carousel).

## 2026-07-08 — Session 1 (cont.): Phase 3 — token foundation + v2 portfolio

### Token foundation + v1 freeze (verified)
- globals.css: v2 light (warm paper `40 24% 96%`) + dark (`0 0% 5%`) palettes, accent `--primary: 14 96% 52%` (#FB460D), radius 0.625rem. Frozen v1 tokens pinned under `.v1-scope` / `.dark .v1-scope` (incl. `--primary 221 100% 59%` = #2F70FF, `--secondary 11 100% 65%` = #FF6B4A, radius 0.5rem).
- tailwind: `primary`/`secondary` → `hsl(var(--x)/<alpha-value>)` (were hardcoded hexes) so `.v1-scope` can override; left other semantic tokens in their original `hsl(var(--x))` format so v1 opacity-modifier behavior is unchanged (pixel-identical). Added `fontFamily` (sans/display/serif/mono) + xl/2xl radii.
- Fonts: Inter (body, `--font-sans`), Inter Tight (`--font-display`), Nanum Myeongjo (`--font-serif`), Geist Mono (`--font-mono`) via next/font/google (self-hosted → CSP fine).
- **v1 body-bg leak fix:** `<body>` (shared) uses v2 tokens and is an ancestor of `.v1-scope`, so transparent v1 sections showed the v2 bg. Fix: `.v1-scope` wrapper now has `bg-background min-h-screen`, painting the frozen v1 bg. Verified: on /v1 `.v1-scope` computed bg = rgb(26,26,26), `--primary` = 221 100% 59%. Colors identical to pre-change Vercel baseline.

### v2 portfolio built (components/v2/*)
- `lib/portfolio-data.ts`: projects (copied from v1, untouched), technologies, stats, services, faqs.
- `components/v2/device-showcase.tsx`: WebPreview/PicturePreview + 4 device frames ported verbatim from v1 (token-independent; frame CSS shared in globals). Inline styles here are the allowed computed-geometry (ResizeObserver scale) case only.
- Sections: primitives (Eyebrow/SectionHead), mode-toggle (minimal v2), site-nav (scroll-aware), hero (clamp display 3→9.5rem), stats, about (statement + headshot), services (accent-bullet list, no boxes), projects (editorial list → accordion into device showcase, `.v2-accordion` data-open), tech-stack (`.v2-marquee`), latest-posts (server-fed 3 posts, serif titles), faq, contact (→ /api/contact), footer (+ "View previous site (v1)" link → /v1).
- `app/page.tsx`: async server component; fetches 3 latest published posts (try/catch → [] fallback); composes v2 sections; `revalidate=60`.
- `next.config`: added `cdn.jsdelivr.net` to image remotePatterns (some tech logos; also fixes latent v1 image issue).

### Verified (dev server :3941)
- `/` 200, no compile errors. Desktop dark+light + mobile 375 screenshots look editorial/on-spec (oversized tight Inter Tight hero, mono eyebrows, orange #FB460D accent, device showcase intact, warm-paper light / near-black dark). Latest-posts strip loads real posts (Computer Systems, Derivian, Stitch Bloom). `whileInView` cards appear gray in screenshots (caught pre-reveal) but load correctly.

### Convention going forward
- v2 components live in `components/v2/*`; existing top-level section components remain the FROZEN v1 library (do not edit their look). Shared: `components/ui/*`, `lib/blog/*`, device-frame + custom CSS in globals.

### Next
- Commit + push + CLI preview deploy → owner review of portfolio.
- Then Phase 4: blog redesign (reado-style, serif titles, preserve snippets/comments/series). Then Phase 5 QA/redirects, Phase 6 ship.

## 2026-07-09 — Session 1 (cont.): portfolio REDESIGN (first v2 was a reskin — rejected)

- Owner rejected the first v2 portfolio as a reskin (kept old structure, no interactions, over-pilled, kept accordion + CSS device frames). Ran a real-browser INTERACTION inspection (`scratchpad/inspect.mjs`): custom cursor (portfoliod: `cursor:none` + 16px `mix-blend-mode:difference` follower), hover text-slide (duplicated labels), broad `mix-blend-mode:difference`, squared radii (0–10px), numbered items. Findings recorded in DESIGN-SPEC "INTERACTION SPEC". Saved memory `redesign-not-reskin`.
- **Rebuilt** the portfolio ground-up:
  - New interaction primitives: `components/v2/cursor.tsx` (blend-difference dot, lerp-follow, grows over interactive, `data-cursor-label` support, pointer:fine only), `hover-slide.tsx` (CSS text-slide), `reveal.tsx` (`Reveal` fade/rise + `RevealLines` mask-reveal; both support `mount` for above-the-fold).
  - Globals: `.v2-cursor*`, `.v2-slide`, `.v2-media` (image zoom) CSS.
  - Rewrote hero (mask-reveal oversized name, role marquee, text-slide CTAs), projects (image-led numbered blocks using generated **spreads**, hover-zoom + "View" cursor label, NO accordion / NO device frames), site-nav (text-slide links), services (numbered), and squared everything (removed rounded-full/xl on nav toggle, contact, tech, latest, about).
  - **Project spreads**: `scripts/generate-spreads.mjs` (sharp) composes `public/projects/{11,10,9,1}-spread.png` (desktop + overlapped phone, squared, transparent) — replaces CSS device frames.
  - Deleted `components/v2/device-showcase.tsx` (no longer used).
  - Fixed above-the-fold reveal bug (hero name stayed clipped): `mount` triggers `animate` instead of `whileInView`.
- Verified on dev: `/` 200, hero renders with custom cursor + marquee, project spreads show (Derivian/Stitch Bloom), squared, dark+light.

## 2026-07-09 — Session (cont.): owner-feedback polish (cursor, Work, arrows, layout, build logs)

Owner review flagged several gaps vs. the referenced templates. Addressed:
- **Cursor (portfoliod):** ring 96→150px, border 2→3px, arrow 38→64px + strokeWidth 3. The project-media CTA now **trails the cursor** as text (`.v2-cursor-label`, set from `data-cursor-label` on the `[data-cursor]` link) — "Visit site" / "Read build log". Removed that CTA from the Work caption.
- **Work text animation:** replaced the single bottom slide-up caption (`.v2-work-cap`, removed) with **title top-left (slides in from left, `.v2-work-tl`)** + **description bottom-right (slides in from right, `.v2-work-br`)** + a hover scrim (`.v2-work-scrim`).
- **Rotating marker:** was re-mounted per active-change (so it never animated). Now a **single persistent** `.v2-thumb-marker` positioned by CSS vars (`--mk-y = active*76px` pitch, `--mk-rot = active*45deg`) with a transform transition, and the **active thumbnail pushes right** (`translate-x-3`); marker sits at `left:88px` so the pushed thumb never covers it.
- **Arrows:** new `components/v2/animated-arrow.tsx` (`AnimatedArrow`) replicating stitch-bloom `btn-split` diagonal slide (visible arrow exits top-right, duplicate enters bottom-left) via `.v2-arrow*` CSS keyed off `a:hover`/`button:hover`/`.group:hover`. Applied to Work (mobile), latest-posts, footer links.
- **Left-aligned sections:** FAQ → two-column (sticky heading left, list right); About → added a right meta column (Now/Based/Focus/Education) + widened the statement (max-w-4xl→5xl) so the right third isn't empty.
- **Footer wordmark truncation:** it sized off `13vw` (viewport). Wrapper is now a container (`.v2-wordmark { container-type: inline-size }`) and the block wordmark uses `text-[14cqw]` — sizes to the parent container width, so it no longer truncates.
- **Build logs (auto):** `lib/blog/hooks.ts` was dead + wrong-schema (camelCase cols, `draft`, non-admin author). Rewrote it schema-correct/idempotent, and added the real mechanism `scripts/seed-build-logs.mjs` (idempotent; `--dry-run`). Build logs = published posts in the `portfolio-projects` series, admin `monad`; the `[slug]` page already renders live/repo links via `projectByBlogSlug`. Added `blogPostSlug: "sunab-build-log"` to Sunab and **ran the seed** → created the published `sunab-build-log` post (owner approved the live-DB write). Re-runs are no-ops.
- Typechecked all changed files (no new errors). Not yet committed/pushed.
