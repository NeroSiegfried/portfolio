---
title: "DeRivian Care, from a business plan to a working supported living site"
excerpt: "A website, identity and low-cost business setup for a new supported living provider, developed through several rounds of client and stakeholder review."
series: portfolio-projects
publishedAt: 2026-06-07
---

## The job extended well beyond the website

DeRivian Care was a newly formed supported living business in London. The client came with a business plan and a set of example websites. Between them, those sources contained most of the information they expected to publish. They did not yet provide a clear hierarchy, a settled vocabulary or a practical list of pages.

The work also included the parts of a new company that sit around its website. The client needed a logo, a design system, letterhead templates, domain email addresses and help opening a business account. Keeping the running cost low was their main constraint. I considered that when choosing every service, including the ones that would remain after I handed the project over.

I used Relume to organise the site and explore its structure. Canva was suitable for stationery that the client could edit later. Zoho gave them business email at a lower monthly cost, while Revolut met the business account requirement. I created the material I could prepare myself and walked the directors through anything that required their identity checks, acceptance of terms or direct authorisation.

There were several people involved in approvals. Requirements sometimes arrived through different conversations, and a decision accepted by one person could return for another round when somebody else saw it. I broke the work into small reviewable parts and kept a record of settled names, colours and service terms. That gave each review a clear starting point. It still took several rounds, but everyone involved was happy with the finished direction.

## Making a brief from the source material

The business plan was useful for understanding the company. The reference sites were useful for seeing what families, residents and professional referrers expect to find. Neither source should be copied directly, so I mapped the information to the questions each visitor would bring.

A prospective resident or family member needs a plain explanation of the service and a simple way to start a conversation. A commissioner or social worker is looking for eligibility, support areas, governance language and a referral route. Those needs shaped the sitemap and the calls to action.

I worked through early sitemap ideas with Gemini and Claude, then used Relume to turn the agreed structure into section prompts. Responsive concepts were explored in Claude Design and Claude Code. The exported design bundle was useful as a specification for spacing, colour and component behaviour, though the production site was rebuilt from that material.

My first full preview made an important mistake. The client had always described DeRivian as a supported living business, but I interpreted parts of the example material as domiciliary care and let that language spread through the first build. The client corrected it as soon as they reviewed the site.

The commit history later called that pass a rebrand. It records a correction to my implementation. The client had asked for supported living from the start.

Supported living and domiciliary care describe different arrangements. In supported living, a person has their own tenancy and receives help with daily life, skills and access to the community. Domiciliary care usually describes visits that deliver care in somebody's home. Once the service model was clear, I rewrote the pages from the beginning and made a small terminology guide for future content.

- Use **supported living**
- Use **support workers**
- Refer to **residents** or **the people we support**
- Describe an individual **support plan**
- Keep examples around ordinary life, independence, practical skills and community access

The same correction changed the image brief. Clinical care photography and pictures that centre the worker give the wrong account of the service. The final subjects are domestic and familiar, such as cooking, shopping, using transport, meeting people and spending time at home. A support worker can appear where the context calls for one, but the resident remains the subject.

I documented each numbered image slot in `IMAGES.md`, including its page, aspect ratio, subject and intended size. Images are assigned once across the main site so the same photograph does not keep returning in unrelated sections.

## The identity and design system

The website, logo and stationery had to look like parts of one business. I used the same type and colour decisions across the web design and the Canva letterhead templates, then supplied logo variants that worked on light and dark backgrounds.

Raleway is used for headings and Inter for body text. The main brand colours are Mirage at `#1b263b`, Burnt Sienna at `#e86a4a` and Fountain Blue at `#5cc4a7`. The site also uses white, near black and light grey section schemes. These colours sit in CSS custom properties with the type scale, spacing and common surface values.

The components are fairly direct. Buttons and form controls have square corners. Cards and images use an eight pixel radius. Fine rules separate sections and the colour schemes alternate across longer pages. This gave the client a small set of repeatable rules that could carry into ordinary documents without needing a design tool for every update.

Two layouts give the site most of its movement. The DeRivian Way section on the About page has a short introduction pinned in the left column while four principles move through the right column. Those panels have normal content height, which keeps the section readable instead of turning each point into a full-screen slide.

The Services page uses a stronger version of the same idea. Six full-viewport panels stick in sequence on desktop, with the image and copy alternating sides. On smaller screens they return to ordinary document flow. The treatment makes a long list of support areas easier to scan while leaving the writing and images as the main content.

## Easy Read affects the layout

Easy Read began as a placeholder in the early sitemap and became a working site preference. The navigation control increases the shared body sizes, line height and letter spacing. It writes the choice to `localStorage`, applies an `easyread-on` class at the document root and restores the preference on a later visit.

The type scale already used CSS custom properties, so the mode changes a small group of values and the components reflow from them. Headings, paragraphs, form labels, accordions and navigation links continue to use the same markup.

{{snippet:derivian-easy-read}}

Larger text exposed two responsive cases that the standard layout did not have. At widths from 992 to 1199 pixels, the enlarged navigation links can outgrow the desktop bar. Easy Read switches the navigation to its drawer layout through that range. Paired fields and radio groups also stack earlier, at 900 pixels, so labels retain enough room.

The page includes a skip link, visible keyboard focus, semantic landmarks and state attributes such as `aria-expanded` and `aria-pressed`. Reveal effects are disabled when the browser reports a reduced-motion preference. I checked the core routes with a keyboard at both type scales and at the extra Easy Read breakpoints.

A formal accessibility audit would still be needed before presenting the site as WCAG certified.

## Client feedback changed the image pipeline

