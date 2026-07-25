---
title: "Pengana Concept, one group website with distinct business areas"
excerpt: "A shared website for a holding company, property business, agricultural business, and an internal Sunab overview, built from a researched editorial design system."
series: portfolio-projects
publishedAt: 2026-07-25
---

A few weeks after the Sunab Telecoms website was completed, the same client returned with a larger request. Pengana Concept needed a website for the holding company and the other businesses in the group. The work covered the group itself, Pengana Properties, Tishino Ventures, and a managed route into Sunab.

| Project | Detail |
| --- | --- |
| Client | Pengana Concept Limited and its operating businesses |
| Main work | Information architecture, visual system, website, forms, maps, image pipeline |
| Business areas | Group, property and hospitality, agriculture, telecommunications |
| Build | React 19, Vite, React Router, CSS, Leaflet |
| Delivery | Vercel functions, Resend, Cloudflare |

## One website or several

My first question was whether each business should have its own website. Cost did not force the answer. The client could have commissioned separate sites, although they felt that would duplicate work for little benefit.

Pengana Concept, Pengana Properties, and Tishino Ventures share the same board, group ownership, telephone numbers, and much of their company information. Keeping those details in separate repositories would create several copies that could drift apart. A single group site also lets a young operating business borrow context from the established group around it.

One board member preferred separate websites. The rest of the group chose one consolidated site. I kept the information architecture loose enough that an operating area can still be separated later. Properties may eventually need bookings, live availability, or a property catalogue. Tishino may eventually need produce ordering or a commercial portal. Either change would justify its own application.

For the current brief, each business behaves like a small site inside one system. Properties and Tishino have their own overview and supporting pages. Shared information remains in one place. The deployment, domain authority, forms, and maintenance work are also consolidated.

Sunab is the exception. It has a separate board, a complete website, and its own established visual identity. Pengana includes a substantial Sunab overview and then hands the visitor to the dedicated external site.

## Turning company material into a site map

The first brief contained the holding company description, shared board information, contact details, office locations, and broad notes about each business. I used Relume to test a sitemap and decide how much depth each area could support.

This stage caught an important misunderstanding. I had initially understood Tishino as a furniture business. It is an agricultural business working across staple food categories.

The later copy pass also widened its description. Rice, beans, and maize are useful examples, but repeating those three crops through every section made the company sound narrower than the supplied material. The final site includes grains, legumes, roots, and tubers, with livestock and poultry described only as future growth areas.

Properties needed similar restraint. Its confirmed scope includes development, sales, leasing and lettings, property management, short lets, and serviced accommodation. The source material did not include approved unit names, nightly rates, live availability, project counts, or guest reviews. I left those out.

I kept a launch checklist in `CONTENT-NOTES.md`. It records what is published, what was removed, and what still needs confirmation from the group. That list covers legal company-name styling, board titles, addresses, telephone lines, production photography, recipient email addresses, and exact map coordinates.

## Researching an editorial direction

The client again gave me broad control over the design. I reviewed a large group of Framer references at desktop, tablet, and phone widths, taking specific lessons from each one.

The working set included Haven, Ardene, Homy, Ambience, Mechagro, Verger, Furnexa, Stayvo, Aurelie Studio, Atelier Norr, Acre Studios, and Omnis.

Different references solved different parts of the problem.

- Haven, Ambience, and Stayvo helped with the alternation between full-width and contained sections
- Ardene, Furnexa, and Acre Studios helped with scale and asymmetric image framing
- Atelier Norr helped with thin rules, restrained navigation, and architectural structure
- Mechagro, Verger, and Omnis helped with the shift from corporate pages into agricultural material

I inspected the references in a browser and recorded gutters, type proportions, crop behaviour, panel sizes, and interaction states. Several early passes still looked like ordinary corporate templates with a large serif heading added. I discarded them.

The final direction is closer to an editorial group publication. Large type and photography establish the subject. Thin rules organise the quieter material. Full-bleed statements are followed by contained image plates and structured fields. The sequence changes enough to separate long pages without making each section a different design.

## The common design language

The system uses an eight-pixel spacing unit. Page gutters begin at 16 pixels on a phone and stop growing at 40 pixels on large screens. Major sections use fluid spacing between roughly 96 and 176 pixels.

Playfair Display handles the large editorial type. A neutral sans stack handles body copy, forms, navigation, and small labels. Eyebrows are short uppercase lines with wide tracking. Body copy usually stays between 55 and 65 characters per line.

The same rules cover the whole group. A route changes the semantic colour tokens and image set while retaining type, spacing, controls, and motion.

{{snippet:pengana-palette-swap}}

The group uses quiet blue-grey. Properties uses a warmer brown and stone palette. Tishino uses green, earth, and a small gold accent. The internal Sunab route uses a controlled blue handoff inside the wider Pengana system.

