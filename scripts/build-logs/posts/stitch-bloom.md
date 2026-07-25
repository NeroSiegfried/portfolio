---
title: "Stitch Bloom — Recreating a Carousel from the DOM Up"
excerpt: "A leather-goods brand site built around one stubborn component: a stacked diagonal carousel where every dimension is derived from a single measured width."
series: portfolio-projects
publishedAt: 2026-06-01
---

## The brief

Stitch Bloom makes leather goods. The reference was a Moss & Stone-style editorial shop — cream and brown, thin rules, a squared navbar sitting *inside* the page rather than on top of it, and a hero carousel where product cards stack diagonally rather than sliding in a row.

Most of that is straightforward. The carousel is not, and it's the reason this post exists.

## Deriving a component instead of eyeballing it

The temptation with a reference like this is to nudge values until it looks close. That produces a component that works at exactly one viewport width and falls apart everywhere else.

So the geometry was read off the reference's DOM at 1440px first:

```text
card size  : 350 × 574 px      (ratio 1 : 1.64)
step offset: +390px X, −100px Y per position to the right
side cards : scale(0.85), opacity 0.5
nav buttons: 50 × 50, transparent, 1px solid brown
```

Then those absolutes were converted into **ratios of the card width**, so one measured number drives the entire composition:

```js
const cardW = Math.round(Math.max(180, Math.min(cw * 0.50, 350)));
const cardH = Math.round(cardW * 1.64);
const xStep = Math.round(cardW * 1.114);
const yStep = Math.round(cardW * 0.286);
const stageH = cardH + yStep * visibleSide * 2 + 72; // 72px reserved for controls
```

`cw` comes from a `ResizeObserver` on the container — not from `window.innerWidth`, and not from breakpoints. Positioning is `w = i - active`, wrapped to the shorter way round the ring, and each visible card gets `translateX(w * xStep) translateY(-w * yStep) scale(…)`.

Here it is running. Resize the window and watch every number recompute together.

{{snippet:stitch-bloom-carousel wide}}

Cards outside `±2` positions don't render at all, so a fifty-product catalogue still only mounts five nodes. Only `transform` and `opacity` animate, so the whole deck moves on the compositor.

## The bug that only appeared on the second visit

The carousel positioned itself correctly on a hard refresh and landed in the wrong place after navigating to the page from elsewhere in the SPA.

The cause: the layout maths used `getBoundingClientRect()` to find where the preceding block ended — and the page's scroll-reveal animation applies a `translateY` fade-up to that same block. On a fresh load the measurement happened to run after the transform settled. On an SPA navigation it ran *during* the animation, so `getBoundingClientRect()` returned a position skewed by the in-flight transform, and the carousel anchored to a coordinate that stopped existing 400ms later.

The fix is to measure the **static** layout position, walking `offsetTop` up the `offsetParent` chain, which transforms don't affect:

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

The same pass moved measurement behind `document.fonts.ready`, because Cormorant Garamond's metrics differ enough from the fallback that measuring before it loads bakes in a layout shift.

The general lesson: `getBoundingClientRect()` answers "where is this on screen right now", including every transform in the ancestor chain. When you want "where does layout put this", that's a different question and it needs a different tool.

## Everything else

- **Cart persisted to `localStorage`**, hydrated once on mount so a refresh mid-browse doesn't lose the basket.
- **`assetUrl()` on every dynamic image path** — the site was originally served from a GitHub Pages subpath before moving to the custom domain, and hard-coded `/images/…` paths break silently under a base path. Routing them all through one helper made the eventual `base: '/'` switch a one-line change.
- **Cookie consent** with a real preferences panel rather than an accept-only banner.
- **Mobile spacing rebuilt against a 780px breakpoint**, capping section margins at 32px — the desktop rhythm made phone pages feel like a series of empty screens.

## Deployment, the awkward way

The site deploys to **GitHub Pages from the `docs/` folder on `main`**, fronted by Cloudflare for the custom domain:

```json
"deploy": "cp -r dist/. docs/ && git add docs/ && git commit -m 'deploy: update docs' && git push origin main"
```

It works, and it's free, and it's the reason there is a run of commits in the history titled "Create CNAME", "Delete CNAME", "Create CNAME". The build output is copied over `docs/`, which is also where GitHub Pages expects `CNAME` to live — so every deploy quietly deleted the file that pointed the custom domain at the site, and `thestitchbloom.com` went down until someone re-added it by hand.

The permanent fix is to stop treating `CNAME` as a deploy artefact and make it a source file: put it in `public/`, let Vite copy it into `dist/`, and the `cp -r dist/. docs/` that used to destroy it now restores it every time. That's what commit `5d86a63` does, and the loop hasn't recurred since.

## Stack

React 19 + Vite, `react-router` v7, plain CSS per component (`Component/Component.css` next to `Component/Component.jsx`), `react-icons`. No CSS framework, no state library — cart and UI state live in React context.

**Live:** [thestitchbloom.com](https://thestitchbloom.com/) · **Source:** [github.com/NeroSiegfried/stitch-bloom](https://github.com/NeroSiegfried/stitch-bloom)
