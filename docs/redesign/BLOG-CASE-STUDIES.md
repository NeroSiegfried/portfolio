# Blog rewrite plan — image-led case studies + the B-tree snippet suite

Proposal only. Nothing in here has been applied to the live blog or to
`scripts/build-logs/`. The only code changes made alongside this document were the
two ordering fixes you asked for.

---

## 1. What is wrong with the posts as they stand

The five build logs total about 1,200 lines and contain **zero images**. They are
organised the way the codebase is organised — one heading per subsystem — so they
read as changelogs. A case study is organised the way the job happened.

Concretely, every post has the same failure shape:

| Symptom | Where it shows | Effect on the reader |
| --- | --- | --- |
| No visual anchor | All five posts | You never see the thing being described |
| Uniform paragraph weight | e.g. `stitch-bloom.md` lines 18–31, fourteen consecutive equal-length paragraphs | Nothing signals which decision mattered |
| Subsystem headings | "One catalogue for the whole site", "The bag and the email handoff" | The client, the constraint and the outcome disappear |
| Snippets as proof | `{{snippet:…}}` always lands mid-explanation | The snippet argues a mechanism instead of carrying a beat |
| Confession sections | "One part of the current implementation needs a follow-up" | Reads as a bug list, not a project |

Pengana is the exception and you already said so. It has a fact table at the top,
a real decision as its first section ("One website or several"), five snippets
spread across the piece, and a named failure with a cause. It is still short on
photography, but its skeleton is close to right.

**The fix is structural, not tonal.** Reordering the same sentences will not help.
Each post needs a fixed spine where images carry the argument and the prose runs
in short bursts between them.

---

## 2. The spine

Nine beats. Every project post uses the same nine, in the same order. Length target
is 900–1,400 words of prose; the images do the rest of the work.

```
1  COVER          full-bleed hero shot of the finished site
2  LEDE           3 sentences: who, what they asked for, the one constraint
3  FACTS          the existing table block — client / brief / stack / live
4  THE ASK        what the client actually brought, in their terms
   ├─ IMAGE       the source material (Figma frame, chosen template, business plan)
5  THE DECISION   the one call that shaped everything else
   ├─ IMAGE       before/after, or reference-vs-built, side by side
6  THE BUILD      two or three sections max, each ending in a visual
   ├─ SNIPPET     the single interaction worth touching
7  RESPONSIVE     the spread; how the composition changes, not "it is responsive"
8  WHAT BROKE     one real failure, its cause, its fix. No inventory of TODOs.
9  CLOSE          what shipped, what the client got, links
```

Rules that make it work:

- **No two prose sections in a row.** If two consecutive `##` blocks have no
  figure between them, one of them is not earning its place.
- **Snippets are beats, not evidence.** One per post for the client sites, placed
  at the emotional high point (the navbar, the carousel, the scheme cycle). Pengana
  is allowed its five because the whole post is about a design system.
- **The failure section is one failure.** The rest of the current "what remains"
  lists belong in the repo, not the post.

### Figure vocabulary

Add this once to each post's `.css` (the renderer already runs `rehypeRaw`, so raw
`<figure>` works in the markdown body):

```css
/* --- shared figure vocabulary ------------------------------------- */
.post-body figure { margin: 3.5rem 0; }
.post-body figure img { display: block; width: 100%; height: auto; }
.post-body figcaption {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--muted, #6b7280);
}

/* full-bleed: breaks the prose column */
.post-body .bleed {
  width: 100vw;
  margin-left: 50%;
  transform: translateX(-50%);
}
.post-body .bleed figcaption { max-width: 42rem; margin-inline: auto; padding-inline: 1rem; }

/* contained plate with a hairline */
.post-body .plate img { border: 1px solid var(--line, rgba(0,0,0,.14)); }

/* two images, equal weight — before/after, reference/built */
.post-body .duo { display: grid; gap: 1rem; grid-template-columns: 1fr 1fr; }
@media (max-width: 640px) { .post-body .duo { grid-template-columns: 1fr; } }

/* a scroll sequence: 3–4 narrow frames in a row */
.post-body .strip { display: grid; gap: 0.75rem; grid-auto-flow: column; grid-auto-columns: 1fr; }
@media (max-width: 720px) { .post-body .strip { grid-auto-flow: row; } }

/* phone-width image kept narrow inside the column */
.post-body .device { max-width: 300px; margin-inline: auto; }
```

Markup pattern:

```html
<figure class="bleed">
  <img src="/projects/shots/13/home-wide.jpg" alt="Pengana Concept home page at 2560px" />
  <figcaption>The group home page. Three businesses, one editorial system.</figcaption>
</figure>
```