```css
[data-site="concept"]    { --accent: #456079; --deep: #101b26; --pale: #dfe7ed; }
[data-site="properties"] { --accent: #9a6848; --deep: #281b15; --pale: #eadfd4; }
[data-site="tishino"]    { --accent: #617149; --deep: #1c2417; --pale: #e3e4d3; }
[data-site="sunab"]      { --accent: #3f4fb0; --deep: #0b1230; --pale: #d9def2; }
```

The header, context row, labels, rules, buttons, image washes, map markers, forms, and footer all resolve through those roles. There is one component system and four route tones.

The first footer ignored the active route and stayed in group navy. That small inconsistency made Properties and Tishino feel as though their theme stopped before the page did. Reading the same route value in the footer closed the system properly.

## A controlled mix of shapes

The shape system changed several times. An early rule applied the same rounded rectangle everywhere. Another pass limited the design to one oversized corner and reserved chamfers for Properties.

The shipped site is more varied than that intermediate note suggests. It uses ordinary measured radii for regular surfaces, exaggerated single-corner radii for selected image cards, and angled chamfers where a composition benefits from a harder cut. Both the rounded and chamfered treatments appear across more than one route.

{{snippet:pengana-shape-language}}

The important constraint is placement. A treated corner cannot cut into copy or break an attached caption. The exact corner changes according to the image, text position, and the surface beside it.

Border radius remains useful for images that scale on hover because the element clips its own overflow. A chamfer uses `clip-path` and needs to be the final shape rule in the cascade. Ruled information grids remain square.

The shape figure now uses the treatments found in the shipped code.

## The main action button

Several early components drew their own arrows and carets. Their stroke, size, and direction varied slightly. I replaced them with shared `Arrow` and `Caret` components and let the surrounding component control the movement.

The primary text action needed more work. Its arrow begins at the left side of a pill and travels to the right. The visible label leaves with it while a second copy enters from the left and settles into the open space.

{{snippet:pengana-button-v1|pengana-button-v2|pengana-button-v3 wide}}

The first version used a text arrow and increased the gap on hover. The second moved the arrow correctly, while the labels cross-faded in place. The text appeared to be replaced mid-animation instead of moving through the control.

The shipped version gives each label its own transform. Both copies move in the same direction as the arrow. The button clips the travelling elements and uses the softer spring already present elsewhere on the site.

This is a small interaction, but it appears often enough that inconsistency would be obvious. The same arrow geometry is used in cards, line links, navigation, and the main action.

## The three-business showcase

The home page introduces Properties, Tishino, and Sunab in a row of image panels. On desktop, all three begin at the same width. Hovering or focusing one panel expands it and reveals its summary while the neighbours contract.

{{snippet:pengana-showcase wide}}

CSS manages the expansion. The parent hover state reduces each child’s growth value, then the active panel receives the larger value. No JavaScript measures the row.

Below 768 pixels, the panels become a vertical sequence. Every summary is visible because a touch screen cannot depend on hover for essential information. Captions become attached plates and take their colour from the current section.

The interaction provides a useful overview of the group before a visitor enters one business. It also shows how the shared system can give equal weight to three areas without turning the home page into a set of small cards.

## A flat header with a large menu

Pengana does not use Sunab’s pill navbar. The final header is a flat, full-width editorial bar. It is 72 pixels high on desktop and 64 pixels on compact screens.

Selected hero routes begin with a transparent header. After 18 pixels of scrolling, it changes to a paper-toned frosted bar. The frost lives on a pseudo-element so the header does not become a containing block that clips the panels attached to it.

The Businesses control opens a full-width mega panel with three columns. Each column carries its business accent, overview link, and local pages. About and Contact remain in the main header and are not repeated inside the panel.

Keyboard behaviour was part of the component from the start.

- Arrow Down opens the panel and moves focus to its first link
- Tab enters and leaves the panel in the expected order
- Escape closes it and returns focus to the trigger
- A pointer press outside closes it

Properties and Tishino add a context row to the same header. It shows the relationship back to Pengana and the current business routes. I removed an earlier `BusinessNav` component because it created a second navigation system below the first.

On mobile, the menu becomes a full-screen editorial drawer. Focus is trapped inside while it is open. The page `main` and footer receive `inert`, so keyboard and assistive-technology focus cannot move behind the overlay. The local context row remains horizontally scrollable under the main bar.

## The board across the group

The shared board is central to the reason these businesses sit together. Pengana, Properties, and Tishino read from one board data source. Sunab retains its own board and website.

The final board section uses a dark editorial field with portrait cards in a 3 to 4 ratio. Portraits begin with restrained greyscale and gain the business accent on interaction. The image scales to 1.06 inside its crop.

I centre an incomplete final row so it does not sit against the left edge. Monogram fallbacks remain available until every approved portrait has been supplied.

Keeping this data shared avoids the most likely source of content drift. A corrected name, title, or portrait changes once and appears in each relevant business area.

## Giving Sunab enough room

The first Pengana plan treated Sunab as a short overview followed quickly by an external link. I rejected that handoff after seeing it in context. It made one of the group’s operating businesses feel like a footnote.

The final route contains a carrier introduction, a network image, eight service areas, a statement section, the Reach, Reliability, and Support framework, a carrier-specific form, and a map. The external handoff comes after that material.

