---
title: "Derivian — The Rebrand That Wasn't Find-and-Replace"
excerpt: "A supported living website in London. Halfway through, the whole vocabulary of the site turned out to be wrong — and fixing it changed who every sentence was about."
series: portfolio-projects
publishedAt: 2026-06-07
---

## Where it started

DeRivian Care support adults with learning disabilities, autism, mental health conditions and physical disabilities to live independently, out of an office on Sydenham Road in London.

I started from a Relume React export and asked for the usual thing: proper separation of concerns, HTML for structure, CSS for styling, JS for scripting, separate files wherever it's reasonable, semantic naming so it stays readable. The first attempt at that came back as a site that wasn't the one I'd handed over, which is a recurring theme in these logs — "refactor this" and "rebuild something like this" are different instructions and only one of them was given.

Once the structure was right it moved to Next.js 14 with the App Router, and blog content moved into Prisma Postgres.

## The rebrand

Partway through, the business's positioning changed from **domiciliary care** to **supported living**, and that is not a find-and-replace.

Domiciliary care is visiting someone in their home to perform tasks for them. Supported living is that person holding their own tenancy, in their own home, with support to run it. The difference changes the subject of every sentence on the site. It also changes the vocabulary:

- **supported living**, never domiciliary care
- **support workers**, not carers
- **residents** or **the people we support**, not clients or patients
- **support plans**, not care packages

And it changes the framing from clinical task delivery to independence, life skills, community access and empowerment. The imagery brief changed with it — residents alone in their own space, doing ordinary things, with no support worker in frame.

I wrote that down as a project rule rather than trusting myself to remember it, because it's the kind of thing that quietly reverts the moment someone writes a new paragraph in a hurry.

## Easy Read, and why it's five custom properties

Accessibility was a first-class requirement, not a pass at the end. WCAG 2.1 AA, semantic HTML, a skip link, keyboard-reachable navigation, `aria-pressed` on toggles, `aria-expanded` on the drawer, real focus styles, sufficient contrast.

The one people notice is **Easy Read mode** — a toggle in the nav that enlarges type, opens up line height and letter spacing, and persists to `localStorage` so a returning visitor doesn't have to find it twice.

The obvious way to build that is a second stylesheet, or worse a second set of components. Neither survives maintenance: every new section has to be built twice, and the first time somebody forgets, the accessible version silently falls behind the real one.

Since every size on the site was already a custom property, Easy Read just re-points them:

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

That's the feature. Six declarations. Every heading, card, button, form label and blockquote re-flows because none of them hard-coded a size.

{{snippet:derivian-easy-read}}

### The rule that isn't free

There is exactly one place where the token swap isn't enough, and it's a good reminder that "make the text bigger" is never only about text:

```css
/* Easy Read enlarges nav text, which overflows the bar at the lower end of the
   desktop range before the 992px drawer kicks in. When Easy Read is on, collapse
   the navbar into the drawer earlier (up to 1199px) so it never spills. */
@media (min-width: 992px) and (max-width: 1199px) {
  html.easyread-on .nav__toggle { display: flex; }
  html.easyread-on .nav__menu   { /* …drawer layout… */ }
}
```

Bigger nav labels stop fitting somewhere around 1100px, well above the 992px breakpoint where the drawer normally takes over. So Easy Read moves the breakpoint. Layout has a text-size dependency, and pretending otherwise produces a nav that spills for exactly the users who most need it not to.

## Contact flows that already know why you're writing

The site has two audiences that want completely different things from it. Families and prospective residents need warmth and plain language. Local-authority commissioners and referrers need to find the referral route in thirty seconds and get a pack.

A single "Contact us" form taxes both. So the contact page reads a `?t=` parameter and prefills from a template map — the enquiry type, the situation, and a first draft of the message:

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

Every CTA links to the template that matches where it sits, so the same form opens in a different state depending on whether you arrived from the professionals page or a service card. It's all editable — nobody is forced to send the draft — but it removes the blank page and routes the right information to the right inbox without an internal triage step.

## Content lives in the database, or it doesn't exist

The blog shipped with a static fallback: seven posts hard-coded so there was something to show if the database was unreachable. I took it out on purpose.

Two sources of truth for the same content is a bug generator. The fallback drifts, then someone edits the real post, and the stale copy is what renders during the outage you built it for. Now everything lives in Postgres, seeded from `prisma/seed.js` via `upsert` so re-running the seed is always safe, and if the database is down no posts are shown. An empty blog is honest; a stale one isn't.

The same discipline went to imagery. **Every image number is used exactly once across the entire site**, documented in `IMAGES.md` with the aspect ratio and a description of what belongs in that slot. No photo appears in two contexts — that repetition is the single thing that makes a small site feel like a template someone filled in. Compressed variants are generated with `sharp` and the originals are always kept.

## Two deployment problems worth keeping

**Vercel refused to build because two API routes were too similar.** The contact and newsletter routes compiled to identical dependency graphs — same Next.js runtime chunks, no external imports, nothing to tell them apart. Vercel's post-build deduplication decided they were the same function and tried to symlink one to the other, which failed with `EEXIST` because both already existed as real directories.

The fix is stupid and correct:

```json
{
  "functions": {
    "src/app/api/contact/route.js":    { "memory": 256 },
    "src/app/api/newsletter/route.js": { "memory": 128 }
  }
}
```

Different memory settings produce different `.vc-config.json` files inside each `.func` directory, so the directories aren't identical and deduplication never fires. Verified with a local `vercel build` before pushing.

**The newsletter needed somewhere to go.** Subscribers are stored with a working unsubscribe endpoint, and each new subscription notifies the info inbox — because a list nobody can see is a list nobody acts on. Open Graph and Twitter Card metadata went in site-wide at the same time, since referral links get shared in emails and WhatsApp far more than they get typed.

## Stack

Next.js 14 (App Router), React 18, Prisma + Postgres, Vercel. Plain CSS — no framework — with the type scale, spacing and colour on custom properties, which is the only reason Easy Read is a six-line feature instead of a second website.

**Live:** [derivian.co.uk](https://www.derivian.co.uk) · **Source:** [github.com/NeroSiegfried/derivian-care](https://github.com/NeroSiegfried/derivian-care)
