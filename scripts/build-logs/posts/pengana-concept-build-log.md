---
title: "Pengana Concept — One Component System, Four Businesses"
excerpt: "A holding company with three businesses under it and a fourth alongside. The interesting problem wasn't building four sites — it was building one, and making it change its mind about who it is."
series: portfolio-projects
publishedAt: 2026-07-25
---

## The brief, and the constraint hiding inside it

Pengana Concept Limited is a family-owned Nigerian holding company. Under it sit **Pengana Properties** (development, sales, leasing and lettings, management, short-lets and serviced apartments — Jos), **Tishino Ventures** (staple agriculture: grains, legumes, roots and tubers, with livestock and poultry as growth areas — Abuja), and **Sunab Telecoms Services**, which has its own board, its own branding and [its own website](https://sunabtelecomservices.com/).

So the first question wasn't visual. It was structural: is this one site, two sites, or four?

One site won, because the board is the same people and the story is the same story. But the brief carried a constraint that decided almost every technical choice after it:

> "I plan for every section (concepts, properties, tishino) to have their own colour scheme and so you should think about the variables and styling with that in mind. It should just be as easy as swapping the palette."

Paired with: HTML for structure, CSS for styling, JS for behaviour, in separate files. No inline styling. And — importantly — *don't invent new components*; repurpose the ones already there.

That is a spec for a token system, whether or not it says so.

## One attribute, four businesses

Every colour on the site resolves through three semantic tokens: `--deep`, `--accent`, `--pale`. No component knows a hex code. The only thing that does is a four-block stylesheet keyed on a `data-site` attribute, and the router sets that attribute from the current path.

Switch business, and the header, the context row, the eyebrows, the rules, the buttons, the image washes, the map marker and the footer all move together — because none of them were ever told what colour to be.

{{snippet:pengana-palette-swap}}

```css
[data-site="concept"]    { --accent: #456079; --deep: #101b26; --pale: #dfe7ed; }
[data-site="properties"] { --accent: #9a6848; --deep: #281b15; --pale: #eadfd4; }
[data-site="tishino"]    { --accent: #617149; --deep: #1c2417; --pale: #e3e4d3; }
[data-site="sunab"]      { --accent: #3f4fb0; --deep: #0b1230; --pale: #d9def2; }
```

The payoff isn't the colour. It's that `data-site` **does not fork the component system**. There is one card, one hero, one split-story block, one contact form. A fourth business would be four lines of CSS and a route.

## Shape language: never a plain rounded rectangle

Early on the feedback was blunt — the site looked fine and read as *plain*. A business site, but one that should read as best-in-class.

A lot of that came down to shape. Every image was a rounded rectangle with the same radius on all four corners, which is what every template ships with and what nothing memorable does. The fix was a rule: **one corner gets an exaggerated treatment, the other three stay razor sharp.**

{{snippet:pengana-shape-language}}

Two treatments, one rule. The exaggerated radius is the workhorse — and because it's a `border-radius`, the card still clips its own overflow, so an image that scales up on hover stays inside the shape. The chamfer is the accent, reserved for the deliberate two-panel Properties composition. It needs a `clip-path`, which beats any `border-radius`, so it has to be declared last in the file — a small ordering constraint that's worth a comment in the stylesheet rather than a rediscovery in six months.

## The button that took three commits

This is the part of the project I'd point at if someone asked what "interaction design" actually costs.

The ask was specific: the circular arrow should start on the **left**, and on hover travel to the right and rotate to point straight ahead. The label should travel with it — the visible copy exiting past the right edge while a second, identical copy sweeps in from the left to replace it. A conveyor, not a cross-fade.

Here is every version, live. Hover each one.

{{snippet:pengana-button-v1|pengana-button-v2|pengana-button-v3 wide}}

The interesting failure is v2. It looks like it satisfies the brief — there *are* two label copies, the arrow *does* travel — but the labels fade in place while the container slides. The motion reads as a swap, not as travel, and the spring easing on the arrow overshoots hard enough to feel like a bounce rather than a settle.

v3 changes three things:

- both label copies get their own `transform` and move **together**, in the same direction as the arrow, with the parent no longer moving at all;
- the waiting copy parks off the left edge at `translateX(calc(-100% - var(--icon-reserve) - 6px))` and lands in the *mirrored* slot — shifted left into the space the arrow just vacated, rather than colliding with where it parked;
- the easing softens from `cubic-bezier(0.34, 1.4, 0.5, 1)` to `cubic-bezier(0.32, 1.12, 0.52, 1)` — a hint of settle instead of a recoil.

Nothing fades. The button clips its overflow and the labels sweep the entire surface.

Same for the icons, incidentally: one diagonal `Arrow` and one `Caret` component drive every arrow and caret on the site. The arrow points up-right at rest and rotates 45° on hover; the caret points down and flips 180° when a panel opens. Motion lives in the parent's CSS, never baked into the SVG — so a button, a card and an in-copy link all animate the same mark differently without three copies of it existing.

## Three areas of focus

The home showcase is three equal panels. Hover one and it grows while the other two shrink and its summary fades up. It's the section that took the most iterations to get right responsively — the first version squashed into an unreadable row on phones, with a coloured div awkwardly overlapping the image.

{{snippet:pengana-showcase wide}}

The whole expand/collapse is two rules: the container sets **every** child to `flex-grow: 0.68` on hover, then the hovered child overrides to `2.35`. No JavaScript, no state, no measurement. Below 768px a media query turns it into a single-column sequence and reveals every summary — because on a phone, hover isn't a thing and hiding the content behind an interaction you can't perform is just hiding the content.

## Navigation for a three-business group

The original had a header menu *plus* a competing per-business tab bar, which is two navigation systems arguing. It got replaced with one:

- **A businesses mega-panel.** The header's "Businesses" control opens a single full-width panel showing all three businesses with *every* sub-page, each column in its own accent, plus an "All businesses" link. It doesn't repeat About/Contact — those stay as their own header links.
- **A context row that is part of the header.** On a business page the header grows a second row sharing its colour and frost: `Pengana Group / Business` on the left, that mini-site's pages on the right, the active one underlined in the business accent. It's the same navbar, not a separate strip.
- **Below 960px**, the menu becomes a full-screen editorial drawer and the context row's links scroll horizontally.

One bug from this worth writing down. The header is `position: fixed` and frosts on scroll. Put `backdrop-filter` on the header itself and it becomes a **containing block for its own fixed-position children** — so the moment it frosted, the mega-panel and the full-screen menu started clipping to the header's 72px height. The fix is to move the frost to a pseudo-element:

```css
.site-header { position: fixed; inset: 0 0 auto; z-index: 1200; }

/* Frost lives on a pseudo-element so the header never becomes the containing
   block for its fixed panels (mega + mobile menu). */
.site-header::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: color-mix(in srgb, var(--paper-bright) 92%, transparent);
  backdrop-filter: blur(18px);
}
```

## The logomark: three attempts to learn one lesson

I was given an SVG and asked for a mark built on the same geometry. I read that as "make it cleaner." It was not that.

{{snippet:pengana-logo-v1|pengana-logo-v2|pengana-logo-v3}}

Attempt two is genuinely good work — the geometry was decoded from the original's path coordinates rather than eyeballed, every long edge is exactly 45°, the three gaps are equal by construction, and exactly five of the fourteen corners are rounded because that's what the original does. It was still wrong, because "close to the client's mark" is a worse outcome than "the client's mark."

What shipped is the supplied artwork's exact path data with one change: `fill="currentColor"`. That single edit is why the same four paths serve the transparent header, the frosted header, the dark footer, the full-screen menu and the favicon, each inheriting the right colour from its context.

## Images: a build step, not a folder

The site is image-led, so images are the performance budget. `scripts/gen-images.mjs` reads masters from `source-images/` (never modified) and writes into `public/images/` plus a manifest:

- per responsive width, a `.webp` and a progressive `.jpg` fallback served via `<picture>`;
- an inlined ~24px LQIP painted as the element's background, so something sharp-ish appears instantly and the real image loads on top;
- width ladders capped at roughly **2× the largest display size** and never upscaled past the master — `hero` gets `[640, 1024, 1440, 2000]`, board portraits get `[300, 600]`.

Because the manifest is keyed by the stable `/images/…` path, swapping concept photography for approved production photography is a file overwrite. No renaming, no code change.

## Two bugs worth keeping

**A 200px gap that wasn't there.** A large gap sat under one section's image. The obvious suspect was leftover markup from an image that had been removed. It wasn't. The container sized itself with `min-height`, which is not a *definite* height — so the image's `height: 100%` had nothing to resolve against and silently fell back to the image's own 1.5:1 intrinsic ratio, rendering 150–250px shorter than its container. Fixed with the `position: absolute; inset: 0` pattern already used by every other cover image on the site, which takes its size from the container box directly instead of percentage-height resolution.

**A white flash at the edges of a dark page.** Overscrolling past the top or bottom briefly revealed white. `overscroll-behavior` was never set, and `<html>` had no background of its own — only `<body>` did. So the rubber-band was exposing the root element. Disabling the bounce handles it where supported; giving `<html>` a `var(--deep)` background covers older Safari, which bounces the root scroller regardless.

## What isn't on the site

The part I'd defend hardest. The previous build was full of numbers: property counts, apartment counts, workforce figures, hectares, harvest tonnage, partner counts, founding dates, project completion dates, named properties with amenities and availability, testimonials, guest reviews, a seeded newsroom, social links pointing at `#`, and contact forms that appeared to submit but had no endpoint.

None of it was true. All of it is gone, along with the Careers and News routes, which were removed rather than left online with demo content.

The rule the site runs on now: **an empty or unconfirmed dataset hides its section or its route.** It is never filled with sample data to complete a layout. `CONTENT-NOTES.md` in the repo tracks what still needs confirming from the business before launch — exact legal names, the public spelling of every director's name, verified recipient inboxes, real photography.

The contact form follows the same principle. It posts to a Vercel serverless function that routes each enquiry to the right business inbox via Resend, keyed on the stable `business` id. Until `RESEND_API_KEY` is configured the function returns 5xx and the form **transparently falls back to opening the visitor's mail client** — so an enquiry is never silently swallowed by a form that only pretends to work.

## Stack

React 18 + Vite, React Router, plain CSS in four layers (`fonts` → `theme` → `base` → `components`), Leaflet with a keyless CARTO basemap for the office maps, `sharp` for the image pipeline, Resend behind a Vercel function for enquiries, deployed on Vercel behind Cloudflare DNS.

No CSS framework, no component library, no inline styles. Roughly 4,300 lines of stylesheet doing what a design system does.

**Live:** [penganaconcept.com](https://www.penganaconcept.com) · **Source:** [github.com/NeroSiegfried/pengana-concept](https://github.com/NeroSiegfried/pengana-concept)