### Style guard for the copy

Carry these into every rewrite:

- No em dashes as a rhetorical device. A comma, a full stop or a colon usually works.
- Use semicolons and colons where the sentence earns them; the current posts avoid
  both, which is part of why they read flat.
- Banned constructions: "not just X, it is Y"; "X wasn't Y, it was Z"; "isn't merely";
  any sentence whose job is to upgrade a mundane fact.
- Ordinary technical vocabulary. "I moved the catalogue into a JSON file" beats
  "I externalised the catalogue into a declarative data layer".
- Say what a thing cost or what it broke. Specifics are the whole credibility budget.
- First person, past tense, no hedging about whether a decision was correct.

---

## 3. Image inventory

You already have far more material than the posts use. Real captures live in
`public/projects/shots/<id>/`, four viewports each (`mobile` 390, `tablet` 834,
`desktop` 1440, `wide` 2560), with `-s1`…`-s4` suffixes for scroll positions.

| Project | id | Usable frames | Notable |
| --- | --- | --- | --- |
| LoopBridge | 9 | 35 | `academy-desktop`, `exchange-mobile`, `community-tablet`, four article views |
| Stitch Bloom | 10 | 45 | ten `shop-*` product pages, real product photography |
| Derivian | 11 | 47 | nine `blog-*` article captures, `services-mobile` |
| Sunab | 12 | 30 | `network-tablet`, `legal-desktop`; thinnest set |
| Pengana | 13 | 45 | `properties-*`, `tishino-*`, `sunab-wide` — one per route tone |

Plus `<id>-spread.jpg` (the composed responsiveness spread) for every web project.

**What you still need to make.** These are the shots that do not exist and that the
case studies actually depend on:

1. **Source material photographs.** A frame of the LoopBridge Figma file; the
   Moss & Stone template page beside the Stitch Bloom build; a page of the Derivian
   business plan; the Amazon Leo capture set from `.leo-research`; a contact sheet of
   the twelve Framer references for Pengana. These carry beat 4 in every post.
2. **Before/after pairs.** The Sunab post is built around a rejected first direction
   and you have no picture of it. Check out the pre-Leo commit, run
   `scripts/capture-project-shots.mjs` against a local build, and put the two home
   pages side by side. Same for the Derivian domiciliary-care wording pass.
3. **Two or three process shots per project.** `IMAGES.md` open beside the site,
   the Sharp pipeline output, a Relume sitemap. Screenshots of your own working
   files are more interesting than another render of the finished page.
4. **Sunab scroll frames.** Only 30 captures exist and the post needs the
   alternating full-bleed / contained rhythm shown as a strip. Re-run the capture
   with `-s1`…`-s4` on `home` and `services`.

---

## 4. Per-project rewrite plans

Each plan below is the skeleton plus the copy direction, not finished prose. Image
slots name real files where they exist and describe the shot where they do not.

---

### 4.1 LoopBridge — now project 9, first of the client sites

**Title** `LoopBridge: a Figma file that turned into a platform`
**Excerpt** `The client had designs for a public site. What they needed was accounts, dashboards, payments and a video pipeline underneath it.`

The current post is 292 lines with eighteen headings. It is the worst offender and
also has the best story, because the scope changed underneath the build.

| Beat | Content | Media |
| --- | --- | --- |
| 1 · Cover | — | `bleed` · `/projects/shots/9/home-wide.jpg` |
| 2 · Lede | Crypto learning community. Client supplied a complete Figma file for the public site. Everything behind the public site had to be designed from scratch, and it kept growing. | — |
| 3 · Facts | Keep the existing table. Add "Status: ongoing". | — |
| 4 · The ask | What the Figma file settled (home, Academy, Community, Exchange, Blog, FAQs, About, Glossary, Courses, article views, tracks, legal, mobile menu) and what it did not: auth model, course progress, editors, moderation, checkout, video. **This contrast is the whole post.** Two paragraphs. | `duo` · **NEW**: a Figma frame beside the shipped page at the same width. This is the single most valuable image in the set. |
| 5 · The decision | Building the public pages in plain HTML/CSS/JS first, to compare against the frames without application structure as a second variable. Say plainly that this cost a migration later and was still right. | `strip` · `home-desktop-s1…s4.jpg` — the page as it reads while scrolling |
| 6a · Build | Role boundaries: learner, author, administrator, root. One paragraph each on what a role can reach. Keep the schema list out. | `plate` · `academy-desktop.jpg` |
| 6b · Build | The navbar that becomes its menu. Same pill, lower corners change, expands in place, first section's padding grows by the measured open height. This is the impressive one; give it room and say it came out of Sunab. | **SNIPPET** `{{snippet:loopbridge-navbar wide}}` |
| 6c · Build | Adaptive video: `hls.js`, manual quality, quiz overlays. Then the portrait-video bug — source orientation metadata, landscape output. One tight section. | `device` · `exchange-mobile.jpg` |
| 7 · Responsive | Mobile as a separate composition, not a collapsed desktop. The glossary is the example: sticky index and definition panel on desktop, dark navy hero and a 9×9×8 letter grid on mobile. | `duo` · **NEW**: glossary desktop vs the mobile Figma frame |
| 8 · What broke | Pick one. The Cabinet Grotesk `@font-face` path is the cleanest: correct declaration, still rendered the fallback, because the URL resolved from the stylesheet location. Cause and fix in four sentences. | — |
| 9 · Close | Four architecture stages, then what is deployed now and why the cheaper AWS shape won. | **SNIPPET** `{{snippet:loopbridge-progress}}` then links |

