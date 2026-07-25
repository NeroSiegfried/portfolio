---
title: "Sunab Telecommunications, designing around an invisible service"
excerpt: "A launch-ready site for an interconnect business, developed through a Relume prototype, a detailed study of Amazon Leo, and several rounds of visual and technical revision."
series: portfolio-projects
publishedAt: 2026-07-09
---

Sunab Telecommunications Services was preparing to enter the interconnect business. The client had a logo, a board of directors, basic company information, and a clear need for a credible public presence before operations began. I had room to decide how the website should look and work, which made the design process unusually open.

| Project | Detail |
| --- | --- |
| Client | A new Nigerian telecommunications interconnect business |
| Main work | Website, content structure, visual direction, business email setup |
| Initial tools | Relume, React loaded in the browser, Tailwind CDN |
| Final build | React 18, Vite, React Router, Tailwind CSS 4 |
| Delivery | Vercel, Cloudflare, Microsoft 365, Resend |

## The business and the launch brief

Sunab operates in a part of telecommunications that most people use without seeing. Interconnect services help calls move between operator networks. The work includes routing, switching, traffic records, settlement, collocation, and support between carriers.

That made the content problem different from a consumer telecoms website. There was no handset, retail bundle, or familiar app screen to place at the centre of the design. A visitor needed to understand what Sunab did, why an operator would speak to them, who was responsible for the company, and how to start a technical conversation.

The client wanted the site ready for the start of the business. They also wanted company email accounts. Microsoft 365 suited that second requirement because Office was already part of how they intended to work. I treated mail as a separate workstream. Domain records and staff accounts were configured around Microsoft, while the website form provider handled automated enquiries.

I had broad freedom over the site. The client supplied the formal information and reviewed each round, while I made most of the calls on page structure, photography, colour, type, and motion. They were happy with the final result after several iterations.

## Starting with Relume

Relume gave me the first sitemap and section plan. The initial material covered Home, About, Network, Services, Contact, and legal pages. It also gave the project an early token set and enough repeated components to test the content at realistic page lengths. I used Claude Code through the implementation and later refactors.

The first implementation was deliberately quick. It loaded React, Babel, and Tailwind from public CDNs, then transpiled JSX in the browser. That helped while the site was still a prototype, although it was a poor production arrangement. Every visitor would have downloaded development tooling and paid the cost of compiling the interface again.

I moved the project to React 18 and Vite once the page plan was stable. React Router took over navigation, shared content moved into data modules, and the old pages stayed in a `legacy` folder as a record of the first direction. The production bundle could then be minified, split, and cached normally.

The migration also made later design work easier. A section could be rebuilt once and checked across every route. Metadata, route definitions, social links, calls to action, and enquiry topics no longer depended on copies scattered through separate HTML files.

## Why the first visual direction stopped working

The early site used Madison blue, bright orange, jade green, purple, and Montserrat. It had all the expected corporate sections and it rendered correctly. It still felt flat.

Most pages repeated the same card grids against the same dark blue. The accent colours appeared without a clear job. Images occupied similar boxes from one section to the next. Adjusting a margin or replacing one card style did not solve the larger pacing problem.

Further polishing would only have made that version more consistent. The overall direction still felt flat, so I stopped and looked for a better structural reference.

I found it in the Amazon Leo site. What interested me was the page rhythm. Large statements, restrained text fields, full-width photography, contained image plates, and dark sections followed one another with enough variation to hold a long technical page together. The floating pill navigation also stayed compact without looking like a generic header.

I captured Leo pages at phone, tablet, desktop, and ultrawide widths. I recorded computed tokens, layout measurements, navigation frames, reveal timing, and the behaviour of full-bleed images. The project still contains that research under `.leo-research`.

My first Leo-informed pass repeated the visible motifs and missed the timing and alternation that made them useful. I went back through the captures frame by frame and rebuilt the section sequence, navbar entrance, and reveal timing from those observations. Sunab kept its own identity throughout. Leo gave me a practical reference for scale and pacing.

## Building the final palette from the logo

The client logo gave me the colours that mattered. The final system centres on deep blue `#090673` and Japanese laurel green `#088C1C`, with lighter and darker steps for each. Inter and Roboto replaced Montserrat.

