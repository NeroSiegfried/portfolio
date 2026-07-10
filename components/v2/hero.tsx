import { ArrowDown } from "lucide-react"
import { Eyebrow } from "@/components/v2/primitives"
import { RevealLines } from "@/components/v2/reveal"
import { HeroBackdrop } from "@/components/v2/hero-backdrop"

// Full-bleed hero slideshow — cross-fades every 5s. To test more options, drop a
// file into /public/hero and add its path here; the rotation extends automatically.
const HERO_IMAGES = ["/hero/hero-1.jpg", "/hero/hero-2.jpg"]

/**
 * Full-bleed sticky hero (portfolie): a minimal heading + subheading over a
 * full-bleed image slideshow; the framed content below scrolls up and slides
 * over it.
 */
export function Hero() {
  return (
    <section id="top" className="sticky top-0 h-screen w-full overflow-hidden bg-secondary">
      <HeroBackdrop images={HERO_IMAGES} />

      {/* Legibility gradient for the heading. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />

      {/* Minimal heading + subheading, bottom-left. */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-12 sm:px-6 md:px-10 md:pb-16">
        <Eyebrow className="mb-4 block text-white/80">Software Engineer &middot; Full-Stack Developer &middot; London</Eyebrow>
        <h1 className="font-display font-semibold tracking-[-0.035em] text-white text-[clamp(2.75rem,9vw,8rem)] leading-[0.88]">
          <RevealLines lines={["Victor Nabasu"]} mount />
        </h1>
      </div>

      <div className="pointer-events-none absolute bottom-8 right-6 animate-bounce text-white/70">
        <ArrowDown className="h-5 w-5" />
      </div>
    </section>
  )
}
