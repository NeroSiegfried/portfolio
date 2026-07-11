# "What I do" — service images

The **What I do** section (`components/v2/services.tsx`, driven by `services` in
[`lib/portfolio-data.ts`](lib/portfolio-data.ts)) shows a wide image on the right
of each row. All four are now wired in (`public/services/*.jpg`).

## They're procedurally generated (on-brand with the hero)

There's no text-to-image API in this repo, so the four images are **code‑generated**
to read as one set with the hero (`public/hero/hero-2.jpg`): a dark, near‑monochrome
editorial composition with a single burnt‑orange (`#FB460D`) glow as the light
source, seen through **fluted/reeded glass** (vertical warp + smear + rib sheen),
finished with film grain and a vignette. Each carries a faint motif smeared into
atmosphere by the glass.

| # | Service | File | Motif |
|---|---------|------|-------|
| 01 | **Full-stack web** | `services/fullstack.jpg` | dashboard / browser window + warm glow |
| 02 | **APIs & backends** | `services/apis.jpg` | JSON lines + Postgres schema box |
| 03 | **Systems & fundamentals** | `services/systems.jpg` | circuit traces + chip, one live orange node |
| 04 | **AI-assisted delivery** | `services/ai.jpg` | code + a glowing "AI suggestion" beam |

**Regenerate / tweak:** [`scripts/generate-service-images.mjs`](scripts/generate-service-images.mjs)
(Canvas rendered via headless Chrome → `sharp` → JPEG). Per‑image identity (glow
placement/temperature, motif, rib feel) lives in the `IMAGES` array at the top;
the shared grade/streaks/grain/vignette keep them a cohesive series.

```
node scripts/generate-service-images.mjs            # all four
ONLY=apis node scripts/generate-service-images.mjs  # just one
```

Output: wide landscape 2000×1250 (~16:10). Displayed with `object-cover` and a
subtle hover zoom; on desktop the slot stretches to the row height (≈19rem) so
the crop drifts to ~1.6–1.9:1 — the compositions keep their focal glow centred so
that always reads. Tuned to sit well on **both** the light (warm paper) and dark
(near‑black) themes. If you clear `public/services/*.jpg`, an on‑brand placeholder
(`.v2-service-ph`) renders `imageAlt` as the caption again.

> **Swapping in real photos/AI later:** just drop a file at the same path (e.g.
> `public/services/apis.jpg`) — no code change needed. Prompts + grade recipe for
> Midjourney/DALL·E are in the chat history if you want literal photographic
> versions. Clear `.next/cache/images` after replacing a file so the dev server
> stops serving the old optimised copy.

> The captured project screenshots in `public/projects/shots/{id}/` are also
> hero‑quality and can be reused as article covers.
