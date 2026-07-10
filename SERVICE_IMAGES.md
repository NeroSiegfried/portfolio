# "What I do" — service image briefs

The **What I do** section (`components/v2/services.tsx`, driven by `services` in
[`lib/portfolio-data.ts`](lib/portfolio-data.ts)) shows a wide image on the right
of each row. Until a real image is supplied, an on-brand placeholder renders
("◆ Reference image"). To drop in a real image, set `image: "/services/<file>"`
on the matching service (put the file in `public/services/`); the `imageAlt`
already holds the brief below.

| # | Service | Suggested image |
|---|---------|-----------------|
| 01 | **Full-stack web** | A polished web product on screen — a clean Next.js dashboard or landing page rendered on a MacBook, warm editorial lighting. |
| 02 | **APIs & backends** | A dark developer scene — a terminal / API client showing structured JSON beside a Postgres schema diagram; typed data flowing. |
| 03 | **Systems & fundamentals** | A low-level close-up — a terminal compiling C / a gdb session, or a macro shot of a circuit board; the machine underneath. |
| 04 | **AI-assisted delivery** | A code editor with an AI assistant panel (Cursor / Copilot) suggesting code inline, a subtle accent glow — human-directed AI. |

**Format:** wide landscape (≈16:10), high-res. Dark, editorial images sit best
against both the light (warm paper) and dark (near-black) themes.

> The captured project screenshots in `public/projects/shots/{id}/` are also
> hero-quality and can be reused as article cover images or here.