Each section declares a scheme. That scheme provides its background, text, border, button text, and active accent. Components read those roles instead of naming colours directly.

{{snippet:sunab-scheme-cycle wide}}

The available surfaces include white, pale blue, pale green, full blue, and a near-black blue for the deepest sections. Green marks active states and key actions on dark backgrounds. Deep blue performs the same job on light backgrounds.

This solved two practical problems. A component can move between sections without carrying a second set of overrides, and a new page is less likely to introduce another almost identical blue. It also gave the pages a predictable rhythm. Consecutive sections no longer merge into one long field.

## Removing content that had no source

One design pass contained plausible material that had not come from the client. It included operator testimonials, performance numbers, a larger company timeline, awards, and staff detail that looked reasonable in a template.

I removed it.

The published site keeps the information I could verify from the supplied material. That includes the company identity, 2022 formation date, Abuja location, NCC licence information, the board, and the QIDPR material around quality, integrity, dependability, professionalism, and respect.

This reduced some sections and left fewer easy opportunities for impressive numbers. It also made the site more credible. A new business gains nothing from statistics that cannot be defended when a carrier asks where they came from.

I kept a backend and launch checklist for information that still needed operational confirmation. Where an email address, endpoint, social account, or formal document was not ready, the interface either hid it or used an honest fallback.

## Alternating image fields

The final page system alternates three kinds of visual space. Some images run edge to edge. Some sit inside a contained plate. Some sections use colour and type without photography.

The contained treatment is handled by a reusable `ShowcaseCard`. Its image and copy animate independently. The image opens through a clip path and has enough scale for a small parallax movement without exposing an empty edge.

The first timing sequence waited for the image to open before bringing in the words. It looked hesitant. I recorded the sequence and moved the copy entrance forward so it begins while the image still has roughly nine percent of its inset remaining. In the component, that meant reducing the delay from 420 milliseconds to 200 milliseconds.

Several long sections use native scrolling as the input for a pinned sequence. Services benefits, the service process, and the About page QIDPR section map progress through a tall wrapper to an active item. A `requestAnimationFrame` loop keeps the update separate from raw scroll events. Mobile receives a simpler linear arrangement where a pinned desktop composition would consume too much height.

The image brief became part of the implementation. Every slot has a subject, crop, aspect ratio, and purpose in `images.md`. That prevented every search from returning another generic server rack.

The final optimisation pass reduced the image library from about 104 MB to 16 MB. Large source files remain available, while the site receives delivery versions sized for their actual use.

## The navbar begins as a small mark

The navbar carries more of the site’s personality than the earlier post described.

On the first page load, the white shell starts as a tiny clipped shape in the centre of the viewport. It grows vertically into a narrow pill, then stretches horizontally into the complete navigation. The brand, route links, Legal control, and contact action stay hidden while the shell develops. They enter from left to right on staggered delays once there is room for them.

The entrance runs once per application session. A module-level flag records that it has completed, so moving between routes does not replay a launch animation every time.

After the entrance, the shell responds to scroll direction. It leaves the viewport while the visitor moves down and returns when they move up. The threshold avoids reacting to tiny trackpad changes, and the first section has enough spacing that the pill never covers its heading.

### Making Legal part of the same object

The desktop Legal menu is attached to the pill. JavaScript measures the trigger and shell after opening and when the viewport changes. The panel meets the lower edge, loses its top border and top corner radii, and suppresses the shadow at the join.

A 140 millisecond hover bridge keeps the menu open while the pointer crosses from the trigger into the panel. Without that small delay, a one-pixel gap was enough to close it.

The result reads as the navbar stretching downward. There is no second floating box beneath it.

### The same rule on mobile

The mobile route list is rendered inside the shell. Opening the menu increases the height of the existing pill while its contents are clipped. The outer form remains continuous and the links appear inside it.

This is the same interaction idea I later used while developing LoopBridge’s expanding navigation. The layouts are different, but both avoid dropping an unrelated panel beneath a carefully shaped header.

## Rebuilding the supplied mark

The available logo assets were too rough for a crisp header and favicon. I recreated the mark as SVG from the supplied reference.

