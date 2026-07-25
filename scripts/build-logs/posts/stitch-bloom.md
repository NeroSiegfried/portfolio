---
title: "Stitch Bloom, building a shop around how the owner takes orders"
excerpt: "A small catalogue for accessories made from recycled yarn, based on one carefully chosen reference and an order flow that ends in email."
series: portfolio-projects
publishedAt: 2026-06-01
---

## What the owner needed

Stitch Bloom is a small accessories business that makes bags, sleeves and smaller pieces from recycled T-shirt yarn. Sustainability is part of the product and the way the owner talks about the business. The site needed to show the work properly, explain the material choices and give new customers a useful introduction to the brand.

The owner had already looked through several website templates. They chose [Moss & Stone](https://mossandstonetemplate.framer.website/) as the complete reference they wanted me to follow. Having one selected design gave me a clear standard for type, spacing, product photography, controls and motion.

The order process was equally specific. The owner did not want to manage a stock counter after every sale, and availability often needs checking before somebody pays for a handmade item. A normal payment gateway would have created an extra system to maintain while still leaving room for incorrect stock. The agreed flow lets a customer browse the catalogue, keep products in a bag and send the order by email. The owner confirms availability, timing and payment directly.

This was one of my earlier client shops. It became a useful lesson in responsive composition and in fitting software to a small business without giving the owner routine administrative work they had already said they did not want.

## Studying Moss & Stone

I could inspect the published Moss & Stone site, though I could not duplicate its Framer project into my account. The browser became the working reference. I used screenshots for broad comparisons, then inspected the live DOM, computed styles, element bounds and transitions at several viewport widths.

The first implementation had inconsistent system-level details. Some controls were rounded, section spacing varied and the product carousel only resembled the original at a glance. I went back through the reference with measurements. I opened its menu, search and cart, added products, resized the viewport and recorded what changed.

The Stitch Bloom variables came out of that pass. Cream `#F7F2EA` carries most page backgrounds. Terracotta `#C4714A` is used for primary actions, tags and hover states. Deep brown `#2C1A0E` handles dark surfaces and active controls. Cormorant Garamond is the display face and Inter is used for utility copy. The wordmark also uses the supplied Boiling Bold and Silver South faces at larger widths, then switches to the logo asset on a small screen.

Spacing follows a 16 pixel base. Wide content is capped at 1400 pixels and shares the same page gutter, which aligns the navbar, hero, grids and footer. The visible controls use square 50 pixel cells with thin outlines. That dimension appears in the segmented navbar, carousel buttons, product actions, quantity controls and the cart close button.

The navbar is a fixed four-part bar for the menu, wordmark, search and bag. The menu panel and search panel attach directly below it, using the same outer edges and border colour. Search matches both product and collection names, focuses its input when opened and closes with the Escape key. The attached panels were important to the Moss & Stone feel. A detached popover would have changed the shape of the whole header interaction.

The same construction appears in the arrow buttons. Two identical arrows sit inside a clipped square. On hover, one exits through an edge while the other enters from the opposite side. Diagonal actions travel from the lower left to the upper right. Carousel controls use horizontal travel. Keeping that motion in a shared button stylesheet stopped each page from acquiring a slightly different arrow.

## Rebuilding the diagonal carousel

The main visual feature is the product carousel in the home hero. The active card sits in the centre. Its neighbours step up to the right and down to the left, with a smaller scale and lower opacity. The diagonal remains visible on mobile, where the cards are scaled and repositioned to fit the available width.

At a 1440 pixel viewport, the reference gave me these target measurements.

```text
active card  350 × 574 px
step         +390 px across and -100 px up
side scale   0.85
side opacity 0.5
controls     50 × 50 px
```

I converted the fixed measurements into ratios based on the width of the active card.

```js
const cardW = Math.round(Math.max(180, Math.min(cw * 0.5, 350)))
const cardH = Math.round(cardW * 1.64)
const xStep = Math.round(cardW * 1.114)
const yStep = Math.round(cardW * 0.286)
```

`cw` comes from a `ResizeObserver` on the carousel container. The calculation therefore reacts to the space assigned by its parent as well as a full window resize. On narrow screens the card width can fall to 180 pixels. The diagonal offset scales with it.

{{snippet:stitch-bloom-carousel wide}}

Five Najma products run through the hero. Five is enough to expose a common loop error. A plain subtraction of the active index can send a card all the way across the stage when the carousel moves from the last item back to the first. I wrap the relative index around the shortest side of the ring. Only the active card and the two nearest cards on either side are mounted.

The carousel advances every four seconds. A click, an Enter key press on a side card, or either navigation control selects a new item and restarts that interval. The active image links to its product page. The stage height includes both ends of the diagonal and another 72 pixels for the controls, so the upper and lower cards are not clipped.

Mobile required its own measured composition. The heading, support copy, carousel, product description and actions stack around an absolutely positioned diagonal stage. The parent measures the support copy and places the upper neighbouring card 16 pixels below it. It then grows the hero to the measured bottom of the carousel content. The composition stays recognisably the same while its surrounding copy moves into a vertical reading order.

## The bug after client-side navigation

The carousel looked correct after a hard refresh and shifted after navigating back to the home page within the app. That made it easy to miss during testing if I always opened the home route first.

The original layout code used `getBoundingClientRect()` to find the bottom of the copy above the carousel. That copy has a reveal animation built with a CSS transform. A hard load usually measured after the transform had settled. A client-side route change could measure while the copy was still moving, then keep a position that stopped being true a few hundred milliseconds later.

The layout needed the static document position. I replaced the transformed rectangle with an offset walk through the `offsetParent` chain.

```js
const getStaticOffset = (element, parent) => {
  let top = 0
  let current = element

  while (current && current !== parent && current !== document.body) {
    top += current.offsetTop
    current = current.offsetParent
  }

  return { top, bottom: top + element.offsetHeight }
}
```

The measurement waits for `document.fonts.ready`, since Cormorant Garamond and its fallback have different metrics. It then waits for one animation frame so the carousel cards have been painted. The same calculation now runs with settled type and static offsets after a hard load, an in-app route change and a resize.

## One catalogue for the whole site

Product photography arrived in stages. I moved the catalogue into `products.json` so the site would not need a component edit for every new product or photograph. The current file contains eight products across the Najma Collection, Accessories and Gadget Sleeves.

Each record can hold its name, price, measurements, weight, description, available colours, customisation status and badge. Images follow a prefix and count convention. A record with `najma-shoulder` and an image count of two resolves to `najma-shoulder-1.jpeg` and `najma-shoulder-2.jpeg`. Adding another photograph normally means adding the file and increasing the count.

Colourways have their own prefix and count. The Najma Handbag has no base image sequence, so the data adapter uses the first colourway as the default gallery. Per-image focal points are available for photographs that need a particular portrait crop.

That data powers the home carousel, category sections, bestsellers, the shop, search, product detail pages and the bag. The shop can show all products or filter by collection. Collection sections have anchors, which lets a category link open the shop at the corresponding group. Product pages show the gallery, dimensions, weight, delivery information and customisation status.

The image components fall back to a supplied product placeholder if a catalogue photograph fails. This kept late photography from breaking the product grid while the owner was still assembling the final set.

## The bag and the email handoff

The bag is held in React context and written to `localStorage`, so it survives a refresh. Products are keyed by product ID. Adding the same product again increases its quantity. The drawer shows each line, the subtotal, quantity controls and a remove action.

The final button calls `buildOrderEmail()` and opens the visitor's mail client. The generated message contains the product name, quantity and price for each line, followed by the subtotal and a request to confirm availability and payment. Individual product pages also offer a direct email enquiry, and the shop links to the business Instagram account for customers who prefer a direct message.

There is no payment SDK and no inventory service. That matches the owner's process. The email remains the point where they check whether a piece is still available, agree a lead time for a custom item and send payment details.

One part of the current implementation needs a follow-up. Selecting a colourway changes the gallery, though `addItem(product)` passes only the base product into the bag. The bag key is the product ID, and the generated email does not contain a colourway. Two colourways of the same handbag also collapse into one line. The next revision should pass a variant ID and label into the cart item, key a line by both product and variant, and include that label in the email.

The screen currently lets a customer make a selection that the order message does not retain. Until the cart model changes, the email is a product-level request and cannot be treated as a complete record of the selected configuration.

## Brand content and unfinished media

The home page introduces the Najma collection, product categories, bestsellers, the company story and its sustainability principles. The About page goes further into recycled textiles, production and the owner. Contact keeps email, phone and Instagram easy to reach. Page titles, descriptions, canonical links and social metadata update by route.

The real product photographs and the founder portrait at `CEO.JPG` are present. Four planned editorial assets are still absent from the production source.

```text
hero-video.mp4
about-hero.jpg
about-craft.jpg
brand-story.jpg
```

The home hero falls back to its deep brown surface and overlay when the video cannot load. The two missing About images fade to zero opacity. The missing home story image is removed from display. Those fallbacks keep the layouts usable, though the empty media areas are visibly less complete than the intended pages. The remaining lifestyle photography still needs to come from the client.

The cookie banner also deserves a precise description. It stores whether the banner was accepted or declined. The bag writes to `localStorage` independently of that choice, so the banner is a preference notice and does not gate browser storage.

The newsletter form is prepared for Web3Forms, though the access key is empty in the current source. In that state it saves the submitted address to the visitor's own browser and shows the success message. It does not deliver a subscriber record to the owner. That integration must be configured before the form can serve as a working customer acquisition channel.

Scroll reveals use `IntersectionObserver`. The current stylesheet has no reduced-motion rule, which remains an accessibility task.

## Publishing on GitHub Pages

The React app uses `HashRouter` and is published from the `docs` directory on the main branch. Hash routing lets product and content routes work on GitHub Pages without server rewrite rules. Cloudflare handles the custom domain.

The custom domain exposed an asset-path problem during the first deployment. The build had been configured for a repository subpath, while `thestitchbloom.com` serves the application from `/`. Vite now uses `/` as its base, and dynamic public media goes through a small `assetUrl()` helper so paths resolve consistently.

The commit history also records several rounds of creating, deleting and restoring `CNAME`. The domain file lives inside the same generated directory that receives the build. Putting the source copy in `public/CNAME` makes Vite include it in the build output, and the current repository keeps a copy in `docs/CNAME` as well.

Later fixes covered mobile section spacing, the founder image, page metadata and a bestsellers grid that retained its desktop column rule at small widths. The most useful deployment fix was the carousel route-return bug, because it required testing navigation sequences instead of testing each URL in isolation.

## Where I would continue

The immediate work is clear. The four editorial media files need final client photography. The variant must become part of each bag line and order email. The newsletter needs a working destination. A reduced-motion mode should disable or shorten the reveal and carousel transitions.

I would also keep the same process for any future visual revision. The reliable parts of this build came from measuring the chosen reference and turning its repeated decisions into variables and shared components. That gave the owner the single design they had selected while leaving the content, catalogue and order process specific to Stitch Bloom.

## Stack

**Client** React 19, Vite, React Router 7 and component-level CSS

**Catalogue** JSON records with a small image and collection adapter

**State** React context with bag persistence in `localStorage`

**Hosting** GitHub Pages from `docs`, Cloudflare and a custom domain

**Live** [thestitchbloom.com](https://thestitchbloom.com/) · **Source** [github.com/NeroSiegfried/stitch-bloom](https://github.com/NeroSiegfried/stitch-bloom)