**Cut entirely:** the schema inventory (line 135), the analytics section, the
"AWS plans that were considered" section. Compress to one sentence inside beat 9.

---

### 4.2 Stitch Bloom

**Title** `Stitch Bloom: a shop that ends in an email`
**Excerpt** `A catalogue for recycled-yarn accessories, built from one template the owner chose, with an order flow that deliberately has no payment gateway.`

The strongest client story you have, because the central decision is a refusal.

| Beat | Content | Media |
| --- | --- | --- |
| 1 · Cover | — | `bleed` · `/projects/shots/10/home-wide.jpg` |
| 2 · Lede | Small business, bags and sleeves from recycled T-shirt yarn, sustainability is part of the product. Needed the work shown properly and new customers reached. | — |
| 3 · Facts | New table, matching Pengana's. | — |
| 4 · The ask | The owner had already reviewed several templates and picked Moss & Stone as the complete reference. Say why one chosen reference is easier to build against than a pick-and-mix. | `duo` · **NEW**: Moss & Stone beside the shipped Stitch Bloom home page |
| 5 · The decision | **No payment gateway.** The owner did not want to maintain a stock counter, and availability needs checking on a handmade item. Every cart ends in an email; the owner confirms availability, timing and payment. Two paragraphs, no apology. | `plate` · `home-desktop-s2.jpg` (the catalogue grid) |
| 6a · Build | The diagonal carousel. Keep the measurement block and the ratio conversion — they are the best technical writing in the post. Trim the surrounding prose by half. | **SNIPPET** `{{snippet:stitch-bloom-carousel wide}}` |
| 6b · Build | One catalogue file drives everything: home carousel, category sections, bestsellers, shop, search, product pages, bag. Prefix-and-count image convention in three sentences. | `strip` · `shop-najma-tote-desktop.jpg`, `shop-sleeve-laptop-desktop.jpg`, `shop-accessories-desktop.jpg` |
| 7 · Responsive | The diagonal survives on mobile by being measured, not by being hidden. | `duo` · `home-mobile.jpg` + `home-tablet.jpg` |
| 8 · What broke | The carousel bug after client-side navigation. This is a genuinely good bug: `getBoundingClientRect()` measured mid-transform on a route change, correct after a hard refresh. Keep `getStaticOffset()` and the `document.fonts.ready` detail. | `plate` · **NEW**: annotated screenshot showing the misplaced card |
| 9 · Close | GitHub Pages from `docs`, `HashRouter`, Cloudflare. Then the open item: colourway selection does not reach the cart or the email. State it once, plainly. | — |

**Cut:** the cookie banner paragraph, the newsletter/Web3Forms paragraph, the
missing-media file list. One sentence total: "Four editorial media files are still
waiting on client photography."

---

### 4.3 Derivian

**Title** `Derivian Care: a business plan, a logo, and everything in between`
**Excerpt** `A new supported living provider needed a site, an identity, letterhead, business email and a bank account. Keeping the running cost low decided most of it.`

The distinguishing feature is that this was not a website job. Lead with that.

