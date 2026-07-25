---
title: "Sunab Telecommunications — A Site for a Product You Can't Photograph"
excerpt: "Interconnection and clearing-house services between mobile network operators. There is nothing to photograph, the old build transpiled JSX in the browser, and the palette was 95% one blue."
series: portfolio-projects
publishedAt: 2026-07-09
---

## What the business does, and why that's hard

Sunab Telecommunications Services connects mobile network operators — interconnection and clearing-house solutions, so calls route, records reconcile and billing agrees across Nigeria and beyond.

The product is invisible. There is no shop, no handset, no building anyone recognises. Whatever the site is going to be, it can't lean on photography of the thing being sold, because there isn't one.

## First, get the build step back

What existed was a set of static HTML pages that pulled React, Babel and Tailwind from CDNs and **transpiled JSX in the browser on every page load**. That's fine for a prototype and wrong for a live site: you ship the compiler to every visitor, you ship the whole of Tailwind, and nothing is minified, tree-shaken or cache-busted.

So the first move was unglamorous — port it to Vite + React 18 + Tailwind v4 with `react-router`, keep every original page in `legacy/` for reference, and produce an actual bundle. Routes live in one `routes.js` path map so there's a single source of truth for URLs.

## It was 95% blue

With the build fixed the site was still flat, and an audit of the stylesheet showed why. Five colours were defined and one was doing everything:

- **Madison blue** `#090673` — navbar, footer, buttons, headings, links, borders
- **Ecstasy orange** `#f58220` — defined, barely used
- **Jade green** `#088c1c` — defined, unused
- plus purple and a neutral ramp

The answer wasn't more colours. It was giving each section a defined identity and then alternating between them on purpose, the way the [Amazon Leo](https://leo.amazon.com) site does — that was my reference for this pass, along with the new palette in the design folder that came from the logo.

Every section declares exactly one scheme class. Everything inside resolves its background, text, border, button text and accent from that scheme's slots. Nothing inside a section names a colour.

{{snippet:sunab-scheme-cycle wide}}

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

Six schemes — a near-black `night` for heroes and immersive sections, two dark blues, two lights, and a green-tinted one — composed into a dark/light alternation down each page. The green finally earns its keep: on the dark schemes it's the one colour with enough contrast to carry links, focus rings and active indicators, so it becomes the interaction colour instead of decoration.

A section changes character by changing one class, and a new section can't invent an off-brand colour because there isn't one available to it.

## The logo

I started redrawing the logo myself and got as far as an SVG before I ran out of patience with it. What was left was specific: take the two concentric circles and crop them into four waves, crop the lines in some places, align them in others, and fill the shapes with the right colours. The only other reference was `logo.jpeg`, which is not a good image.

Once it existed it went into the nav, the footer and the favicon first, and only then into variants. Getting the primary placements right before generating a family is worth doing in that order — a variant of a mark you haven't yet seen in context is a guess.

Related, and more annoying than it should have been: the logo and wordmark in the navbar wouldn't centre. They sat resting on the top of their div. There was a bottom margin coming from somewhere I hadn't written, and finding it took longer than fixing it.

## Motion, and getting the timing right

The site got a set of cheap, on-brand behaviours rather than a redesign:

- **CSS patterns instead of flat fills** — a dot grid and a blueprint grid from a `radial-gradient` and two `linear-gradient`s. Engineering texture behind empty dark bands at zero asset cost.
- **A scroll-cycle** used on the Services benefits and again on the About page's QIDPR values, so it's one pattern reused rather than two bespoke components.
- **Scroll reveals and counters** via `IntersectionObserver`, with `prefers-reduced-motion` honoured.
- **Strip page transitions**, because an SPA route change is instant and abrupt by default.

Two timing corrections were the difference between "it animates" and "it feels right".

The first: when sections expanded, the text animation only started **after** the section had finished expanding. On the reference it starts midway, so the section feels alive and you're not waiting to be allowed to read it.

The second: the page transition was capturing the navbar in its snapshot. The navbar doesn't meaningfully change between pages, so animating it out and back in is motion that communicates nothing — it needed to sit outside the transition entirely. The same class of problem showed up in navigation generally: animating the transition *and* smooth-scrolling the new route to the top makes the reveal observers fire on elements passing through the viewport rather than arriving in it. Jump to the top instantly, then animate.

The fiddliest one was the capabilities section on the network page, where cards deck-stack over each other on mobile. The heading slid up out of view as soon as the stack began, so you lost the context for what you were reading. It had to stay put until all the cards were in place and the whole section scrolled away — and the first fix over-corrected, sticking the heading to the end of its section rather than its natural position relative to the topmost card, so it overlapped instead.

## Images, since there's nothing to photograph

Every image slot is described in `images.md`, and the first version of those descriptions was too vague to act on — "network infrastructure" is not a brief. They got rewritten to be explicit about subject, framing and mood. Even then a lot of these were genuinely hard to source, and the descriptions grew extra keywords rather than being replaced, so the original intent stayed visible.

Compression was done by working out where each image actually appears, taking the largest size it's displayed at, and compressing to twice that — with the originals backed up first, because a lossy pipeline you can't reverse is a trap.

## Forms that degrade honestly

Contact and newsletter POST to Vercel serverless functions in `api/`, which email the team via Resend. A honeypot filters bots. Contact templates prefill the form based on the type of enquiry, so the visitor isn't starting from a blank box and the right information reaches the right inbox.

The part worth copying is the failure mode. Until `RESEND_API_KEY` is set, the functions return `503` and the front end falls back automatically: the contact form opens the visitor's mail client with the message composed, and the newsletter stays optimistic. The live site is never broken by a missing key — setting it upgrades the experience rather than enabling it.

The alternative, which this site previously had, is a form that appears to submit and drops the enquiry on the floor. That's worse than no form at all.

## Stack

React 18 + Vite + Tailwind CSS v4, `react-router` with a central `routes.js` path map. Vercel serverless functions and Resend for forms. The original static site is archived in `legacy/`. Outstanding backend and content gaps are audited in `BACKEND_TODO.md` and marked in code with `TODO[backend/…]`, `TODO[content/…]` and `TODO[image/…]`, so nothing ships as a placeholder without a record of it being one.

**Live:** [sunabtelecomservices.com](https://sunabtelecomservices.com/) · **Source:** [github.com/NeroSiegfried/sunab-telecommunications](https://github.com/NeroSiegfried/sunab-telecommunications)
