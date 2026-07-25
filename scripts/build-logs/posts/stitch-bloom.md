---
title: "Stitch Bloom — Reverse Engineering a Template I Couldn't Download"
excerpt: "A crochet brand built to a Framer template I only had read access to. Most of this build log is about the difference between a site that looks similar and a site that is actually the same."
series: portfolio-projects
publishedAt: 2026-06-01
---

## The brief

Stitch Bloom makes handcrafted crochet bags out of recycled textiles. Turning waste into worth — that's the tagline, and it's the whole positioning: style and sustainability, and employment for the women who make the bags.

I wanted the site built to the [Moss & Stone](https://mossandstonetemplate.framer.website/) Framer template. I couldn't duplicate the template into my own Framer account, so there was no source to export. The live site was the only reference I had.

That constraint is the reason this project took as long as it did, and it's the most useful thing in this log.

## "Similar" is not the same as "the same"

The first pass came back looking nothing like the reference. The collections didn't use the same animations or displays, the buttons were rounded instead of the square theme with thin outlines the reference uses, and there was no menu and no cart at all. It was a decent site. It just wasn't the site I asked for.

What I kept running into is that a coding agent will happily look at a screenshot, form an impression, and then build from the impression. So I stopped accepting that:

> Do not use your tooling. Use Selenium or other similar tools to get the actual HTML, CSS and JavaScript. Use Chromium if you have to. I want a faithful replication and not guesswork. It is a complex website and you do not know what they are doing. So you have to look at it exactly.

And when a "fix" came back as a colour tweak rather than a rebuild:

> I didn't say minimal changes. Make as many changes as possible if that's what it'll take to get it there. I want a faithful reproduction first. I can adjust it for my own needs later. What I do not want is patchwork that tries to do the least to technically satisfy my requirements.

If the browser can read the HTML, CSS and client-side JS, so can the tool driving the browser. Anything less is a guess dressed up as a result.

## The carousel

The hero is a stacked diagonal carousel. Getting it right meant reading the geometry off the reference's DOM at 1440px rather than eyeballing it:

```text
card size  : 350 × 574 px      (ratio 1 : 1.64)
step offset: +390px X, −100px Y per position to the right
side cards : scale(0.85), opacity 0.5
nav buttons: 50 × 50, transparent, 1px solid brown
```

Then turning those absolutes into ratios of one measured card width, so the whole composition survives every viewport instead of only 1440:

```js
const cardW = Math.round(Math.max(180, Math.min(cw * 0.50, 350)));
const cardH = Math.round(cardW * 1.64);
const xStep = Math.round(cardW * 1.114);
const yStep = Math.round(cardW * 0.286);
const stageH = cardH + yStep * visibleSide * 2 + 72; // 72px reserved for controls
```

`cw` comes from a `ResizeObserver` on the container — not `window.innerWidth`, and not breakpoints. Position is `w = i - active` wrapped to the shorter way round the ring, then `translateX(w * xStep) translateY(-w * yStep) scale(…)`.

{{snippet:stitch-bloom-carousel wide}}

Bumping it to five items was deliberate — I wanted to see how the wrap-around logic behaved before trusting it.

Beyond the maths, the layout rules I had to keep repeating:

- the carousel is the **highlight of the landing page**, not half of it. Everything else in the hero sits absolutely positioned around it;
- the container has to be tall enough to still show the **top of the rightmost card and the bottom of the leftmost**, or the diagonal reads as a mistake;
- the overlay rests on the **edges of the screen** — no stray margin;
- it only collapses into separate rows below 768px;
- the topmost item under the navbar needs padding that accounts for the navbar's height, so the background is continuous instead of chopping off where the navbar ends.

That last one produced the single most useful convention in the project:

```text
Navbar: position:fixed; top:10px; left:10px; right:10px; height:60px;
        border:1px solid rgb(93,64,55)  →  bottom edge = 72px  →  --nav-height: 72px
padding-top: var(--nav-height) goes on the inner coloured element, NOT the <section> wrapper
```

Put the padding on the section and the section's background starts below the navbar, which is exactly the chopped-off edge I was trying to get rid of.

## The rules that made it feel like one site

Most of what separates this from a template-shaped pile of components is a handful of rules applied everywhere, without exception.

**The 50px rule.** Every box is 50px. The arrow box on the category cards, the carousel's left and right arrows, the "View Product" label in the image overlays, the navbar cells, the cart item quantity boxes. I had to ask for this more than once, because it kept getting applied to whichever component was being worked on and not the rest.

**A 16px base for everything.** Margins and gaps were a mess — home pillars on `space-xl`, best sellers on `lg`, home categories on a hard-coded 12px. All of it went to 16px. The navbar was also not aligned with the content below it, because they had different spacings from the edge of the screen; and on very wide screens components with different `max-width` settings drifted out of alignment with each other. Everything now sits in the same max-width container with the same edge spacing, so the left edge of the nav, the hero, the product grid and the footer are the same left edge.

**One arrow, one animation.** The reference's arrows point to the top-right, and on hover the arrow travels out through the top-right corner while an identical one enters from the bottom-left to replace it. Hover out and it reverses. Not a rotation, not a fade — two arrows and a clipped box. Every diagonal arrow on the site uses it, and the in-copy links use the same motion.

**Colour has jobs.** Terracotta is reserved for hover, focus, primaries and tags. Deep brown is for dark surfaces and active states. Category cards sit on cream-dark and go to brown-deep on hover, with the text and arrow colours picked so the label stays readable through the transition. Before that rule existed, "make it darker" produced a different brown every time.

The bug I liked most in this category: the category cards had a bottom padding that **disappeared on hover**. It wasn't padding at all. The card was a flex column with a gap, and the subheading was hidden rather than removed — so the gap stayed when the subheading was visible and collapsed when it wasn't. The fix was to delete the gap, not to add a margin.

## The cart

The cart drawer went through several rounds because I kept being given something approximately like the reference. In the end the instruction that worked was the literal one: go to Moss & Stone, add two items to the cart, inspect it, and use that.

The rules that stuck:

- the close button occupies **exactly the same space** as the cart button that opened it, so nothing shifts when the drawer opens;
- when the viewport is narrower than the drawer's default width, the drawer covers the screen completely;
- the collection name came off the cart items — it wasn't useful. Price sits on the same line as the name;
- the quantity row sits at the **bottom** of the item, with the remove button pushed to the right of that row and everything else left;
- the remove button gets the same square outline as every other control, at 50px.

## Products come from a file, not from markup

Once real product photography started arriving, hard-coded product markup became the bottleneck. Everything moved behind a JSON definition: collections, the items in them, how many variants an item has, and the filename prefix its images use. The shop grid, the product detail pages and the carousel all build from that.

The rule for missing images is that anything I haven't named yet is never coming — the UI has to handle it dynamically rather than break. The catalogue is real:

```text
Key Holder            ₦15,000     Najima Tote Bag       ₦70,000
Najima Shoulder Bag   ₦55,000     Najima Mini           ₦55,000
Najima Handbag        ₦65,000     iPad Sleeve           ₦35,000
Laptop Sleeve         ₦45,000     Najima Clutch        ₦110,000
```

Type is part of the same system: two licensed faces, Boiling Bold and Silver South. Below the breakpoint the logo is the SVG; above it the wordmark is set as live text — "The" in Silver South, "Stitch Bloom" at −6% letter spacing, both in `#C4021D`.

## The bug that only appeared on the second visit

The carousel positioned itself correctly on a hard refresh and landed in the wrong place when I navigated to the page from elsewhere in the app.

The layout maths used `getBoundingClientRect()` to find where the block above it ended — and that block has a scroll-reveal fade-up, which is a `translateY`. On a cold load the measurement happened after the transform settled. On a client-side navigation it ran *during* the animation, so the measurement came back skewed by an in-flight transform and the carousel anchored itself to a position that stopped existing 400ms later.

The fix is to ask a different question. `getBoundingClientRect()` tells you where something is on screen right now, transforms included. Layout position is `offsetTop` walked up the `offsetParent` chain, which transforms don't touch:

```js
const getStaticOffset = (el, parent) => {
  let top = 0;
  let p = el;
  while (p && p !== parent && p !== document.body) {
    top += p.offsetTop;
    p = p.offsetParent;
  }
  return { top, bottom: top + el.offsetHeight };
};
```

The same pass moved every measurement behind `document.fonts.ready`, because Cormorant Garamond's metrics are different enough from the fallback that measuring before it loads bakes in a layout shift.

## Shipping it

The site is on **GitHub Pages from the `docs/` folder on `main`**, with Cloudflare in front for the custom domain:

```json
"deploy": "cp -r dist/. docs/ && git add docs/ && git commit -m 'deploy: update docs' && git push origin main"
```

Two things went wrong here and both are visible in the commit history.

The first is that nothing loaded at all when I first pointed the domain at it — the build was still using a subpath base, so every asset resolved to a URL that didn't exist. Routing every dynamic image through one `assetUrl()` helper is what made the eventual switch to `base: '/'` a one-line change rather than a hunt.

The second is the run of commits titled "Create CNAME", "Delete CNAME", "Create CNAME". The deploy copies `dist/` over `docs/`, and `docs/` is also where Pages keeps `CNAME` — so every deploy deleted the file pointing the domain at the site, and `thestitchbloom.com` went down until I re-added it by hand. The fix is to stop treating `CNAME` as a deploy artefact and make it a source file in `public/`, so Vite copies it into `dist/` and the deploy restores it every time.

## Stack

React 19 + Vite, `react-router` v7, CSS per component (`Component/Component.css` beside `Component/Component.jsx`), `react-icons`. No CSS framework and no state library — the cart and UI state live in React context, and the cart persists to `localStorage` so a refresh mid-browse doesn't empty the bag.

**Live:** [thestitchbloom.com](https://thestitchbloom.com/) · **Source:** [github.com/NeroSiegfried/stitch-bloom](https://github.com/NeroSiegfried/stitch-bloom)