| Beat | Content | Media |
| --- | --- | --- |
| 1 · Cover | — | `bleed` · `/projects/shots/11/home-wide.jpg` |
| 2 · Lede | Newly formed supported living business in London. Came with a business plan and reference sites. Needed a logo, design language, letterhead, business email and help opening an account. | — |
| 3 · Facts | Add a **Deliverables** row listing all six, not just the site. | — |
| 4 · The ask | Cost was the primary constraint and it chose the tools: Zoho for mail, Canva for stationery the client can edit, Revolut for the account. Say what you built and what you walked them through. | `strip` · **NEW**: letterhead template, logo variants on light and dark, Zoho mailbox |
| 5 · The decision | **The supported living correction.** You read parts of the reference material as domiciliary care and the language spread through the first build. The client corrected it on first review. Explain the difference (own tenancy and help with daily life, versus visits delivering care), then the terminology guide and the changed image brief: residents as subject, domestic settings, not clinical photography. This is the best material in the post and it is currently buried at line 26. | `duo` · **NEW**: a first-preview page beside the corrected one |
| 6a · Build | Easy Read as a real preference rather than a second stylesheet: five custom properties change at the root and the page reflows. Then the two responsive cases larger text exposed (nav drawer from 992–1199px, paired fields stacking at 900px). | **SNIPPET** `{{snippet:derivian-easy-read}}` |
| 6b · Build | Contact links that carry context: twelve templates, `?t=` preselects enquiry type, situation and a draft message. Short. | `plate` · `services-mobile.jpg` |
| 7 · Responsive | The Services page: six full-viewport panels sticking in sequence on desktop, ordinary flow on mobile. | `strip` · `home-desktop-s1…s3.jpg` |
| 8 · What broke | The client said images looked unclear; they looked fine on your screen. You asked for screenshots and display conditions instead of recompressing blindly, and found the files lacked pixel headroom for their density and zoom. Then the Sharp pipeline: 3840px longest side, MozJPEG q88, 127 MB down to 40 MB. **Keep this whole section, it is the best in the post.** | `duo` · **NEW**: the same crop at old and new resolution, zoomed to match their display |
| 9 · Close | What the client received. Then one open item: image masters still sit under `public/images`. | — |

**Cut:** the three-attempt Vercel `EEXIST` story. It is a good war story but it is
about Vercel's packaging step, not about Derivian; it belongs in its own short post.

---

### 4.4 Sunab

**Title** `Sunab Telecoms: designing a service nobody sees`
**Excerpt** `An interconnect business with no handset and no app screen to put at the centre of a page. The second attempt worked because I stopped polishing the first one.`

| Beat | Content | Media |
| --- | --- | --- |
| 1 · Cover | — | `bleed` · `/projects/shots/12/home-wide.jpg` |
| 2 · Lede | Pre-launch interconnect business. Logo, board and company information supplied; free rein on everything else. Nothing visual to put at the centre. | — |
| 3 · Facts | Existing table is fine. | — |
| 4 · The ask | What interconnect actually is, in two sentences, and why that made the content problem different: no handset, no retail bundle, no familiar app screen. A visitor needs to know what Sunab does, who is responsible, and how to start a technical conversation. | `plate` · `network-tablet.jpg` |
| 5 · The decision | **Stopping.** The first direction used Madison blue, orange, jade, purple and Montserrat, rendered correctly, and felt flat: same card grids, same dark blue, accents with no job. Say plainly that more polish would only have made it consistently flat. Then Amazon Leo: what you took was the page rhythm, not the motifs — large statements, restrained text fields, full-width photography, contained plates, dark sections. Mention `.leo-research` and the four-width capture set. | `duo` · **NEW, required**: the old home page beside the current one. Check out the pre-Leo commit and capture it. Without this image the section does not land. |
| 6a · Build | Palette from the logo: `#090673` deep blue, `#088C1C` laurel green. Each section declares a scheme; components read roles rather than naming colours. | **SNIPPET** `{{snippet:sunab-scheme-cycle wide}}` |
| 6b · Build | The navbar that grows from a mark. Tiny clipped shape at viewport centre, grows vertically into a pill, stretches horizontally into full navigation, contents enter left to right on staggered delays. Runs once per session. Then the Legal panel attached to the pill: measured on open and resize, meets the lower edge, loses its top border and top corner radii, 140ms hover bridge. Say it reads as the navbar stretching downward. | `strip` · **NEW**: four frames of the entrance — mark, vertical pill, stretched bar, contents in |
| 6c · Build | Removing content that had no source: testimonials, performance numbers, awards, a longer timeline. What stayed: 2022 formation, Abuja, NCC licence, the board, QIDPR. One paragraph, and the reason — a new business gains nothing from numbers it cannot defend to a carrier. | — |
| 7 · Responsive | Alternating image fields: edge to edge, contained plate, or colour and type with no photography. Show the rhythm as a strip. | `strip` · `home-desktop-s1…s4.jpg` (**needs capturing**) |
| 8 · What broke | The `ShowcaseCard` timing. First sequence waited for the image to finish opening before the copy arrived and looked hesitant; you moved the copy entrance to start while the image still had ~9% of its inset left, 420ms down to 200ms. Small, specific, and the kind of thing only someone who watched a recording would find. | — |
| 9 · Close | Five-strip page transition in one paragraph, then Microsoft 365 for company mail versus Resend for website messages, then links. | — |

