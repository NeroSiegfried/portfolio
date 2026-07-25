---
title: "LoopBridge — From a Figma File to a Media Pipeline"
excerpt: "A crypto community's marketing site that kept being asked to do more, until it wasn't a site any more. Three architectures, and what each one actually cost."
series: portfolio-projects
publishedAt: 2026-07-01
---

## Client

We have to start by describing our client. He is the CEO of a bustling crypto community who decided that he needed a website to take it to the next level.

## Project description

I was provided with a Figma file for the frontend design and was to recreate it.

The backend requirements were a bit more unclear: the main feature of the site was to create a way for users to trade easily on their phones from WhatsApp (perhaps with a bot), the website was also to double as a blog and as an eLearning platform.

## Approach

I wasn't sure I was going to work on the backend just yet, so I didn't bother with creating any routes. I also just used plain HTML, CSS and JavaScript to get started. This had the added advantage of being easy to read for any developers that were going to hop on the project later.

That decision — no framework, no build step — is worth defending, because it was right for about four months and then completely wrong. It's the clearest example I have of an architecture being correct *for a phase* rather than correct in general.

{{snippet:loopbridge-progress wide}}

## Move one: the nav that had to be edited eleven times

Static pages are wonderful until the site has eleven of them. Every page carried its own copy of the header, the nav and the footer. Adding one link meant eleven edits, and the eleventh was always the one that got missed.

The thing that finally forced the issue wasn't the duplication though — it was **state**. Accounts, a saved-articles feed and a course catalogue all need something that survives navigation, and "survives navigation" is the one thing a set of separate HTML documents cannot give you without a server round trip per click.

So: React 19 + Vite + `react-router` on the front, Express behind it, bcrypt and Google OAuth for accounts, SQLite for data. The trade was explicit — a build step and a process to keep alive, in exchange for one nav.

## Move two: video broke the model

The eLearning half of the brief is where it stopped being a website.

A course lesson is a video. Videos get uploaded by instructors, in whatever format their phone produced. That has to be transcoded to something streamable, stored somewhere that isn't the application server, delivered adaptively so a viewer on Nigerian mobile data gets a bitrate that actually plays, and — the part I underestimated — **played back at the right orientation**.

None of that belongs in a request handler. So media moved out:

- uploads go to **S3**, presigned so the file never transits the API;
- **AWS MediaConvert** produces HLS renditions, with a callback Lambda telling the app when a job finishes;
- **CloudFront** fronts both the static client and the media;
- the app itself moved into a container on **ECS Fargate** behind an ALB, with **RDS Postgres** replacing SQLite and secrets in **Secrets Manager**.

### The orientation bug, in four commits

This one earned its place in the log because every fix was reasonable and the first three were wrong.

MediaConvert **encodes portrait video into landscape frames** — it doesn't preserve the source aspect ratio, it letterboxes. So by the time the HLS manifest reaches the browser, the stream genuinely *is* landscape, and every piece of runtime information the player can see agrees that it is.

1. **Detect at playback via the `resize` event.** Fails — the resize event reports the encoded (landscape) dimensions.
2. **Read it from the HLS metadata on `MANIFEST_PARSED`.** Fails for the same reason, one layer up.
3. **Probe at upload time and store it.** Right idea: `ffprobe` the file before the storage driver deletes the temp copy, account for rotation metadata, and persist `video_width` / `video_height` on the upload row. The player takes an `isPortraitHint` prop.
4. **Make the hint authoritative.** Still broken in the sandbox, because `MANIFEST_PARSED` and `loadedmetadata` were still firing *after* the hint was applied and overwriting it with the landscape truth. The final change makes the hint tri-state — `true` / `false` / `null` — so "we know it's portrait" is distinguishable from "we haven't been told", and only `null` falls back to runtime detection.

The general shape: **when a transform destroys information, you cannot recover it downstream.** The only place the source orientation exists is before transcoding, so that's the only place it can be captured. Three of the four commits were spent looking for it somewhere cheaper.

## What it looks like now

Beyond the courses: a My Learning progress dashboard, threaded in-app messaging, profile updates gated behind OTP, an articles feed with categorisation, a glossary, analytics and a recommendation service, SSO, and payments. The Express app is organised as thin routes over a `services/` layer over a `repositories/` layer, which is what made the SQLite → Postgres swap survivable.

Infrastructure is Terraform — RDS with Multi-AZ, 35-day automated backups, KMS encryption, Performance Insights and CloudWatch alarms; CloudFront with an ACM certificate. Deployment took several attempts to get right, including one memorable class of bug where a deploy would succeed and *wipe the HTTPS nginx config*, so the site came back on port 80 and the health check passed while the certificate was gone.

## What I'd do differently

Nothing about move one. Plain HTML for the first phase got a real site in front of the client fast, and the contribution story was true — other developers did open files and change things.

What I'd change is the **shape of the second move**. The SPA migration and the API arrived together in one push, which meant a period where two things were unproven at once and every bug had two possible homes. Doing the API first, against the static pages, would have kept one variable fixed at a time.

I'd also have reached for a job queue at move three rather than callbacks-plus-polling. Most of the transcode-related commits in this repo are about state reconciliation between "MediaConvert says done", "the callback arrived", and "the row says processing" — which is a queue's problem, solved.

## Stack

**Client:** React 19, Vite, `react-router` v7, `hls.js`.
**Server:** Express, Postgres (`pg`), bcrypt, Google OAuth, Twilio, Nodemailer, Multer, `fluent-ffmpeg`, AWS SDK (S3, MediaConvert).
**Infrastructure:** ECS Fargate, ALB, RDS Postgres, S3, CloudFront, Route 53 + ACM, Secrets Manager, CloudWatch, Lambda for transcode callbacks, Terraform for all of it.

**Live:** [loopbridge.network](https://www.loopbridge.network) · **Source:** [github.com/NeroSiegfried/LoopBridge](https://github.com/NeroSiegfried/LoopBridge)
