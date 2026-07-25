---
title: "LoopBridge — Learning the Front End the Hard Way, Then Outgrowing It"
excerpt: "A Figma file, a crypto community, and no framework. I hand-built the whole thing while learning CSS properly, and then video lessons turned it into something that needed real infrastructure."
series: portfolio-projects
publishedAt: 2026-04-10
---

## Client

We have to start by describing our client. He is the CEO of a bustling crypto community who decided that he needed a website to take it to the next level.

## Project description

I was provided with a Figma file for the frontend design and was to recreate it.

The backend requirements were a bit more unclear: the main feature of the site was to create a way for users to trade easily on their phones from WhatsApp (perhaps with a bot), the website was also to double as a blog and as an eLearning platform.

## Approach

I wasn't sure I was going to work on the backend just yet, so I didn't bother with creating any routes. I also just used plain HTML, CSS and JavaScript to get started. This had the added advantage of being easy to read for any developers that were going to hop on the project later.

It also meant I had to actually learn CSS, rather than reach for a framework that would hide it from me. Most of this build log is that.

## Hand-building a Figma file

The design had things in it that don't come out of a component library, so I built them one at a time and learned the platform on the way.

**Fonts that refuse to load.** Cabinet Grotesk wouldn't apply. Schibsted Grotesk as a fallback worked immediately, so the problem was that font specifically. I'd copied the whole `cabinet-grotesk.css` into my stylesheet and it still didn't work, while it worked fine on the site I'd taken it from — which is the kind of thing that's only obvious once you know that a `@font-face` `src` is resolved relative to the stylesheet it's declared in, not the page.

**Backgrounds at 40% without dimming the content.** The first section is a horizontal gradient from `#e1fbff` at 18% to `#d6f4e4` at 86%, at 40% opacity — but only the background. Putting `opacity` on the element takes the text with it. The background has to be its own layer.

**A field of circles.** The Figma file had a decorative vector of scattered circles at the bottom-left of the join section. I didn't want to ship a vector, because I already knew what it had to do on mobile: stretch from under the heading all the way down behind the boxes. So it became CSS and a little JavaScript — about forty circles between 10px and 25px, colours sampled from a 33-colour range out of the design rather than hard-coded, each one drifting, fading out after a while, and a new one fading in at a random size, colour and speed. Cheap enough not to matter.

**A four-pointed star.** I wanted star bullets. Font Awesome's star is a five-pointed star; the icon fonts I tried weren't right either. What I actually wanted was a four-pointed star with **concave sides and blunt points**, behaving like text so its colour could be changed. That's a custom SVG, sized and coloured from CSS.

**An infinite marquee.** The currency ticker had to scroll right to left and loop seamlessly, at a **constant speed regardless of how much content is in it** — not "traverse the whole thing in 15 seconds", which is what you get if you animate a percentage. It also had to start in its resting position rather than off-screen, and the duplicated track has to be on the same line or the seam is visible.

**An SVG used as a mask.** The newsletter banner in Figma was a vector grouped with a same-sized white layer — a mask. Working out that the mask was inverted relative to what I first assumed (the covered areas take the dark blue, the uncovered areas lighten) took several rounds, largely because changing the mask's colour and changing the mask's behaviour look identical if you only read the code.

## The layout problems worth keeping

These are the ones I'd hit again in any project.

**A navbar with the links dead centre.** The logo sat in one flex child and the links plus the CTA in another, which means two children — and you cannot centre the middle of three things by balancing two. The logo must not take equal space (it should shrink as far as it can), but the links must be *dead centre* of the bar, not centred in the space left over. That's three flex children with the outer two given equal flex-basis, not two children with `space-between`.

**Cards that fill their row without distorting.** I wanted a variable number of cards per row — five at 1200px, then three, then two, then one — with **equal widths, a constant gap, wrapping to a new line when they no longer fit, and the last partial row left-aligned with the row above it**, and the whole grid still optically centred. Flexbox gets you most of that and then fights you on the last row; `space-between` gives you spacing that changes with the viewport, which is exactly what I didn't want. It's a grid with a minimum track size, plus a flex fallback once everything fits on one line.