---

### 4.5 Pengana

Least work. It already has the right skeleton; it needs pictures and two cuts.

- **Add a cover:** `bleed` · `/projects/shots/13/home-wide.jpg`.
- **Add one image per route tone** beside the palette snippet at line 67. Use
  `properties-wide.jpg`, `tishino-wide.jpg`, `sunab-wide.jpg` in a `strip`. The post
  argues that one system carries four businesses; three images prove it instantly and
  the current version asks the reader to take it on trust.
- **Add the reference contact sheet** at line 44 where the twelve Framer references
  are listed. A list of names does nothing; a grid of twelve thumbnails does.
- **Add `companies-tablet.jpg`** as a `plate` beside the three-business showcase
  snippet at line 114.
- **Cut** the "Photography, duotone, and the delivery pipeline" numbers down to the
  one that lands: 6.7 MB hero to a 255 KB delivery image.
- **Keep** the `not_found` section exactly as it is. It explains a real failure with
  a real cause and it is the model for every other post's beat 8.

---

## 5. The B-tree post: splitting one snippet into six

### 5.1 What is wrong with `bplus-tree-lab`

The current snippet is 2,445 lines across three files and tries to be an
application: a toolbar with five controls and a speed slider, a stats bar, a trace
panel with phase and frame counters, a page-layout strip, a legend, and Find and
Delete as labelled extensions. It renders a workbench.

3blue1brown does the opposite. One idea per animation, nothing on screen that is not
part of that idea, and objects that *move* between states rather than being redrawn.
The reason his splits read clearly is that the same rectangle you were watching
travels to its new parent; you track it because it never disappears.

So: six snippets, each one idea, each with the same visual language, prose between
them. No stats bars, no trace panels, no legends, no phase counters.

### 5.2 The sequence

| # | Slug | The one idea | Controls |
| --- | --- | --- | --- |
| 1 | `btree-page` | A page holds 13 rows in sorted order. Inserting shifts the cells after it. | `Insert` · `Reset` |
| 2 | `btree-split` | The 14th row. One leaf becomes two, a root appears, the sibling link connects them. | scrub bar · `Play` |
| 3 | `btree-descend` | Finding a key: the path lights up, and inside each node a lo/hi bracket halves. | key input · `Play` |
| 4 | `btree-grow` | Insert 1…40 continuously. Leaves stay at equal depth as the tree gains levels. | slider (count) |
| 5 | `btree-scan` | `select *`: one descent, then a straight walk along the sibling links. | `Play` |
| 6 | `btree-delete` | Underflow, borrow, merge, root contraction. Labelled as beyond the C program. | step ◀ ▶ |

Prose between them, roughly:

- Before #1: the row is 293 bytes, the page is 4096, the header takes 14, so thirteen fit.
- Between #1 and #2: the fourteenth insert is the first that has to change the tree's shape.
- Between #2 and #3: now that there is more than one leaf, a write has to find the right one first.
- Between #3 and #4: the same descent runs for every insert, which is why depth matters.
- Between #4 and #5: `select` does not need the tree at all after the first descent.
- Before #6: the repository has no delete; this is the standard algorithm, shown for completeness.

### 5.3 The visual language

Fix these across all six so they read as one series:

```
background      transparent; inherit the post surface
node            1px stroke, 2px radius, no fill except the active node
key cell        32×34px, mono numerals, 1px internal divider
edge            1px line, no arrowheads except the sibling link
active          one accent colour, used for exactly one thing at a time
label           one line of 12px mono, lower left, fades in and out
motion          400–700ms, cubic-bezier(0.65, 0, 0.35, 1), everything tweened
controls        one row, text buttons, no icons, no speed slider
```

The whole point is that a key cell has a **stable identity**. Give the SVG element
the id `k7` and it stays `k7` whether it lives in the root or the third leaf. Then a
split is not an animation you write; it falls out of interpolating between two
layouts.

### 5.4 Shared core

Same `style.css` and the top of `script.js` in all six snippet folders.

**`style.css`**