Sunab’s own website remains the place for its full technical catalogue and company detail. The Pengana route explains the business well enough to make the transition useful.

This is also why the internal Sunab route stays within Pengana’s broader editorial system. Copying the separate site’s pill navbar and scheme sequence would create a website inside another website. A focused blue accent signals the change without replacing the group chrome.

## Maps and enquiry routing

Office sections use Leaflet with a CARTO base map. The tiles are toned to sit with the paper background, and the marker pulse takes the active business accent.

Wheel zoom stays disabled until the map receives focus. This prevents an embedded map from taking over the page while somebody scrolls past it. Coordinates remain district-level until the client confirms exact plots, which is stated in the content notes.

Every business form reaches the same Vercel endpoint with a business identifier. The function chooses the correct recipient inbox, validates required fields, checks a honeypot, and applies a best-effort submission limit. The visitor’s email is used as `Reply-To`.

If a recipient or Resend configuration is missing, the form prepares a normal email instead of displaying a false success message. The Properties form can ask about a property or stay. Tishino can ask about produce or operations. Sunab can ask for route, destination, traffic, and support context.

That shared endpoint keeps the code small while preserving a separate operational route for each business.

## Using the supplied logomark

The logo went through two unnecessary redraws before I used the source artwork correctly.

{{snippet:pengana-logo-v1|pengana-logo-v2|pengana-logo-v3}}

The first attempt built a new geometric mountain mark. The second studied the source paths and recreated their spacing and rounded corners more carefully.

The right answer was to keep the supplied SVG path data. I changed it to `currentColor` so the same mark works in the dark hero, paper header, footer, and favicon.

The work was useful because it confirmed the geometry, but there was no reason to replace approved artwork with an approximation once the exact paths were available.

## Photography, duotone, and the delivery pipeline

The site is image-led, so I treated the image library as part of the design system. `images.md` assigns each stable path a subject, crop, and size. A replacement photograph can overwrite the same source file without changing a component.

One iteration tested duotone processing. The page alternated between the ordinary photograph and a processed version every five seconds so the client could compare them in place. The plain photography suited the final direction better, so I removed the duotone variants and the switching code.

The production pipeline keeps source masters and generates responsive WebP and progressive JPEG versions with Sharp. It also produces a small inline placeholder for the first paint.

The final run created 334 delivery files totalling about 34 MB. One 6.7 MB hero became a 255 KB delivery image at its largest required size. `srcset` gives the browser a suitable delivery source, so it never needs the original camera export.

## Motion between routes

Every route uses the same entrance family. A 620 millisecond page fade is paired with a 640 millisecond top curtain in the active business colour. Hero images settle from a 1.07 scale while the heading and supporting copy rise in sequence.

Sections use an `IntersectionObserver` reveal component. Image cards move slightly on hover and action links run the shared arrow conveyor. Reduced-motion preferences shorten these transitions to immediate state changes.

The scroll reset caused one small but visible bug. A new route could begin at the previous page’s scroll position and then move to the top during the entrance. I changed routing so the new document position is set before its reveal classes are allowed to run.

Overscroll needed a related fix. A light edge could appear beyond a dark route during elastic scrolling. Matching the root canvas to the route and constraining the transition layer removed that flash.

## Why the first portfolio captures showed `not_found`

The broken Pengana project images had a specific cause.

The site is a Vite single-page application. Client-side links worked because React Router already had the app shell. A direct request to `/about`, `/tishino`, `/properties`, or another nested route reached Vercel without a matching file and returned its `not_found` page.

The screenshot process loaded those routes directly, so it captured the hosting error instead of the website.

I added the SPA catch-all rewrite in `vercel.json` while preserving the API path. Direct routes now return the app shell and React Router renders the requested page. I then replaced the failed screenshots with real captures across wide, desktop, tablet, and mobile sizes.

The fix belonged in the deployment configuration. Correct route handling also repaired shared links, bookmarks, refreshes, and search-engine requests.

## What I would carry forward

The consolidation decision works for the current business stage. Shared company and board information has one source, each operating area has a distinct route tone, and Sunab retains its independent site.

I would settle the approved production photography and exact office coordinates earlier on a future project. Both affect composition and launch checks even when the code can accommodate replacements.

I would also keep the reference audit. Looking at a dozen sites was useful because no single template solved the whole group. The final system came from measured choices about rhythm, scale, rules, imagery, and interaction, followed by several rejected passes.

## Stack and links

**Client** React 19, Vite, React Router

**Design system** CSS custom properties, Playfair Display, semantic route themes

**Maps** Leaflet, CARTO

**Forms** Vercel functions, Resend, email-client fallback

**Images** Sharp, responsive WebP and progressive JPEG, inline placeholders

**Hosting** Vercel, Cloudflare

**Live** [penganaconcept.com](https://penganaconcept.com/) · **Source** [github.com/NeroSiegfried/pengana-concept](https://github.com/NeroSiegfried/pengana-concept)
