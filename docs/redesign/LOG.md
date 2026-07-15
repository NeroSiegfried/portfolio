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
- Typechecked all changed files (no new errors). Committed (`d5f8343`) + pushed; CLI preview deploy: https://portfolio-ez2wpbtl7-nerosiegfrieds-projects.vercel.app

## 2026-07-09 — Session (cont.): Phase 4 kickoff — reado-style blog index

- Rebuilt the **/blog index** reado-style (new files; v1 blog under `/v1/blog` untouched — it's a separate route copy on the frozen components):
  - `components/v2/blog/blog-nav.tsx` (client): fixed scroll-aware bar mirroring the portfolio SiteNav frame — back-to-portfolio · "Writing" wordmark · InboxButton + v2 ModeToggle.
  - `components/v2/blog/blog-index.tsx` (**server** component; safe — only imports pure `Eyebrow`/`AnimatedArrow`/`Link`): masthead wordmark + intro → series/category bar (top-level series → `/blog/series/[slug]`) → **featured** latest post → **numbered** card grid (`No. NNN`, serif titles, series pills, `AnimatedArrow`) → **archive grouped by year**. Preserves series links + full chronological archive.
  - `app/blog/page.tsx`: swapped to Cursor + BlogNav + BlogIndex + v2 Footer inside the same `mx-3 border-x` frame as home; kept metadata, `revalidate=60`, DB try/catch fallback, `AdminEntryHotkey`.
- Fixed shared v2 Footer section anchors (`#work`/`#about`/`#contact`) → home-absolute Links (`/#work`…) so the footer is correct on both home and /blog (v2 footer only ever renders at base "").
- Silenced Tailwind ambiguity: dropped `ease-[cubic-bezier(...)]` from the thumbnail push-forward (default ease is fine; the marker keeps its cubic-bezier via `.v2-thumb-marker` CSS).
- Verified with a local `next build`: `/blog` prerenders static, `/v1/blog` unchanged, no errors/ambiguity warnings.
- **Still TODO in Phase 4:** post page (serif title + reading column, snippets inline, comments/votes/series nav), series pages, features page — all reado-styled while preserving data/auth.

## 2026-07-09 — Session (cont.): owner feedback round 2 (portfolio fixes + real Reado study + blog rebuild)

Owner rejected the first blog index as lazy (uniform text-box grid, invented orange pill, no images/animation, didn't reflect Reado). Re-captured Reado with Puppeteer (`scripts/redesign-capture.mjs` → screens/reado) and studied it: giant masthead wordmark, inverted black category bar, serif hero + featured card, **image-led cards with squared tags**, editor's choice, varied sections.

Portfolio fixes:
- **Nav alignment:** SiteNav + BlogNav insets `inset-x-4/sm:6/lg:8` → `inset-x-3 md:inset-x-4` so the floating bar aligns exactly with the `mx-3/md:mx-4` content frame.
- **Nav vertical centering:** `.v2-slide` `vertical-align: bottom` → `middle`; nav links/wordmark `inline-flex items-center`.
- **Equal spacings:** About (`px-5 py-16 md:px-8 md:py-24`) + tech-stack (`py-16/24`) → the standard `px-4 py-14 md:px-6 md:py-20`.
- **Footer wordmark:** replaced the `cqw` span (short + still truncating) with an **SVG `<text textLength=1000 lengthAdjust=spacingAndGlyphs>`** that fills the container width exactly (never truncates), much taller; cursive centred at ~half height. Fill via `fill-[hsl(var(--foreground)/0.07)]` (token has no `<alpha-value>`).
- **Script font:** Dancing Script → **Great Vibes** (elegant signature) in `app/layout.tsx`.
- **Projects cursor arrow:** ring border `3→6px`; arrow svg `64→98px` (~65% of the 150px ring); tight `0 0 18 18` viewBox so the glyph fills the box; sharp edges (`stroke-linecap: square`, `stroke-linejoin: miter`); `strokeWidth 1` ≈ 6px render = ring border width.

Blog index REBUILD (`components/v2/blog/blog-index.tsx` + new `post-cover.tsx`), verified via local `next start` + Puppeteer screenshots:
- Giant **WRITING** masthead (SVG fill-width) → **inverted category bar** (`bg-foreground text-background`, series + diamond markers) → **editorial hero** (serif tagline + series tags | featured image-led card) → **image-led card grid** → archive by year.
- **PostCover**: on-brand typographic cover (oversized faint **per-post monogram** from title initials — ST/DS/SB/CS… — + accent tick + hover scale), since posts have no photos (Reado mixes photographic + typographic covers).
- **Squared tags** (Reado) replace the invented rounded orange pill; serif titles; `AnimatedArrow` read links.

## 2026-07-09 — Session (cont.): feedback round 3 (cover images, article page, blog interactions)

- **Cursor arrow:** 20% smaller (svg 98→78px) + ~1.8× thicker strokes (`strokeWidth 1→2.3`); ring border matched to 10px.
- **Cover images (settable, end-to-end):** added nullable `cover_image` column to `posts` (idempotent migration); `BlogPost.coverImage` in types; `rowToPost` + the 3 summary SELECTs + `updateDb` upsert; `/api/admin/posts` accepts it; admin editor has a **Cover image** field (URL + S3 upload reusing the existing presign flow + preview/clear). Used as the card image AND the article header image (falls back to the monogram cover when unset).
- **Article page (`app/blog/[slug]/page.tsx`) rebuilt Reado-style:** Cursor + BlogNav + v2 Footer in the framed column; mono breadcrumb; accent eyebrow + date; big **serif title**; excerpt; upvote + Live-site/Repository in a **box**; optional wide cover image; `max-w-3xl` reading column. Preserved: `BlogMarkdown` (snippets), `PostVoteButton`, `LazyComments`, `SeriesPostNav`, `customCss` (`scopePostCss`), JSON-LD, `projectByBlogSlug` links.
- **Index interactions:** cards are now **tasteful bordered boxes** with cover image (or monogram fallback); on hover the cover **greys + veils** and the title gets a **highlighter sweep** (`.v2-card-cover`/`.v2-hl`). New client `BlogFeed`: **search** (filters title/excerpt/series), **6 posts initially** (featured + 5) with **Show more (+3)** and **Show all (N)** buttons. New client `Wordmark`: WRITING with an interactive **dotted (halftone) accent shadow** that trails the cursor.
- New: `components/v2/blog/{helpers.ts, post-card.tsx, blog-feed.tsx, wordmark.tsx}`. Verified via local `next start` + Puppeteer (wordmark shadow, boxes, grey/highlight hover, pagination, article page). `/v1/blog` untouched.

## 2026-07-09 — Session (cont.): feedback round 4 (article 2-col, prev/next, navbar search, subscribe, page transition, reveals)

Owner rejected the article page as still single-column ("no point wasting all that real estate") and wanted Reado's layout reproduced: **main content left + a small right rail for navigating other posts**, **prev/next post buttons at the top and bottom**, **search in the navbar**, a **Subscribe section** (replacing the blog-home search) + a **Subscribe button in the navbar** (where portfolio's Contact CTA sits), **page transitions + section reveals site-wide** (templates aren't static), and careful responsiveness. No old pill components.

- **Article page (`app/blog/[slug]/page.tsx`) → 2-column.** Breadcrumb + **top `PostPager`** → full-width header (series label/date, serif title, excerpt, squared upvote, Live/Repo box) → optional full-bleed cover → body `grid lg:grid-cols-[minmax(0,1fr)_18rem]`: `max-w-3xl` reading column (left) + **sticky `PostSidebar`** (right) → **bottom `PostPager`** → comments → footer. Collapses to a single column below `lg` (sidebar flows under the article; pagers stack).
- **New `PostPager`** (server): squared prev/next post links, `size="sm"` (slim, top) / `"lg"` (bottom). Reading order = series progression when in a multi-post series, else global chronological (oldest→newest).
- **New `PostSidebar`** (server): sticky right rail — **"In this series"** ordered list (current highlighted with a primary left-border, formatted entry numbers, a follow toggle) when in a series, then **"More reading"** (recent posts outside this series) + "All articles →". `readBlogPostDb` already returns all published summaries, so cross-series recents are available.
- **New `SeriesFollowButton`** (client): follow/unfollow extracted from the v1 `SeriesPostNav`, squared. `SeriesPostNav` is no longer used on the v2 article (its role is split across the pager + sidebar).
- **`PostVoteButton` redesigned:** removed the `rounded-full` pill → squared mono button with an inline score divider; hover raises the thumb.
- **Comments header** (`blog-comments.tsx`): v1 bold `<h2>` → v2 eyebrow + serif "Join the conversation" (interactive internals untouched — 1263-line component, out of scope to rewrite).
- **Navbar search + Subscribe** (`blog-nav.tsx`): search toggles an inline bar → `/blog?q=…` (feed reads it via `useSearchParams`, Suspense-wrapped); **Subscribe** CTA (bg-primary) added where portfolio's Contact sits.
- **Subscribe section** (`subscribe.tsx`): replaces the blog-home hero search (tasteful bordered box → `/api/contact`, `id="subscribe"`).
- **Page transition** (`app/template.tsx` + `.v2-page-wipe`): accent wipe covers then retracts on navigation; skips `/v1*` + `/control*`. Kept as a **separate fixed layer** (not a page-wide transform) so `fixed`/`sticky` nav + cursor don't break.
- **Dotted-shadow wordmark refined:** finer/denser halftone (tile 3.6px, dot r 0.8) + subtle parallax (±3.5px on a 6/7px base), matching Reado's ~±3px shadow.
- **Section reveals** (`Reveal`): wrapped the non-sticky portfolio sections (Stats/About/Services/TechStack/LatestPosts/Contact) + the FAQ answer column at page level; **Projects and the FAQ heading keep their `md:sticky` children uncovered** (a transformed ancestor would break sticky). Blog feed cards already reveal.
- Verified via local `next start` + Puppeteer: article 2-col (series + standalone), mobile stacking, blog-home dotted wordmark + subscribe, portfolio reveals firing under real scroll (the `fullPage` capture shows them blank — a `whileInView`+`once` artifact, fine on real scroll). Build green.

## 2026-07-10 — Session (cont.): admin rebuild + hero slideshow + isometric project mockups

- **Admin (`/control`) rebuilt to v2 + moderation.** Login form reskinned (framed box, "Control / Access", squared inputs, mono button). Dashboard: shadcn tabs → a v2 **sidebar** (Posts/Series/Snippets/Comments/Users) with per-section counts; every control squared (mono labels, primary accents, shared `input`/`btn`/`btnPrimary`/`btnDanger` classes); notebook editor/cover-upload/preview preserved. New **Comments** panel (filter all/visible/hidden + search, hide/unhide via DELETE/PATCH, hard delete via `?hard=1`) and **Users** panel (search, block/unblock via `/api/blog/admin/users/[id]/block`, role/blocked badges). Dashboard page resolves author/post per comment and strips `passwordHash` before passing users to the client. Styled but no cursor/transitions (owner choice).
- **Hero slideshow.** Owner-supplied JPGs → `public/hero/hero-1.jpg` + `hero-2.jpg`. New client `HeroBackdrop` cross-fades the `HERO_IMAGES` list every 5s (reduced-motion holds on the first). Adding a path to the array in `hero.tsx` extends the rotation — no other change.
- **Isometric project mockups.** New `IsometricMockup` + `.v2-iso*` CSS: the per-project viewport screenshots already in `/public/projects` (`{id}-macbook/ipad/iphone/studio`) sit on a shared axonometric plane (`rotateX(15deg) rotateZ(-24deg)`) over an **isometric line grid** (±30° repeating-gradients, edge-masked), oversized + offset so they **spill past the frame** (clipped by `.v2-work-item`). Wired into `components/v2/projects.tsx` via an `ISO_SHOTS` map (featured ids 11/12/10/9); projects without an entry fall back to the flat spread. Replaces the "basic" per-project spread image with a live isometric spread. Mobile flattens the tilt slightly.
- Verified via clean `next start` + Puppeteer (hero slide, iso desktop + mobile, admin login). NB: a stale `.next`/port-3939 collision produced unstyled captures mid-session — fixed by `rm -rf .next` + freeing the port; not a code issue.

## 2026-07-10 — Session (cont.): buttery transitions + aggressive caching (owner feedback)

Owner feedback: (1) prev/next post arrows don't animate like the rest of the site; (2) loading templates look like the old site; (3) aggressively prefetch + cache the DB-backed pages (data rarely changes and is easily invalidated); (4) every page change should transition, not just home + blog-home; (5) the transition itself was wrong — it snapped over the content then slid a same-colour screen down. Wanted: a screen that covers the old page top→bottom, *then* the new content appears.

- **Pager arrows → site animation.** `AnimatedArrow` gained a `right` direction (+ `.v2-arrow--right` CSS mirroring `--left`). `PostPager` now uses `AnimatedArrow direction="left"/"right"` (the stitch-bloom split-bloom) instead of plain lucide arrows + translate. Verified: post pages emit `v2-arrow--left/--right`; newest post (`sunab-build-log`) correctly shows only "Previous".
- **v2 loading skeletons.** New `components/v2/blog/blog-skeleton.tsx` (`BlogNavSkeleton`, `BlogIndexSkeleton`, `BlogPostSkeleton`) — framed `mx-4 border-x` column, **squared** blocks (no rounded pills/`container`), a static nav shell matching `BlogNav`, mirroring the real reado index + 2-col article. `app/blog/loading.tsx` + `app/blog/[slug]/loading.tsx` now just render these. (v1 loading skeletons under `/v1/blog` left untouched — frozen.) No inline static styles (dropped the old inline `animationDelay` stagger).
- **Aggressive cache + prefetch.** `unstable_cache` TTL 60s → **3600s**; page `revalidate` 60 → **3600** on `/`, `/blog`, `/blog/[slug]`, `/blog/series`, `/blog/features`. Added **`generateStaticParams`** to `/blog/[slug]` (all published slugs) and `/blog/series/[...slug]` (root→leaf slug paths via `getSeriesPath`), both try/catch → `[]` on DB-unreachable builds. Dropped `force-dynamic` on `/blog/features`. Content edits stay instant: every write goes through `updateDb` → `revalidateTag("blog-data")`, which busts the four tagged caches *and* the ISR route caches that read them. Only vote counts are eventually-consistent (≤1h; the button is optimistic). Build confirms: `/blog`+`/blog/features` `○ Static`, `/blog/[slug]` `● SSG` (17 posts), `/blog/series/[...slug]` `● SSG` (14) — all now edge-cached + fully prefetchable, so nav is instant and `loading.tsx` rarely shows.
- **Page transition rebuilt (cover→reveal).** Removed the old `app/template.tsx` invisible bg-coloured wipe. New persistent `components/v2/page-transition.tsx` mounted once in `app/layout.tsx`: a global capture-phase click interceptor on internal `<a>` (skips modified/new-tab/download/external/hash-same-page and `/v1`+`/control`). On an eligible click it drops a **solid accent screen** (`.v2-curtain`, `hsl(var(--primary))`, z-200 — above nav, below cursor) DOWN to cover the old page top→bottom (`y: -100%→0`), `router.push`es underneath it (so the new route — and any skeleton — loads hidden), then once the curtain is fully down *and* the route commits (or a 1.4s safety fallback), it continues DOWN and off (`y: 0→100%`) revealing the new content top→bottom; resets to `-100%` instantly while off-screen. Content is never wrapped in a transform, so fixed nav / sticky sidebar / custom cursor keep working. `usePathname`/`useRouter` (not `useSearchParams`) → no dynamic deopt (build kept everything static). Reduced-motion skips the whole thing (curtain `display:none` + interceptor bails). Verified via Puppeteer: curtainY swept `-100 → 0 → +100`, route changed, mid-cover screenshot = full accent screen.
- Green `next build`; `tsc` clean on all changed files.

## 2026-07-10 — Session (cont.): what-I-do images, scroll-colour text, isometric masonry, comment/upload fixes

Owner feedback: (1) "What I do" too plain — give each row a wide image (portfoliod); (2) old-post comment images broken (broken-icon + alt); (3) want scroll-driven body-text colour fill/unfill (portfoliod); (4) Work overlay text should slide in from FULLY outside the frame; (5) rebuild the project showcase as a real **masonry** (not the overlapping device nod), tiles flush to the isometric grid, grid spacing = margins, tile w/h = integer multiples of spacing, mixed rows/cols per viewport, screenshots of **different pages + viewports** (mobile/tablet/desktop/extra-wide), home centred spreading outward, **static tiles / whole compilation scales on scroll**, reusable as article heroes. Plus: upload 500 + a `vercel.live` CSP error.

- **"What I do" (portfoliod rows).** `components/v2/services.tsx` rewritten: numbered rows (title top-left, description bottom-left, **wide image right**, hairline dividers) + a scroll-filled intro. `Service` gained `image?`/`imageAlt`; with no image it renders `.v2-service-ph` (accent-tinted iso-grid + big faint number + "◆ Reference image") so the layout reads finished and is swap-ready. Image briefs live in `imageAlt`.
- **Scroll-colour text** (`components/v2/scroll-color-text.tsx`): per-word opacity 0.18→1 driven by live `useScroll` progress (fills on the way in, unfills on the way out). Applied to the About statement + the Services intro. Reduced-motion → solid.
- **Work overlay slide-in.** `.v2-work-tl`/`.v2-work-br` now translate `calc(-100%/+100% ∓ inset)` — the title/description start entirely off-frame (clipped by `.v2-work-item` overflow) and slide fully in on hover.
- **Broken comment images.** Diagnosed via DB + S3: 3 old comments reference **temporary `uploads/comments/` objects that the bucket lifecycle rule already deleted** (they predate the permanentize-on-create step) — `HeadObject` = NotFound → unrecoverable. Fix = graceful degradation: new `CommentImage` in `blog-comments.tsx` swaps a failed image for a muted "Image no longer available" chip (via `onError`) instead of the broken-icon + alt.
- **Isometric masonry** (replaces the `IsometricMockup`/device-overlap showcase):
  - `scripts/capture-project-shots.mjs` — Puppeteer-captures each featured project's live site: home at 4 viewports (mobile/tablet/desktop/**extra-wide 2560**), up to 3 discovered subpages ×3 viewports, and — for single-page sites (Stitch Bloom, whose "pages" are dropdown anchors) — home **scroll sections** so tiles stay varied. Fresh load per shot at scrollTop 0 → fixes the "navbar stranded mid-page" wonkiness. → `public/projects/shots/{id}/` (resized to ≤1800px, ~6MB total; also usable as article heroes).
  - `scripts/build-masonry-layout.mjs` — packs shots onto an integer cell-grid: tile span per viewport (mobile 3×6, tablet 4×5, desktop 6×4, wide 9×4 = mixed rows/cols), ≥1-cell gaps, nearest-to-centre greedy (home biggest+first → centre, deeper pages outward). → `lib/masonry-layout.json`.
  - `components/v2/masonry-mockup.tsx` + `.v2-mason*` CSS — renders that layout as a LIVE CSS grid (theme-aware grid lines every cell → tiles flush) on an axonometric plane (`rotateX(51)/rotateZ(-43)`) that scales as ONE unit on scroll (`useScroll`→scale); tiles stay static. `projects.tsx` uses `MasonryMockup`/`hasMasonry(id)`; deleted `isometric-mockup.tsx` + `ISO_SHOTS`.
- **CSP**: added `https://vercel.live` (+ pusher) to script/style/font/connect/frame-src so the preview feedback widget stops throwing CSP errors.
- **Upload 500 (reported, infra):** `/api/upload` presign fails on the Vercel **Preview** deployment because it has no AWS credentials — local (with `.env.local` AWS keys) signs fine. Fix is env-side: add the S3 creds (OIDC `AWS_ROLE_ARN`, or `S3_UPLOADER_*`/`AWS_*`) to the Preview environment, not just Production.
- Verified on dev via Puppeteer (masonry renders flush + mixed viewports; what-I-do rows; about scroll-text). Green `next build`; `tsc` clean.
- **Heads-up (not touched):** owner renamed `public/hero/hero-1.jpg` → `hero-1.not_used.jpg`, but `hero.tsx` `HERO_IMAGES` still lists `/hero/hero-1.jpg` (now missing). Left as-is pending owner intent (drop it vs. supply a new hero-1).

## 2026-07-10 — Session (cont.): responsive fixes, viper marquee, masonry rework, transition timing

Owner feedback round: About responsiveness (subtext shrank to a thin line before collapsing); tech stack "too many boxes" → want a full-width marquee strip (ref viper-template); footer overlap → collapse ~870px; drop hero image #1; masonry too wide/disjointed/top-heavy-empty + per-tile scaling instead of whole-image; blog cards should get the project ring-cursor but say "Read post"; transition slow to start + new page flashes before it; put the image briefs in an easy-to-find md.

- **Hero:** `HERO_IMAGES` → just `/hero/hero-2.jpg` (drops the renamed hero-1, resolving the dangling ref too).
- **Service image briefs:** new root **`SERVICE_IMAGES.md`** (table of the 4 briefs + how to swap in real images).
- **About responsiveness:** the 3-col grid (image | text | meta) now only forms at **`min-[1100px]`** (was `md`/768) — below that it's a single readable column, so the middle text never squeezes to a thin line. Image sizes/`dl` borders moved to the same breakpoint.
- **Footer:** columns hold at 2-up until **`min-[880px]`** (were `md`/768→4-up) and the bottom bar goes row at 880 — no more crowding/overlap ~768–870px.
- **Tech stack → viper marquee:** dropped the per-item bordered boxes; now one full-width strip (`border-y` frame) of **adjacent cells split by `border-r` dividers** (taller, `h-28`/`md:h-36`), scrolling inside the edge-fading mask. Same JS auto-scroll/drag.
- **Blog cards → "Read post" cursor:** `PostCard` link got `data-cursor` + `data-cursor-label="Read post"`, so hovering any blog card shows the same portfoliod ring cursor as the Work media (covers the grid + featured card).
- **Transition timing fixed:** (1) it never actually covered before navigating because `onAnimationComplete`'s variant-name arg wasn't matching `"cover"` — now keyed off `phase` state; (2) the push moved OUT of the click handler INTO cover-complete, so the curtain fully covers the OLD page *then* navigates (new page loads hidden under it) — no more new-page flash; (3) expo-out easing → snappy start. Verified via Puppeteer: covered ≈180ms, URL changes ≈870ms (only after cover), reveal ≈930ms.
- **Masonry rework (proper tight masonry):**
  - Packer: replaced the centred greedy (which left 2-cell gaps + empty top) with a **skyline bottom-left bin-pack** into a ~square target width — uniform **1-cell gaps everywhere**, dense top-down fill (no empty top), tall-first ordering to minimise holes.
  - Grid is much **finer** (`SPAN` ~doubled: mobile 5×10, tablet 7×9, desktop 11×7, wide 16×7; `--cell` 40→**19px**) so images couple tightly (a 1-cell gap is a thin margin).
  - **Whole-image scaling, not per-tile:** the `.v2-work-item img` hover-zoom was hitting the masonry tiles — scoped it to `.v2-work-item > img` (cover only) + `.v2-mason__tile img { transform:none }`. The scroll-scale stays on the plane wrapper (0.9→1.16 × base 1.34) so the *whole compiled grid* zooms as one.
  - Regenerate: `node scripts/build-masonry-layout.mjs` (reuses existing shots; bump `MAX_SUBPAGES` in the capture script for even more tiles). Verified render: tiles tightly packed, flush to fine grid, fills the frame, mixed viewports.
- Green `next build`; `tsc` clean.

## 2026-07-10 — Session (cont.): masonry coverage/centering, capture crawl (no open menus/footers)

Owner feedback: masonry was bottom-heavy (top corners empty, tiles buried), zoom over-exaggerated; capture crawl was leaving nav/cart/search overlays OPEN in shots + shooting footers.

- **Masonry centring (root-cause fix).** `.v2-mason` used `display:grid; place-items:center`, but a grid child taller than the frame grows the implicit row to its own height → "centre" had nothing to centre against, so the plane pinned to the top and overflowed only DOWNWARD (measured gTop:0 / gBot:+977). Switched `.v2-mason__grid` to **absolute centring** (`position:absolute; top/left:50%; transform: translate(-50%,-50%) var(--iso) scale()`), giving symmetric overflow → top corners covered, tiles no longer buried.
- **Coverage math, not guessing.** Solved the min scale to contain all 4 frame corners for an orthographic `rotateX(φ)·rotateZ(θ)` plane (u,v = inverse transform of the corner; scale = max(2|u|/W, 2|v|/H)). Confirmed corner gaps are a parallelogram-shape problem, not size — a huge bbox still leaves triangular corners. Landed on **rotateX(36) rotateZ(-20), rest scale 1.20** (desktop), covering corner-to-corner at low zoom.
- **Zoom ratio matched to the site.** Dropped the 2.35→1.35 hover *shrink*; masonry now rests at the covering floor and **hover leans in +8%** (`--scale` 1.20 → `--scale-hover` 1.29), mirroring `.v2-work-item > img` (rest 1.09→hover 1.0, ≤10%).
- **Per-project shape normalisation.** `masonry-mockup.tsx` computes `--mason-cols = √(area/K)` (K=1.15) inline; CSS derives `--cell = mason-w / cols`. So every project's plane has ~constant footprint/aspect regardless of tile count (29–46) → one scale/rotation covers all. Mobile: squarer 4:3 frame → flatter tilt + more scale in the `max-width:767` block.
- **Packing = dense auto-placement (css-tricks ref).** Kept `grid-auto-flow: dense` with **big-shots-first order** (wide→desktop→tablet→mobile) so big tiles anchor and the many small tiles backfill every hole. (Tried round-robin interleave for "mobile more central" — it exhausted small tiles early and left holes → reverted; dense backfill already scatters small tiles into holes.)
- **Capture crawl — direct navigation, no interaction during shots.** `reveal()` now takes `openMenus` (true only for link DISCOVERY); the capture pass navigates DIRECTLY to discovered routes and never clicks menus/carts. Added `closeOverlays()` (Escape + close-buttons + blur, skips real links) as a safety before every shot; `sectionOffsets()` skips the final ~screen so **footers aren't captured**; nav switched `networkidle2`→`domcontentloaded`+`waitForNetworkIdle` fallback (sites with chat/analytics sockets never idle → the first re-crawl only got the homepage). Re-captured all 4 (id9 34 / id10 44 / id11 46 / id12 29 shots, 6–14 real pages each); full-tile contact-sheet audit = every menu/cart/search CLOSED, no footers.
- **Stale image cache.** The "menus still open" the owner saw were **stale `.next/cache/images`** entries predating the re-capture (reused filenames = same optimiser URL). Cleared `.next/cache/images`.
- Green `next build` (✓ Compiled successfully; blog SSG DB-timeout warnings are local-only, no RDS access). NOT pushed — awaiting owner go-ahead.

## 2026-07-11 — Session: service images (procedural), v1 hero dots fix

- **"What I do" service images (procedural, on-brand).** No text-to-image API in
  this env, so `scripts/generate-service-images.mjs` code-generates the 4 images
  to match the hero: HTML5 Canvas (headless Chrome) → dark warm-charcoal base +
  contained burnt-orange (#FB460D) glow "light source" + soft shadow mass + faint
  per-service motif (UI window / JSON+schema / circuit+live-node / code+AI-beam) +
  **reeded-glass** treatment (vertical striations, lens warp, vertical smear, rib
  sheen) + grain + vignette → `sharp` (resize 2000×1250, brightness/contrast lift,
  JPEG). Wired `image:` on all four `services` in `lib/portfolio-data.ts`. Rebalanced
  tones so they read on BOTH light (warm paper) and dark (near-black) themes —
  verified in-situ. `SERVICE_IMAGES.md` documents regen + swap-in. (Owner is now
  considering swapping these for vectors — see chat.) NB: clear `.next/cache/images`
  after regenerating a same-named file or the dev server serves the stale optimised copy.
- **v1 hero floating dots — regression fixed.** The 100-particle canvas in
  `components/hero.tsx` (blue #2F70FF dots) was still drawing (confirmed 350 blue
  px on the canvas) but invisible: it's `absolute -z-10`, and the `/v1` layout's
  `<div class="v1-scope bg-background">` (added in the Phase-1 backup) is opaque —
  the hero `<section>` was `relative` with z-index auto (NO stacking context), so
  `-z-10` escaped behind that background. Fix = add `isolate` to the hero section
  → the canvas is scoped inside the hero (above the v1 bg, below the z-10 content).
  Dots restored (verified /v1 light + dark). One-line, no particle-logic change.

## 2026-07-15 — Performance, image delivery, and code-quality pass

- **Measured production first.** Desktop Lighthouse on `www.nerosiegfried.com`
  reported 74 performance / 3.5s LCP / 0ms TBT / 0 CLS. The home page was also
  eagerly loading Cloudflare Turnstile (about 430KB across two third-party
  requests) despite the form living at the bottom of the page.
- **Route intent prefetch.** `PageTransition` now prefetches eligible internal
  routes on pointer and keyboard focus intent. This also covers the project
  showcase's native anchors, which the standard Next `Link` viewport prefetch
  could not cover. The existing cover→reveal sequence remains unchanged.
- **Below-fold work is actually deferred.** `Turnstile` begins loading 500px
  before its form enters the viewport; `MasonryMockup` mounts its many image
  elements 600px before a work card appears. A Puppeteer production-build check
  confirmed zero Turnstile requests on initial load and the widget loading when
  the contact section is reached.
- **Image density / thumbnails.** On a 3,840px-wide 4K viewport, the hero needs
  up to 7,680 source pixels for a 2× panel but its real source is 5,000px; the
  Next image configuration now permits that full 5,000px source rather than
  capping it at 3,840px. The three-column blog grid gets a 2,560px candidate
  (close to its 2× 4K need). The post pager already uses Next's cached 48px
  `Image` derivative, which produces 96px (2×) thumbnails without duplicating
  every remotely managed cover; its thumbnail quality is now tuned to 60.
  Masonry tiles use 256px / quality-65 derivatives, sufficient for their
  roughly 114px maximum displayed size after transform.
- **Cache/query simplification.** The identical blog-home and series database
  snapshots now share one tagged `unstable_cache` entry. Published-post summaries
  build series paths and vote totals with maps in linear passes; descendant-series
  lookup now uses a children map instead of repeatedly filtering the whole list.
- **Verification.** `next build` is green: `/`, `/blog`, `/blog/features` static;
  posts and series SSG with 1-hour ISR. `tsc --noEmit` still reports the known,
  unrelated errors in the admin/not-found/reference DB files; edited files report
  none. `git diff --check` passes.