```css
.stage {
  --ink: #16181d;
  --line: rgba(22, 24, 29, 0.28);
  --muted: #6a7078;
  --accent: #2f70ff;
  --node: transparent;
  --node-active: rgba(47, 112, 255, 0.09);
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  color: var(--ink);
  padding: 8px 0 20px;
}

[data-theme="dark"] .stage {
  --ink: #e7eaef;
  --line: rgba(231, 234, 239, 0.3);
  --muted: #98a0aa;
  --accent: #7aa2ff;
  --node-active: rgba(122, 162, 255, 0.14);
}

.stage svg { display: block; width: 100%; height: auto; overflow: visible; }
.stage .cell { fill: var(--node); stroke: var(--line); stroke-width: 1; }
.stage .cell.is-active { fill: var(--node-active); stroke: var(--accent); }
.stage .num { fill: var(--ink); font-size: 13px; text-anchor: middle; dominant-baseline: central; }
.stage .edge { stroke: var(--line); stroke-width: 1; fill: none; }
.stage .edge.is-active { stroke: var(--accent); }
.stage .sib { stroke: var(--accent); stroke-width: 1; fill: none; stroke-dasharray: 3 3; }

.caption {
  min-height: 1.4em;
  margin: 14px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--muted);
}

.controls { display: flex; gap: 8px; align-items: center; margin-top: 14px; }
.controls button {
  padding: 5px 12px;
  font: inherit;
  font-size: 12px;
  color: var(--ink);
  background: none;
  border: 1px solid var(--line);
  border-radius: 2px;
  cursor: pointer;
}
.controls button:hover { border-color: var(--accent); color: var(--accent); }
.controls button[disabled] { opacity: 0.35; cursor: default; }
```

**`script.js` — the core (identical in every snippet)**

```js
// --- tween core -----------------------------------------------------
var NS = "http://www.w3.org/2000/svg";
var EASE = function (t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; };

function lerp(a, b, t) { return a + (b - a) * t; }

// A scene is { id: {x, y, w, h, text, active, kind} }.
// Objects present in both scenes interpolate; new ones fade in at their
// final position; missing ones fade out where they stood.
function Stage(svg) {
  this.svg = svg;
  this.els = {};      // id -> {g, rect, text}
  this.cur = {};      // id -> geometry
  this.raf = null;
}

Stage.prototype.make = function (id, spec) {
  var g = document.createElementNS(NS, "g");
  var rect = document.createElementNS(NS, "rect");
  rect.setAttribute("class", spec.kind === "edge" ? "edge" : "cell");
  rect.setAttribute("rx", "2");
  g.appendChild(rect);
  var text = null;
  if (spec.text != null) {
    text = document.createElementNS(NS, "text");
    text.setAttribute("class", "num");
    g.appendChild(text);
  }
  this.svg.appendChild(g);
  return (this.els[id] = { g: g, rect: rect, text: text });
};

Stage.prototype.paint = function (id, s) {
  var e = this.els[id];
  e.rect.setAttribute("x", s.x); e.rect.setAttribute("y", s.y);
  e.rect.setAttribute("width", Math.max(0, s.w));
  e.rect.setAttribute("height", Math.max(0, s.h));
  e.rect.classList.toggle("is-active", !!s.active);
  e.g.style.opacity = s.o;
  if (e.text) {
    e.text.setAttribute("x", s.x + s.w / 2);
    e.text.setAttribute("y", s.y + s.h / 2);
    e.text.textContent = s.text;
  }
};

// Interpolate the whole scene over `ms`. Returns a promise.
Stage.prototype.to = function (next, ms) {
  var self = this;
  var from = {}, to = {}, ids = {};
  Object.keys(self.cur).forEach(function (id) { ids[id] = 1; });
  Object.keys(next).forEach(function (id) { ids[id] = 1; });

  Object.keys(ids).forEach(function (id) {
    var a = self.cur[id], b = next[id];
    if (!self.els[id]) self.make(id, b || a);
    // entering: start at the target box, opacity 0
    from[id] = a ? a : Object.assign({}, b, { o: 0 });
    // leaving: hold position, fade out
    to[id]   = b ? Object.assign({ o: 1 }, b) : Object.assign({}, a, { o: 0 });
  });

  return new Promise(function (done) {
    var t0 = performance.now();
    cancelAnimationFrame(self.raf);
    (function frame(now) {
      var p = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms);
      var e = EASE(p);
      Object.keys(ids).forEach(function (id) {
        var a = from[id], b = to[id];
        self.paint(id, {
          x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e),
          w: lerp(a.w, b.w, e), h: lerp(a.h, b.h, e),
          o: lerp(a.o == null ? 1 : a.o, b.o, e),
          text: b.text != null ? b.text : a.text,
          active: e > 0.5 ? b.active : a.active
        });
      });
      if (p < 1) { self.raf = requestAnimationFrame(frame); return; }
      Object.keys(ids).forEach(function (id) {
        if (!next[id]) { self.els[id].g.remove(); delete self.els[id]; }
      });
      self.cur = next;
      done();
    })(t0);
  });
};

// --- B+ tree layout -------------------------------------------------
var CW = 32, CH = 34, GAP = 22, LEVEL = 96;

function leavesOf(n, out) {
  out = out || [];
  if (n.leaf) out.push(n); else n.kids.forEach(function (k) { leavesOf(k, out); });
  return out;
}
function widthOf(n) { return Math.max(1, n.keys.length) * CW; }

// tree -> scene. Key cells are identified by value, so a key that moves
// between nodes travels instead of being destroyed and recreated.
function layout(tree, W, opts) {
  opts = opts || {};
  var scene = {}, leaves = leavesOf(tree);
  var total = leaves.reduce(function (s, l) { return s + widthOf(l) + GAP; }, -GAP);
  var x = (W - total) / 2;

  leaves.forEach(function (l) { l._x = x; x += widthOf(l) + GAP; });

  (function place(n, depth) {
    if (!n.leaf) {
      n.kids.forEach(function (k) { place(k, depth + 1); });
      var first = n.kids[0], last = n.kids[n.kids.length - 1];
      n._x = (first._x + last._x + widthOf(last)) / 2 - widthOf(n) / 2;
    }
    n._y = depth * LEVEL + 10;

    n.keys.forEach(function (k, i) {
      scene["k" + k] = {
        x: n._x + i * CW, y: n._y, w: CW, h: CH, o: 1, text: String(k),
        active: opts.activeKeys && opts.activeKeys.indexOf(k) > -1
      };
    });
    if (!n.leaf) {
      n.kids.forEach(function (k, i) {
        scene["e" + n.id + "-" + k.id] = {
          x: n._x + widthOf(n) / 2, y: n._y + CH,
          w: (k._x + widthOf(k) / 2) - (n._x + widthOf(n) / 2),
          h: LEVEL - CH, o: 1, kind: "edge",
          active: opts.activePath && opts.activePath.indexOf(k.id) > -1
        };
      });
    }
  })(tree, 0);

  return scene;
}
```

