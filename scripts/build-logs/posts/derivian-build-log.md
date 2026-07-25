---
title: "Derivian — Accessibility as a Token Swap"
excerpt: "A supported living website where the accessibility feature isn't a separate stylesheet or a second site — it's five custom properties changing value on the root element."
series: portfolio-projects
publishedAt: 2026-06-07
---

## Overview

DeRivian Care is a supported living business in London. The site has two audiences that want completely different things from it: **the people who will live in the homes and their families**, who need warmth, plain language and no jargon; and **local-authority commissioners and referrers**, who need to find the referral route in under thirty seconds and get a pack.

Getting one site to serve both is most of the design work. The rest is making sure the first audience can actually read it.

## Accessibility, and the version of it that survives contact with a real site

The baseline is what you'd expect: WCAG 2.1 AA, semantic HTML, a skip link, keyboard-reachable navigation, `aria-pressed` on toggles, `aria-expanded` on the drawer, sufficient contrast, real focus styles.

The interesting part is **Easy Read mode** — a single toggle in the nav that enlarges type, opens up line height and letter spacing, and persists to `localStorage` so a returning visitor never has to find it twice.

The naive way to build that is a second stylesheet, or worse, a second set of components. Neither survives maintenance: every new section has to be built twice, and the day someone forgets, the accessible version quietly falls behind the real one.

Instead, the whole feature is a token swap. Every size on the site is already expressed as a custom property; Easy Read just re-points them.

{{snippet:derivian-easy-read}}

```css
html.easyread-on {
  --text-medium: 1.25rem;
  --text-regular: 1.15rem;
  --text-small: 1.05rem;
  --text-large: 1.45rem;
  font-size: 18px;
}
html.easyread-on body { letter-spacing: 0.01em; line-height: 1.7; }
```

That's the feature. Six declarations. Every heading, card, button, form label and blockquote on the site re-flows because none of them ever hard-coded a size.

The toggle itself sets the class on `<html>` before paint and reads the saved preference on mount, so there's no flash of the wrong size on a reload.

### The one rule that isn't free

There is exactly one place where the token swap isn't enough, and it's a good illustration of why "make the text bigger" is never *only* about text:

```css
/* Easy Read enlarges nav text, which overflows the bar at the lower end of the
   desktop range before the 992px drawer kicks in. When Easy Read is on, collapse
   the navbar into the drawer earlier (up to 1199px) so it never spills. */
@media (min-width: 992px) and (max-width: 1199px) {
  html.easyread-on .nav__toggle { display: flex; }
  html.easyread-on .nav__menu { /* …drawer layout… */ }
}
```

Bigger nav labels stop fitting the bar somewhere around 1100px — well above the 992px breakpoint where the drawer normally takes over. So Easy Read moves the breakpoint. Layout has a text-size dependency, and pretending otherwise just produces a nav that spills for the users who most need it not to.

## Contact flows that already know why you're writing

A single "Contact us" form is a small tax on everyone: the visitor has to explain their situation from scratch, and the business has to triage.

So the contact page reads a `?t=` query parameter and pre-fills from a template map — the enquiry type, the situation, and a first draft of the message:

```js
contactTemplates: {
  referral: {
    help: "Professional / local authority referral",
    situation: "referral",
    message: "I would like to make a referral to DeRivian Care. Please could you send me your referral pack and confirm the next steps?",
  },
  "daily-living": {
    help: "Arranging care for myself",
    situation: "service",
    message: "I'd like to find out more about daily living support — help with cooking, cleaning, shopping and household management.",
  },
  // …
}
```

Every CTA on the site links to the template that matches where it sits. The "Make a referral" button on the professionals page and the "Find out more" button on a service card land the same person in the same form with different starting states. It's editable — nobody is forced to send the draft — but it removes the blank-page problem and it means the right information reaches the right inbox without an internal triage step.

## Content lives in the database, or it doesn't exist

The blog started with a static fallback: seven posts hard-coded so the site had something to show if the database was unreachable. That got removed deliberately.

Two sources of truth for the same content is a bug generator — the fallback drifts, then someone edits the real post and the stale copy is what renders during an outage. Now all blog content lives in Prisma Postgres, seeded from `prisma/seed.js` via `upsert` so re-running the seed is always safe, and if the database is down, no posts are shown. An empty blog is honest. A stale one isn't.

The same discipline got applied to imagery: **every image number is used exactly once across the entire site**, documented in `IMAGES.md` with the aspect ratio and a description of what belongs in each slot. No photo appears in two visual contexts, which is the thing that makes a small site feel like a template.

## Two deployment problems worth keeping

**Vercel refused to build because two API routes were too similar.** The contact and newsletter routes compiled to *identical* dependency graphs — same Next.js runtime chunks, no external imports, nothing to distinguish them. Vercel's post-build deduplication decided they were the same function and tried to symlink one to the other, which failed with `EEXIST` because both already existed as real directories.

The fix is delightfully stupid, and correct:

```json
{
  "functions": {
    "src/app/api/contact/route.js":    { "memory": 256 },
    "src/app/api/newsletter/route.js": { "memory": 128 }
  }
}
```

Different memory settings produce different `.vc-config.json` files inside each `.func` directory, which makes the directories non-identical, which means deduplication never fires. Verified with a local `vercel build` before pushing.

**The rebrand.** Partway through, the business's positioning changed from domiciliary care to **supported living** — which is not a find-and-replace. Domiciliary care is visiting someone in their home; supported living is that person having their own tenancy and being supported to run it. The difference changes who the subject of every sentence is. The site went from describing services performed *for* people to describing homes belonging *to* them, and the imagery brief changed with it: residents alone in their own space, no support worker in frame.

## Stack

Next.js 14 (App Router), React 18, Prisma + Postgres, Vercel. Plain CSS — no framework — with the type scale, spacing and colour on custom properties, which is what made Easy Read a six-line feature instead of a second site. Contact and newsletter run through serverless routes; `sharp` handles image compression, and originals are always retained alongside the compressed variants.

**Live:** [derivian.co.uk](https://www.derivian.co.uk) · **Source:** [github.com/NeroSiegfried/derivian-care](https://github.com/NeroSiegfried/derivian-care)