The client later said several images were unclear. They looked acceptable on my screen, so I asked for screenshots and the display conditions instead of recompressing them blindly. The examples showed that the earlier files lacked enough pixel headroom for the client's high-density display and zoom level.

I returned to the camera-resolution files and wrote a Sharp pipeline. The main delivery images are limited to 3840 pixels on the longest side and encoded as progressive MozJPEG at quality 88. Five images that only appear in small grid cards get a separate 1100 pixel, quality 78 output. Those dimensions leave room for dense displays without sending the original file for every card.

Commit `6accc16` records that work. The source set was about 127 MB and the recompressed live set was about 40 MB. I retained an `.original.jpg` beside each numbered image and kept an intermediate high-quality copy for the thumbnail-only files.

Keeping those masters made later recompression easy, but they currently sit under `public/images`. That means Vercel can include source files that no page requests. Moving the masters into a private asset directory or object storage is still worth doing. The delivery variants total about 40 MB. The full public directory is larger because it also contains the masters.

The useful lesson from that review was practical. Image quality needs to be checked at the client's zoom level and pixel density, especially when a source is displayed across a large frame. A screenshot with the browser and display context told me more than another pass on my laptop.

## Contact links carry their context

The site speaks to residents, families and professional referrers, and each group tends to arrive at the contact page from a different part of the site. I added twelve contact templates to keep that context.

Service links and referral links include a `?t=` value. The contact route maps it to a preselected enquiry type, situation and draft message. A link from Daily Living Support opens with that service named. A commissioner link can ask for the referral pack or service specification. General, complex-needs and transparency routes have their own drafts.

Every value remains editable. The feature saves the visitor from a blank message box and gives the business a more useful first email without creating several separate forms.

The Next route escapes submitted text before placing it in the message and sends the enquiry through Resend. The visitor's address is set as the reply address, so staff can answer from their normal mailbox. Resend handles these automated website messages. Zoho remains the business email system used by the client and receives them at the company inbox.

This distinction matters because a website mail API and an ordinary mailbox solve separate problems. The client can keep using familiar mail tools, and the form does not need credentials for a staff inbox.

## The production application

The first repository commit was a static multi-page implementation. It lasted long enough to establish the visual system and page content. The Next.js migration followed quickly, and only that application continued after the early build stage.

The production site uses Next.js 14 with the App Router and shared React components for navigation, the footer, forms and recurring content. Moving the behaviour into shared components also fixed a route-change bug from the static build, where reveal elements could stay invisible because their observer state belonged to the page the visitor had just left.

PostgreSQL holds blog posts and newsletter subscribers, with Prisma as the application layer. Blog seeds use `upsert`, which lets me rerun the seed after a content change without duplicating posts. The database is the single source for articles. If it is unavailable, the site returns an empty list instead of serving an old hard-coded copy.

Route metadata covers titles, descriptions, Open Graph images and social summaries. That work is useful on a care website because links are often passed through email or messaging apps before somebody visits the site.

The contact and newsletter handlers sit inside the Next application. Newsletter subscribers have a unique database token and an unsubscribe endpoint. A new subscription also sends a short notification to the information inbox so the client can see that the list is growing.

## Three attempts at one Vercel error

The most awkward deployment problem happened after Next had built the two API routes successfully. Vercel's post-build step saw almost identical dependency graphs for the contact and newsletter functions and tried to deduplicate them with a symlink. Both function directories already existed, so the operation failed with `EEXIST`.

My first attempt marked the routes as dynamic to change their export signatures. The second moved the HTML escaping helper into its own module so the dependency graphs would differ. Neither gave the deployment pipeline a durable distinction.

The third fix gave the functions different memory settings in `vercel.json`. Contact uses 256 MB and newsletter uses 128 MB. Those values produce different function configuration files, so Vercel leaves the directories separate. I ran `vercel build` locally and checked that both functions existed as ordinary directories before deploying again.

It is a narrow workaround for a packaging problem. The memory difference exists only to keep the deployment packages distinct.

## What remains to tidy up

The client received the website, logo, letterhead, mail setup and account guidance they asked for, and the approval group accepted the finished work. There are still a few repository items I would address in another pass.

The newsletter route creates a fresh unsubscribe token before it checks for an existing subscriber. On a repeated signup, it sends the new token in the welcome email, then leaves the stored token unchanged because the database update is empty. The unsubscribe link in that repeat email will fail. The token should be reused or rotated in the same database operation.

The contact form currently checks its required identity fields and escapes mail content. It has no rate limit, challenge or spam filter. I would add bot protection and review how much sensitive detail the free-text field should invite before directing larger referral traffic to it.

Several visible links are still placeholders. The consent line in the contact form points to `#`, as do the social sharing controls on articles and the team social icons. Those need real targets or removal.

The image masters should move out of the public deployment path. The blog also has no editor interface, so publishing currently runs through the Prisma seed. That is workable for the current stage of the business, though it would become inconvenient if the client starts publishing regularly.

The wider project also showed where I would change the working process. I would nominate one final approver at the start and label business-plan text as provisional until that person signs it off. That would reduce repeated copy changes while keeping the necessary input from the rest of the group.

## Stack

**Website** Next.js 14, React 18 and plain CSS

**Data** Prisma and PostgreSQL

**Email** Resend for website messages and Zoho for business mail

**Hosting** Vercel

**Business tools** Relume, Canva, Zoho and Revolut

**Live** [derivian.co.uk](https://www.derivian.co.uk) · **Source** [github.com/NeroSiegfried/derivian-care](https://github.com/NeroSiegfried/derivian-care)