> The `edge` entries above are drawn as rects for brevity; in the real snippet
> replace `Stage.prototype.make`'s edge branch with a `<path>` and interpolate its
> `d` from the same four numbers. Everything else is unchanged.

### 5.5 Snippet 2 — `btree-split`, the flagship

`index.html`

```html
<div class="stage">
  <svg id="svg" viewBox="0 0 640 300" role="img"
       aria-label="A full leaf page splitting into two, with a new root above"></svg>
  <p class="caption" id="cap">Thirteen rows fit in one 4 KB page.</p>
  <div class="controls">
    <button id="play" type="button">Play</button>
    <button id="back" type="button" disabled>Back</button>
    <button id="next" type="button">Step</button>
  </div>
</div>
```

`script.js` (after the shared core)

```js
var W = 640;
var svg = document.getElementById("svg");
var cap = document.getElementById("cap");
var stage = new Stage(svg);

// Reduced to seven keys so the split is legible; the caption carries the
// real number. Showing thirteen cells makes each one too small to follow.
var K = [1, 3, 5, 8, 11, 14, 18];

var STEPS = [
  {
    cap: "One leaf, filled in order. Page 0 is also the root.",
    tree: function () { return { id: "L0", leaf: true, keys: K.slice() }; }
  },
  {
    cap: "Key 21 arrives. There is no room for it.",
    tree: function () { return { id: "L0", leaf: true, keys: K.slice() }; },
    active: [21]           // 21 enters beside the node, unplaced
  },
  {
    cap: "The cells divide. Four stay; four move to a new page.",
    tree: function () {
      return { id: "R", leaf: false, keys: [11], kids: [
        { id: "L0", leaf: true, keys: [1, 3, 5, 8] },
        { id: "L1", leaf: true, keys: [11, 14, 18, 21] }
      ] };
    }
  },
  {
    cap: "Page 0 becomes an internal page. It keeps one routing key: the largest on the left.",
    tree: function () {
      return { id: "R", leaf: false, keys: [11], kids: [
        { id: "L0", leaf: true, keys: [1, 3, 5, 8] },
        { id: "L1", leaf: true, keys: [11, 14, 18, 21] }
      ] };
    },
    active: [11]
  },
  {
    cap: "The leaves keep a sibling pointer, so a scan never returns to the root.",
    sibling: true,
    tree: function () {
      return { id: "R", leaf: false, keys: [11], kids: [
        { id: "L0", leaf: true, keys: [1, 3, 5, 8] },
        { id: "L1", leaf: true, keys: [11, 14, 18, 21] }
      ] };
    }
  }
];

var i = -1, busy = false;

function show(n, ms) {
  var s = STEPS[n];
  var scene = layout(s.tree(), W, { activeKeys: s.active || [] });

  // Step 1 parks the incoming key to the right of the full node.
  if (n === 1) scene.k21 = { x: W - 70, y: 10, w: CW, h: CH, o: 1, text: "21", active: true };
  if (s.sibling) scene.sib = { x: 150, y: 150, w: 340, h: 0, o: 1, kind: "edge" };

  cap.textContent = s.cap;
  return stage.to(scene, ms);
}

function go(n) {
  if (busy || n < 0 || n >= STEPS.length) return;
  busy = true; i = n;
  document.getElementById("back").disabled = i <= 0;
  document.getElementById("next").disabled = i >= STEPS.length - 1;
  show(i, 620).then(function () { busy = false; });
}

document.getElementById("next").onclick = function () { go(i + 1); };
document.getElementById("back").onclick = function () { go(i - 1); };
document.getElementById("play").onclick = function () {
  go(0);
  var t = 0;
  for (var n = 1; n < STEPS.length; n++) {
    (function (n) { setTimeout(function () { go(n); }, (t += 900)); })(n);
  }
};

go(0);
```