The drawing uses four round-capped signal arcs, a two-facet green tower that also reads as an upward arrow, and a small yellow beacon. Light and dark uses share the same paths. Only the surrounding colour treatment changes.

This kept the identity consistent at favicon size, in the navigation, and in the footer. It also removed the blurred edge that appeared when the original raster mark was scaled on a dense screen.

## Scroll motion and responsive behaviour

Most section entrances use `IntersectionObserver`. Copy rises a short distance and images open through their masks. `prefers-reduced-motion` removes those transitions and exposes the content immediately.

The pinned cycles need more care because they represent progress through actual content. Their wrapper height determines how long each state remains readable. I tuned desktop and mobile separately and kept the current heading attached to the card sequence until the last item settles.

The About page and Services page use the same progress helper with different content. That shared implementation matters because the early versions had slightly different thresholds and felt unrelated.

Full-bleed images also use restrained scale movement. A small Ken Burns effect keeps a long hero from feeling static, while explicit object positions protect important parts of each crop at phone and tablet widths.

## Five strips between routes

Client-side route changes were much faster than the rest of the interface. I added a transition built from five viewport strips.

The transition clones the outgoing page, divides it into horizontal slices, and places the incoming route underneath. The slices leave from bottom to top with a 50 millisecond stagger. Their travel lasts 560 milliseconds.

All five strips move in the same direction during one transition. The next navigation reverses that direction. The change avoids a repetitive wipe while keeping the movement easy to follow.

The navbar is outside the captured page. It stays in place while the route moves beneath it. The new page scrolls to the top immediately before its reveal logic begins. Smooth scrolling at that point caused hidden sections to pass through the viewport and activate observers before the user saw them.

Reduced-motion visitors get a direct route swap. There is also a completion fallback, so an interrupted animation cannot leave the old page covering the new one.

## Website enquiries and Microsoft 365

Microsoft 365 handles ordinary company email. Resend handles website-generated messages. Keeping those jobs separate makes the setup easier to reason about.

The contact forms post to Vercel functions. They validate the submitted fields, include a honeypot, and send to the configured business inbox. Calls to action can add a topic to the URL, which prepares the contact form for the service the visitor was reading.

If the Resend variables are missing or delivery fails, the browser opens a prepared email in the visitor’s mail client. The same subject and message remain visible, and the enquiry can still reach the Microsoft 365 address.

The newsletter endpoint currently emails the team when somebody submits an address. It does not maintain a subscriber database or pretend to be a campaign platform. If Sunab begins publishing regularly, that part should move to a mailing product with confirmed opt-in, list management, and unsubscribe handling.

## Shipping and checks

Vercel builds the Vite application and serves `dist`. The SPA rewrite sends normal routes back to the app shell while preserving `/api` for the serverless handlers. Cloudflare sits in front of the custom domain.

I checked the main routes at phone, tablet, desktop, and ultrawide widths. I also tested the navbar entrance only on a clean session, the Legal bridge with pointer and keyboard input, route transitions with reduced motion, and form fallback with the server variables removed.

The project finished with a much clearer visual system than the first build. The early version was still useful. It established the content and exposed which parts of the layout had no rhythm. The second research pass gave me enough evidence to rebuild the system from its foundations.

## What I would change next

I would complete the photography plan before the first visual build. Image subject and crop are structural on this site, so placeholders influenced too many early decisions.

I would also connect newsletter submissions to a proper consent-based mailing service if the business decides to publish updates. The current notification endpoint fits a launch site, but it is not a long-term mailing system.

The main design decision still holds. The Amazon Leo research supplied a useful model for pacing and behaviour. Sunab’s own logo, content, and business constraints determined the finished site.

## Stack and links

**Client** React 18, Vite, React Router, Tailwind CSS 4

**Motion** CSS transitions, `IntersectionObserver`, native scroll progress, `requestAnimationFrame`

**Forms** Vercel functions, Resend, email-client fallback

**Business email** Microsoft 365

**Hosting** Vercel, Cloudflare

**Live** [sunabtelecomservices.com](https://sunabtelecomservices.com/) · **Source** [github.com/NeroSiegfried/sunab-telecommunications](https://github.com/NeroSiegfried/sunab-telecommunications)
