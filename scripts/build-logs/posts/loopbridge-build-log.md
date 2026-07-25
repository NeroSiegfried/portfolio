---
title: "LoopBridge, carrying a Figma system into a working platform"
excerpt: "A close Figma implementation that grew through a component layer, a React and Express migration, editorial workflows, paid learning, adaptive video, and a cost-conscious AWS deployment."
series: portfolio-projects
publishedAt: 2026-06-11
---

LoopBridge began as a frontend build for a crypto learning community. The client supplied a detailed [Figma file](https://www.figma.com/design/QPfTot0bu14TycG5db2Mpc/Loop-Bridge--Copy-?node-id=1-2&t=QScVsOcBhWI7lbzC-1) for the public site. The work later grew into accounts, editorial tools, courses, payment flows, learner progress, adaptive video, and an AWS deployment.

| Project | Detail |
| --- | --- |
| Client | A crypto education and community platform |
| Starting point | Desktop and mobile Figma designs for the public site |
| Product areas | Academy, articles, glossary, exchange, community, courses |
| Account areas | Learner, author, administrator, root-controlled operations |
| Current delivery | React, Express, EC2, Docker Compose, SQLite, S3, MediaConvert |

## What the Figma file settled

The Figma file covered the home page, Academy, Community, Exchange, Blog, FAQs, About, Glossary, Courses, article views, learning tracks, free and paid course pages, legal pages, a mobile menu, and several mobile-specific compositions.

That established the public structure and visual voice. It did not define the product behind it.

Accounts still needed an authentication model. Course progress needed somewhere to live. Authors needed editors. Administrators needed moderation and user controls. Paid courses needed checkout and access rules. Video lessons needed an upload and playback pipeline. Those parts had to be designed without turning the site into a second visual system.

I began with plain HTML, CSS, and JavaScript. The priority at that point was fidelity. Building the public pages directly made it easier to compare the browser against the Figma frames and correct the design before application structure became another variable.

The first repository history follows the design page by page. Home, Academy, Community, Exchange, About, Blog, FAQs, legal pages, articles, courses, and learning tracks all arrived before the platform architecture settled.

## Translating the design language

LoopBridge uses Cabinet Grotesk for display and editorial headings, then Schibsted Grotesk for body copy and controls. Dark navy `#013352` carries the strongest sections. Green `#30C070` is the main action colour. Cyan `#00C1DF` appears as a secondary accent. Pale mint and neutral surfaces keep the dense learning pages from feeling heavy.

I moved those decisions into the shared CSS tokens once they repeated often enough. The public pages still retain some page-specific styles. Several old class names meant different things in different page files, so flattening everything into one global component sheet would have changed the design during the React migration.

I preserved those choices through the React migration, which changed the implementation without reopening the visual design.

### Small details that exposed the real rules

Cabinet Grotesk was the first nuisance. A correct `@font-face` declaration still rendered a fallback because its URL was resolved from the stylesheet location. Once the font files and relative path agreed, headings began matching their frames.

The pale hero gradient needed to sit at partial opacity without fading its text. I moved it to a separate layer instead of lowering opacity on the section.

A Figma vector filled one mobile section with coloured circles. The desktop artwork did not fit a taller stack of content, so I sampled its colours and rebuilt the field with a bounded set of DOM elements. Each circle receives a size, position, speed, and fade. Finished circles are reused, which keeps the animation from growing the DOM indefinitely.

The currency ticker had a different issue. A percentage animation always takes the same time, so a longer list appears to move faster. I measured the repeated track and derived duration from physical distance. Two matching tracks share the line, with the second starting where the first ends.

I also drew the four-point star bullets as SVG because the available icon sets had sharper tips and straight sides. The Figma mark has blunt points and concave edges. Using `currentColor` lets it behave like a normal inline icon.

### Mobile could be a separate composition

The responsive work did not assume that every desktop section should collapse into one column.

The glossary is the clearest example. Its desktop design has a sticky index and definition panel. The mobile Figma frame uses a dark navy hero, a 9 by 9 by 8 letter grid, search inside the filter card, and a different definitions surface.

I treated the mobile frame as the source for that viewport. Similar decisions appear across the navigation, exchange steps, course lists, and community pages. This made the result more faithful than scaling desktop values down until they happened to fit.

## The navbar that becomes its menu

The navbar had to preserve the floating white pill from the Figma file and still hold a much larger authenticated menu on a phone.

Desktop uses flex layout. The main links remain visually centred while the logo, Join action, message button, and signed-in controls take the space they need. Active links use a green underline that grows from the centre. A signed-in user can also see the message badge and avatar menu without changing the pill’s basic shape.

Mobile is where the interaction becomes interesting.

The panel begins at `top: 100%`, extends one pixel beyond each side, and uses a width of `calc(100% + 2px)`. Its border meets the one-pixel border of the parent exactly. The panel has rounded lower corners and square upper corners.

Opening happens in two stages. The parent’s lower corners flatten over 150 milliseconds. The menu then expands through its height and padding transition. Closing retracts the panel over 350 milliseconds before the parent restores its lower radii.

The links become full-width rows inside the same bordered mass. Authenticated actions such as Dashboard, New Article, New Course, My Learning, Profile, Messages, and Logout use that same space.

{{snippet:loopbridge-navbar wide}}

### Pushing the first section by the measured height

The Figma navbar is absolutely positioned over the hero. An absolutely positioned panel cannot push normal document flow by itself.

The component finds the section immediately after the navbar, reads its computed top padding, measures the menu’s `scrollHeight` with the added spacing and borders, then writes the open height into that section’s padding. The hero background remains continuous while its content moves down.

Using body margin created a white gap in an early attempt. Measuring from an already adjusted section also caused repeated growth. Reading the original padding and applying one measured offset fixed both problems.

The code is intentionally tied to the current page structure through `navbar.nextElementSibling`. It works across the existing routes, although it is a brittle seam. If the layout wrapper changes, the relationship needs to be made explicit through a ref or shared layout context.

When the menu opens, the pill appears to stretch downward into the page. The exact border join, staggered corner timing, and measured hero offset preserve that single shape even when a signed-in account adds a long list of actions.

## The architecture changed in stages

LoopBridge did not jump directly from static pages to its current deployment.

The first application step was a vanilla component loader. Pages declared shared sections with `data-component`, while isolated HTML, CSS, and JavaScript supplied the navigation, footer, and repeated blocks. JSON and `localStorage` acted as a mock content and account layer.

That removed the worst duplication while preserving the direct page structure. It also gave the client and other contributors a working product model before a real backend existed.

Accounts, progress, editors, moderation, and paid access eventually exceeded that arrangement. I moved the client to React, Vite, and React Router, then added an Express API with a persistent database.

{{snippet:loopbridge-progress wide}}

The figure separates the four actual states and labels future scale options as future work. The previous version incorrectly presented ECS, RDS, and an application load balancer as the live architecture.

## Designing screens that were absent from Figma

The public Figma system was detailed. The author dashboard, administration tools, My Learning, article editor, course editor, payment pages, profile, messages, and most authentication states were not supplied.

These new screens went through several corrections because generic dashboard patterns looked unrelated to the public site. Bright blue and yellow controls, new category pills, and familiar admin templates all made the product feel as though it changed vendors after sign-in.

I reused the existing type, colour, spacing, field, card, and button rules. Cabinet Grotesk still carries the main headings. Schibsted still carries form text and dense controls. Navy establishes hierarchy, green marks action, and pale surfaces group longer editing work.

The same rule applied to mobile. Account links remain inside the expanding LoopBridge menu, so there is no second app-only drawer. My Learning uses the course-card and progress language already visible in the Academy. Editors use the existing field and action styles even when their layout is much denser.

Course payment and result pages use the price, card, and action language already established on the course pages. The hosted provider sits between recognisable LoopBridge screens.

This was the main design task after the Figma translation. New product functionality had to look as though it had been part of the original system.

## A layered Express backend

The server has a deliberate request path.

```text
request
  → environment and middleware
  → thin Express route
  → domain service
  → repository
  → database adapter
```

Routes handle HTTP concerns and pass work to services. Services hold business rules without depending on request or response objects. Repositories own data access. Authentication middleware adds the current identity and applies route guards.

`server/index.js` builds the application separately from `listen()`. That supports integration tests and kept an earlier Lambda experiment possible without starting a second server.

The database module exposes one asynchronous `query` and `run` interface over both SQLite and PostgreSQL. `better-sqlite3` is synchronous internally, but the adapter wraps it in promises. Services and repositories therefore do not change shape when the driver changes.

The current SQLite connection enables foreign keys, WAL mode, a five-second busy timeout, and `synchronous=NORMAL`.

The schemas cover users, sessions, one-time codes, articles, courses, lessons, quizzes, enrolments, progress, payments, uploads, transcode jobs, analytics, subscribers, messages, promotion requests, and protected profile changes.

There is an honest migration seam here. SQLite and PostgreSQL still have separate schema definitions, and the SQL normaliser used between them is fragile. The adapter makes a PostgreSQL move possible, but the schema and SQL still require a planned migration.

## Authentication and role boundaries

Password accounts use bcrypt. Google sign-in verifies an ID token and links or creates the local account. Browser sessions are random identifiers stored in the database with a seven-day expiry and sent through HTTP-only SameSite cookies.

One-time codes are six digits and expire after ten minutes. Attempt and resend limits are stored with the challenge. Delivery can use email, WhatsApp, SMS, or a selected combination. WhatsApp can fall back to SMS when its delivery path fails.

Identity changes such as a new email or phone number require another code confirmation.

LoopBridge has three roles.

- A `user` learns, enrols, and tracks progress
- An `author` can create and manage their own editorial work
- An `admin` moderates content and manages users within the administration rules

An independent `is_root` flag controls the most sensitive operations. It is not a fourth role.

Regular users see My Learning. It summarises enrolments, in-progress and completed courses, and the next available lesson. Authors and administrators see the production dashboard and editors.

Article ownership and moderation are more nuanced than a single role check. Author submissions begin unapproved. An administrator can review, approve, hide, soft-delete, and restore content within the relevant ownership rules. A root user can permanently delete articles and directly change roles.

A non-root administrator submits a promotion request. Root approves or rejects it, and the requester receives an in-app message. Pending article submissions can alert administrators. General author approval notifications have not been implemented yet.

A recent backend audit also found an open authorization item in one course-update path. Hide and delete perform the intended check, while the update path still needs correction. That remains part of the production-readiness work.

## Article and course production

The article editor is block-based. An author can add headings, paragraphs, lists, quotes, images, video, audio, and embeds. Cover uploads, live preview, and deterministic categories are handled in the same workspace.

The course editor models a deeper hierarchy. A course contains topics, subsections, and lessons. Lessons can contain reading blocks, video, exercises, timed quiz points, and an end quiz. Each option can carry its own explanation, so a result can explain an answer as well as score it.

Upload progress is visible and saving is locked while required media is still moving. Transcode jobs are polled so the editor can show when a video becomes available.

The production dashboard scopes authors to their own work. Administrators can see hidden, deleted, pending, and approved material according to their permission level.

My Learning stays separate from that dashboard. It gives learners their course progress and continuation links in a dedicated account area.

## Payment and lesson access

The payment service separates checkout providers from enrolment.

The server loads the course and authoritative price, creates a pending payment, asks the configured provider for a hosted checkout, then waits for verification or a webhook. A successful result updates the payment and enrols the user.

Restricted lesson endpoints check enrolment on the server. Editing a client-side route does not make paid lesson data available.

Adapters exist for Paystack, Flutterwave, and NOWPayments. The provider boundary is useful because course access does not depend on one checkout API.

Some provider paths still need production work. The backend audit lists provider-specific signature handling, returned-amount verification, canonical payload handling, and outbound timeouts. Those checks need live sandbox payloads and gateway documentation before paid access is ready.

## Analytics and recommendations

The browser records page views and exits, time and scroll depth, lesson activity, and quiz events. It sends events in small batches and uses Beacon when the page closes.

Administrator API routes return summary data, raw events, and CSV exports. There is no finished analytics dashboard in the client, so the API is the current management surface.

Course recommendations use a local score. The service considers previous categories, the next useful level, popularity, and freshness. The result is inspectable, deterministic application logic.

## Adaptive video and source orientation

Video produced the longest technical run in the repository.

An upload route first probes the temporary source while it still exists locally. It records width, height, and rotation, then starts the cloud or local transcode after the storage driver moves the source.

Production uses AWS MediaConvert when its role is configured. The job creates 1080, 720, 480, and 360 renditions with H.264, QVBR, AAC, six-second HLS segments, and three-second thumbnail captures.

Local development can fall back to `ffprobe` and `ffmpeg`. That path reads rotation, preserves aspect ratio while scaling, writes at least two renditions and a master manifest, then uploads or writes the output through the selected storage driver.

The player uses `hls.js` for adaptive selection and provides manual quality, playback speed, custom controls, error recovery, full-screen handling, and timed quiz overlays.

### Why portrait video kept becoming landscape

A portrait recording can be placed inside a landscape transcode frame. After that conversion, the HLS manifest and browser metadata correctly report a landscape file. They no longer describe the source recording.

I first tried reading the player’s loaded metadata, resize events, and the manifest. All three were too late.

The durable fix moved the orientation probe before upload and transcode. Source width, height, and rotation are stored with the upload. The player receives a tri-state hint.

- `true` means the source is portrait
- `false` means the source is landscape
- `null` means the source orientation is unknown

Runtime detection only fills the unknown state. A later metadata event cannot overwrite a known source value.

MediaConvert outputs and thumbnails then fit inside the source ratio. The embedded lesson frame remains 16 by 9 because that was a client requirement. Full-screen styling uses the source orientation.

This took changes across upload probing, storage timing, MediaConvert configuration, the local ffmpeg path, thumbnail generation, HLS metadata, and player layout. The sequence of fixes is more useful than the final boolean because each earlier layer supplied accurate information about the wrong stage of the media.

## AWS plans that were considered

The deployment documents record several legitimate architectures.

The first proposal was serverless. It used S3 and CloudFront for the client, API Gateway with Lambda for Express, DynamoDB for data, and Lambda around media work. Low idle traffic and bursty use made the model attractive at that stage.

A later proposal moved long-running Express work behind an application load balancer on ECS Fargate with RDS PostgreSQL. It explicitly raised cold starts, database connections, and long uploads as concerns with Lambda.

Part of the RDS and EC2 route was attempted manually. The deployment guide grew into a long set of subnet, database import, and container steps. I did not want the client to inherit a process that only worked when I followed a private checklist carefully.

The larger managed design was also estimated at roughly four hundred dollars per month before real traffic justified it. The client needed a maintainable long-term path and a sensible starting bill.

The final criteria were cost, maintainability, security, simplicity, recoverability, and a clear upgrade route. I chose a smaller deployment and automated it.

The resources were then moved into the client-owned LoopBridge AWS account. Account-specific values are isolated so ownership and billing do not remain attached to a developer sandbox.

## What is deployed

One EC2 instance runs two Docker Compose services.

- Nginx 1.27 Alpine listens on ports 80 and 443
- The application container listens internally on port 3000

Nginx terminates TLS, redirects HTTP, rate-limits the API, forwards proxy headers, and adds long-lived browser cache headers for hashed assets. It proxies both the frontend and API to the application container. No proxy-cache zone is configured, so it performs no response caching.

The application image builds the Vite client and Express server together. It also includes ffmpeg and Litestream.

SQLite lives at `/data/loopbridge.db` on persistent EBS storage. Litestream restores the database before Express starts when a replica is available. It then copies WAL changes to an S3 prefix every second, creates a snapshot every six hours, and retains seven days.

The media bucket stores uploads and transcode output separately from database replicas. Versioning, server-side AES256 encryption, and lifecycle rules are managed in Terraform. Public read is scoped to the required media prefixes and does not include database backups.

GitHub Actions authenticates to AWS through OIDC. It builds the image, pushes it to ECR, finds the tagged instance, and invokes Systems Manager Run Command. There are no long-lived deployment keys and no need to open SSH for the release process.

The SSM payload writes the production environment, Compose file, and Nginx configuration, then runs health checks before completing the deployment.

Terraform currently provisions the VPC, subnet, internet gateway, EC2 and elastic IP, ECR, S3, IAM and OIDC roles, and the MediaConvert role. The RDS, CloudFront, and Lambda files only document scale triggers. They do not create live resources.

The current migration triggers are practical.

- Move data to RDS when measured WAL contention or more than one write-capable application replica requires it
- Add CloudFront when global media traffic makes it worthwhile
- Add an asynchronous callback or worker system when transcode volume requires stronger retry and idempotency control

There is no job queue in the current system. Polling and provider status handle the existing workload.

## What I would change

I would separate the React migration from the first real API rollout. Landing both together created a period where routing and data failures had two plausible causes.

I would formalise the relationship between the mobile navbar and the first page section. The measured push-down works, but its next-sibling assumption should become an explicit layout contract.

I would also consolidate the SQLite and PostgreSQL schemas before a database migration becomes urgent. The async adapter is a useful boundary, while the schema and SQL differences still need deliberate work.

The initial hand-built phase was worth keeping. It forced me to understand the Figma closely. The component loader then exposed the repeated pieces. React and Express arrived when product state required them. The AWS deployment followed the same pattern by choosing the smallest arrangement that met the current requirements and leaving measured paths for growth.

## Stack and links

**Client** React 19, Vite, React Router, `hls.js`

**Server** Express, SQLite, PostgreSQL adapter, bcrypt, Google authentication, OTP delivery

**Product** Article and course editors, moderation, learner progress, payments, analytics API, recommendations

**Media** S3, AWS MediaConvert, local ffmpeg

**Production** Docker Compose, Nginx, EC2, EBS, Litestream, S3, Terraform, ECR, Systems Manager

[Live site](https://www.loopbridge.network) · [Source code](https://github.com/NeroSiegfried/LoopBridge)
