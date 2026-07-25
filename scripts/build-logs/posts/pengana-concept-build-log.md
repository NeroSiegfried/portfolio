---
title: "Pengana Concept — One Component System, Four Businesses"
excerpt: "A family holding company with three businesses under it and a fourth alongside. I didn't need four sites. I needed one that could change its mind about who it is."
series: portfolio-projects
publishedAt: 2026-07-25
---

## The brief

Pengana Concept Limited is a family-owned Nigerian holding company, run out of Abuja. Under it sit **Pengana Properties** (development, sales, leasing and lettings, management, short-lets and serviced apartments, out of Jos), **Tishino Ventures** (staple agriculture — grains, legumes, roots and tubers, with livestock and poultry as growth areas), and **Sunab Telecoms Services**, which has its own board, its own branding and [its own website](https://sunabtelecomservices.com/).

I started before there was any code, by asking for a sitemap and a set of Relume prompts I could actually use. That produced its own lesson: the first set came back with section names that don't exist in Relume, which is useless when the point is to paste them into Relume. Ask for hero sections, feature lists, logo lists — the things that are actually on the shelf — and then describe what each one does.

Two decisions from that stage shaped everything after:

**One site, not four.** The board is the same people and the story is the same story. Sunab is the exception — it's a separate company with a separate identity, so it gets a landing page inside the group system and then hands off to its own site. The important part is symmetry: if the other subsidiaries get landing pages, Sunab gets one too.

**A business is not a page.** The first structure gave each subsidiary a single page, and it didn't do any of them justice. Each of these is a real business with its own services, its own offices and its own audience. Properties and Tishino each got a proper mini-site.

I also had to check what Tishino actually did. I thought it was something to do with furniture. It's agriculture.

## The constraint that decided the architecture

When I asked for the React conversion, I asked for a specific thing:

> I plan for every section (concepts, properties, tishino) to have their own colour scheme and so you should think about the variables and styling with that in mind. It should just be as easy as swapping the palette.

Alongside: HTML for structure, CSS for styling, JS for behaviour, in separate files. No inline styling. Intuitive class and variable names. And **do not make components of your own** — there were already more than enough on the site, and anything needed could be repurposed from elsewhere.

That's a spec for a token system whether or not it says so. Every colour on the site resolves through three semantic tokens — `--deep`, `--accent`, `--pale`. No component knows a hex code. The only thing that does is a four-block stylesheet keyed on `data-site`, which the router sets from the current path.

{{snippet:pengana-palette-swap}}

```css
[data-site="concept"]    { --accent: #456079; --deep: #101b26; --pale: #dfe7ed; }
[data-site="properties"] { --accent: #9a6848; --deep: #281b15; --pale: #eadfd4; }
[data-site="tishino"]    { --accent: #617149; --deep: #1c2417; --pale: #e3e4d3; }
[data-site="sunab"]      { --accent: #3f4fb0; --deep: #0b1230; --pale: #d9def2; }
```

Switch business and the header, the context row, the eyebrows, the rules, the buttons, the image washes, the map marker and the footer all move together, because none of them were ever told what colour to be. There is one card, one hero, one split-story block, one contact form. A fourth business would be four lines of CSS and a route.

The footer was a specific fix here. It used to keep the group navy on every page regardless of which business you were reading, which broke the illusion immediately. It now reads `data-site` from the route like everything else.

## Making it stop looking like a template

The structure was right well before the site was good. My own summary at that stage: it looks fine and it reads as plain. It's a business site, but I wanted it to read as one of the best of the best with no punches pulled.

I gave a set of reference sites for this — Haven, Ambience, Ardene, Furnexa, Atelier Norr, Stayvo, Mechagro, Verger, Aurelie Studio, Acre Studios — and asked for them to be looked at again rather than taken on trust from whoever wrote the first style guide.

### Shape

Every image was a rounded rectangle with the same radius on all four corners. That's what every template ships with and what nothing memorable does. The rule became: **one corner gets an exaggerated treatment, the other three stay sharp.**

{{snippet:pengana-shape-language}}

Two treatments. The exaggerated radius is the workhorse, and because it's a `border-radius` the card still clips its own overflow, so an image that scales on hover stays inside the shape. The chamfer is the accent, reserved for the deliberate two-panel Properties composition — it needs a `clip-path`, which beats any `border-radius`, so it has to be declared last in the file.

The chamfer also had to move. On the Tishino section it was on the lower left and the text inside was being cut off by it. Upper left solved that, and it's why the rule is "one corner", not "the bottom-left corner".

### Arrows and carets

There were a lot of arrows and carets on this site and they were all pretty ugly. So they got standardised, and the spec was specific:

- arrows face the **upper right** at rest, and rotate to face right on hover;
- carets are proper full-size ones, facing down, rotating to face up when a nav dropdown is open;
- an arrow in a circle can just rotate;
- an arrow in a button with text starts on the **left** of the text. On hover the circle travels and rotates to the right, the text travels with it and out of the button, and an identical copy of the text travels in from the left to replace it. The button's colour changes too, picked to suit wherever that button sits.

One `Arrow` and one `Caret` component now drive every arrow and caret on the site. The motion lives in the parent's CSS, never in the SVG, so a button, a card and an in-copy link animate the same mark differently without three copies of it existing.

## The button that took three commits

This is the part I'd point at if someone asked what interaction design actually costs. Here is every version, live — hover each one.

{{snippet:pengana-button-v1|pengana-button-v2|pengana-button-v3 wide}}

v1 is a pill that widens its gap on hover, with a text-glyph `↗`. That's the version I complained about.

v2 looks like it satisfies the brief — there *are* two label copies and the arrow does travel — but the labels fade in place while the container slides. It reads as a swap, not as travel. The spring easing on the arrow also overshoots hard enough to feel like a bounce rather than a settle.

v3 fixes three things:

- both label copies get their own `transform` and move **together** with the arrow, with the parent not moving at all;
- the waiting copy parks off the left edge and lands in the *mirrored* slot — shifted left into the space the arrow just vacated, instead of colliding with where it parked;
- the easing softens from `cubic-bezier(0.34, 1.4, 0.5, 1)` to `cubic-bezier(0.32, 1.12, 0.52, 1)`.

Nothing fades. The button clips its overflow and the labels sweep the whole surface.

## Three areas of focus

The home showcase is three equal panels. Hover one and it grows and reveals its summary while the other two shrink. It took the most iterations of anything on the site, because the first version squashed into an unreadable row on phones with a coloured div awkwardly overlapping the image.

{{snippet:pengana-showcase wide}}

The whole expand and collapse is two rules — the container sets every child to `flex-grow: 0.68` on hover and the hovered child overrides to `2.35`. No JavaScript, no state, no measurement.

Below 768px it becomes a single-column sequence and every summary is revealed, because on a phone hover isn't available and hiding content behind an interaction you can't perform is just hiding content. When it collapsed, the overlapping panel also had to become flush with the image and take the section's background colour, with the corner nearest the centre of the image cut — so it reads as a cutout from the image rather than a box sitting on top of it.

## Navigation for a three-business group

The original had a header menu *plus* a per-business tab bar, which is two navigation systems arguing. It got replaced with one:

- **A businesses mega-panel.** The header's "Businesses" control opens a single full-width panel showing all three businesses with *every* sub-page, each column in its own accent, plus an "All businesses" link. It doesn't repeat About and Contact — those stay as their own header links.
- **A context row that is part of the header.** On a business page the header grows a second row sharing its colour and frost: `Pengana Group / Business` on the left, that mini-site's pages on the right, the active one underlined in the business accent. It's the same navbar, not a separate strip.
- **Below 960px** the menu becomes a full-screen editorial drawer, and the context row's links scroll horizontally.

One bug from this is worth having in writing. The header is `position: fixed` and frosts on scroll. Put `backdrop-filter` on the header itself and it becomes a **containing block for its own fixed children** — so the moment it frosted, the mega-panel and the full-screen menu clipped to the header's 72px. Moving the frost onto a pseudo-element fixes it:

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

## The logomark

I gave an SVG and asked for a mark built on the same geometry — same rounded edges, simpler, more symmetry, well thought-out parallel lines. That got read as "design a new logo", which is not what I said.

{{snippet:pengana-logo-v1|pengana-logo-v2|pengana-logo-v3}}

The second attempt is genuinely good work. The geometry was decoded from the original's path coordinates instead of eyeballed, every long edge is exactly 45°, the three gaps are equal by construction, and the rounding is counted rather than guessed — the small triangle's apex, each ridge's lower-left corner, and the diamond's top and bottom points. Five rounded corners, nine sharp.

It was still wrong, because being close to the client's mark is a worse outcome than being the client's mark. What shipped is the supplied artwork's exact path data with one change: `fill="currentColor"`. That single edit is why the same four paths serve the transparent header, the frosted header, the dark footer, the full-screen menu and the favicon, each inheriting the right colour from its context.

## Images

The site is image-led, so images are the performance budget. The rule I set was that compression makes **copies** — the originals are never deleted or edited — and nothing is served at more than about twice the size it's displayed at.

`scripts/gen-images.mjs` reads masters from `source-images/` and writes into `public/images/` plus a manifest: per responsive width a `.webp` and a progressive `.jpg` fallback served through `<picture>`, plus an inlined ~24px LQIP painted as the element's background so something appears instantly and the real image loads over it. Width ladders are per role — heroes get `[640, 1024, 1440, 2000]`, board portraits get `[300, 600]` — and never upscale past the master.

Because the manifest is keyed by the stable `/images/…` path, swapping concept imagery for approved photography is a file overwrite. No renaming, no code change.

## Three bugs

**A 200px gap that wasn't there.** A large gap sat under one section's image and I assumed it was leftover markup from an image I'd removed. It wasn't. The container sized itself with `min-height`, which isn't a *definite* height — so the image's `height: 100%` had nothing to resolve against and silently fell back to its own 1.5:1 intrinsic ratio, rendering 150–250px shorter than its container. Fixed with the `position: absolute; inset: 0` pattern every other cover image on the site already used.

**A white flash at the edges.** Overscrolling past the top or bottom briefly showed white. `overscroll-behavior` was never set and `<html>` had no background of its own — only `<body>` did — so the rubber-band was exposing the root element. Disabling the bounce covers most browsers; giving `<html>` a `var(--deep)` background covers older Safari, which bounces the root scroller regardless.

**The page visibly scrolled to the top on navigation**, which fought the entrance animation. Jumping instantly rather than smooth-scrolling fixes it, and it also fixes a subtler problem: during a smooth scroll the reveal observers see lower-page elements pass through the viewport and fire early.

## What isn't on the site

The part I'd defend hardest. The previous build was full of numbers: property counts, apartment counts, workforce figures, hectares, harvest tonnage, partner counts, founding dates, project completion dates, named properties with amenities and availability, testimonials, guest reviews, a seeded newsroom, social links pointing at `#`, and contact forms that appeared to submit but had no endpoint.

None of it was true. All of it is gone, along with the Careers and News routes, which were removed rather than left online with demo content.

The rule the site runs on now: **an empty or unconfirmed dataset hides its section or its route.** It's never filled with sample data to complete a layout. `CONTENT-NOTES.md` tracks what still needs confirming before launch — exact legal names, the public spelling of every director's name, verified recipient inboxes, real photography.

The contact form follows the same principle. It posts to a Vercel function that routes each enquiry to the right business inbox via Resend, keyed on the stable `business` id. Until `RESEND_API_KEY` is configured the function returns 5xx and the form falls back to opening the visitor's mail client — so an enquiry is never silently swallowed by a form that only pretends to work.

## Stack

React 18 + Vite, React Router, plain CSS in four layers (`fonts` → `theme` → `base` → `components`), Leaflet with a keyless CARTO basemap for the office maps, `sharp` for the image pipeline, Resend behind a Vercel function, deployed on Vercel behind Cloudflare DNS.

No CSS framework, no component library, no inline styles. About 4,300 lines of stylesheet doing what a design system does.

**Live:** [penganaconcept.com](https://www.penganaconcept.com) · **Source:** [github.com/NeroSiegfried/pengana-concept](https://github.com/NeroSiegfried/pengana-concept)
