---
title: "Sunab Telecommunications — Getting the Build Step Back"
excerpt: "A telecoms marketing site that was transpiling JSX in the browser on every page load. Fixing that was the easy part; giving a 95%-blue site a personality was the rest."
series: portfolio-projects
publishedAt: 2026-06-20
---

## What was there

Sunab Telecommunications Services Ltd connects mobile network operators — interconnection and clearing-house solutions for stable routing, accurate billing and consistent service across Nigeria and beyond. It's a business whose product is invisible, which makes the marketing site's job harder than it looks: there is nothing to photograph.

The site that existed was a set of static HTML pages that pulled React, Babel and Tailwind from CDNs and **transpiled JSX in the browser on every page load**. That's a legitimate way to prototype and a bad way to ship: you pay for the compiler on every visit, you ship the entire Tailwind stylesheet, and nothing is minified, tree-shaken or cache-busted.

First move was the boring one — port it to Vite + React 18 + Tailwind v4 with `react-router`, keep the original pages in `legacy/` for reference, and produce an actual bundle.

## The real problem: it was 95% blue

With the build fixed, the site was still flat. An audit of the stylesheet made the reason obvious — five colours were defined and one was doing all the work:

- **Madison blue** `#090673` — navbar, footer, buttons, headings, links, borders;
- **Ecstasy orange** `#f58220` — defined, barely used;
- **Jade green** `#088c1c` — defined, unused;
- plus purple and a neutral ramp.

The site wasn't badly designed so much as *monotonous*. And the fix isn't "add more colours" — it's giving each section a defined identity and then alternating between them deliberately.

Every section on the site declares exactly one scheme class. Every element inside it resolves its background, text, border, button text and accent from that scheme's slots. Nothing inside a section names a colour.

{{snippet:sunab-scheme-cycle wide}}

Written as Tailwind v4 utilities:

```css
@utility scheme-night {
  --color-scheme-background: var(--color-deep-blue-darkest);
  --color-scheme-text: var(--color-white);
  --color-scheme-border: var(--color-white-15);
  --color-scheme-accent: var(--color-japanese-laurel-light);
  background-color: var(--color-scheme-background);
  color: var(--color-scheme-text);
}
```

Six schemes — a near-black `night` for hero and immersive sections, two dark blues, two lights, and a green-tinted one — composed into a dark/light alternation down each page. The green accent finally earns its place: on the dark schemes it's the one colour with enough contrast to carry links, focus rings and active indicators, so it becomes the interaction colour rather than decoration.

The payoff is the same as any token system: a section changes character by changing one class, and a new section can't accidentally invent an off-brand colour because there isn't one available to it.

## Personality without a redesign

Beyond colour, the site got a set of cheap, on-brand behaviours:

- **CSS patterns instead of flat fills** — a dot grid and a blueprint grid built from `radial-gradient` and two `linear-gradient`s. Engineering texture behind otherwise empty dark bands, at zero asset cost.
- **A scroll-cycle** on the Services benefits and the About page's QIDPR values: as you scroll a pinned section, the active item advances and its image swaps. One pattern, reused on both pages rather than two bespoke components.
- **Scroll reveals and counters** via `IntersectionObserver`, with `prefers-reduced-motion` honoured throughout.
- **Strip page transitions** — an SPA route change is instant and abrupt by default, so the new page arrives behind moving bars.
- **Cards that deck-stack on mobile** with the section heading pinned through the sequence, so the context doesn't scroll away from the content.

There's also a small navigation lesson in here. An early version animated the page transition *and* smooth-scrolled the new route to the top, which fought each other: the scroll glide made the reveal observers fire on elements that were passing through the viewport rather than arriving in it. Jumping instantly to the top and *then* animating is the fix — the same bug, and the same fix, that turned up later on Pengana.

## Forms that degrade honestly

Contact and newsletter POST to Vercel serverless functions in `api/`, which email the team via Resend. A honeypot field filters bots; submissions with it filled are dropped.

The bit worth copying is what happens when the backend isn't configured. Until `RESEND_API_KEY` is set, the functions return `503` and the front end falls back automatically: **the contact form opens the visitor's mail client with the message composed**, and the newsletter stays optimistic. So the live site is never broken by a missing key — setting it upgrades the experience rather than enabling it.

The alternative, which the site previously had, is a form that appears to submit and drops the enquiry on the floor. That's worse than no form.

## Stack

React 18 + Vite + Tailwind CSS v4, `react-router` with a central `routes.js` path map as the single source of truth for URLs. Vercel serverless functions and Resend for forms. The original static site is archived in `legacy/`. Outstanding backend and content gaps are audited in `BACKEND_TODO.md` and marked in code with `TODO[backend/…]`, `TODO[content/…]` and `TODO[image/…]` so nothing quietly ships as a placeholder.

**Live:** [sunabtelecomservices.com](https://sunabtelecomservices.com/) · **Source:** [github.com/NeroSiegfried/sunab-telecommunications](https://github.com/NeroSiegfried/sunab-telecommunications)