`meta.json`

```json
{
  "title": "One page becomes two",
  "description": "The insert that does not fit. Cells divide across two pages, a routing key moves up into a new root, and the leaves keep a sibling pointer."
}
```

### 5.6 Specs for the other five

All reuse the core unchanged; only the step list and one helper change.

**`btree-page`** — no tree, one node. `STEPS` is generated: each press of `Insert`
picks the next key from a shuffled list, computes its sorted position, and calls
`stage.to()` with the cell inserted. Cells after it slide right because their `x`
changes and their id does not. Caption counts `n / 13`. At 13, the Insert button
disables and the caption reads "Full. The next row has to change the tree's shape."

**`btree-descend`** — fixed three-level tree, ~12 leaves. An `<input type="number">`
takes the key. On submit, walk root to leaf; at each node run the lower-bound binary
search and emit one scene per iteration with two extra scene entries: a bracket
rect spanning cells `[lo, hi)` and a tick at `mid`. The bracket narrowing is the
idea; hold 500ms per iteration. Then set the chosen edge `active` and descend. Final
caption: `3 pages read` or `not found`.

**`btree-grow`** — `<input type="range" min="1" max="40">`. Rebuild the tree from
scratch for the slider value with a plain B+ insert, then `stage.to(layout(tree), 260)`.
Because layout is a pure function of the tree and ids are stable, dragging the slider
gives continuous morphing for free. Caption shows `levels: n`. No buttons at all.

**`btree-scan`** — same tree as `btree-descend`. Step 1 descends to the leftmost
leaf. Steps 2…n move a single accent cell along the leaves, following the sibling
links, one leaf per 400ms. A second caption line counts pages read. Optional second
`Play` mode ghosts the alternative: return to the root between leaves, so the reader
sees the descent repeat and the count climb.

**`btree-delete`** — six steps: remove a key from a leaf; the leaf is under half
full; borrow one key from the sibling and update the parent separator; remove
another; no sibling can spare a key, so merge; the parent loses a child and
underflows; the root has one child left and contracts. Prefix the caption with
`beyond the C program ·` on every step so the boundary stays visible without a
legend.

### 5.7 What to change in `b-tree.md`

- Delete the "Try the tree" section (lines 157–169) and the single
  `{{snippet:bplus-tree-lab wide height:780}}`.
- Place the six snippets at their natural points: `btree-page` after the 4 KB page
  layout table (line 77); `btree-split` inside "Insertion and leaf splitting" (line
  118); `btree-descend` inside "Binary search at each level" (line 110);
  `btree-grow` at the end of "Why this is a B+ tree" (line 85); `btree-scan` inside
  "How a full select crosses the tree" (line 155); `btree-delete` in its own short
  section before the SQLite/InnoDB comparison.
- The two paragraphs currently explaining what the lab's controls mean can go.
  A snippet that needs a paragraph of instructions is doing too much.
- Keep the C listings. They are short and they anchor the animations to real code.