**`position: relative` hiding the navbar.** Giving the hero `position: relative` put it above a fixed navbar that had no z-index of its own. Stacking contexts don't care that one element is fixed and the other isn't; once both are positioned, source order decides.

**Everything in rem.** A pass converting every pixel measurement to its rem equivalent, so the whole site scales with the root size — done before the responsive work, not after, because doing it after means redoing the responsive work.

## Then it became a platform

Accounts, a saved-article feed, a course catalogue and a glossary all arrived. Eleven separate HTML documents each carrying their own copy of the header, nav and footer stopped being a contribution feature and became a bug source — one link change meant eleven edits, and the eleventh was always the one that got missed. More decisively, none of those features work without state that survives navigation.

So: React 19 + Vite + `react-router` on the front, Express behind it, bcrypt and Google OAuth for accounts, SQLite for data.

{{snippet:loopbridge-progress wide}}

## Video broke it again

A course lesson is a video, uploaded by an instructor in whatever format their phone produced. It has to be transcoded, stored somewhere that isn't the app server, streamed adaptively so a viewer on Nigerian mobile data gets a bitrate that plays, and — the part I underestimated — **played back the right way up**.

Media moved out: presigned uploads straight to S3, AWS MediaConvert producing HLS renditions with a Lambda callback, CloudFront in front of both the client and the media, the app itself in a container on ECS Fargate behind an ALB, RDS Postgres replacing SQLite, secrets in Secrets Manager, all of it in Terraform.

### The orientation bug, in four commits

Every fix here was reasonable and the first three were wrong.

MediaConvert **encodes portrait video into landscape frames**. It doesn't preserve the source aspect ratio, it letterboxes. So by the time the HLS manifest reaches the browser, the stream genuinely is landscape, and every piece of runtime information the player can see agrees.

1. **Detect on the video's `resize` event.** Reports the encoded (landscape) dimensions.
2. **Read it from the HLS metadata on `MANIFEST_PARSED`.** Same answer, one layer up.
3. **Probe at upload time and store it.** `ffprobe` the temp file before the storage driver deletes it, account for rotation metadata, persist `video_width` / `video_height` on the upload row, pass the player an `isPortraitHint`.
4. **Make the hint authoritative.** Still wrong in the sandbox, because `MANIFEST_PARSED` and `loadedmetadata` were still firing after the hint was applied and overwriting it. The hint became tri-state — `true` / `false` / `null` — so "we know it's portrait" is distinguishable from "we haven't been told", and only `null` falls back to runtime detection.

When a transform destroys information, you can't recover it downstream. The source orientation only exists before transcoding, so that's the only place it can be captured. Three of the four commits were spent looking somewhere cheaper.

There was also a deploy that would succeed and quietly wipe the HTTPS nginx config, so the site came back on port 80 with the health check passing and the certificate gone.

## What I'd do differently

Nothing about the first phase. Hand-writing it taught me the CSS I use on every project since, and the contribution story was real — other developers did open files and change them.

What I'd change is the shape of the second move. The SPA migration and the API landed together, so for a while two things were unproven at once and every bug had two possible homes. Building the API first, against the static pages, would have kept one variable fixed at a time.

I'd also reach for a job queue at the third phase instead of callbacks plus polling. Most of the transcode commits in this repo are reconciling "MediaConvert says done", "the callback arrived" and "the row still says processing", which is a queue's problem, already solved.

## Stack

**Client:** React 19, Vite, `react-router` v7, `hls.js`.
**Server:** Express, Postgres, bcrypt, Google OAuth, Twilio, Nodemailer, Multer, `fluent-ffmpeg`, AWS SDK (S3, MediaConvert).
**Infrastructure:** ECS Fargate, ALB, RDS Postgres, S3, CloudFront, Route 53 + ACM, Secrets Manager, CloudWatch, Lambda for transcode callbacks, Terraform.

**Live:** [loopbridge.network](https://www.loopbridge.network) · **Source:** [github.com/NeroSiegfried/LoopBridge](https://github.com/NeroSiegfried/LoopBridge)
